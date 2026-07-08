#!/usr/bin/env node
/**
 * fix-and-copy.cjs — Fix JSON files and copy to merged output.
 * Run: node this_file.js
 * 
 * Fixes common JSON issues (extra newlines, truncated endings)
 * and copies all entity files from later volumes.
 */

const fs = require('fs');
const path = require('path');

const BASE = 'E:/pi-st';
const VOL_DIR = path.join(BASE, 'campaigns/world-library/manual-curation/hidan-p1-output/waves/wave-009');
const OUT_DIR = path.join(BASE, 'campaigns/world-library/manual-curation/hidan-p1-output/intermediate/wave-merged/wave-009');

const CATEGORIES = ['abilities', 'characters', 'events', 'factions', 'items', 'knowledge', 'locations', 'systems'];
const VOLUMES = ['vol-42', 'vol-43', 'vol-44', 'vol-45'];

function fixJSON(text) {
  // Try to parse; if fails, try common fixes
  try {
    JSON.parse(text);
    return text; // already valid
  } catch (e) {
    // Try trimming trailing whitespace/newlines after closing brace
    const trimmed = text.trim();
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch (e2) {
      // Try to find where JSON ends (last complete object)
      const braceMatch = trimmed.match(/^.*\}\s*$/s);
      if (braceMatch) {
        const candidate = braceMatch[0].trim();
        try {
          JSON.parse(candidate);
          return candidate;
        } catch (e3) {}
      }
      // Last resort: find last } and truncate
      const lastBrace = trimmed.lastIndexOf('}');
      if (lastBrace > 0) {
        const candidate = trimmed.substring(0, lastBrace + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch (e4) {}
      }
      return null; // can't fix
    }
  }
}

let total = 0;
let fixed = 0;
let copied = 0;
let merged = 0;

for (const vol of VOLUMES) {
  for (const cat of CATEGORIES) {
    const srcDir = path.join(VOL_DIR, vol, cat);
    if (!fs.existsSync(srcDir)) continue;
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      total++;
      const srcPath = path.join(srcDir, file);
      const outPath = path.join(OUT_DIR, cat, file);
      const raw = fs.readFileSync(srcPath, 'utf8');
      let fixedText = fixJSON(raw);
      
      if (!fixedText) {
        console.error(`CANNOT FIX: ${vol}/${cat}/${file}`);
        continue;
      }
      
      const srcData = JSON.parse(fixedText);
      
      if (fs.existsSync(outPath)) {
        // Merge periods
        const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        const srcPeriods = srcData.periods || [];
        const existingIds = new Set(existing.periods.map(p => p.period_id));
        for (const period of srcPeriods) {
          if (!existingIds.has(period.period_id)) {
            existing.periods.push(period);
            existingIds.add(period.period_id);
          }
        }
        // Sort periods by volume
        const volOrder = ['vol-41', 'vol-42', 'vol-43', 'vol-44', 'vol-45'];
        existing.periods.sort((a, b) => {
          return volOrder.indexOf(a.volume) - volOrder.indexOf(b.volume);
        });
        fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');
        merged++;
      } else {
        // Create output dir
        const outDir = path.dirname(outPath);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(srcData, null, 2), 'utf8');
        copied++;
      }
      
      if (fixedText !== raw) {
        // Rewrite source with fixed version
        fs.writeFileSync(srcPath, fixedText, 'utf8');
        fixed++;
      }
    }
  }
}

console.log(`Total files processed: ${total}`);
console.log(`Fixed: ${fixed}`);
console.log(`Copied (new): ${copied}`);
console.log(`Merged: ${merged}`);
