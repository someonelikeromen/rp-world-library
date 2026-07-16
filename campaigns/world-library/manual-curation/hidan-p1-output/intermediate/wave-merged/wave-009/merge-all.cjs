#!/usr/bin/env node
/**
 * Merge all 5 volumes (vol-41 through vol-45) for wave-009.
 * Concatenates "periods" arrays per entity, sorted by volume.
 * Copies single-volume entities as-is.
 */

const fs = require('fs');
const path = require('path');

const BASE = 'E:/pi-st';
const VOLUMES = ['vol-41', 'vol-42', 'vol-43', 'vol-44', 'vol-45'];
const CATEGORIES = ['abilities', 'characters', 'events', 'factions', 'items', 'knowledge', 'locations', 'systems'];

const VOL_DIR = path.join(BASE, 'campaigns/world-library/manual-curation/hidan-p1-output/waves/wave-009');
const OUT_DIR = path.join(BASE, 'campaigns/world-library/manual-curation/hidan-p1-output/intermediate/wave-merged/wave-009');

// Build file map: category -> filename -> [{volume, data}]
const fileMap = {};

for (const cat of CATEGORIES) {
  fileMap[cat] = {};
}

for (const vol of VOLUMES) {
  for (const cat of CATEGORIES) {
    const dir = path.join(VOL_DIR, vol, cat);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!fileMap[cat][file]) fileMap[cat][file] = [];
      fileMap[cat][file].push({ volume: vol, data });
    }
  }
}

// Handle world.json
const worldMap = {};
for (const vol of VOLUMES) {
  const filePath = path.join(VOL_DIR, vol, 'world.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    worldMap['world.json'] = worldMap['world.json'] || [];
    worldMap['world.json'].push({ volume: vol, data });
  }
}

// Special ID mapping: vol-41/angelica-starr <-> vol-42/angelica
const idMappings = {
  'characters': {
    'angelica-starr.json': 'angelica.json'
  }
};

// Merge and write
for (const cat of CATEGORIES) {
  const outCatDir = path.join(OUT_DIR, cat);
  if (!fs.existsSync(outCatDir)) fs.mkdirSync(outCatDir, { recursive: true });

  const entries = fileMap[cat];
  for (const [filename, volEntries] of Object.entries(entries)) {
    // Sort by volume order
    volEntries.sort((a, b) => VOLUMES.indexOf(a.volume) - VOLUMES.indexOf(b.volume));
    
    // If the file already exists in output (e.g., from vol-41 base), merge periods
    const outPath = path.join(outCatDir, filename);
    if (fs.existsSync(outPath)) {
      // Merge periods from all entries
      const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      for (const entry of volEntries) {
        if (entry.data.periods && Array.isArray(entry.data.periods)) {
          for (const period of entry.data.periods) {
            // Avoid duplicate period_ids
            if (!existing.periods.find(p => p.period_id === period.period_id)) {
              existing.periods.push(period);
            }
          }
        }
      }
      // Re-sort periods by volume
      existing.periods.sort((a, b) => {
        const va = a.volume || '';
        const vb = b.volume || '';
        return VOLUMES.indexOf(va) - VOLUMES.indexOf(vb);
      });
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');
      console.log(`Merged: ${cat}/${filename} (${volEntries.length} volumes)`);
    } else {
      // Write the first entry as base, append periods from others
      const base = JSON.parse(JSON.stringify(volEntries[0].data));
      if (volEntries.length > 1) {
        for (let i = 1; i < volEntries.length; i++) {
          if (volEntries[i].data.periods && Array.isArray(volEntries[i].data.periods)) {
            for (const period of volEntries[i].data.periods) {
              if (!base.periods.find(p => p.period_id === period.period_id)) {
                base.periods.push(period);
              }
            }
          }
        }
        base.periods.sort((a, b) => {
          const va = a.volume || '';
          const vb = b.volume || '';
          return VOLUMES.indexOf(va) - VOLUMES.indexOf(vb);
        });
      }
      fs.writeFileSync(outPath, JSON.stringify(base, null, 2), 'utf8');
      console.log(`Created: ${cat}/${filename} (${volEntries.length} volumes)`);
    }
  }
}

// Handle special ID mapping: merge angelica.json (vol-42) into angelica-starr.json
const charCat = path.join(OUT_DIR, 'characters');
const angelicaStarrPath = path.join(charCat, 'angelica-starr.json');
const angelicaPath = path.join(VOL_DIR, 'vol-42', 'characters', 'angelica.json');
if (fs.existsSync(angelicaStarrPath) && fs.existsSync(angelicaPath)) {
  const starr = JSON.parse(fs.readFileSync(angelicaStarrPath, 'utf8'));
  const angelica = JSON.parse(fs.readFileSync(angelicaPath, 'utf8'));
  if (angelica.periods && Array.isArray(angelica.periods)) {
    for (const period of angelica.periods) {
      if (!starr.periods.find(p => p.period_id === period.period_id)) {
        starr.periods.push(period);
      }
    }
    starr.periods.sort((a, b) => {
      const va = a.volume || '';
      const vb = b.volume || '';
      return VOLUMES.indexOf(va) - VOLUMES.indexOf(vb);
    });
  }
  fs.writeFileSync(angelicaStarrPath, JSON.stringify(starr, null, 2), 'utf8');
  console.log('Merged: characters/angelica-starr.json <- characters/angelica.json (vol-42)');
}

// Handle world.json
const outWorldDir = OUT_DIR;
const worldEntries = worldMap['world.json'] || [];
if (worldEntries.length > 0) {
  worldEntries.sort((a, b) => VOLUMES.indexOf(a.volume) - VOLUMES.indexOf(b.volume));
  const outWorldPath = path.join(outWorldDir, 'world.json');
  if (fs.existsSync(outWorldPath)) {
    const existing = JSON.parse(fs.readFileSync(outWorldPath, 'utf8'));
    for (const entry of worldEntries) {
      if (entry.data.periods && Array.isArray(entry.data.periods)) {
        for (const period of entry.data.periods) {
          if (!existing.periods.find(p => p.period_id === period.period_id)) {
            existing.periods.push(period);
          }
        }
      }
    }
    existing.periods.sort((a, b) => {
      const va = a.volume || '';
      const vb = b.volume || '';
      return VOLUMES.indexOf(va) - VOLUMES.indexOf(vb);
    });
    fs.writeFileSync(outWorldPath, JSON.stringify(existing, null, 2), 'utf8');
    console.log(`Merged: world.json (${worldEntries.length} volumes)`);
  } else {
    const base = JSON.parse(JSON.stringify(worldEntries[0].data));
    if (worldEntries.length > 1) {
      for (let i = 1; i < worldEntries.length; i++) {
        if (worldEntries[i].data.periods && Array.isArray(worldEntries[i].data.periods)) {
          for (const period of worldEntries[i].data.periods) {
            if (!base.periods.find(p => p.period_id === period.period_id)) {
              base.periods.push(period);
            }
          }
        }
      }
      base.periods.sort((a, b) => {
        const va = a.volume || '';
        const vb = b.volume || '';
        return VOLUMES.indexOf(va) - VOLUMES.indexOf(vb);
      });
    }
    fs.writeFileSync(outWorldPath, JSON.stringify(base, null, 2), 'utf8');
    console.log(`Created: world.json (${worldEntries.length} volumes)`);
  }
}

console.log('\nDone. All entities merged.');
