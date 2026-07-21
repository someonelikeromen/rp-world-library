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
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { ensureDir(path.dirname(file)); fs.writeFileSync(file, text, 'utf8'); }
function stableId(prefix, opusId, subject) {
  const ascii = String(subject || '').trim()
    .replace(/[【】（）()\[\]：:，,。、《》<>“”"'\\/|?*\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${prefix}-${opusId}${ascii ? '-' + ascii : ''}`;
}
function splitSections(text) {
  const lines = String(text || '').split(/\r?\n/);
  const sections = [];
  let current = { heading: '正文', text: [] };
  for (const line of lines) {
    const m = line.match(/^#+\s*(.+)$/);
    if (m) {
      if (current.text.join('\n').trim()) sections.push({ heading: current.heading, text: current.text.join('\n').trim() });
      current = { heading: m[1].trim(), text: [] };
    } else current.text.push(line);
  }
  if (current.text.join('\n').trim()) sections.push({ heading: current.heading, text: current.text.join('\n').trim() });
  return sections;
}
function bracketPairs(text) {
  const out = [];
  const re = /【([^【】：:]{1,40})[：:]([^【】]{1,300})】/g;
  let m;
  while ((m = re.exec(text))) out.push({ key: m[1].trim(), value: m[2].trim() });
  return out;
}
function bracketClaims(text) {
  const out = [];
  const re = /【([^【】]{2,60})】([^【#\n]{0,800})/g;
  let m;
  while ((m = re.exec(text))) {
    const label = m[1].trim();
    const body = m[2].trim();
    if (body || !/[：:]/.test(label)) out.push({ label, text: body });
  }
  return out.slice(0, 80);
}
function firstNonEmptySection(sections) {
  const sec = sections.find(s => s.text && s.text.trim());
  return sec ? sec.text.trim().slice(0, 600) : '';
}
function kindForCategory(category) {
  return {
    mobile_suit: 'mobile-suit',
    character: 'character',
    warship: 'warship',
    battle: 'event',
    world_rule: 'rule',
    controversy: 'interpretation',
    novel_translation: 'source-excerpt'
  }[category] || 'source-excerpt';
}
function domainForKind(kind) {
  return {
    'mobile-suit': 'mobile-suits',
    character: 'characters',
    warship: 'warships',
    event: 'events',
    rule: 'rules',
    interpretation: 'interpretations',
    'source-excerpt': 'source-excerpts'
  }[kind] || 'source-excerpts';
}
function sourceTypeForCategory(category) {
  if (category === 'controversy') return 'analysis-interpretation';
  if (category === 'battle') return 'battle-analysis';
  if (category === 'novel_translation') return 'novel-translation-reference';
  return 'encyclopedia-entry';
}
function continuityForItem(item) {
  if (item.scope === 'seed_core') return 'base-seed';
  return item.scope;
}
function buildSourceRecord(item, detail, manifest) {
  const text = String(detail && (detail.contentText || detail.moduleText) || '');
  return {
    schema: 'source-record-v1',
    sourceId: `bilibili-opus-${item.opusId}`,
    sourceRef: item.sourceRef || item.url,
    opusId: item.opusId,
    title: item.title,
    subject: item.subject || item.title,
    category: item.category,
    continuityLayer: continuityForItem(item),
    extensionMentions: item.extensionMentions || [],
    sourceType: sourceTypeForCategory(item.category),
    credibility: 'secondary-curated-cn',
    canonStatus: item.category === 'controversy' ? 'interpretation-only' : 'source-backed-claim-candidate',
    detailPath: item.detailPath,
    manifestPath: item.manifestPath,
    contentTextChars: text.length,
    imageCount: manifest && Array.isArray(manifest.images) ? manifest.images.length : 0,
    generatedAt: new Date().toISOString()
  };
}
function extractEntity(item, detail, manifest, packet) {
  const text = String(detail && (detail.contentText || detail.moduleText) || '');
  const sections = splitSections(text);
  const pairs = bracketPairs(text);
  const claims = bracketClaims(text);
  const kind = kindForCategory(item.category);
  const prefix = kind.replace(/[^a-z]+/g, '-');
  const id = stableId(prefix, item.opusId, item.subject || item.title);
  const sourceRef = item.sourceRef || item.url;
  const common = {
    schema: 'gundam-seed-source-backed-fragment-v1',
    fragmentId: `${id}.fragment`,
    entityId: id,
    kind,
    name: item.subject || item.title,
    title: item.title,
    category: item.category,
    continuityLayer: continuityForItem(item),
    scope: item.scope,
    extensionMentions: item.extensionMentions || [],
    sourceRefs: [sourceRef],
    sourceRecordRefs: [`sources/opus/${item.opusId}.source.json`],
    provenance: {
      sourceType: sourceTypeForCategory(item.category),
      sourceAccount: '飞燕惊澜',
      uid: '102672286',
      opusId: item.opusId,
      detailPath: item.detailPath,
      manifestPath: item.manifestPath
    },
    extractionPolicy: {
      sourceBackedOnly: true,
      authorAnalysisIsCanon: false,
      visionIsEvidenceMetadataOnly: true
    },
    summaryCandidate: firstNonEmptySection(sections),
    structuredFields: Object.fromEntries(pairs.map(p => [p.key, p.value])),
    claims: claims.map((c, idx) => ({ claimId: `${id}-claim-${String(idx + 1).padStart(3, '0')}`, label: c.label, text: c.text, sourceRef, confidence: 'source-text' })),
    sections: sections.map((s, idx) => ({ sectionId: `${id}-section-${String(idx + 1).padStart(3, '0')}`, heading: s.heading, text: s.text, sourceRef })),
    imageEvidence: manifest && Array.isArray(manifest.images) ? manifest.images.map(img => ({ imageRef: `${item.opusId}:${img.index}`, localPath: img.localPath, url: img.url, width: img.width, height: img.height })) : [],
    gates: {
      minimumGate: {
        status: text && sourceRef ? 'passed' : 'failed',
        reasons: text && sourceRef ? [] : ['missing text or sourceRef']
      },
      extendedGate: {
        status: 'partial',
        reasons: ['automated first-pass fragment; requires domain-specific audit before deploy']
      }
    },
    generatedByPacket: packet.packetId,
    generatedAt: new Date().toISOString()
  };
  if (kind === 'interpretation') common.canonStatus = 'interpretation-only';
  if (packet.scope === 'extension-candidate') common.mergePolicy = 'preserve-only-do-not-merge-into-base-seed';
  return common;
}
function coverageForPacket(packet, fragments, missing) {
  const passed = fragments.filter(f => f.gates.minimumGate.status === 'passed').length;
  const partial = fragments.filter(f => f.gates.extendedGate.status === 'partial').length;
  return {
    schema: 'extended-coverage-report-v1',
    packetId: packet.packetId,
    waveId: packet.waveId,
    generatedAt: new Date().toISOString(),
    expectedCount: packet.expectedCount,
    generatedFragments: fragments.length,
    minimumGate: {
      status: missing.length === 0 && passed === fragments.length ? 'passed' : 'failed',
      passed,
      failed: fragments.length - passed,
      missingInputs: missing
    },
    extendedGate: {
      status: partial > 0 ? 'partial' : 'passed',
      partial,
      note: 'Automated source-backed pass records fragments and gaps; domain audit required for final deploy.'
    },
    domains: [...new Set(fragments.map(f => domainForKind(f.kind)))],
    sourceRefs: fragments.flatMap(f => f.sourceRefs)
  };
}
function gapIndexForPacket(packet, fragments, missing) {
  const gaps = [];
  for (const m of missing) gaps.push({ type: 'missing-input', severity: 'blocker', ref: m });
  for (const f of fragments) {
    if (!f.summaryCandidate) gaps.push({ type: 'empty-summary', severity: 'major', entityId: f.entityId });
    if (!f.imageEvidence.length) gaps.push({ type: 'no-image-evidence', severity: 'minor', entityId: f.entityId });
    gaps.push({ type: 'needs-domain-audit', severity: 'major', entityId: f.entityId, note: 'Automated fragment is not final deployable.' });
  }
  return {
    schema: 'extended-gap-index-v1',
    packetId: packet.packetId,
    waveId: packet.waveId,
    generatedAt: new Date().toISOString(),
    gapCount: gaps.length,
    gaps
  };
}
function statusForPacket(packet, coverage, gapIndex) {
  const blockerGaps = gapIndex.gaps.filter(g => g.severity === 'blocker').length;
  return {
    schema: 'packet-final-status-v1',
    packetId: packet.packetId,
    waveId: packet.waveId,
    generatedAt: new Date().toISOString(),
    status: coverage.minimumGate.status === 'passed' && blockerGaps === 0 ? 'passed' : 'failed',
    minimumGate: coverage.minimumGate.status,
    extendedGate: coverage.extendedGate.status,
    openIssues: gapIndex.gapCount,
    blockedIssues: blockerGaps,
    canAdvance: coverage.minimumGate.status === 'passed' && blockerGaps === 0,
    note: 'canAdvance means eligible for wave merge, not final deploy.'
  };
}
function markdownSummary(run) {
  const lines = [];
  lines.push('# Gundam SEED Automated Source-Backed Extraction Report');
  lines.push('');
  lines.push(`- Generated: ${run.generatedAt}`);
  lines.push(`- Packets: ${run.packets.length}`);
  lines.push(`- Total fragments: ${run.totals.fragments}`);
  lines.push(`- Total sources: ${run.totals.sources}`);
  lines.push('');
  lines.push('| Wave | Packet | Expected | Fragments | Min Gate | Extended Gate | Can Advance |');
  lines.push('|---|---|---:|---:|---|---|---|');
  for (const p of run.packets) lines.push(`| ${p.waveId} | ${p.packetId} | ${p.expectedCount} | ${p.fragments} | ${p.minimumGate} | ${p.extendedGate} | ${p.canAdvance} |`);
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This is an automated first-pass source-backed extraction.');
  lines.push('- It preserves evidence and fragments, but leaves all domain-specific completeness as extended gaps.');
  lines.push('- Do not deploy to curated world library before audit/fix/merge.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const root = args.root || 'work/gundam-seed/source-ingest-v2';
  const index = readJson(path.join(planDir, 'work-packets-v2', 'INDEX.json'));
  if (!index) throw new Error('Missing work-packets-v2/INDEX.json; run generate-work-packets-v2 first');
  const packets = index.packets.map(p => readJson(path.join(planDir, p.path)));
  const sourceWriteSet = new Set();
  const run = { schema: 'gundam-seed-automated-extraction-run-v1', generatedAt: new Date().toISOString(), planDir, root, packets: [], totals: { fragments: 0, sources: 0 } };
  for (const packet of packets) {
    const fragments = [];
    const missing = [];
    for (const item of packet.itemRefs || []) {
      const detail = readJson(item.detailPath, null);
      const manifest = readJson(item.manifestPath, null);
      if (!detail) { missing.push({ opusId: item.opusId, reason: 'missing-detail', path: item.detailPath }); continue; }
      const source = buildSourceRecord(item, detail, manifest);
      writeJson(path.join(planDir, 'sources', 'opus', `${item.opusId}.source.json`), source);
      sourceWriteSet.add(item.opusId);
      if (packet.stage === 'source-inventory') continue;
      const fragment = extractEntity(item, detail, manifest, packet);
      const domain = domainForKind(fragment.kind);
      writeJson(path.join(planDir, 'extracted', packet.waveId, domain, `${fragment.entityId}.fragment.json`), fragment);
      fragments.push(fragment);
    }
    const coverage = coverageForPacket(packet, fragments, missing);
    const gapIndex = gapIndexForPacket(packet, fragments, missing);
    const finalStatus = statusForPacket(packet, coverage, gapIndex);
    writeJson(path.join(planDir, 'audit', 'extended-coverage', packet.waveId, packet.packetId, 'extended-coverage-report.json'), coverage);
    writeJson(path.join(planDir, 'audit', 'extended-coverage', packet.waveId, packet.packetId, 'extended-gap-index.json'), gapIndex);
    writeJson(path.join(planDir, 'audit', 'packet-audits', packet.waveId, packet.packetId, 'final-status.json'), finalStatus);
    run.packets.push({ waveId: packet.waveId, packetId: packet.packetId, expectedCount: packet.expectedCount, fragments: fragments.length, minimumGate: finalStatus.minimumGate, extendedGate: finalStatus.extendedGate, canAdvance: finalStatus.canAdvance });
    run.totals.fragments += fragments.length;
  }
  run.totals.sources = sourceWriteSet.size;
  writeJson(path.join(planDir, 'reports', 'automated-extraction-report.json'), run);
  writeText(path.join(planDir, 'reports', 'automated-extraction-report.md'), markdownSummary(run));
  console.log(JSON.stringify({ ok: true, report: path.join(planDir, 'reports', 'automated-extraction-report.json'), totals: run.totals }, null, 2));
}
main();
