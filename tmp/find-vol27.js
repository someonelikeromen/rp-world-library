const fs = require('fs');
const iconv = require('iconv-lite');

const buffer = fs.readFileSync('E:/新建文件夹/txt(1)/1-43.txt');
const text = iconv.decode(buffer, 'gbk');
const lines = text.split('\n');

// Search for volume markers around where vol-27 should be
let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes('卷') && (line.includes('二十') || line.includes('27') || line.includes('27卷'))) {
    console.log(`Line ${i+1}: ${line.substring(0,120)}`);
    count++;
    if (count > 20) break;
  }
}
if (count === 0) {
  // Broader search
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^第[^卷]*卷/)) {
      console.log(`Line ${i+1}: ${line.substring(0,120)}`);
      count++;
      if (count > 50) break;
    }
  }
}
