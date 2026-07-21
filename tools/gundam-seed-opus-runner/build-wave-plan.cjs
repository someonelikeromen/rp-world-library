#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) { out[key] = next; i++; }
        else out[key] = true;
      }
    } else out._.push(a);
  }
  return out;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { ensureDir(path.dirname(file)); fs.writeFileSync(file, text, 'utf8'); }
function splitEven(items, chunkCount) {
  const chunks = Array.from({ length: chunkCount }, () => []);
  items.forEach((item, idx) => chunks[idx % chunkCount].push(item));
  return chunks;
}
function refItems(items) {
  return items.map(item => ({
    opusId: item.opusId,
    title: item.title,
    category: item.category,
    scope: item.scope,
    extensionMentions: item.extensionMentions || [],
    detailPath: item.detailPath,
    manifestPath: item.manifestPath,
    sourceRef: item.url
  }));
}
function packet(id, waveId, stage, scope, items, notes = []) {
  return {
    packetId: id,
    waveId,
    stage,
    scope,
    expectedCount: items.length,
    continuityPolicy: scope === 'extension-candidate' ? 'extension-candidates-only; do not merge into base SEED core' : 'base-seed core; extension mentions must remain notes unless promoted by review',
    sourceRefs: ['bilibili-space:102672286/upload/opus'],
    inputOpusIds: items.map(i => i.opusId),
    outputs: {
      extractedRoot: `extracted/${waveId}/`,
      coverageReport: `audit/extended-coverage/${waveId}/${id}/extended-coverage-report.json`,
      gapIndex: `audit/extended-coverage/${waveId}/${id}/extended-gap-index.json`,
      finalStatus: `audit/packet-audits/${waveId}/${id}/final-status.json`
    },
    requirements: [
      'use detail JSON text as primary source evidence',
      'use vision outputs only as image evidence metadata unless corroborated',
      'write one formal entity/event/rule fragment per stable id, not one giant batch JSON',
      'preserve sourceRefs and claim/evidence/fact separation',
      'record extension mentions separately from base facts'
    ],
    forbidden: [
      'do not write author interpretation as canon fact',
      'do not merge Destiny/Freedom/Astray/MSV facts into base SEED core',
      'do not use graph output to overwrite entity facts',
      'do not omit sourceRefs'
    ],
    acceptance: [
      'expectedCount matched',
      'all generated formal files validate as JSON',
      'minimumGate recorded',
      'extendedGate recorded',
      'gap index exists even when empty'
    ],
    notes,
    itemRefs: refItems(items)
  };
}
function markdown(plan) {
  const lines = [];
  lines.push('# Gundam SEED Reorganized Wave Plan');
  lines.push('');
  lines.push(`- Generated: ${plan.generatedAt}`);
  lines.push(`- Source inventory: ${plan.sourceInventoryRef}`);
  lines.push(`- Total opus covered: ${plan.totalOpus}`);
  lines.push('');
  lines.push('## Waves');
  lines.push('');
  lines.push('| Wave | Packet | Scope | Expected |');
  lines.push('|---|---|---|---:|');
  for (const p of plan.workPackets) lines.push(`| ${p.waveId} | ${p.packetId} | ${p.scope} | ${p.expectedCount} |`);
  lines.push('');
  lines.push('## Core Rules');
  lines.push('');
  for (const rule of plan.rules) lines.push(`- ${rule}`);
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This supersedes the older broad a/b packet split for the next extraction pass.');
  lines.push('- Old work-packets remain historical until explicitly regenerated or retired.');
  lines.push('- Extension candidate packets are allowed to preserve evidence but not merge into base SEED core.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const inventory = readJson(path.join(planDir, 'source-inventory.json'));
  const items = inventory.items || [];
  const base = items.filter(i => i.scope === 'seed_core' && i.category !== 'novel_translation');
  const extensions = items.filter(i => i.scope !== 'seed_core' || i.category === 'novel_translation');
  const mobileChunks = splitEven(base.filter(i => i.category === 'mobile_suit'), 2);
  const characterChunks = splitEven(base.filter(i => i.category === 'character'), 2);
  const packets = [
    packet('pkt-seed-wave-000-source-inventory', 'wave-000', 'source-inventory', 'all-source-layer', items, ['already generated source-inventory/source-opus-map/source-gaps']),
    packet('pkt-seed-wave-001-base-world-rules', 'wave-001', 'extract-world-rules', 'base-seed world rules and technology', base.filter(i => i.category === 'world_rule')),
    packet('pkt-seed-wave-002-base-characters-a', 'wave-002', 'extract-characters', 'base-seed characters A', characterChunks[0]),
    packet('pkt-seed-wave-003-base-characters-b', 'wave-003', 'extract-characters', 'base-seed characters B', characterChunks[1]),
    packet('pkt-seed-wave-004-base-mobile-suits-a', 'wave-004', 'extract-mobile-suits', 'base-seed mobile suits A', mobileChunks[0]),
    packet('pkt-seed-wave-005-base-mobile-suits-b', 'wave-005', 'extract-mobile-suits', 'base-seed mobile suits B', mobileChunks[1]),
    packet('pkt-seed-wave-006-base-warships', 'wave-006', 'extract-warships', 'base-seed warships', base.filter(i => i.category === 'warship')),
    packet('pkt-seed-wave-007-base-battles', 'wave-007', 'extract-events', 'base-seed battles and events', base.filter(i => i.category === 'battle')),
    packet('pkt-seed-wave-008-interpretation-controversy', 'wave-008', 'extract-interpretation', 'interpretation and controversy notes', base.filter(i => i.category === 'controversy'), ['interpretation-only packet; never overwrites source-backed facts']),
    packet('pkt-seed-wave-009-extension-candidates', 'wave-009', 'extract-extension-candidates', 'extension-candidate', extensions, ['Destiny/Freedom/Astray/MSV preservation packet; do not merge into base SEED core'])
  ];
  const plan = {
    schema: 'gundam-seed-reorganized-wave-plan-v1',
    generatedAt: new Date().toISOString(),
    sourceInventoryRef: path.join(planDir, 'source-inventory.json'),
    visionSampleReportRef: path.join(planDir, 'vision-sample-report.json'),
    totalOpus: items.length,
    counts: {
      baseSeedCore: base.length,
      extensionCandidates: extensions.length,
      byPacket: Object.fromEntries(packets.map(p => [p.packetId, p.expectedCount]))
    },
    rules: [
      'current worldbook is an entity seed only, not final truth',
      'Bilibili detail text is primary source evidence for this pass',
      'vision output is image evidence metadata and must be corroborated before fact merge',
      'base SEED facts and Destiny/Freedom/Astray/MSV candidates remain separate',
      'minimumGate controls merge eligibility; extendedGate controls deploy readiness'
    ],
    workPackets: packets
  };
  writeJson(path.join(planDir, 'reorganized-wave-plan.json'), plan);
  writeText(path.join(planDir, 'reorganized-wave-plan.md'), markdown(plan));
  console.log(JSON.stringify({ ok: true, planPath: path.join(planDir, 'reorganized-wave-plan.json'), counts: plan.counts }, null, 2));
}
main();
