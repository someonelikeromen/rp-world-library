const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const NOW = new Date().toISOString();

const termBank = {
  danmachi: ['贝尔','赫斯缇雅','艾丝','莉莉','莉莉露卡','韦尔夫','琉','芙蕾雅','洛基','奥它','芬恩','里维莉雅','格瑞斯','蒂奥娜','蒂奥涅','蕾菲亚','荷米斯','阿波罗','伊丝塔','春姬','韦尔夫','命','地下城','欧拉丽','眷族','法尔纳','魔法','技能','Lv.','第18层','中层','异端儿','战争游戏','怪物','冒险者'],
  campione: ['护堂','艾莉卡','佑理','莉莉娅娜','雅典娜','沃班','罗濠','萨尔巴特雷','爱莎','不顺从之神','弑神者','权能','乌鲁斯拉格纳','韦勒斯拉纳','梅尔卡托','草薙','潘多拉','神祖','圣杯','神域','特洛伊','芬里尔'],
  'rakudai-kishi': ['一辉','史黛菈','珠雫','绫辻','东堂刀华','黑铁','有栖院','七星剑武祭','伐刀者','固有灵装','魔人','解放军','法米利昂','骑士','学园','剑士杀手','落第骑士'],
  'saijaku-muhai-bahamut': ['路克斯','莉夏','库露露席法','菲尔菲','赛莉丝','夜架','爱理','机龙','神装机龙','巴哈姆特','遗迹','学园','王国','帝国','龙匪贼','圣蚀','七龙骑圣'],
  'hidan-no-aria': ['明里','亚莉亚','志乃','麒麟','莱卡','白雪','夹竹桃','武侦','战姊妹','间宫','星伽','海猫','AA']
};

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function escapePipe(s) { return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }
function safeId(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }
function countTerm(text, term) { return (text.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length; }

function chapterText(worldSlug, chFile) {
  const p = path.join(ROOT, worldSlug, chFile);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

function computeVolumeStats(worldSlug, seriesSlug, volume) {
  const terms = termBank[worldSlug] || [];
  const counts = new Map();
  const chapterStats = [];
  for (const ch of volume.chapters || []) {
    const text = chapterText(worldSlug, ch.file);
    const local = [];
    for (const term of terms) {
      const c = countTerm(text, term);
      if (c > 0) {
        counts.set(term, (counts.get(term) || 0) + c);
        local.push([term, c]);
      }
    }
    local.sort((a, b) => b[1] - a[1]);
    chapterStats.push({ ...ch, mentions: local.slice(0, 8).map(([k]) => k) });
  }
  const topTerms = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  return { topTerms, chapterStats };
}

function generateSummary(worldSlug, series, volume, stats) {
  const terms = stats.topTerms.slice(0, 8).map(([k]) => k);
  const firstTitle = volume.chapters?.[0]?.title || '开篇';
  const lastTitle = volume.chapters?.[volume.chapters.length - 1]?.title || '卷末';
  const focus = terms.length ? terms.join('、') : '本卷主要人物与事件';
  return `本卷包含 ${volume.okCount || volume.chapters?.length || 0} 个正文章节，从《${firstTitle}》推进到《${lastTitle}》。自动抽取显示高频核心为：${focus}。本轮摘要将其定位为 ${series.title || series.seriesSlug} 的卷级剧情节点：围绕章节标题所指向的冲突、人物关系、能力/组织信息和卷末状态变化展开。此摘要为第一轮自动归档摘要，已提供源码指针与候选标签，后续关键卷可继续人工精修。`;
}

function generateChapterSummary(ch) {
  const tags = ch.mentions && ch.mentions.length ? `主要关联：${ch.mentions.join('、')}` : '主要关联待精修';
  return `《${ch.title}》推进本卷局部事件与人物互动；${tags}。`;
}

function writeVolumeSummary(worldSlug, series, volume) {
  const curatedRoot = path.join(ROOT, worldSlug, 'curated', 'stories');
  const outDir = path.join(curatedRoot, 'summaries', series.seriesSlug);
  ensureDir(outDir);
  const outPath = path.join(outDir, `${volume.dir}.md`);

  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath, 'utf8');
    if (existing.includes('正式摘要')) return { path: outPath, skipped: true };
  }

  const stats = computeVolumeStats(worldSlug, series.seriesSlug, volume);
  const summary = generateSummary(worldSlug, series, volume, stats);
  let md = `# ${volume.title}\n\n`;
  md += `世界：${worldSlug}\n\n`;
  md += `系列：${series.seriesSlug} / ${series.title || ''}\n\n`;
  md += `状态：Iteration auto-pass 自动摘要。正文保留在 source，本文件只保存派生摘要、索引和候选标签。\n\n`;
  md += `## 卷摘要\n\n${summary}\n\n`;
  md += `## 章节清单\n\n| 序号 | 标题 | 字数 | 主要命中 | 源文件 |\n|---:|---|---:|---|---|\n`;
  for (const ch of stats.chapterStats) {
    md += `| ${ch.idx} | ${escapePipe(ch.title)} | ${ch.chars || 0} | ${(ch.mentions || []).join('、') || '—'} | \`${ch.file}\` |\n`;
  }
  md += `\n## 章节摘要\n\n`;
  for (const ch of stats.chapterStats) md += `- ${ch.idx}. ${generateChapterSummary(ch)}\n`;
  md += `\n## 抽取候选\n\n`;
  md += `- 高频人物/术语：${stats.topTerms.slice(0, 12).map(([k, v]) => `${k}(${v})`).join('、') || '待精修'}\n`;
  md += `- 事件节点：${volume.title} 卷级剧情节点。\n`;
  md += `- 图谱对齐：${worldSlug}/${series.seriesSlug}/${volume.dir}\n`;
  md += `- 剧透等级：auto-pass，待人工按 RP 时间线精修。\n`;
  md += `\n## 名词命中统计\n\n`;
  md += stats.topTerms.map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- 无命中';
  md += '\n';
  fs.writeFileSync(outPath, md, 'utf8');
  return { path: outPath, skipped: false };
}

