const fs = require('fs');
const path = require('path');

const REPORT = 'campaigns/world-library/manual-curation/reports';
const STATUS = 'campaigns/world-library/manual-curation/STATUS.md';
const INDEX = 'campaigns/world-library/manual-curation/INDEX.md';
const NOW = new Date().toISOString();
const DATE = NOW.slice(0, 10);

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function replaceSection(text, headingPrefix, block) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].startsWith(headingPrefix + '（')) starts.push(i);
  if (starts.length) {
    const remove = new Set();
    for (const start of starts) {
      let end = lines.length;
      for (let j = start + 1; j < lines.length; j++) if (lines[j].startsWith('## ')) { end = j; break; }
      for (let i = start; i < end; i++) remove.add(i);
    }
    text = lines.filter((_, i) => !remove.has(i)).join('\n').trimEnd();
  }
  return text + '\n' + block + '\n';
}
function collectJson() {
  const roots = ['campaigns/world-library/worlds', REPORT];
  const files = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (p.endsWith('.json')) files.push(p);
    }
  }
  for (const r of roots) walk(r);
  const bad = [];
  for (const f of files) {
    try { JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { bad.push({ file: f.split(path.sep).join('/'), error: e.message }); }
  }
  return { files, bad };
}

const final = readJson(path.join(REPORT, 'original-refinement-final-report.json'));
const review = readJson(path.join(REPORT, 'original-relationship-review-report.json'));
const reviewTotals = review.reports.reduce((a, r) => {
  a.candidates += r.candidates;
  a.priority += r.priority;
  a.anchors += r.anchors;
  a.searchSignals += r.searchSignals;
  return a;
}, { candidates: 0, priority: 0, anchors: 0, searchSignals: 0 });
final.relationshipReview = reviewTotals;
final.createdAt = NOW;
writeJson(path.join(REPORT, 'original-refinement-final-report.json'), final);

let table = '| world | candidates | semantic priority | RP anchors | search signals |\n|---|---:|---:|---:|---:|\n';
for (const r of review.reports) table += `| ${r.world} | ${r.candidates} | ${r.priority} | ${r.anchors} | ${r.searchSignals} |\n`;
table += `| **合计** | **${reviewTotals.candidates}** | **${reviewTotals.priority}** | **${reviewTotals.anchors}** | **${reviewTotals.searchSignals}** |\n`;

const json = collectJson();
const statusBlock = `\n## 原著关系候选复核队列（${DATE}）\n\n本轮已把 \`original-relationship-candidates.json\` 分层为语义复核优先级队列。候选关系仍然是章节共现结果，不直接覆盖人工 \`relationship-graph.json\`。\n\n${table}\n\n报告：\n\n- \`campaigns/world-library/manual-curation/reports/original-relationship-review-report.md\`\n- \`campaigns/world-library/manual-curation/reports/original-relationship-review-completion-audit.md\`\n\n校验：JSON checked ${json.files.length}，Bad JSON ${json.bad.length}。\n`;
let status = fs.readFileSync(STATUS, 'utf8');
status = replaceSection(status, '## 原著关系候选复核队列', statusBlock);
fs.writeFileSync(STATUS, status, 'utf8');

const indexBlock = `\n## 原著关系候选复核入口（${DATE}）\n\n章节共现关系候选已生成复核队列，用于后续把高置信人物-人物关系人工提升到 \`relationship-graph.json\`。\n\n${table}\n\n入口文件：\n\n- \`campaigns/world-library/worlds/*/curated/original-relationship-review-queue.json\`\n- \`campaigns/world-library/worlds/*/curated/original-relationship-review-queue.md\`\n`;
let index = fs.readFileSync(INDEX, 'utf8');
index = replaceSection(index, '## 原著关系候选复核入口', indexBlock);
fs.writeFileSync(INDEX, index, 'utf8');

let finalMd = fs.readFileSync(path.join(REPORT, 'original-refinement-final-report.md'), 'utf8');
finalMd += `\n## Relationship Review Queue\n\n${table}\n`;
fs.writeFileSync(path.join(REPORT, 'original-refinement-final-report.md'), finalMd, 'utf8');

const audit = { createdAt: NOW, jsonFilesChecked: json.files.length, badJson: json.bad, relationshipReview: reviewTotals };
writeJson(path.join(REPORT, 'original-relationship-docs-sync-audit.json'), audit);
let md = '# Original Relationship Docs Sync Audit\n\n';
md += `更新日期：${NOW}\n\nJSON checked: ${json.files.length}\n\nBad JSON: ${json.bad.length}\n\n${table}`;
fs.writeFileSync(path.join(REPORT, 'original-relationship-docs-sync-audit.md'), md, 'utf8');
console.log(JSON.stringify({ ok: json.bad.length === 0, jsonFilesChecked: json.files.length, relationshipReview: reviewTotals }, null, 2));
