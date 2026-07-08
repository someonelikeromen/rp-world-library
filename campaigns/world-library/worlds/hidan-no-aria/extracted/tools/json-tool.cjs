#!/usr/bin/env node
/**
 * json-tool.cjs — 结构化 JSON 编辑工具（供子 agent 调用）
 *
 * 用途：子 agent 通过 bash 调用此工具执行 JSON 读写操作，
 *       避免手写 JSON 字符串导致的转义错误和格式损坏。
 *
 * 使用方式：
 *   node tools/p1-scan/json-tool.cjs <command> [args...]
 *
 * 所有 JSON 输入必须用文件引用（@path）或标准输入（-），
 * 避免命令行引号转义问题。
 *
 * 路径语法（类 json_struct_read/edit）：
 *   periods                    → 对象键
 *   periods[0]                 → 数组下标
 *   periods[id=vol-06]         → 按字段值匹配数组项（id selector）
 *   periods[0].abilities_owned → 链式
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// 路径解析
// ─────────────────────────────────────────────

/**
 * 解析路径字符串为段数组
 * "periods[id=vol-06].abilities_owned" → ["periods", {id:"vol-06"}, "abilities_owned"]
 */
function parsePath(p) {
  if (!p || p === '') return [];
  const segments = [];
  // 以 . 分割，但保留 [id=...] 内的点
  const parts = p.match(/[^.\[\]]+|\[[^\]]+\]/g) || [];
  for (const part of parts) {
    if (part.startsWith('[') && part.endsWith(']')) {
      const inner = part.slice(1, -1);
      // id selector: id=vol-06
      const idMatch = inner.match(/^(\w+)=(.+)$/);
      if (idMatch) {
        segments.push({ [idMatch[1]]: unquote(idMatch[2]) });
        continue;
      }
      // numeric index
      const num = Number(inner);
      if (!isNaN(num)) {
        segments.push(num);
        continue;
      }
      // fallback: treat as string key
      segments.push(inner);
    } else {
      segments.push(part);
    }
  }
  return segments;
}

function unquote(s) {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * 按路径获取值
 */
function getValue(obj, segments) {
  let current = obj;
  for (const seg of segments) {
    if (current === undefined || current === null) return undefined;
    if (typeof seg === 'string') {
      current = current[seg];
    } else if (typeof seg === 'number') {
      current = current[seg];
    } else if (typeof seg === 'object' && seg !== null) {
      // id selector: 在数组中查找匹配项
      if (!Array.isArray(current)) return undefined;
      const key = Object.keys(seg)[0];
      const val = seg[key];
      current = current.find(item => item && item[key] === val);
    }
  }
  return current;
}

/**
 * 按路径设置值（创建中间对象/数组）
 */
function setValue(obj, segments, value) {
  if (segments.length === 0) return value;
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    if (typeof seg === 'string') {
      if (!(seg in current)) {
        current[seg] = typeof nextSeg === 'number' ? [] : {};
      }
      current = current[seg];
    } else if (typeof seg === 'number') {
      if (!current[seg]) {
        current[seg] = typeof nextSeg === 'number' ? [] : {};
      }
      current = current[seg];
    } else if (typeof seg === 'object' && seg !== null) {
      // id selector: find or create
      const key = Object.keys(seg)[0];
      const val = seg[key];
      let found = current.find(item => item && item[key] === val);
      if (!found) {
        found = {};
        found[key] = val;
        current.push(found);
      }
      current = found;
    }
  }
  const lastSeg = segments[segments.length - 1];
  if (typeof lastSeg === 'string') {
    current[lastSeg] = value;
  } else if (typeof lastSeg === 'number') {
    current[lastSeg] = value;
  } else if (typeof lastSeg === 'object' && lastSeg !== null) {
    const key = Object.keys(lastSeg)[0];
    const val = lastSeg[key];
    let found = current.find(item => item && item[key] === val);
    if (!found) {
      found = {};
      found[key] = val;
      current.push(found);
    }
    Object.assign(found, value);
  }
  return obj;
}

/**
 * 按路径删除
 */
