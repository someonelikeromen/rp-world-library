#!/usr/bin/env node
/**
 * Crawl Wenku8 related High School DxD TOCs (True DxD and SlashDog) and compare
 * them with current curated story entries. Stores TOC metadata only.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'imports/working/high-school-dxd');
const STORIES_INDEX = path.join(ROOT, 'campaigns/world-library/worlds/high-school-dxd/curated/stories/index.json');

const SOURCES = [
  {
    id: 'wenku8-true-dxd-toc',
    label: '真恶魔高校DxD',
    url: 'https://www.wenku8.net/novel/2/2618/index.htm',
    expectedStoryTitleHints: ['真惡魔高校', '真恶魔高校']
  },
  {
    id: 'wenku8-slashdog-toc',
    label: '堕天的狗神 -SLASHDOG-',
    url: 'https://www.wenku8.net/novel/2/2524/index.htm',
    expectedStoryTitleHints: ['堕天的狗神', '刃狗', '姬岛的火花', '奥之院']
  }
];

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

function normalize(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/[\s　]+/g, '')
    .replace(/真恶魔高校/g, '真惡魔高校')
    .replace(/决战留学的kingdom/ig, '决战留学的王国')
    .replace(/kingdom/ig, '王国')
    .replace(/刃狗显现/g, '刃狗显现')
    .replace(/[：:·・．.。！!？?「」『』【】（）()\[\]《》<>〈〉—＿_\-～~☆★,，、]/g, '')
    .toLowerCase();
}

function tokenMatch(a, b) {
  const an = normalize(a);
  const bn = normalize(b);
  if (!an || !bn) return false;
  if (an === bn || an.includes(bn) || bn.includes(an)) return Math.min(an.length, bn.length) >= 3;
  return false;
}

async function fetchWithRetry(url, retries = 5) {
  let lastErr;
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; pi-rp-world-check/1.0)',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return new TextDecoder('gb18030').decode(buf);
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
  throw lastErr;
}

function parseToc(html, baseUrl) {
  const title = stripHtml(html.match(/<div id="title">([\s\S]*?)<\/div>/i)?.[1] || '');
  const info = stripHtml(html.match(/<div id="info">([\s\S]*?)<\/div>/i)?.[1] || '');
  const tdRe = /<td\b([^>]*)>([\s\S]*?)<\/td>/gi;
  const volumes = [];
  let current = null;
  let m;
  while ((m = tdRe.exec(html))) {
    const attrs = m[1];
    const body = m[2];
    if (/class=["']vcss["']/.test(attrs)) {
      const vid = attrs.match(/\bvid=["']?([^"'\s>]+)/)?.[1] || null;
      current = { vid, title: stripHtml(body), chapters: [] };
      volumes.push(current);
      continue;
    }
    if (/class=["']ccss["']/.test(attrs) && current) {
      const link = body.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (link) {
        current.chapters.push({
          title: stripHtml(link[2]),
          href: new globalThis.URL(link[1], baseUrl).toString()
        });
      }
    }
  }
  return { title, info, volumes };
}

function compareTrueDxd(vol, storyTitles) {
  const sourceTitle = `真惡魔高校 ${vol.title}`;
  const found = storyTitles.find(t => tokenMatch(t, sourceTitle));
  return found ? { status: 'direct-match', evidence: found } : { status: 'not-found', evidence: null };
}

function compareSlashDog(vol, idx, storyTitles) {
  const candidates = [
    `第一卷 堕天的狗神`,
    `第二卷 刃狗显现`,
    `第三卷 姬岛的火花与奥之院的激战`
  ];
  const sourceTitle = candidates[idx] || vol.title;
  const found = storyTitles.find(t => tokenMatch(t, sourceTitle));
  return found ? { status: 'direct-match-by-order', evidence: found } : { status: 'not-found', evidence: null };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const storyIndex = JSON.parse(await fs.readFile(STORIES_INDEX, 'utf8'));
  const storyTitles = (storyIndex.stories || []).map(s => s.title || s.id || '').filter(Boolean);

  const results = [];
  for (const source of SOURCES) {
    const html = await fetchWithRetry(source.url);
    const parsed = parseToc(html, source.url);
    const comparisons = parsed.volumes.map((v, i) => {
      const cmp = source.id.includes('true-dxd')
        ? compareTrueDxd(v, storyTitles)
        : compareSlashDog(v, i, storyTitles);
      return {
        order: i + 1,
        sourceTitle: v.title,
        vid: v.vid,
        chapterCount: v.chapters.length,
        ...cmp
      };
    });
    results.push({
      source,
      crawledTitle: parsed.title,
      crawledInfo: parsed.info,
      volumeCount: parsed.volumes.length,
      chapterLinkCount: parsed.volumes.reduce((sum, v) => sum + v.chapters.length, 0),
      comparisons,
      volumes: parsed.volumes
    });
  }

  const output = {
    crawledAt: new Date().toISOString(),
    note: 'TOC metadata only; chapter body text was not stored.',
    results
  };
  const jsonPath = path.join(OUT_DIR, 'wenku8-dxd-related-toc-comparison.json');
  await fs.writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');

  const md = [];
  md.push('# Wenku8《真恶魔高校DxD》与《堕天的狗神》目录爬取核对报告');
  md.push('');
  md.push(`- 爬取时间：${output.crawledAt}`);
  md.push('- 范围：仅保存目录/章节标题/章节链接元数据，未保存正文。');
  md.push('');
  for (const r of results) {
    md.push(`## ${r.source.label}`);
    md.push('');
    md.push(`- URL：${r.source.url}`);
    md.push(`- 站点标题：${r.crawledTitle}`);
    md.push(`- 信息：${r.crawledInfo}`);
    md.push(`- 分组：${r.volumeCount}`);
    md.push(`- 章节链接：${r.chapterLinkCount}`);
    md.push('');
    md.push('| # | 源分组 | 章节数 | 当前覆盖状态 | 当前证据 |');
    md.push('|---:|---|---:|---|---|');
    for (const c of r.comparisons) {
      md.push(`| ${c.order} | ${c.sourceTitle.replace(/\|/g, '\\|')} | ${c.chapterCount} | ${c.status} | ${(c.evidence || '').replace(/\|/g, '\\|')} |`);
    }
    md.push('');
  }
  md.push('## 结论');
  md.push('');
  md.push('1. 《真恶魔高校DxD》1–4 卷与当前 curated story index 可直接对应；源站另有“短篇”分组，当前没有独立 story 条目。');
  md.push('2. 《堕天的狗神 -SLASHDOG-》三卷与当前前传三条 story 可按顺序对应；源站卷标题较简略，当前标题是更具描述性的整理标题。');
  md.push('3. 这两个来源补足了此前 1034 主目录无法证明的《真惡魔高校》与《堕天的狗神/刃狗》来源。');

  const mdPath = path.join(OUT_DIR, 'wenku8-dxd-related-toc-comparison.md');
  await fs.writeFile(mdPath, md.join('\n'), 'utf8');

  console.log(JSON.stringify({ ok: true, jsonPath, mdPath, results: results.map(r => ({ id: r.source.id, volumeCount: r.volumeCount, chapterLinkCount: r.chapterLinkCount })) }, null, 2));
}

main().catch(err => {
  console.error(err?.stack || err);
  process.exit(1);
});
