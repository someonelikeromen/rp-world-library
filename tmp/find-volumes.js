const fs = require('fs');
const iconv = require('iconv-lite');

const buffer = fs.readFileSync('E:/新建文件夹/txt(1)/1-43.txt');
const text = iconv.decode(buffer, 'gbk');
const lines = text.split('\n');

const cnToNum = {
  '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,
  '十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,'十七':17,'十八':18,'十九':19,'二十':20,
  '二十一':21,'二十二':22,'二十三':23,'二十四':24,'二十五':25,'二十六':26,'二十七':27,'二十八':28
};

const markers = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const m1 = line.match(/^第(\d+)卷/);
  const m2 = line.match(/^第([一二三四五六七八九十百千]+)卷/);
  if (m1) markers.push({line:i, vol:parseInt(m1[1])});
  else if (m2) { const v = cnToNum[m2[1]]; if(v) markers.push({line:i, vol:v}); }
}
console.log(JSON.stringify(markers));
