#!/usr/bin/env node
// merge-wave.cjs: 将一批卷串联合并为一个 wave-merged 目录
// Usage: node merge-wave.cjs <outdir> <vol-dir-1> <vol-dir-2> ...
const fs = require('fs'), path = require('path');

const [outDir, ...volDirs] = process.argv.slice(2);
if (!outDir || volDirs.length === 0) {
  console.error('Usage: node merge-wave.cjs <outdir> <vol1> <vol2> ...');
  process.exit(1);
}

const TYPES = ['characters','abilities','items','events','locations','factions','systems','knowledge'];

// Ensure output subdirs
for (const t of TYPES) fs.mkdirSync(path.join(outDir, t), { recursive: true });

const entityMap = {}; // id -> { metadata from first encounter, periods: [] }
const allFiles = {};  // type -> set of ids

for (const volDir of volDirs) {
  if (!fs.existsSync(volDir)) { console.warn(`  SKIP: ${volDir} not found`); continue; }
  const vol = path.basename(volDir);
  console.log(`  Processing ${vol} (${volDir})`);

  for (const type of TYPES) {
    const srcDir = path.join(volDir, type);
    if (!fs.existsSync(srcDir)) continue;
    if (!allFiles[type]) allFiles[type] = new Set();

    for (const f of fs.readdirSync(srcDir).sort()) {
      if (!f.endsWith('.json')) continue;
      const id = f.replace('.json', '');
      allFiles[type].add(id);
      const srcPath = path.join(srcDir, f);
      const content = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));

      if (!entityMap[type]) entityMap[type] = {};
      if (!entityMap[type][id]) {
        // First encounter: keep full metadata, extract periods
        entityMap[type][id] = { metadata: { ...content }, periods: [] };
        delete entityMap[type][id].metadata.periods; // remove periods from metadata copy
        // Copy source_refs from content
        if (content.source_refs) {
          entityMap[type][id].metadata.source_refs = content.source_refs;
        }
      }

      // Concatenate periods
      if (content.periods && Array.isArray(content.periods)) {
        for (const p of content.periods) {
          entityMap[type][id].periods.push(p);
        }
      }
    }
  }
}

// Sort periods by volume then time for each entity
for (const type of TYPES) {
  if (!entityMap[type]) continue;
  for (const [id, data] of Object.entries(entityMap[type])) {
    data.periods.sort((a, b) => {
      const volA = a.volume || '';
      const volB = b.volume || '';
      if (volA !== volB) return volA.localeCompare(volB);
      const tA = a.time || '';
      const tB = b.time || '';
      return tA.localeCompare(tB);
    });
  }
}

// Write output files
let total = 0;
for (const type of TYPES) {
  if (!entityMap[type]) continue;
  for (const [id, data] of Object.entries(entityMap[type])) {
    const out = { ...data.metadata, periods: data.periods };
    const outPath = path.join(outDir, type, `${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
    total++;
  }
}

// Create index.json
const entities = {};
for (const type of TYPES) {
  entities[type] = [];
  if (allFiles[type]) {
    for (const id of [...allFiles[type]].sort()) {
      entities[type].push({ id, name: id, type });
    }
  }
}
const idx = {
  _schema: 'rp-index-volume-v1',
  world: 'hidan-no-aria',
  wave: path.basename(outDir),
  output: outDir,
  source_volumes: volDirs.map(d => path.basename(d)),
  counts: Object.fromEntries(TYPES.map(t => [t, (allFiles[t]?.size || 0)])),
  entities,
  total_files: total
};
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(idx, null, 2) + '\n');

// Create merge-report.json
const report = {
  merge_time: new Date().toISOString(),
  source_volumes: volDirs.map(d => path.basename(d)),
  total_files: total,
  entity_counts: Object.fromEntries(TYPES.map(t => [t, (allFiles[t]?.size || 0)])),
  status: 'completed'
};
fs.writeFileSync(path.join(outDir, 'merge-report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`\nDone: ${total} entity files merged into ${outDir}`);