function removeValue(obj, segments) {
  if (segments.length === 0) return undefined;
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (typeof seg === 'string') {
      if (!(seg in current)) return obj;
      current = current[seg];
    } else if (typeof seg === 'number') {
      if (!current[seg]) return obj;
      current = current[seg];
    } else if (typeof seg === 'object' && seg !== null) {
      const key = Object.keys(seg)[0];
      const val = seg[key];
      const idx = current.findIndex(item => item && item[key] === val);
      if (idx === -1) return obj;
      current = current[idx];
    }
  }
  const lastSeg = segments[segments.length - 1];
  if (typeof lastSeg === 'string') {
    delete current[lastSeg];
  } else if (typeof lastSeg === 'number') {
    current.splice(lastSeg, 1);
  } else if (typeof lastSeg === 'object' && lastSeg !== null) {
    const key = Object.keys(lastSeg)[0];
    const val = lastSeg[key];
    const idx = current.findIndex(item => item && item[key] === val);
    if (idx !== -1) current.splice(idx, 1);
  }
  return obj;
}

/**
 * 深度合并 source 到 target
 */
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// ─────────────────────────────────────────────
// JSON 输入解析
// ─────────────────────────────────────────────

function parseJSONInput(input) {
  if (!input || input === '') throw new Error('Empty JSON input');
  // 文件引用
  if (input.startsWith('@')) {
    const filePath = input.slice(1);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  // 标准输入
  if (input === '-') {
    const stdin = fs.readFileSync(0, 'utf8');
    return JSON.parse(stdin);
  }
  // 直接 JSON（小心使用）
  return JSON.parse(input);
}

// ─────────────────────────────────────────────
// 文件读写
// ─────────────────────────────────────────────

function readJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function validateJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    JSON.parse(content);
    return { valid: true, file: filePath };
  } catch (e) {
    return { valid: false, file: filePath, error: e.message };
  }
}

// ─────────────────────────────────────────────
// 命令实现
// ─────────────────────────────────────────────

const commands = {};

/**
 * read <file> [path]
 * 读取 JSON 文件，可选路径提取
 */
commands.read = function(args) {
  if (args.length < 1) die('Usage: json-tool read <file> [path]');
  const filePath = args[0];
  const jsonPath = args[1] || '';
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  if (segments.length === 0) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    const value = getValue(data, segments);
    if (value === undefined) {
      process.stdout.write('null\n');
    } else {
      process.stdout.write(JSON.stringify(value, null, 2) + '\n');
    }
  }
};

/**
 * create <file> <json>
 * 创建新 JSON 文件（验证 JSON 合法性）
 */
commands.create = function(args) {
  if (args.length < 2) die('Usage: json-tool create <file> <json|@template>');
  const filePath = args[0];
  const value = parseJSONInput(args[1]);
  writeJSON(filePath, value);
  process.stdout.write(JSON.stringify({ ok: true, file: filePath }) + '\n');
};

/**
 * append <file> <path> <json>
 * 追加到数组末尾
 */
commands.append = function(args) {
  if (args.length < 3) die('Usage: json-tool append <file> <path> <json>');
  const filePath = args[0];
  const jsonPath = args[1];
  const value = parseJSONInput(args[2]);
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  if (segments.length === 0) die('Path required for append');
  const arr = getValue(data, segments);
  if (!Array.isArray(arr)) die(`Not an array: ${jsonPath}`);
  arr.push(value);
  writeJSON(filePath, data);
  process.stdout.write(JSON.stringify({ ok: true, file: filePath, path: jsonPath, newLength: arr.length }) + '\n');
};

/**
 * prepend <file> <path> <json>
 * 插入到数组开头
 */
commands.prepend = function(args) {
  if (args.length < 3) die('Usage: json-tool prepend <file> <path> <json>');
  const filePath = args[0];
  const jsonPath = args[1];
  const value = parseJSONInput(args[2]);
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  const arr = getValue(data, segments);
  if (!Array.isArray(arr)) die(`Not an array: ${jsonPath}`);
  arr.unshift(value);
  writeJSON(filePath, data);
  process.stdout.write(JSON.stringify({ ok: true, file: filePath, path: jsonPath, newLength: arr.length }) + '\n');
};

/**
 * set <file> <path> <json>
 * 设置字段值
 */
