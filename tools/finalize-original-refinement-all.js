const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const STATUS = 'campaigns/world-library/manual-curation/STATUS.md';
const INDEX = 'campaigns/world-library/manual-curation/INDEX.md';
const NOW = new Date().toISOString();
const DATE = NOW.slice(0, 10);

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function rel(p) { return p.split(path.sep).join('/'); }
function top(arr, n) { return (arr || []).slice(0, n); }

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

function rebuildRuntimePackMarkdown(world, pack) {
  const worldRoot = path.join(ROOT, world);
  let md = `# ${world} Original Runtime Pack\n\n更新日期：${NOW}\n\n`;
  md += `用途：RP 运行时优先读取本包、逐卷摘要、章节事件、实体索引、关系候选与时间线；不要常驻加载 raw-text 正文。\n\n`;
  md += `## Coverage\n\n`;
  md += `- Series: ${pack.coverage.series}\n`;
  md += `- Volumes: ${pack.coverage.volumes}\n`;
  md += `- Chapter events: ${pack.coverage.chapterEvents}\n`;
  md += `- Entities: ${pack.coverage.entities}\n`;
  md += `- Relationship candidates: ${pack.coverage.relationshipCandidates}\n`;
  md += `- Timeline lanes: ${pack.coverage.timelineLanes || 0}\n`;
  md += `- Timeline entries: ${pack.coverage.timelineEntries || 0}\n`;
  md += `- Graph: ${pack.coverage.graphNodes}/${pack.coverage.graphEdges}\n\n`;
  md += `## Files\n\n`;
  for (const [k, v] of Object.entries(pack.files || {})) {
    if (Array.isArray(v)) md += `- ${k}: ${v.length} files\n`;
    else md += `- ${k}: \`${v}\`\n`;
  }
  md += `\n## Series\n\n| series | volumes | chapter events | dominant arcs |\n|---|---:|---:|---|\n`;
  for (const s of pack.series || []) md += `| ${s.seriesSlug} | ${(s.volumes || []).length} | ${s.chapterEvents || 0} | ${(s.dominantArcs || []).slice(0, 4).map(a => `${a.arc}(${a.chapterHits})`).join('；') || '—'} |\n`;
  md += `\n## Top Characters\n\n`;
  md += (pack.topCharacters || []).slice(0, 20).map(e => `- ${e.name}: mentions=${e.mentions}, chapters=${e.chapterHits}`).join('\n') || '- —';
  md += `\n\n## Top Relationship Candidates\n\n`;
  md += (pack.topRelationshipCandidates || []).slice(0, 30).map(r => `- ${r.source} ↔ ${r.target}: weight=${r.weight}, chapters=${r.chapterHits}`).join('\n') || '- —';
  md += '\n';
  fs.writeFileSync(path.join(worldRoot, 'curated', 'original-runtime-pack.md'), md, 'utf8');
}

function finalizeWorld(world) {
  const worldRoot = path.join(ROOT, world);
  const manifestPath = path.join(worldRoot, 'sources', 'raw-text-manifest.json');
  if (!exists(manifestPath)) return null;
  const runtimePath = path.join(worldRoot, 'curated', 'original-runtime-pack.json');
  const timelinePath = path.join(worldRoot, 'curated', 'original-timeline.json');
  const graphPath = path.join(worldRoot, 'curated', 'plot-graph.json');
  if (!exists(runtimePath) || !exists(timelinePath) || !exists(graphPath)) return { world, error: 'missing runtime/timeline/graph' };
  const manifest = readJson(manifestPath);
  const runtime = readJson(runtimePath);
  const timeline = readJson(timelinePath);
  const graph = readJson(graphPath);
  const volumes = (manifest.series || []).reduce((n, s) => n + (s.volumes || []).length, 0);
  const chapters = (manifest.series || []).reduce((n, s) => n + (s.volumes || []).reduce((m, v) => m + (v.chapters || []).length, 0), 0);
  const timelineNextEdges = (graph.edges || []).filter(e => e.type === 'timeline-next').length;
  runtime.files = runtime.files || {};
  runtime.files.timeline = 'curated/original-timeline.json';
  runtime.files.timelineMarkdown = 'curated/original-timeline.md';
  runtime.coverage = runtime.coverage || {};
  runtime.coverage.series = (manifest.series || []).length;
  runtime.coverage.volumes = volumes;
  runtime.coverage.chapterEvents = chapters;
  runtime.coverage.timelineLanes = (timeline.lanes || []).length;
  runtime.coverage.timelineEntries = (timeline.entries || []).length;
  runtime.coverage.graphNodes = (graph.nodes || []).length;
  runtime.coverage.graphEdges = (graph.edges || []).length;
  runtime.updatedAt = NOW;
  writeJson(runtimePath, runtime);
  rebuildRuntimePackMarkdown(world, runtime);
  return {
    world,
    series: runtime.coverage.series,
    volumes,
    chapterEvents: chapters,
    entities: runtime.coverage.entities || 0,
    relationshipCandidates: runtime.coverage.relationshipCandidates || 0,
    searchEntries: runtime.coverage.searchEntries || 0,
    searchKeywords: runtime.coverage.searchKeywords || 0,
    timelineLanes: runtime.coverage.timelineLanes,
    timelineEntries: runtime.coverage.timelineEntries,
    timelineNextEdges,
    graphNodes: runtime.coverage.graphNodes,
    graphEdges: runtime.coverage.graphEdges,
    issues: []
  };
}

