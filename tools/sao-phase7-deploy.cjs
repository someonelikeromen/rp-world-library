const fs = require('fs');
const path = require('path');

const srcDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online';
const targetDir = 'E:/pi-st/campaigns/world-library/worlds/sword-art-online';

// Remove old archive if exists
if (fs.existsSync(targetDir)) {
  console.log('Removing old archive...');
  fs.rmSync(targetDir, { recursive: true, force: true });
}

// Move extracted to formal archive
const extractedSrc = path.join(srcDir, 'extracted');
const extractedDst = path.join(targetDir, 'extracted');

fs.mkdirSync(targetDir, { recursive: true });

// Copy extracted directory
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(extractedSrc, extractedDst);
console.log('Extracted data copied to formal archive.');

// Copy cleaned records
const cleanedDst = path.join(targetDir, 'source-cleaned', 'records');
const cleanedSrc = path.join(srcDir, 'source-cleaned', 'records');
copyDir(cleanedSrc, cleanedDst);
console.log('Source-cleaned records copied.');

// Copy classification index
fs.copyFileSync(
  path.join(srcDir, 'source-cleaned', 'classification-index.json'),
  path.join(targetDir, 'source-cleaned', 'classification-index.json')
);

// Copy duplicates report
const curatedDstDir = path.join(targetDir, 'curated');
fs.mkdirSync(curatedDstDir, { recursive: true });
if (fs.existsSync(path.join(srcDir, 'duplicates-report.json'))) {
  fs.copyFileSync(
    path.join(srcDir, 'duplicates-report.json'),
    path.join(curatedDstDir, 'duplicates-report.json')
  );
}

// Copy manifests (skip if missing)
try {
  fs.copyFileSync(
    path.join(srcDir, 'source-cleaned', 'manifest.json'),
    path.join(targetDir, 'source-cleaned', 'manifest.json')
  );
} catch (e) { console.log('  manifest.json not found, skipping'); }

// Write archive manifest
const manifest = {
  world: 'sword-art-online',
  title: '刀剑神域 (Sword Art Online)',
  phase: 'complete',
  generated: new Date().toISOString(),
  stats: {
    totalSourceUnits: 1140,
    cleanedMarkdownFiles: 1025,
    extractedJSONEntities: 1027,
    uniqueEntities: 863,
    duplicateGroups: 124,
    graphNodes: 1027,
    graphEdges: 292,
  },
  categories: {
    characters: { count: null, path: 'extracted/characters/' },
    locations: { count: null, path: 'extracted/locations/' },
    systems: { count: null, path: 'extracted/systems/' },
    events: { count: null, path: 'extracted/events/' },
    rules: { count: null, path: 'extracted/rules/' },
    items: { count: null, path: 'extracted/items/' },
    factions: { count: null, path: 'extracted/factions/' },
    abilities: { count: null, path: 'extracted/abilities/' },
    monsters: { count: null, path: 'extracted/monsters/' },
    concepts: { count: null, path: 'extracted/concepts/' },
    meta: { count: null, path: 'extracted/meta/' },
  },
  sources: {
    'card-local-1': { type: 'JSON character card', units: 199, path: 'imports/worldviews/sword-art-online/local-ingest/' },
    'card-sao-progressive-v1-3': { type: 'JSON character card', units: 269, path: 'imports/worldviews/sword-art-online/local-ingest/' },
    'wb-sao-v1-1': { type: 'JSON worldbook', units: 35, path: 'imports/worldviews/sword-art-online/local-ingest/' },
    'txt-aincrad': { type: 'TXT world data', units: 637, path: 'imports/worldviews/sword-art-online/local-ingest/' },
  },
};

// Count files per category
for (const [cat, info] of Object.entries(manifest.categories)) {
  const dir = path.join(targetDir, info.path);
  if (fs.existsSync(dir)) {
    info.count = fs.readdirSync(dir).filter(f => f !== 'index.json' && f.endsWith('.json')).length;
  }
}

fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Archive manifest written.');

// Update .wl-index.json
const wlIndexPath = 'E:/pi-st/campaigns/world-library/.wl-index.json';
let wlIndex = { worlds: [] };
if (fs.existsSync(wlIndexPath)) {
  wlIndex = JSON.parse(fs.readFileSync(wlIndexPath, 'utf-8'));
}

wlIndex.worlds['sword-art-online'] = {
  title: '刀剑神域 (Sword Art Online)',
  status: 'archived',
  lastUpdated: new Date().toISOString(),
  stats: manifest.stats,
};

fs.writeFileSync(wlIndexPath, JSON.stringify(wlIndex, null, 2));
console.log('.wl-index.json updated.');
console.log('\n=== Phase 7 Complete ===');
console.log(`Archive deployed to: ${targetDir}`);
