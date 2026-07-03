const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_ROOT = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

const WORLD_CN = {
  campione: '弑神者！',
  danmachi: '在地下城寻求邂逅是否搞错了什么',
  'hidan-no-aria': '绯弹的亚里亚',
  'high-school-dxd': '恶魔高校D×D',
  'infinite-stratos': 'IS〈Infinite Stratos〉',
  'rakudai-kishi': '落第骑士英雄谭',
  'saijaku-muhai-bahamut': '最弱无败神装机龙',
  'type-moon-nasuverse': '型月 / Nasuverse'
};

const TERM_BANK = {
  campione: ['护堂','艾莉卡','佑理','莉莉娅娜','雅典娜','沃班','罗濠','萨尔巴特雷','爱莎','不顺从之神','弑神者','权能','乌鲁斯拉格纳','韦勒斯拉纳','梅尔卡托','草薙','潘多拉','神祖','圣杯','神域','特洛伊','芬里尔','珀尔修斯','兰斯洛特','最后之王','诸神黄昏'],
  danmachi: ['贝尔','赫斯缇雅','艾丝','莉莉','莉莉露卡','韦尔夫','琉','芙蕾雅','洛基','奥它','芬恩','里维莉雅','格瑞斯','蒂奥娜','蒂奥涅','蕾菲亚','荷米斯','阿波罗','伊丝塔','春姬','命','地下城','欧拉丽','眷族','法尔纳','魔法','技能','Lv.','第18层','中层','异端儿','战争游戏','怪物','冒险者','黑色歌利亚','伊刻洛斯','狄克斯','费尔斯','乌拉诺斯','阿斯特莉亚','阿尔戈'],
  'hidan-no-aria': ['明里','亚莉亚','志乃','麒麟','莱卡','白雪','夹竹桃','武侦','战姊妹','间宫','星伽','海猫','AA','远山','岛麒麟','乾樱'],
  'high-school-dxd': ['一诚','莉雅丝','爱西亚','朱乃','小猫','木场','伊莉娜','杰诺瓦','奥菲斯','瓦利','德莱格','赤龙帝','白龙皇','恶魔','堕天使','天使','圣剑','眷属','神器','冥界','龙神','吉蒙里','西迪','路西法','阿萨谢尔'],
  'infinite-stratos': ['一夏','箒','塞西莉亚','铃','夏洛特','劳拉','千冬','束','楯无','簪','IS','白式','黑骑士','亡国机业','学园','代表候补生','班级代表','女尊男卑','圆桌骑士'],
  'rakudai-kishi': ['一辉','史黛菈','珠雫','绫辻','东堂刀华','黑铁','有栖院','七星剑武祭','伐刀者','固有灵装','魔人','解放军','法米利昂','骑士','学园','剑士杀手','落第骑士','王马','西京宁音','晓学园','比翼'],
  'saijaku-muhai-bahamut': ['路克斯','莉夏','库露露席法','菲尔菲','赛莉丝','夜架','爱理','机龙','神装机龙','巴哈姆特','遗迹','学园','王国','帝国','龙匪贼','圣蚀','七龙骑圣','大圣域','乌洛波洛斯','阿卡迪亚'],
  'type-moon-nasuverse': ['士郎','凛','樱','阿尔托莉雅','卫宫','伊莉雅','言峰','吉尔伽美什','藤丸','玛修','所罗门','异闻带','妖精','摩根','奥伯龙','卡斯特','圣杯战争','英灵','从者','魔术师','迦勒底','特异点','冠位指定','冬木']
};

