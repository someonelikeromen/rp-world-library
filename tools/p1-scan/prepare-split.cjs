/**
 * prepare-split.cjs — 从 raw-text (已按章节拆分) 生成 split-text 结构
 *
 * 输入: sources/raw-text/{series}/vol-XX/ (含 _manifest.json + 章节 txt)
 * 输出: sources/split-text/{series}/vol-XX/chapters.json + chapters/ch-XXX-标题.txt
 *
 * 用法: node prepare-split.cjs <worldDir> [series...]
 * 示例: node prepare-split.cjs worlds/saijaku-muhai-bahamut/sources saijaku-muhai-bahamut-main
 *       node prepare-split.cjs worlds/rakudai-kishi/sources rakudai-kishi-main
 *       node prepare-split.cjs worlds/danmachi/sources danmachi-main sword-oratoria familia-chronicle astraea-record argonaut
 */

const fs = require("fs");
const path = require("path");

const sourcesDir = process.argv[2];
const seriesList = process.argv.slice(3);

if (!sourcesDir || seriesList.length === 0) {
  console.error("用法: node prepare-split.cjs <sourcesDir> <series...>");
  process.exit(1);
}

function safeJson(fp) {
  try { return JSON.parse(fs.readFileSync(fp, "utf8")); }
  catch (e) { return null; }
}

function sanitizeFilename(name) {
  return name
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

let totalVols = 0;
let totalChapters = 0;

for (const series of seriesList) {
  const rawDir = path.join(sourcesDir, "raw-text", series);
  const splitDir = path.join(sourcesDir, "split-text", series);

  if (!fs.existsSync(rawDir)) {
    console.warn(`  [SKIP] ${series}: raw-text dir not found`);
    continue;
  }

  const volDirs = fs.readdirSync(rawDir)
    .filter(d => d.startsWith("vol-") && fs.statSync(path.join(rawDir, d)).isDirectory())
    .sort();

  console.log(`\n${series} (${volDirs.length} vol)`);

  for (const vol of volDirs) {
    const rawVol = path.join(rawDir, vol);
    const manifestPath = path.join(rawVol, "_manifest.json");
    const manifest = safeJson(manifestPath);

    if (!manifest) {
      console.warn(`  ${vol}: no _manifest.json, skipping`);
      continue;
    }

    const splitVol = path.join(splitDir, vol);
    const chaptersDir = path.join(splitVol, "chapters");
    fs.mkdirSync(chaptersDir, { recursive: true });

    const chapters = [];
    let lineAcc = 1;

    for (const entry of manifest) {
      if (!entry.ok) {
        console.warn(`  ${vol}: skipping entry #${entry.idx} "${entry.title}" (ok=false)`);
        continue;
      }

      const srcFile = path.join(rawVol, entry.file);
      if (!fs.existsSync(srcFile)) {
        console.warn(`  ${vol}: source file not found: ${entry.file}`);
        continue;
      }

      const content = fs.readFileSync(srcFile, "utf8");
      const chars = content.length;
      const lines = content.split("\n");
      const endLine = lineAcc + lines.length - 1;

      // Sanitize title for filename
      const safeTitle = sanitizeFilename(entry.title);
      const idx = String(entry.idx).padStart(3, "0");
      const chFilename = `ch-${idx}-${safeTitle}.txt`;

      // Copy file to split-text
      fs.writeFileSync(path.join(chaptersDir, chFilename), content, "utf8");

      chapters.push({
        startLine: lineAcc,
        endLine,
        title: entry.title,
        chapterIndex: entry.idx,
        outputPath: `chapters/${chFilename}`,
        chars,
      });

      lineAcc = endLine + 1;
    }

    // Write chapters.json
    fs.writeFileSync(path.join(splitVol, "chapters.json"), JSON.stringify(chapters, null, 2), "utf8");

    console.log(`  ${vol}: ${chapters.length} chapters`);
    totalVols++;
    totalChapters += chapters.length;
  }
}

console.log(`\n完成: ${totalVols} 卷, ${totalChapters} 章节`);
