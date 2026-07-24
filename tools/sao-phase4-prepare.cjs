/**
 * Phase 4: Extract structured JSON from cleaned Markdown files.
 * Uses agent_team workers to process all entities by category.
 * 
 * JSON Template per entity:
 * {
 *   "id": "sa-char-XXXX",
 *   "type": "character|location|system|event|rule|item|faction|ability|monster|concept|meta",
 *   "name": "human readable name",
 *   "source": "card-local-1|card-sao-progressive-v1-3|wb-sao-v1-1|txt-aincrad",
 *   "sourceFile": "original filename",
 *   "category": "entity type",
 *   "description": "FULL cleaned text body - 信息零损失",
 *   "attributes": { extracted key-value pairs },
 *   "relations": [{ target, type, description }]
 * }
 */

const fs = require('fs');
const path = require('path');

const index = JSON.parse(fs.readFileSync(
  'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned/classification-index.json', 'utf-8'));

// Create output dirs
const extractedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/extracted';
for (const cat of ['characters', 'locations', 'systems', 'events', 'rules', 'items', 'factions', 'abilities', 'monsters', 'concepts', 'meta']) {
  fs.mkdirSync(path.join(extractedDir, cat), { recursive: true });
}

// Group by category
const byCategory = {};
for (const entry of index.files) {
  if (!byCategory[entry.category]) byCategory[entry.category] = [];
  byCategory[entry.category].push(entry);
}

// Generate batch manifests for agent_team
const batchDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/work-packets';
fs.mkdirSync(batchDir, { recursive: true });

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

// Create batch packets (8 files per batch)
const batches = [];
for (const [cat, files] of Object.entries(byCategory)) {
  const targetDir = path.join(extractedDir, categoryMap[cat]);
  for (let i = 0; i < files.length; i += 8) {
    const batch = files.slice(i, i + 8);
    batches.push({
      id: `phase4-${cat}-${Math.floor(i/8)+1}`,
      category: cat,
      targetDir: categoryMap[cat],
      size: batch.length,
      files: batch.map(f => ({
        source: f.source,
        file: f.file,
        sourceDir: f.source,
      })),
    });
  }
}

const manifest = {
  phase: 4,
  description: 'JSON extraction from cleaned Markdown',
  totalBatches: batches.length,
  totalFiles: index.totalFiles,
  batches,
};

fs.writeFileSync(path.join(batchDir, 'phase4-manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`Phase 4 manifest: ${batches.length} batches, ${index.totalFiles} files`);
console.log('\nBy category:');
for (const [cat, files] of Object.entries(byCategory)) {
  const batchCount = Math.ceil(files.length / 8);
  console.log(`  ${cat}: ${files.length} files → ${batchCount} batches`);
}
console.log(`\nTarget directory: ${extractedDir}`);