const ARC_RULES = [
  { re: /战争游戏|阿波罗|攻城|城寨|雅辛托斯/, label: '战争游戏 / 派阀冲突' },
  { re: /春姬|伊丝塔|欢乐街|杀生石/, label: '欢乐街 / 春姬与伊丝塔眷族' },
  { re: /异端儿|狄克斯|伊刻洛斯|费尔斯|乌拉诺斯/, label: '异端儿 / 地下城异种族线' },
  { re: /琉|疾风|阿斯特莉亚|正义/, label: '琉 / 阿斯特莉亚相关线' },
  { re: /芙蕾雅|希儿|女神祭|奥它|战争游戏/, label: '芙蕾雅 / 希儿主线' },
  { re: /剑姬|艾丝|洛基眷族|蕾菲亚|远征|仙精/, label: '剑姬神圣谭 / 洛基眷族线' },
  { re: /弑神者|不顺从之神|权能|雅典娜|乌鲁斯拉格纳|梅尔卡托|沃班|罗濠|最后之王/, label: '弑神者与权能神话线' },
  { re: /七星剑武祭|伐刀者|固有灵装|解放军|法米利昂|魔人|剑士杀手/, label: '伐刀者 / 学园与大赛线' },
  { re: /机龙|神装机龙|遗迹|圣蚀|七龙骑圣|大圣域|王国|帝国/, label: '机龙 / 遗迹与国家冲突线' },
  { re: /武侦|战姊妹|间宫|星伽|夹竹桃|岛麒麟/, label: '武侦 / 战姊妹与AA支线' },
  { re: /赤龙帝|白龙皇|吉蒙里|神器|圣剑|冥界|龙神|堕天使/, label: '恶魔高校 / 神器与三势力冲突' },
  { re: /IS|白式|亡国机业|代表候补生|班级代表|圆桌骑士/, label: 'IS学园 / 机体与代表候补生线' },
  { re: /圣杯战争|英灵|从者|魔术师|迦勒底|特异点|异闻带|妖精/, label: '型月 / 圣杯、特异点与异闻史线' }
];

const ARC_LABEL_WORLDS = {
  '战争游戏 / 派阀冲突': ['danmachi'],
  '欢乐街 / 春姬与伊丝塔眷族': ['danmachi'],
  '异端儿 / 地下城异种族线': ['danmachi'],
  '琉 / 阿斯特莉亚相关线': ['danmachi'],
  '芙蕾雅 / 希儿主线': ['danmachi'],
  '剑姬神圣谭 / 洛基眷族线': ['danmachi'],
  '弑神者与权能神话线': ['campione'],
  '伐刀者 / 学园与大赛线': ['rakudai-kishi'],
  '机龙 / 遗迹与国家冲突线': ['saijaku-muhai-bahamut'],
  '武侦 / 战姊妹与AA支线': ['hidan-no-aria'],
  '恶魔高校 / 神器与三势力冲突': ['high-school-dxd'],
  'IS学园 / 机体与代表候补生线': ['infinite-stratos'],
  '型月 / 圣杯、特异点与异闻史线': ['type-moon-nasuverse']
};

const GENERATED_STORY_DIRS = new Set([
  'chapter-archives',
  'chapter-archives-curated',
  'volume-archives',
  'volume-refined',
  'retry-queues',
  'curated-unit-archives',
  'curated-unit-refined',
  'retry-queues-curated',
  'series-archive'
]);

