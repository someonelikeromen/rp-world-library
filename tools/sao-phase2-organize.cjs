const fs = require('fs');
const path = require('path');

const cleanedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned';
const recordsDir = path.join(cleanedDir, 'records');

// Define source prefixes and their target subdirs
const routing = [
  { prefix: 'card-local-1-', dir: 'card-local-1' },
  { prefix: 'card-sao-progressive-v1-3-', dir: 'card-sao-progressive-v1-3' },
  { prefix: 'wb-sao-v1-1-', dir: 'wb-sao-v1-1' },
  { prefix: 'txt-aincrad-trpg-floor-module-', dir: 'txt-aincrad-trpg-floor-module' },
];

let moved = 0;
let skipped = 0;

// Scan root-level .md files
const rootFiles = fs.readdirSync(cleanedDir).filter(f => f.endsWith('.md'));
console.log(`Root .md files: ${rootFiles.length}`);

for (const f of rootFiles) {
  let routed = false;
  for (const { prefix, dir } of routing) {
    if (f.startsWith(prefix)) {
      const targetDir = path.join(recordsDir, dir);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const src = path.join(cleanedDir, f);
      const dst = path.join(targetDir, f);
      if (!fs.existsSync(dst)) {
        fs.renameSync(src, dst);
        moved++;
      } else {
        // Already exists - keep the larger one
        const srcSize = fs.statSync(src).size;
        const dstSize = fs.statSync(dst).size;
        if (srcSize > dstSize) {
          fs.renameSync(src, dst);
          console.log(`  replaced: ${f} (${srcSize} > ${dstSize})`);
        } else {
          fs.unlinkSync(src);
          console.log(`  skipped: ${f} (smaller)`);
        }
        skipped++;
      }
      routed = true;
      break;
    }
  }
  if (!routed) {
    // Try to route by index number pattern
    const m = f.match(/^(\d{4})-/);
    if (m) {
      // These are txt-aincrad files, route to txt dir
      const targetDir = path.join(recordsDir, 'txt-aincrad-trpg-floor-module');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const src = path.join(cleanedDir, f);
      const dst = path.join(targetDir, `txt-aincrad-trpg-floor-module-${f}`);
      if (!fs.existsSync(dst)) {
        fs.renameSync(src, dst);
        moved++;
        routed = true;
      }
    }
  }
  if (!routed) {
    console.log(`  UNROUTED: ${f}`);
  }
}

console.log(`\nMoved: ${moved}, Skipped: ${skipped}`);

// Count final state
console.log('\n=== Final counts ===');
for (const { prefix, dir } of routing) {
  const d = path.join(recordsDir, dir);
  const count = fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.md')).length : 0;
  console.log(`${dir}: ${count}`);
}
