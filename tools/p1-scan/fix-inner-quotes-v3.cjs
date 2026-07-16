#!/usr/bin/env node
// fix-inner-quotes-v3.cjs — simple inner quote fix
const fs = require('fs');

function isChinese(c) {
  return c && /[\u4e00-\u9fff\u3000-\u303f]/.test(c);
}
function isChinesePunct(c) {
  return c && /[\u3002\uff0c\u3001\uff1b\uff1a]/.test(c);
}

function fixFile(fp) {
  let raw = fs.readFileSync(fp, 'utf-8');
  try { JSON.parse(raw); return 'ok'; } catch (e) {}

  let result = '';
  let fixed = 0;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const prev = raw[i - 1] || '';
    const next = raw[i + 1] || '';

    if (c === '"' && prev !== '\\') {
      const prevC = isChinese(prev);
      const nextC = isChinese(next) || isChinesePunct(next);
      if (prevC && nextC) {
        result += '\\"';
        fixed++;
        continue;
      }
    }
    result += c;
  }

  try {
    JSON.parse(result);
    fs.writeFileSync(fp, result);
    return 'fixed:' + fixed;
  } catch (e) {
    return 'fail:' + e.message.substring(0, 60);
  }
}

function walk(dir, results) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p, results);
    else if (e.name.endsWith('.json')) {
      const r = fixFile(p);
      if (r !== 'ok') results.push({ file: p.substring(dir.length - 30), result: r });
    }
  }
}

const dirs = process.argv.slice(2);
let results = [];
for (const d of dirs) walk(d, results);
let fixed = results.filter(r => r.result.startsWith('fixed')).length;
let failed = results.filter(r => r.result.startsWith('fail')).length;
console.log(`Fixed: ${fixed}, Failed: ${failed}`);
results.filter(r => r.result.startsWith('fail')).forEach(r => console.log('  FAIL:', r.file, r.result));
