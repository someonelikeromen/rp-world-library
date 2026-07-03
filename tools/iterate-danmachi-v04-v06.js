const fs = require('fs');
const path = require('path');

const base = 'campaigns/world-library/worlds/danmachi';
const rawBase = `${base}/sources/raw-text/danmachi-main`;
const outBase = `${base}/curated/stories/summaries/danmachi-main`;
const plotPath = `${base}/curated/plot-graph.json`;
const idxPath = `${base}/curated/stories/original-summary-index.json`;
const reportPath = 'campaigns/world-library/manual-curation/reports/iteration-02-story-summary.md';

const names = ['贝尔','赫斯缇雅','艾丝','莉莉','莉莉露卡','埃伊娜','希儿','韦尔夫','克罗佐','洛基','芙蕾雅','奥它','苏摩','赫菲斯托丝','阿波罗','雅辛托斯','达芙妮','卡珊德拉','命','琉','荷米斯','亚丝菲','弥诺陶洛斯','米诺陶洛斯','歌利亚','黑色歌利亚','地下城','中层','第18层','魔剑','魔法','魔导书','火焰伏特','火焰闪电','支援者','怪物奉送','战争游戏','冒险者','眷族'];

function loadVol(vol) {
  const dir = `${rawBase}/${vol}`;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort();
  const full = files.map(f => ({ file: f, text: fs.readFileSync(path.join(dir, f), 'utf8') }));
  const hits = Object.fromEntries(names.map(n => [n, full.reduce((c, x) => c + (x.text.match(new RegExp(n, 'g')) || []).length, 0)]).filter(([, c]) => c > 0));
  const rows = full.map(({ file, text }, i) => ({
    idx: i + 1,
    title: file.replace(/^\d+-/, '').replace(/\.txt$/, ''),
    file,
    chars: text.length,
    mentions: Object.entries(hits).filter(([n]) => text.includes(n)).slice(0, 10).map(([n]) => n)
  }));
  return { rows, hits };
}

function table(rows, vol) {
  return rows.map(ch => `| ${ch.idx} | ${ch.title.replace(/\|/g, '\\|')} | ${ch.chars} | ${ch.mentions.join('、') || '—'} | \`sources/raw-text/danmachi-main/${vol}/${ch.file}\` |`).join('\n');
}
function hitList(hits) {
  return Object.entries(hits).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n');
}
function numberedSummaries(rows, summaries) {
  return rows.map((r, i) => `- ${r.idx}. ${r.title}：${summaries[i] || '补充/特典章节；保留源文件指针，待后续按需要精修。'}`).join('\n');
}

