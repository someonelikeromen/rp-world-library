#!/usr/bin/env node
/**
 * Add canonical TOC source mappings to High School DxD stories and create
 * explicit metadata-only story files for DX/BD/EX/HERO/short-story groups that
 * were previously represented only as aggregate chronology lines.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CURATED = path.join(ROOT, 'campaigns/world-library/worlds/high-school-dxd/curated');
const STORIES_DIR = path.join(CURATED, 'stories');
const INDEX_PATH = path.join(STORIES_DIR, 'index.json');
const MAIN_JSON = path.join(ROOT, 'imports/working/high-school-dxd/wenku8-dxd-toc-comparison.json');
const RELATED_JSON = path.join(ROOT, 'imports/working/high-school-dxd/wenku8-dxd-related-toc-comparison.json');
const OUT_DIR = path.join(ROOT, 'imports/working/high-school-dxd');

const DIRECT_SOURCE_ID = 'wenku8-dxd-toc-audit';

function normalize(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/[\s　]+/g, '')
    .replace(/教学旅行/g, '修学旅行')
    .replace(/真恶魔高校/g, '真惡魔高校')
    .replace(/Kingdom/ig, '王国')
    .replace(/短篇集/g, '')
    .replace(/[：:·・．.。！!？?「」『』【】（）()\[\]《》<>〈〉—＿_\-～~☆★,，、]/g, '')
    .toLowerCase();
}
function tokenMatch(a, b) {
  const an = normalize(a); const bn = normalize(b);
  if (!an || !bn) return false;
  if (an === bn || an.includes(bn) || bn.includes(an)) return Math.min(an.length, bn.length) >= 4;
  return false;
}
function slug(s) {
  return String(s)
    .replace(/真恶魔高校/g, '真惡魔高校')
    .replace(/Kingdom/g, '王国')
    .replace(/[『』「」【】《》〈〉（）()\[\]☆★?？!！:：.,，、]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[\/\\|*"<>]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
function uniqueBy(arr, keyFn) {
  const out = []; const seen = new Set();
  for (const x of arr || []) { const k = keyFn(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
  return out;
}
function sourceMeta(sourceId, sourceUrl, volume, prefixTitle = '') {
  const title = prefixTitle ? `${prefixTitle} ${volume.title}` : volume.title;
  return {
    sourceId,
    sourceTitle: title,
    sourceUrl,
    vid: volume.vid,
    chapterCount: volume.chapters.length,
    tocOnly: true,
    note: 'TOC metadata only; chapter body text is not stored.'
  };
}
function attachSource(story, meta) {
  story.canonicalSources = uniqueBy([...(story.canonicalSources || []), meta], x => `${x.sourceId}:${x.vid || x.sourceTitle}`);
  if (!story.canonicalTitle) story.canonicalTitle = story.title || story.id;
}
function storyFileContent(title, source, chapters) {
  const lines = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> Source: ${source.sourceId}${source.vid ? `:vid ${source.vid}` : ''}`);
  lines.push(`> URL: ${source.sourceUrl}`);
  lines.push('> Type: TOC metadata only; no chapter body text stored.');
  lines.push('');
  lines.push('<章节目录>');
  for (const [i, ch] of chapters.entries()) {
    lines.push(`- ${i + 1}. ${ch.title} — ${ch.href}`);
  }
  lines.push('</章节目录>');
  lines.push('');
  lines.push('<整理备注>');
  lines.push('本文件用于让 world_query 能检索到该特典/短篇分组的存在与章节标题。');
  lines.push('尚未进行正文级事实抽取；如 RP 需要具体剧情，应后续按章节抽取事实摘要/人物/地点/事件三元组。');
  lines.push('</整理备注>');
  lines.push('');
  return lines.join('\n');
}

async function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.copyFile(file, `${file}.bak-${stamp}`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await backup(INDEX_PATH);
  const index = JSON.parse(await fs.readFile(INDEX_PATH, 'utf8'));
  const main = JSON.parse(await fs.readFile(MAIN_JSON, 'utf8'));
  const related = JSON.parse(await fs.readFile(RELATED_JSON, 'utf8'));
  const stories = index.stories || [];
  const created = [];
  const updated = [];

  const findExisting = (title) => stories.find(s => tokenMatch(s.title || s.id, title));
  const upsertStory = async ({ id, title, sourceMeta, chapters, allowFuzzy = false }) => {
    let story = stories.find(s => s.id === id) || (allowFuzzy ? findExisting(title) : null);
    if (story) {
      attachSource(story, sourceMeta);
      updated.push({ id: story.id, title: story.title, sourceTitle: sourceMeta.sourceTitle });
      return story;
    }
    const file = `${id}.md`;
    story = {
      id,
      title,
      file,
      sourceRef: `${sourceMeta.sourceId}:vid ${sourceMeta.vid}`,
      canonicalTitle: title,
      canonicalSources: [sourceMeta],
      status: 'toc-only'
    };
    stories.push(story);
    await fs.writeFile(path.join(STORIES_DIR, file), storyFileContent(title, sourceMeta, chapters), 'utf8');
    created.push({ id, title, file, sourceTitle: sourceMeta.sourceTitle });
    return story;
  };

  // 1) Add canonical source mappings to all main source groups. Direct matches update existing stories;
  // aggregate-only/special groups get explicit TOC story files.
  for (const c of main.comparisons || []) {
    const volume = (main.volumes || []).find(v => v.vid === c.vid || v.title === c.sourceTitle);
    if (!volume) continue;
    const meta = sourceMeta(DIRECT_SOURCE_ID, main.source.url, volume);
    if (c.status.startsWith('direct')) {
      const story = findExisting(c.evidence || c.sourceTitle);
      if (story) { attachSource(story, meta); updated.push({ id: story.id, title: story.title, sourceTitle: meta.sourceTitle }); }
      continue;
    }
    const id = slug(c.sourceTitle);
    await upsertStory({ id, title: c.sourceTitle, sourceMeta: meta, chapters: volume.chapters, allowFuzzy: false });
  }

  // 2) Related source mappings: True DxD direct volumes and missing short-story group; SlashDog direct by order.
  for (const r of related.results || []) {
    const sourceId = r.source.id === 'wenku8-true-dxd-toc' ? 'wenku8-true-dxd-toc-audit' : 'wenku8-slashdog-toc-audit';
    const sourceUrl = r.source.url;
    for (const c of r.comparisons || []) {
      const volume = (r.volumes || []).find(v => v.vid === c.vid || v.title === c.sourceTitle);
      if (!volume) continue;
      const prefix = sourceId.includes('true') ? '真惡魔高校' : '堕天的狗神';
      const title = sourceId.includes('true') ? `${prefix} ${volume.title}` : (c.evidence || `${prefix} ${volume.title}`);
      const meta = sourceMeta(sourceId, sourceUrl, volume, sourceId.includes('true') ? '真惡魔高校' : '堕天的狗神');
      if (c.status.startsWith('direct')) {
        const story = findExisting(c.evidence || title);
        if (story) { attachSource(story, meta); updated.push({ id: story.id, title: story.title, sourceTitle: meta.sourceTitle }); }
        continue;
      }
      const id = slug(title);
      await upsertStory({ id, title, sourceMeta: meta, chapters: volume.chapters, allowFuzzy: false });
    }
  }

  index.stories = uniqueBy(stories, s => s.id);
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8');

  const report = [];
  report.push('# High School DxD story source mapping update');
  report.push('');
  report.push(`- Updated at: ${new Date().toISOString()}`);
  report.push(`- Created TOC-only story files: ${created.length}`);
  report.push(`- Updated existing story source mappings: ${updated.length}`);
  report.push('');
  report.push('## Created');
  report.push('');
  for (const x of created) report.push(`- ${x.id} -> ${x.file} (${x.sourceTitle})`);
  report.push('');
  report.push('## Updated');
  report.push('');
  for (const x of updated) report.push(`- ${x.id}: ${x.sourceTitle}`);
  const reportPath = path.join(OUT_DIR, 'dxd-story-source-mapping-audit.md');
  await fs.writeFile(reportPath, report.join('\n'), 'utf8');

  console.log(JSON.stringify({ ok: true, created: created.length, updated: updated.length, reportPath, storyCount: index.stories.length }, null, 2));
}

main().catch(err => { console.error(err?.stack || err); process.exit(1); });
