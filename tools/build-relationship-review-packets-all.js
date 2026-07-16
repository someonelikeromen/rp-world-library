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
function normEntityId(s) { return String(s || '').replace(/^(character|place|term):/, ''); }
function loadEvents(world) {
  const dir = path.join(ROOT, world, 'curated', 'stories');
  const events = [];
  if (!exists(dir)) return events;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!/^original-chapter-events-.*-refined-all\.json$/.test(f)) continue;
    const inc = readJson(path.join(dir, f));
    events.push(...(inc.events || []));
  }
  return events;
}
function eventHas(event, name) {
  return (event.characters || []).includes(name) || (event.places || []).includes(name) || (event.terms || []).includes(name);
}
function collectEvidence(events, sourceName, targetName) {
  const a = normEntityId(sourceName);
  const b = normEntityId(targetName);
  const hits = [];
  for (const e of events) {
    if (eventHas(e, a) && eventHas(e, b)) {
      hits.push({
        eventId: e.id,
        series: e.series,
        volume: e.volume,
        chapterIndex: e.chapterIndex,
        chapterTitle: e.chapterTitle,
        eventType: e.eventType,
        arcs: e.arcs || [],
        summary: e.summary,
        sourceRef: e.sourceRef,
        characters: e.characters || [],
        places: e.places || [],
        terms: e.terms || []
      });
    }
  }
  return hits;
}
function reviewStatus(rel, hits) {
  if (!hits.length) return 'blocked-no-evidence-hit';
  if (rel.class === 'character-character' && hits.length >= 20) return 'ready-for-human-semantic-review';
  if (rel.class === 'character-character') return 'review-with-limited-evidence';
  if (rel.class.includes('character') && hits.length >= 20) return 'context-anchor-review';
  return 'search-signal-only';
}
function buildWorld(world) {
  const curated = path.join(ROOT, world, 'curated');
  const queuePath = path.join(curated, 'original-relationship-review-queue.json');
  if (!exists(queuePath)) return null;
  const queue = readJson(queuePath);
  const events = loadEvents(world);
  const selected = [
    ...(queue.priority || []),
    ...(queue.anchors || []).slice(0, 80),
    ...(queue.searchSignals || []).slice(0, 40)
  ];
  const packets = [];
  for (const rel of selected) {
    const hits = collectEvidence(events, rel.sourceName || rel.source, rel.targetName || rel.target);
    const status = reviewStatus(rel, hits);
    packets.push({
      id: `packet:${rel.id}`,
      relationshipId: rel.id,
      worldId: world,
      source: rel.source,
      target: rel.target,
      sourceName: rel.sourceName,
      targetName: rel.targetName,
      class: rel.class,
      weight: rel.weight,
      chapterHits: rel.chapterHits,
      strength: rel.strength,
      reviewAction: rel.reviewAction,
      reviewStatus: status,
      evidenceHitCount: hits.length,
      evidence: hits.slice(0, 12),
      sourceRefs: [...new Set(hits.map(h => h.sourceRef))].slice(0, 24),
      guidance: status === 'ready-for-human-semantic-review'
        ? 'Read evidence refs and decide a concrete semantic relation label before promotion.'
        : status === 'blocked-no-evidence-hit'
          ? 'Do not promote; candidate lacks matching chapter-event evidence after normalization.'
          : 'Use as runtime context/search signal until human semantic review is complete.'
    });
  }
  const byStatus = packets.reduce((m, p) => (m[p.reviewStatus] = (m[p.reviewStatus] || 0) + 1, m), {});
  const out = {
    schema: 'rp-original-relationship-review-packets-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Evidence packets for relationship review. These are not promoted semantic edges; they collect source-backed chapter-event evidence for human verification.',
    coverage: { packets: packets.length, byStatus },
    packets
  };
  writeJson(path.join(curated, 'original-relationship-review-packets.json'), out);
  let md = `# ${world} Original Relationship Review Packets\n\n更新日期：${NOW}\n\n`;
  md += '用途：为关系候选提供 chapter-event 证据包。只有人工阅读 evidence/sourceRefs 并确认语义后，才能提升到正式 relationship-graph。\n\n';
  md += `- Packets: ${packets.length}\n`;
  for (const [k, v] of Object.entries(byStatus).sort()) md += `- ${k}: ${v}\n`;
  md += '\n## Ready For Human Semantic Review\n\n| relationship | class | weight | evidence | refs | guidance |\n|---|---|---:|---:|---|---|\n';
  for (const p of packets.filter(x => x.reviewStatus === 'ready-for-human-semantic-review').slice(0, 120)) {
    md += `| ${p.source} ↔ ${p.target} | ${p.class} | ${p.weight} | ${p.evidenceHitCount} | ${p.sourceRefs.slice(0, 3).map(x => '`' + x + '`').join('<br>')} | ${p.guidance} |\n`;
  }
  fs.writeFileSync(path.join(curated, 'original-relationship-review-packets.md'), md, 'utf8');
  const runtimePath = path.join(curated, 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.relationshipReviewPackets = 'curated/original-relationship-review-packets.json';
    runtime.files.relationshipReviewPacketsMarkdown = 'curated/original-relationship-review-packets.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.relationshipReviewPackets = packets.length;
    runtime.coverage.relationshipReviewReady = byStatus['ready-for-human-semantic-review'] || 0;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, packets: packets.length, byStatus };
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
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'curated', 'original-relationship-review-queue.json'))).sort();
  const reports = worlds.map(buildWorld).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-relationship-review-packets-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Relationship Review Packets Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮为关系候选生成 source-backed review packets，供后续人工语义提升使用。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | packets | ready | context-anchor | limited | blocked | search-only |\n|---|---:|---:|---:|---:|---:|---:|\n';
  for (const r of reports) {
    md += `| ${r.world} | ${r.packets} | ${r.byStatus['ready-for-human-semantic-review'] || 0} | ${r.byStatus['context-anchor-review'] || 0} | ${r.byStatus['review-with-limited-evidence'] || 0} | ${r.byStatus['blocked-no-evidence-hit'] || 0} | ${r.byStatus['search-signal-only'] || 0} |\n`;
  }
  fs.writeFileSync(path.join(REPORT_DIR, 'original-relationship-review-packets-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
