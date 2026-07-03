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
function pairClass(r) { return [r.sourceKind || 'unknown', r.targetKind || 'unknown'].sort().join('-'); }
function strength(weight, chapterHits) {
  if (weight >= 80 || chapterHits >= 50) return 'very-high';
  if (weight >= 35 || chapterHits >= 20) return 'high';
  if (weight >= 12 || chapterHits >= 8) return 'medium';
  return 'low';
}
function reviewAction(r) {
  const cls = pairClass(r);
  const s = strength(r.weight || 0, r.chapterHits || 0);
  if (cls === 'character-character' && (s === 'very-high' || s === 'high')) return 'semantic-review-priority';
  if (cls.includes('character') && (s === 'very-high' || s === 'high')) return 'rp-context-anchor';
  if (s === 'medium') return 'keep-as-search-signal';
  return 'low-priority-signal';
}
function normalize(r) {
  const cls = pairClass(r);
  const s = strength(r.weight || 0, r.chapterHits || 0);
  return {
    id: r.id,
    class: cls,
    source: r.source,
    target: r.target,
    sourceName: r.sourceName,
    targetName: r.targetName,
    weight: r.weight || 0,
    chapterHits: r.chapterHits || 0,
    strength: s,
    reviewAction: reviewAction(r),
    arcs: r.arcs || [],
    seriesHits: r.seriesHits || {},
    evidenceRefs: (r.sourceRefs || []).slice(0, 20),
    caution: '章节共现候选；必须经语义复核后才能写入人工 relationship-graph。'
  };
}
function buildWorld(world) {
  const worldRoot = path.join(ROOT, world);
  const curated = path.join(worldRoot, 'curated');
  const relPath = path.join(curated, 'original-relationship-candidates.json');
  if (!exists(relPath)) return null;
  const rels = readJson(relPath).relationships || [];
  const normalized = rels.map(normalize).sort((a, b) => b.weight - a.weight || b.chapterHits - a.chapterHits || a.id.localeCompare(b.id));
  const byClass = {};
  const byAction = {};
  const byStrength = {};
  for (const r of normalized) {
    byClass[r.class] = (byClass[r.class] || 0) + 1;
    byAction[r.reviewAction] = (byAction[r.reviewAction] || 0) + 1;
    byStrength[r.strength] = (byStrength[r.strength] || 0) + 1;
  }
  const priority = normalized.filter(r => r.reviewAction === 'semantic-review-priority').slice(0, 120);
  const anchors = normalized.filter(r => r.reviewAction === 'rp-context-anchor').slice(0, 120);
  const searchSignals = normalized.filter(r => r.reviewAction === 'keep-as-search-signal').slice(0, 160);
  const queue = {
    schema: 'rp-original-relationship-review-queue-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Candidate relationships are ranked for semantic review. Only semantic-review-priority items should be considered for promotion into curated relationship-graph after manual verification.',
    coverage: {
      candidates: normalized.length,
      priority: priority.length,
      anchors: anchors.length,
      searchSignals: searchSignals.length,
      byClass,
      byAction,
      byStrength
    },
    priority,
    anchors,
    searchSignals,
    allCandidates: normalized
  };
  writeJson(path.join(curated, 'original-relationship-review-queue.json'), queue);
  let md = `# ${world} Original Relationship Review Queue\n\n更新日期：${NOW}\n\n`;
  md += '说明：本文件把章节共现关系候选分层。高权重人物-人物共现进入 semantic-review-priority，但仍不得直接当作语义关系；需要人工复核来源章节后再写入 relationship-graph。\n\n';
  md += `- Candidates: ${normalized.length}\n- Priority: ${priority.length}\n- Anchors: ${anchors.length}\n- Search signals: ${searchSignals.length}\n\n`;
  md += '## By Class\n\n| class | count |\n|---|---:|\n';
  for (const [k, v] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) md += `| ${k} | ${v} |\n`;
  md += '\n## Semantic Review Priority\n\n| source | target | weight | chapters | arcs | evidence |\n|---|---|---:|---:|---|---|\n';
  for (const r of priority.slice(0, 80)) md += `| ${r.source} | ${r.target} | ${r.weight} | ${r.chapterHits} | ${(r.arcs || []).slice(0, 4).join('；') || '—'} | ${(r.evidenceRefs || []).slice(0, 3).map(x => '`' + x + '`').join('<br>')} |\n`;
  md += '\n## RP Context Anchors\n\n| source | target | weight | chapters | action |\n|---|---|---:|---:|---|\n';
  for (const r of anchors.slice(0, 80)) md += `| ${r.source} | ${r.target} | ${r.weight} | ${r.chapterHits} | ${r.reviewAction} |\n`;
  fs.writeFileSync(path.join(curated, 'original-relationship-review-queue.md'), md, 'utf8');

  const runtimePath = path.join(curated, 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.relationshipReviewQueue = 'curated/original-relationship-review-queue.json';
    runtime.files.relationshipReviewQueueMarkdown = 'curated/original-relationship-review-queue.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.relationshipReviewPriority = priority.length;
    runtime.coverage.relationshipReviewAnchors = anchors.length;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, candidates: normalized.length, priority: priority.length, anchors: anchors.length, searchSignals: searchSignals.length, byClass, byAction, byStrength };
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
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'curated', 'original-relationship-candidates.json'))).sort();
  const reports = worlds.map(buildWorld).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-relationship-review-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Relationship Review Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮将章节共现关系候选分层为 semantic-review-priority / rp-context-anchor / search-signal，以减少误把共现当语义关系的风险。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | candidates | semantic priority | RP anchors | search signals |\n|---|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.candidates} | ${r.priority} | ${r.anchors} | ${r.searchSignals} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-relationship-review-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
