const fs = require('fs');
const path = require('path');

const inputPath = 'E:/新建文件夹/txt(1)/1-43.txt';
const outputDir = 'E:/pi-st/campaigns/world-library/manual-curation/hidan-phase0-output';

// Try to detect and convert encoding
try {
  const buffer = fs.readFileSync(inputPath);
  console.log('File size:', buffer.length, 'bytes');
  
  // Try iconv-lite
  let text = null;
  try {
    const iconv = require('iconv-lite');
    text = iconv.decode(buffer, 'gbk');
    console.log('Decoded as GBK');
  } catch(e) {
    console.log('iconv-lite not available, trying native TextDecoder');
    try {
      const decoder = new TextDecoder('gbk');
      text = decoder.decode(buffer);
      console.log('Decoded with native TextDecoder GBK');
    } catch(e2) {
      console.log('Native decoder failed:', e2.message);
      // Try as UTF-8 first
      text = buffer.toString('utf8');
      console.log('Using UTF-8');
    }
  }
  
  if (!text) {
    console.error('Failed to decode');
    process.exit(1);
  }
  
  // Write full decoded text
  fs.writeFileSync(path.join(outputDir, '1-43-utf8.txt'), text, 'utf8');
  console.log('Written decoded file');
  
  // Find volume markers
  const lines = text.split('\n');
  console.log('Total lines:', lines.length);
  
  // Look for volume headers
  const volHeaders = [];
  for (let i = 0; i < Math.min(lines.length, 500); i++) {
    if (lines[i].includes('卷') || lines[i].includes('弹')) {
      console.log(`Line ${i+1}: ${lines[i].trim().substring(0, 120)}`);
    }
  }
  
} catch(e) {
  console.error('Error:', e.message);
}
