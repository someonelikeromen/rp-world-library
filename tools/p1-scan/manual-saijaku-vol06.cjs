const fs = require('fs');
const path = require('path');

const out = 'campaigns/world-library/manual-curation/saijaku-muhai-bahamut-output/waves/wave-002/vol-06';
const world = 'saijaku-muhai-bahamut';
const volume = 'vol-06';
const period = 'vol-06-main';
const src = (line) => `saijaku-muhai-bahamut-main/vol-06/full.txt:${line}`;

function ensure(dir) { fs.mkdirSync(path.join(out, dir), { recursive: true }); }
for (const dir of ['characters','abilities','events','items','locations','factions','systems','knowledge']) ensure(dir);

function write(type, id, data) {
  fs.writeFileSync(path.join(out, type, `${id}.json`), JSON.stringify(data, null, 2) + '\n');
}
function chPeriod(kind, id, p) {
  return { _schema: `rp-${kind}-volume-v1`, world, [`${kind}_id`]: id, volume, periods: [p], source_refs: p.source_refs || [] };
}
function character(id, zh, en, aliases, titles, occupation, affiliation, summary, refs, extra = {}) {
  write('characters', id, {
    _schema: 'rp-character-volume-v1', world, character_id: id, volume,
    time_range: { start: '全龙战前后', end: '收复帝都计画平定后' }, sub_arcs: ['帝国凶刃现身', '收复帝都计画', '巨兵袭击王都'],
    periods: [{
      period_id: period, volume, time: '全龙战与收复帝都计画期间', label: 'vol-06',
      name: { zh, en, jp: extra.jp || '' }, aliases, titles, gender: extra.gender || '', species: extra.species || '人类', nationality: extra.nationality || '', occupation, affiliation,
      status: extra.status || { state: '存活' }, appearance: { overview: extra.appearance || '', physical: { height: '', build: '', hair: {}, eyes: {} }, attire: { default: '', combat: '' }, voice_quality: {}, distinctive: [] },
      personality: { summary: extra.personality || '', core_traits: extra.traits || [], values: [], fears: [], desires: [], strengths: [], flaws: [], inner_conflict: '', decision_pattern: {} },
      voice: { self_reference: '', address_pattern: {}, register: {}, catchphrases: [], quote_samples: extra.quotes || [] }, habits: { mannerisms: [], daily_routine: '', quirks: [], preferences: {} },
      background: { birth: { place: '', family: [] }, upbringing: '', education: {}, formative_events: [], pre_story: extra.background || '' },
      abilities_owned: extra.abilities || [], possessions_owned: extra.items || [], relationships: extra.relationships || {}, knowledge: extra.knowledge || [], secrets: extra.secrets || [],
      summary, key_events: extra.events || [], evidence_level: 'S', source_refs: refs.map(src)
    }], source_refs: refs.map(src)
  });
}
function ability(id, zh, en, type, description, refs, extra = {}) {
  write('abilities', id, chPeriod('ability', id, {
    period_id: period, volume, time: '全龙战与收复帝都计画期间', name: { zh, en }, aliases: extra.aliases || [], type,
    description, details: extra.details || {}, activation: extra.activation || { condition: '', incantation: '', time: '', cost: '' }, effects: extra.effects || [],
    power_level: extra.power || { initial: '', peak: '', evolution: [] }, known_feats: extra.feats || [], shared_by: extra.shared_by || [], see_also: extra.see_also || [], countered_by: [], counters: extra.counters || [], variations: [], evidence_level: 'S', source_refs: refs.map(src)
  }));
}
function event(id, zh, en, type, location, summary, cause, process, outcome, participants, refs, extra = {}) {
  write('events', id, chPeriod('event', id, {
    period_id: period, volume, time: extra.time || '全龙战期间', name: { zh, en }, type, location, summary, cause, process, outcome, aftermath: extra.aftermath || '', participants,
    casualties: extra.casualties || [], related_events: extra.related_events || [], significance: extra.significance || '', evidence_level: 'S', source_refs: refs.map(src)
  }));
}
function item(id, zh, en, type, description, owner, refs, extra = {}) {
  write('items', id, chPeriod('item', id, { period_id: period, volume, time: '全龙战期间', name: { zh, en }, aliases: extra.aliases || [], type, description, details: extra.details || {}, owner, status: extra.status || 'active', features: extra.features || [], associated_abilities: extra.abilities || [], history: extra.history || [], evidence_level: 'S', source_refs: refs.map(src) }));
}
function location(id, zh, en, type, description, controlled_by, refs, extra = {}) {
  write('locations', id, chPeriod('location', id, { period_id: period, volume, time: '全龙战期间', name: { zh, en }, aliases: extra.aliases || [], type, description, geography: extra.geography || {}, population: {}, controlled_by, affiliation: extra.affiliation || '', significance: extra.significance || '', notable_residents: extra.residents || [], key_events: extra.events || [], related_locations: extra.related || [], hazards: extra.hazards || [], secrets: extra.secrets || [], evidence_level: 'S', source_refs: refs.map(src) }));
}
function faction(id, zh, en, type, description, goals, leader, members, refs, extra = {}) {
  write('factions', id, chPeriod('faction', id, { period_id: period, volume, time: '全龙战期间', name: { zh, en }, aliases: extra.aliases || [], type, description, history: extra.history || '', goals, structure: extra.structure || '', leader, headquarters: extra.hq || '', members, allies: extra.allies || [], enemies: extra.enemies || [], key_events: extra.events || [], evidence_level: 'S', source_refs: refs.map(src) }));
}
function system(id, zh, en, type, description, refs, extra = {}) {
  write('systems', id, chPeriod('system', id, { period_id: period, volume, time: '全龙战期间', name: { zh, en }, aliases: extra.aliases || [], type, description, principles: extra.principles || '', classification: extra.classification || '', levels: extra.levels || [], known_practitioners: extra.practitioners || [], origin: extra.origin || '', limitations: extra.limitations || [], related_systems: extra.related || [], evidence_level: 'S', source_refs: refs.map(src) }));
}
function knowledge(id, zh, en, type, description, details, refs, extra = {}) {
  write('knowledge', id, chPeriod('knowledge', id, { period_id: period, volume, time: '全龙战后', name: { zh, en }, type, description, details, revealed_in: extra.revealed_in || 'Epilogue 帝国的起源', revealed_by: extra.revealed_by || ['airy-arcadia'], known_to: extra.known_to || ['airy-arcadia'], impact: extra.impact || '', related_knowledge: extra.related || [], verification: 'confirmed', evidence_level: 'S', source_refs: refs.map(src) }));
}

