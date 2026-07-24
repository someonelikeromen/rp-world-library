const fs = require('fs');
const path = require('path');

const sourceDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-split';
const cleanedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned';

// Collect ALL cleaned filenames (basename without ext)
const cleaned = new Map(); // index -> full path
function walk(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { walk(path.join(dir, e.name), prefix); continue; }
    if (!e.name.endsWith('.md')) continue;
    const name = e.name.replace('.md', '');
    // Extract index number
    const m = name.match(/(\d{4})/);
    if (m) cleaned.set(m[1], name);
    else cleaned.set(name, name);
  }
}
walk(cleanedDir);

const sources = [
  { name: 'card-local-1', dir: 'json-entries/card-local-1', ext: '.json', total: 199 },
  { name: 'card-sao-progressive-v1-3', dir: 'json-entries/card-sao-progressive-v1-3', ext: '.json', total: 269 },
  { name: 'wb-sao-v1-1', dir: 'json-entries/wb-sao-v1-1', ext: '.json', total: 35 },
];

for (const s of sources) {
  const fullDir = path.join(sourceDir, s.dir);
  if (!fs.existsSync(fullDir)) { console.log(`${s.name}: dir not found`); continue; }
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith(s.ext)).sort();
  let missing = 0;
  for (const f of files) {
    const m = f.match(/^.*?-(\d{4})-/);
    if (!m) { console.log(`  NO INDEX: ${f}`); missing++; continue; }
    const idx = m[1];
    if (!cleaned.has(idx)) {
      missing++;
      if (missing <= 5) console.log(`  MISSING ${idx}: ${f}`);
    }
  }
  const done = files.length - missing;
  console.log(`${s.name}: ${done}/${files.length} (${Math.round(done/files.length*100)}%), missing ${missing}`);
}
