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
function issue(severity, type, file, message, extra = {}) { return { severity, type, file, message, ...extra }; }
function md(report) {
  const lines = [];
  lines.push('# Gundam SEED Normalized Candidate Audit');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Status: ${report.status}`);
  lines.push(`- Files checked: ${report.counts.files}`);
  lines.push(`- Issues: ${report.counts.issues}`);
  lines.push(`- Blockers: ${report.counts.blockers}`);
  lines.push(`- Major: ${report.counts.major}`);
  lines.push(`- Minor: ${report.counts.minor}`);
  lines.push('');
  lines.push('## Domain Counts');
  lines.push('');
  lines.push('| Domain | Count |');
  lines.push('|---|---:|');
  for (const [k, v] of Object.entries(report.counts.byDomain)) lines.push(`| ${k} | ${v} |`);
  lines.push('');
  lines.push('## Layer Counts');
  lines.push('');
  for (const [k, v] of Object.entries(report.counts.byLayer)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Issue Summary');
  lines.push('');
  for (const [k, v] of Object.entries(report.counts.byIssueType)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## First Issues');
  lines.push('');
  for (const it of report.issues.slice(0, 80)) lines.push(`- [${it.severity}] ${it.type}: ${it.file} — ${it.message}`);
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const files = listFiles(path.join(planDir, 'normalized'), '.json');
  const issues = [];
  const counts = { files: 0, byDomain: {}, byLayer: {}, sourceBackedClaims: 0, interpretationNotes: 0, deployable: 0 };
  for (const file of files) {
    const r = readJson(file, null);
    const rf = rel(planDir, file);
    if (!r) { issues.push(issue('blocker', 'invalid-json', rf, 'JSON parse failed')); continue; }
    counts.files++;
    counts.byDomain[r.domain || 'unknown'] = (counts.byDomain[r.domain || 'unknown'] || 0) + 1;
    counts.byLayer[r.normalizedLayer || 'unknown'] = (counts.byLayer[r.normalizedLayer || 'unknown'] || 0) + 1;
    counts.sourceBackedClaims += (((r.sourceBacked || {}).claims || []).length);
    counts.interpretationNotes += ((r.interpretationNotes || []).length);
    if (r.coverage && r.coverage.deployable) counts.deployable++;
    if (!r.entityId) issues.push(issue('blocker', 'missing-entity-id', rf, 'entityId missing'));
    if (!r.name) issues.push(issue('major', 'missing-name', rf, 'name missing'));
    if (!Array.isArray(r.sourceRefs) || !r.sourceRefs.length) issues.push(issue('blocker', 'missing-sourceRefs', rf, 'sourceRefs missing'));
    if (!Array.isArray(r.sourceRecordRefs) || !r.sourceRecordRefs.length) issues.push(issue('major', 'missing-sourceRecordRefs', rf, 'sourceRecordRefs missing'));
    if (!r.fragmentRef) issues.push(issue('major', 'missing-fragmentRef', rf, 'fragmentRef missing'));
    if (r.normalizedLayer === 'base-seed' && r.mergePolicy !== 'eligible-for-base-seed-audit-merge') issues.push(issue('major', 'bad-base-merge-policy', rf, 'base item does not use base merge policy'));
    if (r.normalizedLayer === 'extension-candidates' && r.mergePolicy !== 'preserve-only-do-not-merge-into-base-seed') issues.push(issue('blocker', 'bad-extension-merge-policy', rf, 'extension item is not preserve-only'));
    if (r.normalizedLayer === 'base-seed' && r.scope !== 'seed_core') issues.push(issue('blocker', 'extension-in-base-layer', rf, 'non seed_core item appears in base layer'));
    if (r.coverage && r.coverage.deployable) issues.push(issue('blocker', 'unexpected-deployable', rf, 'normalized candidates must not be deployable yet'));
    const claims = ((r.sourceBacked || {}).claims || []);
    if (!claims.length && !['interpretations', 'source-excerpts'].includes(r.domain)) issues.push(issue('major', 'no-source-backed-claims', rf, 'domain candidate has no source-backed claims'));
    for (const c of claims) {
      if (/飞燕惊澜：/.test(c.text || '')) issues.push(issue('major', 'unsplit-author-analysis', rf, 'source-backed claim still contains author analysis marker', { claimId: c.claimId }));
      if (!c.sourceRef) issues.push(issue('major', 'claim-missing-sourceRef', rf, 'claim missing sourceRef', { claimId: c.claimId }));
    }
    for (const n of (r.interpretationNotes || [])) {
      if (n.canonStatus !== 'interpretation-only') issues.push(issue('major', 'interpretation-note-bad-status', rf, 'interpretation note is not interpretation-only'));
    }
  }
  counts.issues = issues.length;
  counts.blockers = issues.filter(i => i.severity === 'blocker').length;
  counts.major = issues.filter(i => i.severity === 'major').length;
  counts.minor = issues.filter(i => i.severity === 'minor').length;
  counts.byDomain = Object.fromEntries(Object.entries(counts.byDomain).sort());
  counts.byLayer = Object.fromEntries(Object.entries(counts.byLayer).sort());
  counts.byIssueType = issues.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {});
  counts.byIssueType = Object.fromEntries(Object.entries(counts.byIssueType).sort());
  const report = {
    schema: 'gundam-seed-normalized-candidate-audit-v1',
    generatedAt: new Date().toISOString(),
    status: counts.blockers === 0 ? 'passed-with-major-gaps' : 'failed',
    counts,
    issues,
    recommendation: counts.blockers === 0 ? 'Proceed to domain-specific fix/audit; still do not deploy.' : 'Fix blockers before any merge advancement.'
  };
  writeJson(path.join(planDir, 'audit', 'normalized-candidate-audit.json'), report);
  writeText(path.join(planDir, 'audit', 'normalized-candidate-audit.md'), md(report));
  console.log(JSON.stringify({ ok: true, status: report.status, counts }, null, 2));
}
main();