function processWorld(worldSlug) {
  const worldRoot = path.join(ROOT, worldSlug);
  const manifestPath = path.join(worldRoot, 'sources', 'raw-text-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  const curatedStories = path.join(worldRoot, 'curated', 'stories');
  ensureDir(curatedStories);

  const summaryIndex = {
    schema: 'rp-story-summary-index-v1',
    worldId: worldSlug,
    createdAt: NOW,
    method: 'auto-pass: raw-text manifest -> per-volume derived summaries + volume-level plot increments; no source prose copied',
    series: []
  };
  const allIncrementNodes = [];
  const report = { worldSlug, series: [], summariesWritten: 0, summariesSkipped: 0, increments: [] };

  for (const series of manifest.series || []) {
    const seriesEntry = {
      seriesSlug: series.seriesSlug,
      title: series.title,
      author: series.author,
      url: series.url,
      sourceToc: series.sourceToc,
      volumes: []
    };
    const inc = {
      schema: 'rp-plot-graph-increment-v1',
      worldId: worldSlug,
      createdAt: NOW,
      source: `${worldSlug}/${series.seriesSlug} auto-pass raw-text summaries`,
      nodes: []
    };
    for (const volume of series.volumes || []) {
      const result = writeVolumeSummary(worldSlug, series, volume);
      if (result.skipped) report.summariesSkipped++; else report.summariesWritten++;
      const stats = computeVolumeStats(worldSlug, series.seriesSlug, volume);
      const node = {
        id: `orig-${safeId(series.seriesSlug)}-${volume.dir}`,
        series: series.seriesSlug,
        volume: volume.dir,
        label: `${series.seriesSlug} ${volume.title}`,
        type: 'volume-event',
        summary: generateSummary(worldSlug, series, volume, stats),
        characters: stats.topTerms.slice(0, 8).map(([k]) => k),
        organizations: [],
        terms: stats.topTerms.slice(8, 16).map(([k]) => k),
        spoilerLevel: 'auto-pass',
        sourceRefs: [`curated/stories/summaries/${series.seriesSlug}/${volume.dir}.md`],
        originalTextBacked: true
      };
      inc.nodes.push(node);
      allIncrementNodes.push(node);
      seriesEntry.volumes.push({
        id: volume.dir,
        title: volume.title,
        summaryFile: `curated/stories/summaries/${series.seriesSlug}/${volume.dir}.md`,
        chapterCount: volume.okCount || (volume.chapters || []).length,
        sourceVolume: volume.sourceVolume,
        summaryStatus: result.skipped ? 'drafted' : 'auto-pass',
        graphNode: node.id
      });
    }
    const incPath = path.join(curatedStories, `original-plot-increment-${series.seriesSlug}-auto-all.json`);
    writeJson(incPath, inc);
    report.increments.push(incPath.replace(/\\/g, '/'));
    summaryIndex.series.push(seriesEntry);
    report.series.push({ seriesSlug: series.seriesSlug, volumes: seriesEntry.volumes.length, nodes: inc.nodes.length });
  }
  writeJson(path.join(curatedStories, 'original-summary-index.json'), summaryIndex);

  const graphPath = path.join(worldRoot, 'curated', 'plot-graph.json');
  ensureDir(path.dirname(graphPath));
  let graph = fs.existsSync(graphPath) ? readJson(graphPath) : { schema: 'rp-plot-graph-v1', worldId: worldSlug, nodes: [], edges: [], generatedAt: NOW };
  if (!Array.isArray(graph.nodes)) graph.nodes = [];
  if (!Array.isArray(graph.edges)) graph.edges = [];
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  const edgeKeys = new Set(graph.edges.map(e => `${e.from}::${e.to}::${e.type}`));
  let prev = null;
  let addedNodes = 0, addedEdges = 0;
  for (const node of allIncrementNodes) {
    if (!nodeIds.has(node.id)) {
      graph.nodes.push(node);
      nodeIds.add(node.id);
      addedNodes++;
    }
    if (prev) {
      const key = `${prev}::${node.id}::auto-precedes`;
      if (!edgeKeys.has(key)) {
        graph.edges.push({ from: prev, to: node.id, type: 'auto-precedes', sourceRefs: ['auto-pass raw-text volume order'] });
        edgeKeys.add(key);
        addedEdges++;
      }
    }
    prev = node.id;
  }
  graph.generatedAt = NOW;
  writeJson(graphPath, graph);
  report.graphPath = graphPath.replace(/\\/g, '/');
  report.addedNodes = addedNodes;
  report.addedEdges = addedEdges;
  report.totalGraphNodes = graph.nodes.length;
  report.totalGraphEdges = graph.edges.length;
  return report;
}

function main() {
  const worlds = fs.readdirSync(ROOT).filter(w => fs.existsSync(path.join(ROOT, w, 'sources', 'raw-text-manifest.json'))).sort();
  const reports = worlds.map(processWorld).filter(Boolean);
  const outDir = 'campaigns/world-library/manual-curation/reports';
  ensureDir(outDir);
  writeJson(path.join(outDir, 'iteration-auto-pass-report.json'), { createdAt: NOW, reports });
  let md = `# Iteration Auto-Pass Report\n\n更新日期：${NOW}\n\n`;
  md += `本轮使用本地 raw-text manifest 自动生成派生摘要和卷级图谱节点，不复制小说正文。\n\n`;
  md += `| world | series | summaries written | summaries preserved | graph nodes added | graph edges added | graph total |\n|---|---:|---:|---:|---:|---:|---:|\n`;
  for (const r of reports) {
    md += `| ${r.worldSlug} | ${r.series.length} | ${r.summariesWritten} | ${r.summariesSkipped} | ${r.addedNodes} | ${r.addedEdges} | ${r.totalGraphNodes}/${r.totalGraphEdges} |\n`;
  }
  md += `\n## 输出\n\n`;
  for (const r of reports) {
    md += `### ${r.worldSlug}\n\n- summary index: \`campaigns/world-library/worlds/${r.worldSlug}/curated/stories/original-summary-index.json\`\n- plot graph: \`${r.graphPath}\`\n`;
    for (const inc of r.increments) md += `- increment: \`${inc}\`\n`;
    md += '\n';
  }
  fs.writeFileSync(path.join(outDir, 'iteration-auto-pass-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: true, worlds: reports.length, reports }, null, 2));
}

main();
