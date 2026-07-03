const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function exists(p) { return fs.existsSync(p); }
function top(arr, n) { return (arr || []).slice(0, n); }
function relPath(p) { return p.split(path.sep).join('/'); }
function listChapterEventFiles(world) {
  const dir = path.join(ROOT, world, 'curated', 'stories');
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).filter(f => /^original-chapter-events-.*-refined-all\.json$/.test(f)).map(f => path.join(dir, f));
}
function summarizeArcs(events) {
  const m = new Map();
  for (const e of events) for (const a of e.arcs || []) m.set(a.label || a.id, (m.get(a.label || a.id) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([arc, chapterHits]) => ({ arc, chapterHits }));
}
function summarizeSeries(world, manifest, chapterEventsBySeries) {
  return (manifest.series || []).map(s => {
    const events = chapterEventsBySeries.get(s.seriesSlug) || [];
    const arcs = summarizeArcs(events);
    return {
      seriesSlug: s.seriesSlug,
      title: s.title,
      author: s.author,
      volumes: (s.volumes || []).map(v => ({
        id: v.dir,
        title: v.title,
        chapterCount: (v.chapters || []).length,
        summaryFile: `curated/stories/summaries/${s.seriesSlug}/${v.dir}.md`,
        volumeEventNode: `orig-${s.seriesSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,100)}-${v.dir}`,
        chapterEventRange: (v.chapters || []).map(ch => `orig-${s.seriesSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,100)}-${v.dir}-ch-${String(ch.idx).padStart(2,'0')}`)
      })),
      chapterEvents: events.length,
      dominantArcs: top(arcs, 12)
    };
  });
}
function buildWorldPack(world) {
  const worldRoot = path.join(ROOT, world);
  const manifestPath = path.join(worldRoot, 'sources', 'raw-text-manifest.json');
  if (!exists(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  const chapterFiles = listChapterEventFiles(world);
  const allEvents = [];
  const eventsBySeries = new Map();
  for (const file of chapterFiles) {
    const inc = readJson(file);
    eventsBySeries.set(inc.series, inc.events || []);
    allEvents.push(...(inc.events || []));
  }
  const entityPath = path.join(worldRoot, 'curated', 'original-entity-index.json');
  const relationPath = path.join(worldRoot, 'curated', 'original-relationship-candidates.json');
  const graphPath = path.join(worldRoot, 'curated', 'plot-graph.json');
  const entities = exists(entityPath) ? readJson(entityPath).entities || [] : [];
  const relationships = exists(relationPath) ? readJson(relationPath).relationships || [] : [];
  const graph = exists(graphPath) ? readJson(graphPath) : { nodes: [], edges: [] };
  const series = summarizeSeries(world, manifest, eventsBySeries);
  const pack = {
    schema: 'rp-original-runtime-pack-v1',
    worldId: world,
    createdAt: NOW,
    sourcePolicy: 'Use curated summaries, chapter-event nodes, entity index, and relationship candidates for RP runtime. Do not load raw novel text unless explicitly needed for verification.',
    coverage: {
      series: series.length,
      volumes: series.reduce((a, s) => a + s.volumes.length, 0),
      chapterEvents: allEvents.length,
      entities: entities.length,
      relationshipCandidates: relationships.length,
      graphNodes: (graph.nodes || []).length,
      graphEdges: (graph.edges || []).length
    },
    series,
    topArcs: top(summarizeArcs(allEvents), 24),
    topCharacters: top(entities.filter(e => e.kind === 'character'), 40).map(e => ({ name: e.name, mentions: e.mentions, chapterHits: e.chapterHits, arcs: top(e.arcs, 8), sourceRefs: top(e.sourceRefs, 10) })),
    topPlaces: top(entities.filter(e => e.kind === 'place'), 30).map(e => ({ name: e.name, mentions: e.mentions, chapterHits: e.chapterHits, sourceRefs: top(e.sourceRefs, 10) })),
    topTerms: top(entities.filter(e => e.kind === 'term'), 40).map(e => ({ name: e.name, mentions: e.mentions, chapterHits: e.chapterHits, sourceRefs: top(e.sourceRefs, 10) })),
    topRelationshipCandidates: top(relationships, 80).map(r => ({ source: r.source, target: r.target, weight: r.weight, chapterHits: r.chapterHits, arcs: top(r.arcs, 8), sourceRefs: top(r.sourceRefs, 10) })),
    files: {
      summaryIndex: 'curated/stories/original-summary-index.json',
      entityIndex: 'curated/original-entity-index.json',
      relationshipCandidates: 'curated/original-relationship-candidates.json',
      plotGraph: 'curated/plot-graph.json',
      chapterEventIncrements: chapterFiles.map(f => relPath(path.relative(worldRoot, f)))
    }
  };
  const outJson = path.join(worldRoot, 'curated', 'original-runtime-pack.json');
  writeJson(outJson, pack);
  let md = `# ${world} Original Runtime Pack\n\n更新日期：${NOW}\n\n`;
  md += `用途：RP 运行时优先读取本包、逐卷摘要、章节事件、实体索引和关系候选；不要常驻加载 raw-text 正文。\n\n`;
  md += `## Coverage\n\n`;
  md += `- Series: ${pack.coverage.series}\n- Volumes: ${pack.coverage.volumes}\n- Chapter events: ${pack.coverage.chapterEvents}\n- Entities: ${pack.coverage.entities}\n- Relationship candidates: ${pack.coverage.relationshipCandidates}\n- Graph: ${pack.coverage.graphNodes}/${pack.coverage.graphEdges}\n\n`;
  md += `## Series\n\n| series | volumes | chapter events | dominant arcs |\n|---|---:|---:|---|\n`;
  for (const s of series) md += `| ${s.seriesSlug} | ${s.volumes.length} | ${s.chapterEvents} | ${s.dominantArcs.slice(0,4).map(a => `${a.arc}(${a.chapterHits})`).join('；') || '—'} |\n`;
  md += `\n## Top Characters\n\n` + pack.topCharacters.slice(0, 20).map(e => `- ${e.name}: mentions=${e.mentions}, chapters=${e.chapterHits}`).join('\n') + '\n\n';
  md += `## Top Relationship Candidates\n\n` + pack.topRelationshipCandidates.slice(0, 30).map(r => `- ${r.source} ↔ ${r.target}: weight=${r.weight}, chapters=${r.chapterHits}`).join('\n') + '\n';
  fs.writeFileSync(path.join(worldRoot, 'curated', 'original-runtime-pack.md'), md, 'utf8');
  return { world, ...pack.coverage };
}
function validateJson() {
  const files = [];
  function walk(d) { if (!exists(d)) return; for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (p.endsWith('.json')) files.push(p); } }
  walk(ROOT); walk(REPORT_DIR);
  const bad = [];
  for (const f of files) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { bad.push({ file: relPath(f), error: e.message }); } }
  return { filesChecked: files.length, bad };
}
function main() {
  ensureDir(REPORT_DIR);
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'sources', 'raw-text-manifest.json'))).sort();
  const reports = worlds.map(buildWorldPack).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-runtime-pack-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Runtime Pack Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮为所有已入库原著小说世界生成 RP runtime pack，统一入口化 summaries / chapter-events / entities / relationship candidates / graph。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | series | volumes | chapter events | entities | relationships | graph |\n|---|---:|---:|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.series} | ${r.volumes} | ${r.chapterEvents} | ${r.entities} | ${r.relationshipCandidates} | ${r.graphNodes}/${r.graphEdges} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-runtime-pack-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
