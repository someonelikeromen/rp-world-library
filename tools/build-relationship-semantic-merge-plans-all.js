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
function norm(s) { return String(s || '').toLowerCase().replace(/[\s·・.\-_/／:：，,、()（）\[\]【】]/g, ''); }
function labelMatches(label, sourceEntity) {
  const labelNorm = norm(label);
  const names = [String(sourceEntity || '').replace(/^character:/, ''), String(sourceEntity || '')].map(norm).filter(Boolean);
  return names.some(n => labelNorm === n || labelNorm.includes(n) || n.includes(labelNorm));
}
function nodeCandidates(graph, sourceEntity) {
  if (!graph) return [];
  return (graph.nodes || [])
    .filter(n => labelMatches(n.label || n.id, sourceEntity) || labelMatches(n.characterRef || '', sourceEntity) || labelMatches(n.id || '', sourceEntity))
    .map(n => ({ id: n.id, label: n.label, type: n.type, characterRef: n.characterRef }))
    .slice(0, 8);
}
function hasFormalEdge(graph, fromCandidates, toCandidates) {
  if (!graph || !fromCandidates.length || !toCandidates.length) return [];
  const fromIds = new Set(fromCandidates.map(n => n.id));
  const toIds = new Set(toCandidates.map(n => n.id));
  return (graph.edges || []).filter(e => (fromIds.has(e.from) && toIds.has(e.to)) || (fromIds.has(e.to) && toIds.has(e.from))).map(e => ({ from: e.from, to: e.to, type: e.type, summary: e.summary, evidenceLevel: e.evidenceLevel, sourceRefs: e.sourceRefs || [] }));
}
function decision(graph, fromCandidates, toCandidates, existingEdges) {
  if (!graph) return 'no-formal-graph-create-or-curate-first';
  if (!fromCandidates.length || !toCandidates.length) return 'needs-node-mapping-before-merge';
  if (existingEdges.length) return 'possible-existing-formal-edge-review-duplicate';
  return 'candidate-new-edge-needs-human-confirmation';
}
function buildWorld(world) {
  const curated = path.join(ROOT, world, 'curated');
  const draftPath = path.join(curated, 'original-relationship-semantic-draft.json');
  if (!exists(draftPath)) return null;
  const draft = readJson(draftPath);
  const graphPath = path.join(curated, 'relationship-graph.json');
  const graph = exists(graphPath) ? readJson(graphPath) : null;
  const items = (draft.edges || []).map(edge => {
    const fromNode = (draft.nodes || []).find(n => n.id === edge.from);
    const toNode = (draft.nodes || []).find(n => n.id === edge.to);
    const fromCandidates = nodeCandidates(graph, fromNode?.sourceEntity || fromNode?.label || edge.from);
    const toCandidates = nodeCandidates(graph, toNode?.sourceEntity || toNode?.label || edge.to);
    const existingEdges = hasFormalEdge(graph, fromCandidates, toCandidates);
    return {
      draftEdgeId: edge.id,
      sourceEntity: fromNode?.sourceEntity,
      targetEntity: toNode?.sourceEntity,
      draftType: edge.type,
      draftSummary: edge.summary,
      directCoParagraphs: edge.directCoParagraphs,
      suggestedLabels: edge.suggestedLabels || [],
      sourceRefs: edge.sourceRefs || [],
      formalFromCandidates: fromCandidates,
      formalToCandidates: toCandidates,
      existingFormalEdges: existingEdges,
      decision: decision(graph, fromCandidates, toCandidates, existingEdges),
      requiredAction: 'Manual reviewer must read sourceRefs, confirm entity mapping, then either update existing edge summary/sourceRefs or add a new confirmed semantic edge.'
    };
  });
  const byDecision = items.reduce((m, i) => (m[i.decision] = (m[i.decision] || 0) + 1, m), {});
  const plan = {
    schema: 'rp-original-relationship-semantic-merge-plan-v1',
    worldId: world,
    createdAt: NOW,
    formalGraph: graph ? 'curated/relationship-graph.json' : null,
    policy: 'Pre-merge plan for semantic draft edges. This file does not modify curated relationship-graph. All decisions require human source review.',
    coverage: { draftEdges: items.length, byDecision },
    items
  };
  writeJson(path.join(curated, 'original-relationship-semantic-merge-plan.json'), plan);
  let md = `# ${world} Original Relationship Semantic Merge Plan\n\n更新日期：${NOW}\n\n`;
  md += '用途：把 semantic draft 与正式 relationship-graph 对照，形成合并前计划。此文件不自动合并正式图谱。\n\n';
  md += `- Formal graph: ${graph ? '`curated/relationship-graph.json`' : 'none'}\n- Draft edges: ${items.length}\n`;
  for (const [k, v] of Object.entries(byDecision).sort()) md += `- ${k}: ${v}\n`;
  md += '\n## Merge Decisions\n\n| draft edge | decision | draft type | mapping | existing formal edge | refs |\n|---|---|---|---|---|---|\n';
  for (const i of items.slice(0, 160)) {
    const mapping = `${(i.formalFromCandidates || []).slice(0, 2).map(n => n.id).join('/') || '?'} → ${(i.formalToCandidates || []).slice(0, 2).map(n => n.id).join('/') || '?'}`;
    const existing = (i.existingFormalEdges || []).slice(0, 2).map(e => `${e.from}->${e.to}:${e.type}`).join('<br>') || '—';
    md += `| ${i.sourceEntity} ↔ ${i.targetEntity} | ${i.decision} | ${i.draftType} | ${mapping} | ${existing} | ${i.sourceRefs.slice(0, 2).map(x => '`' + x + '`').join('<br>')} |\n`;
  }
  fs.writeFileSync(path.join(curated, 'original-relationship-semantic-merge-plan.md'), md, 'utf8');
  const runtimePath = path.join(curated, 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.relationshipSemanticMergePlan = 'curated/original-relationship-semantic-merge-plan.json';
    runtime.files.relationshipSemanticMergePlanMarkdown = 'curated/original-relationship-semantic-merge-plan.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.relationshipSemanticMergePlanEdges = items.length;
    runtime.coverage.relationshipSemanticMergePlanDecisions = byDecision;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, formalGraph: !!graph, draftEdges: items.length, byDecision };
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
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'curated', 'original-relationship-semantic-draft.json'))).sort();
  const reports = worlds.map(buildWorld).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-relationship-semantic-merge-plan-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Relationship Semantic Merge Plan Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮把 semantic draft 与正式 relationship-graph 对照，生成合并前计划；不自动修改正式图谱。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | formal graph | draft edges | key decisions |\n|---|---|---:|---|\n';
  for (const r of reports) {
    const decisions = Object.entries(r.byDecision).sort().map(([k, v]) => `${k}:${v}`).join('<br>');
    md += `| ${r.world} | ${r.formalGraph ? 'yes' : 'no'} | ${r.draftEdges} | ${decisions} |\n`;
  }
  fs.writeFileSync(path.join(REPORT_DIR, 'original-relationship-semantic-merge-plan-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
