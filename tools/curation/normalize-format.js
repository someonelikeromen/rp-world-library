#!/usr/bin/env node
// normalize-format.js — 批量标准化 curated 产物中的 raw 内容格式
// 用法: node tools/curation/normalize-format.js <world-slug>
// 对 characters-index.json 的 detail/sourceContent + 所有 .md 文件应用格式转换

const fs = require('fs');
const path = require('path');

const worldSlug = process.argv[2];
if (!worldSlug) { console.error('Usage: node normalize-format.js <world-slug>'); process.exit(1); }

const curatedDir = `campaigns/world-library/worlds/${worldSlug}/curated`;
if (!fs.existsSync(curatedDir)) { console.error('Curated dir not found'); process.exit(1); }

let totalChanges = 0;

// ============== RULES ==============
// Each rule: { name, match: regex, replace: string | function }
// Applied in order. Content is never changed, only format markup.

const rules = [
  // 1. Strip SillyTavern XML wrappers
  { name: 'strip-xml-character', match: /<\/?character>/gi, replace: '' },
  { name: 'strip-xml-character2', match: /<\/?\u89d2\u8272>/gi, replace: '' },
  { name: 'strip-xml-bracket', match: /^<[^>]+>\s*\n?/gm, replace: '' },
  
  // 2. Remove SFW/NSFW tags
  { name: 'strip-sfw-tag', match: /^# SFW[^\n]*\n/gm, replace: '' },
  { name: 'strip-sfw-tag2', match: /^# NSFW[^\n]*\n/gm, replace: '' },
  { name: 'strip-version-tag', match: /^version:\s*\d+\s*\n/gim, replace: '' },
  
  // 3. Standardize heading levels
  { name: 'h1-to-h2', match: /^# (?!## )(?!#### )(?!# )([^#\n].+)$/gm, replace: '## $1' },
  
  // 4. Standardize common section labels
  { name: 'section-info', match: /^##?\s*基本信息[：:]\s*$/gm, replace: '## 基本信息' },
  { name: 'section-bg', match: /^##?\s*(人物背景|背景故事|Backstory|背景)[：:]*\s*$/gm, replace: '## 背景' },
  { name: 'section-personality', match: /^##?\s*(性格|性格特征|性格特点|Personality)[：:]*\s*$/gm, replace: '## 性格' },
  { name: 'section-appearance', match: /^##?\s*(外貌|外表|外观|Appearance|形象)[：:]*\s*$/gm, replace: '## 外貌' },
  { name: 'section-abilities', match: /^##?\s*(能力|技能|Abilities|Skills|宝具)[：:]*\s*$/gm, replace: '## 能力' },
  { name: 'section-relations', match: /^##?\s*(关系|人际关系|Relationships)[：:]*\s*$/gm, replace: '## 关系' },
  { name: 'section-items', match: /^##?\s*(装备|道具|武器|Items|Equipment)[：:]*\s*$/gm, replace: '## 装备' },
  { name: 'section-history', match: /^##?\s*(经历|历史|生平|人生轨迹|History|Story)[：:]*\s*$/gm, replace: '## 经历' },
  { name: 'section-core', match: /^##?\s*(核心身份|核心信息|Core Identity|CoreIdentity)[：:]*\s*$/gm, replace: '## 核心身份' },
  { name: 'section-summary', match: /^##?\s*(简介|概述|Summary|概要|介绍)[：:]*\s*$/gm, replace: '## 概述' },
  { name: 'section-notes', match: /^##?\s*(备注|Notes|注意|说明|补充)[：:]*\s*$/gm, replace: '## 备注' },
  
  // 5. Clean up empty lines
  { name: 'clean-triple-newline', match: /\n\n\n+/g, replace: '\n\n' },
  { name: 'clean-trailing-newlines', match: /\n+$/, replace: '\n' },
];

// ============== APPLY TO FILE ==============
function normalizeFile(filePath, fieldPath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.log('  SKIP: ' + filePath + ' (' + e.message + ')');
    return;
  }
  
  // Access target field if specified
  let target = content;
  let isJsonField = false;
  if (fieldPath) {
    try {
      const obj = JSON.parse(content);
      const keys = fieldPath.split('.');
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (Array.isArray(current)) {
          // Apply to all array elements
          const lastKey = keys.slice(i).join('.');
          let changes = 0;
          for (let j = 0; j < current.length; j++) {
            const result = applyRules(current[j][lastKey] || '', true);
            if (result.changed) {
              current[j][lastKey] = result.text;
              changes++;
            }
          }
          fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
          console.log('  ' + filePath + ' [' + fieldPath + ']: ' + changes + ' entries changed');
          return;
        }
        current = current[keys[i]];
        if (!current) break;
      }
    } catch (e) {
      console.log('  SKIP JSON parse: ' + filePath + ' (' + e.message + ')');
      return;
    }
  }
  
  // Apply rules to the target text
  const result = applyRules(target, false);
  if (!result.changed) {
    // No changes
    return;
  }
  
  // Write back
  if (fieldPath) {
    try {
      const obj = JSON.parse(content);
      // Set nested field
      const keys = fieldPath.split('.');
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = result.text;
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e) {
      console.log('  ERROR writing JSON: ' + e.message);
      return;
    }
  } else {
    fs.writeFileSync(filePath, result.text, 'utf-8');
  }
  
  console.log('  ' + filePath + ': ' + result.count + ' changes');
  totalChanges += result.count;
}

function applyRules(text, isField) {
  let changed = false;
  let count = 0;
  for (const rule of rules) {
    const before = text;
    if (typeof rule.replace === 'function') {
      text = rule.replace(text);
    } else {
      text = text.replace(rule.match, rule.replace);
    }
    if (before !== text) {
      changed = true;
      count++;
    }
  }
  return { text, changed, count };
}

// ============== EXECUTE ==============
console.log('Normalizing: ' + worldSlug);
console.log('Rules: ' + rules.length);
console.log('');

// 1. characters-index.json — normalize detail and sourceContent on all characters
const charsPath = path.join(curatedDir, 'characters-index.json');
if (fs.existsSync(charsPath)) {
  console.log('=== characters-index.json ===');
  try {
    const chars = JSON.parse(fs.readFileSync(charsPath, 'utf-8'));
    let charChanges = 0;
    for (const ch of (chars.characters || [])) {
      for (const field of ['detail', 'sourceContent']) {
        if (ch[field] && typeof ch[field] === 'string') {
          const result = applyRules(ch[field], true);
          if (result.changed) {
            ch[field] = result.text;
            charChanges++;
          }
        }
      }
    }
    fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2), 'utf-8');
    console.log('  characters-index.json: ' + charChanges + ' character fields changed');
    totalChanges += charChanges;
  } catch (e) {
    console.log('  ERROR: ' + e.message);
  }
}

// 2. All .md files
console.log('\n=== Markdown files ===');
for (const fn of fs.readdirSync(curatedDir)) {
  if (fn.endsWith('.md') && fn !== 'review-report.md' && fn !== 'curation-notes.md') {
    normalizeFile(path.join(curatedDir, fn));
  }
}

// 3. world.json — normalize description/summary fields
const worldPath = path.join(curatedDir, 'world.json');
if (fs.existsSync(worldPath)) {
  console.log('\n=== world.json ===');
  try {
    const world = JSON.parse(fs.readFileSync(worldPath, 'utf-8'));
    let wChanges = 0;
    for (const section of ['powerSystems', 'factions', 'rules', 'locations', 'events', 'timelines']) {
      const items = world[section] || [];
      for (const item of items) {
        if (item.summary && typeof item.summary === 'string') {
          const result = applyRules(item.summary, true);
          if (result.changed) { item.summary = result.text; wChanges++; }
        }
        if (item.description && typeof item.description === 'string') {
          const result = applyRules(item.description, true);
          if (result.changed) { item.description = result.text; wChanges++; }
        }
      }
    }
    if (wChanges > 0) {
      fs.writeFileSync(worldPath, JSON.stringify(world, null, 2), 'utf-8');
      console.log('  world.json: ' + wChanges + ' field changes');
      totalChanges += wChanges;
    }
  } catch (e) {
    console.log('  ERROR: ' + e.message);
  }
}

console.log('\n=== DONE ===');
console.log('Total changes: ' + totalChanges);
