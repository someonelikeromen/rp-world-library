const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

const WORLD_TERMS = {
  danmachi: {
    characters: ['贝尔','赫斯缇雅','艾丝','莉莉','莉莉露卡','韦尔夫','琉','芙蕾雅','希儿','奥它','芬恩','里维莉雅','格瑞斯','蒂奥娜','蒂奥涅','蕾菲亚','荷米斯','阿波罗','伊丝塔','春姬','命','阿伊莎','芙里尼','费尔斯','乌拉诺斯','狄克斯','薇妮','阿斯特莉亚','阿尔戈'],
    places: ['欧拉丽','地下城','第18层','中层','欢乐街','女神娼殿','巴别塔','黄昏馆','迦尼萨眷族','代达罗斯街'],
    terms: ['眷族','法尔纳','魔法','技能','冒险者','战争游戏','异端儿','怪物','杀生石','黑色歌利亚','远征','Lv.']
  },
  campione: {
    characters: ['护堂','艾莉卡','佑理','莉莉娅娜','雅典娜','沃班','罗濠','萨尔巴特雷','爱莎','潘多拉','草薙','万里谷','露库拉齐亚','安妮','兰斯洛特'],
    places: ['撒丁岛','日本','罗马','米兰','东京','格林尼治','神域','特洛伊','幽界'],
    terms: ['弑神者','不顺从之神','权能','乌鲁斯拉格纳','韦勒斯拉纳','梅尔卡托','神祖','圣杯','最后之王','诸神黄昏']
  },
  'rakudai-kishi': {
    characters: ['一辉','史黛菈','珠雫','绫辻','东堂刀华','黑铁','有栖院','王马','西京宁音','爱德怀斯','晓学园'],
    places: ['破军学园','七星剑武祭','法米利昂','日本','联盟'],
    terms: ['伐刀者','固有灵装','魔人','骑士','落第骑士','剑士杀手','解放军','比翼','一刀修罗','一刀罗刹']
  },
  'saijaku-muhai-bahamut': {
    characters: ['路克斯','莉夏','库露露席法','菲尔菲','赛莉丝','夜架','爱理','塞莉丝','海兹','葛莱法'],
    places: ['学园','王国','帝国','遗迹','大圣域','阿卡迪亚'],
    terms: ['机龙','神装机龙','巴哈姆特','圣蚀','七龙骑圣','龙匪贼','乌洛波洛斯','装甲机龙','古代兵器']
  },
  'hidan-no-aria': {
    characters: ['明里','亚莉亚','志乃','麒麟','莱卡','白雪','夹竹桃','远山','岛麒麟','乾樱','间宫'],
    places: ['武侦高','东京','星伽','海猫'],
    terms: ['武侦','战姊妹','AA','间宫','星伽','狙击','强袭科','侦探科']
  }
};

