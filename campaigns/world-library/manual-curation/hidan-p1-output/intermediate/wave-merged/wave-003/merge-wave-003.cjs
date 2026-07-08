/**
 * merge-wave-003.cjs — 合并 wave-003 的 5 卷（vol-11 到 vol-15）
 *
 * 用法: node tools/p1-scan/merge-wave-003.cjs
 *
 * 对每个实体：串联 periods，按 volume 排序。创建 index.json。
 */

const fs = require('fs');
const path = require('path');

const VOLUMES = ['vol-11', 'vol-12', 'vol-13', 'vol-14', 'vol-15'];
const BASE = 'campaigns/world-library/manual-curation/hidan-p1-output/waves/wave-003';
const OUTPUT = 'campaigns/world-library/manual-curation/hidan-p1-output/intermediate/wave-merged/wave-003';

const CATEGORIES = ['characters', 'abilities', 'items', 'events', 'locations', 'systems', 'factions', 'knowledge'];

// ID 同义映射：不同卷使用不同 ID 但指向同一实体的映射表
const ID_SYNONYMS = {
  'reiki': 'reki',
  'reiji': 'reki',
  'jeanne': 'jeanne-darc',
  'mochiizuki-moe': 'mochizuki-moe',
  'muto-gouki': 'mutou-gouki',
  'mutou': 'mutou-gouki',
  'zhuge-seigen': 'zhuge-jinghuan',
  'zhuge': 'zhuge-jinghuan',
  'caocao': 'cao-cao-ji-niang',
  'cao-cao-melee': 'cao-cao-ji-niang',
  'cao-cao-gunner': 'cao-cao-ji-niang',
  'cao-cao-sniper': 'cao-cao-ji-niang',
  'cao-cao-engineer': 'cao-cao-ji-niang',
  'jiao-jiao': 'cao-cao-ji-niang',
  'kou-sun-wukong': 'sun-wukong',
  'sun-wukong': 'sun-wukong'
};

function canonicalId(id) {
  return ID_SYNONYMS[id] || id;
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function mergeUniqueArrays(arr1, arr2) {
  const set = new Set([...(arr1 || []), ...(arr2 || [])]);
  return [...set];
}

function main() {
  // Step 1: Collect all entity files by canonical ID
  const entitiesByType = {};
  const indexEntities = {};

  for (const cat of CATEGORIES) {
    entitiesByType[cat] = {};
    indexEntities[cat] = {};
  }

  for (const vol of VOLUMES) {
    const indexFile = path.join(BASE, vol, 'index.json');
    const indexData = readJSON(indexFile);
    if (!indexData) {
      console.error(`Missing index: ${indexFile}`);
      continue;
    }

    for (const cat of CATEGORIES) {
      const volEntities = indexData?.entities?.[cat] || [];
      for (const ent of volEntities) {
        const canonical = canonicalId(ent.id);
        const entDir = path.join(BASE, vol, cat);

        // Try multiple possible filenames
        let entFile = null;
        const candidates = [
          path.join(entDir, `${canonical}.json`),
          path.join(entDir, `${ent.id}.json`)
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            entFile = c;
            break;
          }
        }

        if (!entFile) continue;

        if (!entitiesByType[cat][canonical]) {
          entitiesByType[cat][canonical] = { periods: [], source_refs: [], entries: [], name: ent.name, type: ent.type };
        }
        entitiesByType[cat][canonical].entries.push(entFile);

        // Update entity name/type from index
        if (!indexEntities[cat][canonical]) {
          indexEntities[cat][canonical] = { id: canonical, name: ent.name, type: ent.type };
        }
      }
    }
  }

  // Step 2: For each entity, read and merge periods across volumes
  const mergedEntities = {};

  for (const cat of CATEGORIES) {
    mergedEntities[cat] = {};
    for (const [entityId, info] of Object.entries(entitiesByType[cat])) {
      const allPeriods = [];
      const allSourceRefs = [];

      // Sort entries by volume order
      info.entries.sort((a, b) => {
        const volA = VOLUMES.indexOf(path.basename(path.dirname(path.dirname(a))));
        const volB = VOLUMES.indexOf(path.basename(path.dirname(path.dirname(b))));
        return volA - volB;
      });

      let baseData = null;

      for (const entryFile of info.entries) {
        const data = readJSON(entryFile);
        if (!data) continue;

        if (!baseData) {
          // Use the first volume's data as the base structure
          baseData = JSON.parse(JSON.stringify(data));
          // Replace schema to indicate merged
          baseData._schema = baseData._schema.replace('-volume-v1', '-merged-v1');
          baseData.volume = 'vol-11-vol-15';
          baseData.periods = [];
          baseData.source_refs = [];
        }

        // Collect periods from this volume
        if (data.periods) {
          for (const p of data.periods) {
            allPeriods.push(p);
          }
        }

        // Collect source refs
        if (data.source_refs) {
          for (const ref of data.source_refs) {
            if (!allSourceRefs.includes(ref)) {
              allSourceRefs.push(ref);
            }
          }
        }
      }

      if (baseData) {
        baseData.periods = allPeriods;
        baseData.source_refs = allSourceRefs;
        mergedEntities[cat][entityId] = baseData;
      }
    }
  }

  // Step 3: Write merged entity files
  for (const cat of CATEGORIES) {
    for (const [entityId, data] of Object.entries(mergedEntities[cat])) {
      const outFile = path.join(OUTPUT, cat, `${entityId}.json`);
      writeJSON(outFile, data);
    }
  }

  // Step 4: Create index.json
  const indexData = {
    _schema: 'rp-index-merged-v1',
    world: 'hidan-no-aria',
    volume: 'vol-11-vol-15',
    entities: {}
  };
  for (const cat of CATEGORIES) {
    indexData.entities[cat] = Object.values(indexEntities[cat]).filter(e => mergedEntities[cat][e.id]);
  }

  writeJSON(path.join(OUTPUT, 'index.json'), indexData);

  // Summary
  let total = 0;
  for (const cat of CATEGORIES) {
    const count = Object.keys(mergedEntities[cat]).length;
    total += count;
    console.log(`${cat}: ${count}`);
  }
  console.log(`Total merged entities: ${total}`);
  console.log('Done!');
}

main();
