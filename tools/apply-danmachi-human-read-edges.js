const fs = require('fs');
const path = require('path');

const WORLD = 'danmachi';
const ROOT = path.join('campaigns', 'world-library', 'worlds', WORLD, 'curated');
const REPORT_ROOT = path.join('campaigns', 'world-library', 'manual-curation', 'reports');
const NOW = new Date().toISOString();

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8'); }
function writeText(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, v, 'utf8'); }
function edgeId(s, t, type, i) { return `rel:${WORLD}:${s}--${type}--${t}--${i}`.replace(/[^a-zA-Z0-9\u4e00-\u9fa5:._-]+/g, '-').slice(0, 190); }

const manualEdges = [
  {s:'hestia',t:'bell_cranel',type:'romantic',nature:'主神、保护者、爱慕/占有对象',ev:'赫斯缇雅 profile 明确写出“对贝尔有强烈保护欲与占有欲”；贝尔 affiliation 为赫斯缇雅眷族。'},
  {s:'bell_cranel',t:'hestia',type:'allegiance',nature:'眷族成员、受恩惠者',ev:'贝尔 affiliation 为赫斯缇雅/赫斯提亚眷族；赫斯缇雅为该眷族主神。'},
  {s:'bell_cranel',t:'ais_wallenstein',type:'admiration',nature:'憧憬并追赶的剑姬',ev:'贝尔 profile 明确写出“渴望成为英雄并追上艾丝”。'},
  {s:'liliruca_arde',t:'bell_cranel',type:'ally',nature:'被救赎后成为可靠伙伴',ev:'莉莉 profile 明确写出“受贝尔救赎后成为可靠伙伴”。'},
  {s:'bell_cranel',t:'liliruca_arde',type:'ally',nature:'赫斯缇雅眷族伙伴',ev:'莉莉 affiliation 为原苏摩眷族 -> 赫斯缇雅眷族，且 profile 写受贝尔救赎后成为可靠伙伴。'},
  {s:'welf_crozzo',t:'bell_cranel',type:'ally',nature:'赫斯缇雅眷族伙伴、锻造支援',ev:'韦尔夫 affiliation 为原赫菲斯托丝眷族 -> 赫斯缇雅眷族，profile 写其直爽重义。'},
  {s:'yamato_mikoto',t:'bell_cranel',type:'ally',nature:'赫斯缇雅眷族伙伴、战斗同伴',ev:'命 affiliation 为原建御雷眷族 -> 赫斯缇雅眷族。'},
  {s:'sanjouno_haruhime',t:'bell_cranel',type:'ally',nature:'被拯救后成为关键辅助',ev:'春姬 profile 写“曾受伊丝塔眷族囚禁利用，后成为赫斯缇雅眷族关键辅助”。'},
  {s:'bell_cranel',t:'eina_tulle',type:'advisor',nature:'冒险者与公会顾问',ev:'埃伊娜 profile 写“公会关键职员，常为冒险者提供安全、任务和地下城情报建议”。'},
  {s:'eina_tulle',t:'bell_cranel',type:'advisor',nature:'公会顾问与重点冒险者',ev:'埃伊娜 profile 写其常为冒险者提供安全、任务和地下城情报建议；贝尔为核心冒险者。'},
  {s:'freya',t:'syr_flover',type:'identity',nature:'同一/假身身份关联',ev:'芙蕾雅 aliases 含“希儿形态/素颜芙蕾雅”；希儿 aliases 含“芙蕾雅假身/素颜芙蕾雅”。'},
  {s:'syr_flover',t:'freya',type:'identity',nature:'表面身份与真身关联',ev:'希儿 profile 写“表面是温柔开朗的酒馆女孩，源中将其与芙蕾雅身份深度关联”。'},
  {s:'freya',t:'bell_cranel',type:'romantic',nature:'被其灵魂吸引并追逐',ev:'芙蕾雅 profile 写“对纯净耀眼灵魂有强烈渴求”，其 sourceRefs 与贝尔剧情线/战争游戏相关。'},
  {s:'loki',t:'hestia',type:'rival',nature:'私人恩怨/神明损友',ev:'洛基 detail 写“对胸前雄伟的赫斯缇雅有很多私人恩怨”。'},
  {s:'loki',t:'freya',type:'ally',nature:'老朋友兼竞争眷族主神',ev:'洛基 detail 写“跟芙蕾雅、赫菲斯托丝都是老朋友”，并写洛基眷族与芙蕾雅眷族并称最强。'},
  {s:'loki',t:'hephaestus',type:'ally',nature:'老朋友',ev:'洛基 detail 写“跟芙蕾雅、赫菲斯托丝都是老朋友”。'},
  {s:'hephaestus',t:'hestia',type:'ally',nature:'关系密切的神友',ev:'赫菲斯托丝 profile 明确写“与赫斯缇雅关系密切”。'},
  {s:'loki',t:'finn_deimne',type:'allegiance',nature:'主神与团长',ev:'洛基眷族 detail 写“团长：勇者 芬恩·蒂姆那”。'},
  {s:'loki',t:'riveria_ljos_alf',type:'allegiance',nature:'主神与副团长/核心干部',ev:'洛基眷族 detail 写“副团长：九魔姬 里维莉雅”。'},
  {s:'loki',t:'gareth_landrock',type:'allegiance',nature:'主神与高级干部',ev:'洛基眷族 detail 写“高级干部：重杰 格瑞斯”。'},
  {s:'loki',t:'ais_wallenstein',type:'allegiance',nature:'主神与第一军成员',ev:'洛基眷族 detail 将艾丝列为第一军成员“剑姬”。'},
  {s:'finn_deimne',t:'riveria_ljos_alf',type:'ally',nature:'洛基眷族三巨头',ev:'洛基眷族 detail 明确写“芬恩、里维莉雅与格瑞斯是洛基眷族的三巨头”。'},
  {s:'finn_deimne',t:'gareth_landrock',type:'ally',nature:'洛基眷族三巨头',ev:'洛基眷族 detail 明确写“芬恩、里维莉雅与格瑞斯是洛基眷族的三巨头”。'},
  {s:'riveria_ljos_alf',t:'gareth_landrock',type:'ally',nature:'洛基眷族三巨头',ev:'洛基眷族 detail 明确写“芬恩、里维莉雅与格瑞斯是洛基眷族的三巨头”。'},
  {s:'riveria_ljos_alf',t:'ais_wallenstein',type:'mentor',nature:'导师/培养者',ev:'里维莉雅 profile 明确写“是艾丝与蕾菲亚的重要导师”。'},
  {s:'riveria_ljos_alf',t:'lefiya_viridis',type:'mentor',nature:'导师/培养者',ev:'里维莉雅 profile 明确写“是艾丝与蕾菲亚的重要导师”。'},
  {s:'lefiya_viridis',t:'ais_wallenstein',type:'admiration',nature:'憧憬对象',ev:'蕾菲亚 profile 明确写“憧憬艾丝”。'},
  {s:'tiona_hiryute',t:'ais_wallenstein',type:'ally',nature:'好友',ev:'蒂奥娜 profile 明确写“艾丝好友”。'},
  {s:'tione_hiryute',t:'finn_deimne',type:'romantic',nature:'疯狂爱慕团长',ev:'蒂奥涅 profile 明确写“爱慕芬恩/疯狂爱慕芬恩”。'},
  {s:'ottar',t:'freya',type:'allegiance',nature:'芙蕾雅眷族团长、忠诚对象',ev:'奥塔 affiliation 为芙蕾雅眷族，profile 写“芙蕾雅眷族团长，沉默、忠诚”。'},
  {s:'freya',t:'ottar',type:'allegiance',nature:'主神与团长',ev:'奥塔 profile/sourceRefs 明确其为芙蕾雅眷族团长。'},
  {s:'ottar_freya_elites_note',t:'freya',type:'allegiance',nature:'芙蕾雅眷族高层群像隶属主神',ev:'群像 affiliation 为芙蕾雅眷族，profile 写芙蕾雅眷族高层精锐。'},
  {s:'ottar_freya_elites_note',t:'ottar',type:'ally',nature:'同属芙蕾雅眷族高层',ev:'群像 name 为“芙蕾雅眷族高层群像”，奥塔为芙蕾雅眷族团长。'},
  {s:'tsubaki_collbrande',t:'hephaestus',type:'allegiance',nature:'赫菲斯托丝眷族顶级锻造师',ev:'椿 affiliation 为赫菲斯托丝眷族，profile 写其为顶级锻造师。'},
  {s:'takemikazuchi',t:'yamato_mikoto',type:'allegiance',nature:'原主神与原眷族成员',ev:'命 affiliation 明确为“原建御雷眷族 -> 赫斯缇雅眷族”。'},
  {s:'aisha_belka',t:'sanjouno_haruhime',type:'ally',nature:'春姬篇紧密关联者',ev:'阿伊莎 profile 写“与春姬篇联系紧密”。'},
  {s:'hermes',t:'asfi_al_andromeda',type:'allegiance',nature:'主神与核心执行者',ev:'亚丝菲 profile 写“赫尔墨斯眷族核心执行者，常被主神使唤”。'},
  {s:'hermes',t:'bell_cranel',type:'mentor',nature:'推动贝尔走向英雄舞台',ev:'赫尔墨斯 profile 明确写“擅长推动贝尔走向英雄舞台”。'},
  {s:'mia_grand',t:'syr_flover',type:'ally',nature:'酒馆店长与看板娘/知情者',ev:'蜜雅 profile 写其为酒馆店长并“掌握希儿等人的过去秘密”。'},
  {s:'mia_grand',t:'freya',type:'allegiance',nature:'原芙蕾雅眷族成员',ev:'蜜雅 affiliation 写“丰饶的女主人；原芙蕾雅眷族”。'},
  {s:'daphne_lauros',t:'cassandra_illion',type:'ally',nature:'原阿波罗眷族同盟/搭档',ev:'达芙妮与卡珊德拉 affiliation 均为原阿波罗眷族；两者作为同盟角色共同转入赫斯缇雅关联阵营。'},
  {s:'cassandra_illion',t:'daphne_lauros',type:'ally',nature:'原阿波罗眷族同盟/搭档',ev:'卡珊德拉与达芙妮 affiliation 均为原阿波罗眷族；两者作为同盟角色共同转入赫斯缇雅关联阵营。'}
];

