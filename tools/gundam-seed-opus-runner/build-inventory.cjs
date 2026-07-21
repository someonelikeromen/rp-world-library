#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) { out[key] = next; i++; }
        else out[key] = true;
      }
    } else out._.push(a);
  }
  return out;
}
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
function writeText(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, 'utf8');
}
function normalizeTitle(title) {
  return String(title || '').replace(/ - 哔哩哔哩$/, '').trim();
}
function classifyCategory(title, text) {
  const s = `${title}\n${text}`;
  if (/机体百科/.test(title)) return 'mobile_suit';
  if (/战舰百科/.test(title)) return 'warship';
  if (/人物百科/.test(title)) return 'character';
  if (/战斗分析/.test(title)) return 'battle';
  if (/是非大全|争议|话题|槽点/.test(title)) return 'controversy';
  if (/官方小说|小说翻译/.test(title)) return 'novel_translation';
  if (/百科|世界|设定|阵营|势力|技术|年表|C\.E\.|CE/.test(s)) return 'world_rule';
  return 'unknown';
}
function classifyExtension(title, text) {
  const full = `${title}\n${text}`;
  const titleOnly = String(title || '');
  const primaryHits = [];
  const mentionHits = [];
  const patterns = [
    ['destiny_extension', /DESTINY|种命|命运高达|脉冲高达|混沌高达|盖亚高达|深渊高达|救世高达|传说高达|毁灭高达|真飞鸟|露娜玛丽亚|雷·扎·巴雷尔|迪兰达尔|塔莉亚|密涅瓦号|军械库一号|C\.E\.73|CE73|73年战争/],
    ['freedom_extension', /FREEDOM|SEED\s*FREEDOM|种自|自由强袭|黑骑士|基金国|孔帕斯|COMPASS|C\.E\.75|CE75/],
    ['astray_extension', /ASTRAY|Astray|异端|罗裘尔|丛云劾|废物商|蛇尾/],
    ['msv_extension', /MSV|MSV战记|模型|外传机|派生机|试作机|专用机/]
  ];
  for (const [tag, re] of patterns) {
    if (re.test(titleOnly)) primaryHits.push(tag);
    if (re.test(full)) mentionHits.push(tag);
  }
  const primary = [...new Set(primaryHits)];
  const mentions = [...new Set(mentionHits)];
  if (primary.length === 0) return { scope: 'seed_core', extensionTags: mentions, extensionMentions: mentions };
  if (primary.length === 1) return { scope: primary[0], extensionTags: mentions, extensionMentions: mentions };
  return { scope: 'mixed_or_uncertain', extensionTags: mentions, extensionMentions: mentions };
}
function extractSubject(title) {
  const t = normalizeTitle(title);
  const parts = t.split(/[—-]+/);
  return (parts[parts.length - 1] || t).trim();
}
function countBy(items, key) {
  const out = {};
  for (const item of items) out[item[key]] = (out[item[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => a[0].localeCompare(b[0])));
}
function pickSamples(items) {
  const wanted = ['mobile_suit', 'character', 'warship', 'battle', 'world_rule', 'novel_translation'];
  const samples = [];
  const badSampleTitle = /动态$/;
  for (const category of wanted) {
    const candidates = items
      .filter(item => item.category === category && item.manifestImageCount > 0 && !badSampleTitle.test(item.title))
      .sort((a, b) => {
        const scopeScore = (x) => x.scope === 'seed_core' ? 0 : x.scope === 'mixed_or_uncertain' ? 1 : 2;
        const mentionScore = (x) => (x.extensionMentions || []).length === 0 ? 0 : 1;
        return scopeScore(a) - scopeScore(b)
          || mentionScore(a) - mentionScore(b)
          || b.manifestImageCount - a.manifestImageCount
          || a.index - b.index;
      });
    if (candidates[0]) {
      const c = candidates[0];
      samples.push({
        category,
        opusId: c.opusId,
        title: c.title,
        scope: c.scope,
        extensionMentions: c.extensionMentions || [],
        manifestPath: c.manifestPath,
        maxImages: 2,
        reason: `sample ${category}; preferred seed_core without extension mentions when available`
      });
    }
  }
  return samples;
}
function buildMarkdown(report) {
  const lines = [];
  lines.push('# Gundam SEED Opus Source Inventory');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Total opus: ${report.counts.total}`);
  lines.push(`- Details present: ${report.counts.detailsPresent}`);
  lines.push(`- Manifests present: ${report.counts.manifestsPresent}`);
  lines.push(`- Local manifest images: ${report.counts.localManifestImages}`);
  lines.push('');
  lines.push('## Category Counts');
  lines.push('');
  for (const [k, v] of Object.entries(report.counts.byCategory)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Scope Counts');
  lines.push('');
  for (const [k, v] of Object.entries(report.counts.byScope)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Vision Sample Candidates');
  lines.push('');
  for (const sample of report.visionSampleCandidates) lines.push(`- ${sample.category}: ${sample.opusId} ${sample.title}`);
  lines.push('');
  lines.push('## Gaps');
  lines.push('');
  lines.push(`- Missing detail files: ${report.gaps.missingDetails.length}`);
  lines.push(`- Missing image manifests: ${report.gaps.missingManifests.length}`);
  lines.push(`- Unknown category: ${report.gaps.unknownCategory.length}`);
  lines.push(`- Mixed or uncertain extension scope: ${report.gaps.mixedOrUncertain.length}`);
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This inventory is a source layer, not a final fact archive.');
  lines.push('- `seed_core` means no extension trigger was found by the current heuristic; it still needs source review before merge.');
  lines.push('- Extension-tagged entries are kept out of the SEED core merge unless explicitly promoted by later review.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.root || 'work/gundam-seed/source-ingest-v2';
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const index = readJson(path.join(root, 'opus-index.json'));
  if (!index || !Array.isArray(index.items)) throw new Error(`Invalid opus index under ${root}`);
  const items = [];
  const opusMap = {};
  const gaps = { missingDetails: [], missingManifests: [], unknownCategory: [], mixedOrUncertain: [], noContentText: [], noLocalImages: [] };
  for (const src of index.items) {
    const opusId = String(src.opusId || '');
    const detailPath = path.join(root, 'details', `${opusId}.json`);
    const manifestPath = path.join(root, 'images', opusId, 'manifest.json');
    const detail = readJson(detailPath, null);
    const manifest = readJson(manifestPath, null);
    const title = normalizeTitle((detail && detail.title) || src.title);
    const text = String((detail && (detail.contentText || detail.moduleText)) || '');
    const category = classifyCategory(title, text);
    const scopeInfo = classifyExtension(title, text);
    const record = {
      index: src.index,
      opusId,
      title,
      subject: extractSubject(title),
      url: src.url || (detail && detail.url) || `https://www.bilibili.com/opus/${opusId}`,
      category,
      scope: scopeInfo.scope,
      extensionTags: scopeInfo.extensionTags,
      extensionMentions: scopeInfo.extensionMentions,
      seedMention: !!(src.related && src.related.seedMention) || /SEED/i.test(`${title}\n${text}`),
      like: src.like ?? null,
      detailPath: detail ? detailPath : null,
      manifestPath: manifest ? manifestPath : null,
      contentTextChars: text.length,
      detailImageCount: detail && Array.isArray(detail.images) ? detail.images.length : 0,
      contentImageCount: detail && Array.isArray(detail.contentImages) ? detail.contentImages.length : 0,
      manifestImageCount: manifest && Array.isArray(manifest.images) ? manifest.images.length : 0,
      evidenceStatus: {
        hasDetail: !!detail,
        hasManifest: !!manifest,
        hasContentText: text.length > 0,
        hasLocalImages: !!(manifest && Array.isArray(manifest.images) && manifest.images.length)
      }
    };
    items.push(record);
    opusMap[opusId] = {
      title: record.title,
      category: record.category,
      scope: record.scope,
      subject: record.subject,
      url: record.url,
      detailPath: record.detailPath,
      manifestPath: record.manifestPath
    };
    if (!detail) gaps.missingDetails.push(opusId);
    if (!manifest) gaps.missingManifests.push(opusId);
    if (category === 'unknown') gaps.unknownCategory.push({ opusId, title });
    if (record.scope === 'mixed_or_uncertain') gaps.mixedOrUncertain.push({ opusId, title, extensionTags: record.extensionTags });
    if (!text.length) gaps.noContentText.push(opusId);
    if (!record.manifestImageCount) gaps.noLocalImages.push(opusId);
  }
  const report = {
    schema: 'gundam-seed-opus-source-inventory-v1',
    generatedAt: new Date().toISOString(),
    root,
    planDir,
    counts: {
      total: items.length,
      detailsPresent: items.filter(i => i.evidenceStatus.hasDetail).length,
      manifestsPresent: items.filter(i => i.evidenceStatus.hasManifest).length,
      localManifestImages: items.reduce((n, i) => n + i.manifestImageCount, 0),
      detailImages: items.reduce((n, i) => n + i.detailImageCount, 0),
      byCategory: countBy(items, 'category'),
      byScope: countBy(items, 'scope')
    },
    gaps,
    visionSampleCandidates: pickSamples(items),
    items
  };
  writeJson(path.join(planDir, 'source-inventory.json'), report);
  writeJson(path.join(planDir, 'source-opus-map.json'), opusMap);
  writeJson(path.join(planDir, 'source-gaps.json'), { schema: 'gundam-seed-opus-source-gaps-v1', generatedAt: report.generatedAt, counts: Object.fromEntries(Object.entries(gaps).map(([k, v]) => [k, v.length])), gaps });
  writeText(path.join(planDir, 'source-inventory.md'), buildMarkdown(report));
  console.log(JSON.stringify({ ok: true, outDir: planDir, counts: report.counts, samples: report.visionSampleCandidates }, null, 2));
}
main();
