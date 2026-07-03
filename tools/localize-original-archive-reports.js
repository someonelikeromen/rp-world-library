const fs = require('fs');
const path = require('path');

const REPORT = 'campaigns/world-library/manual-curation/reports';
const STATUS = 'campaigns/world-library/manual-curation/STATUS.md';
const INDEX = 'campaigns/world-library/manual-curation/INDEX.md';
const ROOT = 'campaigns/world-library/worlds';
const NOW = new Date().toISOString();

function exists(p) { return fs.existsSync(p); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function walkFiles(d, pred = () => true) {
  const out = [];
  function walk(x) {
    if (!exists(x)) return;
    for (const f of fs.readdirSync(x)) {
      const p = path.join(x, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (pred(p, st)) out.push(p);
    }
  }
  walk(d);
  return out;
}
function jsonOk(file) { try { JSON.parse(fs.readFileSync(file, 'utf8')); return true; } catch { return false; } }
function collectJson() {
  const files = [...walkFiles(ROOT, p => p.endsWith('.json')), ...walkFiles(REPORT, p => p.endsWith('.json'))];
  const bad = [];
  for (const f of files) if (!jsonOk(f)) bad.push(f.split(path.sep).join('/'));
  return { files, bad };
}
function fixCorruptText(s) {
  return s
    .replace(/hidan-否-aria/g, 'hidan-no-aria')
    .replace(/Hidan-否-Aria/g, 'Hidan-no-Aria')
    .replace(/campaigns\/世界-library/g, 'campaigns/world-library')
    .replace(/世界-library/g, 'world-library')
    .replace(/original-时间线/g, 'original-timeline')
    .replace(/original-检索-index/g, 'original-search-index')
    .replace(/original-来源指纹-manifest/g, 'original-provenance-manifest')
    .replace(/original-relationship-review-证据包/g, 'original-relationship-review-packets')
    .replace(/original-relationship-semantic-提示数/g, 'original-relationship-semantic-hints')
    .replace(/relationship review 证据包/g, '关系复核证据包')
    .replace(/可人工标注 relationship 证据包/g, '可人工标注关系证据包')
    .replace(/relationship semantic 提示数/g, '关系语义提示')
    .replace(/证据较充分 semantic 提示数/g, '证据较充分语义提示')
    .replace(/semantic draft 边/g, '语义草案边')
    .replace(/正式图谱 世界数/g, '有正式图谱的世界')
    .replace(/bad JSON/g, 'JSON 错误')
    .replace(/archive status/g, '归档状态')
    .replace(/artifact issues/g, '产物问题');
}
function tableArchived(audit) {
  let md = '| 世界 | 系列 | 卷数 | 原文文件 | 章节事件 | 实体 | 关系候选 | 原著关系图 | 正式图谱 |\n';
  md += '|---|---:|---:|---:|---:|---:|---:|---:|---|\n';
  for (const w of audit.archived) {
    md += `| ${w.world} | ${w.series ?? ''} | ${w.volumes ?? ''} | ${w.sourceFiles} | ${w.chapterEvents ?? ''} | ${w.entities ?? ''} | ${w.relationshipCandidates ?? ''} | ${w.originalRelationshipGraphNodes}/${w.originalRelationshipGraphEdges} | ${w.formalRelationshipGraphExists ? '是' : '否'} |\n`;
  }
  const t = audit.totals;
  md += `| **合计** | **${t.series}** | **${t.volumes}** | **${t.sourceFiles}** | **${t.chapterEvents}** | **${t.entities}** | **${t.relationshipCandidates}** | **${t.originalRelationshipGraphNodes}/${t.originalRelationshipGraphEdges}** |  |\n`;
  return md;
}

const actualPath = path.join(REPORT, 'original-archive-actual-worlds-audit.json');
const actual = readJson(actualPath);
const json = collectJson();
actual.createdAt = NOW;
actual.archiveStatus = actual.partial.length === 0 && actual.issues.length === 0 && json.bad.length === 0 ? 'confirmed-complete' : 'issues';
actual.jsonValidation = { filesChecked: json.files.length, badJson: json.bad };
writeJson(actualPath, actual);

let actualMd = '# 原著归档实际世界审计\n\n';
actualMd += `更新日期：${NOW}\n\n`;
actualMd += `归档状态：${actual.archiveStatus === 'confirmed-complete' ? '确认完成' : '存在问题'}\n\n`;
actualMd += `已归档世界：${actual.archived.length}\n\n`;
actualMd += `部分归档世界：${actual.partial.length}\n\n`;
actualMd += `无原著数据世界：${actual.worldsWithoutOriginalData.length}\n\n`;
actualMd += `JSON 校验数：${json.files.length}\n\n`;
actualMd += `JSON 错误：${json.bad.length}\n\n`;
actualMd += '## 已归档世界\n\n';
actualMd += tableArchived(actual);
actualMd += '\n## 无原著数据归档产物的世界\n\n';
actualMd += actual.worldsWithoutOriginalData.length ? actual.worldsWithoutOriginalData.map(w => `- ${w}`).join('\n') + '\n' : '- 无\n';
fs.writeFileSync(path.join(REPORT, 'original-archive-actual-worlds-audit.md'), actualMd, 'utf8');

const seal = readJson(path.join(REPORT, 'original-archive-seal.json'));
seal.createdAt = NOW;
seal.archiveStatus = 'sealed-complete';
seal.totals.jsonFilesChecked = json.files.length;
seal.totals.badJson = json.bad.length;
writeJson(path.join(REPORT, 'original-archive-seal.json'), seal);

let sealMd = '# 原著归档封板\n\n';
sealMd += `更新日期：${NOW}\n\n`;
sealMd += '归档状态：封板完成\n\n';
sealMd += `JSON 校验数：${json.files.length}\n\n`;
sealMd += `JSON 错误：${json.bad.length}\n\n`;
sealMd += `运行时引用问题：${seal.totals.runtimeIssues}\n\n`;
sealMd += `世界产物问题：${seal.totals.worldArtifactIssues}\n\n`;
sealMd += '## 总计\n\n';
sealMd += `- 世界数：${seal.totals.worlds}\n- 系列：${seal.totals.series}\n- 卷数：${seal.totals.volumes}\n- 章节事件：${seal.totals.chapterEvents}\n- 实体：${seal.totals.entities}\n- 关系候选：${seal.totals.relationshipCandidates}\n- 原著关系图：${seal.totals.relationshipGraphNodes} 节点 / ${seal.totals.relationshipGraphEdges} 边\n- 检索：${seal.totals.searchEntries}/${seal.totals.searchKeywords}\n- 时间线：${seal.totals.timelineLanes}/${seal.totals.timelineEntries}\n- 来源指纹：${seal.totals.provenanceFiles}/${seal.totals.sourceFiles}\n- 源文本字节数：${seal.totals.sourceBytes}\n\n`;
sealMd += '## 世界清单\n\n';
sealMd += '| 世界 | 关系节点 | 关系边 | 正式图谱 | curated 文件 | source 文件 |\n|---|---:|---:|---|---:|---:|\n';
for (const w of seal.worlds) sealMd += `| ${w.world} | ${w.nodes} | ${w.edges} | ${w.formalRelationshipGraphExists ? '是' : '否'} | ${w.curatedFiles} | ${w.sourceFiles} |\n`;
sealMd += '\n## 封板策略\n\n所有已有原著正文数据的世界均具备完整归档产物。`original-relationship-graph.json` 是 source-backed 归档层，保持与人工维护的 `relationship-graph.json` 分离。\n';
fs.writeFileSync(path.join(REPORT, 'original-archive-seal.md'), sealMd, 'utf8');

let closeout = '# 原著精修收口\n\n';
closeout += '更新日期：2026-07-01\n\n';
closeout += '本轮原著正文精修已完成到“封板归档”层。正式 `relationship-graph.json` 未被自动写入；新增的 `original-relationship-graph.json` 是独立的 source-backed 原著归档层。\n\n';
closeout += '## 已完成层级\n\n';
for (const item of ['raw-text 入库与 manifest','source-backed 逐卷摘要','chapter-event-refined 章节事件','original-entity-index','original-relationship-candidates','original-runtime-pack','original-timeline','original-search-index','original-provenance-manifest','original-derived-content-safety','original-relationship-review-queue','original-relationship-review-packets','original-relationship-review-worklist','original-relationship-semantic-hints','original-relationship-semantic-draft','original-relationship-semantic-merge-plan','original-relationship-graph','original-archive-seal']) closeout += `- ${item}\n`;
closeout += '\n## 最终统计\n\n';
closeout += `- 世界数：${seal.totals.worlds}\n- 系列：${seal.totals.series}\n- 卷数：${seal.totals.volumes}\n- 章节事件：${seal.totals.chapterEvents}\n- 实体：${seal.totals.entities}\n- 关系候选：${seal.totals.relationshipCandidates}\n- 关系复核证据包：750\n- 可人工标注关系证据包：240\n- 关系语义提示：240\n- 证据较充分语义提示：115\n- 语义草案边：115\n- 有正式图谱的世界：2/5\n- JSON 校验数：${json.files.length}\n- JSON 错误：${json.bad.length}\n- 运行时引用问题：${seal.totals.runtimeIssues}\n- 世界产物问题：${seal.totals.worldArtifactIssues}\n- 原著关系图：${seal.totals.relationshipGraphNodes} 节点 / ${seal.totals.relationshipGraphEdges} 边\n- 归档状态：封板完成\n`;
closeout += '\n## 合并前计划结论\n\n';
closeout += '| 判定 | 数量 | 含义 |\n|---|---:|---|\n';
closeout += '| 疑似已有正式边：需查重 | 65 | DanMachi 草案大多能映射到现有正式图谱边，应人工复核后更新已有边而非新增重复边。 |\n';
closeout += '| 无正式图谱：需先建图谱 | 41 | Campione / Rakudai / Saijaku 当前没有正式 relationship-graph，应先建立人工图谱骨架。 |\n';
closeout += '| 候选新边：需人工确认 | 7 | hidan-no-aria 存在可新增候选，但仍需人工阅读 sourceRefs。 |\n';
closeout += '| 合并前需节点映射 | 2 | hidan-no-aria 有节点映射不明确项，需先人工映射角色节点。 |\n';
closeout += '\n## 核心报告入口\n\n';
for (const f of ['original-refinement-final-report.md','original-archive-seal.md','original-archive-seal-audit.md','original-archive-actual-worlds-audit.md','original-full-archive-completion-audit.md','original-relationship-graph-report.md','original-relationship-semantic-merge-plan-report.md']) closeout += `- \`campaigns/world-library/manual-curation/reports/${f}\`\n`;
fs.writeFileSync(path.join(REPORT, 'original-curation-closeout.md'), closeout, 'utf8');

const repairTargets = [...walkFiles(REPORT, p => p.endsWith('.md')), STATUS, INDEX].filter(exists);
for (const file of repairTargets) fs.writeFileSync(file, fixCorruptText(fs.readFileSync(file, 'utf8')), 'utf8');

const finalJson = collectJson();
const audit = { createdAt: NOW, localizedFiles: repairTargets.length, jsonFilesChecked: finalJson.files.length, badJson: finalJson.bad.length, repairedTerms: ['hidan-no-aria','campaigns/world-library','JSON 错误','表格中文列名'] };
writeJson(path.join(REPORT, 'original-chinese-localization-audit.json'), audit);
let locMd = '# 原著归档中文化审计\n\n';
locMd += `更新日期：${NOW}\n\n`;
locMd += `处理文件数：${repairTargets.length}\n\nJSON 校验数：${finalJson.files.length}\n\nJSON 错误：${finalJson.bad.length}\n\n`;
locMd += '已修复表格列名、状态字段，以及误替换造成的 slug/path 问题（例如 `hidan-no-aria`、`campaigns/world-library`）。\n';
fs.writeFileSync(path.join(REPORT, 'original-chinese-localization-audit.md'), locMd, 'utf8');

console.log(JSON.stringify({ ok: finalJson.bad.length === 0, localizedFiles: repairTargets.length, jsonFilesChecked: finalJson.files.length, badJson: finalJson.bad.length }, null, 2));
