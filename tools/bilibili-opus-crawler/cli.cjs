#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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
        if (next && !next.startsWith('--')) { out[key] = next; i++; } else out[key] = true;
      }
    } else out._.push(a);
  }
  return out;
}
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p, fallback = null) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8'); }
function writeText(p, t) { ensureDir(path.dirname(p)); fs.writeFileSync(p, t, 'utf8'); }
function runNode(args, opts = {}) { const res = spawnSync(process.execPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }); return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' }; }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function retryable(stepFn, { retries = 3, waitMs = 300000 }) {
  const history = [];
  const run = async () => {
    let last = null;
    for (let i = 1; i <= retries; i++) {
      last = await stepFn(i);
      if (last.ok) return { ok: true, result: last, retries: history };
      history.push({ attempt: i, reason: last.reason || 'unknown', waitedMs: i < retries ? waitMs : 0 });
      if (i < retries) await sleep(waitMs);
    }
    return { ok: false, result: last, retries: history };
  };
  return run();
}
async function refreshIndex(outDir, hostMid, maxPages) {
  const args = ['tools/source-ingest/cli.cjs', 'bilibili-opus-index', '--hostMid', String(hostMid), '--out', outDir, '--maxPages', String(maxPages || 30)];
  const res = runNode(args, { cwd: path.resolve('.') });
  return { ok: res.status === 0, stdout: res.stdout, stderr: res.stderr, reason: res.status === 0 ? '' : `index-failed:${res.stderr.trim().slice(0, 240)}` };
}
async function fetchDetail(opusId, outDir) {
  const args = ['tools/source-ingest/cli.cjs', 'bilibili-opus-detail', '--opusId', String(opusId), '--out', outDir];
  const res = runNode(args, { cwd: path.resolve('.') });
  return { ok: res.status === 0, stdout: res.stdout, stderr: res.stderr, reason: res.status === 0 ? '' : `detail-failed:${res.stderr.trim().slice(0, 240)}` };
}
async function downloadImages(detailFile, outDir) {
  const args = ['tools/source-ingest/cli.cjs', 'bilibili-opus-download-images', '--detail', detailFile, '--out', outDir];
  const res = runNode(args, { cwd: path.resolve('.') });
  return { ok: res.status === 0, stdout: res.stdout, stderr: res.stderr, reason: res.status === 0 ? '' : `images-failed:${res.stderr.trim().slice(0, 240)}` };
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  const root = args.root || 'work/gundam-seed/source-ingest-v2';
  const hostMid = args.hostMid || '102672286';
  const indexFile = path.join(root, 'opus-index.json');
  const detailsDir = path.join(root, 'details');
  const imagesDir = path.join(root, 'images');
  const retries = Number(args.retries || 3);
  const waitMs = Number(args.waitMs || 300000);
  const concurrency = Math.min(Number(args.concurrency || 2), 2);
  ensureDir(root);
  const report = { schema: 'bilibili-opus-crawler-report-v1', generatedAt: new Date().toISOString(), root, hostMid, concurrency, retries, waitMs, steps: [], counts: {} };
  if (!cmd || cmd === 'help') { console.log('bilibili-opus-crawler commands: run-all, ingest, details, images, report'); process.exit(cmd ? 0 : 1); }
  if (cmd === 'ingest' || cmd === 'run-all') {
    const idx = await retryable(() => refreshIndex(root, hostMid, Number(args.maxPages || 30)), { retries, waitMs });
    report.steps.push({ step: 'index', ok: idx.ok, retries: idx.retries, stdout: idx.result ? idx.result.stdout : '', stderr: idx.result ? idx.result.stderr : '' });
    if (!idx.ok) {
      report.counts.index = 'failed';
      writeJson(path.join(root, 'ingest-run-report.json'), report);
      writeText(path.join(root, 'ingest-run-report.md'), `# Ingest Run Report\n\n- Index refresh failed after ${retries} attempts.\n`);
      console.log(JSON.stringify({ ok: false, reportPath: path.join(root, 'ingest-run-report.json') }, null, 2));
      return;
    }
    const index = readJson(indexFile);
    const items = Array.isArray(index && index.items) ? index.items : [];
    report.counts.indexed = items.length;
    const missingDetails = [];
    let fetchedDetails = 0;
    let failedDetails = 0;
    for (const item of items) {
      const opusId = String(item.opusId || '').trim();
      const detailPath = path.join(detailsDir, `${opusId}.json`);
      if (fs.existsSync(detailPath)) continue;
      const d = await retryable(() => fetchDetail(opusId, detailsDir), { retries, waitMs });
      if (d.ok) fetchedDetails++; else { failedDetails++; missingDetails.push(opusId); }
      report.steps.push({ step: `detail:${opusId}`, ok: d.ok, retries: d.retries });
      if ((fetchedDetails + failedDetails) % concurrency === 0) await sleep(0);
    }
    let imageManifests = 0;
    let imageFailures = 0;
    for (const item of items) {
      const opusId = String(item.opusId || '').trim();
      const detailPath = path.join(detailsDir, `${opusId}.json`);
      if (!fs.existsSync(detailPath)) continue;
      const detail = readJson(detailPath);
      if (!detail || !Array.isArray(detail.images) || !detail.images.length) continue;
      const manifestDir = path.join(imagesDir, opusId);
      const manifestPath = path.join(manifestDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        const d = await retryable(() => downloadImages(detailPath, imagesDir), { retries, waitMs });
        if (d.ok) imageManifests++; else imageFailures++;
        report.steps.push({ step: `images:${opusId}`, ok: d.ok, retries: d.retries });
      }
    }
    report.counts = { indexed: items.length, detailsFetched: fetchedDetails, detailsFailed: failedDetails, detailsMissing: missingDetails.length, imageManifests, imageFailures, retriedOperations: report.steps.reduce((n, s) => n + (s.retries ? s.retries.length : 0), 0) };
    writeJson(path.join(root, 'ingest-run-report.json'), report);
    writeText(path.join(root, 'ingest-run-report.md'), `# Ingest Run Report\n\n- Indexed: ${report.counts.indexed}\n- Details fetched: ${report.counts.detailsFetched}\n- Details failed: ${report.counts.detailsFailed}\n- Image manifests: ${report.counts.imageManifests}\n- Image failures: ${report.counts.imageFailures}\n- Retried operations: ${report.counts.retriedOperations}\n`);
    console.log(JSON.stringify({ ok: true, reportPath: path.join(root, 'ingest-run-report.json'), counts: report.counts }, null, 2));
    return;
  }
  if (cmd === 'report') { const reportPath = path.join(root, 'ingest-run-report.json'); const reportData = readJson(reportPath, null); console.log(JSON.stringify({ ok: !!reportData, report: reportData }, null, 2)); return; }
  console.log('Unknown command: ' + cmd); process.exit(1);
}
main().catch(err => { console.error(err.stack || err.message || String(err)); process.exit(1); });
