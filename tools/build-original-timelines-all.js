const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) {
  ensureDir(path.dirname(p));
  const data = JSON.stringify(v, null, 2);
  const tmp = p + '.tmp-' + process.pid + '-' + Date.now();
  let lastErr = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.writeFileSync(tmp, data, 'utf8');
      try { fs.renameSync(tmp, p); }
      catch (renameErr) {
        // Windows can transiently fail renames on large JSON if another process has a read handle.
        fs.copyFileSync(tmp, p);
        fs.unlinkSync(tmp);
      }
      return;
    } catch (err) {
      lastErr = err;
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
      const end = Date.now() + 250 * (attempt + 1);
      while (Date.now() < end) {}
    }
  }
  throw lastErr;
}
function exists(p) { return fs.existsSync(p); }
function rel(p) { return p.split(path.sep).join('/'); }
function safeSeriesId(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100); }

function loadEvents(world, seriesSlug) {
  const file = path.join(ROOT, world, 'curated', 'stories', `original-chapter-events-${seriesSlug}-refined-all.json`);
  if (!exists(file)) return new Map();
  const inc = readJson(file);
  const map = new Map();
  for (const e of inc.events || []) map.set(`${e.volume}/${e.chapterIndex}`, e);
  return map;
}

function buildWorldTimeline(world) {
  const worldRoot = path.join(ROOT, world);
  const manifestPath = path.join(worldRoot, 'sources', 'raw-text-manifest.json');
  if (!exists(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  const entries = [];
  const lanes = [];
  for (const [seriesOrder, series] of (manifest.series || []).entries()) {
    const eventMap = loadEvents(world, series.seriesSlug);
    const laneEntries = [];
    for (const [volumeOrder, volume] of (series.volumes || []).entries()) {
      const volumeNode = `orig-${safeSeriesId(series.seriesSlug)}-${volume.dir}`;
      for (const [chapterOrder, ch] of (volume.chapters || []).entries()) {
        const event = eventMap.get(`${volume.dir}/${ch.idx}`);
        const entry = {
          id: event ? event.id : `orig-${safeSeriesId(series.seriesSlug)}-${volume.dir}-ch-${String(ch.idx).padStart(2, '0')}`,
          worldId: world,
          series: series.seriesSlug,
          seriesTitle: series.title,
          lane: series.seriesSlug,
          order: entries.length + 1,
          laneOrder: laneEntries.length + 1,
          seriesOrder: seriesOrder + 1,
          volumeOrder: volumeOrder + 1,
          chapterOrder: chapterOrder + 1,
          volume: volume.dir,
          volumeTitle: volume.title,
          volumeNode,
          chapterIndex: ch.idx,
          chapterTitle: ch.title,
          eventType: event ? event.eventType : 'chapter',
          arcs: event ? event.arcs || [] : [],
          characters: event ? event.characters || [] : [],
          places: event ? event.places || [] : [],
          terms: event ? event.terms || [] : [],
          sourceRef: ch.file,
          summary: event ? event.summary : `章节《${ch.title}》在 ${series.seriesSlug}/${volume.dir} 中按目录顺序登记。`,
          confidence: event ? 'chapter-event-refined' : 'manifest-only'
        };
        entries.push(entry);
        laneEntries.push(entry.id);
      }
    }
    lanes.push({ series: series.seriesSlug, title: series.title, volumes: (series.volumes || []).length, entries: laneEntries.length, firstEvent: laneEntries[0] || null, lastEvent: laneEntries[laneEntries.length - 1] || null });
  }
  const timeline = {
    schema: 'rp-original-timeline-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Series lanes preserve source publication/manifest order. Cross-series chronology is not inferred unless separately curated.',
    coverage: { lanes: lanes.length, entries: entries.length },
    lanes,
    entries
  };
  const outPath = path.join(worldRoot, 'curated', 'original-timeline.json');
  writeJson(outPath, timeline);

  let md = `# ${world} Original Timeline\n\n更新日期：${NOW}\n\n`;
  md += '说明：本时间线按来源 manifest/系列/卷/章节顺序建立；多系列之间只保留 lane，不强行推断跨系列绝对年代。\n\n';
  md += '| lane | volumes | entries | first | last |\n|---|---:|---:|---|---|\n';
  for (const lane of lanes) md += `| ${lane.series} | ${lane.volumes} | ${lane.entries} | ${lane.firstEvent || '—'} | ${lane.lastEvent || '—'} |\n`;
  md += '\n## Entries\n\n| order | lane | volume | chapter | type | arcs | source |\n|---:|---|---|---|---|---|---|\n';
  for (const e of entries) md += `| ${e.order} | ${e.lane} | ${e.volume} | ${String(e.chapterIndex)} ${String(e.chapterTitle).replace(/\|/g, '\\|')} | ${e.eventType} | ${(e.arcs || []).map(a => a.label || a.id).join('；') || '—'} | \`${e.sourceRef}\` |\n`;
  fs.writeFileSync(path.join(worldRoot, 'curated', 'original-timeline.md'), md, 'utf8');

  const graphPath = path.join(worldRoot, 'curated', 'plot-graph.json');
  const graph = exists(graphPath) ? readJson(graphPath) : { schema: 'rp-plot-graph-v1', worldId: world, nodes: [], edges: [] };
  if (!Array.isArray(graph.nodes)) graph.nodes = [];
  if (!Array.isArray(graph.edges)) graph.edges = [];
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  const edgeKeys = new Set(graph.edges.map(e => `${e.from}::${e.to}::${e.type}`));
  let addedLaneEdges = 0;
  for (const series of lanes) {
    const seriesEntries = entries.filter(e => e.series === series.series);
    for (let i = 1; i < seriesEntries.length; i++) {
      const from = seriesEntries[i - 1].id;
      const to = seriesEntries[i].id;
      const key = `${from}::${to}::timeline-next`;
      if (nodeIds.has(from) && nodeIds.has(to) && !edgeKeys.has(key)) {
        graph.edges.push({ from, to, type: 'timeline-next', lane: series.series, sourceRefs: [seriesEntries[i].sourceRef], note: 'source manifest order within series lane' });
        edgeKeys.add(key);
        addedLaneEdges++;
      }
    }
  }
  graph.generatedAt = NOW;
  writeJson(graphPath, graph);

  const runtimePath = path.join(worldRoot, 'curated', 'original-runtime-pack.json');
  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.timeline = 'curated/original-timeline.json';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.timelineEntries = entries.length;
    runtime.coverage.timelineLanes = lanes.length;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, lanes: lanes.length, entries: entries.length, addedLaneEdges, graph: { nodes: graph.nodes.length, edges: graph.edges.length } };
}

function validate(reports) {
  const issues = [];
  for (const r of reports) {
    const p = path.join(ROOT, r.world, 'curated', 'original-timeline.json');
    const t = readJson(p);
    if ((t.entries || []).length !== r.entries) issues.push(`${r.world}: timeline entry count mismatch`);
    const ids = new Set();
    for (const e of t.entries || []) {
      if (ids.has(e.id)) issues.push(`${r.world}: duplicate timeline entry ${e.id}`);
      ids.add(e.id);
      if (!exists(path.join(ROOT, r.world, e.sourceRef))) issues.push(`${r.world}: missing source ${e.sourceRef}`);
    }
  }
  return issues;
}

function validateJson() {
  const files = [];
  function walk(d) { if (!exists(d)) return; for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (p.endsWith('.json')) files.push(p); } }
  walk(ROOT); walk(REPORT_DIR);
  const bad = [];
  for (const f of files) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { bad.push({ file: rel(f), error: e.message }); } }
  return { filesChecked: files.length, bad };
}

function main() {
  ensureDir(REPORT_DIR);
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'sources', 'raw-text-manifest.json'))).sort();
  const reports = worlds.map(buildWorldTimeline).filter(Boolean);
  const issues = validate(reports);
  const jsonValidation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-timeline-report.json'), { createdAt: NOW, reports, issues, jsonValidation });
  let md = `# Original Timeline Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮为所有已入库原著小说世界生成 original-timeline，按系列 lane 保留来源顺序，并为 plot-graph 添加 timeline-next 边。\n\n';
  md += `JSON checked: ${jsonValidation.filesChecked}\n\nBad JSON: ${jsonValidation.bad.length}\n\nIssues: ${issues.length}\n\n`;
  md += '| world | lanes | timeline entries | lane edges added | graph |\n|---|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.lanes} | ${r.entries} | ${r.addedLaneEdges} | ${r.graph.nodes}/${r.graph.edges} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-timeline-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: issues.length === 0 && jsonValidation.bad.length === 0, reports, issues, jsonValidation }, null, 2));
}
main();
