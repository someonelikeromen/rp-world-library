// Minimal script to find and output volumes 15 and 16 from the GBK file
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const inputPath = 'E:/新建文件夹/txt(1)/1-43.txt';
const buf = fs.readFileSync(inputPath);
const text = iconv.decode(buf, 'gbk');
const lines = text.split('\n');

const cnMap = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,'十七':17,'十八':18,'十九':19,'二十':20,'二十一':21,'二十二':22,'二十三':23,'二十四':24,'二十五':25,'二十六':26,'二十七':27,'二十八':28,'二十九':29,'三十':30,'三十一':31,'三十二':32,'三十三':33,'三十四':34,'三十五':35,'三十六':36,'三十七':37,'三十八':38,'三十九':39,'四十':40,'四十一':41,'四十二':42,'四十三':43};

const markers = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  const m1 = l.match(/^第(\d+)卷/);
  const m2 = l.match(/^第([一二三四五六七八九十百千]+)卷/);
  if (m1) markers.push({l:i, v:parseInt(m1[1])});
  else if (m2) { const n=cnMap[m2[1]]; if(n) markers.push({l:i, v:n}); }
}

for (const v of [15,16]) {
  const mk = markers.find(m => m.v === v);
  const nxt = markers.find(m => m.v === v + 1);
  if (!mk) { console.log(`Vol ${v} NOT FOUND`); continue; }
  const end = nxt ? nxt.l : lines.length;
  const volText = lines.slice(mk.l, end).join('\n');
  const outPath = `E:\\pi-st\\campaigns\\world-library\\manual-curation\\hidan-p0\\full-v${v}.txt`;
  fs.writeFileSync(outPath, volText, 'utf8');
  console.log(`Vol ${v}: lines ${mk.l+1}-${end}, written to ${outPath}`);
  console.log(`First line: ${lines[mk.l].trim().substring(0,80)}`);
}
console.log('DONE');