const volumeData = {
  'vol-04': {
    title: '第四卷',
    volumeSummary: '第四卷是贝尔升至 Lv.2 后的过渡与组队扩张卷。贝尔在更高楼层探索前补充装备与知识，魔导书事件让他获得速攻型魔法“火焰伏特/火焰闪电”，使他的战斗方式从短刀近战扩展到瞬发魔法。与此同时，韦尔夫·克罗佐以铁匠身份与贝尔建立专属合作关系，并逐步成为贝尔、莉莉队伍中的实战伙伴。本卷补足赫菲斯托丝眷族、锻造、魔剑、魔法、发展能力等世界设定，为下一卷中层远征与韦尔夫正式入队打基础。',
    chapterSummaries: [
      '贝尔在 Lv.2 后重新审视自身成长与冒险者身份，赫斯缇雅眷族进入“需要真正队伍配置”的阶段。',
      '贝尔接触魔导书并获得新魔法，火焰伏特成为他后续高机动战斗风格的重要武器。',
      '装备更新和锻造眷族相关情报展开，韦尔夫·克罗佐作为铁匠进入贝尔的行动圈。',
      '贝尔、莉莉与韦尔夫开始形成三人队伍雏形，支援者、前卫与锻造支援的分工逐渐明确。',
      '韦尔夫的克罗佐血统、魔剑立场与铁匠自尊被揭示，他不只提供装备，也有自己的价值冲突。',
      '队伍在地下城探索中磨合，贝尔的新魔法、莉莉的支援与韦尔夫的战斗能力开始组合。',
      '中层探索的风险被持续铺垫，队伍需要面对更复杂的怪物和环境。',
      '贝尔与韦尔夫的信赖加深，专属铁匠关系从交易转向伙伴关系。',
      '卷末补足能力/装备变化，为后续中层远征衔接。',
      '特典/短篇：补充日常和人物关系，不作为主线核心节点。'
    ],
    candidates: {
      chars: '贝尔·克朗尼、赫斯缇雅、莉莉露卡·厄德、韦尔夫·克罗佐、埃伊娜、赫菲斯托丝。',
      places: '欧拉丽、巴别塔、赫菲斯托丝眷族相关商店、地下城浅层至中层入口。',
      terms: '火焰伏特/火焰闪电、魔导书、魔法、魔剑、克罗佐、铁匠、发展能力。',
      events: '贝尔习得魔法；韦尔夫成为专属铁匠/伙伴；队伍从单人冒险转向小队探索。',
      graph: '贝尔战斗体系扩展线；韦尔夫加入线；赫菲斯托丝眷族与锻造体系补强。',
      spoiler: '中；包含贝尔早期能力变化与韦尔夫加入前置。'
    }
  },
  'vol-05': {
    title: '第五卷',
    volumeSummary: '第五卷是贝尔小队第一次真正承受中层风险的远征卷。贝尔、莉莉、韦尔夫进入中层后遭遇“怪物奉送/怪物进呈”导致的怪物群追击，被迫向第18层安全楼层逃亡。队伍在生死危机中完成协作：莉莉负责路线和支援，韦尔夫以装备与火力保护队伍，贝尔承担突破核心。抵达第18层后，他们与洛基眷族、赫斯缇雅救援队、荷米斯等多方交汇；神明进入地下城引发异常，黑色歌利亚出现并迫使各阵营共同作战。贝尔参与击破楼层主级威胁，队伍从“刚成形的小队”转为真正经历过生死共同体的伙伴。',
    chapterSummaries: [
      '贝尔、莉莉、韦尔夫开始中层探索，地下城难度从浅层练级转向团队生存。',
      '怪物奉送/怪物进呈使贝尔小队遭遇超出预期的追击，队伍被迫不断向更深处撤退。',
      '三人在中层持续消耗，莉莉的支援判断、韦尔夫的战斗能力与贝尔的突破力共同维持生路。',
      '小队逼近第18层安全楼层，生还希望和地下城压力同时达到高点。',
      '贝尔小队抵达第18层，与洛基眷族、赫斯缇雅、荷米斯、琉等势力交汇；里维拉与第18层生态被展开。',
      '救援与追责围绕怪物奉送展开，各阵营暂时形成共同现场。',
      '黑色歌利亚因异常出现，安全楼层被迫变成战场，冒险者们必须联合应对。',
      '贝尔在多人协作中承担关键打击，早期英雄性进一步得到外部见证。',
      '战后队伍关系稳固，贝尔小队完成中层远征试炼。',
      '后记/特典：补充人物日常与作者说明，不作为主线核心节点。'
    ],
    candidates: {
      chars: '贝尔·克朗尼、赫斯缇雅、莉莉露卡·厄德、韦尔夫·克罗佐、艾丝、芬恩、琉、荷米斯、亚丝菲、命。',
      places: '地下城中层、第18层、里维拉、洛基眷族营地。',
      terms: '怪物奉送、怪物进呈、中层、安全楼层、黑色歌利亚、楼层主。',
      events: '贝尔小队中层远征；怪物奉送危机；抵达第18层；黑色歌利亚战。',
      graph: '贝尔小队共同体线；第18层/里维拉地点节点；洛基眷族交叉线；荷米斯观测线。',
      spoiler: '中；包含第18层与黑色歌利亚事件。'
    }
  },
  'vol-06': {
    title: '第六卷',
    volumeSummary: '第六卷围绕阿波罗眷族挑衅与战争游戏展开，是赫斯缇雅眷族从弱小派阀跃升为欧拉丽知名眷族的关键卷。阿波罗盯上贝尔并通过宴会、街头追击和派阀压力迫使赫斯缇雅接受战争游戏。赫斯缇雅一方依靠贝尔的训练、莉莉的变身潜入、韦尔夫的克罗佐魔剑、命与琉等外援协作，以小规模精锐战术对抗人数占优的阿波罗眷族。战争游戏中，贝尔突破城寨、击败雅辛托斯，赫斯缇雅取得胜利；阿波罗眷族被解散/放逐，赫斯缇雅眷族获得新据点并扩大成员基础。本卷将贝尔个人成长推进到“能代表眷族参战”的阶段，也确立赫斯缇雅眷族正式扩张。',
    chapterSummaries: [
      '阿波罗眷族对贝尔表现出强烈兴趣与敌意，宴会和外部压力引发冲突。',
      '阿波罗眷族发动追逼，赫斯缇雅眷族被迫在全城压力下逃避和应对。',
      '众神会议/派阀规则把冲突导向战争游戏，赫斯缇雅选择以眷族名义正面迎战。',
      '贝尔接受强化训练，莉莉、韦尔夫、命、琉等人围绕攻城战制定战术与准备。',
      '战争游戏开始，韦尔夫魔剑破城、莉莉变身潜入、命和琉分散战力，贝尔突破核心战场。',
      '贝尔与雅辛托斯决战，赫斯缇雅眷族击败阿波罗眷族，战争游戏落幕。',
      '战后阿波罗失势，赫斯缇雅眷族获得新据点，眷族名声与规模进入新阶段。',
      '后记/特典：补充决战前夜、间谍行动和训练背后等侧面资料。'
    ],
    candidates: {
      chars: '贝尔·克朗尼、赫斯缇雅、莉莉露卡·厄德、韦尔夫·克罗佐、命、琉、阿波罗、雅辛托斯、达芙妮、卡珊德拉、艾丝。',
      places: '欧拉丽、巴别塔、阿波罗眷族城寨、赫斯缇雅眷族新据点。',
      terms: '战争游戏、攻城战、克罗佐魔剑、变身潜入、眷族改宗/扩张。',
      events: '阿波罗挑衅；赫斯缇雅接受战争游戏；贝尔训练；攻城战胜利；阿波罗眷族解体/放逐；赫斯缇雅眷族扩张。',
      graph: '赫斯缇雅眷族扩张主节点；阿波罗冲突线；莉莉潜入战术线；韦尔夫魔剑战术线。',
      spoiler: '中到高；包含战争游戏胜负与眷族扩张结果。'
    }
  }
};