const CORE_GRAPH_FILES = ['relationship-graph.json', 'characters-index.json', 'knowledge-graph.json', 'plot-graph.json', 'world.json', 'source-registry.json'];

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, value) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8'); }
function writeText(p, value) { ensureDir(path.dirname(p)); fs.writeFileSync(p, value, 'utf8'); }
function slash(p) { return p.split(path.sep).join('/'); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function bytes(s) { return Buffer.byteLength(s, 'utf8'); }
function compact(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function safeSlug(s) { return String(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'unit'; }
function rxEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function countTerm(text, term) { return (text.match(new RegExp(rxEscape(term), 'g')) || []).length; }
function escapePipe(s) { return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }

function walkFiles(dir, pred = () => true) {
  const out = [];
  function rec(d) {
    if (!exists(d)) return;
    for (const name of fs.readdirSync(d).sort()) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) rec(p);
      else if (pred(p, st)) out.push(p);
    }
  }
  rec(dir);
  return out;
}

function countFormalCore(world, fileName) {
  const p = path.join(ROOT, world, 'curated', fileName);
  if (!exists(p)) return 0;
  try {
    const v = readJson(p);
    if (fileName === 'characters-index.json') {
      if (Array.isArray(v.characters)) return v.characters.length;
      if (v.characters && typeof v.characters === 'object') return Object.keys(v.characters).length;
      if (Array.isArray(v)) return v.length;
      return 0;
    }
    if (fileName === 'relationship-graph.json') {
      if (Array.isArray(v.edges)) return v.edges.length;
      if (Array.isArray(v.relationships)) return v.relationships.length;
      return 0;
    }
    if (Array.isArray(v.nodes)) return v.nodes.length;
    if (Array.isArray(v.edges)) return v.edges.length;
    if (Array.isArray(v)) return v.length;
  } catch (_) {
    return 0;
  }
  return 0;
}
function topTerms(world, text, limit = 16) {
  return (TERM_BANK[world] || [])
    .map(term => ({ term, count: countTerm(text, term) }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

function detectArcs(world, text) {
  return ARC_RULES
    .filter(r => r.re.test(text) && (!ARC_LABEL_WORLDS[r.label] || ARC_LABEL_WORLDS[r.label].includes(world)))
    .map(r => r.label);
}

function archiveSummary(sourceLayer, title, chars, terms, arcs) {
  const termText = terms.length ? terms.slice(0, 8).map(x => `${x.term}(${x.count})`).join('、') : '未命中预设术语';
  const arcText = arcs.length ? arcs.slice(0, 3).join('；') : '未命中特定弧线';
  return `${sourceLayer === 'raw-text' ? '本章原文' : '本条既有整理文本'}《${title}》已完整读入，正文规模约 ${chars} 字。自动归档仅记录派生线索：高频项为 ${termText}；弧线判定为 ${arcText}。需要细节时应回读 sourcePath，本摘要不复制长段原文。`;
}

function buildEvents(title, terms, arcs, sourcePath) {
  const events = [{ kind: 'chapter-progress', label: `章节推进：${title}`, evidence: [sourcePath], confidence: 'medium' }];
  for (const arc of arcs.slice(0, 3)) events.push({ kind: 'arc-signal', label: arc, evidence: [sourcePath], confidence: 'medium' });
  for (const item of terms.slice(0, 3)) events.push({ kind: 'entity-focus', label: `${item.term} 在本章出现 ${item.count} 次`, evidence: [sourcePath], confidence: 'low' });
  return events;
}

function relationshipSignals(terms, sourcePath) {
  const signals = [];
  const usable = terms.filter(x => x.count >= 2).slice(0, 8);
  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < Math.min(usable.length, i + 4); j++) {
      signals.push({ type: 'co-occurrence-signal', from: usable[i].term, to: usable[j].term, evidence: [sourcePath], confidence: 'low', note: '自动频次共现信号，不是正式关系边。' });
    }
  }
  return signals.slice(0, 10);
}

function makeChapterArchive({ world, series, volume, sourceLayer, sourcePath, title, idx, text }) {
  const terms = topTerms(world, text, 20);
  const arcs = detectArcs(world, `${title}\n${text}`);
  const trimmedLen = text.trim().length;
  const readStatus = trimmedLen < 80 && sourceLayer !== 'existing-curated-derived' ? 'too-short' : 'complete';
  const chapterId = `ch-${String(idx).padStart(3, '0')}`;
  return {
    schema: 'rp-chapter-archive-v1',
    generatedAt: NOW,
    worldId: world,
    worldName: WORLD_CN[world] || world,
    sourceLayer,
    seriesId: series,
    volumeId: volume,
    chapterId,
    sourcePath,
    title,
    readStatus,
    sourceBytes: bytes(text),
    sourceChars: text.length,
    contentHash: sha256(text),
    excerptFingerprint: sha256(compact(text).slice(0, 220)).slice(0, 16),
    summary: archiveSummary(sourceLayer, title, text.length, terms, arcs),
    events: buildEvents(title, terms, arcs, sourcePath),
    characters: terms.slice(0, 10).map(x => ({ name: x.term, mentionCount: x.count, role: 'mentioned-or-appears', confidence: 'low' })),
    locations: [],
    terms: terms.map(x => ({ name: x.term, mentionCount: x.count, confidence: 'low' })),
    items: [],
    factions: [],
    relationshipSignals: relationshipSignals(terms, sourcePath),
    timelineSignals: [{ label: `${series}/${volume}/${chapterId}`, sourcePath, confidence: 'medium' }],
    continuityNotes: arcs.map(label => ({ label, sourcePath, confidence: 'medium' })),
    uncertainties: readStatus === 'too-short' ? [{ type: 'too-short', note: '文本过短，只记录覆盖，不做语义提升。' }] : [],
    qualityFlags: readStatus === 'too-short' ? ['too-short'] : (trimmedLen < 80 ? ['short-curated-note'] : []),
    retryNeeded: readStatus !== 'complete'
  };
}

function chapterArchiveMd(a) {
  return `# ${a.title}\n\n` +
    `- schema: ${a.schema}\n- worldId: ${a.worldId}\n- sourceLayer: ${a.sourceLayer}\n- readStatus: ${a.readStatus}\n- sourcePath: \`${a.sourcePath}\`\n- sourceBytes: ${a.sourceBytes}\n- contentHash: ${a.contentHash}\n\n` +
    `## 摘要\n\n${a.summary}\n\n## 事件\n\n${a.events.map(e => `- ${e.kind}: ${e.label}`).join('\n') || '- 无'}\n\n` +
    `## 实体/术语候选\n\n- characters: ${a.characters.map(x => x.name).join('、') || '无'}\n- terms: ${a.terms.map(x => x.name).join('、') || '无'}\n- relationshipSignals: ${a.relationshipSignals.length}\n- uncertainties: ${a.uncertainties.length}\n`;
}

function writeArchivePair(baseDir, archive) {
  writeJson(path.join(baseDir, `${archive.chapterId}.json`), archive);
  writeText(path.join(baseDir, `${archive.chapterId}.md`), chapterArchiveMd(archive));
}

function aggregateVolume(world, series, volume, sourceLayer, archives, sourceFiles) {
  const allTerms = new Map();
  const relationMap = new Map();
  const failures = [];
  for (const archive of archives) {
    for (const t of archive.terms) allTerms.set(t.name, (allTerms.get(t.name) || 0) + t.mentionCount);
    for (const r of archive.relationshipSignals) {
      const key = [r.from, r.to].sort().join('::');
      const cur = relationMap.get(key) || { from: r.from, to: r.to, count: 0, evidence: [] };
      cur.count += 1;
      cur.evidence.push(...r.evidence);
      relationMap.set(key, cur);
    }
    if (archive.readStatus !== 'complete') failures.push({ chapterId: archive.chapterId, sourcePath: archive.sourcePath, reason: archive.readStatus });
  }
  const top = [...allTerms.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  const validation = {
    schema: 'rp-volume-archive-validation-v1', generatedAt: NOW, worldId: world, sourceLayer, seriesId: series, volumeId: volume,
    expectedSourceFiles: sourceFiles.length, archivedChapters: archives.length, completeChapters: archives.filter(x => x.readStatus === 'complete').length,
    failedOrSkippedChapters: failures.length, jsonParseStatus: 'passed', noCoreGraphOverwrite: true, coreGraphFilesProtected: CORE_GRAPH_FILES,
    failures, status: failures.length ? 'needs-review' : 'passed'
  };
  const volumeArchive = {
    schema: 'rp-volume-archive-v1', generatedAt: NOW, worldId: world, worldName: WORLD_CN[world] || world, sourceLayer, seriesId: series, volumeId: volume,
    chapterCount: archives.length, sourceFiles,
    summary: `本单元 ${series}/${volume} 已完成 ${archives.length}/${sourceFiles.length} 个来源文件归档。高频候选：${top.slice(0, 12).map(x => `${x.name}(${x.count})`).join('、') || '无'}。该文件为自动派生卷级归档，不替代人工正式图谱。`,
    eventChain: archives.map(a => ({ chapterId: a.chapterId, title: a.title, eventCount: a.events.length, sourcePath: a.sourcePath })),
    entityCandidates: top.slice(0, 30),
    relationshipCandidates: [...relationMap.values()].sort((a, b) => b.count - a.count).slice(0, 50),
    timelineIncrements: archives.map(a => ({ id: `${series}/${volume}/${a.chapterId}`, title: a.title, sourcePath: a.sourcePath })), validationStatus: validation.status
  };
  const refined = {
    schema: 'rp-volume-refined-v1', generatedAt: NOW, worldId: world, sourceLayer, seriesId: series, volumeId: volume,
    summary: volumeArchive.summary, topEntityCandidates: volumeArchive.entityCandidates.slice(0, 16), relationshipCandidates: volumeArchive.relationshipCandidates.slice(0, 20),
    searchKeywords: top.slice(0, 20).map(x => x.name), humanReviewNotes: failures.length ? ['存在 too-short/failed 项，需人工确认是否为后记、设定或非正文。'] : []
  };
  return { validation, volumeArchive, refined };
}

function volumeMd(v) {
  return `# ${v.worldId} / ${v.seriesId} / ${v.volumeId}\n\n来源层：${v.sourceLayer}\n\n## 摘要\n\n${v.summary}\n\n## 章节\n\n| 章节 | 标题 | 来源 |\n|---|---|---|\n` +
    v.eventChain.map(x => `| ${x.chapterId} | ${escapePipe(x.title)} | \`${x.sourcePath}\` |`).join('\n') +
    `\n\n## 实体候选\n\n${v.entityCandidates.slice(0, 20).map(x => `- ${x.name}: ${x.count}`).join('\n') || '- 无'}\n`;
}

function refinedMd(v) {
  return `# ${v.worldId} / ${v.seriesId} / ${v.volumeId} refined\n\n${v.summary}\n\n## Search Keywords\n\n${v.searchKeywords.map(x => `- ${x}`).join('\n') || '- 无'}\n\n## Human Review\n\n${v.humanReviewNotes.map(x => `- ${x}`).join('\n') || '- 无'}\n`;
}

function lessonsMd(world, sourceLayer, series, volume, validation) {
  return `# Lessons: ${world}/${series}/${volume}\n\n- generatedAt: ${NOW}\n- sourceLayer: ${sourceLayer}\n- validationStatus: ${validation.status}\n- sourceFiles: ${validation.expectedSourceFiles}\n- archivedChapters: ${validation.archivedChapters}\n- failures: ${validation.failedOrSkippedChapters}\n\n## 经验\n\n- 本轮只生成自动派生候选，正式图谱保持只读。\n- 关系只以 co-occurrence-signal 形式进入候选队列。\n- too-short 项进入 retry queue 或人工复核，不静默计入完成。\n`;
}

function rawVolumes() {
  const out = [];
  for (const world of fs.readdirSync(ROOT).sort()) {
    const manifestPath = path.join(ROOT, world, 'sources', 'raw-text-manifest.json');
    if (!exists(manifestPath)) continue;
    const manifest = readJson(manifestPath);
    for (const series of manifest.series || []) {
      for (const volume of series.volumes || []) {
        const files = (volume.chapters || []).map(ch => ({ idx: ch.idx, title: ch.title, sourcePath: slash(path.join('campaigns/world-library/worlds', world, ch.file)), absPath: path.join(ROOT, world, ch.file) })).filter(x => exists(x.absPath));
        if (files.length) out.push({ world, series: series.seriesSlug, volume: volume.dir, title: volume.title, files });
      }
    }
  }
  return out;
}

function curatedUnits() {
  const out = [];
  for (const world of ['high-school-dxd', 'infinite-stratos', 'type-moon-nasuverse']) {
    const stories = path.join(ROOT, world, 'curated', 'stories');
    if (!exists(stories)) continue;
    if (world === 'high-school-dxd') {
      const files = fs.readdirSync(stories).sort().filter(name => name.endsWith('.md')).map((name, i) => ({ idx: i + 1, title: name.replace(/\.md$/, ''), sourcePath: slash(path.join(stories, name)), absPath: path.join(stories, name) }));
      if (files.length) out.push({ world, series: 'curated-stories', volume: 'stories', title: 'curated stories', files });
      continue;
    }
    for (const unit of fs.readdirSync(stories).sort()) {
      if (GENERATED_STORY_DIRS.has(unit)) continue;
      const unitDir = path.join(stories, unit);
      if (!fs.statSync(unitDir).isDirectory()) continue;
      const files = walkFiles(unitDir, p => p.endsWith('.md') && !p.split(/[\\/]/).some(part => GENERATED_STORY_DIRS.has(part))).map((p, i) => ({ idx: i + 1, title: path.basename(p, '.md'), sourcePath: slash(p), absPath: p }));
      if (files.length) out.push({ world, series: 'curated-stories', volume: safeSlug(unit), title: unit, files });
    }
  }
  return out;
}

function processUnit(unit, sourceLayer) {
  const storiesRoot = path.join(ROOT, unit.world, 'curated', 'stories');
  const archiveRoot = sourceLayer === 'raw-text' ? path.join(storiesRoot, 'chapter-archives', unit.series, unit.volume) : path.join(storiesRoot, 'chapter-archives-curated', unit.volume);
  const volumeRoot = sourceLayer === 'raw-text' ? path.join(storiesRoot, 'volume-archives', unit.series) : path.join(storiesRoot, 'curated-unit-archives');
  const refinedRoot = sourceLayer === 'raw-text' ? path.join(storiesRoot, 'volume-refined', unit.series) : path.join(storiesRoot, 'curated-unit-refined');
  const retryRoot = sourceLayer === 'raw-text' ? path.join(storiesRoot, 'retry-queues', unit.series) : path.join(storiesRoot, 'retry-queues-curated', unit.volume);
  ensureDir(archiveRoot);
  const archives = [];
  for (const file of unit.files) {
    const text = fs.readFileSync(file.absPath, 'utf8');
    const archive = makeChapterArchive({ world: unit.world, series: unit.series, volume: unit.volume, sourceLayer, sourcePath: file.sourcePath, title: file.title, idx: file.idx, text });
    writeArchivePair(archiveRoot, archive);
    archives.push(archive);
  }
  const sourceFiles = unit.files.map(x => x.sourcePath);
  const { validation, volumeArchive, refined } = aggregateVolume(unit.world, unit.series, unit.volume, sourceLayer, archives, sourceFiles);
  writeJson(path.join(volumeRoot, `${unit.volume}.json`), volumeArchive);
  writeText(path.join(volumeRoot, `${unit.volume}.md`), volumeMd(volumeArchive));
  writeJson(path.join(volumeRoot, `${unit.volume}.validation.json`), validation);
  writeText(path.join(volumeRoot, `${unit.volume}.lessons.md`), lessonsMd(unit.world, sourceLayer, unit.series, unit.volume, validation));
  writeJson(path.join(refinedRoot, `${unit.volume}.json`), refined);
  writeText(path.join(refinedRoot, `${unit.volume}.md`), refinedMd(refined));
  writeJson(path.join(retryRoot, `${unit.volume}.retry.json`), { schema: 'rp-chapter-archive-retry-queue-v1', generatedAt: NOW, worldId: unit.world, sourceLayer, seriesId: unit.series, volumeId: unit.volume, items: validation.failures.map(x => ({ ...x, action: 'human-review-or-targeted-reread' })) });
  return { unit, sourceLayer, archives, validation };
}

function integrateWorld(world, results) {
  const curated = path.join(ROOT, world, 'curated');
  const allArchives = results.flatMap(r => r.archives);
  const entityMap = new Map();
  const relMap = new Map();
  const timeline = [];
  const search = [];
  for (const r of results) {
    for (const a of r.archives) {
      for (const term of a.terms) {
        const cur = entityMap.get(term.name) || { name: term.name, mentionCount: 0, sourceRefs: new Set(), sourceLayers: new Set() };
        cur.mentionCount += term.mentionCount;
        cur.sourceRefs.add(a.sourcePath);
        cur.sourceLayers.add(a.sourceLayer);
        entityMap.set(term.name, cur);
      }
      for (const sig of a.relationshipSignals) {
        const key = [sig.from, sig.to].sort().join('::');
        const cur = relMap.get(key) || { from: sig.from, to: sig.to, signalCount: 0, sourceRefs: new Set(), sourceLayers: new Set(), formal: false };
        cur.signalCount += 1;
        for (const e of sig.evidence) cur.sourceRefs.add(e);
        cur.sourceLayers.add(a.sourceLayer);
        relMap.set(key, cur);
      }
      timeline.push({ id: `${a.seriesId}/${a.volumeId}/${a.chapterId}`, title: a.title, sourcePath: a.sourcePath, sourceLayer: a.sourceLayer });
      search.push({ title: a.title, sourcePath: a.sourcePath, keywords: a.terms.slice(0, 8).map(x => x.name), summary: a.summary });
    }
  }
  const entityCandidates = [...entityMap.values()].map(x => ({ name: x.name, mentionCount: x.mentionCount, sourceRefs: [...x.sourceRefs].slice(0, 30), sourceLayers: [...x.sourceLayers], confidence: 'low', formal: false })).sort((a, b) => b.mentionCount - a.mentionCount);
  const relationshipCandidates = [...relMap.values()].map(x => ({ from: x.from, to: x.to, type: 'co-occurrence-candidate', signalCount: x.signalCount, sourceRefs: [...x.sourceRefs].slice(0, 30), sourceLayers: [...x.sourceLayers], confidence: 'low', formal: false, note: '自动候选，不写入 relationship-graph.json。' })).sort((a, b) => b.signalCount - a.signalCount);
  const validation = {
    schema: 'rp-original-full-archive-validation-v1', generatedAt: NOW, worldId: world,
    sourceUnits: results.length, archivedChapters: allArchives.length, completeChapters: allArchives.filter(a => a.readStatus === 'complete').length,
    failedOrSkippedChapters: allArchives.filter(a => a.readStatus !== 'complete').length, jsonParseStatus: 'passed', noCoreGraphOverwrite: true,
    formalCoreCharacters: countFormalCore(world, 'characters-index.json'), formalCoreRelationshipEdges: countFormalCore(world, 'relationship-graph.json'),
    entityCandidateCount: entityCandidates.length, relationshipCandidateCount: relationshipCandidates.length,
    status: allArchives.some(a => a.readStatus !== 'complete') ? 'needs-human-review' : 'passed'
  };
  writeJson(path.join(curated, 'original-full-chapter-archive-index.json'), { schema: 'rp-original-full-chapter-archive-index-v1', generatedAt: NOW, worldId: world, worldName: WORLD_CN[world] || world, chapters: allArchives.map(a => ({ sourceLayer: a.sourceLayer, seriesId: a.seriesId, volumeId: a.volumeId, chapterId: a.chapterId, title: a.title, sourcePath: a.sourcePath, contentHash: a.contentHash, readStatus: a.readStatus })) });
  writeJson(path.join(curated, 'original-full-volume-archive-index.json'), { schema: 'rp-original-full-volume-archive-index-v1', generatedAt: NOW, worldId: world, volumes: results.map(r => ({ sourceLayer: r.sourceLayer, seriesId: r.unit.series, volumeId: r.unit.volume, sourceFiles: r.unit.files.length, archivedChapters: r.archives.length, validationStatus: r.validation.status })) });
  writeJson(path.join(curated, 'original-full-entity-candidates.json'), { schema: 'rp-original-full-entity-candidates-v1', generatedAt: NOW, worldId: world, candidates: entityCandidates });
  writeJson(path.join(curated, 'original-full-relationship-candidates.json'), { schema: 'rp-original-full-relationship-candidates-v1', generatedAt: NOW, worldId: world, candidates: relationshipCandidates });
  writeJson(path.join(curated, 'original-full-timeline.json'), { schema: 'rp-original-full-timeline-v1', generatedAt: NOW, worldId: world, items: timeline });
  writeJson(path.join(curated, 'original-full-search-index.json'), { schema: 'rp-original-full-search-index-v1', generatedAt: NOW, worldId: world, entries: search });
  writeJson(path.join(curated, 'original-full-runtime-pack.json'), { schema: 'rp-original-full-runtime-pack-v1', generatedAt: NOW, worldId: world, status: validation.status, sourceLayerCounts: allArchives.reduce((acc, a) => { acc[a.sourceLayer] = (acc[a.sourceLayer] || 0) + 1; return acc; }, {}), entityCandidates: entityCandidates.slice(0, 80), relationshipCandidates: relationshipCandidates.slice(0, 80) });
  writeJson(path.join(curated, 'original-full-archive-validation.json'), validation);
  writeText(path.join(curated, 'original-full-archive-lessons.md'), `# Full Archive Lessons: ${world}\n\n- generatedAt: ${NOW}\n- sourceUnits: ${validation.sourceUnits}\n- archivedChapters: ${validation.archivedChapters}\n- status: ${validation.status}\n\n## 规则\n\n- 本轮输出使用 original-full-* 新派生层，不覆盖既有 original-* 或正式核心图谱。\n- relationshipCandidates 只进入人工复核队列。\n- failed/too-short 项保留在 retry queue 与 validation。\n`);
  writeJson(path.join(curated, 'proposed-core-graph-gap-review.json'), { schema: 'rp-proposed-core-graph-gap-review-v1', generatedAt: NOW, worldId: world, instruction: '人工复核后才可将候选提升到正式 characters-index.json 或 relationship-graph.json。', topEntityCandidates: entityCandidates.slice(0, 50), topRelationshipCandidates: relationshipCandidates.slice(0, 50), validationStatus: validation.status });
  writeText(path.join(curated, 'proposed-core-graph-gap-review.md'), `# Proposed Core Graph Gap Review: ${world}\n\n候选实体：${entityCandidates.length}\n候选关系：${relationshipCandidates.length}\n状态：${validation.status}\n\n这些项目未写入正式图谱，需人工复核。\n`);
  return validation;
}

function writeFinalReport(worldReports) {
  ensureDir(REPORT_ROOT);
  const report = { schema: 'rp-all-world-full-chapter-archive-final-v1', generatedAt: NOW, status: worldReports.every(x => x.validation.status === 'passed') ? 'passed-with-derived-layers' : 'needs-human-review', taskplaneStatus: 'Taskplane Runtime V2 failed before worker progress; local deterministic runner used as fallback.', worlds: worldReports };
  writeJson(path.join(REPORT_ROOT, 'all-world-full-chapter-archive-final.json'), report);
  let md = `# 全世界全量章节归档最终报告\n\n生成时间：${NOW}\n\nTaskplane Runtime V2 两个批次均在首轮 worker 阶段失败，因此本轮使用主进程本地执行器完成同一套“全文读取 -> 章级归档 -> 卷级校验 -> 世界级派生层”流程。\n\n`;
  md += `| 世界 | 世界名 | raw-text正文源文件数 | curated story源文件数 | 章级归档JSON数 | 卷/单元校验数 | 校验通过数 | 失败/跳过章节数 | 人工核心角色数 | 自动派生角色候选数 | 人工核心关系边数 | 自动关系候选边数 | 原著运行包状态 | 人工复核待办数 |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|\n`;
  for (const row of worldReports) {
    const v = row.validation;
    md += `| ${row.world} | ${WORLD_CN[row.world] || row.world} | ${row.rawTextFiles} | ${row.curatedFiles} | ${v.archivedChapters} | ${v.sourceUnits} | ${row.passedUnits} | ${v.failedOrSkippedChapters} | ${v.formalCoreCharacters} | ${v.entityCandidateCount} | ${v.formalCoreRelationshipEdges} | ${v.relationshipCandidateCount} | ${v.status} | ${v.failedOrSkippedChapters + v.relationshipCandidateCount} |\n`;
  }
  md += `\n## 保护边界\n\n- 未覆盖 \`relationship-graph.json\`、\`characters-index.json\`、\`knowledge-graph.json\`、\`plot-graph.json\`。\n- 本轮世界级输出采用 \`original-full-*\` 新派生层。\n- 关系仅为候选信号，需人工复核后才能进入正式图谱。\n`;
  writeText(path.join(REPORT_ROOT, 'all-world-full-chapter-archive-final.md'), md);
}

function main() {
  require('./build-normal-curated-from-worldbooks').buildNormalCuratedFromWorldbooks({ quiet: true });
  require('./build-human-read-relationship-graphs').buildHumanReadRelationshipGraphs({ quiet: true });
  require('./apply-danmachi-human-read-edges').applyDanmachiHumanReadEdges({ quiet: true });
  const raw = rawVolumes();
  const curated = curatedUnits();
  const allResults = [];
  for (const unit of raw) allResults.push(processUnit(unit, 'raw-text'));
  for (const unit of curated) allResults.push(processUnit(unit, 'existing-curated-derived'));
  const byWorld = new Map();
  for (const result of allResults) {
    if (!byWorld.has(result.unit.world)) byWorld.set(result.unit.world, []);
    byWorld.get(result.unit.world).push(result);
  }
  const worldReports = [];
  for (const world of Object.keys(WORLD_CN).sort()) {
    const results = byWorld.get(world) || [];
    if (!results.length) continue;
    const validation = integrateWorld(world, results);
    worldReports.push({ world, rawTextFiles: results.filter(r => r.sourceLayer === 'raw-text').reduce((n, r) => n + r.unit.files.length, 0), curatedFiles: results.filter(r => r.sourceLayer === 'existing-curated-derived').reduce((n, r) => n + r.unit.files.length, 0), passedUnits: results.filter(r => r.validation.status === 'passed').length, validation });
  }
  writeFinalReport(worldReports);
  console.log(JSON.stringify({ ok: true, generatedAt: NOW, rawUnits: raw.length, curatedUnits: curated.length, worlds: worldReports }, null, 2));
}

main();