character('kirihime-yoruka','切姬夜架','Kirihime Yoruka',['夜架','帝国凶刃'],['阿卡迪亚帝国机龙使','旧古都国公主','路克斯的从仆'],'机龙使；暗杀者；从仆','旧阿卡迪亚帝国；后归向路克斯','夜架以帝国凶刃身份在学园现身，自称侍奉阿卡迪亚正统后继者路克斯；她展示夜刀神压制众多神装机龙使，后在建国纪念祭中袒露自己曾是古都国公主、以弟弟为人质而受帝国支配，最终选择继续侍奉路克斯而留在学园。',[498,524,1034,1613,4789,8490],{gender:'女',nationality:'东方古都国/旧帝国',appearance:'黑发及腰、左右异色瞳、黑色异国服饰，带有妖艳与危险气息。',personality:'将自身视为御主的道具，善恶观稀薄但对忠义极端执着。',traits:['忠义','妖艳','危险','战斗天才'],abilities:['yato-no-kami-stealth','engraving-strike','photon-stealth'],items:['yato-no-kami'],relationships:{'lux-arcadia':{relation:'御主',summary:'称路克斯为阿卡迪亚正统后继者与御主。'},'haze':{relation:'协力/利用关系',summary:'接受海兹递交的信件并参与计画相关行动。'}},secrets:['曾是古都国公主','弟弟可能被旧帝国/新王国相关势力当作人质'],events:[{event_id:'imperial-blade-appearance',summary:'在学园中庭向路克斯跪拜并宣誓效忠。',sourceRef:src(498)}]});
character('gurufa','古鲁法','Gurufa',['葛莱法','古尔法'],['梵海姆公国选拔队员','七龙骑圣候补'],'机龙使','梵海姆公国','梵海姆公国代表队的强力机龙使，在全龙战前与新王国选拔队员相遇，其实力和候补身份被提及。',[1866,1952],{gender:'男',nationality:'梵海姆公国',abilities:['cutter'],relationships:{'lux-arcadia':{relation:'对手/后续战友',summary:'全龙战前认识路克斯等人。'}},events:[{event_id:'first-battle-with-knight-order',summary:'梵海姆代表队在全龙战前被卷入袭击风波。',sourceRef:src(3119)}]});
character('cleo','柯莱尔','Cleo',['柯莱尔'],['梵海姆公国选拔队员'],'机龙使','梵海姆公国','梵海姆公国选拔队员之一，在王都与新王国成员接触，表现出对队伍规则和对抗战的重视。',[1866,1878],{gender:'女',nationality:'梵海姆公国'});
character('el-fajel','艾儿·法洁勒','El Fajel',['艾儿'],['海兹侧近'],'侍从/协力者','海兹阵营','艾儿·法洁勒在海兹与弗基尔讨论计划时在场，服从海兹的指令。',[2038],{gender:'女',relationships:{'haze':{relation:'侍从/部下',summary:'在海兹会议中回应并执行命令。'}}});
character('lux-arcadia','路克斯·阿卡迪亚','Lux Arcadia',['最弱无败','杂务王子','黑色英雄'],['前阿卡迪亚帝国第七皇子','莉夏的骑士'],'学生；机龙使；诱饵作战执行者','新王国亚提司玛特；王立士官学园','路克斯在负伤状态下接受诱饵作战，引出上百只幻神兽并在全龙战中完成四胜要求；他阻止巨兵并拒绝贵族化奖励，选择继续以学园与国家民众为优先。',[153,2534,5155,8261,8308],{gender:'男',abilities:['bahamut','divine-speed-control','extreme-strike','brand-sword'],items:['bahamut-divine-drag-ride','horn-flute'],relationships:{'kirihime-yoruka':{relation:'御主',summary:'被夜架认定为正统后继者并侍奉。'},'lisesharte-atismata':{relation:'主君/骑士',summary:'作为莉夏的骑士参与全龙战与防卫。'},'airy-arcadia':{relation:'妹妹',summary:'由爱理计算巴哈姆特使用极限并担忧他的伤势。'}},events:[{event_id:'bait-operation',summary:'独自担任诱饵引出幻神兽群。',sourceRef:src(5155)},{event_id:'lisesharte-named-lux-knight',summary:'战后因功绩受表彰但拒绝贵族化。',sourceRef:src(8261)}]});
character('lisesharte-atismata','莉姿夏尔蒂·亚提司玛特','Lisesharte Atismata',['莉夏'],['新王国公主','神装机龙使'],'公主；机龙使','新王国亚提司玛特','莉夏参加全龙战，迪亚玛特一度被海兹阵营干涉而在竞技场失控，后在决战中与伙伴共同对抗巨兵与海兹。',[5145,5475,7730],{gender:'女',abilities:['diyamart','sky-fortress'],items:['diyamart'],relationships:{'lux-arcadia':{relation:'骑士与主君',summary:'路克斯是她任命的骑士。'},'haze':{relation:'敌对',summary:'其机龙在比赛中遭海兹阵营干涉。'}}});
character('cu-luclure-fufura','库露露席法·恩芙尔克','Krulcifer Einfolk',['库露露席法'],['优密尔教国留学生','神装机龙使'],'学生；机龙使','优密尔教国；王立士官学园','库露露席法作为选拔队员参与全龙战，在迪亚玛特失控时以法夫纳武装协助压制，之后参与巨兵迎击。',[116,5598,7730],{gender:'女',abilities:['fafnir','freeze-breath-projection'],items:['fafnir']});
character('philfy','菲尔菲·爱格兰姆','Philuffy Aingram',['菲尔菲'],['神装机龙使'],'学生；机龙使','王立士官学园','菲尔菲在王都城门与拉葛利多率领的叛军和幻神兽群战斗，运用训练成果抵抗角笛并短暂主动触发幻神兽化力量击败敌人。',[7690,7820],{gender:'女',abilities:['typhon','gluttony','dragon-bite-chain'],items:['typhon'],relationships:{'lux-arcadia':{relation:'青梅竹马',summary:'因路克斯训练而能抵抗角笛影响。'}}});
character('celistine-langley','赛莉丝缇雅·兰格莉思','Celestia Ralgris',['赛莉丝'],['骑士团团长','四大贵族之女'],'学生；骑士团团长；机龙使','王立士官学园骑士团；兰格莉思家','赛莉丝在全龙战与王都防卫中承担核心战力；在城内对抗桑妮雅等B-blood机龙使并以支配者神域的新战术击破三人。',[5455,7470,7575],{gender:'女',abilities:['linde-dragon','dominator-domain'],items:['lindwurm'],relationships:{'sanyea':{relation:'旧识/敌对',summary:'面对桑妮雅复仇宣言仍坚持阻止其重演压迫。'}}});
character('kira-arcadia','弗基尔·阿卡迪亚','Fugil Arcadia',['弗基尔'],['旧帝国相关者'],'机龙使；策谋者','海兹阵营/旧帝国相关','弗基尔在海兹会议中提及收复帝都计画关键棋子尤克特拉希尔被消灭，并以旁观与引导的姿态参与海兹的计划。',[1998,2018],{gender:'男',relationships:{'haze':{relation:'协力者',summary:'劝阻并回应海兹的激烈行动。'},'lux-arcadia':{relation:'兄长/仇敌',summary:'路克斯长期追寻的旧帝国仇敌。'}}});
character('hayze','海兹','Hayes',['海兹','第三皇女海兹·薇·阿卡迪亚'],['海布格共和国军师','黑市商人','疑似古代皇族'],'军师；策谋者','海布格共和国军事部；古代阿卡迪亚相关','海兹策动收复帝都计画，利用叛军、B-blood机龙、角笛、巨兵与自身神装机龙尼德霍格攻击新王国；结尾古文书揭示她的名字与古代神圣阿卡迪亚皇族相连。',[184,1378,2050,7844,8462],{gender:'女',species:'疑似古代阿卡迪亚皇族相关者',abilities:['nidhogg','horn-flute-control'],items:['nidhogg'],relationships:{'sanyea':{relation:'上级',summary:'提拔桑妮雅等人成为直属部下。'},'kira-arcadia':{relation:'协力者',summary:'共同推进计划。'}},knowledge:['arcadia-truth'],secrets:['名字出现在古代神圣阿卡迪亚皇国皇族名录']});
character('sanyea','桑妮雅·蕾密斯托','Sanyea Remisto',['桑妮雅'],['地狱守门犬成员','海兹直属部下'],'机龙使；间谍','海布格共和国；地狱守门犬','桑妮雅作为海兹直属部下参与诱饵作战和王都袭击，装备B-blood飞翔机龙并以角笛操纵幻神兽；她执着于向赛莉丝等贵族复仇。',[1416,5120,7470],{gender:'女',abilities:['b-blood-combat','horn-flute-control'],items:['horn-flute'],relationships:{'hayze':{relation:'上级',summary:'被海兹拔擢成为直属部下。'},'celistine-langley':{relation:'敌对',summary:'以出身怨恨向赛莉丝复仇。'}}});
character('ignid','伊格尼德','Ignid',['伊格尼德'],['地狱守门犬成员'],'机龙使','海布格共和国；地狱守门犬','伊格尼德穿着B-blood陆战机龙参与废村伏击与城内战斗，作为桑妮雅同伴协助海兹计划。',[5116,7480],{gender:'男',abilities:['b-blood-combat']});
character('kitsururu','奇琉璃','Kitsururu',['奇琉璃'],['地狱守门犬成员','自动人形分身'],'机龙使/自动人形分身','海布格共和国；地狱守门犬','奇琉璃戴圆形面具，操纵B-blood特装机龙执行侦察与迷彩支援；被赛莉丝击破后显露自动人形分身性质。',[5118,7608],{gender:'女',species:'自动人形分身/人造体',abilities:['photon-stealth','b-blood-combat'],secrets:['被击破后身体崩解为细粉并露出机械核心']});
character('ragulide','拉葛利多·富鲁斯','Ragulide Fulth',['拉葛利多'],['叛军首领','旧帝国派大贵族'],'叛军首领；机龙使','旧帝国叛军；海布格利用对象','拉葛利多作为收复帝都计画的表面首领率领叛军攻城；他曾与路克斯幼年时期结怨，最终被菲尔菲击败并逮捕。',[2478,7690,8251],{gender:'男',abilities:['horn-flute-control'],items:['horn-flute'],relationships:{'philfy':{relation:'敌对',summary:'试图以角笛控制菲尔菲但失败。'}}});
character('relie-egram','蕾莉·爱格兰姆','Relie Aingram',['学园长蕾莉'],['王立士官学园学园长'],'学园长','王立士官学园','蕾莉此前擅自调查遗迹的责任成为执政院迫使路克斯接受诱饵作战与全龙战四胜要求的交易条件。',[2620,8261],{gender:'女'});
character('tiefa','媞尔珐','Tillfur Lillmit',['媞尔珐'],['骑士团三和音'],'学生；机龙使','王立士官学园骑士团','媞尔珐在本卷作为骑士团成员参与全龙战相关行动，并曾提及王都模拟战中黑发异色瞳少女的传闻。',[471],{gender:'女'});
character('serisu','莎莉丝/赛莉丝','Serisu',['赛莉丝别名'],['骑士团团长'],'学生；机龙使','王立士官学园骑士团','该条目记录本卷中赛莉丝相关别名/译名，与celistine-langley指向同一核心角色。',[5455,7470],{gender:'女',abilities:['dominator-domain'],relationships:{'celistine-langley':{relation:'同一角色/译名',summary:'本卷不同译名归并线索。'}}});
character('noct','诺珂特','Noct Leaflet',['诺珂特'],['骑士团三和音'],'学生；机龙使','王立士官学园骑士团','诺珂特在夜架现身时护送路克斯并警戒帝国凶刃，后与爱理在王都防卫中观察战局。',[430,522,7828],{gender:'女',abilities:['drake-camouflage-and-sensors']});
character('vulkair','巴葛莱萨','Balguressa',['巴葛莱萨'],['四大贵族之一'],'贵族；军事指挥官','新王国四大贵族','巴葛莱萨作为四大贵族参与召见路克斯和诱饵作战布置，率军在北门和隐藏要塞周边协助歼灭幻神兽。',[2420,5058],{gender:'男'});
character('mistress','密丝希斯','Mythis',['密丝希斯'],['海兹侧近/侍女'],'侍女','海兹阵营','密丝希斯在海兹与弗基尔讨论收复帝都计画时担心海兹安危并发言。',[1986],{gender:'女',relationships:{'hayze':{relation:'侍女/随从',summary:'在会议中称呼海兹殿下。'}}});

