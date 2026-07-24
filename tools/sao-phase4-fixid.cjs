const fs = require('fs');
const path = require('path');

const recordsDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned/records';
const extractedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/extracted';

const categoryMap = {
  character: 'characters', location: 'locations', system: 'systems',
  event: 'events', rule: 'rules', item: 'items', faction: 'factions',
  ability: 'abilities', monster: 'monsters', concept: 'concepts', meta: 'meta',
};

const index = JSON.parse(fs.readFileSync(
  'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned/classification-index.json', 'utf-8'));
const fileMap = new Map();
for (const e of index.files) fileMap.set(e.file, e);

// Clear previous extracted (except graph)
for (const d of fs.readdirSync(extractedDir)) {
  if (d === 'graph') continue;
  const full = path.join(extractedDir, d);
  if (fs.statSync(full).isDirectory()) {
    for (const f of fs.readdirSync(full)) {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(full, f));
    }
  }
}

let counter = 0;
for (const sourceDir of fs.readdirSync(recordsDir)) {
  const fullDir = path.join(recordsDir, sourceDir);
  if (!fs.statSync(fullDir).isDirectory()) continue;
  
  for (const f of fs.readdirSync(fullDir).sort()) {
    if (!f.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(fullDir, f), 'utf-8');
    const titleMatch = content.match(/^#\s+(.+?)(?:\n|$)/m);
    const title = titleMatch ? titleMatch[1].trim() : f.replace('.md', '');
    const catInfo = fileMap.get(f);
    const category = catInfo ? catInfo.category : 'concept';
    const targetCatDir = categoryMap[category] || 'concepts';
    
    const id = `sao-${String(counter).padStart(5, '0')}`;
    counter++;
    
    const json = {
      id, type: category, name: title, source: sourceDir,
      sourceFile: f, description: content, attributes: {}, relations: [],
    };
    
    const targetDir = path.join(extractedDir, targetCatDir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, `${id}.json`), JSON.stringify(json, null, 2));
    
    if (counter % 200 === 0) console.log(`  ${counter} files...`);
  }
}

console.log(`Extracted: ${counter} files`);

// Rebuild indexes
for (const dir of Object.keys(categoryMap)) {
  const catDir = path.join(extractedDir, categoryMap[dir]);
  if (!fs.existsSync(catDir)) continue;
  const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
  const idx = { category: dir, count: files.length, entries: [] };
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(catDir, f), 'utf-8'));
    idx.entries.push({ id: j.id, name: j.name, source: j.source });
  }
  fs.writeFileSync(path.join(catDir, 'index.json'), JSON.stringify(idx, null, 2));
}
console.log('Done.');
