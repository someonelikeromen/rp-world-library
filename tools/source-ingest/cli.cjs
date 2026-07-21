#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(p, value) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(p, text) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, text, 'utf8');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) {
        out[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          out[key] = next;
          i++;
        } else {
          out[key] = true;
        }
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function request(url, options = {}) {
  const u = new URL(url);
  const lib = u.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          text: () => body.toString(options.encoding || 'utf8')
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 96) || 'item';
}

function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(u) {
  if (!u) return '';
  if (u.startsWith('//')) return 'https:' + u;
  return u;
}

function uniqueBy(arr, keyFn) {
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function collectPics(value, out = []) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    for (const item of value) collectPics(item, out);
    return out;
  }
  if (typeof value.url === 'string' && /hdslb\.com\/bfs\//.test(value.url)) {
    out.push({
      url: normalizeUrl(value.url),
      width: value.width || null,
      height: value.height || null,
      size: value.size || null,
      comment: value.comment || '',
      aigc: value.aigc != null ? value.aigc : null,
      warning: value.warning || null
    });
  }
  for (const child of Object.values(value)) collectPics(child, out);
  return out;
}

function collectTextNodes(value, out = []) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    for (const item of value) collectTextNodes(item, out);
    return out;
  }
  if (value.word && typeof value.word.words === 'string') out.push(value.word.words);
  if (value.text && value.text.nodes) collectTextNodes(value.text.nodes, out);
  if (value.heading && value.heading.nodes) {
    out.push('\n# ');
    collectTextNodes(value.heading.nodes, out);
    out.push('\n');
  }
  if (value.list && value.list.items) collectTextNodes(value.list.items, out);
  if (value.link_card && value.link_card.text) out.push(value.link_card.text);
  for (const [key, child] of Object.entries(value)) {
    if (['word', 'text', 'heading', 'list', 'link_card'].includes(key)) continue;
    collectTextNodes(child, out);
  }
  return out;
}

function normalizeExtractedText(parts) {
  return parts
    .join('')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractJsonState(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  let begun = false;
  const jsonStart = start + marker.length;
  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      depth++;
      begun = true;
    } else if (ch === '}') {
      depth--;
      if (begun && depth === 0) return html.slice(jsonStart, i + 1);
    }
  }
  return null;
}

function extractBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) return null;
  const begin = start + startMarker.length;
  const end = text.indexOf(endMarker, begin);
  if (end < 0) return null;
  return text.slice(begin, end);
}