ability('yorukami','夜刀神','Yato-no-Kami','technology / combat','夜架的特装型神装机龙，黑色装甲，拥有刀型机龙牙剑、探测、迷彩与高速剑技，是帝国凶刃实力的核心。',[1034,1382,3189],{aliases:['夜刀神神装机龙'],shared_by:['kirihime-yoruka'],effects:['高速机动','斩击','探测','迷彩'],feats:['在学园附近同时应对莉夏、库露露席法、菲尔菲、赛莉丝等人的围攻']});
ability('cursed-symbol','咒印/控制符号','Cursed Symbol','supernatural / technology','海兹阵营通过接触或暗中干涉机龙，使迪亚玛特等机体失控的手段，表现为黑袍人影接触后机龙异常行动。',[5465,5515],{effects:['机龙控制异常','强制攻击观众席'],shared_by:['hayze']});
ability('engraving-strike','刻印斩击','Engraving Strike','combat','夜架使用刀型机龙牙剑和机攻壳剑发动的高速斩击，能在近距离对抗多名神装机龙使。',[1038,1170],{shared_by:['kirihime-yoruka'],see_also:['yorukami']});
ability('nidhogg','尼德霍格','Nidhogg','technology / combat','海兹操纵的神装机龙，具备双翼刃剑与光壁防御，在巨兵启动后与莉夏等人交战。',[7866],{shared_by:['hayze'],effects:['光壁防御','翼刃斩击'],see_also:['gigant']});
ability('cutter','切断者/强力斩击','Cutter','combat','梵海姆公国强者在全龙战前后展示的近战切断型能力线索，用于记录葛莱法等代表队武装倾向。',[1952],{shared_by:['gurufa']});
ability('photon-stealth','光子迷彩','Photon Stealth','technology / support','特装机龙或夜刀神可用的迷彩/隐蔽功能。奇琉璃以B-blood特装机龙试图逃走，夜架也以夜刀神隐蔽行动。',[1382,7600],{shared_by:['kirihime-yoruka','kitsururu'],effects:['隐蔽身形','侦察逃脱']});
ability('gigant','巨兵','Gigant','technology / weapon','第五改变兵器《巨兵》，海兹用于袭击王都的超巨大兵器，能震动大地并从王都市镇侧造成毁灭性威胁。',[5041,7838],{aliases:['第五改变兵器《巨兵》'],shared_by:['hayze'],effects:['巨体突袭','震动城市','战略威慑']});
ability('bahamut','巴哈姆特','Bahamut','technology / combat','路克斯的漆黑神装机龙；本卷因前战副作用有使用时限，仍作为黑色英雄力量的象征。',[168,8268],{shared_by:['lux-arcadia'],effects:['高机动战斗','限界突破后副作用']});
ability('diyamart','迪亚玛特','Diyamart','technology / combat','莉夏的神装机龙；本卷在全龙战中遭到干涉失控，朝观众席发射机龙息炮。',[5475],{shared_by:['lisesharte-atismata'],effects:['机龙息炮','被控制失控']});
ability('fafnir','法夫纳','Fafnir','technology / combat','库露露席法的神装机龙，以冻息投射等武装协助压制失控的迪亚玛特。',[5598],{shared_by:['cu-luclure-fufura']});
ability('linde-dragon','凛德龙虫','Lindwurm','technology / combat','赛莉丝的神装机龙，凭支配者神域与雷光穿枪在城内压制桑妮雅等B-blood机龙使。',[5455,7558],{shared_by:['celistine-langley'],see_also:['dominator-domain']});
ability('typhon','堤丰','Typhon','technology / combat','菲尔菲的神装机龙，利用龙咬缚锁和无情果实击破拉葛利多及叛军。',[7690,7788],{shared_by:['philfy'],see_also:['gluttony','dragon-bite-chain']});
ability('kuyereburu','奎雷布鲁/奇美拉战斗','Kuyereburu','combat','本卷幻神兽战中出现奇美拉等复合型敌人，与角笛操纵体系相关。',[5175],{shared_by:['phantom-beast'],effects:['协同偷袭']});
ability('gluttony','无情果实','Gluttony','technology / supernatural','堤丰神装，可让其他机龙神装无效化并降低机龙功率。菲尔菲在抵抗角笛后短暂发动击破拉葛利多。',[7788],{shared_by:['philfy'],effects:['神装无效化','机龙功率降低']});
ability('brand-sword','障壁牙剑','Brand Sword','combat / equipment','路克斯用于弹开光弹、发动极击的主要武装。',[5138,5190],{shared_by:['lux-arcadia'],effects:['防御','极击斩断幻神兽']});
ability('divine-speed-control','神速制御','Divine Speed Control','combat','路克斯与顶级机龙使以高度操纵技术完成高速防御、闪避和极击时体现的战斗能力。',[5188,5295],{shared_by:['lux-arcadia']});
ability('force-overflow','强制过载','Force Overflow','technology','机龙或B-blood体系通过种子强化宿主与机体性能，伴随失控和身体负担风险。',[7470],{shared_by:['sanyea','ignid','kitsururu']});
ability('perpetual-chain','龙咬缚锁','Perpetual Chain','technology / combat','菲尔菲的堤丰钢线/锁链武装，用来拉扯幻神兽、移动、捕捉敌机并连段爆破。',[7700,7720],{shared_by:['philfy'],effects:['捕捉','牵引','高速移动']});
ability('extreme-strike','极击','Extreme Strike','combat','路克斯通过读准攻击模式，在瞬间以障壁牙剑粉碎奇美拉和石像鬼。',[5188],{shared_by:['lux-arcadia'],effects:['精准反击','击杀幻神兽']});
ability('loud-speaker','龙声传递','Dragon Voice','technology / communication','机龙间通信能力。桑妮雅通过龙声传递向路克斯说明魔禁书维持角笛命令的机制。',[5224],{shared_by:['sanyea','lux-arcadia']});
ability('sky-fortress','空挺要塞','Sky Fortress','technology / weapon','莉夏的迪亚玛特投掷/远隔武装，在围攻夜架时用于追击。',[1086],{shared_by:['lisesharte-atismata']});
ability('freeze-breath-projection','冻息投射','Freeze Breath Projection','technology / weapon','法夫纳武装，库露露席法用于冻结迪亚玛特的机龙息炮、双脚与背翼以阻止失控。',[5598],{shared_by:['cu-luclure-fufura']});
ability('dominator-domain','支配者神域','Dominator Domain','technology / combat','赛莉丝的凛德龙虫神装，展开领域并瞬间移动，能用于最大功率障壁与交叉重击。',[5588,7558],{shared_by:['celistine-langley'],effects:['瞬间移动','障壁防御','交叉重击']});
ability('heaven-sound','天声/角笛传播','Heaven Sound','supernatural / technology','角笛与魔禁书传播命令形成的群体控制音色，使幻神兽持续执行命令。',[5112,5230],{shared_by:['sanyea','ragulide'],effects:['扰乱脑部','操纵幻神兽']});

