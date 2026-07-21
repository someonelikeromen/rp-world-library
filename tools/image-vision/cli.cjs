#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) { out[key] = next; i++; }
        else out[key] = true;
      }
    } else out._.push(a);
  }
  return out;
}
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p, fallback = null) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8'); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}
function requestJson(url, { method = 'POST', headers = {}, body, timeoutMs = 180000 }) {
  const u = new URL(url);
  const lib = u.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers,
      timeout: timeoutMs
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch {}
        resolve({ statusCode: res.statusCode, headers: res.headers, text, json });
      });
    });
    req.on('timeout', () => req.destroy(new Error(`request-timeout-${timeoutMs}ms`)));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
function resolveConfiguredValue(value) {
  if (!value) return '';
  if (typeof value !== 'string') return String(value);
  if (value.startsWith('!')) return execSync(value.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (process.env[value]) return process.env[value];
  return value;
}
function loadPiProviderConfig(args = {}) {
  const modelsJsonPath = args.modelsJson || process.env.PI_MODELS_JSON || 'C:/Users/22134/.pi/agent/models.json';
  const cfg = readJson(modelsJsonPath, null);
  if (!cfg || !cfg.providers) return null;
  let providerId = args.piProvider || args.provider || process.env.IMAGE_VISION_PI_PROVIDER || 'yuyu';
  let modelId = args.model || process.env.IMAGE_VISION_MODEL || process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-5.5';
  if (String(modelId).includes('/') && cfg.providers[String(modelId).split('/')[0]]) {
    const parts = String(modelId).split('/');
    providerId = parts.shift();
    modelId = parts.join('/');
  }
  const provider = cfg.providers[providerId];
  if (!provider) return null;
  const modelEntry = Array.isArray(provider.models) ? provider.models.find(m => m.id === modelId) : null;
  const headers = {};
  for (const [k, v] of Object.entries(provider.headers || {})) headers[k] = resolveConfiguredValue(v);
  return {
    source: 'pi-models-json',
    providerId,
    baseUrl: (modelEntry && modelEntry.baseUrl) || provider.baseUrl,
    apiKey: resolveConfiguredValue((modelEntry && modelEntry.apiKey) || provider.apiKey),
    api: (modelEntry && modelEntry.api) || provider.api || 'openai-completions',
    headers,
    model: modelId
  };
}
function configFromArgs(args = {}) {
  const explicitBaseUrl = args.baseUrl || process.env.IMAGE_VISION_BASE_URL || process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || '';
  const explicitApiKey = args.apiKey || process.env.IMAGE_VISION_API_KEY || process.env.OPENAI_API_KEY || '';
  const explicitModel = args.model || process.env.IMAGE_VISION_MODEL || process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || '';
  if (explicitBaseUrl && explicitApiKey) {
    return { source: 'env-or-cli', providerId: args.piProvider || args.provider || 'openai-compatible', baseUrl: explicitBaseUrl, apiKey: explicitApiKey, api: 'openai-completions', headers: {}, model: explicitModel || 'gpt-4o-mini' };
  }
  const piCfg = loadPiProviderConfig(args);
  if (piCfg) return piCfg;
  return { source: 'missing', providerId: args.piProvider || args.provider || 'openai-compatible', baseUrl: explicitBaseUrl, apiKey: explicitApiKey, api: 'openai-completions', headers: {}, model: explicitModel || 'gpt-4o-mini' };
}
function endpoint(baseUrl) {
  if (!baseUrl) return '';
  if (/\/chat\/completions\/?$/.test(baseUrl)) return baseUrl;
  return baseUrl.replace(/\/$/, '') + '/chat/completions';
}
function blockedResult(imagePath, reason, extra = {}) {
  return {
    schema: 'image-vision-result-v1',
    imageRef: extra.imageRef || '',
    localPath: imagePath,
    status: 'blocked',
    provider: extra.provider || 'openai-compatible',
    model: extra.model || '',
    visibleText: [],
    visualDescription: '',
    detectedEntities: [],
    technicalLabels: [],
    tables: [],
    confidence: 'low',
    gaps: [{ reason, followup: extra.followup || 'configure-multimodal-api-or-run-manual-vision' }],
    sourceRefs: extra.sourceRefs || [],
    rawErrorPreview: extra.rawErrorPreview || undefined,
    generatedAt: new Date().toISOString()
  };
}
function buildPrompt(context) {
  const ctx = context ? ` ctx:${context}` : '';
  // Keep the prompt extremely short. Some configured multimodal providers return
  // an empty assistant message for dense images when the prompt/schema is long.
  return `只回JSON:{"words":["主要可见文字"],"description":"图意","confidence":"high|medium|low"}${ctx}`;
}
function normalizeVisibleText(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string'
    ? { text: item, locationHint: '', confidence: 'medium' }
    : { text: item.text || '', locationHint: item.locationHint || '', confidence: item.confidence || 'medium' }
  ).filter(item => item.text);
}
function normalizeEntityArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string'
    ? { name: item, type: 'unknown', evidence: '', confidence: 'medium' }
    : { name: item.name || item.label || '', type: item.type || 'unknown', evidence: item.evidence || '', confidence: item.confidence || 'medium' }
  ).filter(item => item.name);
}
function normalizeTechnicalLabels(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string'
    ? { label: item, value: '', category: 'unknown', confidence: 'medium' }
    : { label: item.label || item.name || '', value: item.value || '', category: item.category || 'unknown', confidence: item.confidence || 'medium' }
  ).filter(item => item.label);
}
function normalizeGaps(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string'
    ? { reason: item, locationHint: '', followup: 'manual-review-if-needed' }
    : { reason: item.reason || '', locationHint: item.locationHint || '', followup: item.followup || 'manual-review-if-needed' }
  ).filter(item => item.reason);
}
function extractAssistantContent(json) {
  const choice = json && Array.isArray(json.choices) ? json.choices[0] : null;
  const msg = choice && choice.message ? choice.message : null;
  let content = msg ? msg.content : undefined;
  if (content == null && choice && choice.text != null) content = choice.text;
  if (content == null && json && json.output_text != null) content = json.output_text;
  if (Array.isArray(content)) {
    return content.map(part => {
      if (typeof part === 'string') return part;
      if (part && typeof part.text === 'string') return part.text;
      if (part && part.type === 'text' && typeof part.content === 'string') return part.content;
      return '';
    }).join('\n').trim();
  }
  if (typeof content === 'string') return content;
  return '';
}
function parseModelJson(text) {
  const trimmed = String(text || '').trim();
  try { return JSON.parse(trimmed); } catch {}
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) { try { return JSON.parse(trimmed.slice(start, end + 1)); } catch {} }
  return null;
}
function buildPayload({ cfg, imagePath, context, jsonMode = true }) {
  const data = fs.readFileSync(imagePath).toString('base64');
  const payload = {
    model: cfg.model,
    max_tokens: Number(process.env.IMAGE_VISION_MAX_TOKENS || 1200),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt(context) },
          { type: 'image_url', image_url: { url: `data:${mimeFor(imagePath)};base64,${data}` } }
        ]
      }
    ]
  };
  if (jsonMode) payload.response_format = { type: 'json_object' };
  return payload;
}
async function postVision(cfg, payload, timeoutMs) {
  const headers = { 'Content-Type': 'application/json', ...(cfg.headers || {}) };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
  return requestJson(endpoint(cfg.baseUrl), { headers, body: JSON.stringify(payload), timeoutMs });
}
async function callVision({ imagePath, context, imageRef, sourceRefs, args = {} }) {
  const cfg = configFromArgs(args);
  if (!cfg.apiKey || !cfg.baseUrl) return blockedResult(imagePath, 'missing-api-config', { imageRef, sourceRefs, model: cfg.model, provider: cfg.providerId });
  if (!fs.existsSync(imagePath)) return blockedResult(imagePath, 'image-file-not-found', { imageRef, sourceRefs, model: cfg.model, provider: cfg.providerId });
  if (cfg.api !== 'openai-completions') return blockedResult(imagePath, `unsupported-api-${cfg.api}`, { imageRef, sourceRefs, model: cfg.model, provider: cfg.providerId, followup: 'use-openai-compatible-provider-or-extend-image-vision-cli' });
  const timeoutMs = Number(args.timeoutMs || 180000);
  let res = await postVision(cfg, buildPayload({ cfg, imagePath, context, jsonMode: args.noResponseFormat ? false : true }), timeoutMs);
  if ((res.statusCode === 400 || res.statusCode === 422) && !args.noResponseFormat && /response_format|json_object/i.test(res.text || '')) {
    res = await postVision(cfg, buildPayload({ cfg, imagePath, context, jsonMode: false }), timeoutMs);
  }
  if (res.statusCode < 200 || res.statusCode >= 300) {
    return blockedResult(imagePath, `api-http-${res.statusCode}`, { imageRef, sourceRefs, model: cfg.model, provider: cfg.providerId, rawErrorPreview: String(res.text || '').slice(0, 1000), followup: 'inspect-provider-vision-support-or-model-name' });
  }
  const content = extractAssistantContent(res.json);
  const parsed = parseModelJson(content);
  if (!parsed) {
    const preview = content || JSON.stringify(res.json && res.json.choices ? res.json.choices[0] : res.json || {}).slice(0, 1000);
    return blockedResult(imagePath, 'api-returned-non-json', { imageRef, sourceRefs, model: cfg.model, provider: cfg.providerId, rawErrorPreview: preview, followup: 'adjust-prompt-or-disable-response-format' });
  }
  return {
    schema: 'image-vision-result-v1',
    imageRef: imageRef || '',
    localPath: imagePath,
    status: 'done',
    provider: cfg.providerId || 'openai-compatible',
    model: cfg.model,
    visibleText: normalizeVisibleText(parsed.visibleText || parsed.words || parsed.text),
    visualDescription: parsed.visualDescription || parsed.description || parsed.desc || parsed.summary || '',
    detectedEntities: normalizeEntityArray(parsed.detectedEntities),
    technicalLabels: normalizeTechnicalLabels(parsed.technicalLabels),
    tables: Array.isArray(parsed.tables) ? parsed.tables : [],
    confidence: parsed.confidence || 'medium',
    gaps: normalizeGaps(parsed.gaps),
    sourceRefs: sourceRefs || [],
    rawUsage: res.json.usage || null,
    generatedAt: new Date().toISOString()
  };
}
async function withRetries(fn, { attempts = 3, retryDelayMs = 300000 }) {
  let last;
  const retries = [];
  for (let i = 1; i <= attempts; i++) {
    try {
      const result = await fn(i);
      if (!['blocked', 'failed'].includes(result.status)) return { result, retries };
      const reason = result.gaps && result.gaps[0] && result.gaps[0].reason;
      if (/missing-api-config|image-file-not-found|unsupported-api|api-returned-non-json/.test(reason || '')) return { result, retries };
      last = result;
    } catch (err) {
      last = { status: 'failed', error: err.message || String(err) };
    }
    if (i < attempts) {
      retries.push({ attempt: i, waitedMs: retryDelayMs, reason: last.error || (last.gaps && last.gaps[0] && last.gaps[0].reason) || 'unknown' });
      await sleep(retryDelayMs);
    }
  }
  return { result: last, retries };
}
async function analyze(args) {
  const imagePath = args.image || args.path;
  const out = args.out || args.output;
  if (!imagePath) throw new Error('Missing --image');
  const attempts = Number(args.attempts || 3);
  const retryDelayMs = Number(args.retryDelayMs || 300000);
  const { result, retries } = await withRetries(() => callVision({
    imagePath,
    context: args.context || '',
    imageRef: args.imageRef || '',
    sourceRefs: args.sourceRef ? [args.sourceRef] : [],
    args
  }), { attempts, retryDelayMs });
  result.retries = retries;
  if (out) writeJson(out, result);
  console.log(JSON.stringify({ ok: result.status === 'done', status: result.status, provider: result.provider, model: result.model, out: out || null, retries: retries.length }, null, 2));
}
async function batch(args) {
  const manifestFile = args.manifest;
  const outDir = args.out || args.output;
  if (!manifestFile || !outDir) throw new Error('Missing --manifest or --out');
  const manifest = readJson(manifestFile);
  if (!manifest || !Array.isArray(manifest.images)) throw new Error(`Invalid manifest: ${manifestFile}`);
  ensureDir(outDir);
  const concurrency = Math.min(Number(args.concurrency || 2), 2);
  const attempts = Number(args.attempts || 3);
  const retryDelayMs = Number(args.retryDelayMs || 300000);
  const maxImages = Number(args.maxImages || 0);
  const queue = manifest.images.map(img => ({
    imageRef: img.imageRef || `${manifest.opusId || 'image'}:${img.index || ''}`,
    localPath: img.localPath,
    sourceRef: manifest.source || manifest.sourceRef || ''
  })).filter(x => x.localPath).slice(0, maxImages > 0 ? maxImages : undefined);
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const item = queue[cursor++];
      const name = String(item.imageRef || path.basename(item.localPath)).replace(/[^a-zA-Z0-9._-]+/g, '_') + '.json';
      const out = path.join(outDir, name);
      const { result, retries } = await withRetries(() => callVision({ imagePath: item.localPath, imageRef: item.imageRef, sourceRefs: item.sourceRef ? [item.sourceRef] : [], args }), { attempts, retryDelayMs });
      result.retries = retries;
      writeJson(out, result);
      results.push({ imageRef: item.imageRef, localPath: item.localPath, status: result.status, out, retries: retries.length });
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, () => worker()));
  const report = { schema: 'image-vision-batch-report-v1', manifestFile, generatedAt: new Date().toISOString(), total: queue.length, done: results.filter(r => r.status === 'done').length, blocked: results.filter(r => r.status === 'blocked').length, failed: results.filter(r => r.status === 'failed').length, results };
  writeJson(path.join(outDir, 'batch-report.json'), report);
  console.log(JSON.stringify({ ok: true, ...report }, null, 2));
}
function usage() {
  return `image-vision commands:\n  analyze --image <path> --out <json> [--imageRef ref] [--sourceRef ref] [--piProvider yuyu] [--model gpt-5.5]\n  batch --manifest <manifest.json> --out <dir> [--concurrency 2] [--maxImages N] [--piProvider yuyu] [--model gpt-5.5]\n\nConfig priority:\n  1. --baseUrl/--apiKey or IMAGE_VISION_BASE_URL/IMAGE_VISION_API_KEY\n  2. Pi models.json: --modelsJson <path>, --piProvider <id>, --model <id>; defaults to C:/Users/22134/.pi/agent/models.json, yuyu, gpt-5.5\n\nEnv also supported:\n  OPENAI_BASE_URL / OPENAI_API_BASE / OPENAI_API_KEY\n  IMAGE_VISION_PI_PROVIDER / IMAGE_VISION_MODEL / OPENAI_VISION_MODEL / OPENAI_MODEL`;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (cmd === 'analyze') return analyze(args);
  if (cmd === 'batch') return batch(args);
  console.log(usage());
  process.exit(cmd ? 1 : 0);
}
main().catch(err => { console.error(err.stack || err.message || String(err)); process.exit(1); });
