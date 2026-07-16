#!/usr/bin/env node
// prepare-campione-split.cjs — 从 raw-text 生成 split-text 格式
// 对每卷：串联章节文件 → full.txt + chapters.json
const fs = require('fs');
const path = require('path');

const BASE = 'campaigns/world-library/worlds/campione/sources';
const RAW = BASE + '/raw-text';
const SPLIT = BASE + '/split-text';

function prepareVolume(series, vol) {
  const volDir = `${RAW}/${series}/${vol}`;
  const manifestPath = `${volDir}/_manifest.json`;
  if (!fs.existsSync(manifestPath)) {
    console.log(`  SKIP ${series}/${vol}: no _manifest.json`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const chapters = manifest.filter(e => e.ok && e.file).sort((a, b) => a.idx - b.idx);

  // Build chapters.json
  let currentLine = 1;
  const chapterEntries = [];

  // First pass: read all files to build line mapping
  for (const ch of chapters) {
    const content = fs.readFileSync(`${volDir}/${ch.file}`, 'utf-8');
    const lines = content.split('\n');
    const lineCount = lines.length;
    chapterEntries.push({
      startLine: currentLine,
      endLine: currentLine + lineCount - 1,
      title: ch.title,
      chapterIndex: ch.idx,
      outputPath: `chapters/ch-${String(ch.idx).padStart(3, '0')}-${ch.title}.txt`,
      chars: ch.chars
    });
    currentLine += lineCount;
  }

  // Write split-text structure
  const outDir = `${SPLIT}/${series}/${vol}`;
  const chaptersDir = `${outDir}/chapters`;
  fs.mkdirSync(chaptersDir, { recursive: true });

  // Write chapters.json
  fs.writeFileSync(`${outDir}/chapters.json`, JSON.stringify(chapterEntries, null, 2), 'utf-8');

  // Write chapter files + concatenate full.txt
  const fullParts = [];
  for (const ch of chapters) {
    const content = fs.readFileSync(`${volDir}/${ch.file}`, 'utf-8');
    const chFilename = `ch-${String(ch.idx).padStart(3, '0')}-${ch.title}.txt`;
    fs.writeFileSync(`${chaptersDir}/${chFilename}`, content, 'utf-8');
    fullParts.push(content);
  }

  // Write full.txt
  fs.writeFileSync(`${outDir}/full.txt`, fullParts.join(''), 'utf-8');

  const totalLines = currentLine - 1;
  console.log(`  ${series}/${vol}: ${chapters.length} chapters → ${totalLines} lines, ${chapters[0].startLine}-${chapterEntries[chapterEntries.length-1].endLine}`);
}

const series = ['campione-main', 'campione-shiniki'];
for (const s of series) {
  console.log(`\n【${s}】`);
  const vols = fs.readdirSync(`${RAW}/${s}`).filter(v => v.startsWith('vol-')).sort();
  for (const v of vols) {
    prepareVolume(s, v);
  }
}

console.log('\nDone.');