async function fetchJson(url, headers = {}) {
  const res = await request(url, { headers });
  const text = res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${url}: ${e.message}`);
  }
  return { res, json };
}

async function fetchText(url, headers = {}) {
  const res = await request(url, { headers });
  return { res, text: res.text() };
}

function bilibiliHeaders(url) {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    'Referer': url,
    'Accept': 'application/json,text/html,application/xhtml+xml'
  };
}

async function bilibiliFetchIndex({ hostMid, maxPages = 30, delayMs = 200, outputDir, baseUrl }) {
  const pages = [];
  const items = [];
  let page = 1;
  let offset = '';
  let hasMore = true;
  while (hasMore && page <= maxPages) {
    const url = new URL('https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/feed/space');
    url.searchParams.set('host_mid', String(hostMid));
    url.searchParams.set('page', String(page));
    url.searchParams.set('offset', offset || '');
    url.searchParams.set('type', 'all');
    url.searchParams.set('web_location', '333.1387');
    const { json } = await fetchJson(url.toString(), bilibiliHeaders(baseUrl));
    if (json.code !== 0) throw new Error(`Bilibili index fetch failed: ${json.code} ${json.message || ''}`);
    const data = json.data || {};
    const batch = Array.isArray(data.items) ? data.items : [];
    pages.push({ page, offset: data.offset || '', hasMore: !!data.has_more, count: batch.length });
    for (const it of batch) {
      const opusId = String(it.opus_id || it.id || '').trim();
      const title = String(it.content || '').trim();
      items.push({
        opusId,
        title,
        url: normalizeUrl(it.jump_url || (opusId ? `https://www.bilibili.com/opus/${opusId}` : '')),
        cover: it.cover ? { url: normalizeUrl(it.cover.url), width: it.cover.width, height: it.cover.height } : null,
        like: it.stat && it.stat.like != null ? Number(it.stat.like) : null,
        raw: it
      });
    }
    hasMore = !!data.has_more;
    offset = data.offset || '';
    page += 1;
    if (hasMore) await sleep(delayMs);
  }
  const uniq = [];
  const seen = new Set();
  for (const item of items) {
    if (!item.opusId) continue;
    if (seen.has(item.opusId)) continue;
    seen.add(item.opusId);
    uniq.push(item);
  }
  const report = {
    source: 'bilibili-space-opus',
    hostMid: String(hostMid),
    fetchedAt: new Date().toISOString(),
    totalFetched: items.length,
    totalUnique: uniq.length,
    pages,
    items: uniq.map((it, index) => ({
      index: index + 1,
      opusId: it.opusId,
      title: it.title,
      url: it.url,
      cover: it.cover,
      like: it.like,
      categoryGuess: guessBilibiliSeedCategory(it.title),
      related: {
        seedMention: /seed/i.test(it.title)
      }
    }))
  };
  if (outputDir) {
    ensureDir(outputDir);
    writeJson(path.join(outputDir, 'opus-index.json'), report);
    writeText(path.join(outputDir, 'opus-index.md'), renderIndexReport(report));
  }
  return report;
}

function guessBilibiliSeedCategory(title) {
  if (/机体百科/.test(title)) return 'mobile-suit-encyclopedia';
  if (/战舰百科/.test(title)) return 'warship-encyclopedia';
  if (/人物百科/.test(title)) return 'character-encyclopedia';
  if (/战斗分析/.test(title)) return 'battle-analysis';
  if (/是非大全|槽点|话题|舆论/.test(title)) return 'controversy-analysis';
  if (/官方小说/.test(title)) return 'official-novel-translation';
  if (/百科/.test(title)) return 'world-rule-encyclopedia';
  return 'unknown';
}

