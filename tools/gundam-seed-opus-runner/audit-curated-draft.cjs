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
function issue(severity, type, file, message, extra = {}) { return { severity, type, file, message, ...extra }; }
function auditItems(domain, file, items) {
  const issues = [];
  for (const item of items || []) {
    if (!item.id) issues.push(issue('blocker', 'missing-id', file, `${domain} item missing id`));
    if (!item.name) issues.push(issue('blocker', 'missing-name', file, `${domain} item missing name`, { id: item.id }));
    if (!Array.isArray(item.sourceRefs) || !item.sourceRefs.length) issues.push(issue('blocker', 'missing-sourceRefs', file, `${domain} item missing sourceRefs`, { id: item.id }));
    if (!item.summary) issues.push(issue('major', 'missing-summary', file, `${domain} item missing summary`, { id: item.id }));
    if (!item.evidence || !item.evidence.claimCount) issues.push(issue('major', 'no-evidence-claims', file, `${domain} item has no evidence claims`, { id: item.id }));
    if (item.deployable) issues.push(issue('blocker', 'unexpected-deployable', file, `${domain} item marked deployable`, { id: item.id }));
  }
  return issues;
}
function markdown(report) {
  const lines = [];
  lines.push('# Gundam SEED Curated Draft Audit');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Status: ${report.status}`);
  lines.push(`- Files checked: ${report.counts.filesChecked}`);
  lines.push(`- Domain items: ${report.counts.domainItems}`);
  lines.push(`- Relationships: ${report.counts.relationships}`);
  lines.push(`- Graph nodes: ${report.counts.graphNodes}`);
  lines.push(`- Graph edges: ${report.counts.graphEdges}`);
  lines.push(`- Issues: ${report.counts.issues}`);
  lines.push(`- Blockers: ${report.counts.blockers}`);
  lines.push(`- Major: ${report.counts.major}`);
  lines.push('');
  lines.push('## Domain Counts');
  lines.push('');
  lines.push('| Domain | Count |');
  lines.push('|---|---:|');
  for (const [k, v] of Object.entries(report.counts.byDomain)) lines.push(`| ${k} | ${v} |`);
  lines.push('');
  lines.push('## Relationship Types');
  lines.push('');
  for (const [k, v] of Object.entries(report.counts.relationshipsByType)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Issues');
  lines.push('');
  if (!report.issues.length) lines.push('- None');
  for (const it of report.issues.slice(0, 100)) lines.push(`- [${it.severity}] ${it.type}: ${it.file} — ${it.message}`);
  lines.push('');
  lines.push('## Deploy Guard');
  lines.push('');
  for (const b of report.deployBlockers) lines.push(`- ${b}`);
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const draftRoot = path.join(planDir, 'candidates', 'curated-draft');
  const domains = {
    characters: 'characters.json',
    mobileSuits: 'mobile-suits.json',
    warships: 'warships.json',
    events: 'events.json',
    rules: 'rules.json',
    interpretations: 'interpretations.json'
  };
  const issues = [];
  const byDomain = {};
  let filesChecked = 0;
  let domainItems = 0;
  for (const [domain, file] of Object.entries(domains)) {
    const p = path.join(draftRoot, file);
    const data = readJson(p, null);
    filesChecked++;
    if (!data || !Array.isArray(data.items)) {
      issues.push(issue('blocker', 'invalid-domain-file', `candidates/curated-draft/${file}`, 'domain file missing items array'));
      byDomain[domain] = 0;
      continue;
    }
    byDomain[domain] = data.items.length;
    domainItems += data.items.length;
    issues.push(...auditItems(domain, `candidates/curated-draft/${file}`, data.items));
  }
  const world = readJson(path.join(draftRoot, 'world.json'), null); filesChecked++;
  const sourceMap = readJson(path.join(draftRoot, 'source-map.json'), null); filesChecked++;
  const graph = readJson(path.join(draftRoot, 'graph.json'), null); filesChecked++;
  const relationships = readJson(path.join(draftRoot, 'relationships.json'), null); filesChecked++;
  const timeline = readJson(path.join(draftRoot, 'timeline.json'), null); filesChecked++;
  if (!world || world.status !== 'draft-not-deployable') issues.push(issue('blocker', 'bad-world-status', 'candidates/curated-draft/world.json', 'world must exist and remain draft-not-deployable'));
  if (!sourceMap || !Array.isArray(sourceMap.sources)) issues.push(issue('blocker', 'bad-source-map', 'candidates/curated-draft/source-map.json', 'source map missing sources'));
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) issues.push(issue('blocker', 'bad-graph', 'candidates/curated-draft/graph.json', 'graph missing nodes/edges'));
  if (!relationships || !Array.isArray(relationships.relationships)) issues.push(issue('blocker', 'bad-relationships', 'candidates/curated-draft/relationships.json', 'relationships missing array'));
  if (!timeline || !Array.isArray(timeline.items)) issues.push(issue('major', 'bad-timeline', 'candidates/curated-draft/timeline.json', 'timeline missing items'));
  const rels = relationships && Array.isArray(relationships.relationships) ? relationships.relationships : [];
  for (const r of rels) {
    if (!r.relationshipId || !r.from || !r.to || !r.type) issues.push(issue('blocker', 'bad-relationship-record', 'candidates/curated-draft/relationships.json', 'relationship missing id/from/to/type'));
    if (r.deployable) issues.push(issue('blocker', 'relationship-unexpected-deployable', 'candidates/curated-draft/relationships.json', 'relationship marked deployable', { relationshipId: r.relationshipId }));
  }
  const blockers = issues.filter(i => i.severity === 'blocker').length;
  const major = issues.filter(i => i.severity === 'major').length;
  const relationshipsByType = rels.reduce((acc, r) => { acc[r.type || 'unknown'] = (acc[r.type || 'unknown'] || 0) + 1; return acc; }, {});
  const report = {
    schema: 'gundam-seed-curated-draft-audit-v1',
    generatedAt: new Date().toISOString(),
    status: blockers ? 'failed' : (major ? 'passed-with-gaps' : 'passed-not-deployable'),
    counts: {
      filesChecked,
      domainItems,
      relationships: rels.length,
      graphNodes: graph ? graph.nodeCount || (graph.nodes || []).length : 0,
      graphEdges: graph ? graph.edgeCount || (graph.edges || []).length : 0,
      timelineItems: timeline ? (timeline.items || []).length : 0,
      sourceRecords: sourceMap ? (sourceMap.sources || []).length : 0,
      byDomain,
      relationshipsByType,
      issues: issues.length,
      blockers,
      major,
      minor: issues.filter(i => i.severity === 'minor').length
    },
    issues,
    deployBlockers: [
      'curated draft remains candidate-only',
      'semantic relationship extraction is partial',
      'conflict review and world_query deployment validation not run',
      'do not copy to formal curated library automatically'
    ]
  };
  writeJson(path.join(planDir, 'audit', 'curated-draft-audit.json'), report);
  writeText(path.join(planDir, 'audit', 'curated-draft-audit.md'), markdown(report));
  const oldReport = readJson(path.join(planDir, 'reports', 'curated-draft-report.json'), null) || {};
  oldReport.relationships = { count: rels.length, byType: relationshipsByType, status: relationships ? relationships.status : 'missing' };
  oldReport.curatedDraftAudit = { status: report.status, issues: issues.length, blockers, major, path: 'audit/curated-draft-audit.json' };
  writeJson(path.join(planDir, 'reports', 'curated-draft-report.json'), oldReport);
  console.log(JSON.stringify({ ok: true, status: report.status, counts: report.counts }, null, 2));
}
main();
