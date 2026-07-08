const fs = require('fs');
const path = 'E:/pi-st/campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-19';
const dir = fs.readdirSync(path);
dir.forEach(f => {
  if (f.includes('第五章')) {
    console.log('EXACT FILENAME:', JSON.stringify(f));
    // Try to read the file using glob
  }
});