function renderIndexReport(report) {
  const seedMentionCount = report.items.filter(item => item.related.seedMention).length;
  const noSeedMention = report.items.filter(item => !item.related.seedMention);
  const categoryCounts = {};
  for (const item of report.items) {
    const cat = item.categoryGuess || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const lines = [];
  lines.push(`# Bilibili Opus Index Report`);
  lines.push('');
  lines.push(`- Source: ${report.source}`);
  lines.push(`- Host MID: ${report.hostMid}`);
  lines.push(`- Fetched at: ${report.fetchedAt}`);
  lines.push(`- Total fetched: ${report.totalFetched}`);
  lines.push(`- Total unique: ${report.totalUnique}`);
  lines.push(`- Title contains SEED: ${seedMentionCount}`);
  lines.push(`- Title does not contain SEED: ${noSeedMention.length}`);
  lines.push('');
  lines.push('## Category Guess Counts');
  lines.push('');
  for (const [cat, count] of Object.entries(categoryCounts).sort()) lines.push(`- ${cat}: ${count}`);
  if (noSeedMention.length) {
    lines.push('');
    lines.push('## Titles Without SEED Marker');
    lines.push('');
    for (const item of noSeedMention) lines.push(`- ${item.index}. ${item.title} (${item.opusId})`);
  }
  lines.push('');
  lines.push('| # | opusId | title | category | likes | seedMention |');
  lines.push('|---:|---|---|---|---:|---|');
  for (const item of report.items) {
    lines.push(`| ${item.index} | ${item.opusId} | ${item.title.replace(/\|/g, '\\|')} | ${item.categoryGuess || 'unknown'} | ${item.like ?? ''} | ${item.related.seedMention ? 'yes' : 'no'} |`);
  }
  return lines.join('\n') + '\n';
}

async function bilibiliFetchDetail({ opusId, outputDir, baseUrl, saveHtml = true }) {
  const url = `https://www.bilibili.com/opus/${opusId}`;
  const { text: html } = await fetchText(url, bilibiliHeaders(url));
  const stateText = extractJsonState(html, 'window.__INITIAL_STATE__=');
  if (!stateText) throw new Error(`Unable to extract __INITIAL_STATE__ for opus ${opusId}`);
  const state = JSON.parse(stateText);
  const detail = state.detail || {};
  const modules = Array.isArray(detail.modules) ? detail.modules : [];
  const title = detail.basic && detail.basic.title ? detail.basic.title : `opus-${opusId}`;
  const contentModule = modules.find(m => m.module_type === 'MODULE_TYPE_CONTENT');
  const topModule = modules.find(m => m.module_type === 'MODULE_TYPE_TOP');
  const contentImages = uniqueBy(collectPics(contentModule), pic => pic.url);
  const coverImages = uniqueBy(collectPics(topModule), pic => pic.url);
  const pics = uniqueBy([...coverImages, ...contentImages], pic => pic.url);
  const contentText = contentModule ? normalizeExtractedText(collectTextNodes(contentModule)) : '';
  const moduleText = normalizeExtractedText(collectTextNodes(modules));
  const detailData = {
    source: 'bilibili-opus-detail',
    opusId: String(opusId),
    title,
    url,
    fetchedAt: new Date().toISOString(),
    uid: detail.basic && detail.basic.uid ? String(detail.basic.uid) : null,
    commentId: detail.basic && detail.basic.comment_id_str ? String(detail.basic.comment_id_str) : null,
    collectionId: detail.basic && detail.basic.collection_id ? String(detail.basic.collection_id) : null,
    articleType: detail.basic && detail.basic.article_type != null ? Number(detail.basic.article_type) : null,
    editable: detail.basic ? !!detail.basic.editable : null,
    contentText,
    moduleText: moduleText.slice(0, 50000),
    images: pics,
    contentImages,
    coverImages,
    moduleTypes: modules.map(m => m.module_type),
    raw: detail
  };
  if (outputDir) {
    ensureDir(outputDir);
    writeJson(path.join(outputDir, `${opusId}.json`), detailData);
    if (saveHtml) writeText(path.join(outputDir, `${opusId}.html`), html);
    writeText(path.join(outputDir, `${opusId}.md`), renderDetailReport(detailData));
  }
  return detailData;
}

function renderDetailReport(detail) {
  const lines = [];
  lines.push(`# ${detail.title}`);
  lines.push('');
  lines.push(`- Opus ID: ${detail.opusId}`);
  lines.push(`- URL: ${detail.url}`);
  lines.push(`- UID: ${detail.uid || ''}`);
  lines.push(`- Comment ID: ${detail.commentId || ''}`);
  lines.push(`- Images: ${detail.images.length}`);
  lines.push('');
  lines.push('## Module Types');
  for (const t of detail.moduleTypes) lines.push(`- ${t}`);
  lines.push('');
  lines.push('## Text Preview');
  lines.push('');
  lines.push(detail.contentText.slice(0, 2000) || '(empty)');
  lines.push('');
  return lines.join('\n');
}

async function bilibiliBuildManifest({ indexFile, outputDir, seedOnly = false }) {
  const idx = readJson(indexFile);
  if (!idx || !Array.isArray(idx.items)) throw new Error(`Invalid index file: ${indexFile}`);
  const manifest = {
    source: idx.source,
    hostMid: idx.hostMid,
    builtAt: new Date().toISOString(),
    total: idx.items.length,
    items: []
  };
  for (const item of idx.items) {
    const title = item.title || '';
    const seedMention = /seed/i.test(title) || /高达SEED/.test(title);
    if (seedOnly && !seedMention) continue;
    manifest.items.push({
      opusId: item.opusId,
      title,
      url: item.url,
      seedMention,
      cover: item.cover || null,
      like: item.like ?? null,
      imageCount: 0,
      images: []
    });
  }
  if (outputDir) {
    ensureDir(outputDir);
    writeJson(path.join(outputDir, 'opus-manifest.json'), manifest);
  }
  return manifest;
}

async function bilibiliDownloadImages({ detailFile, outputDir, maxImages = 0 }) {
  const detail = readJson(detailFile);
  if (!detail || !Array.isArray(detail.images)) throw new Error(`Invalid detail file: ${detailFile}`);
  const base = path.join(outputDir, String(detail.opusId));
  ensureDir(base);
  const manifest = {
    opusId: detail.opusId,
    title: detail.title,
    source: detail.url,
    downloadedAt: new Date().toISOString(),
    images: []
  };
  const limit = maxImages > 0 ? Math.min(maxImages, detail.images.length) : detail.images.length;
  for (let i = 0; i < limit; i++) {
    const img = detail.images[i];
    const url = img.url;
    if (!url) continue;
    const name = String(i + 1).padStart(3, '0') + path.extname(new URL(url).pathname || '.jpg');
    const out = path.join(base, name);
    const res = await request(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
        'Referer': detail.url
      }
    });
    fs.writeFileSync(out, res.body);
    manifest.images.push({
      index: i + 1,
      url,
      localPath: out,
      width: img.width || null,
      height: img.height || null,
      size: img.size || null,
      status: res.statusCode
    });
  }
  writeJson(path.join(base, 'manifest.json'), manifest);
  return manifest;
}

