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
function runNode(scriptPath, args = [], cwd = process.cwd()) {
  const res = spawnSync(process.execPath, [scriptPath, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}
function findManifests(root) {
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry === 'manifest.json') out.push(full);
    }
  }
  walk(path.join(root, 'images'));
  return out.sort();
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  const root = args.root || 'work/gundam-seed/source-ingest-v2';
  const outDir = args.out || root;
  const crawler = path.resolve('tools/bilibili-opus-crawler/cli.cjs');
  const vision = path.resolve('tools/image-vision/cli.cjs');
  const concurrency = Math.min(Number(args.concurrency || 2), 2);
  if (!cmd || cmd === 'help') { console.log('gundam-seed-opus-runner commands: run-all, ingest, vision, report'); process.exit(cmd ? 0 : 1); }
  if (cmd === 'ingest') {
    const res = runNode(crawler, ['run-all', '--root', root, '--hostMid', args.hostMid || '102672286', '--concurrency', String(concurrency), '--retries', String(args.retries || 3)], process.cwd());
    process.stdout.write(res.stdout);
    process.stderr.write(res.stderr);
    process.exit(res.status || 0);
    return;
  }
  if (cmd === 'vision') {
    const manifests = args.manifest ? [args.manifest] : findManifests(root);
    const results = [];
    for (const manifest of manifests) {
      const targetDir = path.join(path.dirname(manifest), 'vision');
      ensureDir(targetDir);
      const visionArgs = ['batch', '--manifest', manifest, '--out', targetDir, '--concurrency', String(concurrency), '--attempts', String(args.attempts || 3), '--retryDelayMs', String(args.retryDelayMs || 300000), '--piProvider', args.piProvider || 'yuyu', '--model', args.model || 'gpt-5.5'];
      if (args.maxImages) visionArgs.push('--maxImages', String(args.maxImages));
      const res = runNode(vision, visionArgs, process.cwd());
      let summary = null;
      try {
        const parsed = JSON.parse(res.stdout);
        summary = { total: parsed.total, done: parsed.done, blocked: parsed.blocked, failed: parsed.failed };
      } catch {}
      results.push({ manifest, status: res.status, summary, stderr: res.stderr, targetDir });
      if (args.verbose) {
        process.stdout.write(res.stdout);
        process.stderr.write(res.stderr);
      }
    }
    const report = { schema: 'gundam-seed-opus-runner-vision-report-v1', generatedAt: new Date().toISOString(), root, concurrency, totalManifests: manifests.length, results };
    writeJson(path.join(outDir, 'vision-run-report.json'), report);
    writeText(path.join(outDir, 'vision-run-report.md'), `# Vision Run Report\n\n- Manifests: ${report.totalManifests}\n- Concurrency: ${concurrency}\n- Results recorded: ${report.results.length}\n`);
    console.log(JSON.stringify({ ok: true, reportPath: path.join(outDir, 'vision-run-report.json'), totalManifests: report.totalManifests }, null, 2));
    return;
  }
  if (cmd === 'run-all') {
    const ingestRes = runNode(crawler, ['run-all', '--root', root, '--hostMid', args.hostMid || '102672286', '--concurrency', String(concurrency), '--retries', String(args.retries || 3)], process.cwd());
    process.stdout.write(ingestRes.stdout);
    process.stderr.write(ingestRes.stderr);
    if (ingestRes.status !== 0) process.exit(ingestRes.status || 1);
    const runVisionArgs = ['vision', '--root', root, '--concurrency', String(concurrency), '--attempts', String(args.attempts || 3), '--retryDelayMs', String(args.retryDelayMs || 300000), '--piProvider', args.piProvider || 'yuyu', '--model', args.model || 'gpt-5.5'];
    if (args.maxImages) runVisionArgs.push('--maxImages', String(args.maxImages));
    const visionRes = runNode(process.argv[1], runVisionArgs, process.cwd());
    process.stdout.write(visionRes.stdout);
    process.stderr.write(visionRes.stderr);
    process.exit(visionRes.status || 0);
    return;
  }
  if (cmd === 'report') {
    const ingest = readJson(path.join(root, 'ingest-run-report.json'), null);
    const vision = readJson(path.join(root, 'vision-run-report.json'), null);
    console.log(JSON.stringify({ ok: !!ingest || !!vision, ingest, vision }, null, 2));
    return;
  }
  console.log('Unknown command: ' + cmd);
  process.exit(1);
}
main().catch(err => { console.error(err.stack || err.message || String(err)); process.exit(1); });
