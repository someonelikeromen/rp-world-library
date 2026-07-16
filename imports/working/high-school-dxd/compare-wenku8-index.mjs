#!/usr/bin/env node
/**
 * Crawl Wenku8 High School DxD table-of-contents metadata and compare it with
 * the curated world story index. This intentionally stores TOC metadata only,
 * not chapter bodies.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_URL = 'https://www.wenku8.net/novel/1/1034/index.htm';
const OUT_DIR = path.join(ROOT, 'imports/working/high-school-dxd');
const CURATED_DIR = path.join(ROOT, 'campaigns/world-library/worlds/high-school-dxd/curated');
const STORIES_INDEX = path.join(CURATED_DIR, 'stories/index.json');
const AGGREGATE_MD = path.join(CURATED_DIR, 'stories/剧情章节-包含前傳.md');
const SOURCE_REGISTRY = path.join(CURATED_DIR, 'source-registry.json');

function normalize(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/[\s　]+/g, '')
    .replace(/教学旅行/g, '修学旅行')
    .replace(/短篇集/g, '')
    .replace(/第12\.5卷/g, '第12.5卷')
    .replace(/[：:·・．.。！!？?「」『』【】（）()\[\]《》<>〈〉—＿_\-～~☆★,，、]/g, '')
    .replace(/卷/g, '卷')
    .toLowerCase();
}

function tokenMatch(a, b) {
  const an = normalize(a);
  const bn = normalize(b);
  if (!an || !bn) return false;
  if (an === bn || an.includes(bn) || bn.includes(an)) return Math.min(an.length, bn.length) >= 4;
  const aCore = an.replace(/^bd特典|^newbd特典|^exbd特典|^herobd特典/g, '');
  const bCore = bn.replace(/^bd特典|^newbd特典|^exbd特典|^herobd特典/g, '');
  return !!aCore && !!bCore && (aCore.includes(bCore) || bCore.includes(aCore)) && Math.min(aCore.length, bCore.length) >= 4;
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
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

function parseToc(html) {
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
        const href = link[1];
        const title = stripHtml(link[2]);
        current.chapters.push({ title, href: new globalThis.URL(href, SOURCE_URL).toString() });
      }
    }
  }
  return volumes;
}

function classifyAgainst(volumeTitle, storyTitles, aggregateLines) {
  const n = normalize(volumeTitle);
  const directExact = storyTitles.find(s => normalize(s) === n);
  if (directExact) return { status: 'direct-exact', evidence: directExact };

  const directPartial = storyTitles.find(s => tokenMatch(s, volumeTitle));
  if (directPartial) return { status: 'direct-retitled-or-partial', evidence: directPartial };

  const aggregateExact = aggregateLines.find(s => normalize(s) === n);
  if (aggregateExact) return { status: 'aggregate-exact', evidence: aggregateExact };

  const aggregatePartial = aggregateLines.find(s => tokenMatch(s, volumeTitle));
  if (aggregatePartial) return { status: 'aggregate-retitled-or-partial', evidence: aggregatePartial };

  // Known broad buckets in the existing aggregate chapter list. These are not
  // faithful one-entry-per-volume coverage, only rough chronology buckets.
  if (/BD特典|妄想杂志/.test(volumeTitle)) {
    const ev = aggregateLines.find(s => /妄想|特典/.test(s));
    if (ev) return { status: 'aggregate-broad-bucket', evidence: ev };
  }
  if (/^短篇$/.test(volumeTitle)) {
    const ev = aggregateLines.find(s => /高校日常生活|新生的挑战/.test(s));
    if (ev) return { status: 'aggregate-broad-bucket', evidence: ev };
  }
  if (/DX\.1/.test(volumeTitle)) {
    const ev = aggregateLines.find(s => /DX\.1|转生天使也疯狂/.test(s));
    if (ev) return { status: 'aggregate-retitled-or-partial', evidence: ev };
  }
  if (/DX\.3/.test(volumeTitle)) {
    const ev = aggregateLines.find(s => /DX\.3|十字x危机|十字×危机/.test(s));
    if (ev) return { status: 'aggregate-retitled-or-partial', evidence: ev };
  }
  if (/DX\.4/.test(volumeTitle)) {
    const ev = aggregateLines.find(s => /DX\.4|学生会与利维坦/.test(s));
    if (ev) return { status: 'aggregate-retitled-or-partial', evidence: ev };
  }
  if (/HERO BD特典|D×D 0|D.D 0/.test(volumeTitle)) {
    const ev = aggregateLines.find(s => /冥界零纪元|回憶篇/.test(s));
    if (ev) return { status: 'aggregate-retitled-or-partial', evidence: ev };
  }

  return { status: 'not-found', evidence: null };
}

function summarizeStoriesIndex(index) {
  return (index.stories || []).map(s => s.title || s.id || '').filter(Boolean);
}

function extractAggregateLines(md) {
  return md
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('#') && !s.startsWith('>') && !/^<\/?剧情章节>$/.test(s));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const html = await fetchWithRetry(SOURCE_URL);
  const volumes = parseToc(html);

  const storiesIndex = JSON.parse(await fs.readFile(STORIES_INDEX, 'utf8'));
  const aggregateMd = await fs.readFile(AGGREGATE_MD, 'utf8');
  const sourceRegistry = JSON.parse(await fs.readFile(SOURCE_REGISTRY, 'utf8'));
  const storyTitles = summarizeStoriesIndex(storiesIndex);
  const aggregateLines = extractAggregateLines(aggregateMd);

  const comparisons = volumes.map((v, i) => ({
    order: i + 1,
    sourceTitle: v.title,
    vid: v.vid,
    chapterCount: v.chapters.length,
    ...classifyAgainst(v.title, storyTitles, aggregateLines)
  }));

  const statusCounts = comparisons.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const curatedButNotInWenku = storyTitles.filter(t => {
    const tn = normalize(t);
    return !volumes.some(v => tokenMatch(v.title, t));
  });

  const result = {
    crawledAt: new Date().toISOString(),
    source: {
      id: 'wenku8-high-school-dxd-toc',
      url: SOURCE_URL,
      note: 'TOC metadata only; chapter bodies were not stored.'
    },
    sourceStats: {
      volumeCount: volumes.length,
      chapterLinkCount: volumes.reduce((sum, v) => sum + v.chapters.length, 0)
    },
    currentStats: {
      curatedStoryIndexCount: storyTitles.length,
      aggregateChronologyLineCount: aggregateLines.length,
      registeredSources: sourceRegistry.sources.map(s => ({ id: s.id, type: s.type, credibility: s.credibility }))
    },
    statusCounts,
    comparisons,
    curatedButNotInWenku,
    volumes
  };

  const jsonPath = path.join(OUT_DIR, 'wenku8-dxd-toc-comparison.json');
  await fs.writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf8');

  const report = [];
  report.push('# Wenku8《恶魔高校DxD》目录爬取与当前世界数据核对报告');
  report.push('');
  report.push(`- 爬取源：${SOURCE_URL}`);
  report.push(`- 爬取时间：${result.crawledAt}`);
  report.push('- 范围：仅保存目录/章节标题元数据，未保存正文。');
  report.push(`- 源目录分组：${result.sourceStats.volumeCount} 个；章节链接：${result.sourceStats.chapterLinkCount} 个。`);
  report.push(`- 当前 curated stories/index.json 条目：${result.currentStats.curatedStoryIndexCount} 个。`);
  report.push(`- 当前 source-registry 来源：${result.currentStats.registeredSources.map(s => s.id).join(', ')}。`);
  report.push('');
  report.push('## 覆盖统计');
  report.push('');
  for (const [k, v] of Object.entries(statusCounts)) report.push(`- ${k}: ${v}`);
  report.push('');
  report.push('## Wenku8 目录对照');
  report.push('');
  report.push('| # | Wenku8 分组 | 章节数 | 当前覆盖状态 | 证据 |');
  report.push('|---:|---|---:|---|---|');
  for (const c of comparisons) {
    report.push(`| ${c.order} | ${c.sourceTitle.replace(/\|/g, '\\|')} | ${c.chapterCount} | ${c.status} | ${(c.evidence || '').replace(/\|/g, '\\|')} |`);
  }
  report.push('');
  report.push('## 当前 curated 中有、但 Wenku8 1034 目录未直接出现的故事条目');
  report.push('');
  if (curatedButNotInWenku.length) {
    for (const t of curatedButNotInWenku) report.push(`- ${t}`);
  } else {
    report.push('- 无');
  }
  report.push('');
  report.push('## 初步结论');
  report.push('');
  report.push('1. 当前世界数据的主线第 1–25 卷与第 12.5 卷基本覆盖，但若干标题是 RP 摘要式改名，不完全等同原站目录。');
  report.push('2. Wenku8 目录中的 BD 特典、NEW BD 特典、DX.1–DX.7、EX/HERO BD、短篇等，目前多为“剧情章节-包含前傳.md”中的概括性一行，缺少独立 story 文件。');
  report.push('3. 当前 curated 数据包含《真惡魔高校》1–4 与《堕天的狗神/刃狗》前传条目；它们不在本 Wenku8 1034 目录中，应视为来自其他来源或后续补充。');
  const hasWenkuSource = result.currentStats.registeredSources.some(s => s.id === 'wenku8-dxd-toc-audit');
  if (hasWenkuSource) {
    report.push('4. source-registry 已登记 Wenku8 目录审计源；下一步应在 story index 中为各卷补充 sourceRef/canonicalTitle/sourceTitle 映射。');
  } else {
    report.push('4. source-registry 尚未登记 Wenku8 原文目录来源；如果要把它作为核对源，应新增一个 source 条目，并在 story index 中为各卷补充 sourceRef/canonicalTitle。');
  }

  const mdPath = path.join(OUT_DIR, 'wenku8-dxd-toc-comparison.md');
  await fs.writeFile(mdPath, report.join('\n'), 'utf8');

  console.log(JSON.stringify({ ok: true, jsonPath, mdPath, stats: result.sourceStats, statusCounts }, null, 2));
}

main().catch(err => {
  console.error(err?.stack || err);
  process.exit(1);
});
