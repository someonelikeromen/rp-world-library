const fs = require('fs');
const path = require('path');

const inputPath = 'E:/新建文件夹/txt(1)/1-43.txt';
const outputDir = 'E:/pi-st/campaigns/world-library/manual-curation/hidan-p0';

try {
  const buffer = fs.readFileSync(inputPath);
  console.log('File size:', buffer.length, 'bytes');
  
  let text = null;
  try {
    const iconv = require('iconv-lite');
    text = iconv.decode(buffer, 'gbk');
    console.log('Decoded as GBK with iconv-lite');
  } catch(e) {
    try {
      const decoder = new TextDecoder('gbk');
      text = decoder.decode(buffer);
      console.log('Decoded with native TextDecoder GBK');
    } catch(e2) {
      console.log('Native decoder failed:', e2.message);
      text = buffer.toString('utf8');
    }
  }
  
  const lines = text.split('\n');
  console.log('Total lines:', lines.length);
  
  // Chinese numeral mapping
  const cnToNum = {
    '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,
    '十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,'十七':17,'十八':18,'十九':19,'二十':20,
    '二十一':21,'二十二':22,'二十三':23,'二十四':24,'二十五':25,'二十六':26,'二十七':27,'二十八':28,'二十九':29,'三十':30,
    '三十一':31,'三十二':32,'三十三':33,'三十四':34,'三十五':35,'三十六':36,'三十七':37,'三十八':38,'三十九':39,'四十':40,
    '四十一':41,'四十二':42,'四十三':43
  };
  
  // Find all volume markers
  const volumeMarkers = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match1 = line.match(/^第(\d+)卷/);
    const match2 = line.match(/^第([一二三四五六七八九十百千]+)卷/);
    
    if (match1) {
      const volNum = parseInt(match1[1]);
      volumeMarkers.push({ line: i, vol: volNum, text: line });
      console.log(`Line ${i+1}: Vol ${volNum} - ${line.substring(0, 100)}`);
    } else if (match2) {
      const cnNum = match2[1];
      const volNum = cnToNum[cnNum] || 0;
      if (volNum > 0) {
        volumeMarkers.push({ line: i, vol: volNum, text: line });
        console.log(`Line ${i+1}: Vol ${volNum} (CN) - ${line.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`\nFound ${volumeMarkers.length} volume markers`);
  
  // Extract volumes 27 and 28
  for (const targetVol of [27, 28]) {
    const marker = volumeMarkers.find(m => m.vol === targetVol);
    if (!marker) {
      console.log(`\nVolume ${targetVol} not found!`);
      continue;
    }
    
    const nextMarker = volumeMarkers.find(m => m.vol === targetVol + 1);
    const endLine = nextMarker ? nextMarker.line : lines.length;
    
    const volLines = lines.slice(marker.line, endLine);
    const volText = volLines.join('\n');
    
    const outputPath = path.join(outputDir, `vol-${String(targetVol).padStart(2, '0')}-raw.txt`);
    fs.writeFileSync(outputPath, volText, 'utf8');
    console.log(`\nVolume ${targetVol} extracted: ${volLines.length} lines, written to ${outputPath}`);
    console.log(`First 3 lines:`);
    for (let j = 0; j < Math.min(3, volLines.length); j++) {
      console.log(`  ${volLines[j].trim().substring(0, 120)}`);
    }
    console.log(`Last line: ${volLines[volLines.length-1]?.trim().substring(0, 100)}`);
  }
  
} catch(e) {
  console.error('Error:', e.message);
}
