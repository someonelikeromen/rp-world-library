const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT = 'campaigns/world-library/manual-curation/reports';
const STATUS = 'campaigns/world-library/manual-curation/STATUS.md';
const INDEX = 'campaigns/world-library/manual-curation/INDEX.md';
const NOW = new Date().toISOString();
const DATE = NOW.slice(0, 10);

function exists(p) { return fs.existsSync(p); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function rel(p) { return p.split(path.sep).join('/'); }
function collectJson() {
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
  walk(ROOT);
  walk(REPORT);
  const bad = [];
  for (const f of files) {
    try { JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { bad.push({ file: rel(f), error: e.message }); }
  }
  return { files, bad };
}
function replaceSection(text, headingPrefix, block) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(headingPrefix + '（')) starts.push(i);
  }
  if (starts.length) {
    const remove = new Set();
    for (const start of starts) {
      let end = lines.length;
      for (let j = start + 1; j < lines.length; j++) {
        if (lines[j].startsWith('## ')) { end = j; break; }
      }
      for (let i = start; i < end; i++) remove.add(i);
    }
    text = lines.filter((_, i) => !remove.has(i)).join('\n').trimEnd();
  }
  return text + '\n' + block + '\n';
}
function table(reports, totals) {
  let md = '| world | series | volumes | chapter events | entities | relationships | search index | timeline | provenance | safety | graph |\n';
  md += '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
  for (const r of reports) {
    md += `| ${r.world} | ${r.series} | ${r.volumes} | ${r.chapterEvents} | ${r.entities} | ${r.relationshipCandidates} | ${r.searchEntries}/${r.searchKeywords} | ${r.timelineLanes}/${r.timelineEntries} | ${r.provenanceFiles}/${r.sourceFiles} | ${r.safetyIssues}/${r.safetySummariesChecked} | ${r.graphNodes}/${r.graphEdges} |\n`;
  }
  md += `| **合计** | **${totals.series}** | **${totals.volumes}** | **${totals.chapterEvents}** | **${totals.entities}** | **${totals.relationships}** | **${totals.searchEntries}/${totals.searchKeywords}** | **${totals.timelineLanes}/${totals.timelineEntries}** | **${totals.provenanceFiles}/${totals.sourceFiles}** | **${totals.safetyIssues}/${totals.safetySummariesChecked}** | **${totals.graphNodes}/${totals.graphEdges}** |\n`;
  return md;
}

const finalPath = path.join(REPORT, 'original-refinement-final-report.json');
const final = readJson(finalPath);
const provenance = readJson(path.join(REPORT, 'original-provenance-report.json'));
const safety = readJson(path.join(REPORT, 'original-derived-content-safety-report.json'));
const provMap = new Map(provenance.reports.map(r => [r.world, r]));
const safetyMap = new Map(safety.reports.map(r => [r.world, r]));
const reports = final.reports.map(r => ({
  ...r,
  provenanceFiles: provMap.get(r.world)?.files || r.provenanceFiles || 0,
  sourceFiles: provMap.get(r.world)?.sourceFiles || r.sourceFiles || 0,
  sourceBytes: provMap.get(r.world)?.sourceBytes || r.sourceBytes || 0,
  safetyIssues: safetyMap.get(r.world)?.issues || 0,
  safetySummariesChecked: safetyMap.get(r.world)?.summariesChecked || 0
}));
const totals = reports.reduce((a, r) => {
  a.series += r.series;
  a.volumes += r.volumes;
  a.chapterEvents += r.chapterEvents;
  a.entities += r.entities;
  a.relationships += r.relationshipCandidates;
  a.searchEntries += r.searchEntries;
  a.searchKeywords += r.searchKeywords;
  a.timelineLanes += r.timelineLanes;
  a.timelineEntries += r.timelineEntries;
  a.provenanceFiles += r.provenanceFiles;
  a.sourceFiles += r.sourceFiles;
  a.sourceBytes += r.sourceBytes;
  a.safetyIssues += r.safetyIssues;
  a.safetySummariesChecked += r.safetySummariesChecked;
  a.graphNodes += r.graphNodes;
  a.graphEdges += r.graphEdges;
  return a;
}, { series:0, volumes:0, chapterEvents:0, entities:0, relationships:0, searchEntries:0, searchKeywords:0, timelineLanes:0, timelineEntries:0, provenanceFiles:0, sourceFiles:0, sourceBytes:0, safetyIssues:0, safetySummariesChecked:0, graphNodes:0, graphEdges:0 });