commands.set = function(args) {
  if (args.length < 3) die('Usage: json-tool set <file> <path> <json>');
  const filePath = args[0];
  const jsonPath = args[1];
  const value = parseJSONInput(args[2]);
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  setValue(data, segments, value);
  writeJSON(filePath, data);
  process.stdout.write(JSON.stringify({ ok: true, file: filePath, path: jsonPath }) + '\n');
};

/**
 * merge <file> <path> <json>
 * 深度合并到对象
 */
commands.merge = function(args) {
  if (args.length < 3) die('Usage: json-tool merge <file> <path> <json>');
  const filePath = args[0];
  const jsonPath = args[1];
  const value = parseJSONInput(args[2]);
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  const target = getValue(data, segments);
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    die(`Not a mergeable object at: ${jsonPath}`);
  }
  deepMerge(target, value);
  writeJSON(filePath, data);
  process.stdout.write(JSON.stringify({ ok: true, file: filePath, path: jsonPath }) + '\n');
};

/**
 * remove <file> <path>
 * 删除字段或数组项
 */
commands.remove = function(args) {
  if (args.length < 2) die('Usage: json-tool remove <file> <path>');
  const filePath = args[0];
  const jsonPath = args[1];
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  removeValue(data, segments);
  writeJSON(filePath, data);
  process.stdout.write(JSON.stringify({ ok: true, file: filePath, path: jsonPath, action: 'removed' }) + '\n');
};

/**
 * batch <file> <ops>
 * 批量原子操作。ops 是 JSON 数组，每项 { action, path, value }
 */
commands.batch = function(args) {
  if (args.length < 2) die('Usage: json-tool batch <file> <ops>');
  const filePath = args[0];
  const ops = parseJSONInput(args[1]);
  const data = readJSON(filePath);
  for (const op of ops) {
    const segments = parsePath(op.path);
    switch (op.action) {
      case 'append': {
        const arr = getValue(data, segments);
        if (!Array.isArray(arr)) die(`Not an array: ${op.path}`);
        arr.push(op.value);
        break;
      }
      case 'set': {
        setValue(data, segments, op.value);
        break;
      }
      case 'merge': {
        const target = getValue(data, segments);
        if (!target || typeof target !== 'object' || Array.isArray(target)) {
          die(`Not a mergeable object at: ${op.path}`);
        }
        deepMerge(target, op.value);
        break;
      }
      case 'remove': {
        removeValue(data, segments);
        break;
      }
      case 'prepend': {
        const arr2 = getValue(data, segments);
        if (!Array.isArray(arr2)) die(`Not an array: ${op.path}`);
        arr2.unshift(op.value);
        break;
      }
      default:
        die(`Unknown action: ${op.action}`);
    }
  }
  writeJSON(filePath, data);
  process.stdout.write(JSON.stringify({ ok: true, file: filePath, ops: ops.length }) + '\n');
};

/**
 * list <dir> [glob]
 * 列出目录下的 JSON 文件
 */
commands.list = function(args) {
  if (args.length < 1) die('Usage: json-tool list <dir> [pattern]');
  const dirPath = args[0];
  const pattern = args[1] || '.json';
  if (!fs.existsSync(dirPath)) {
    process.stdout.write('[]\n');
    return;
  }
  const results = [];
  function scan(dir, relative) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relative ? path.join(relative, entry.name) : entry.name;
      if (entry.isDirectory()) {
        scan(fullPath, relPath);
      } else if (entry.isFile() && relPath.endsWith(pattern)) {
        results.push(relPath);
      }
    }
  }
  scan(dirPath, '');
  process.stdout.write(JSON.stringify(results.sort()) + '\n');
};

/**
 * count <file> <path>
 * 统计数组长度
 */
commands.count = function(args) {
  if (args.length < 2) die('Usage: json-tool count <file> <path>');
  const filePath = args[0];
  const jsonPath = args[1];
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  const value = getValue(data, segments);
  if (Array.isArray(value)) {
    process.stdout.write(JSON.stringify({ count: value.length }) + '\n');
  } else {
    process.stdout.write(JSON.stringify({ count: 0, type: typeof value }) + '\n');
  }
};

/**
 * keys <file> [path]
 * 列出对象键名
 */
