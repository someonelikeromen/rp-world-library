const fs = require('fs');
const path = require('path');

const sourceDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-split';
const cleanedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned';

const sources = {
  'card-local-1': { dir: path.join(sourceDir, 'json-entries/card-local-1'), ext: '.json' },
  'card-sao-progressive-v1-3': { dir: path.join(sourceDir, 'json-entries/card-sao-progressive-v1-3'), ext: '.json' },
  'wb-sao-v1-1': { dir: path.join(sourceDir, 'json-entries/wb-sao-v1-1'), ext: '.json' },
  'txt-aincrad': { dir: path.join(sourceDir, 'txt-units/txt-aincrad-trpg-floor-module'), ext: '.txt' },
};

const cleanedFiles = new Set();
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.md')) cleanedFiles.add(e.name.replace('.md', ''));
  }
}
walk(cleanedDir);

const missing = [];
for (const [source, { dir, ext }] of Object.entries(sources)) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(ext));
  for (const f of files) {
    const base = f.replace(ext, '');
    const found = [...cleanedFiles].some(cf => cf.includes(base.split('-').slice(-1)[0]) || cf === base);
    // Check by full base name
    let matched = false;
    for (const cf of cleanedFiles) {
      if (cf === `${source}-${base}` || cf.includes(base) || base.includes(cf.split('-').slice(-2).join('-'))) {
        matched = true;
        break;
      }
    }
    // Simplified: just check if base appear in any cleaned name
    const foundSimple = [...cleanedFiles].some(cf => cf.includes(base.substring(Math.min(6, base.length))));
    if (!foundSimple) {
      missing.push(`${source}/${base}`);
    }
  }
}

// More precise approach: check by source prefix
for (const [source, { dir, ext }] of Object.entries(sources)) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(ext));
  let srcMissing = 0;
  for (const f of files) {
    const base = f.replace(ext, '');
    const prefix = `${source}-${base}`;
    const found = [...cleanedFiles].some(cf => cf === prefix || cf.startsWith(prefix.substring(0, Math.min(30, prefix.length))));
    if (!found) srcMissing++;
  }
  console.log(`${source}: ${files.length - srcMissing}/${files.length} cleaned, ${srcMissing} missing`);
}

// Report by source with explicit count
console.log('\n=== DETAILED ===');
for (const [source, { dir, ext }] of Object.entries(sources)) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(ext));
  let srcMissing = [];
  for (const f of files) {
    const base = f.replace(ext, '');
    const fullExpected = `${source}-${base}`;
    // Check multiple possible cleaned names
    let found = false;
    for (const cf of cleanedFiles) {
      const cfBase = cf;
      // Match by index number pattern
      const indexMatch = base.match(/^(\d{4})/);
      if (indexMatch) {
        const expectedIndex = indexMatch[1];
        if (cfBase.includes(expectedIndex) && cfBase.toLowerCase().includes(base.toLowerCase().substring(5).substring(0, 10))) {
          found = true;
          break;
        }
        // Also check direct subdirectory files
        if (cfBase.startsWith(`${source}-${expectedIndex}`)) {
          found = true;
          break;
        }
      }
      // Direct match
      if (cfBase === fullExpected || cfBase === base) {
        found = true;
        break;
      }
    }
    if (!found) srcMissing.push(f);
  }
  if (srcMissing.length > 0) {
    console.log(`\n${source}: ${srcMissing.length} missing`);
    srcMissing.slice(0, 20).forEach(f => console.log(`  ${f}`));
    if (srcMissing.length > 20) console.log(`  ... and ${srcMissing.length - 20} more`);
  } else {
    console.log(`\n${source}: COMPLETE`);
  }
}