function usage() {
  return `source-ingest commands:\n  bilibili-opus-index --hostMid <mid> --out <dir> [--maxPages N]\n  bilibili-opus-detail --opusId <id> --out <dir>\n  bilibili-opus-manifest --index <opus-index.json> --out <dir> [--seedOnly]\n  bilibili-opus-download-images --detail <detail.json> --out <dir> [--maxImages N]`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd) {
    console.log(usage());
    process.exit(1);
  }
  try {
    if (cmd === 'bilibili-opus-index') {
      const hostMid = args.hostMid || args.hostmid;
      if (!hostMid) throw new Error('Missing --hostMid');
      const report = await bilibiliFetchIndex({
        hostMid,
        maxPages: Number(args.maxPages || 30),
        delayMs: Number(args.delayMs || 200),
        outputDir: args.out || args.output || '',
        baseUrl: `https://space.bilibili.com/${hostMid}/upload/opus`
      });
      console.log(JSON.stringify({ ok: true, totalUnique: report.totalUnique, totalFetched: report.totalFetched }, null, 2));
      return;
    }
    if (cmd === 'bilibili-opus-detail') {
      const opusId = args.opusId;
      if (!opusId) throw new Error('Missing --opusId');
      const detail = await bilibiliFetchDetail({
        opusId,
        outputDir: args.out || args.output || '',
        baseUrl: `https://www.bilibili.com/opus/${opusId}`,
        saveHtml: args.saveHtml !== 'false'
      });
      console.log(JSON.stringify({ ok: true, opusId: detail.opusId, imageCount: detail.images.length }, null, 2));
      return;
    }
    if (cmd === 'bilibili-opus-manifest') {
      const manifest = await bilibiliBuildManifest({
        indexFile: args.index,
        outputDir: args.out || args.output || '',
        seedOnly: !!args.seedOnly
      });
      console.log(JSON.stringify({ ok: true, total: manifest.items.length }, null, 2));
      return;
    }
    if (cmd === 'bilibili-opus-download-images') {
      const manifest = await bilibiliDownloadImages({
        detailFile: args.detail,
        outputDir: args.out || args.output || '',
        maxImages: Number(args.maxImages || 0)
      });
      console.log(JSON.stringify({ ok: true, downloaded: manifest.images.length }, null, 2));
      return;
    }
    throw new Error(`Unknown command: ${cmd}`);
  } catch (err) {
    console.error(err.stack || err.message || String(err));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
