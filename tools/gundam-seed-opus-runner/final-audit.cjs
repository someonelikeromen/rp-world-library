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
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
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
      else if (f.endsWith(suffix)) out.push(f);
    }
  }
  walk(dir);
  return out.sort();
}
function rel(base, file) { return path.relative(base, file).replace(/\\/g, '/'); }
function validateJsonFiles(planDir) {
  const files = [
    ...listFiles(path.join(planDir, 'sources'), '.json'),
    ...listFiles(path.join(planDir, 'extracted'), '.json'),
    ...listFiles(path.join(planDir, 'audit'), '.json'),
    ...listFiles(path.join(planDir, 'intermediate'), '.json'),
    ...listFiles(path.join(planDir, 'group-merged'), '.json'),
    ...listFiles(path.join(planDir, 'merged'), '.json'),
    ...listFiles(path.join(planDir, 'normalized'), '.json'),
    ...listFiles(path.join(planDir, 'candidates'), '.json'),
    ...listFiles(path.join(planDir, 'graph'), '.json'),
    ...listFiles(path.join(planDir, 'reports'), '.json'),
    ...listFiles(path.join(planDir, 'work-packets-v2'), '.json')
  ];
  const seen = [...new Set(files)];
  const errors = [];
  for (const file of seen) {
    try { JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (err) { errors.push({ file: rel(planDir, file), error: err.message }); }
  }
  return { checked: seen.length, errors };
}
function markdownFinal(report) {
  const lines = [];
  lines.push('# Gundam SEED Final Pass Audit');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Status: ${report.status}`);
  lines.push(`- JSON checked: ${report.jsonValidation.checked}`);
  lines.push(`- JSON errors: ${report.jsonValidation.errors.length}`);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  for (const [k, v] of Object.entries(report.counts)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Packet Gates');
  lines.push('');
  lines.push('| Wave | Packet | Minimum | Extended | Can Advance | Open | Blocked |');
  lines.push('|---|---|---|---|---|---:|---:|');
  for (const p of report.packetStatuses) lines.push(`| ${p.waveId} | ${p.packetId} | ${p.minimumGate} | ${p.extendedGate} | ${p.canAdvance} | ${p.openIssues} | ${p.blockedIssues} |`);
  lines.push('');
  lines.push('## Deployment Decision');
  lines.push('');
  lines.push(`- Decision: ${report.deployment.decision}`);
  for (const b of report.deployment.blockers) lines.push(`- Blocker: ${b}`);
  lines.push('');
  lines.push('## Next Required Work');
  lines.push('');
  for (const n of report.nextRequiredWork) lines.push(`- ${n}`);
  lines.push('');
  return lines.join('\n');
}
function markdownMigration(report) {
  const lines = [];
  lines.push('# Gundam SEED Migration Recommendation');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Recommendation: ${report.deployment.decision}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('The current automated pass produced a complete source-backed candidate layer, but it is not deployable to the curated world library yet.');
  lines.push('');
  lines.push('Reasons:');
  lines.push('');
  for (const b of report.deployment.blockers) lines.push(`- ${b}`);
  lines.push('');
  lines.push('## Allowed');
  lines.push('');
  lines.push('- Use `sources/`, `extracted/`, `intermediate/`, `group-merged/`, `merged/final-candidate/`, and `graph/candidate-graph.json` as audit inputs.');
  lines.push('- Continue domain audit/fix over base SEED only.');
  lines.push('- Preserve extension candidates separately.');
  lines.push('');
  lines.push('## Forbidden');
  lines.push('');
  lines.push('- Do not copy `merged/final-candidate/` to the formal curated world library.');
  lines.push('- Do not merge extension candidates into base SEED.');
  lines.push('- Do not treat author interpretation fragments as canon facts.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const generatedAt = new Date().toISOString();
  const inventory = readJson(path.join(planDir, 'source-inventory.json')) || {};
  const extraction = readJson(path.join(planDir, 'reports', 'automated-extraction-report.json')) || {};
  const merge = readJson(path.join(planDir, 'reports', 'merge-candidate-report.json')) || {};
  const deploy = readJson(path.join(planDir, 'reports', 'candidate-deploy-review.json')) || {};
  const normalizedAudit = readJson(path.join(planDir, 'audit', 'normalized-candidate-audit.json')) || {};
  const candidateArchive = readJson(path.join(planDir, 'reports', 'candidate-archive-report.json')) || {};
  const packetStatusFiles = listFiles(path.join(planDir, 'audit', 'packet-audits'), 'final-status.json');
  const packetStatuses = packetStatusFiles.map(f => ({ ...readJson(f), path: rel(planDir, f) })).filter(Boolean);
  const gapFiles = listFiles(path.join(planDir, 'audit', 'extended-coverage'), 'extended-gap-index.json');
  const gaps = gapFiles.flatMap(f => ((readJson(f) || {}).gaps || []).map(g => ({ ...g, packetGapRef: rel(planDir, f) })));
  const jsonValidation = validateJsonFiles(planDir);
  const blockedPackets = packetStatuses.filter(p => !p.canAdvance);
  const extendedPartial = packetStatuses.filter(p => p.extendedGate === 'partial');
  const status = jsonValidation.errors.length === 0 && blockedPackets.length === 0 ? 'candidate-layer-valid-deploy-blocked' : 'failed';
  const report = {
    schema: 'gundam-seed-final-pass-audit-v1',
    generatedAt,
    status,
    counts: {
      sourceInventoryItems: (inventory.items || []).length,
      sourceRecords: extraction.totals ? extraction.totals.sources : 0,
      fragments: extraction.totals ? extraction.totals.fragments : 0,
      baseSeedCandidateEntities: merge.counts ? merge.counts.baseSeedCandidateEntities : 0,
      extensionCandidateEntities: merge.counts ? merge.counts.extensionCandidateEntities : 0,
      packetStatuses: packetStatuses.length,
      gapFiles: gapFiles.length,
      gaps: gaps.length,
      extendedPartialPackets: extendedPartial.length,
      normalizedCandidates: normalizedAudit.counts ? normalizedAudit.counts.files : 0,
      normalizedAuditIssues: normalizedAudit.counts ? normalizedAudit.counts.issues : 0,
      candidateBaseSeedEntities: candidateArchive.counts ? candidateArchive.counts.baseSeedEntities : 0,
      candidateExtensionEntities: candidateArchive.counts ? candidateArchive.counts.extensionCandidateEntities : 0
    },
    jsonValidation,
    packetStatuses: packetStatuses.map(p => ({ waveId: p.waveId, packetId: p.packetId, minimumGate: p.minimumGate, extendedGate: p.extendedGate, canAdvance: p.canAdvance, openIssues: p.openIssues, blockedIssues: p.blockedIssues, path: p.path })),
    gapSummary: {
      byType: gaps.reduce((acc, g) => { acc[g.type] = (acc[g.type] || 0) + 1; return acc; }, {}),
      bySeverity: gaps.reduce((acc, g) => { acc[g.severity] = (acc[g.severity] || 0) + 1; return acc; }, {})
    },
    deployment: {
      decision: 'do-not-deploy-to-curated-yet',
      status: deploy.status || 'blocked',
      blockers: deploy.blockers || ['deployment review missing or blocked']
    },
    nextRequiredWork: [
      'Run domain-specific audit/fix for rules, characters, mobile suits, warships, events, and interpretations.',
      'Promote only audited source-backed claims from fragments into normalized entity files.',
      'Keep extension candidates in a separate continuity layer.',
      'Resolve interpretation/canon boundaries before final merge.',
      'Run world_query validation only after curated candidate normalization.'
    ]
  };
  writeJson(path.join(planDir, 'audit', 'final-pass-report.json'), report);
  writeText(path.join(planDir, 'audit', 'final-pass-report.md'), markdownFinal(report));
  writeText(path.join(planDir, 'comparison', 'migration-recommendation.md'), markdownMigration(report));
  console.log(JSON.stringify({ ok: true, status: report.status, report: path.join(planDir, 'audit', 'final-pass-report.json'), counts: report.counts, jsonErrors: report.jsonValidation.errors.length }, null, 2));
}
main();
