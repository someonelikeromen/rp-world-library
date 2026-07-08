const fs = require('fs');
const vol19Dir = 'E:/pi-st/campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-19';
const vol20Dir = 'E:/pi-st/campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-20';

function readAllFiles(dir) {
  const files = fs.readdirSync(dir).sort();
  let result = {};
  for (const f of files) {
    if (!f.endsWith('.txt') || f.startsWith('_')) continue;
    const num = f.split('-')[0];
    // Normalize num to 2 digits
    const key = num.padStart(2, '0');
    result[key] = {
      file: f,
      content: fs.readFileSync(dir + '/' + f, 'utf8')
    };
  }
  return result;
}

const vol19 = readAllFiles(vol19Dir);
const vol20 = readAllFiles(vol20Dir);

// Print key info for each chapter
Object.keys(vol19).sort().forEach(num => {
  const ch = vol19[num];
  const lines = ch.content.split('\n').filter(l => l.trim());
  let title = lines.find(l => l.startsWith('第十六卷') || l.startsWith('序章') || l.startsWith('第一章') || l.startsWith('第二章') || l.startsWith('第三章') || l.startsWith('第四章') || l.startsWith('第五章') || l.startsWith('第六章') || l.startsWith('终章') || l.startsWith('断章') || l.startsWith('后记') || l.startsWith('电子版') || l.startsWith('Melonbooks') || l.startsWith('虎穴') || l.startsWith('特典'));
  if (!title) title = lines[0] || lines[1] || '';
  console.log(`V19 ${num}: ${title.substring(0,80)}`);
});

console.log('\n---');
Object.keys(vol20).sort().forEach(num => {
  const ch = vol20[num];
  const lines = ch.content.split('\n').filter(l => l.trim());
  let title = lines.find(l => l.startsWith('第十六卷') || l.startsWith('第十七卷') || l.startsWith('第一章') || l.startsWith('第二章') || l.startsWith('第三章') || l.startsWith('第四章') || l.startsWith('终章') || l.startsWith('后记') || l.startsWith('特典'));
  if (!title) title = lines[0] || lines[1] || '';
  console.log(`V20 ${num}: ${title.substring(0,80)}`);
});
