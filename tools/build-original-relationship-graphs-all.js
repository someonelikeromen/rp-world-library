const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function rel(p) { return p.split(path.sep).join('/'); }
function dedupeEdges(edges) {
  const seen = new Set();
  const out = [];
  for (const e of edges) {
    const key = [e.from, e.to, e.type, e.relationshipId || e.id].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}
function buildWorld(world) {
  const curated = path.join(ROOT, world, 'curated');
  const draftPath = path.join(curated, 'original-relationship-semantic-draft.json');
  const entityPath = path.join(curated, 'original-entity-index.json');
  const mergePath = path.join(curated, 'original-relationship-semantic-merge-plan.json');
  if (!exists(draftPath) || !exists(entityPath)) return null;
  const draft = readJson(draftPath);
  const entities = readJson(entityPath);
  const merge = exists(mergePath) ? readJson(mergePath) : null;
  const entityNodes = [];
  const seenNodes = new Set();
  for (const e of entities.entities || []) {
    if (e.kind !== 'character') continue;
    const id = `orig_${String(e.name || e.id).replace(/[\s·・.]+/g, '_').replace(/[：:／/\\]+/g, '_')}`;
    if (seenNodes.has(id)) continue;
    seenNodes.add(id);
    entityNodes.push({
      id,
      label: e.name || e.id,
      type: 'character',
      sourceEntityId: e.id,
      mentions: e.mentions || 0,
      seriesHits: e.seriesHits || {},
      sourceRefs: (e.sourceRefs || []).slice(0, 12)
    });
  }
  for (const n of draft.nodes || []) {
    if (seenNodes.has(n.id)) continue;
    seenNodes.add(n.id);
    entityNodes.push({ ...n, source: 'semantic-draft' });
  }
  const mergeDecisionByRelationship = new Map();
  for (const item of merge?.items || []) mergeDecisionByRelationship.set(item.draftEdgeId, item.decision);
  const edges = dedupeEdges((draft.edges || []).map(e => ({
    id: e.id,
    from: e.from,
    to: e.to,
    type: e.type,
    summary: e.summary,
    evidenceLevel: 'source-backed-draft',
    archiveLayer: 'original-relationship-graph',
    confidence: e.confidence,
    directCoParagraphs: e.directCoParagraphs,
    suggestedLabels: e.suggestedLabels || [],
    semanticKeywordHits: e.semanticKeywordHits || [],
    sourceRefs: e.sourceRefs || [],
    relationshipId: e.relationshipId,
    packetId: e.packetId,
    mergeDecision: mergeDecisionByRelationship.get(e.id) || null,
    promotionStatus: 'archived-original-source-backed-not-manual',
    caution: 'This original relationship graph is source-backed archive data, not a replacement for manually curated relationship-graph.json.'
  })));
  const graph = {
    schema: 'rp-original-relationship-graph-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Source-backed original relationship graph derived from raw-text semantic hints. It is archived runtime/search material and does not replace manually curated relationship-graph.json.',
    coverage: {
      nodes: entityNodes.length,
      edges: edges.length,
      formalRelationshipGraphExists: exists(path.join(curated, 'relationship-graph.json')),
      edgeEvidenceLevel: 'source-backed-draft'
    },
    nodes: entityNodes,
    edges
  };
  writeJson(path.join(curated, 'original-relationship-graph.json'), graph);
  let md = `# ${world} Original Relationship Graph\n\n更新日期：${NOW}\n\n`;
  md += '用途：原著正文归档用 source-backed relationship graph。此文件不替代人工 curated `relationship-graph.json`。\n\n';
  md += `- Nodes: ${entityNodes.length}\n- Edges: ${edges.length}\n- Formal relationship graph exists: ${graph.coverage.formalRelationshipGraphExists ? 'yes' : 'no'}\n\n`;
  md += '| edge | type | evidence | merge decision | refs |\n|---|---|---:|---|---|\n';
  for (const e of edges.slice(0, 140)) {
    md += `| ${e.from} → ${e.to} | ${e.type} | ${e.directCoParagraphs || 0} | ${e.mergeDecision || 'n/a'} | ${(e.sourceRefs || []).slice(0, 3).map(x => '`' + x + '`').join('<br>')} |\n`;
  }
  fs.writeFileSync(path.join(curated, 'original-relationship-graph.md'), md, 'utf8');
  const runtimePath = path.join(curated, 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.originalRelationshipGraph = 'curated/original-relationship-graph.json';
    runtime.files.originalRelationshipGraphMarkdown = 'curated/original-relationship-graph.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.originalRelationshipGraphNodes = entityNodes.length;
    runtime.coverage.originalRelationshipGraphEdges = edges.length;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, nodes: entityNodes.length, edges: edges.length, formalRelationshipGraphExists: graph.coverage.formalRelationshipGraphExists };
}
function validateJson() {
  const files = [];
  function walk(d) {
    if (!exists(d)) return;
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (p.endsWith('.json')) files.push(p);
    }
  }
  walk(ROOT); walk(REPORT_DIR);
  const bad = [];
  for (const f of files) {
    try { JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { bad.push({ file: rel(f), error: e.message }); }
  }
  return { filesChecked: files.length, bad };
}
function main() {
  ensureDir(REPORT_DIR);
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'curated', 'original-runtime-pack.json'))).sort();
  const reports = worlds.map(buildWorld).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-relationship-graph-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Relationship Graph Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮为所有已入库原著世界生成统一 source-backed `original-relationship-graph`，与人工 `relationship-graph.json` 分离。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | nodes | edges | formal graph exists |\n|---|---:|---:|---|\n';
  for (const r of reports) md += `| ${r.world} | ${r.nodes} | ${r.edges} | ${r.formalRelationshipGraphExists ? 'yes' : 'no'} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-relationship-graph-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
