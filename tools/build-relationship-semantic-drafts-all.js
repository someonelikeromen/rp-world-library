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
function safeId(s) { return String(s || '').replace(/^character:/, '').replace(/[\s·・.]+/g, '_').replace(/[：:／/\\]+/g, '_'); }
function edgeType(labels) {
  if (labels.includes('lord-knight-or-protector-dynamic') && labels.includes('possible-romantic-tension')) return 'protector-ally-possible-affection-draft';
  if (labels.includes('lord-knight-or-protector-dynamic')) return 'protector-or-service-draft';
  if (labels.includes('possible-romantic-tension') && labels.includes('ally-or-companion')) return 'ally-possible-affection-draft';
  if (labels.includes('possible-romantic-tension')) return 'possible-affection-draft';
  if (labels.includes('conflict-or-rivalry') && labels.includes('rivalry')) return 'rivalry-conflict-draft';
  if (labels.includes('conflict-or-rivalry')) return 'conflict-contact-draft';
  if (labels.includes('ally-or-companion')) return 'ally-or-companion-draft';
  if (labels.includes('possible-family-relation')) return 'possible-family-context-draft';
  return 'major-cooccurrence-draft';
}
function summary(h) {
  const cats = (h.semanticKeywordHits || []).slice(0, 4).map(c => `${c.category}:${c.count}`).join(', ');
  return `${h.sourceName} 与 ${h.targetName} 在 ${h.directCoParagraphs} 个共同段落中共同出现；关键词提示为 ${cats || '无明显关键词'}。此关系为原著正文提示草案，需人工阅读 sourceRefs 后确认语义。`;
}
function buildWorld(world) {
  const curated = path.join(ROOT, world, 'curated');
  const hintsPath = path.join(curated, 'original-relationship-semantic-hints.json');
  if (!exists(hintsPath)) return null;
  const hintsDoc = readJson(hintsPath);
  const hints = (hintsDoc.hints || []).filter(h => h.confidence === 'hint-rich');
  const nodes = [];
  const nodeIds = new Set();
  const edges = [];
  for (const h of hints) {
    const from = `orig_${safeId(h.sourceName)}`;
    const to = `orig_${safeId(h.targetName)}`;
    if (!nodeIds.has(from)) {
      nodeIds.add(from);
      nodes.push({ id: from, label: h.sourceName, type: 'character', sourceEntity: h.source, draft: true });
    }
    if (!nodeIds.has(to)) {
      nodeIds.add(to);
      nodes.push({ id: to, label: h.targetName, type: 'character', sourceEntity: h.target, draft: true });
    }
    edges.push({
      id: `draft:${safeId(h.relationshipId)}`,
      from,
      to,
      type: edgeType(h.suggestedLabels || []),
      summary: summary(h),
      evidenceLevel: 'draft-hint',
      confidence: h.confidence,
      directCoParagraphs: h.directCoParagraphs,
      semanticKeywordHits: (h.semanticKeywordHits || []).slice(0, 8),
      suggestedLabels: h.suggestedLabels || [],
      sourceRefs: (h.chapterEvidence || []).map(e => e.sourceRef).slice(0, 12),
      relationshipId: h.relationshipId,
      packetId: h.packetId,
      promotionStatus: 'requires-human-confirmation',
      caution: 'Do not merge into curated relationship-graph without reading sourceRefs and assigning a confirmed semantic label.'
    });
  }
  const draft = {
    schema: 'rp-original-relationship-semantic-draft-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Compatible draft graph edges derived from semantic hints. Not part of curated relationship-graph until human confirmation.',
    coverage: { nodes: nodes.length, edges: edges.length, sourceHints: hints.length },
    nodes,
    edges
  };
  writeJson(path.join(curated, 'original-relationship-semantic-draft.json'), draft);
  let md = `# ${world} Original Relationship Semantic Draft\n\n更新日期：${NOW}\n\n`;
  md += '用途：把 hint-rich 关系提示转成与 relationship-graph 边结构兼容的草案。此文件不自动合并正式图谱。\n\n';
  md += `- Draft nodes: ${nodes.length}\n- Draft edges: ${edges.length}\n\n`;
  md += '| edge | type | direct paragraphs | source refs |\n|---|---|---:|---|\n';
  for (const e of edges.slice(0, 120)) {
    md += `| ${e.from} → ${e.to} | ${e.type} | ${e.directCoParagraphs} | ${e.sourceRefs.slice(0, 3).map(x => '`' + x + '`').join('<br>')} |\n`;
  }
  fs.writeFileSync(path.join(curated, 'original-relationship-semantic-draft.md'), md, 'utf8');
  const runtimePath = path.join(curated, 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.relationshipSemanticDraft = 'curated/original-relationship-semantic-draft.json';
    runtime.files.relationshipSemanticDraftMarkdown = 'curated/original-relationship-semantic-draft.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.relationshipSemanticDraftEdges = edges.length;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, nodes: nodes.length, edges: edges.length };
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
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'curated', 'original-relationship-semantic-hints.json'))).sort();
  const reports = worlds.map(buildWorld).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-relationship-semantic-draft-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Relationship Semantic Draft Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮把 hint-rich 关系提示转换为独立草案图。草案不合并正式 relationship-graph。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | draft nodes | draft edges |\n|---|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.nodes} | ${r.edges} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-relationship-semantic-draft-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
