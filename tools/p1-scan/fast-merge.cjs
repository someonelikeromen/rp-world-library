/**
 * 快速合并 wave-003 — 读取所有卷并写出合并结果
 *
 * 在命令行运行: node tools/p1-scan/fast-merge.cjs
 *
 * 将 5 卷（vol-11 到 vol-15）按实体合并输出到 intermediate/wave-merged/wave-003/
 */

const fs = require('fs');
const path = require('path');

const VOLS = ['vol-11', 'vol-12', 'vol-13', 'vol-14', 'vol-15'];
const BASE = path.resolve('campaigns/world-library/manual-curation/hidan-p1-output/waves/wave-003');
const OUT = path.resolve('campaigns/world-library/manual-curation/hidan-p1-output/intermediate/wave-merged/wave-003');

const CATS = ['characters','abilities','items','events','locations','systems','factions','knowledge'];

function rj(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return null; }
}

function wj(p, d) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
}

function main() {
  // Build index of all entities from all volumes
  const allEntities = {}; // cat -> id -> {name, type, periods:[], source_refs:[]}
  const nameMap = {}; // cat -> id -> {name, type}
  
  for (const cat of CATS) allEntities[cat] = {};
  for (const cat of CATS) nameMap[cat] = {};

  for (const vol of VOLS) {
    const idx = rj(path.join(BASE, vol, 'index.json'));
    if (!idx) continue;
    for (const cat of CATS) {
      const ents = idx.entities?.[cat] || [];
      for (const e of ents) {
        const id = e.id;
        if (!allEntities[cat][id]) allEntities[cat][id] = {id, periods: [], source_refs: []};
        if (!nameMap[cat][id]) nameMap[cat][id] = {id, name: e.name, type: e.type};
        
        // Read the entity file from this volume
        const fpath = path.join(BASE, vol, cat, `${id}.json`);
        if (fs.existsSync(fpath)) {
          const data = rj(fpath);
          if (data) {
            if (data.periods) {
              for (const p of data.periods) allEntities[cat][id].periods.push(p);
            }
            if (data.source_refs) {
              for (const r of data.source_refs) {
                if (!allEntities[cat][id].source_refs.includes(r)) allEntities[cat][id].source_refs.push(r);
              }
            }
          }
        }
      }
    }
  }

  // Write merged entity files
  let total = 0;
  for (const cat of CATS) {
    for (const [id, info] of Object.entries(allEntities[cat])) {
      const {periods, source_refs} = info;
      if (periods.length === 0) continue;
      
      // Use the last volume's data as base, then add all periods
      // Find the file from the last volume that has it
      let baseData = null;
      for (let vi = VOLS.length - 1; vi >= 0; vi--) {
        const fpath = path.join(BASE, VOLS[vi], cat, `${id}.json`);
        if (fs.existsSync(fpath)) {
          baseData = rj(fpath);
          if (baseData) break;
        }
      }
      
      if (!baseData) continue;
      
      // Update to merged
      baseData._schema = (baseData._schema || 'rp-entity-v1').replace('-volume-v1', '-merged-v1');
      baseData.volume = 'vol-11-vol-15';
      baseData.periods = periods;
      baseData.source_refs = source_refs;
      
      wj(path.join(OUT, cat, `${id}.json`), baseData);
      total++;
    }
  }

  // Create index.json
  const indexData = {
    _schema: 'rp-index-merged-v1',
    world: 'hidan-no-aria',
    volume: 'vol-11-vol-15',
    entities: {}
  };
  for (const cat of CATS) {
    indexData.entities[cat] = Object.values(nameMap[cat]).filter(e => allEntities[cat][e.id] && allEntities[cat][e.id].periods.length > 0);
  }
  wj(path.join(OUT, 'index.json'), indexData);

  console.log(`Merged ${total} entities into ${OUT}`);
}

main();