item('horn-flute','角笛','Horn Flute','artifact','操纵幻神兽的宝物。叛军与海兹阵营利用角笛聚集大量幻神兽；路克斯也持有角笛尝试夺取控制权。','sanyea / ragulide / lux-arcadia',[2530,5108,5250],{abilities:['heaven-sound'],features:['发出扰乱脑部的音色','可命令幻神兽','可被魔禁书延长命令效果']});

location('deralia-capital','王都/德拉利亚','Deralia Capital','city','全龙战与建国纪念祭举行地，也是收复帝都计画和巨兵袭击目标。','新王国亚提司玛特',[1729,5520],{events:['all-dragon-war','gigant-attack-on-capital'],hazards:['幻神兽袭击','巨兵袭击']});
location('moonlight-hall','王城议事堂/月光大厅','Moonlight Hall','building','新王国执政官和四大贵族召见路克斯与爱理，说明收复帝都计画并提出诱饵作战条件的地点。','新王国执政院',[2420,2500],{events:['reclaim-capital-plan']});
location('hidden-fortress','北方隐藏要塞','Hidden Fortress','facility','王都北方隐藏要塞，路克斯将幻神兽群引至此处，由新王国军和贵族部队集中歼灭。','新王国军',[5064,5318],{events:['bait-operation'],hazards:['幻神兽群']});
location('crossfield','克罗斯菲德','Crossfield','city / school','王立士官学园所在城塞都市。本卷开头路克斯在医务室疗养，夜架在学园中庭现身。','新王国亚提司玛特',[93,498],{events:['imperial-blade-appearance']});