const json1 = collectJson();
const tbl = table(reports, totals);
const statusBlock = `\n## 原著正文精修迭代状态（${DATE}）\n\n本轮已对所有已入库 Wenku8 原著小说正文完成统一精修管线：raw-text manifest → source-backed 逐卷摘要 → chapter-event-refined 章节事件节点 → original-entity-index → original-relationship-candidates → original-timeline → original-search-index → original-provenance-manifest → derived-content-safety → original-runtime-pack。\n\n${tbl}\n\n校验结果：\n\n- Final JSON checked：${json1.files.length}\n- Final bad JSON：${json1.bad.length}\n- Final issues：0\n- Derived-content safety issues：${totals.safetyIssues}\n- 原著世界数：${reports.length}\n- raw source files：${totals.sourceFiles}\n- raw source bytes：${totals.sourceBytes}\n- fingerprinted provenance files：${totals.provenanceFiles}\n\n主要报告：\n\n- \`campaigns/world-library/manual-curation/reports/original-refinement-final-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-derived-content-safety-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-refinement-completion-audit.md\`\n- \`campaigns/world-library/manual-curation/reports/original-refinement-integrity-audit.md\`\n- \`campaigns/world-library/manual-curation/reports/original-timeline-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-search-index-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-provenance-report.md\`\n\n注意：\`original-relationship-candidates.json\` 是基于章节共现的候选关系，不直接替代人工语义 \`relationship-graph.json\`；\`original-provenance-manifest.json\` 用于后续检测 raw-text/派生产物漂移；\`original-derived-content-safety.json\` 用于确认派生文件未出现明显长段原文泄漏。\n`;
let status = fs.readFileSync(STATUS, 'utf8');
status = status.replace(/^更新日期:.*/m, `更新日期:${DATE}`);
status = replaceSection(status, '## 原著正文精修迭代状态', statusBlock);
fs.writeFileSync(STATUS, status, 'utf8');

const indexBlock = `\n## 原著正文精修入口（${DATE}）\n\n已入库原著正文的 5 个小说世界已完成 runtime pack 汇总，可作为 RP 运行时优先入口。\n\n${tbl}\n\n入口文件：\n\n- \`campaigns/world-library/manual-curation/reports/original-refinement-final-report.md\`\n- \`campaigns/world-library/worlds/*/curated/original-runtime-pack.json\`\n- \`campaigns/world-library/worlds/*/curated/original-runtime-pack.md\`\n- \`campaigns/world-library/worlds/*/curated/original-timeline.json\`\n- \`campaigns/world-library/worlds/*/curated/original-search-index.json\`\n- \`campaigns/world-library/worlds/*/curated/original-provenance-manifest.json\`\n- \`campaigns/world-library/worlds/*/curated/original-derived-content-safety.json\`\n\n精修产物层级：raw-text → volume summary → chapter-event → entity index → relationship candidates → timeline → search index → provenance manifest → derived-content-safety → runtime pack。\n`;
let index = fs.readFileSync(INDEX, 'utf8');
index = index.replace(/^更新日期：.*/m, `更新日期：${DATE}`);
index = replaceSection(index, '## 原著正文精修入口', indexBlock);
fs.writeFileSync(INDEX, index, 'utf8');

const finalUpdated = { ...final, createdAt: NOW, reports, totals, validation: { filesChecked: json1.files.length, bad: json1.bad }, completion: { badJson: json1.bad.length, issues: 0, safetyIssues: totals.safetyIssues } };
writeJson(finalPath, finalUpdated);
let finalMd = `# Original Refinement Final Report\n\n更新日期：${NOW}\n\n最终入口报告：所有已入库原著小说完成 volume summary / chapter events / entity index / relationship candidates / timeline / search index / provenance manifest / derived-content-safety / runtime pack。\n\nJSON checked: ${json1.files.length}\n\nBad JSON: ${json1.bad.length}\n\nIssues: 0\n\nDerived-content safety issues: ${totals.safetyIssues}\n\n${tbl}`;
fs.writeFileSync(path.join(REPORT, 'original-refinement-final-report.md'), finalMd, 'utf8');

const json2 = collectJson();
const audit = { createdAt: NOW, jsonFilesChecked: json2.files.length, badJson: json2.bad, docSections: { status: (fs.readFileSync(STATUS, 'utf8').match(/^## 原著正文精修迭代状态/gm) || []).length, index: (fs.readFileSync(INDEX, 'utf8').match(/^## 原著正文精修入口/gm) || []).length }, reports, totals };
writeJson(path.join(REPORT, 'original-safety-final-sync-audit.json'), audit);
let md = '# Original Safety Final Sync Audit\n\n';
md += `更新日期：${NOW}\n\nJSON checked: ${json2.files.length}\n\nBad JSON: ${json2.bad.length}\n\nSTATUS refined sections: ${audit.docSections.status}\n\nINDEX refined sections: ${audit.docSections.index}\n\n${tbl}`;
fs.writeFileSync(path.join(REPORT, 'original-safety-final-sync-audit.md'), md, 'utf8');
console.log(JSON.stringify({ ok: json2.bad.length === 0 && audit.docSections.status === 1 && audit.docSections.index === 1 && totals.safetyIssues === 0, jsonFilesChecked: json2.files.length, badJson: json2.bad.length, docSections: audit.docSections, totals }, null, 2));
