#!/usr/bin/env node
// split-aggregate.cjs — 拆分 vol-01 的 {meta, entities} 格式聚合文件
const fs = require('fs');

const targetDir = process.argv[2];
if (!targetDir) { console.error('Usage: node split-aggregate.cjs <dir>'); process.exit(1); }

const categories = {
  characters: 'character',
  abilities: 'ability',
  events: 'event',
  items: 'item',
  locations: 'location',
  factions: 'faction',
  systems: 'system',
  knowledge: 'knowledge'
};

const vol = targetDir.match(/vol-\d+/)?.[0] || 'vol-00';
let total = 0;

for (const [cat, entityType] of Object.entries(categories)) {
  const src = `${targetDir}/${cat}.json`;
  if (!fs.existsSync(src)) continue;

  let data;
  try { data = JSON.parse(fs.readFileSync(src, 'utf-8')); }
  catch(e) { console.log(`  SKIP ${cat}.json: parse error`); continue; }

  const entities = data.entities || [];
  if (entities.length === 0) { console.log(`  SKIP ${cat}.json: empty entities`); continue; }

  const outDir = `${targetDir}/${cat}`;
  fs.mkdirSync(outDir, { recursive: true });

  let written = 0;
  for (const entity of entities) {
    const eid = entity.id?.replace(/^char-|^abil-|^event-|^item-|^loc-|^faction-|^system-|^know-/, '') || 
                entity.id || 
                String(entity.name || '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    if (!eid) { console.log(`  WARN ${cat}: no id`); continue; }

    const doc = {
      _schema: `rp-${entityType}-volume-v1`,
      world: 'campione',
      [`${entityType}_id`]: eid,
      volume: vol,
      periods: [{
        period_id: `${vol}-main`,
        volume: vol,
        name: typeof entity.name === 'object' ? entity.name : { zh: entity.name || '' },
        aliases: entity.aliases || [],
        summary: entity.summary || '',
        sourceRef: (entity.sourceRefs?.[0] || '') + (entity.sourceRefs?.[1] ? `,${entity.sourceRefs[1]}` : '')
      }],
      source_refs: entity.sourceRefs || []
    };
    // Remove empty sourceRef
    if (!doc.periods[0].sourceRef || doc.periods[0].sourceRef === '') delete doc.periods[0].sourceRef;

    // Add type-specific fields
    if (entityType === 'character') {
      doc.periods[0].name.zh = entity.name || '';
      doc.periods[0].titles = entity.titles || entity.aliases || [];
      if (entity.race) doc.periods[0].species = entity.race;
      if (entity.affiliation) doc.periods[0].affiliation = entity.affiliation;
      if (entity.abilities) doc.periods[0].abilities_owned = entity.abilities;
      if (entity.description) doc.periods[0].personality = { summary: entity.description };
    } else if (entityType === 'ability') {
      doc.periods[0].name.zh = entity.name || '';
      doc.periods[0].type = entity.type || '';
      doc.periods[0].description = entity.summary || entity.description || '';
      if (entity.details) doc.periods[0].usage = entity.details;
    } else if (entityType === 'event') {
      doc.periods[0].summary = entity.summary || '';
      if (entity.participants) doc.periods[0].participants = entity.participants;
      if (entity.time) doc.periods[0].time = entity.time;
      if (entity.location) doc.periods[0].location = entity.location;
    }

    fs.writeFileSync(`${outDir}/${eid}.json`, JSON.stringify(doc, null, 2), 'utf-8');
    written++;
    total++;
  }
  fs.renameSync(src, src + '.aggregate.bak');
  console.log(`  ${cat}: ${written} files`);
}

// Fix index.json if it exists in old format
const idxPath = `${targetDir}/index.json`;
if (fs.existsSync(idxPath)) {
  try {
    const idx = JSON.parse(fs.readFileSync(idxPath, 'utf-8'));
    // If index is in aggregate format, fix it
    if (idx.meta && idx.entities) {
      const newIdx = { entities: {}, files: {} };
      for (const e of idx.entities) {
        const cat = e.category || 'unknown';
        const eid = (e.id || '').replace(/^char-|^abil-|^event-|^item-|^loc-|^faction-|^system-|^know-/, '') || e.id;
        if (!newIdx.entities[cat]) newIdx.entities[cat] = [];
        newIdx.entities[cat].push(eid);
        newIdx.files[`${cat}/${eid}.json`] = `${cat}/${eid}.json`;
      }
      fs.writeFileSync(idxPath, JSON.stringify(newIdx, null, 2), 'utf-8');
      console.log(`  index: reformatted to entities+files`);
    }
  } catch(e) { console.log(`  index: skipped (${e.message.substring(0,30)})`); }
}

console.log(`\nTotal: ${total} individual entity files`);
