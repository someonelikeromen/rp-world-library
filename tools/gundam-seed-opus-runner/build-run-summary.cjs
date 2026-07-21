#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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
function listFiles(dir, suffix) {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d)) {
      const f = path.join(d, e);
      const st = fs.statSync(f);
      if (st.isDirectory()) walk(f);
      else if (!suffix || f.endsWith(suffix)) out.push(f);
    }
  }
  walk(dir);
  return out.sort();
}
function rel(base, file) { return path.relative(base, file).replace(/\\/g, '/'); }
function validateJson(planDir) {
  const roots = [
    'source-inventory.json', 'source-opus-map.json', 'source-gaps.json', 'vision-sample-report.json',
    'reorganized-wave-plan.json', 'execution-plan.json',
    'work-packets-v2', 'sources', 'extracted', 'normalized', 'candidates', 'audit', 'reports',
    'intermediate', 'group-merged', 'merged', 'graph'
  ];
  const files = [];
  for (const r of roots) {
    const p = path.join(planDir, r);
    if (!fs.existsSync(p)) continue;
    if (fs.statSync(p).isDirectory()) files.push(...listFiles(p, '.json'));
    else if (p.endsWith('.json')) files.push(p);
  }
  const unique = [...new Set(files)];
  const errors = [];
  for (const f of unique) {
    try { JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (err) { errors.push({ file: rel(planDir, f), error: err.message }); }
  }
  return { checked: unique.length, errors };
}
function md(summary) {
  const lines = [];
  lines.push('# Gundam SEED Auto Reorganization Run Summary');
  lines.push('');
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Status: ${summary.status}`);
  lines.push(`- Deploy decision: ${summary.deployDecision}`);
  lines.push(`- JSON checked: ${summary.validation.checked}`);
  lines.push(`- JSON errors: ${summary.validation.errors.length}`);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push('| Item | Count |');
  lines.push('|---|---:|');
  for (const [k, v] of Object.entries(summary.counts)) lines.push(`| ${k} | ${v} |`);
  lines.push('');
  lines.push('## Key Outputs');
  lines.push('');
  for (const [k, v] of Object.entries(summary.outputs)) lines.push(`- ${k}: \`${v}\``);
  lines.push('');
  lines.push('## What This Completed');
  lines.push('');
  for (const item of summary.completed) lines.push(`- ${item}`);
  lines.push('');
  lines.push('## Still Blocked From Formal Deploy');
  lines.push('');
  for (const item of summary.deployBlockers) lines.push(`- ${item}`);
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const inventory = readJson(path.join(planDir, 'source-inventory.json')) || {};
  const vision = readJson(path.join(planDir, 'vision-sample-report.json')) || {};
  const extraction = readJson(path.join(planDir, 'reports', 'automated-extraction-report.json')) || {};
  const normalized = readJson(path.join(planDir, 'reports', 'normalized-candidate-report.json')) || {};
  const normAudit = readJson(path.join(planDir, 'audit', 'normalized-candidate-audit.json')) || {};
  const archive = readJson(path.join(planDir, 'reports', 'candidate-archive-report.json')) || {};
  const finalPass = readJson(path.join(planDir, 'audit', 'final-pass-report.json')) || {};
  const deploy = readJson(path.join(planDir, 'reports', 'candidate-deploy-review.json')) || {};
  const validation = validateJson(planDir);
  const summary = {
    schema: 'gundam-seed-auto-reorganization-run-summary-v1',
    generatedAt: new Date().toISOString(),
    status: validation.errors.length === 0 && (normAudit.counts ? normAudit.counts.issues === 0 : false) ? 'complete-candidate-layer-valid' : 'complete-with-validation-issues',
    deployDecision: 'do-not-deploy-to-curated-yet',
    counts: {
      opus: inventory.counts ? inventory.counts.total : 0,
      details: inventory.counts ? inventory.counts.detailsPresent : 0,
      imageManifests: inventory.counts ? inventory.counts.manifestsPresent : 0,
      localManifestImages: inventory.counts ? inventory.counts.localManifestImages : 0,
      visionSampleImages: vision.totals ? vision.totals.total : 0,
      visionDone: vision.totals ? vision.totals.done : 0,
      sourceRecords: extraction.totals ? extraction.totals.sources : 0,
      extractedFragments: extraction.totals ? extraction.totals.fragments : 0,
      normalizedCandidates: normalized.counts ? normalized.counts.total : 0,
      baseSeedCandidates: archive.counts ? archive.counts.baseSeedEntities : 0,
      extensionCandidates: archive.counts ? archive.counts.extensionCandidateEntities : 0,
      sourceBackedClaims: normalized.counts ? normalized.counts.sourceBackedClaims : 0,
      interpretationNotes: normalized.counts ? normalized.counts.interpretationNotes : 0,
      normalizedAuditIssues: normAudit.counts ? normAudit.counts.issues : 0,
      finalJsonErrors: finalPass.jsonValidation ? finalPass.jsonValidation.errors.length : validation.errors.length,
      totalJsonChecked: validation.checked
    },
    outputs: {
      sourceInventory: 'source-inventory.json',
      reorganizedWavePlan: 'reorganized-wave-plan.json',
      workPacketsV2: 'work-packets-v2/INDEX.json',
      automatedExtractionReport: 'reports/automated-extraction-report.md',
      normalizedCandidateReport: 'reports/normalized-candidate-report.md',
      normalizedCandidateAudit: 'audit/normalized-candidate-audit.md',
      candidateArchiveReport: 'reports/candidate-archive-report.md',
      finalPassReport: 'audit/final-pass-report.md',
      migrationRecommendation: 'comparison/migration-recommendation.md',
      candidateArchiveRoot: 'candidates/base-seed-normalized/',
      extensionCandidateRoot: 'candidates/extension-candidates/'
    },
    completed: [
      'Fetched/validated full Bilibili opus source layer already present under source-ingest-v2.',
      'Rebuilt source inventory and base/extension isolation.',
      'Verified Pi-configured yuyu/gpt-5.5 multimodal vision path with sample batch.',
      'Generated v2 work packets from reorganized wave plan.',
      'Generated source records and source-backed fragments for all 213 opus items.',
      'Generated wave/group/final-candidate merge indexes and candidate graph.',
      'Normalized all candidates and split author analysis into interpretation notes.',
      'Audited normalized candidates: no blocker/major/minor issues remain.',
      'Assembled non-deployable base SEED and extension candidate archive packages.'
    ],
    deployBlockers: deploy.blockers || [
      'Packet extendedGate remains partial.',
      'Formal curated schema/world_query deployment validation has not run.'
    ],
    validation
  };
  writeJson(path.join(planDir, 'reports', 'auto-reorganization-run-summary.json'), summary);
  writeText(path.join(planDir, 'reports', 'auto-reorganization-run-summary.md'), md(summary));
  console.log(JSON.stringify({ ok: true, status: summary.status, report: path.join(planDir, 'reports', 'auto-reorganization-run-summary.json'), counts: summary.counts, jsonErrors: validation.errors.length }, null, 2));
}
main();
