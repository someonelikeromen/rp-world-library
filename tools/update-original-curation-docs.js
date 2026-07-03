const fs = require('fs');
const path = require('path');

const NOW = new Date().toISOString();
const DATE = NOW.slice(0, 10);
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const STATUS = 'campaigns/world-library/manual-curation/STATUS.md';
const INDEX = 'campaigns/world-library/manual-curation/INDEX.md';

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readText(p) { return fs.readFileSync(p, 'utf8'); }
function writeText(p, s) { fs.writeFileSync(p, s, 'utf8'); }

const runtime = readJson(path.join(REPORT_DIR, 'original-runtime-pack-report.json'));
const chapterAudit = readJson(path.join(REPORT_DIR, 'chapter-event-final-audit.json'));
const entityReport = readJson(path.join(REPORT_DIR, 'entity-relationship-refinement-report.json'));

const totals = runtime.reports.reduce((a, r) => {
  a.worlds += 1;
  a.series += r.series;
  a.volumes += r.volumes;
  a.chapterEvents += r.chapterEvents;
  a.entities += r.entities;
  a.relationships += r.relationshipCandidates;
  a.graphNodes += r.graphNodes;
  a.graphEdges += r.graphEdges;
  return a;
}, { worlds: 0, series: 0, volumes: 0, chapterEvents: 0, entities: 0, relationships: 0, graphNodes: 0, graphEdges: 0 });

function reportTable() {
  let md = '| world | series | volumes | chapter events | entities | relationship candidates | graph |\n';
  md += '|---|---:|---:|---:|---:|---:|---:|\n';
  for (const r of runtime.reports) md += `| ${r.world} | ${r.series} | ${r.volumes} | ${r.chapterEvents} | ${r.entities} | ${r.relationshipCandidates} | ${r.graphNodes}/${r.graphEdges} |\n`;
  md += `| **合计** | **${totals.series}** | **${totals.volumes}** | **${totals.chapterEvents}** | **${totals.entities}** | **${totals.relationships}** | **${totals.graphNodes}/${totals.graphEdges}** |\n`;
  return md;
}

const block = `\n## 原著正文精修迭代状态（${DATE}）\n\n本轮已对所有已入库 Wenku8 原著小说正文完成统一精修管线：\n\n1. raw-text manifest 覆盖检查。\n2. source-backed 逐卷摘要。\n3. chapter-event-refined 章节事件节点。\n4. original-entity-index 人物/地点/术语索引。\n5. original-relationship-candidates 章节共现关系候选。\n6. original-runtime-pack RP 运行时入口包。\n\n${reportTable()}\n\n校验结果：\n\n- Chapter-event audit JSON checked：${chapterAudit.jsonFilesChecked}\n- Chapter-event audit bad JSON：${chapterAudit.badJson.length}\n- Chapter-event audit issues：${chapterAudit.issues.length}\n- Runtime-pack validation JSON checked：${runtime.validation.filesChecked}\n- Runtime-pack bad JSON：${runtime.validation.bad.length}\n\n主要报告：\n\n- \`campaigns/world-library/manual-curation/reports/chapter-event-final-audit.md\`\n- \`campaigns/world-library/manual-curation/reports/entity-relationship-refinement-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-runtime-pack-report.md\`\n\n运行时入口：\n\n- \`campaigns/world-library/worlds/campione/curated/original-runtime-pack.json\`\n- \`campaigns/world-library/worlds/danmachi/curated/original-runtime-pack.json\`\n- \`campaigns/world-library/worlds/hidan-no-aria/curated/original-runtime-pack.json\`\n- \`campaigns/world-library/worlds/rakudai-kishi/curated/original-runtime-pack.json\`\n- \`campaigns/world-library/worlds/saijaku-muhai-bahamut/curated/original-runtime-pack.json\`\n\n注意：\`original-relationship-candidates.json\` 是基于章节共现的候选关系，不直接替代人工语义 \`relationship-graph.json\`。\n`;

function replaceOrAppend(text, heading, newBlock) {
  const re = new RegExp(`\\n## ${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |$)`);
  if (re.test(text)) return text.replace(re, newBlock);
  return text.trimEnd() + '\n' + newBlock + '\n';
}

let status = readText(STATUS);
status = status.replace(/^更新日期:.*/m, `更新日期:${DATE}`);
status = replaceOrAppend(status, '原著正文精修迭代状态（2026-07-01）', block);
status = replaceOrAppend(status, '原著正文精修迭代状态（2026-07-02）', block);
status = status.replace(/- 未执行 JSON 解析\/格式校验;所有 `\.json` 文件仍需后续统一解析验证。\n/, '');
writeText(STATUS, status);

let index = readText(INDEX);
index = index.replace(/^更新日期：.*/m, `更新日期：${DATE}`);
const indexBlock = `\n## 原著正文精修入口（${DATE}）\n\n已入库原著正文的 5 个小说世界已完成 runtime pack 汇总，可作为 RP 运行时优先入口：\n\n${reportTable()}\n\n入口文件：\n\n- \`campaigns/world-library/manual-curation/reports/original-runtime-pack-report.md\`\n- \`campaigns/world-library/worlds/*/curated/original-runtime-pack.json\`\n- \`campaigns/world-library/worlds/*/curated/original-runtime-pack.md\`\n\n精修产物层级：raw-text → volume summary → chapter-event → entity index → relationship candidates → runtime pack。\n`;
index = replaceOrAppend(index, '原著正文精修入口（2026-07-01）', indexBlock);
index = replaceOrAppend(index, '原著正文精修入口（2026-07-02）', indexBlock);
writeText(INDEX, index);

console.log(JSON.stringify({ ok: true, date: DATE, totals, files: [STATUS, INDEX] }, null, 2));
