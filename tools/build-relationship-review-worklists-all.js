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
function scorePacket(p) {
  const statusScore = {
    'ready-for-human-semantic-review': 100000,
    'context-anchor-review': 50000,
    'review-with-limited-evidence': 25000,
    'search-signal-only': 5000,
    'blocked-no-evidence-hit': 0
  }[p.reviewStatus] || 0;
  const classScore = p.class === 'character-character' ? 1000 : p.class && p.class.includes('character') ? 500 : 100;
  return statusScore + classScore + (p.weight || 0) * 10 + (p.evidenceHitCount || 0);
}
function suggestedPromotionGate(p) {
  if (p.reviewStatus !== 'ready-for-human-semantic-review') return 'do-not-promote-yet';
  if (p.class !== 'character-character') return 'do-not-promote-yet';
  if ((p.evidenceHitCount || 0) < 20) return 'needs-more-evidence';
  return 'eligible-for-manual-semantic-labeling';
}
function buildWorld(world) {
  const curated = path.join(ROOT, world, 'curated');
  const packetPath = path.join(curated, 'original-relationship-review-packets.json');
  if (!exists(packetPath)) return null;
  const packetDoc = readJson(packetPath);
  const packets = (packetDoc.packets || []).map(p => ({ ...p, workScore: scorePacket(p), promotionGate: suggestedPromotionGate(p) })).sort((a, b) => b.workScore - a.workScore || a.id.localeCompare(b.id));
  const eligible = packets.filter(p => p.promotionGate === 'eligible-for-manual-semantic-labeling');
  const batches = [];
  const batchSize = 20;
  for (let i = 0; i < eligible.length; i += batchSize) {
    batches.push({
      id: `${world}-relationship-review-batch-${String(batches.length + 1).padStart(2, '0')}`,
      status: 'pending-human-review',
      size: eligible.slice(i, i + batchSize).length,
      packetIds: eligible.slice(i, i + batchSize).map(p => p.id),
      instruction: 'Open packet evidence/sourceRefs, assign an explicit semantic label only if the relationship is directly supported, then write confirmed edge to relationship-graph.json.'
    });
  }
  const worklist = {
    schema: 'rp-original-relationship-review-worklist-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Worklist for human semantic promotion. No relationship is promoted automatically. Only eligible-for-manual-semantic-labeling packets may be considered for relationship-graph after source review.',
    coverage: {
      packets: packets.length,
      eligible: eligible.length,
      batches: batches.length,
      deferred: packets.length - eligible.length
    },
    batches,
    eligiblePackets: eligible,
    deferredPackets: packets.filter(p => p.promotionGate !== 'eligible-for-manual-semantic-labeling')
  };
  writeJson(path.join(curated, 'original-relationship-review-worklist.json'), worklist);
  let md = `# ${world} Original Relationship Review Worklist\n\n更新日期：${NOW}\n\n`;
  md += '用途：把关系证据包转成可执行的人工复核批次。此文件不自动提升任何关系；只有人工读 sourceRefs 后，才能写入正式 relationship-graph。\n\n';
  md += `- Packets: ${packets.length}\n- Eligible for manual semantic labeling: ${eligible.length}\n- Batches: ${batches.length}\n- Deferred: ${packets.length - eligible.length}\n\n`;
  md += '## Batches\n\n| batch | size | status | instruction |\n|---|---:|---|---|\n';
  for (const b of batches) md += `| ${b.id} | ${b.size} | ${b.status} | ${b.instruction} |\n`;
  md += '\n## First Eligible Packets\n\n| relationship | weight | evidence | gate | first refs |\n|---|---:|---:|---|---|\n';
  for (const p of eligible.slice(0, 80)) {
    md += `| ${p.source} ↔ ${p.target} | ${p.weight} | ${p.evidenceHitCount} | ${p.promotionGate} | ${(p.sourceRefs || []).slice(0, 3).map(x => '`' + x + '`').join('<br>')} |\n`;
  }
  fs.writeFileSync(path.join(curated, 'original-relationship-review-worklist.md'), md, 'utf8');
  const runtimePath = path.join(curated, 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.relationshipReviewWorklist = 'curated/original-relationship-review-worklist.json';
    runtime.files.relationshipReviewWorklistMarkdown = 'curated/original-relationship-review-worklist.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.relationshipReviewEligible = eligible.length;
    runtime.coverage.relationshipReviewBatches = batches.length;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, packets: packets.length, eligible: eligible.length, batches: batches.length, deferred: packets.length - eligible.length };
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
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'curated', 'original-relationship-review-packets.json'))).sort();
  const reports = worlds.map(buildWorld).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-relationship-review-worklist-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Relationship Review Worklist Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮把关系证据包转换为人工语义复核批次。仍不自动写入 relationship-graph。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | packets | eligible | batches | deferred |\n|---|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.packets} | ${r.eligible} | ${r.batches} | ${r.deferred} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-relationship-review-worklist-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
