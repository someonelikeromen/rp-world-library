const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Check if iconv-lite is available, if not, try a simpler approach
let hasIconv = false;
try {
  require.resolve('iconv-lite');
  hasIconv = true;
} catch(e) {
  hasIconv = false;
}

const inputPath = 'E:/新建文件夹/txt(1)/1-43.txt';
const outputDir = 'E:/pi-st/campaigns/world-library/manual-curation/hidan-phase0-output';

// Try to detect encoding
try {
  const buffer = fs.readFileSync(inputPath);
  console.log('File size:', buffer.length, 'bytes');
  
  // Try GBK (Chinese encoding)
  if (hasIconv) {
    const iconv = require('iconv-lite');
    const text = iconv.decode(buffer, 'gbk');
    fs.writeFileSync(path.join(outputDir, '1-43-utf8.txt'), text, 'utf8');
    console.log('Decoded as GBK successfully');
    
    // Find volume markers
    const lines = text.split('\n');
    let inVolume = false;
    let currentVol = 0;
    let volSections = {};
    let currentLines = [];
    
    const volPattern = /第(\d+)卷/;
    const volPattern2 = /XX卷/;
    const volPattern3 = /([\u4e00-\u9fff]+)卷/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match various volume patterns
      const match = line.match(volPattern);
      const match2 = line.match(/^第[一二三四五六七八九十百千\d]+卷/);
      
      if (match) {
        const volNum = parseInt(match[1]);
        if (currentVol > 0 && currentLines.length > 0) {
          volSections[currentVol] = { startLine: i - currentLines.length, lines: [...currentLines] };
        }
        currentVol = volNum;
        currentLines = [line];
        console.log(`Found Vol ${currentVol} at line ${i+1}: ${line.trim().substring(0, 80)}`);
      } else if (match2) {
        if (currentVol > 0 && currentLines.length > 0) {
          volSections[currentVol] = { startLine: i - currentLines.length, lines: [...currentLines] };
        }
        // Try to extract number from Chinese numerals
        const cnNum = match2[0].replace('第', '').replace('卷', '');
        const cnToNum = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,
                         '十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,'十七':17,'十八':18,'十九':19,'二十':20,
                         '二十一':21,'二十二':22,'二十三':23,'二十四':24,'二十五':25,'二十六':26,'二十七':27,'二十八':28,'二十九':29,'三十':30,
                         '三十一':31,'三十二':32,'三十三':33,'三十四':34,'三十五':35,'三十六':36,'三十七':37,'三十八':38,'三十九':39,'四十':40,
                         '四十一':41,'四十二':42,'四十三':43};
        currentVol = cnToNum[cnNum] || 0;
        currentLines = [line];
        if (currentVol > 0) {
          console.log(`Found Vol ${currentVol} at line ${i+1}: ${line.trim().substring(0, 80)}`);
        }
      } else if (currentVol > 0) {
        currentLines.push(line);
      }
    }
    
    // Don't forget the last volume
    if (currentVol > 0 && currentLines.length > 0) {
      volSections[currentVol] = { startLine: lines.length - currentLines.length, lines: [...currentLines] };
    }
    
    console.log(`\nFound ${Object.keys(volSections).length} volumes`);
    for (const [vol, data] of Object.entries(volSections)) {
      console.log(`Vol ${vol}: ${data.lines[0]?.trim()?.substring(0, 100)} (${data.lines.length} lines, starts at line ${data.startLine+1})`);
    }
    
  } else {
    console.log('iconv-lite not available, trying alternative decoding');
    // Try to decode first 1000 bytes manually
    const firstBytes = buffer.slice(0, 1000);
    console.log('First 100 bytes hex:', firstBytes.toString('hex').substring(0, 200));
  }
} catch(e) {
  console.error('Error:', e.message);
}
