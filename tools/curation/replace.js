#!/usr/bin/env node
// replace.js — 精确行级/模式级文件替换工具
// 
// 用法:
//   node tools/curation/replace.js lines <file> <from-line> <to-line> [<replacement-file>]
//   node tools/curation/replace.js match <file> "<pattern>" "<replacement>"  
//   node tools/curation/replace.js insert <file> <after-line> "<content>"
//   node tools/curation/replace.js delete <file> <from-line> <to-line>
//
// 行号从 1 开始。replacement 从 stdin 读取（如果没有传 replacement-file）。

const fs = require('fs');

const cmd = process.argv[2];
if (!cmd) {
  console.log(`Usage:
  node replace.js lines   <file> <from> <to> [<replacement-file>]  — replace lines
  node replace.js match   <file> "<pattern>" "<replacement>"       — regex replace
  node replace.js insert  <file> <after-line> "<content>"          — insert after line
  node replace.js delete  <file> <from> <to>                       — delete lines`);
  process.exit(1);
}

const file = process.argv[3];
if (!file || !fs.existsSync(file)) { console.error('File not found: ' + file); process.exit(1); }
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

function writeOutput(newContent) {
  fs.writeFileSync(file, newContent, 'utf-8');
  console.log('OK: ' + file + ' (' + newContent.length + ' chars, ' + newContent.split('\n').length + ' lines)');
}

if (cmd === 'lines') {
  const from = parseInt(process.argv[4]) - 1; // 0-indexed
  const to = parseInt(process.argv[5]);       // exclusive (line number, 1-indexed)
  if (isNaN(from) || isNaN(to)) { console.error('Invalid line numbers'); process.exit(1); }
  
  let replacement;
  const replFile = process.argv[6];
  if (replFile && fs.existsSync(replFile)) {
    replacement = fs.readFileSync(replFile, 'utf-8');
  } else {
    // Read from stdin
    const chunks = [];
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => {
      replacement = chunks.join('');
      const before = lines.slice(0, from);
      const after = lines.slice(to);
      writeOutput([...before, replacement, ...after].join('\n'));
    });
    return;
  }
  
  const before = lines.slice(0, from);
  const after = lines.slice(to);
  const replLines = replacement.split('\n');
  writeOutput([...before, ...replLines, ...after].join('\n'));
}

else if (cmd === 'match') {
  const pattern = process.argv[4];
  const replacement = process.argv[5];
  if (!pattern) { console.error('No pattern'); process.exit(1); }
  
  const regex = new RegExp(pattern, 'g');
  const count = (content.match(regex) || []).length;
  const newContent = content.replace(regex, replacement || '');
  writeOutput(newContent);
  console.log('  ' + count + ' replacements');
}

else if (cmd === 'insert') {
  const afterLine = parseInt(process.argv[4]) - 1;
  const text = process.argv[5];
  if (isNaN(afterLine) || !text) { console.error('Invalid args'); process.exit(1); }
  
  const before = lines.slice(0, afterLine + 1);
  const after = lines.slice(afterLine + 1);
  writeOutput([...before, text, ...after].join('\n'));
}

else if (cmd === 'delete') {
  const from = parseInt(process.argv[4]) - 1;
  const to = parseInt(process.argv[5]);
  if (isNaN(from) || isNaN(to)) { console.error('Invalid line numbers'); process.exit(1); }
  
  const before = lines.slice(0, from);
  const after = lines.slice(to);
  writeOutput([...before, ...after].join('\n'));
  console.log('  deleted lines ' + (from+1) + '-' + to);
}

else {
  console.error('Unknown command: ' + cmd);
  process.exit(1);
}
