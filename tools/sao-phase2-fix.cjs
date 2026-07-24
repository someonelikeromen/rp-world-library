const fs = require('fs');
const path = require('path');

const cleanedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned';
const targetDir = path.join(cleanedDir, 'records', 'txt-aincrad-trpg-floor-module');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

let moved = 0;
const rootFiles = fs.readdirSync(cleanedDir).filter(f => f.endsWith('.md'));

for (const f of rootFiles) {
  // Match files that are just numbers or numbers-with-descriptions
  // e.g. "0041.md", "0048-Floor_7---BOSS机制.md"
  const m = f.match(/^(\d{4})(-.+)?\.md$/);
  if (!m) continue;
  
  const newName = `txt-aincrad-trpg-floor-module-${f}`;
  const src = path.join(cleanedDir, f);
  const dst = path.join(targetDir, newName);
  
  if (!fs.existsSync(dst)) {
    fs.renameSync(src, dst);
    moved++;
  } else {
    // keep larger
    const srcSize = fs.statSync(src).size;
    const dstSize = fs.statSync(dst).size;
    if (srcSize > dstSize) {
      fs.renameSync(src, dst);
    } else {
      fs.unlinkSync(src);
    }
  }
}

console.log(`Moved ${moved} txt files to records/txt-aincrad-trpg-floor-module/`);

// Final count
const remaining = fs.readdirSync(cleanedDir).filter(f => f.endsWith('.md'));
console.log(`\nRemaining in root: ${remaining.length}`);
if (remaining.length > 0) {
  remaining.forEach(f => console.log(`  ${f}`));
}

// All counts
console.log('\n=== All subdir counts ===');
for (const d of fs.readdirSync(path.join(cleanedDir, 'records'))) {
  const dd = path.join(cleanedDir, 'records', d);
  if (fs.statSync(dd).isDirectory()) {
    const count = fs.readdirSync(dd).filter(f => f.endsWith('.md')).length;
    console.log(`${d}: ${count}`);
  }
}

// Total
let total = remaining.length;
for (const d of fs.readdirSync(path.join(cleanedDir, 'records'))) {
  const dd = path.join(cleanedDir, 'records', d);
  if (fs.statSync(dd).isDirectory()) {
    total += fs.readdirSync(dd).filter(f => f.endsWith('.md')).length;
  }
}
console.log(`\nTOTAL: ${total}`);