commands.keys = function(args) {
  if (args.length < 1) die('Usage: json-tool keys <file> [path]');
  const filePath = args[0];
  const jsonPath = args[1] || '';
  const data = readJSON(filePath);
  const segments = parsePath(jsonPath);
  const value = getValue(data, segments);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    process.stdout.write(JSON.stringify(Object.keys(value)) + '\n');
  } else {
    process.stdout.write('[]\n');
  }
};

/**
 * validate <file|dir>
 * 验证 JSON 合法性
 */
commands.validate = function(args) {
  if (args.length < 1) die('Usage: json-tool validate <file|dir>');
  const target = args[0];
  const results = [];
  if (fs.statSync(target).isDirectory()) {
    function scan(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          results.push(validateJSON(fullPath));
        }
      }
    }
    scan(target);
  } else {
    results.push(validateJSON(target));
  }
  const total = results.length;
  const valid = results.filter(r => r.valid).length;
  const errors = results.filter(r => !r.valid);
  process.stdout.write(JSON.stringify({
    total,
    valid,
    invalid: total - valid,
    errors: errors.map(e => ({ file: e.file, error: e.error }))
  }, null, 2) + '\n');
};

/**
 * copy <sourceFile> <sourcePath> <targetFile> <targetPath> <mode>
 *
 * 从一个 JSON 文件中提取值，复制到另一个 JSON 文件的指定位置。
 * 源文件不修改。
 *
 * mode:
 *   append   — 从 sourcePath 取数组/值，追加到 target[targetPath] 数组
 *   merge    — 从 sourcePath 取值，深度合并到 target[targetPath] 对象
 *   replace  — 从 sourcePath 取值，直接替换 target[targetPath]
 *
 * 用途：合并 agent 的核心操作。将 wave 合并结果逐项复制到最终文件。
 */
commands.copy = function(args) {
  if (args.length < 5) die('Usage: json-tool copy <sourceFile> <sourcePath> <targetFile> <targetPath> <append|merge|replace>');
  const srcFile = args[0];
  const srcPath = args[1] === '-' ? '' : args[1];
  const dstFile = args[2];
  const dstPath = args[3] === '-' ? '' : args[3];
  const mode = args[4];

  if (!['append', 'merge', 'replace'].includes(mode)) {
    die('mode must be append, merge, or replace');
  }

  // Read source
  const srcData = readJSON(srcFile);
  const srcSegments = parsePath(srcPath);
  let srcValue;
  if (srcSegments.length === 0) {
    srcValue = srcData;  // 取整个文件
  } else {
    srcValue = getValue(srcData, srcSegments);
    if (srcValue === undefined) {
      die('Source path not found: ' + srcPath);
    }
  }

  // Read or create target
  let dstData;
  try {
    dstData = readJSON(dstFile);
  } catch (e) {
    dstData = {};  // 目标文件不存在时创建空对象
  }
  const dstSegments = parsePath(dstPath);

  switch (mode) {
    case 'append': {
      // 获取目标数组，如果不存在则创建
      let targetArr;
      if (dstSegments.length === 0) {
        die('Path required for append mode');
      }
      // 尝试获取已存在的数组
      const parentSegments = dstSegments.slice(0, -1);
      const lastKey = dstSegments[dstSegments.length - 1];
      const parent = parentSegments.length > 0 ? getValue(dstData, parentSegments) : dstData;
      if (parent === undefined || parent === null) {
        die('Target parent path not found: ' + dstPath);
      }
      if (typeof lastKey === 'string') {
        if (!Array.isArray(parent[lastKey])) {
          parent[lastKey] = [];
        }
        targetArr = parent[lastKey];
      } else {
        die('Target path must end with a key, not array index');
      }

      // 如果 source 是数组 → 逐个 append 元素
      // 如果 source 是单个值 → append 整个值
      if (Array.isArray(srcValue)) {
        for (const item of srcValue) {
          targetArr.push(item);
        }
        break;
      }
      targetArr.push(srcValue);
      break;
    }

    case 'merge': {
      let target;
      if (dstSegments.length === 0) {
        // merge 到整个目标文件
        target = dstData;
      } else {
        target = getValue(dstData, dstSegments);
        if (target === undefined || target === null || typeof target !== 'object' || Array.isArray(target)) {
          // 如果目标路径不存在或不是对象，则创建/覆盖
          if (dstSegments.length > 0) {
            setValue(dstData, dstSegments, {});
            target = getValue(dstData, dstSegments);
          }
        }
      }
      deepMerge(target, srcValue);
      break;
    }

    case 'replace': {
      if (dstSegments.length === 0) {
        dstData = srcValue;
      } else {
        setValue(dstData, dstSegments, srcValue);
      }
      break;
    }
  }

  // 写目标文件
  writeJSON(dstFile, dstData);

  const srcInfo = srcFile + (srcPath ? ':' + srcPath : '');
  const dstInfo = dstFile + (dstPath ? ':' + dstPath : '');
  process.stdout.write(JSON.stringify({
    ok: true,
    mode: mode,
    from: srcInfo,
    to: dstInfo
  }) + '\n');
};

