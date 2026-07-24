/**
 * Phase 4 v2: Script-based JSON extraction from cleaned Markdown files.
 * No agent_team needed - MD is already clean, just parse and wrap.
 */
const fs = require('fs');
const path = require('path');

const recordsDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned/records';
const extractedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/extracted';

const categoryMap = {
  character: 'characters',
  location: 'locations',
  system: 'systems',
  event: 'events',
  rule: 'rules',
  item: 'items',
  faction: 'factions',
  ability: 'abilities',
  monster: 'monsters',
  concept: 'concepts',
  meta: 'meta',
};

// Load classification index
const index = JSON.parse(fs.readFileSync(
  'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned/classification-index.json', 'utf-8'));

// Create index map: filename -> category
const fileMap = new Map();
for (const entry of index.files) {
  fileMap.set(entry.file, entry);
}

let extracted = 0;
let errors = 0;

// Process each source directory
for (const sourceDir of fs.readdirSync(recordsDir)) {
  const fullDir = path.join(recordsDir, sourceDir);
  if (!fs.statSync(fullDir).isDirectory()) continue;
  
  for (const f of fs.readdirSync(fullDir)) {
    if (!f.endsWith('.md')) continue;
    
    const filePath = path.join(fullDir, f);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract title (first # line)
    const titleMatch = content.match(/^#\s+(.+?)(?:\n|$)/m);
    const title = titleMatch ? titleMatch[1].trim() : f.replace('.md', '');
    
    // Full body (everything after title)
    const body = titleMatch ? content.substring(content.indexOf('\n') + 1).trim() : content;
    
    // Category from index
    const catInfo = fileMap.get(f);
    const category = catInfo ? catInfo.category : 'concept';
    const targetCatDir = categoryMap[category] || 'concepts';
    
    // Generate id
    const safeName = title.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_').substring(0, 40);
    const id = `sa-${targetCatDir.substring(0, 4)}-${safeName}`;
    
    // Build JSON
    const json = {
      id,
      type: category,
      name: title,
      source: sourceDir,
      sourceFile: f,
      description: content, // FULL original text - zero loss
      attributes: {},
      relations: [],
    };
    
    // Write JSON
    const targetDir = path.join(extractedDir, targetCatDir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    const outPath = path.join(targetDir, `${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
    extracted++;
    
    if (extracted % 100 === 0) console.log(`  ${extracted} files extracted...`);
  }
}

console.log(`\nExtracted: ${extracted} files`);
console.log(`Errors: ${errors}`);

// Write index files per category
for (const [cat, dir] of Object.entries(categoryMap)) {
  const fullDir = path.join(extractedDir, dir);
  if (!fs.existsSync(fullDir)) continue;
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.json'));
  const catIndex = {
    category: cat,
    count: files.length,
    entries: files.map(f => {
      const j = JSON.parse(fs.readFileSync(path.join(fullDir, f), 'utf-8'));
      return { id: j.id, name: j.name, source: j.source, sourceFile: j.sourceFile };
    }),
  };
  fs.writeFileSync(path.join(fullDir, 'index.json'), JSON.stringify(catIndex, null, 2));
}

console.log('Index files written.');