for (const vol of Object.keys(volumeData)) {
  const data = volumeData[vol];
  const { rows, hits } = loadVol(vol);
  let md = `# ${data.title}\n\n世界：danmachi\n\n系列：danmachi-main / 在地下城寻求邂逅是否搞错了什么\n\n状态：Iteration 02 第二批正式摘要。基于本地 raw-text ${data.title} 生成；正文仍保留在 source，不复制进摘要。\n\n`;
  md += `## 卷摘要\n\n${data.volumeSummary}\n\n`;
  md += `## 章节清单\n\n| 序号 | 标题 | 字数 | 主要命中 | 源文件 |\n|---:|---|---:|---|---|\n${table(rows, vol)}\n\n`;
  md += `## 章节摘要\n\n${numberedSummaries(rows, data.chapterSummaries)}\n\n`;
  md += `## 抽取候选\n\n- 关键角色：${data.candidates.chars}\n- 地点/组织：${data.candidates.places}\n- 能力/物品/术语：${data.candidates.terms}\n- 事件节点：${data.candidates.events}\n- 图谱对齐：${data.candidates.graph}\n- 剧透等级：${data.candidates.spoiler}\n\n`;
  md += `## 名词命中统计\n\n${hitList(hits)}\n`;
  fs.writeFileSync(`${outBase}/${vol}.md`, md, 'utf8');
}

