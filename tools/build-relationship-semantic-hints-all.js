const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

const KEYWORDS = {
  romance: ['亲吻', '吻', '喜欢', '爱', '恋', '情人', '恋人', '约会', '嫉妒', '脸红', '拥抱'],
  alliance: ['同伴', '伙伴', '协助', '合作', '支援', '帮助', '信任', '并肩', '一起', '同行'],
  service: ['骑士', '王', '主人', '侍奉', '效忠', '命令', '部下', '臣下', '保护', '守护'],
  conflict: ['敌', '战斗', '决斗', '攻击', '杀', '对峙', '冲突', '交战', '打倒', '挑战'],
  family: ['妹妹', '姐姐', '哥哥', '弟弟', '姊', '兄', '妹', '姐', '父亲', '母亲', '家人'],
  rivalry: ['竞争', '对手', '宿敌', '劲敌', '较量', '胜负']
};

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function rel(p) { return p.split(path.sep).join('/'); }
function textIncludesName(text, name) { return !!name && text.includes(name); }
function paragraphs(text) { return text.split(/\r?\n+/).map(s => s.trim()).filter(Boolean); }
function countKeywords(text) {
  const hits = {};
  for (const [category, words] of Object.entries(KEYWORDS)) {
    let count = 0;
    const matched = [];
    for (const w of words) {
      const n = text.split(w).length - 1;
      if (n > 0) {
        count += n;
        matched.push(w);
      }
    }
    if (count > 0) hits[category] = { count, matched: [...new Set(matched)].slice(0, 12) };
  }
  return hits;
}
function mergeHits(total, hits) {
  for (const [cat, data] of Object.entries(hits)) {
    total[cat] = total[cat] || { count: 0, matched: [] };
    total[cat].count += data.count;
    total[cat].matched = [...new Set([...total[cat].matched, ...data.matched])].slice(0, 20);
  }
}
function topCategories(hits) {
  return Object.entries(hits).sort((a, b) => b[1].count - a[1].count).map(([k, v]) => ({ category: k, count: v.count, matched: v.matched }));
}
function suggestedLabels(packet, cats, coParagraphs) {
  if (!coParagraphs) return ['insufficient-direct-paragraph-evidence'];
  const names = cats.map(c => c.category);
  const labels = [];
  if (names.includes('service')) labels.push('lord-knight-or-protector-dynamic');
  if (names.includes('alliance')) labels.push('ally-or-companion');
  if (names.includes('romance')) labels.push('possible-romantic-tension');
  if (names.includes('conflict')) labels.push('conflict-or-rivalry');
  if (names.includes('family')) labels.push('possible-family-relation');
  if (names.includes('rivalry')) labels.push('rivalry');
  if (!labels.length && packet.class === 'character-character') labels.push('major-cooccurrence-needs-human-label');
  return [...new Set(labels)].slice(0, 4);
}
function analyzePacket(worldRoot, packet) {
  const sourceName = packet.sourceName || String(packet.source || '').replace(/^character:/, '');
  const targetName = packet.targetName || String(packet.target || '').replace(/^character:/, '');
  const refs = [...new Set(packet.sourceRefs || [])].slice(0, 24);
  const aggregate = {};
  const chapterEvidence = [];
  let directParagraphs = 0;
  let filesRead = 0;
  for (const ref of refs) {
    const filePath = path.join(worldRoot, ref);
    if (!exists(filePath)) continue;
    filesRead++;
    const text = fs.readFileSync(filePath, 'utf8');
    const paras = paragraphs(text);
    let direct = 0;
    const localHits = {};
    for (const p of paras) {
      if (textIncludesName(p, sourceName) && textIncludesName(p, targetName)) {
        direct++;
        mergeHits(localHits, countKeywords(p));
      }
    }
    directParagraphs += direct;
    mergeHits(aggregate, localHits);
    chapterEvidence.push({ sourceRef: ref, directCoParagraphs: direct, semanticKeywordHits: topCategories(localHits) });
  }
  const categories = topCategories(aggregate);
  return {
    relationshipId: packet.relationshipId,
    packetId: packet.id,
    source: packet.source,
    target: packet.target,
    sourceName,
    targetName,
    class: packet.class,
    worklistStatus: packet.promotionGate || 'eligible-for-manual-semantic-labeling',
    filesRead,
    directCoParagraphs: directParagraphs,
    semanticKeywordHits: categories,
    suggestedLabels: suggestedLabels(packet, categories, directParagraphs),
    confidence: directParagraphs >= 20 && categories.length ? 'hint-rich' : directParagraphs >= 5 ? 'direct-cooccurrence-only' : 'weak',
    caution: 'Semantic hints are keyword evidence only. Do not promote without reading sourceRefs.',
    chapterEvidence: chapterEvidence.filter(e => e.directCoParagraphs > 0 || e.semanticKeywordHits.length).slice(0, 24)
  };
}
function buildWorld(world) {
  const worldRoot = path.join(ROOT, world);
  const curated = path.join(worldRoot, 'curated');
  const workPath = path.join(curated, 'original-relationship-review-worklist.json');
  if (!exists(workPath)) return null;
  const work = readJson(workPath);
  const eligible = work.eligiblePackets || [];
  const hints = eligible.map(p => analyzePacket(worldRoot, p)).sort((a, b) => {
    const rank = { 'hint-rich': 3, 'direct-cooccurrence-only': 2, weak: 1 };
    return (rank[b.confidence] || 0) - (rank[a.confidence] || 0) || b.directCoParagraphs - a.directCoParagraphs || a.relationshipId.localeCompare(b.relationshipId);
  });
  const byConfidence = hints.reduce((m, h) => (m[h.confidence] = (m[h.confidence] || 0) + 1, m), {});
  const byLabel = {};
  for (const h of hints) for (const label of h.suggestedLabels) byLabel[label] = (byLabel[label] || 0) + 1;
  const out = {
    schema: 'rp-original-relationship-semantic-hints-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Keyword/count hints from raw text for eligible relationship packets. No verbatim source text is stored; no semantic edge is promoted automatically.',
    coverage: { hints: hints.length, byConfidence, byLabel },
    hints
  };
  writeJson(path.join(curated, 'original-relationship-semantic-hints.json'), out);
  let md = `# ${world} Original Relationship Semantic Hints\n\n更新日期：${NOW}\n\n`;
  md += '用途：从 raw-text 中统计 eligible 关系的共同段落与语义关键词。此文件不含长段原文，也不自动提升关系。\n\n';
  md += `- Hints: ${hints.length}\n`;
  for (const [k, v] of Object.entries(byConfidence).sort()) md += `- ${k}: ${v}\n`;
  md += '\n## Top Hints\n\n| relationship | confidence | direct paragraphs | labels | keyword categories | refs |\n|---|---|---:|---|---|---|\n';
  for (const h of hints.slice(0, 80)) {
    md += `| ${h.source} ↔ ${h.target} | ${h.confidence} | ${h.directCoParagraphs} | ${h.suggestedLabels.join('；')} | ${h.semanticKeywordHits.slice(0, 4).map(c => `${c.category}:${c.count}`).join('；') || '—'} | ${h.chapterEvidence.slice(0, 3).map(e => '`' + e.sourceRef + '`').join('<br>')} |\n`;
  }
  fs.writeFileSync(path.join(curated, 'original-relationship-semantic-hints.md'), md, 'utf8');
  const runtimePath = path.join(curated, 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.relationshipSemanticHints = 'curated/original-relationship-semantic-hints.json';
    runtime.files.relationshipSemanticHintsMarkdown = 'curated/original-relationship-semantic-hints.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.relationshipSemanticHints = hints.length;
    runtime.coverage.relationshipSemanticHintRich = byConfidence['hint-rich'] || 0;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, hints: hints.length, byConfidence, byLabel };
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
  walk(ROOT);
  walk(REPORT_DIR);
  const bad = [];
  for (const f of files) {
    try { JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { bad.push({ file: rel(f), error: e.message }); }
  }
  return { filesChecked: files.length, bad };
}
function main() {
  ensureDir(REPORT_DIR);
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'curated', 'original-relationship-review-worklist.json'))).sort();
  const reports = worlds.map(buildWorld).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-relationship-semantic-hints-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Relationship Semantic Hints Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮从 raw-text 统计 eligible 关系的共同段落与语义关键词；不保存长段原文，不自动提升正式关系。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | hints | hint-rich | direct-only | weak |\n|---|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.hints} | ${r.byConfidence['hint-rich'] || 0} | ${r.byConfidence['direct-cooccurrence-only'] || 0} | ${r.byConfidence.weak || 0} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-relationship-semantic-hints-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
