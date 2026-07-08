const fs = require('fs');
const path = 'E:/pi-st/campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-19';
const dir = fs.readdirSync(path);
for (const f of dir) {
  if (f.endsWith('.txt') && !f.startsWith('_')) {
    console.log(`\n=== FILE: ${f} ===`);
    const content = fs.readFileSync(path + '/' + f, 'utf8');
    console.log(content);
  }
}
