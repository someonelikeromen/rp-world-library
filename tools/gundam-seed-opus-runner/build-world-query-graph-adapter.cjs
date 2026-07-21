#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
function slugify(s) {
  return String(s || '')
    .replace(/[\s/\\:：*?"<>|]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160) || 'item';
}
function uniqBy(arr, fn) {
  const m = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (!m.has(k)) m.set(k, x);
  }
  return [...m.values()];
}
function textOf(x) { return JSON.stringify(x || ''); }

function main() {
  const worldRoot = process.argv[2] || 'campaigns/world-library/worlds/gundam-seed';
  const curated = path.join(worldRoot, 'curated');
  const extracted = path.join(worldRoot, 'extracted');
  const chars = (readJson(path.join(curated, 'characters-index.json'), { characters: [] }).characters || []);
  const events = (readJson(path.join(curated, 'events-index.json'), { events: [] }).events || []);
  const rules = (readJson(path.join(curated, 'rules-index.json'), { rules: [] }).rules || []);
  const mobile = (readJson(path.join(curated, 'mobile-suits-index.json'), { mobileSuits: [] }).mobileSuits || []);
  const warships = (readJson(path.join(curated, 'warships-index.json'), { warships: [] }).warships || []);
  const kg = readJson(path.join(curated, 'knowledge-graph.json'), { nodes: [], edges: [] });
  const rg = readJson(path.join(curated, 'relationship-graph.json'), { relationships: [], edges: [] });

  const idToName = new Map(chars.map(c => [c.id, c.name]));
  const allKnownIds = new Set(chars.map(c => c.id));
  const toRuntimeId = (id) => idToName.get(id) || id;

  const nodes = [];
  for (const ch of chars) nodes.push({ id: ch.name, type: 'character', group: 'character', canonicalId: ch.id });
  for (const r of rules) nodes.push({ id: r.id, type: 'rule', group: 'rule', label: r.name });
  for (const m of mobile) nodes.push({ id: m.id, type: 'mobile-suit', group: 'mobile-suit', label: m.name });
  for (const w of warships) nodes.push({ id: w.id, type: 'warship', group: 'warship', label: w.name });
  for (const e of events) nodes.push({ id: e.id, type: 'event', group: 'event', label: e.name });
  for (const n of (kg.nodes || [])) nodes.push({ id: toRuntimeId(n.id), type: n.type || 'entity', group: n.type || 'entity', label: n.label || n.name });
  for (const n of (rg.nodes || rg.inferredNodes || [])) nodes.push({ id: toRuntimeId(n.id), type: n.type || 'entity', group: n.type || 'entity', label: n.label || n.name });

  const edges = [];
  function addEdge(source, target, relation, category, extra = {}) {
    source = toRuntimeId(source);
    target = toRuntimeId(target);
    if (!source || !target || source === target) return;
    edges.push({ source, target, relation: relation || 'related', category: category || 'relationship', ...extra });
  }

  for (const e of (kg.edges || [])) addEdge(e.from || e.source, e.to || e.target, e.type || e.relation || 'related', e.category || 'knowledge', { sourceRefs: e.sourceRefs || [] });
  for (const r of (rg.relationships || rg.edges || [])) addEdge(r.from || r.source, r.to || r.target, r.type || r.relation || 'related', r.category || 'relationship', { evidence: r.evidence, confidence: r.confidence });

  // Add event participant edges by exact name/alias mention in event text.
  const nameHits = new Map();
  for (const ev of events) {
    const t = textOf(ev);
    const participants = [];
    for (const ch of chars) {
      const names = [ch.name, ...(ch.aliases || [])].filter(x => x && String(x).length >= 2);
      if (names.some(n => t.includes(n))) {
        participants.push(ch.name);
        addEdge(ev.id, ch.name, 'participant', 'involvement', { sourceRefs: ev.sourceRefs || [] });
      }
    }
    nameHits.set(ev.id, participants);
  }

  const graph = {
    schema: 'rp-complete-graph-v1',
    world: 'gundam-seed',
    generatedAt: new Date().toISOString(),
    source: 'adapter from curated knowledge-graph, relationship-graph, events-index for world_query graph traversal',
    nodes: uniqBy(nodes, n => n.id),
    edges: uniqBy(edges, e => `${e.source}|${e.relation}|${e.target}|${JSON.stringify(e.sourceRefs || e.evidence || '')}`)
  };
  writeJson(path.join(extracted, 'graph', 'complete-graph.json'), graph);

  const eventGraph = {
    schema: 'rp-event-graph-v1',
    world: 'gundam-seed',
    generatedAt: graph.generatedAt,
    nodes: graph.nodes.filter(n => n.group === 'event' || n.group === 'character'),
    edges: graph.edges.filter(e => e.category === 'involvement')
  };
  writeJson(path.join(extracted, 'graph', 'event-graph.json'), eventGraph);

  for (const ev of events) {
    const participants = nameHits.get(ev.id) || [];
    writeJson(path.join(extracted, 'events', `${slugify(ev.id)}.json`), {
      _schema: 'rp-event-volume-v1',
      world: 'gundam-seed',
      event_id: ev.id,
      source_refs: ev.sourceRefs || [],
      periods: [{
        period_id: 'seed-curated',
        name: { zh: ev.name },
        summary: ev.summary || '',
        participants
      }]
    });
  }

  const timelineItems = (readJson(path.join(curated, 'timeline.json'), { items: [] }).items || []);
  writeJson(path.join(extracted, 'timeline.json'), {
    _schema: 'rp-timeline-v1',
    world: 'gundam-seed',
    generatedAt: graph.generatedAt,
    events: timelineItems.map((item, i) => ({ event_id: item.id || `timeline-${i}`, summary: item.summary || item.text || '', source_refs: item.sourceRefs || [] }))
  });

  console.log(JSON.stringify({
    ok: true,
    completeGraph: { nodes: graph.nodes.length, edges: graph.edges.length },
    eventGraph: { nodes: eventGraph.nodes.length, edges: eventGraph.edges.length },
    eventsWritten: events.length,
    sampleKiraEdges: graph.edges.filter(e => e.source === '基拉' || e.target === '基拉').slice(0, 8)
  }, null, 2));
}
main();
