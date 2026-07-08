#!/usr/bin/env node
// fix-inner-quotes-v2.cjs — stronger JSON inner quote repair
const fs = require('fs');

const dirs = process.argv.slice(2);
let fixed = 0, failed = 0;

function isChinese(c) {
  return c && /[\u4e00-\u9fff\u3000-\u303f\u3002\uff0c\u3001\uff1b\uff1a\u2018\u2019\u201c\u201d]/.test(c);
}

function fixFile(fp) {
  let raw = fs.readFileSync(fp, 'utf-8');
  try { JSON.parse(raw); return; } catch (e) {}

  let result = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const prev = raw[i - 1] || '';
    const next = raw[i + 1] || '';

    if (c === '"' && prev !== '\\') {
      // Check if this is a structural quote or an inner quote
      const prevIsEscaped = raw.substring(Math.max(0, i - 2), i) === '\\\\';
      if (prevIsEscaped) { result += c; continue; }

      const prevIsChinese = isChinese(prev);
      const nextIsChinese = isChinese(next);
      const nextIsPunct = /[，。、；：！？）\]】」』]/.test(next);
      const prevIsJunction = /[:,\[\]{}]/.test(prev);
      const nextIsJunction = /[:,\[\]{}]/.test(next);

      // Inner quote: Chinese char on both sides, or Chinese before + Chinese punct after
      if ((prevIsChinese && (nextIsChinese || nextIsPunct)) ||
          (isChinese(raw[i - 2] || '') && prevIsChinese && nextIsJunction)) {
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
  } catch (e) {
    failed++;
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
console.log(`Fixed inner quotes: ${fixed}, Unfixable: ${failed}`);