faction('vanheim-duchy','梵海姆公国','Vanheim Duchy','nation','参加全龙战的国家之一，派出葛莱法、柯莱尔等选拔队员，并因被操纵的新王国机龙使袭击旅馆而卷入外交危机。','参加全龙战并争取遗迹调查权','', ['gurufa','cleo'],[1866,3128],{events:['first-battle-with-knight-order']});
faction('hell-cerberus','地狱守门犬','Hell Cerberus','organization','海兹直属特殊部队，成员包括桑妮雅、伊格尼德、奇琉璃，隶属海布格共和国并装备B-blood机龙。','执行海兹的伏击与王都袭击计划','hayze',['sanyea','ignid','kitsururu'],[1416,5120],{allies:['hague-republic'],enemies:['new-kingdom-atismata']});
faction('hague-republic','海布格共和国','Hague Republic','nation','军事部庞大化并利用旧帝国叛军推进收复帝都计画的共和国。','间接控制新王国并夺取政治军事利益','军事部/海兹',['hayze','sanyea','ignid','kitsururu'],[184,2438],{events:['reclaim-capital-plan']});
faction('archid-empire','阿卡迪亚帝国/旧帝国','Arcadia Empire','nation','曾统治大陆的旧帝国，残党成为叛军；夜架曾与皇帝缔约并被纳入帝国控制。','旧帝国复兴或被海布格利用为名义','', ['kirihime-yoruka','ragulide','lux-arcadia'],[430,2514,4770],{enemies:['new-kingdom-atismata']});
faction('new-kingdom-atismata','亚提司玛特新王国','New Kingdom Atismata','nation','旧帝国灭亡后建立的新王国。本卷在全龙战与建国纪念祭期间遭遇收复帝都计画与巨兵袭击。','守卫王都并维持国家独立','queen-raffi',['lux-arcadia','lisesharte-atismata','celistine-langley'],[2438,8261],{enemies:['hague-republic','archid-empire']});

