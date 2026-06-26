#!/usr/bin/env node
// enrich-curated.js — 根据 agent 标的 sourceRefs，从 raw worldbook JSON 提取原文嵌入 curated
// 用法: node tools/curation/enrich-curated.js <world-slug>
// 示例: node tools/curation/enrich-curated.js type-moon-nasuverse

const fs = require('fs');
const path = require('path');

const worldSlug = process.argv[2];
if (!worldSlug) { console.error('Usage: node enrich-curated.js <world-slug>'); process.exit(1); }

const worldbooksDir = `campaigns/world-library/imports/worldviews/${worldSlug}/worldbooks`;
const curatedDir = `campaigns/world-library/worlds/${worldSlug}/curated`;

if (!fs.existsSync(worldbooksDir)) { console.error('Worldbooks dir not found: ' + worldbooksDir); process.exit(1); }
if (!fs.existsSync(curatedDir)) { console.error('Curated dir not found: ' + curatedDir); process.exit(1); }

// Step 1: Load all raw entries
console.log('Loading raw worldbooks...');
const rawEntries = [];
for (const fn of fs.readdirSync(worldbooksDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(worldbooksDir, fn), 'utf-8'));
  (data.entries || []).forEach((e, i) => {
    rawEntries.push({
      comment: e.comment || '',
      keys: e.keys || [],
      content: e.content || '',
      sourceFile: fn,
      index: i,
      contentLen: (e.content || '').length
    });
  });
}
console.log('  Loaded ' + rawEntries.length + ' raw entries');

// Step 2: Load characters-index.json
const charsPath = path.join(curatedDir, 'characters-index.json');
if (!fs.existsSync(charsPath)) { console.error('characters-index.json not found'); process.exit(1); }

const chars = JSON.parse(fs.readFileSync(charsPath, 'utf-8'));
console.log('  ' + chars.characters.length + ' characters to enrich');

// Step 3: Match and enrich
let matched = 0, unmatched = [];
for (const ch of chars.characters) {
  const name = ch.name;
  const aliases = ch.aliases || [];
  const sourceKeys = ch.sourceKeys || [];
  
  let bestMatch = null, bestScore = 0;
  
  for (const re of rawEntries) {
    let score = 0;
    if (re.comment === name) score += 10;
    else if (re.comment && re.comment.includes(name)) score += 5;
    for (const alias of aliases) {
      if (re.comment && re.comment.includes(alias)) score += 3;
      if (re.keys && re.keys.includes(alias)) score += 3;
    }
    for (const sk of sourceKeys) {
      if (re.comment && re.comment.includes(sk)) score += 2;
      if (re.keys && re.keys.some(k => k.includes(sk) || sk.includes(k))) score += 2;
    }
    // Prefer longer content
    if (score > bestScore || (score === bestScore && re.contentLen > (bestMatch ? bestMatch.contentLen : 0))) {
      bestScore = score; bestMatch = re;
    }
  }
  
  if (bestMatch && bestScore >= 3) {
    ch.sourceContent = bestMatch.content;
    ch.sourceContentLen = bestMatch.contentLen;
    ch.sourceFile = bestMatch.sourceFile;
    ch.sourceIndex = bestMatch.index;
    ch.sourceKeys = [...new Set([...(ch.sourceKeys || []), ...(bestMatch.keys || [])])];
    ch.sourceRefs = [`${bestMatch.sourceFile}:entry ${bestMatch.index} (${bestMatch.contentLen} chars)`];
    if (!ch.detail || ch.detail.length < 200) ch.detail = bestMatch.content;
    matched++;
  } else {
    unmatched.push(`${ch.id}: ${ch.name} (bestScore=${bestScore})`);
  }
}

console.log('  Matched: ' + matched + '/' + chars.characters.length);
if (unmatched.length > 0) {
  console.log('  Unmatched: ' + unmatched.length);
  unmatched.slice(0, 10).forEach(u => console.log('    ' + u));
}

// Step 4: Write enriched file
chars.enrichmentStats = {
  matchedRawEntries: matched,
  unmatched: unmatched.length,
  totalSourceContentKB: Math.round(chars.characters.reduce((s, c) => s + (c.sourceContentLen || 0), 0) / 1024),
  enrichedCharacters: matched
};

fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2));
console.log('\nWritten: ' + charsPath + ' (' + (fs.statSync(charsPath).size/1024/1024).toFixed(1) + ' MB)');
console.log('Done.');

// Auto-rebuild index after enrichment
const { execSync } = require("child_process");
try {
  console.log("Rebuilding index...");
  execSync("node tools/world-index/cli.cjs build", { cwd: path.resolve(__dirname, "../.."), stdio: "inherit" });
} catch (e) { console.log("Index rebuild skipped: " + e.message); }