function applyDanmachiHumanReadEdges(options = {}) {
  const chars = readJson(path.join(ROOT, 'characters-index.json')).characters || [];
  const byId = Object.fromEntries(chars.map(c => [c.id, c]));
  const graphPath = path.join(ROOT, 'relationship-graph.json');
  const graph = fs.existsSync(graphPath) ? readJson(graphPath) : { schema: 'rp-relationship-graph-v1', worldId: WORLD, nodes: [], edges: [] };
  graph.schema = 'rp-relationship-graph-v1';
  graph.worldId = WORLD;
  graph.generatedAt = NOW;
  graph.source = 'human-read character profile/affiliation/sourceRefs; not co-occurrence candidates';
  graph.reviewMethod = 'manual semantic promotion from DanMachi character profile, affiliation, and sourceRef evidence';
  graph.nodes = chars.map(ch => ({ id: ch.id, name: ch.name, type: 'character', importance: ch.importance || 'supporting', factions: ch.factions || [], affiliation: ch.affiliation || '', sourceRefs: ch.sourceRefs || [] }));
  graph.edges = [];
  const missing = [];
  manualEdges.forEach((e, i) => {
    const s = byId[e.s];
    const t = byId[e.t];
    if (!s || !t) { missing.push(e); return; }
    graph.edges.push({
      id: edgeId(e.s, e.t, e.type, i + 1),
      source: e.s,
      target: e.t,
      type: e.type,
      sourceName: s.name,
      targetName: t.name,
      nature: e.nature,
      description: e.ev,
      direction: 'directed-source-statement',
      evidenceLevel: 'A',
      reviewStatus: 'human-read-promoted',
      evidenceSource: 'manual-read-character-profile-affiliation',
      sourceRefs: Array.from(new Set([...(s.sourceRefs || []), ...(t.sourceRefs || [])])),
      evidenceSnippet: e.ev
    });
  });
  graph.unmatchedRelationshipMentions = missing;
  graph.stats = { nodes: graph.nodes.length, edges: graph.edges.length, relationshipBlocksRead: manualEdges.length, unmatchedMentions: missing.length };
  writeJson(graphPath, graph);

  const digest = ['# Human-read relationship digest: danmachi', '', `- generatedAt: ${NOW}`, '- method: manual reading of DanMachi character profile / affiliation / sourceRef evidence; explicit relationship edges promoted into relationship-graph.json.', `- promotedEdges: ${graph.edges.length}`, ''];
  for (const edge of graph.edges) digest.push(`## ${edge.sourceName} -> ${edge.targetName}\n\n- type: ${edge.type}\n- nature: ${edge.nature}\n- evidence: ${edge.evidenceSnippet}\n- sourceRefs: ${edge.sourceRefs.join('; ')}\n`);
  writeText(path.join(REPORT_ROOT, 'human-read-relationship-digest-danmachi.md'), digest.join('\n'));

  const reportPath = path.join(REPORT_ROOT, 'human-read-relationship-graph-report.json');
  if (fs.existsSync(reportPath)) {
    const report = readJson(reportPath);
    const row = (report.worlds || []).find(w => w.world === WORLD);
    if (row) {
      row.nodes = graph.nodes.length;
      row.edges = graph.edges.length;
      row.relationshipBlocksRead = manualEdges.length;
      row.unmatchedMentions = missing.length;
    }
    report.generatedAt = NOW;
    writeJson(reportPath, report);
  }
  if (!options.quiet) console.log(JSON.stringify({ world: WORLD, edges: graph.edges.length, missing }, null, 2));
  return { world: WORLD, nodes: graph.nodes.length, edges: graph.edges.length, relationshipBlocksRead: manualEdges.length, unmatchedMentions: missing.length };
}

if (require.main === module) applyDanmachiHumanReadEdges();
module.exports = { applyDanmachiHumanReadEdges };