// ─────────────────────────────────────────────
// CLI 入口
// ─────────────────────────────────────────────

function die(msg) {
  process.stderr.write('Error: ' + msg + '\n');
  process.exit(1);
}

function showHelp() {
  const help = `
json-tool.cjs — 结构化 JSON 编辑工具

用法:
  node json-tool.cjs <command> [args...]

命令:
  read <file> [path]
      读取 JSON。path 可选，提取子值。

  create <file> <json|@template>
      创建新文件。json 可以是内联、@文件引用、或 - 标准输入。

  append <file> <path> <json>
      追加到数组末尾。

  prepend <file> <path> <json>
      插入到数组开头。

  set <file> <path> <json>
      设置字段值。路径上的中间节点自动创建。

  merge <file> <path> <json>
      深度合并到目标对象。

  remove <file> <path>
      删除字段或数组项。

  batch <file> <ops>
      批量执行。ops 是 JSON 数组：
      [{"action":"append","path":"periods","value":{...}},
       {"action":"set","path":"_updated","value":"..."}]

  list <dir> [pattern]
      递归列出 JSON 文件.

  count <file> <path>
      统计数组长度。

  keys <file> [path]
      列出对象键名。

  copy <sourceFile> <sourcePath|''> <targetFile> <targetPath|''> <mode>
      从 sourceFile 的 sourcePath 提取值，复制到 targetFile 的 targetPath。
      源文件不修改。
      mode:
        append   — source 值追加到 target 数组
        merge    — source 深度合并到 target 对象
        replace  — source 替换 target 字段
      这是合并 agent 的核心操作。

  validate <file|dir>
      验证 JSON 文件合法性。

路径语法:
  periods                        → 对象键
  periods[0]                     → 数组下标
  periods[id=vol-06]             → id 选择器
  periods[0].abilities_owned     → 链式
  periods[id=vol-06].abilities_owned

JSON 输入格式:
  {"key":"value"}                → 内联（注意引号转义）
  @/path/to/file.json            → 从文件读取
  -                              → 从标准输入读取

示例:
  # 读取角色文件的所有 periods
  node json-tool.cjs read characters/aria.json periods

  # 追加新 period
  node json-tool.cjs append characters/aria.json periods @new-period.json

  # 批量操作：追加 period + 更新修订记录
  node json-tool.cjs batch characters/aria.json '[{"action":"append","path":"periods","value":{"period_id":"vol-06"}},{"action":"append","path":"_revisions","value":{"date":"2026-07-06","note":"add vol-06"}}]'

  # 复制 source 的 periods 到 target（合并 agent 核心操作）
  node json-tool.cjs copy wave-001/characters/kinji.json periods merged/characters/kinji.json periods append

  # 复制 source 的能力数据到 target（merge 模式）
  node json-tool.cjs copy wave-001/abilities/hss.json '' merged/abilities/hss.json '' merge

  # 验证目录下所有 JSON
  node json-tool.cjs validate merged/characters/
`;
  process.stdout.write(help);
}

// Main
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

const cmd = args[0];
const cmdArgs = args.slice(1);

if (!commands[cmd]) {
  die(`Unknown command: ${cmd}\nAvailable: ${Object.keys(commands).join(', ')}`);
}

try {
  commands[cmd](cmdArgs);
} catch (e) {
  die(e.message);
}
