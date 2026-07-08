#!/usr/bin/env node
/**
 * convert-sourceref.cjs — 将 sourceRef 从 full.txt:行号 转为 chapters/ch-XXX.txt:行号
 *
 * 用法: node convert-sourceref.cjs <series> <wave_dir>
 * 例: node convert-sourceref.cjs hidan-no-aria-main
 *         campaigns/world-library/manual-curation/hidan-p1-output/waves/wave-001
 *
 * 流程:
 *   1. 扫描 wave/vol-XX 下所有 JSON 文件
 *   2. 对每个 source_refs[0] 或 periods[].sourceRef
 *   3. 提取 full.txt:行号 → 查 chapters.json → 找到对应章节
 *   4. 替换为 chapters/ch-XXX-标题.txt:偏移行号
 */
const fs = require('fs'), path = require('path');

const [,, series, waveDir] = process.argv;
if (!series || !waveDir) {
  console.error('Usage: node convert-sourceref.cjs <series> <wave_dir>');
  process.exit(1);
}

const SPLIT_BASE = path.join(
  'campaigns/world-library/worlds/hidan-no-aria/sources/split-text',
  series
);

let totalFiles = 0, converted = 0, skipped = 0, errors = 0;

function getChapterMap(volDir) {
  const chPath = path.join(volDir, 'chapters.json');
  if (!fs.existsSync(chPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(chPath, 'utf-8'));
    return data.chapters || data.storyChapters || [];
  } catch { return null; }
}

function findChapter(chapters, lineNum) {
  for (const ch of chapters) {
    if (ch.startLine <= lineNum && lineNum <= ch.endLine) {
      // Convert to chapter-relative line number
      const offset = lineNum - ch.startLine + 1;
      const chFile = path.basename(ch.outputPath || '');
      return { chFile, offset, chName: ch.title };
    }
  }
  return null;
}

function convertSourceRefs(obj, chapters, volKey) {
  if (!obj || typeof obj !== 'object') return false;
  let changed = false;

  // source_refs array (top-level)
  if (Array.isArray(obj.source_refs)) {
    for (let i = 0; i < obj.source_refs.length; i++) {
      const ref = obj.source_refs[i];
      const match = ref && ref.match(new RegExp(`${series}/vol-\\d+/full\\.txt(:(\\d+))?`));
      if (match) {
        const lineNum = match[2] ? parseInt(match[2]) : null;
        if (lineNum && chapters) {
          const ch = findChapter(chapters, lineNum);
          if (ch) {
            obj.source_refs[i] = `${series}/${volKey}/chapters/${ch.chFile}:${ch.offset}`;
            changed = true;
            continue;
          }
        }
        // No line number or chapter not found: keep as-is but warn
        skipped++;
      }
    }
  }

  // periods[].sourceRef (string) and periods[].source_refs (array)
  if (Array.isArray(obj.periods)) {
    for (const p of obj.periods) {
      if (typeof p.sourceRef === 'string') {
        const match = p.sourceRef.match(new RegExp(`${series}/vol-\\d+/full\\.txt(:(\\d+))?`));
        if (match) {
          const lineNum = match[2] ? parseInt(match[2]) : null;
          if (lineNum && chapters) {
            const ch = findChapter(chapters, lineNum);
            if (ch) {
              p.sourceRef = `${series}/${volKey}/chapters/${ch.chFile}:${ch.offset}`;
              changed = true;
            }
          }
        }
      }
      if (Array.isArray(p.source_refs)) {
        for (let i = 0; i < p.source_refs.length; i++) {
          const ref = p.source_refs[i];
          const match = ref && ref.match(new RegExp(`${series}/vol-\\d+/full\\.txt(:(\\d+))?`));
          if (match) {
            const lineNum = match[2] ? parseInt(match[2]) : null;
            if (lineNum && chapters) {
              const ch = findChapter(chapters, lineNum);
              if (ch) {
                p.source_refs[i] = `${series}/${volKey}/chapters/${ch.chFile}:${ch.offset}`;
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  // Also check snapshot.sourceRef if present (old schema)
  if (obj.periods) {
    for (const p of obj.periods) {
      const snap = p.snapshot;
      if (!snap) continue;
      if (Array.isArray(snap.source_refs)) {
        for (let i = 0; i < snap.source_refs.length; i++) {
          const ref = snap.source_refs[i];
          const match = ref && ref.match(new RegExp(`${series}/vol-\\d+/full\\.txt(:(\\d+))?`));
          if (match) {
            const lineNum = match[2] ? parseInt(match[2]) : null;
            if (lineNum && chapters) {
              const ch = findChapter(chapters, lineNum);
              if (ch) {
                snap.source_refs[i] = `${series}/${volKey}/chapters/${ch.chFile}:${ch.offset}`;
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

function processVol(volPath) {
  const volKey = path.basename(volPath);
  const chapters = getChapterMap(path.join(SPLIT_BASE, volKey));

  const entityDirs = ['abilities','characters','events','items','locations','factions','systems','knowledge'];
  for (const dir of entityDirs) {
    const fullDir = path.join(volPath, dir);
    if (!fs.existsSync(fullDir)) continue;
    for (const f of fs.readdirSync(fullDir)) {
      if (!f.endsWith('.json')) continue;
      totalFiles++;
      const fp = path.join(fullDir, f);
      try {
        const raw = fs.readFileSync(fp, 'utf-8');
        const obj = JSON.parse(raw);
        if (convertSourceRefs(obj, chapters, volKey)) {
          fs.writeFileSync(fp, JSON.stringify(obj, null, 2) + '\n');
          converted++;
        }
      } catch (e) {
        errors++;
        console.error(`  ERROR ${fp}: ${e.message}`);
      }
    }
  }
}

// Main
console.log(`Series: ${series}`);
console.log(`Wave:   ${waveDir}`);
console.log(`Split:  ${SPLIT_BASE}`);

const vols = fs.readdirSync(waveDir).filter(v => v.startsWith('vol-')).sort();
for (const vol of vols) {
  const volPath = path.join(waveDir, vol);
  const splitPath = path.join(SPLIT_BASE, vol);
  if (!fs.existsSync(splitPath)) {
    console.log(`  ${vol}: ✗ split-text not found, skipping`);
    continue;
  }
  console.log(`  ${vol}: processing...`);
  processVol(volPath);
}

console.log(`\nDone: ${totalFiles} files, ${converted} converted, ${skipped} skipped (no line#), ${errors} errors`);
