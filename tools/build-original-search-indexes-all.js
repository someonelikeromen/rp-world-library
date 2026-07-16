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
function add(map, key, item) { if (!key) return; if (!map.has(key)) map.set(key, []); map.get(key).push(item); }
function uniq(arr) { return [...new Set((arr || []).filter(Boolean))]; }
function safeSeriesId(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100); }

function loadSeriesEvents(world, seriesSlug) {
  const p = path.join(ROOT, world, 'curated', 'stories', `original-chapter-events-${seriesSlug}-refined-all.json`);
  if (!exists(p)) return new Map();
  const inc = readJson(p);
  const m = new Map();
  for (const e of inc.events || []) m.set(`${e.volume}/${e.chapterIndex}`, e);
  return m;
}

function buildWorldSearchIndex(world) {
  const worldRoot = path.join(ROOT, world);
  const manifestPath = path.join(worldRoot, 'sources', 'raw-text-manifest.json');
  if (!exists(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  const entityPath = path.join(worldRoot, 'curated', 'original-entity-index.json');
  const relationPath = path.join(worldRoot, 'curated', 'original-relationship-candidates.json');
  const runtimePath = path.join(worldRoot, 'curated', 'original-runtime-pack.json');
  const entityIndex = exists(entityPath) ? readJson(entityPath) : { entities: [] };
  const relationIndex = exists(relationPath) ? readJson(relationPath) : { relationships: [] };
  const entries = [];
  const keywordMap = new Map();

  function push(entry, keywords) {
    entries.push(entry);
    for (const k of uniq(keywords)) add(keywordMap, k, entry.id);
  }

  for (const series of manifest.series || []) {
    const eventMap = loadSeriesEvents(world, series.seriesSlug);
    push({
      id: `series:${series.seriesSlug}`,
      kind: 'series',
      worldId: world,
      series: series.seriesSlug,
      title: series.title,
      fileRefs: ['curated/original-runtime-pack.json', 'curated/stories/original-summary-index.json'],
      summary: `${series.title || series.seriesSlug} 原著系列入口。`
    }, [series.seriesSlug, series.title, series.author]);

    for (const volume of series.volumes || []) {
      const volumeNode = `orig-${safeSeriesId(series.seriesSlug)}-${volume.dir}`;
      const volumeEntry = {
        id: `volume:${series.seriesSlug}/${volume.dir}`,
        kind: 'volume',
        worldId: world,
        series: series.seriesSlug,
        volume: volume.dir,
        title: volume.title,
        graphNode: volumeNode,
        fileRefs: [`curated/stories/summaries/${series.seriesSlug}/${volume.dir}.md`],
        sourceRefs: (volume.chapters || []).map(ch => ch.file),
        chapterCount: (volume.chapters || []).length,
        summary: `${series.seriesSlug}/${volume.dir} 卷级摘要入口，共 ${(volume.chapters || []).length} 个正文章节。`
      };
      push(volumeEntry, [series.seriesSlug, volume.dir, volume.title]);

      for (const ch of volume.chapters || []) {
        const ev = eventMap.get(`${volume.dir}/${ch.idx}`);
        const keywords = [
          series.seriesSlug, volume.dir, volume.title, ch.title,
          ...(ev ? ev.characters || [] : []),
          ...(ev ? ev.places || [] : []),
          ...(ev ? ev.terms || [] : []),
          ...(ev ? (ev.arcs || []).map(a => a.label || a.id) : [])
        ];
        push({
          id: ev ? ev.id : `orig-${safeSeriesId(series.seriesSlug)}-${volume.dir}-ch-${String(ch.idx).padStart(2, '0')}`,
          kind: 'chapter-event',
          worldId: world,
          series: series.seriesSlug,
          volume: volume.dir,
          chapterIndex: ch.idx,
          title: ch.title,
          eventType: ev ? ev.eventType : 'chapter',
          arcs: ev ? ev.arcs || [] : [],
          characters: ev ? ev.characters || [] : [],
          places: ev ? ev.places || [] : [],
          terms: ev ? ev.terms || [] : [],
          fileRefs: [`curated/stories/summaries/${series.seriesSlug}/${volume.dir}.md`, `curated/stories/original-chapter-events-${series.seriesSlug}-refined-all.json`],
          sourceRefs: [ch.file],
          summary: ev ? ev.summary : `章节《${ch.title}》目录登记。`
        }, keywords);
      }
    }
  }

  for (const e of entityIndex.entities || []) {
    push({
      id: `entity:${e.kind}:${e.name}`,
      kind: `entity-${e.kind}`,
      worldId: world,
      name: e.name,
      entityKind: e.kind,
      mentions: e.mentions,
      chapterHits: e.chapterHits,
      arcs: e.arcs || [],
      fileRefs: ['curated/original-entity-index.json'],
      sourceRefs: e.sourceRefs || [],
      summary: `${e.kind} ${e.name}：mentions=${e.mentions}, chapters=${e.chapterHits}`
    }, [e.name, e.kind, ...(e.arcs || [])]);
  }

  for (const r of relationIndex.relationships || []) {
    push({
      id: `relationship:${r.id}`,
      kind: 'relationship-candidate',
      worldId: world,
      source: r.source,
      target: r.target,
      sourceName: r.sourceName,
      targetName: r.targetName,
      weight: r.weight,
      chapterHits: r.chapterHits,
      arcs: r.arcs || [],
      fileRefs: ['curated/original-relationship-candidates.json'],
      sourceRefs: r.sourceRefs || [],
      summary: `${r.source} ↔ ${r.target} 章节共现候选，weight=${r.weight}, chapters=${r.chapterHits}`
    }, [r.source, r.target, r.sourceName, r.targetName, ...(r.arcs || [])]);
  }

  const keywords = [...keywordMap.entries()].map(([keyword, ids]) => ({ keyword, hits: uniq(ids).length, ids: uniq(ids).slice(0, 200) })).sort((a, b) => b.hits - a.hits || a.keyword.localeCompare(b.keyword));
  const index = {
    schema: 'rp-original-search-index-v1',
    worldId: world,
    createdAt: NOW,
    policy: 'Search entry index for curated original-source artifacts. Use ids/fileRefs/sourceRefs to navigate without loading raw text by default.',
    coverage: { entries: entries.length, keywords: keywords.length },
    entries,
    keywords
  };
  const outPath = path.join(worldRoot, 'curated', 'original-search-index.json');
  writeJson(outPath, index);

  let md = `# ${world} Original Search Index\n\n更新日期：${NOW}\n\n`;
  md += `用途：统一检索 series / volume / chapter-event / entity / relationship-candidate，命中后再按 fileRefs/sourceRefs 读取对应精修文件或源文件。\n\n`;
  md += `- Entries: ${entries.length}\n- Keywords: ${keywords.length}\n\n`;
  md += '## Top Keywords\n\n';
  md += keywords.slice(0, 80).map(k => `- ${k.keyword}: ${k.hits}`).join('\n') || '- —';
  md += '\n';
  fs.writeFileSync(path.join(worldRoot, 'curated', 'original-search-index.md'), md, 'utf8');

  if (exists(runtimePath)) {
    const runtime = readJson(runtimePath);
    runtime.files = runtime.files || {};
    runtime.files.searchIndex = 'curated/original-search-index.json';
    runtime.files.searchIndexMarkdown = 'curated/original-search-index.md';
    runtime.coverage = runtime.coverage || {};
    runtime.coverage.searchEntries = entries.length;
    runtime.coverage.searchKeywords = keywords.length;
    runtime.updatedAt = NOW;
    writeJson(runtimePath, runtime);
  }
  return { world, entries: entries.length, keywords: keywords.length };
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
  walk(ROOT); walk(REPORT_DIR);
  const bad = [];
  for (const f of files) {
    try { JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { bad.push({ file: rel(f), error: e.message }); }
  }
  return { filesChecked: files.length, bad };
}

function main() {
  ensureDir(REPORT_DIR);
  const worlds = fs.readdirSync(ROOT).filter(w => exists(path.join(ROOT, w, 'sources', 'raw-text-manifest.json'))).sort();
  const reports = worlds.map(buildWorldSearchIndex).filter(Boolean);
  const validation = validateJson();
  writeJson(path.join(REPORT_DIR, 'original-search-index-report.json'), { createdAt: NOW, reports, validation });
  let md = `# Original Search Index Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮为所有已入库原著小说世界生成 original-search-index，统一检索 series / volume / chapter-event / entity / relationship-candidate。\n\n';
  md += `JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md += '| world | entries | keywords |\n|---|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.entries} | ${r.keywords} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR, 'original-search-index-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: validation.bad.length === 0, reports, validation }, null, 2));
}
main();
