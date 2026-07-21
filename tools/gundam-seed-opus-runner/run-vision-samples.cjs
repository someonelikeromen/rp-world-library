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
        if (next && !next.startsWith('--')) { out[key] = next; i++; }
        else out[key] = true;
      }
    } else out._.push(a);
  }
  return out;
}
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { ensureDir(path.dirname(file)); fs.writeFileSync(file, text, 'utf8'); }
function runNode(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function summarizeBatchReport(file) {
  const report = readJson(file, null);
  if (!report) return null;
  const items = [];
  for (const r of report.results || []) {
    const result = readJson(r.out, null);
    items.push({
      imageRef: r.imageRef,
      status: r.status,
      out: r.out,
      visibleText: result ? result.visibleText : [],
      visualDescription: result ? result.visualDescription : '',
      confidence: result ? result.confidence : '',
      gaps: result ? result.gaps : []
    });
  }
  return { total: report.total, done: report.done, blocked: report.blocked, failed: report.failed, items };
}
function markdown(report) {
  const lines = [];
  lines.push('# Gundam SEED Vision Sample Report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Provider: ${report.provider}`);
  lines.push(`- Model: ${report.model}`);
  lines.push(`- Samples: ${report.samples.length}`);
  lines.push(`- Totals: done ${report.totals.done}, blocked ${report.totals.blocked}, failed ${report.totals.failed}, images ${report.totals.total}`);
  lines.push('');
  for (const sample of report.samples) {
    lines.push(`## ${sample.category}: ${sample.title}`);
    lines.push('');
    lines.push(`- Opus: ${sample.opusId}`);
    lines.push(`- Scope: ${sample.scope}`);
    lines.push(`- Manifest: ${sample.manifestPath}`);
    lines.push(`- Batch: ${sample.batchReportPath}`);
    lines.push(`- Result: done ${sample.summary.done}, blocked ${sample.summary.blocked}, failed ${sample.summary.failed}, total ${sample.summary.total}`);
    for (const item of sample.summary.items || []) {
      const text = (item.visibleText || []).map(v => v.text).filter(Boolean).join(' | ');
      lines.push(`  - ${item.imageRef}: ${item.status}; text=${text || 'none'}; desc=${item.visualDescription || 'none'}; confidence=${item.confidence || 'n/a'}`);
    }
    lines.push('');
  }
  lines.push('## Policy Notes');
  lines.push('');
  lines.push('- Vision output is evidence metadata only; do not merge it as source-backed fact without text/source corroboration.');
  lines.push('- Short prompts are required for yuyu/gpt-5.5 image calls; long schema prompts may return empty assistant content.');
  lines.push('- Use full text from Bilibili detail JSON as the primary source layer; use vision for diagrams, labels, table hints, and image gap tracking.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const inventory = readJson(path.join(planDir, 'source-inventory.json'));
  if (!inventory) throw new Error(`Missing source-inventory.json under ${planDir}`);
  const provider = args.piProvider || 'yuyu';
  const model = args.model || 'gpt-5.5';
  const outRoot = path.join(planDir, 'vision-samples');
  ensureDir(outRoot);
  const samples = [];
  for (const sample of inventory.visionSampleCandidates || []) {
    const outDir = path.join(outRoot, sample.category, sample.opusId);
    ensureDir(outDir);
    const res = runNode('tools/image-vision/cli.cjs', [
      'batch',
      '--manifest', sample.manifestPath,
      '--out', outDir,
      '--concurrency', String(Math.min(Number(args.concurrency || 2), 2)),
      '--maxImages', String(sample.maxImages || 2),
      '--piProvider', provider,
      '--model', model,
      '--attempts', String(args.attempts || 1),
      '--timeoutMs', String(args.timeoutMs || 180000)
    ]);
    const batchReportPath = path.join(outDir, 'batch-report.json');
    const summary = summarizeBatchReport(batchReportPath) || { total: 0, done: 0, blocked: 0, failed: 1, items: [] };
    samples.push({ ...sample, outDir, batchReportPath, exitStatus: res.status, stderr: res.stderr, summary });
  }
  const report = {
    schema: 'gundam-seed-vision-sample-report-v1',
    generatedAt: new Date().toISOString(),
    provider,
    model,
    planDir,
    totals: samples.reduce((acc, s) => {
      acc.total += s.summary.total || 0;
      acc.done += s.summary.done || 0;
      acc.blocked += s.summary.blocked || 0;
      acc.failed += s.summary.failed || 0;
      return acc;
    }, { total: 0, done: 0, blocked: 0, failed: 0 }),
    samples
  };
  writeJson(path.join(planDir, 'vision-sample-report.json'), report);
  writeText(path.join(planDir, 'vision-sample-report.md'), markdown(report));
  writeText(path.join(planDir, 'vision-policy.md'), markdown(report).split('## Policy Notes')[1] ? `# Gundam SEED Vision Policy\n\n## Policy Notes${markdown(report).split('## Policy Notes')[1]}` : '# Gundam SEED Vision Policy\n');
  console.log(JSON.stringify({ ok: true, reportPath: path.join(planDir, 'vision-sample-report.json'), totals: report.totals }, null, 2));
}
main();