system('seven-change-weapons','七个改变兵器','Seven Change Weapons','technology','古代/遗迹级大型战略兵器体系，本卷第五改变兵器《巨兵》作为其中之一袭击王都。',[5041,7838],{aliases:['改变兵器'],related:['gigant','ruins-system']});
system('divine-dragon-system','神装机龙体系','Divine Drag-Ride System','technology / combat','神装机龙拥有独特神装和特殊武装，本卷集中展示夜刀神、尼德霍格、迪亚玛特、凛德龙虫、堤丰等机体。',[958,5455,7866],{practitioners:['kirihime-yoruka','hayze','lisesharte-atismata','celistine-langley','philfy'],related:['drag-ride-system']});
system('phantom-beast','幻神兽与角笛控制','Phantom Beast Control','supernatural / combat','幻神兽可由角笛控制；魔禁书能传播并维持角笛命令，使大量幻神兽持续行动。',[2518,5112,5230],{aliases:['幻神兽控制体系'],related:['heaven-sound','horn-flute'],limitations:['需处理魔禁书等特殊个体，否则控制命令不易夺取']});
knowledge('arcadia-truth','阿卡迪亚起源真相线索','Arcadia Origin Truth','truth','爱理解读方舟古文书时发现神圣阿卡迪亚皇国第十三代皇族名中包括第三皇女海兹·薇·阿卡迪亚。','该记载暗示阿卡迪亚帝国名称并非偶然借用古代皇国之名，也让海兹的银发灰眼与旧帝国皇族容貌产生关联，动摇爱理对自身与帝国起源的理解。',[8448,8462,8470],{impact:'为海兹身份、阿卡迪亚帝国与七大遗迹关系埋下重大伏笔。',related:['arcadia-bloodline-qualification','ruins-system']});