const inc = {
  schema: 'rp-plot-graph-increment-v1',
  worldId: 'danmachi',
  createdAt: '2026-06-30',
  source: 'danmachi-main vol-04..vol-06 raw-text summaries',
  nodes: [
    { id: 'orig-main-v04-bell-learns-firebolt', series: 'danmachi-main', volume: 'vol-04', label: '贝尔习得火焰伏特', type: 'power-event', summary: '魔导书事件使贝尔获得瞬发魔法，战斗体系从短刀近战扩展为高速近战+速攻魔法。', characters: ['贝尔·克朗尼','赫斯缇雅'], terms: ['火焰伏特','魔导书','魔法'], spoilerLevel: 'medium' },
    { id: 'orig-main-v04-welf-partner', series: 'danmachi-main', volume: 'vol-04', label: '韦尔夫成为贝尔伙伴', type: 'relationship-event', summary: '韦尔夫·克罗佐以铁匠身份与贝尔建立专属合作关系，并逐步成为队伍战斗伙伴。', characters: ['贝尔·克朗尼','韦尔夫·克罗佐'], organizations: ['赫菲斯托丝眷族'], terms: ['克罗佐','魔剑','铁匠'], spoilerLevel: 'medium' },
    { id: 'orig-main-v05-middle-floor-crisis', series: 'danmachi-main', volume: 'vol-05', label: '贝尔小队中层危机', type: 'dungeon-event', summary: '贝尔、莉莉、韦尔夫因怪物奉送陷入中层追击，被迫逃向第18层，队伍协作经受生死考验。', characters: ['贝尔·克朗尼','莉莉露卡·厄德','韦尔夫·克罗佐'], terms: ['中层','怪物奉送','第18层'], spoilerLevel: 'medium' },
    { id: 'orig-main-v05-black-goliath', series: 'danmachi-main', volume: 'vol-05', label: '第18层黑色歌利亚战', type: 'battle-event', summary: '第18层安全楼层出现黑色歌利亚，各阵营冒险者联合作战，贝尔参与关键打击。', characters: ['贝尔·克朗尼','赫斯缇雅','艾丝·华伦斯坦','琉'], organizations: ['洛基眷族','荷米斯眷族'], terms: ['黑色歌利亚','第18层','里维拉'], spoilerLevel: 'medium' },
    { id: 'orig-main-v06-apollo-conflict', series: 'danmachi-main', volume: 'vol-06', label: '阿波罗眷族挑衅赫斯缇雅眷族', type: 'faction-conflict', summary: '阿波罗盯上贝尔并通过派阀压力迫使赫斯缇雅眷族接受战争游戏。', characters: ['贝尔·克朗尼','赫斯缇雅','阿波罗'], organizations: ['阿波罗眷族','赫斯缇雅眷族'], spoilerLevel: 'medium' },
    { id: 'orig-main-v06-war-game-victory', series: 'danmachi-main', volume: 'vol-06', label: '赫斯缇雅眷族赢得战争游戏', type: 'battle-event', summary: '赫斯缇雅眷族以小队战术击败阿波罗眷族，贝尔击败雅辛托斯，阿波罗失势。', characters: ['贝尔·克朗尼','赫斯缇雅','莉莉露卡·厄德','韦尔夫·克罗佐','命','琉','雅辛托斯'], organizations: ['赫斯缇雅眷族','阿波罗眷族'], terms: ['战争游戏','攻城战','克罗佐魔剑'], spoilerLevel: 'high' },
    { id: 'orig-main-v06-hestia-familia-expands', series: 'danmachi-main', volume: 'vol-06', label: '赫斯缇雅眷族获得新据点并扩张', type: 'faction-development', summary: '战争游戏后赫斯缇雅眷族获得新据点和更高名声，成员与派阀规模进入新阶段。', characters: ['赫斯缇雅','贝尔·克朗尼','莉莉露卡·厄德','韦尔夫·克罗佐','命'], organizations: ['赫斯缇雅眷族'], spoilerLevel: 'high' }
  ]
};
const incPath = `${base}/curated/stories/original-plot-increment-danmachi-main-v04-v06.json`;
fs.writeFileSync(incPath, JSON.stringify(inc, null, 2), 'utf8');

const plot = JSON.parse(fs.readFileSync(plotPath, 'utf8'));
const nodeIds = new Set(plot.nodes.map(n => n.id));
const edgeKeys = new Set(plot.edges.map(e => `${e.from}::${e.to}::${e.type}`));
const addedNodes = [];
let addedEdges = 0;
function addNode(n) { if (!nodeIds.has(n.id)) { plot.nodes.push(n); nodeIds.add(n.id); addedNodes.push(n.id); } }
function addEdge(e) { const k = `${e.from}::${e.to}::${e.type}`; if (!edgeKeys.has(k)) { plot.edges.push(e); edgeKeys.add(k); addedEdges++; } }

