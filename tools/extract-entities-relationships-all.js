const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function safeId(s) { return String(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '').slice(0, 100); }
function addMap(map, key, n = 1) { if (!key) return; map.set(key, (map.get(key) || 0) + n); }
function pairKey(a, b) { return [a, b].sort().join('::'); }
function listChapterEventFiles(world) {
  const dir = path.join(ROOT, world, 'curated', 'stories');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /^original-chapter-events-.*-refined-all\.json$/.test(f)).map(f => path.join(dir, f));
}
function bumpEntity(entityMap, kind, name, event, count) {
  const id = `${kind}:${name}`;
  if (!entityMap.has(id)) entityMap.set(id, { id, kind, name, mentions: 0, chapters: 0, series: new Map(), volumes: new Map(), sourceRefs: new Set(), arcs: new Set() });
  const e = entityMap.get(id);
  e.mentions += count || 1;
  e.chapters += 1;
  addMap(e.series, event.series, 1);
  addMap(e.volumes, `${event.series}/${event.volume}`, 1);
  if (event.sourceRef) e.sourceRefs.add(event.sourceRef);
  for (const arc of event.arcs || []) e.arcs.add(arc.label || arc.id || String(arc));
}
function eventEntities(event) {
  const out = [];
  for (const c of event.characters || []) out.push({ kind: 'character', name: c });
  for (const p of event.places || []) out.push({ kind: 'place', name: p });
  for (const t of event.terms || []) out.push({ kind: 'term', name: t });
  return out;
}
function normalizeEntity(e) {
  return {
    id: e.id,
    kind: e.kind,
    name: e.name,
    mentions: e.mentions,
    chapterHits: e.chapters,
    seriesHits: Object.fromEntries([...e.series.entries()].sort((a, b) => b[1] - a[1])),
    volumeHits: Object.fromEntries([...e.volumes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80)),
    arcs: [...e.arcs].sort(),
    sourceRefs: [...e.sourceRefs].slice(0, 80)
  };
}
function processWorld(world) {
  const files = listChapterEventFiles(world);
  if (!files.length) return null;
  const entityMap = new Map();
  const relationMap = new Map();
  let chapterEvents = 0;
  for (const file of files) {
    const inc = readJson(file);
    for (const event of inc.events || []) {
      chapterEvents++;
      for (const item of event.topMentionCounts || []) {
        const name = item.term;
        let kind = 'term';
        if ((event.characters || []).includes(name)) kind = 'character';
        else if ((event.places || []).includes(name)) kind = 'place';
        bumpEntity(entityMap, kind, name, event, item.count || 1);
      }
      for (const item of eventEntities(event)) bumpEntity(entityMap, item.kind, item.name, event, 1);
      const chars = [...new Set(event.characters || [])].slice(0, 12);
      const places = [...new Set(event.places || [])].slice(0, 8);
      const terms = [...new Set(event.terms || [])].slice(0, 12);
      const relationItems = [
        ...chars.map(x => ({ kind: 'character', name: x })),
        ...places.map(x => ({ kind: 'place', name: x })),
        ...terms.map(x => ({ kind: 'term', name: x }))
      ];
      for (let i = 0; i < relationItems.length; i++) {
        for (let j = i + 1; j < relationItems.length; j++) {
          const a = relationItems[i], b = relationItems[j];
          if (a.name === b.name) continue;
          const key = pairKey(`${a.kind}:${a.name}`, `${b.kind}:${b.name}`);
          if (!relationMap.has(key)) relationMap.set(key, { id: `rel:${safeId(key)}`, a, b, weight: 0, chapters: 0, sourceRefs: new Set(), arcs: new Set(), series: new Map() });
          const r = relationMap.get(key);
          r.weight += 1;
          r.chapters += 1;
          if (event.sourceRef) r.sourceRefs.add(event.sourceRef);
          addMap(r.series, event.series, 1);
          for (const arc of event.arcs || []) r.arcs.add(arc.label || arc.id || String(arc));
        }
      }
    }
  }
  const entities = [...entityMap.values()].map(normalizeEntity).sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));
  const relationships = [...relationMap.values()].map(r => ({
    id: r.id,
    type: 'chapter-cooccurrence',
    source: `${r.a.kind}:${r.a.name}`,
    target: `${r.b.kind}:${r.b.name}`,
    sourceKind: r.a.kind,
    targetKind: r.b.kind,
    sourceName: r.a.name,
    targetName: r.b.name,
    weight: r.weight,
    chapterHits: r.chapters,
    seriesHits: Object.fromEntries([...r.series.entries()].sort((a, b) => b[1] - a[1])),
    arcs: [...r.arcs].sort(),
    sourceRefs: [...r.sourceRefs].slice(0, 80)
  })).sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
  const curated = path.join(ROOT, world, 'curated');
  writeJson(path.join(curated, 'original-entity-index.json'), { schema: 'rp-original-entity-index-v1', worldId: world, createdAt: NOW, source: 'chapter-event-refined increments', entities });
  writeJson(path.join(curated, 'original-relationship-candidates.json'), { schema: 'rp-original-relationship-candidates-v1', worldId: world, createdAt: NOW, source: 'chapter-event cooccurrence; candidate edges require later semantic review before replacing curated relationship-graph', relationships });
  const graphPath = path.join(curated, 'plot-graph.json');
  const graph = fs.existsSync(graphPath) ? readJson(graphPath) : { schema: 'rp-plot-graph-v1', worldId: world, nodes: [], edges: [] };
  if (!Array.isArray(graph.nodes)) graph.nodes = [];
  if (!Array.isArray(graph.edges)) graph.edges = [];
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  let addedEntityNodes = 0, addedRelationEdges = 0;
  for (const e of entities) {
    const id = `orig-entity-${safeId(e.kind)}-${safeId(e.name)}`;
    if (!nodeIds.has(id)) {
      graph.nodes.push({ id, type: `original-${e.kind}`, label: e.name, kind: e.kind, mentions: e.mentions, chapterHits: e.chapterHits, sourceRefs: e.sourceRefs.slice(0, 20), spoilerLevel: 'entity-index-refined' });
      nodeIds.add(id);
      addedEntityNodes++;
    }
  }
  const edgeKeys = new Set(graph.edges.map(e => `${e.from}::${e.to}::${e.type}`));
  for (const r of relationships.slice(0, 500)) {
    const from = `orig-entity-${safeId(r.sourceKind)}-${safeId(r.sourceName)}`;
    const to = `orig-entity-${safeId(r.targetKind)}-${safeId(r.targetName)}`;
    const key = `${from}::${to}::candidate-cooccurs`;
    if (nodeIds.has(from) && nodeIds.has(to) && !edgeKeys.has(key)) {
      graph.edges.push({ from, to, type: 'candidate-cooccurs', weight: r.weight, sourceRefs: r.sourceRefs.slice(0, 20), note: 'candidate relation from chapter cooccurrence; not a curated semantic relationship yet' });
      edgeKeys.add(key);
      addedRelationEdges++;
    }
  }
  graph.generatedAt = NOW;
  writeJson(graphPath, graph);
  return { world, chapterEvents, entities: entities.length, relationships: relationships.length, addedEntityNodes, addedRelationEdges, graph: { nodes: graph.nodes.length, edges: graph.edges.length } };
}
function main() {
  const worlds = fs.readdirSync(ROOT).filter(w => listChapterEventFiles(w).length).sort();
  const reports = worlds.map(processWorld).filter(Boolean);
  ensureDir(REPORT_DIR);
  writeJson(path.join(REPORT_DIR, 'entity-relationship-refinement-report.json'), { createdAt: NOW, reports });
  let md = `# Entity Relationship Refinement Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮基于 chapter-event-refined 层，为每个小说世界生成 original-entity-index 与 original-relationship-candidates。关系为章节共现候选，不直接覆盖人工 relationship-graph。\n\n';
  md += '| world | chapter events | entities | relationship candidates | entity nodes added | candidate edges added | graph |\n|---|---:|---:|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.chapterEvents} | ${r.entities} | ${r.relationships} | ${r.addedEntityNodes} | ${r.addedRelationEdges} | ${r.graph.nodes}/${r.graph.edges} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'entity-relationship-refinement-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: true, reports }, null, 2));
}
main();
