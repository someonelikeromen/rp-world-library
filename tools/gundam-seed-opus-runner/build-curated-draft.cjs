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
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { ensureDir(path.dirname(file)); fs.writeFileSync(file, text, 'utf8'); }
function listFiles(dir, suffix) {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d)) {
      const f = path.join(d, e);
      const st = fs.statSync(f);
      if (st.isDirectory()) walk(f);
      else if (!suffix || f.endsWith(suffix)) out.push(f);
    }
  }
  walk(dir);
  return out.sort();
}
function rel(base, file) { return path.relative(base, file).replace(/\\/g, '/'); }
function uniq(arr) { return [...new Set((arr || []).filter(Boolean))]; }
function firstSentence(text, max = 360) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const cut = s.search(/[。！？.!?]/);
  const out = cut > 30 ? s.slice(0, cut + 1) : s;
  return out.slice(0, max);
}
function claimSnippets(item, limit = 12) {
  return (((item.sourceBacked || {}).claims || []).slice(0, limit)).map(c => ({
    label: c.label,
    text: String(c.text || '').slice(0, 1000),
    sourceRef: c.sourceRef,
    confidence: c.confidence
  }));
}
function baseEntity(item) {
  const sb = item.sourceBacked || {};
  return {
    id: item.entityId,
    name: item.name,
    aliases: uniq(item.aliases),
    sourceRefs: item.sourceRefs || [],
    sourceRecordRefs: item.sourceRecordRefs || [],
    fragmentRef: item.fragmentRef,
    summary: sb.summary || firstSentence((sb.claims || [])[0] && (sb.claims || [])[0].text),
    structuredFields: sb.structuredFields || {},
    evidence: {
      claimCount: (sb.claims || []).length,
      sectionCount: item.coverage ? item.coverage.sectionCount : 0,
      imageEvidenceCount: item.coverage ? item.coverage.imageEvidenceCount : 0,
      sampleClaims: claimSnippets(item)
    },
    interpretationNotes: item.interpretationNotes || [],
    coverage: item.coverage,
    deployable: false
  };
}
function toCharacter(item) {
  const e = baseEntity(item);
  return { ...e, type: 'character', affiliation: e.structuredFields['归属'] || e.structuredFields['所属'] || '', role: e.structuredFields['人物分类'] || '' };
}
function toMobileSuit(item) {
  const e = baseEntity(item);
  const specs = (item.sourceBacked || {}).specs || {};
  return { ...e, type: 'mobile_suit', modelNumber: specs.modelNumber || '', classification: specs.classification || '', affiliation: specs.affiliation || '', energyType: specs.energyType || '', dimensions: specs.dimensions || '', armorMaterial: specs.armorMaterial || '' };
}
function toWarship(item) {
  const e = baseEntity(item);
  const specs = (item.sourceBacked || {}).specs || {};
  return { ...e, type: 'warship', className: specs.classification || '', affiliation: specs.affiliation || '', dimensions: specs.dimensions || '' };
}
function toEvent(item) {
  const e = baseEntity(item);
  return { ...e, type: 'event', eventKind: 'battle-or-operation', chronologyHint: extractYears(JSON.stringify(item)).join(', ') };
}
function toRule(item) {
  const e = baseEntity(item);
  return { ...e, type: 'rule', ruleCategory: classifyRule(item.name + ' ' + e.summary) };
}
function toInterpretation(item) {
  const e = baseEntity(item);
  return { ...e, type: 'interpretation', canonStatus: 'interpretation-only' };
}
function classifyRule(text) {
  if (/NJC|NJ|N-Jammer|核|能源|动力|电池/.test(text)) return 'energy-and-technology';
  if (/MS|MA|高达|机体|支援装备|背包/.test(text)) return 'mobile-weapon-system';
  if (/舰|战舰|舰艇|宇宙/.test(text)) return 'space-warship-system';
  if (/C\.E|CE|年表|纪年/.test(text)) return 'timeline-and-era';
  if (/势力|阵营|军装|组织|军/.test(text)) return 'factions-and-military';
  return 'world-rule';
}
function extractYears(text) {
  return uniq((String(text).match(/C\.E\.\s*\d{1,3}|CE\s*\d{1,3}|C\.E\d{1,3}/gi) || []).map(x => x.replace(/\s+/g, '')));
}
function timelineFromItems(items) {
  const rows = [];
  for (const item of items) {
    const years = extractYears(JSON.stringify(item));
    for (const y of years) rows.push({ time: y, refId: item.entityId, name: item.name, sourceRefs: item.sourceRefs || [], confidence: 'text-pattern' });
  }
  return rows.sort((a, b) => a.time.localeCompare(b.time, 'en'));
}
function buildGraph(domains, sourceMap) {
  const nodes = [];
  const edges = [];
  for (const [domain, items] of Object.entries(domains)) {
    for (const item of items) {
      nodes.push({ id: item.id, label: item.name, type: domain });
      for (const ref of item.sourceRefs || []) {
        const sid = `source:${String(ref).replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 120)}`;
        nodes.push({ id: sid, label: ref, type: 'source' });
        edges.push({ from: item.id, to: sid, type: 'SOURCE_REF' });
      }
    }
  }
  const uniqNodes = Object.values(Object.fromEntries(nodes.map(n => [n.id, n])));
  return { schema: 'gundam-seed-curated-draft-graph-v1', nodeCount: uniqNodes.length, edgeCount: edges.length, nodes: uniqNodes, edges };
}
function auditDomain(domain, items) {
  const issues = [];
  for (const item of items) {
    if (!item.id) issues.push({ severity: 'blocker', type: 'missing-id', item: item.name || '' });
    if (!item.name) issues.push({ severity: 'blocker', type: 'missing-name', item: item.id || '' });
    if (!item.sourceRefs || !item.sourceRefs.length) issues.push({ severity: 'blocker', type: 'missing-sourceRefs', item: item.id || '' });
    if (!item.summary) issues.push({ severity: 'major', type: 'missing-summary', item: item.id || '' });
    if (!item.evidence || !item.evidence.claimCount) issues.push({ severity: 'major', type: 'no-claims', item: item.id || '' });
    if (item.deployable) issues.push({ severity: 'blocker', type: 'unexpected-deployable', item: item.id || '' });
  }
  return {
    domain,
    count: items.length,
    status: issues.filter(i => i.severity === 'blocker').length ? 'failed' : (issues.length ? 'passed-with-gaps' : 'passed'),
    issues
  };
}
function markdown(report) {
  const lines = [];
  lines.push('# Gundam SEED Curated Draft Report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Status: ${report.status}`);
  lines.push(`- Draft root: ${report.outputs.draftRoot}`);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push('| Domain | Count | Audit | Issues |');
  lines.push('|---|---:|---|---:|');
  for (const d of report.domainAudits) lines.push(`| ${d.domain} | ${d.count} | ${d.status} | ${d.issues.length} |`);
  lines.push('');
  lines.push('## Files');
  lines.push('');
  for (const [k, v] of Object.entries(report.outputs.files)) lines.push(`- ${k}: \`${v}\``);
  lines.push('');
  lines.push('## Deploy Guard');
  lines.push('');
  for (const b of report.deployBlockers) lines.push(`- ${b}`);
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const draftRoot = path.join(planDir, 'candidates', 'curated-draft');
  ensureDir(draftRoot);
  const normalizedFiles = listFiles(path.join(planDir, 'normalized', 'base-seed'), '.json');
  const items = normalizedFiles.map(f => ({ ...readJson(f), __file: rel(planDir, f) })).filter(x => x && x.entityId);
  const byDomain = {
    characters: items.filter(x => x.domain === 'characters').map(toCharacter),
    mobileSuits: items.filter(x => x.domain === 'mobile-suits').map(toMobileSuit),
    warships: items.filter(x => x.domain === 'warships').map(toWarship),
    events: items.filter(x => x.domain === 'events').map(toEvent),
    rules: items.filter(x => x.domain === 'rules').map(toRule),
    interpretations: items.filter(x => x.domain === 'interpretations').map(toInterpretation)
  };
  const sourceMap = readJson(path.join(planDir, 'candidates', 'base-seed-normalized', 'source-map.json'), { sources: [] });
  const timeline = timelineFromItems(items);
  const relationships = {
    schema: 'gundam-seed-curated-draft-relationships-v1',
    generatedAt: new Date().toISOString(),
    status: 'gap-placeholder',
    relationships: [],
    gap: 'Relationship extraction requires domain model pass over normalized claims.'
  };
  const world = {
    schema: 'gundam-seed-curated-draft-world-v1',
    worldId: 'gundam-seed-curated-draft',
    name: '机动战士高达 SEED（Curated Draft Candidate）',
    status: 'draft-not-deployable',
    generatedAt: new Date().toISOString(),
    continuityLayer: 'base-seed',
    sourcePolicy: 'Bilibili source-backed candidate layer; current worldbook seed only',
    counts: Object.fromEntries(Object.entries(byDomain).map(([k, v]) => [k, v.length])),
    files: {
      characters: 'characters.json',
      mobileSuits: 'mobile-suits.json',
      warships: 'warships.json',
      events: 'events.json',
      rules: 'rules.json',
      interpretations: 'interpretations.json',
      relationships: 'relationships.json',
      timeline: 'timeline.json',
      graph: 'graph.json',
      sourceMap: 'source-map.json'
    },
    deployBlockers: [
      'relationships are placeholder gaps',
      'domain-specific semantic conflict review not complete',
      'extendedGate remains partial at packet level',
      'world_query validation not run'
    ]
  };
  const files = {
    world: 'world.json',
    characters: 'characters.json',
    mobileSuits: 'mobile-suits.json',
    warships: 'warships.json',
    events: 'events.json',
    rules: 'rules.json',
    interpretations: 'interpretations.json',
    relationships: 'relationships.json',
    timeline: 'timeline.json',
    sourceMap: 'source-map.json',
    graph: 'graph.json'
  };
  writeJson(path.join(draftRoot, files.world), world);
  writeJson(path.join(draftRoot, files.characters), { schema: 'gundam-seed-curated-draft-characters-v1', items: byDomain.characters });
  writeJson(path.join(draftRoot, files.mobileSuits), { schema: 'gundam-seed-curated-draft-mobile-suits-v1', items: byDomain.mobileSuits });
  writeJson(path.join(draftRoot, files.warships), { schema: 'gundam-seed-curated-draft-warships-v1', items: byDomain.warships });
  writeJson(path.join(draftRoot, files.events), { schema: 'gundam-seed-curated-draft-events-v1', items: byDomain.events });
  writeJson(path.join(draftRoot, files.rules), { schema: 'gundam-seed-curated-draft-rules-v1', items: byDomain.rules });
  writeJson(path.join(draftRoot, files.interpretations), { schema: 'gundam-seed-curated-draft-interpretations-v1', items: byDomain.interpretations });
  writeJson(path.join(draftRoot, files.relationships), relationships);
  writeJson(path.join(draftRoot, files.timeline), { schema: 'gundam-seed-curated-draft-timeline-v1', generatedAt: world.generatedAt, items: timeline });
  writeJson(path.join(draftRoot, files.sourceMap), sourceMap);
  writeJson(path.join(draftRoot, files.graph), buildGraph(byDomain, sourceMap));
  const domainAudits = Object.entries(byDomain).map(([domain, arr]) => auditDomain(domain, arr));
  const relationshipAudit = { domain: 'relationships', count: 0, status: 'gap-placeholder', issues: [{ severity: 'major', type: 'relationship-extraction-not-run', message: relationships.gap }] };
  const report = {
    schema: 'gundam-seed-curated-draft-report-v1',
    generatedAt: world.generatedAt,
    status: domainAudits.some(a => a.status === 'failed') ? 'failed' : 'draft-valid-not-deployable',
    outputs: { draftRoot: rel(planDir, draftRoot), files },
    domainAudits: [...domainAudits, relationshipAudit],
    deployBlockers: world.deployBlockers
  };
  writeJson(path.join(planDir, 'reports', 'curated-draft-report.json'), report);
  writeText(path.join(planDir, 'reports', 'curated-draft-report.md'), markdown(report));
  console.log(JSON.stringify({ ok: true, status: report.status, report: path.join(planDir, 'reports', 'curated-draft-report.json'), draftRoot: rel(planDir, draftRoot), counts: world.counts }, null, 2));
}
main();