const ARC_RULES = [
  { id: 'danmachi-war-game', world: 'danmachi', re: /战争游戏|Goddess War|阿波罗|攻城|城寨|雅辛托斯/, label: '战争游戏 / 派阀冲突' },
  { id: 'danmachi-haruhime', world: 'danmachi', re: /春姬|伊丝塔|欢乐街|娼|吉原|杀生石|狐兔|阿伊莎|芙里尼/, label: '欢乐街 / 春姬与伊丝塔眷族' },
  { id: 'danmachi-xenos', world: 'danmachi', re: /异端儿|薇妮|狄克斯|伊刻洛斯|费尔斯|乌拉诺斯|代达罗斯/, label: '异端儿 / 地下城异种族线' },
  { id: 'danmachi-expedition', world: 'danmachi', re: /第18层|中层|远征|黑色歌利亚|歌利亚|怪物奉送/, label: '中层远征 / 地下城危机' },
  { id: 'danmachi-ryu', world: 'danmachi', re: /琉|疾风|阿斯特莉亚|正义|深层|朱庇特/, label: '琉 / 阿斯特莉亚相关线' },
  { id: 'danmachi-freya', world: 'danmachi', re: /芙蕾雅|希儿|女神祭|奥它|大战派阀/, label: '芙蕾雅 / 希儿主线' },
  { id: 'danmachi-so', world: 'danmachi', re: /剑姬|艾丝|洛基眷族|蕾菲亚|仙精|怪人|远征/, label: '剑姬神圣谭 / 洛基眷族线' },
  { id: 'campione-godslayer', world: 'campione', re: /弑神者|不顺从之神|权能|雅典娜|乌鲁斯拉格纳|梅尔卡托|沃班|罗濠|最后之王|神域/, label: '弑神者与权能神话线' },
  { id: 'rakudai-blazer', world: 'rakudai-kishi', re: /七星剑武祭|伐刀者|固有灵装|解放军|法米利昂|魔人|剑士杀手|一刀修罗|一刀罗刹/, label: '伐刀者 / 学园与大赛线' },
  { id: 'bahamut-dragride', world: 'saijaku-muhai-bahamut', re: /机龙|神装机龙|遗迹|圣蚀|七龙骑圣|大圣域|王国|帝国|巴哈姆特/, label: '机龙 / 遗迹与国家冲突线' },
  { id: 'hidan-aa-butei', world: 'hidan-no-aria', re: /武侦|战姊妹|间宫|星伽|夹竹桃|岛麒麟|AA/, label: '武侦 / 战姊妹与AA支线' }
];

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2), 'utf8'); }
function escapePipe(s) { return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }
function safeId(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100); }
function rx(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function count(text, term) { return (text.match(new RegExp(rx(term), 'g')) || []).length; }
function compactText(text) { return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim(); }
function chapterType(title) {
  if (/序章|楔子|Prologue/i.test(title)) return 'prologue';
  if (/终章|尾声|Epilogue/i.test(title)) return 'epilogue';
  if (/后记/.test(title)) return 'afterword';
  if (/特典|短篇|番外|SS/.test(title)) return 'bonus';
  return 'chapter';
}
function positions(text, terms) {
  const len = Math.max(text.length, 1);
  const out = [];
  for (const term of terms) {
    const i = text.indexOf(term);
    if (i >= 0) out.push({ term, part: i < len / 3 ? 'early' : i < len * 2 / 3 ? 'middle' : 'late' });
  }
  return out;
}
function splitSignals(text) {
  const cleaned = compactText(text);
  const paras = cleaned.split(/\n{2,}|。|！|？/).map(s => s.trim()).filter(s => s.length > 8);
  return { paragraphCount: paras.length, charCount: cleaned.replace(/\s/g, '').length };
}
function classifyArcs(world, title, allTerms) {
  const target = `${title} ${allTerms.join(' ')}`;
  return ARC_RULES.filter(r => r.world === world && r.re.test(target)).map(r => ({ id: r.id, label: r.label }));
}
function readChapter(world, file) {
  const p = path.join(ROOT, world, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function chapterEvent(world, series, volume, ch) {
  const text = readChapter(world, ch.file);
  const bank = WORLD_TERMS[world] || { characters: [], places: [], terms: [] };
  const categories = {};
  for (const [cat, terms] of Object.entries(bank)) {
    categories[cat] = terms.map(term => ({ term, count: count(text, term) })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  }
  const allTop = [...categories.characters, ...categories.places, ...categories.terms].sort((a, b) => b.count - a.count).slice(0, 18).map(x => x.term);
  const arcs = classifyArcs(world, ch.title, allTop);
  const sig = splitSignals(text);
  const eventType = chapterType(ch.title);
  const summary = buildChapterEventSummary(ch, eventType, arcs, categories, sig);
  return {
    id: `orig-${safeId(series.seriesSlug)}-${volume.dir}-ch-${String(ch.idx).padStart(2, '0')}`,
    worldId: world,
    series: series.seriesSlug,
    volume: volume.dir,
    chapterIndex: ch.idx,
    chapterTitle: ch.title,
    type: 'chapter-event',
    eventType,
    summary,
    arcs,
    characters: categories.characters.slice(0, 10).map(x => x.term),
    places: categories.places.slice(0, 8).map(x => x.term),
    terms: categories.terms.slice(0, 10).map(x => x.term),
    topMentionCounts: [...categories.characters, ...categories.places, ...categories.terms].sort((a, b) => b.count - a.count).slice(0, 16),
    mentionPositions: positions(text, allTop.slice(0, 10)),
    paragraphCount: sig.paragraphCount,
    charCount: ch.chars || sig.charCount,
    sourceRef: ch.file,
    spoilerLevel: 'chapter-event-refined',
    originalTextBacked: true
  };
}
function buildChapterEventSummary(ch, eventType, arcs, categories, sig) {
  const people = categories.characters.slice(0, 5).map(x => `${x.term}(${x.count})`).join('、') || '无高频人物命中';
  const places = categories.places.slice(0, 3).map(x => `${x.term}(${x.count})`).join('、') || '无地点命中';
  const terms = categories.terms.slice(0, 5).map(x => `${x.term}(${x.count})`).join('、') || '无术语命中';
  const arcText = arcs.length ? arcs.map(a => a.label).join('；') : '未触发弧线规则';
  const role = eventType === 'afterword' ? '后记/作者说明' : eventType === 'bonus' ? '特典/番外' : eventType === 'prologue' ? '开端铺垫' : eventType === 'epilogue' ? '卷末收束' : '正文章节推进';
  return `《${ch.title}》被归类为${role}。源文本规模约 ${sig.charCount} 字、${sig.paragraphCount} 个段落；高频人物为 ${people}，地点为 ${places}，术语/设定为 ${terms}。弧线判定：${arcText}。`;
}
function volumeMarkdownBlock(events) {
  let md = '## 章节事件索引\n\n';
  md += '| 序号 | 类型 | 弧线 | 人物 | 地点 | 术语 | 事件摘要 |\n|---:|---|---|---|---|---|---|\n';
  for (const e of events) {
    md += `| ${e.chapterIndex} | ${e.eventType} | ${escapePipe(e.arcs.map(a => a.label).join('；') || '—')} | ${escapePipe(e.characters.slice(0, 5).join('、') || '—')} | ${escapePipe(e.places.slice(0, 3).join('、') || '—')} | ${escapePipe(e.terms.slice(0, 5).join('、') || '—')} | ${escapePipe(e.summary)} |\n`;
  }
  md += '\n';
  return md;
}
function upsertChapterEventSection(summaryPath, events) {
  let text = fs.existsSync(summaryPath) ? fs.readFileSync(summaryPath, 'utf8') : '';
  if (!text) return false;
  const block = volumeMarkdownBlock(events);
  if (/## 章节事件索引\n[\s\S]*?(?=\n## |$)/.test(text)) {
    text = text.replace(/## 章节事件索引\n[\s\S]*?(?=\n## |$)/, block.trimEnd());
  } else if (text.includes('## 抽取候选')) {
    text = text.replace('\n## 抽取候选', `\n${block}## 抽取候选`);
  } else {
    text += `\n\n${block}`;
  }
  text = text.replace(/状态：refined-source-backed/g, '状态：chapter-event-refined');
  text = text.replace(/剧透等级：refined-source-backed/g, '剧透等级：chapter-event-refined');
  fs.writeFileSync(summaryPath, text, 'utf8');
  return true;
}
function processWorld(world) {
  const manifestPath = path.join(ROOT, world, 'sources', 'raw-text-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  const storiesRoot = path.join(ROOT, world, 'curated', 'stories');
  ensureDir(storiesRoot);
  const graphPath = path.join(ROOT, world, 'curated', 'plot-graph.json');
  const graph = fs.existsSync(graphPath) ? readJson(graphPath) : { schema: 'rp-plot-graph-v1', worldId: world, nodes: [], edges: [] };
  if (!Array.isArray(graph.nodes)) graph.nodes = [];
  if (!Array.isArray(graph.edges)) graph.edges = [];
  const nodeMap = new Map(graph.nodes.map((n, i) => [n.id, i]));
  const edgeKeys = new Set(graph.edges.map(e => `${e.from}::${e.to}::${e.type}`));
  const worldReport = { world, series: [], chapters: 0, eventNodesAdded: 0, eventNodesUpdated: 0, edgesAdded: 0, summariesUpdated: 0 };
  for (const series of manifest.series || []) {
    const events = [];
    const seriesReport = { series: series.seriesSlug, volumes: 0, chapters: 0 };
    for (const volume of series.volumes || []) {
      seriesReport.volumes++;
      const volumeEvents = [];
      const volumeNodeId = `orig-${safeId(series.seriesSlug)}-${volume.dir}`;
      let prevChapter = null;
      for (const ch of volume.chapters || []) {
        const event = chapterEvent(world, series, volume, ch);
        volumeEvents.push(event);
        events.push(event);
        seriesReport.chapters++;
        worldReport.chapters++;
        if (nodeMap.has(event.id)) {
          graph.nodes[nodeMap.get(event.id)] = { ...graph.nodes[nodeMap.get(event.id)], ...event };
          worldReport.eventNodesUpdated++;
        } else {
          graph.nodes.push(event);
          nodeMap.set(event.id, graph.nodes.length - 1);
          worldReport.eventNodesAdded++;
        }
        const containsKey = `${volumeNodeId}::${event.id}::contains-chapter-event`;
        if (!edgeKeys.has(containsKey)) {
          graph.edges.push({ from: volumeNodeId, to: event.id, type: 'contains-chapter-event', sourceRefs: [event.sourceRef] });
          edgeKeys.add(containsKey);
          worldReport.edgesAdded++;
        }
        if (prevChapter) {
          const orderKey = `${prevChapter}::${event.id}::chapter-next`;
          if (!edgeKeys.has(orderKey)) {
            graph.edges.push({ from: prevChapter, to: event.id, type: 'chapter-next', sourceRefs: [event.sourceRef] });
            edgeKeys.add(orderKey);
            worldReport.edgesAdded++;
          }
        }
        prevChapter = event.id;
      }
      const summaryPath = path.join(ROOT, world, 'curated', 'stories', 'summaries', series.seriesSlug, `${volume.dir}.md`);
      if (upsertChapterEventSection(summaryPath, volumeEvents)) worldReport.summariesUpdated++;
    }
    const inc = { schema: 'rp-chapter-event-increment-v1', worldId: world, series: series.seriesSlug, createdAt: NOW, events };
    writeJson(path.join(storiesRoot, `original-chapter-events-${series.seriesSlug}-refined-all.json`), inc);
    worldReport.series.push(seriesReport);
  }
  graph.generatedAt = NOW;
  writeJson(graphPath, graph);
  worldReport.graph = { nodes: graph.nodes.length, edges: graph.edges.length };
  return worldReport;
}
function validateCoverage(reports) {
  const missing = [];
  for (const r of reports) {
    for (const s of r.series) {
      const incPath = path.join(ROOT, r.world, 'curated', 'stories', `original-chapter-events-${s.series}-refined-all.json`);
      const inc = readJson(incPath);
      if ((inc.events || []).length !== s.chapters) missing.push(`${r.world}/${s.series}: increment events ${inc.events.length} != manifest chapters ${s.chapters}`);
    }
  }
  return missing;
}
function main() {
  const worlds = fs.readdirSync(ROOT).filter(w => fs.existsSync(path.join(ROOT, w, 'sources', 'raw-text-manifest.json'))).sort();
  const reports = worlds.map(processWorld).filter(Boolean);
  const missing = validateCoverage(reports);
  ensureDir(REPORT_DIR);
  writeJson(path.join(REPORT_DIR, 'chapter-event-refinement-report.json'), { createdAt: NOW, reports, missing });
  let md = `# Chapter Event Refinement Report\n\n更新日期：${NOW}\n\n`;
  md += '本轮对所有可用小说 raw-text 执行章节事件层精修：每章生成 chapter-event 节点、人物/地点/术语命中、弧线判定和源文件指针，并回写到逐卷摘要。\n\n';
  md += '| world | series | chapters | event nodes added | event nodes updated | edges added | summaries updated | graph |\n|---|---:|---:|---:|---:|---:|---:|---:|\n';
  for (const r of reports) md += `| ${r.world} | ${r.series.length} | ${r.chapters} | ${r.eventNodesAdded} | ${r.eventNodesUpdated} | ${r.edgesAdded} | ${r.summariesUpdated} | ${r.graph.nodes}/${r.graph.edges} |\n`;
  md += `\nCoverage issues: ${missing.length}\n`;
  if (missing.length) md += '\n' + missing.map(x => `- ${x}`).join('\n') + '\n';
  fs.writeFileSync(path.join(REPORT_DIR, 'chapter-event-refinement-report.md'), md, 'utf8');
  console.log(JSON.stringify({ ok: missing.length === 0, reports, missing }, null, 2));
}
main();