const charMap = {
  '贝尔·克朗尼': 'char-bell_cranel',
  '艾丝·华伦斯坦': 'char-ais_wallenstein',
  '赫斯缇雅': 'char-hestia',
  '莉莉露卡·厄德': 'char-liliruca_arde',
  '韦尔夫·克罗佐': 'char-welf_crozzo',
  '琉': 'char-ryu_lion',
  '命': 'char-yamato_mikoto',
  '阿波罗': 'char-apollo',
  '雅辛托斯': 'char-hyakinthos'
};
const charLabels = {
  'char-welf_crozzo': '韦尔夫·克罗佐',
  'char-ryu_lion': '琉·璃昂',
  'char-yamato_mikoto': '大和·命',
  'char-apollo': '阿波罗',
  'char-hyakinthos': '雅辛托斯'
};
for (const [id, label] of Object.entries(charLabels)) addNode({ id, label, type: 'character', sourceRefs: ['original-summary:danmachi-main:v04-v06'] });
const orgMap = {
  '赫菲斯托丝眷族': 'org-hephaestus_familia',
  '洛基眷族': 'org-loki_familia',
  '荷米斯眷族': 'org-hermes_familia',
  '阿波罗眷族': 'org-apollo_familia',
  '赫斯缇雅眷族': 'org-hestia_familia'
};
for (const [label, id] of Object.entries(orgMap)) addNode({ id, label, type: 'organization', sourceRefs: ['original-summary:danmachi-main:v04-v06'] });
const sequence = [];
for (const n of inc.nodes) {
  addNode({ id: n.id, label: n.label, type: n.type, summary: n.summary, sourceSeries: n.series, sourceVolume: n.volume, sourceRefs: [inc.source], spoilerLevel: n.spoilerLevel, originalTextBacked: true, characters: n.characters || [], organizations: n.organizations || [], terms: n.terms || [] });
  sequence.push(n.id);
  for (const c of n.characters || []) { const cid = charMap[c]; if (cid) addEdge({ from: cid, to: n.id, type: 'appears-in', sourceRefs: [inc.source] }); }
  for (const o of n.organizations || []) { const oid = orgMap[o]; if (oid) addEdge({ from: oid, to: n.id, type: 'involved-in', sourceRefs: [inc.source] }); }
}
for (let i = 1; i < sequence.length; i++) addEdge({ from: sequence[i - 1], to: sequence[i], type: 'precedes', sourceRefs: [inc.source] });
plot.generatedAt = new Date().toISOString();
fs.writeFileSync(plotPath, JSON.stringify(plot, null, 2), 'utf8');

const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
for (const s of idx.series || []) {
  if (s.seriesSlug === 'danmachi-main') {
    for (const v of s.volumes || []) {
      if (['vol-04','vol-05','vol-06'].includes(v.id)) {
        v.summaryStatus = 'drafted';
        v.graphIncrement = 'curated/stories/original-plot-increment-danmachi-main-v04-v06.json';
      }
    }
  }
}
fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2), 'utf8');

let report = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
const line = '- 2026-06-30：已将 `danmachi-main` 第 4-6 卷摘要事件合并到 `campaigns/world-library/worlds/danmachi/curated/plot-graph.json`。';
if (!report.includes(line)) {
  report += `\n${line}\n- 新增/确认事件节点：${inc.nodes.map(n => `\`${n.id}\``).join('、')}。\n- 增量文件：\`campaigns/world-library/worlds/danmachi/curated/stories/original-plot-increment-danmachi-main-v04-v06.json\`。\n`;
  fs.writeFileSync(reportPath, report, 'utf8');
}

console.log(JSON.stringify({
  updatedSummaries: ['vol-04','vol-05','vol-06'].map(v => `${outBase}/${v}.md`),
  increment: incPath,
  addedNodes,
  addedEdges,
  plotNodes: plot.nodes.length,
  plotEdges: plot.edges.length
}, null, 2));