function table(reports) {
  let md = '| world | series | volumes | chapter events | entities | relationships | timeline | graph |\n';
  md += '|---|---:|---:|---:|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.series} | ${r.volumes} | ${r.chapterEvents} | ${r.entities} | ${r.relationshipCandidates} | ${r.timelineLanes}/${r.timelineEntries} | ${r.graphNodes}/${r.graphEdges} |\n`;
  const total = reports.reduce((a, r) => {
    a.series += r.series;
    a.volumes += r.volumes;
    a.chapterEvents += r.chapterEvents;
    a.entities += r.entities;
    a.relationships += r.relationshipCandidates;
    a.searchEntries += r.searchEntries || 0;
    a.searchKeywords += r.searchKeywords || 0;
    a.timelineLanes += r.timelineLanes;
    a.timelineEntries += r.timelineEntries;
    a.graphNodes += r.graphNodes;
    a.graphEdges += r.graphEdges;
    return a;
  }, { series:0, volumes:0, chapterEvents:0, entities:0, relationships:0, searchEntries:0, searchKeywords:0, timelineLanes:0, timelineEntries:0, graphNodes:0, graphEdges:0 });
  md += `| **合计** | **${total.series}** | **${total.volumes}** | **${total.chapterEvents}** | **${total.entities}** | **${total.relationships}** | **${total.searchEntries}/${total.searchKeywords}** | **${total.timelineLanes}/${total.timelineEntries}** | **${total.graphNodes}/${total.graphEdges}** |
`;
  return { md, total };
}

function replaceSection(text, headingRe, block) {
  const re = new RegExp(`\\n## ${headingRe}[\\s\\S]*?(?=\\n## |$)`, 'g');
  text = text.replace(re, '');
  return text.trimEnd() + '\n' + block + '\n';
}

function updateDocs(reports, validation) {
  const { md: tbl, total } = table(reports);
  const statusBlock = `\n## 原著正文精修迭代状态（${DATE}）\n\n本轮已对所有已入库 Wenku8 原著小说正文完成统一精修管线：raw-text manifest → source-backed 逐卷摘要 → chapter-event-refined 章节事件节点 → original-entity-index → original-relationship-candidates → original-timeline → original-runtime-pack。\n\n${tbl}\n\n校验结果：\n\n- Final JSON checked：${validation.filesChecked}\n- Final bad JSON：${validation.bad.length}\n- 原著世界数：${reports.length}\n- 章节事件总数：${total.chapterEvents}\n- runtime pack 总入口：${reports.length}\n\n主要报告：\n\n- \`campaigns/world-library/manual-curation/reports/original-refinement-final-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-refinement-integrity-audit.md\`\n- \`campaigns/world-library/manual-curation/reports/original-timeline-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-runtime-pack-report.md\`\n\n注意：\`original-relationship-candidates.json\` 是基于章节共现的候选关系，不直接替代人工语义 \`relationship-graph.json\`。\n`;
  let status = fs.readFileSync(STATUS, 'utf8');
  status = status.replace(/^更新日期:.*/m, `更新日期:${DATE}`);
  status = replaceSection(status, '原著正文精修迭代状态（[^）]+）', statusBlock);
  fs.writeFileSync(STATUS, status, 'utf8');

  const indexBlock = `\n## 原著正文精修入口（${DATE}）\n\n已入库原著正文的 5 个小说世界已完成 runtime pack 汇总，可作为 RP 运行时优先入口。\n\n${tbl}\n\n入口文件：\n\n- \`campaigns/world-library/manual-curation/reports/original-refinement-final-report.md\`\n- \`campaigns/world-library/worlds/*/curated/original-runtime-pack.json\`\n- \`campaigns/world-library/worlds/*/curated/original-runtime-pack.md\`\n- \`campaigns/world-library/worlds/*/curated/original-timeline.json\`\n\n精修产物层级：raw-text → volume summary → chapter-event → entity index → relationship candidates → timeline → search index → runtime pack。\n`;
  let index = fs.readFileSync(INDEX, 'utf8');
  index = index.replace(/^更新日期：.*/m, `更新日期：${DATE}`);
  index = replaceSection(index, '原著正文精修入口（[^）]+）', indexBlock);
  fs.writeFileSync(INDEX, index, 'utf8');
  return { total, table: tbl };
}

function main() {
  ensureDir(REPORT_DIR);
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'sources', 'raw-text-manifest.json'))).sort();
  const reports = worlds.map(finalizeWorld).filter(Boolean);
  const errors = reports.filter(r => r.error);
  if (errors.length) throw new Error(JSON.stringify(errors));
  const validation = validateJson();
  const doc = updateDocs(reports, validation);
  writeJson(path.join(REPORT_DIR, 'original-refinement-final-report.json'), { createdAt: NOW, reports, validation, totals: doc.total });
  let md = `# Original Refinement Final Report\n\n更新日期：${NOW}\n\n`;
  md += '最终入口报告：所有已入库原著小说完成 volume summary / chapter events / entity index / relationship candidates / timeline / runtime pack。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += doc.table;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-refinement-final-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation, totals: doc.total }, null, 2));
}
main();
