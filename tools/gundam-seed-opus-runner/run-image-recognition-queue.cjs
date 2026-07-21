#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function safeName(s) {
  return String(s || '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
}
function shortText(s, n = 1800) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}
function buildContext(item) {
  const title = String(item.opus?.title || '').replace(/ - 哔哩哔哩$/, '');
  const heading = item.context?.currentHeading || '';
  const near = item.context?.nextText || item.context?.previousText || '';
  // Keep this deliberately short: the configured provider may return an empty
  // assistant message when the multimodal prompt/context is too long.
  return shortText([
    `标题:${title}`,
    `类别:${item.opus?.category || ''}/${item.triage?.semanticClass || ''}`,
    `图序:${item.index}`,
    heading ? `栏目:${heading}` : '',
    near ? `邻近原文:${shortText(near, 180)}` : ''
  ].filter(Boolean).join('；'), 420);
}
function runAnalyze({ cli, item, outFile, args }) {
  return new Promise(resolve => {
    const argv = [
      cli,
      'analyze',
      '--image', item.localPath,
      '--out', outFile,
      '--imageRef', item.imageId,
      '--sourceRef', item.opus?.url || '',
      '--context', buildContext(item),
      '--piProvider', args.piProvider || 'yuyu',
      '--model', args.model || 'gpt-5.5',
      '--attempts', String(args.attempts || 3),
      '--retryDelayMs', String(args.retryDelayMs || 300000),
      '--timeoutMs', String(args.timeoutMs || 180000)
    ];
    const env = { ...process.env };
    if (!env.NODE_OPTIONS) env.NODE_OPTIONS = '--use-system-ca';
    const child = spawn(process.execPath, argv, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => {
      const result = readJson(outFile, null);
      resolve({
        imageId: item.imageId,
        priority: item.triage?.priority,
        semanticClass: item.triage?.semanticClass,
        localPath: item.localPath,
        out: outFile.replace(/\\/g, '/'),
        status: result?.status || (code === 0 ? 'unknown' : 'failed'),
        code,
        stdout: stdout.slice(-1000),
        stderr: stderr.slice(-1000),
        generatedAt: new Date().toISOString()
      });
    });
  });
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queueFile = args.queue || 'work/gundam-seed/source-ingest-v2/image-triage/recognition-queue.json';
  const outRoot = args.out || 'work/gundam-seed/source-ingest-v2/vision-triage';
  const cli = args.imageVisionCli || 'tools/image-vision/cli.cjs';
  const queue = readJson(queueFile, { items: [] });
  const priority = args.priority ? Number(args.priority) : null;
  const semanticClass = args.class || '';
  const max = args.max ? Number(args.max) : 0;
  const concurrency = Math.min(Number(args.concurrency || 2), 2);
  const generatedAt = new Date().toISOString();
  let items = (queue.items || []).filter(item => item.localPath);
  if (priority != null) items = items.filter(item => Number(item.triage?.priority) === priority);
  if (semanticClass) items = items.filter(item => item.triage?.semanticClass === semanticClass);
  items = items.sort((a, b) => Number(a.triage?.priority || 9) - Number(b.triage?.priority || 9) || String(a.opus?.opusId || '').localeCompare(String(b.opus?.opusId || '')) || Number(a.index || 0) - Number(b.index || 0));
  if (max > 0) items = items.slice(0, max);

  const resultsDir = path.join(outRoot, 'results');
  const ledgerFile = path.join(outRoot, 'recognition-ledger.json');
  const existingLedger = readJson(ledgerFile, { results: [] });
  const priorById = new Map((existingLedger.results || []).map(r => [r.imageId, r]));
  const retryBlocked = Boolean(args.retryBlocked || args.retryblocked);
  const pending = items.filter(item => {
    const outFile = path.join(resultsDir, `${safeName(item.imageId)}.json`);
    const existing = readJson(outFile, null);
    if (!existing) return true;
    if (existing.status === 'done') return false;
    if (existing.status === 'blocked') return retryBlocked;
    return true;
  });

  const runResults = [];
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const item = pending[cursor++];
      const outFile = path.join(resultsDir, `${safeName(item.imageId)}.json`);
      const r = await runAnalyze({ cli, item, outFile, args });
      runResults.push(r);
      priorById.set(r.imageId, r);
      if (runResults.length % 10 === 0) {
        writeJson(ledgerFile, { schema: 'gundam-seed-image-recognition-ledger-v1', generatedAt, updatedAt: new Date().toISOString(), queueFile, outRoot, results: [...priorById.values()] });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length || 1) }, () => worker()));
  const allResults = [...priorById.values()];
  const report = {
    schema: 'gundam-seed-image-recognition-run-report-v1',
    generatedAt,
    updatedAt: new Date().toISOString(),
    queueFile,
    outRoot,
    filters: { priority, semanticClass: semanticClass || null, max: max || null, concurrency, retryBlocked },
    selected: items.length,
    skippedExisting: items.length - pending.length,
    attemptedThisRun: pending.length,
    totals: {
      ledgerResults: allResults.length,
      done: allResults.filter(r => r.status === 'done').length,
      blocked: allResults.filter(r => r.status === 'blocked').length,
      failed: allResults.filter(r => r.status === 'failed').length,
      unknown: allResults.filter(r => !['done', 'blocked', 'failed'].includes(r.status)).length
    },
    failureSummary: allResults.reduce((acc, r) => {
      const key = r.status === 'blocked' ? (r.gaps?.[0]?.reason || 'blocked-unknown') : (r.error || '');
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    byClass: allResults.reduce((acc, r) => { acc[r.semanticClass || 'unknown'] = (acc[r.semanticClass || 'unknown'] || 0) + 1; return acc; }, {}),
    results: allResults
  };
  writeJson(ledgerFile, { schema: 'gundam-seed-image-recognition-ledger-v1', generatedAt, updatedAt: report.updatedAt, queueFile, outRoot, results: allResults });
  writeJson(path.join(outRoot, 'recognition-run-report.json'), report);
  console.log(JSON.stringify({ ok: true, selected: report.selected, skippedExisting: report.skippedExisting, attemptedThisRun: report.attemptedThisRun, totals: report.totals, byClass: report.byClass }, null, 2));
}

main().catch(err => { console.error(err.stack || err.message || String(err)); process.exit(1); });
