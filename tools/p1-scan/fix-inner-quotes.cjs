#!/usr/bin/env node
// fix-inner-quotes.cjs - 修复 JSON 中未转义的中文嵌套引号
const fs = require('fs');

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error('Usage: node fix-inner-quotes.cjs <dir1> <dir2> ...');
  process.exit(1);
}

let fixed_count = 0, fail_count = 0;

function fixFile(fp) {
  let raw = fs.readFileSync(fp, 'utf-8');
  try { JSON.parse(raw); return; } catch(e) {}

  let result = '';
  let inString = false;
  let prevChar = '';

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const nextChar = raw[i + 1] || '';

    if (c === '"' && inString && prevChar !== '\\') {
      const prevIsChinese = /[\u4e00-\u9fff\u3000-\u303f]/.test(prevChar);
      const nextIsChinese = /[\u4e00-\u9fff\u3000-\u303f\u3002\uff0c\u3001\uff1b]/.test(nextChar);

      if (prevIsChinese || nextIsChinese) {
        result += '\\"';
        fixed_count++;
        prevChar = c;
        continue;
      }
    }

    if (c === '"' && !inString && prevChar !== '\\') {
      inString = true;
    } else if (c === '"' && inString && prevChar !== '\\') {
      inString = false;
    }

    result += c;
    prevChar = c;
  }

  try {
    JSON.parse(result);
    fs.writeFileSync(fp, result);
  } catch (e) {
    fail_count++;
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.json')) fixFile(p);
  }
}

for (const d of dirs) walk(d);
console.log(`Fixed inner quotes: ${fixed_count}, Unfixable: ${fail_count}`);
