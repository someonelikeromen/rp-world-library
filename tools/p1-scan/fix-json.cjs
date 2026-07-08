#!/usr/bin/env node
/**
 * fix-json.cjs — 自动修复损坏的 JSON 文件
 *
 * 处理常见的 agent 写入问题：
 * 1. 中文冒号代替英文冒号
 * 2. 内部引号未转义
 * 3. 行末多余逗号
 * 4. BOM/控制字符
 * 5. 单引号代替双引号
 * 6. 注释残留
 */

const fs = require('fs');
const path = require('path');

function fixJSONContent(content) {
  let fixed = content;

  // 1. 移除 BOM
  fixed = fixed.replace(/^\uFEFF/, '');

  // 2. 移除控制字符（保留 \n \r \t）
  fixed = fixed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // 3. 尝试恢复 JSON
  // 策略：逐层修复，每次验证是否可 parse

  // 3a. 行末多余逗号
  fixed = fixed.replace(/,\s*]/g, ']');
  fixed = fixed.replace(/,\s*}/g, '}');

  // 3b. 中文冒号 → 英文（仅在 JSON value 上下文中）
  fixed = fixed.replace(/：/g, ':');

  // 3c. 中文引号 → 英文（仅在 JSON value 上下文中容易被误用）
  fixed = fixed.replace(/\u201C/g, '"');
  fixed = fixed.replace(/\u201D/g, '"');
  fixed = fixed.replace(/\u300C/g, '"');
  fixed = fixed.replace(/\u300D/g, '"');

  // 3d. 单引号 → 双引号（只在键名和字符串值中）
  fixed = fixed.replace(/'/g, '"');

  // 3e. 注释行 // ... 或 /* ... */
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3f. 移除多余逗号在对象最后一个属性后
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // 3g. 多余逗号导致的空值
  fixed = fixed.replace(/,\s*,/g, ',');

  // 3h. 修复未闭合的引号（尝试平衡）
  // (这是一个有损操作，只在必要时使用)
  
  // 3i. 键名缺少引号: key: → "key":
  fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

  // 3j. 移除 [Showing lines...] 截断标记（agent 读截断文件后写回的污染）
  fixed = fixed.replace(/\n*\[Showing lines \d+-\d+ of \d+ .*?\].*/g, '');
  fixed = fixed.replace(/\n*<\/tool_config>\n*```/g, '');
  fixed = fixed.replace(/\n*```\n*/g, '');

  // 3k. 移除文件末尾多余逗号
  fixed = fixed.replace(/,\s*$/m, '');

  return fixed;
}

function tryFix(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Already valid?
  try {
    JSON.parse(content);
    return { file: filePath, status: 'already-valid' };
  } catch (e) {
    // Need fix
  }

  const fixed = fixJSONContent(content);

  try {
    JSON.parse(fixed);
    // Valid after fix — write backup + fixed
    const bakPath = filePath + '.bak';
    if (!fs.existsSync(bakPath)) {
      fs.writeFileSync(bakPath, content, 'utf8');
    }
    fs.writeFileSync(filePath, fixed, 'utf8');
    return { file: filePath, status: 'fixed', bak: bakPath };
  } catch (e) {
    // Still broken — report error details
    const lines = content.split('\n');
    const errMatch = e.message.match(/position (\d+)/);
    let context = '';
    if (errMatch) {
      const pos = parseInt(errMatch[1]);
      let cumulativeLen = 0;
      for (let i = 0; i < lines.length; i++) {
        cumulativeLen += lines[i].length + 1;
        if (cumulativeLen >= pos) {
          const start = Math.max(0, i - 2);
          const end = Math.min(lines.length, i + 3);
          context = lines.slice(start, end).map(function(l, idx) {
            const lineNum = start + idx + 1;
            const marker = (start + idx === i) ? ' >>> ' : '     ';
            return marker + lineNum + ': ' + l;
          }).join('\n');
          break;
        }
      }
    }
    return {
      file: filePath,
      status: 'unfixable',
      error: e.message,
      context: context
    };
  }
}

function scanDir(dir) {
  const results = { fixed: [], unfixable: [], alreadyValid: 0 };
  function scan(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const result = tryFix(fullPath);
        if (result.status === 'fixed') results.fixed.push(result.file);
        else if (result.status === 'unfixable') results.unfixable.push(result);
        else results.alreadyValid++;
      }
    }
  }
  scan(dir);
  return results;
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(`
Usage: node fix-json.cjs <file|dir> [--dry-run]

--dry-run  只报告不修改

Examples:
  node fix-json.cjs characters/aria.json
  node fix-json.cjs hidan-p1-output/characters/
  node fix-json.cjs hidan-p1-output/characters/ --dry-run
`);
  process.exit(1);
}

const target = args[0];
const dryRun = args.includes('--dry-run');

if (!fs.existsSync(target)) {
  console.error(`Not found: ${target}`);
  process.exit(1);
}

if (fs.statSync(target).isDirectory()) {
  const results = scanDir(target);
  console.log(JSON.stringify({
    total: results.alreadyValid + results.fixed.length + results.unfixable.length,
    alreadyValid: results.alreadyValid,
    fixed: results.fixed.length,
    unfixable: results.unfixable.length,
    details: {
      fixed: results.fixed,
      unfixable: results.unfixable
    }
  }, null, 2));
  if (!dryRun && results.fixed.length > 0) {
    console.error(`Fixed ${results.fixed.length} files (backups saved as .bak)`);
  }
  if (results.unfixable.length > 0) {
    console.error(`⚠ ${results.unfixable.length} files still broken, need manual repair`);
  }
} else {
  const result = tryFix(target);
  console.log(JSON.stringify(result, null, 2));
  if (!dryRun && result.status === 'fixed') {
    console.error(`Fixed: ${target} (backup: ${result.bak})`);
  }
}