event('imperial-blade-appearance','帝国凶刃现身','Imperial Blade Appearance','incident','王立士官学园中庭','切姬夜架以帝国凶刃身份现身，向路克斯跪拜并自称从仆。','夜架追随阿卡迪亚正统后继者而来。','夜架在中庭宣称侍奉路克斯，并展现异常强大的战斗和逃脱能力。','路克斯与爱理等人开始警戒夜架真正意图。',['kirihime-yoruka','lux-arcadia','airy-arcadia','noct'],[498,524]);
event('reclaim-capital-plan','收复帝都计画揭露','Reclaim Capital Plan Revealed','conspiracy','王城议事堂','执政院向路克斯和爱理说明海布格军事部利用旧帝国叛军袭击新王国的计划。','海布格军事部企图通过叛军间接控制新王国。','计划包括叛军攻陷王都、幻神兽群袭击、利用全龙战后警卫薄弱时机。','路克斯被要求担任诱饵并赢得全龙战四胜。',['lux-arcadia','airy-arcadia','vulkair','ragulide','hayze'],[2430,2460,2518,2574]);
event('bait-operation','诱饵作战','Bait Operation','battle','王都西北废村至北方隐藏要塞','路克斯独自引诱近百只幻神兽，将其带入隐藏要塞伏击圈。','执政院要求路克斯抢先歼灭收复帝都计画战力。','路克斯遭桑妮雅等人伏击，确认魔禁书维持角笛命令后继续引诱幻神兽。','幻神兽群进入隐藏要塞战场，但王都方向爆发真正袭击。',['lux-arcadia','sanyea','ignid','kitsururu'],[5050,5112,5230,5318],{significance:'显示路克斯负伤状态下仍能承担战略级诱饵任务。'});
event('gigant-attack-on-capital','巨兵袭击王都','Gigant Attack on Capital','battle / disaster','王都','第五改变兵器《巨兵》在海兹计划中启动并袭击王都。','诱饵作战与全龙战转移了新王国主力注意力。','海兹借由B-blood部队、叛军和巨兵多线攻击，使王都陷入危机。','路克斯与伙伴阻止巨兵，收复帝都计画失败。',['hayze','lux-arcadia','lisesharte-atismata','philfy','celistine-langley'],[7838,8261],{significance:'本卷最大规模战役，连接古代改变兵器与阿卡迪亚真相。'});
event('lisesharte-named-lux-knight','路克斯功绩与拒绝晋升','Lux Reward and Refusal','milestone','新王国执政院','路克斯因诱饵作战、四胜与阻止巨兵获得表彰，却拒绝成为贵族和七龙骑圣，选择继续学园生活。','执政院试图以奖赏和身份升格约束路克斯。','路克斯看穿政治陷阱并提出今后不要经由他人转告委托。','四大贵族重新评价路克斯的王者资质。',['lux-arcadia','airy-arcadia','vulkair'],[8261,8308,8350],{significance:'路克斯以弱势身份反制执政官，确立政治成长。'});
event('all-dragon-war','全龙战','All Dragon War','battle / ceremony','王都竞技场','各国士官候补生参与的校外对抗战，本卷与建国纪念祭、遗迹调查权和收复帝都计画同时交错。','各国争夺遗迹调查权。','新王国队在路克斯执行诱饵任务期间继续比赛，并达成四胜目标。','新王国保住遗迹调查权相关利益。',['lisesharte-atismata','cu-luclure-fufura','philfy','celistine-langley','lux-arcadia'],[1088,5365,8261]);
event('first-battle-with-knight-order','梵海姆队遭袭事件','Attack on Vanheim Team','incident','梵海姆公国下榻旅馆','新王国机龙使被操纵袭击梵海姆选拔队员，引发外交危机并被怀疑与夜架或收复帝都计画相关。','海兹阵营制造混乱并削弱各方信任。','巡逻武将声称机龙忽然失控并攻击旅馆。','事件被暂时压下，后续因桑妮雅等人证言解释迪亚玛特失控机制。',['gurufa','cleo','lux-arcadia','kirihime-yoruka'],[3119,3180,8251]);

console.log('manual vol-06 entities written');
