const fs = require('fs');
const path = require('path');

const LIB_ROOT = path.join('campaigns', 'world-library');
const WORLDS_ROOT = path.join(LIB_ROOT, 'worlds');
const RAW_ROOT = path.join(LIB_ROOT, 'imports', 'worldviews');
const INDEX_PATH = path.join(LIB_ROOT, '.wl-index.json');
const REPORT_ROOT = path.join(LIB_ROOT, 'manual-curation', 'reports');
const NOW = new Date().toISOString();

const TARGET_WORLDS = ['campione', 'rakudai-kishi', 'saijaku-muhai-bahamut'];
const GENERATED_STORY_DIRS = new Set([
  'chapter-archives', 'chapter-archives-curated', 'volume-archives', 'volume-refined', 'retry-queues',
  'curated-unit-archives', 'curated-unit-refined', 'retry-queues-curated', 'series-archive', 'summaries'
]);

const WORLD_META = {
  campione: {
    name: '弑神者！ / Campione!',
    genre: ['modern-fantasy', 'mythology', 'battle'],
    summary: '现代神话战斗世界。脱离神话束缚的不顺从之神会降临现实并造成灾害，极少数人类能弑杀神明并篡夺权能，成为被魔术师敬畏的地上魔王“弑神者”。',
    keyTerms: ['弑神者', '不顺从之神', '权能', '魔术师', '媛巫女', '魔王', '不从之神'],
    factions: ['赤铜黑十字', '青铜黑十字', '正史编纂委员会', '贤人议会', '五狱圣教', '王立工厂'],
    powers: ['权能', '魔术', '灵视', '言灵', '神力', '化身'],
    characterHints: ['草薙护堂', '艾莉卡', '万里谷佑理', '莉莉娅娜', '雅典娜', '沃班', '罗翠莲', '罗濠', '萨尔巴特雷', '潘多拉']
  },
  'rakudai-kishi': {
    name: '落第骑士英雄谭 / Chivalry of a Failed Knight',
    genre: ['academy-battle', 'supernatural', 'tournament'],
    summary: '以伐刀者、固有灵装与魔力等级为核心的学园战斗世界。破军学园与七星剑武祭构成主要舞台，落第骑士黑铁一辉以技巧和意志挑战天赋与制度。',
    keyTerms: ['伐刀者', '固有灵装', '魔力', '七星剑武祭', '破军学园', '解放军', '魔人'],
    factions: ['破军学园', '晓学园', '解放军', '黑铁家', '法米利昂皇国', '联盟'],
    powers: ['伐刀者', '固有灵装', '一刀修罗', '一刀罗刹', '魔力', '魔人'],
    characterHints: ['黑铁一辉', '史黛菈', '黑铁珠雫', '有栖院凪', '东堂刀华', '新宫寺黑乃', '黑铁王马', '爱德怀斯']
  },
  'saijaku-muhai-bahamut': {
    name: '最弱无败神装机龙 / Undefeated Bahamut Chronicle',
    genre: ['academy-battle', 'ancient-mecha', 'fantasy'],
    summary: '以古代兵器“机龙”、神装机龙、遗迹与王国政治为核心的幻想学园战斗世界。前帝国皇子路克斯以“最弱无败”与“黑色英雄”的双重身份卷入新王国、遗迹与世界联盟的危机。',
    keyTerms: ['机龙', '神装机龙', '幻神兽', '遗迹', '七龙骑圣', '阿卡迪亚', '新王国', '圣蚀'],
    factions: ['阿卡迪亚帝国', '亚提司玛特新王国', '王立士官学园', '龙匪贼', '七龙骑圣', '世界联盟', '优密尔教国'],
    powers: ['机龙', '神装机龙', '幻创机核', '机攻壳剑', '限界突破', '遗迹', '圣蚀'],
    characterHints: ['路克斯', '莉夏', '莉姿夏尔蒂', '库露露席法', '菲尔菲', '赛莉丝', '切姬夜架', '爱理', '弗基尔']
  }
};

function exists(p) { return fs.existsSync(p); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8'); }
function writeText(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, v, 'utf8'); }
function slash(p) { return p.split(path.sep).join('/'); }
function compact(s, n = 360) { const x = String(s || '').replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; }
function safeId(s) { return String(s || 'item').toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5·.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'item'; }
function cleanName(s) { return String(s || '').replace(/["“”{}\[\]]/g, '').replace(/,$/, '').replace(/\s+/g, ' ').trim(); }
function sourceRef(world, entry) { return `raw:${world}:${encodeURIComponent(entry.file)}:${entry.index}`; }
function includesAny(text, arr) { return arr.filter(x => text.includes(x)); }

function cleanupGeneratedStoryIndexes(storiesRoot) {
  if (!exists(storiesRoot)) return;
  for (const name of fs.readdirSync(storiesRoot)) {
    if (GENERATED_STORY_DIRS.has(name)) continue;
    const p = path.join(storiesRoot, name);
    if (fs.statSync(p).isDirectory() && exists(path.join(p, 'index.json'))) fs.rmSync(p, { recursive: true, force: true });
  }
}

function loadRawEntries(world) {
  const dir = path.join(RAW_ROOT, world, 'worldbooks');
  const out = [];
  if (!exists(dir)) return out;
  for (const fn of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const data = readJson(path.join(dir, fn));
    for (const [i, e] of (data.entries || []).entries()) {
      out.push({ world, file: fn, index: Number.isFinite(e.index) ? e.index : i, comment: e.comment || '', keys: e.keys || [], secondaryKeys: e.secondaryKeys || e.secondary_keys || [], content: e.content || '', enabled: e.enabled !== false });
    }
  }
  return out;
}

function extractName(entry) {
  const content = entry.content || '';
  const patterns = [
    /人物姓名\s*[:：]\s*([^\n(（]+)/,
    /CoreIdentity:\s*[\s\S]{0,300}?Name\s*:\s*["“]([^"”\n]+)["”]/,
    /\bName\s*:\s*["“]([^"”\n]+)["”]/,
    /["“]name["”]?\s*:\s*["“]([^"”\n]+)["”]/,
    /^\s*([\u4e00-\u9fa5A-Za-z·.\s]+)\s*[-—：:]\s*\*\*身份/m
  ];
  for (const re of patterns) {
    const m = content.match(re);
    if (m && m[1]) return cleanName(m[1]);
  }
  return cleanName(entry.comment.replace(/^(主要人物|次要人物|不从之神|不順從之神|人物|角色)\s*[:：]?\s*/, '').trim() || entry.keys[0] || `entry-${entry.index}`);
}

function isStoryEntry(entry) {
  const label = [entry.comment, ...(entry.keys || [])].join('\n');
  const contentStart = String(entry.content || '').slice(0, 900);
  if (/模式名称|协议|protocol|template|模板|原创角色|替代型主角|并行型主角|章节剧情处理系统|处理系统|弧光|识别|🗑️|WORLD_arc_framework/i.test(label)) return false;
  if (/^<template_|^<original_character_protocol>|^<WORLD_arc_framework/i.test(contentStart.trim())) return false;
  return /<章节剧情>|章节标题\s*[:：]|^第[一二三四五六七八九十百〇零0-9]+卷|卷[一二三四五六七八九十百〇零0-9]+/.test(label + '\n' + contentStart);
}

function isCharacterEntry(entry) {
  const label = [entry.comment, ...(entry.keys || [])].join('\n');
  const contentStart = String(entry.content || '').slice(0, 1200);
  if (/模式名称|协议|protocol|template|原创角色|战力等级|等级划分|世界核心|核心世界观|机龙设定|弧光识别|身份適應法則|NPC响应/i.test(label)) return false;
  if (/^权能\s*[:：]/.test(entry.comment)) return false;
  if (/^(主要人物|次要人物|不从之神|不順從之神)\s*[:：]/.test(entry.comment)) return true;
  if (/CharacterCard|人物姓名\s*[:：]|["“]name["”]?\s*:|\bName\s*:/.test(contentStart)) return true;
  return false;
}

function classifyWorldEntry(entry) { if (isStoryEntry(entry)) return 'story'; if (isCharacterEntry(entry)) return 'character'; return 'world'; }

function buildCharacter(world, entry) {
  const meta = WORLD_META[world];
  const name = extractName(entry);
  const hay = `${entry.comment}\n${entry.keys.join('\n')}\n${entry.content}`;
  const aliases = [...new Set([entry.comment, ...entry.keys, ...entry.secondaryKeys].map(x => cleanName(String(x).replace(/^(主要人物|次要人物|不从之神|不順從之神)\s*[:：]?\s*/, ''))).filter(x => x && x !== name).slice(0, 24))];
  const roles = [];
  if (/主角|主人公/.test(hay)) roles.push('主角');
  if (/女主|公主|皇女|巫女|魔女|女神|少女/.test(hay)) roles.push('主要女性角色');
  if (/弑神者|Campione|魔王/.test(hay)) roles.push('弑神者');
  if (/不从之神|不順從之神|神明|女神/.test(hay)) roles.push('神格/神明');
  if (/伐刀者|骑士|騎士/.test(hay)) roles.push('伐刀者/骑士');
  if (/机龙使|機龍使|七龙骑圣|七龍騎聖/.test(hay)) roles.push('机龙使');
  if (/反派|敌|敵|恐怖|叛军|龙匪贼|解放军/.test(hay)) roles.push('敌对/反派势力相关');
  const factions = includesAny(hay, meta.factions);
  const powerSystems = includesAny(hay, meta.powers.concat(meta.keyTerms));
  const source = sourceRef(world, entry);
  const isPrimaryHint = meta.characterHints.some(x => hay.includes(x));
  const importance = isPrimaryHint || /主角|主人公|主要人物|女主|弑神者|七龙骑圣|七龍騎聖|第七位王|黑色英雄/.test(hay) ? 'primary' : (/次要人物/.test(entry.comment) ? 'secondary' : 'supporting');
  return { id: safeId(name), name, aliases, sourceKeys: [...new Set([name, ...entry.keys, ...entry.secondaryKeys].filter(Boolean))], visibility: 'public', summary: compact(entry.content, 260), detail: compact(entry.content, 1800), sourceContent: compact(entry.content, 2600), roles: roles.length ? [...new Set(roles)] : ['角色'], factions, locations: [], powerSystems, abilities: includesAny(hay, meta.powers).slice(0, 12), items: [], relationships: [], importance, evidenceLevel: 'A', sourceRefs: [source, `${entry.file}:entry ${entry.index}`], sourceWorldbook: entry.file, sourceEntryIndex: entry.index };
}

function buildWorldItem(world, entry, section, ordinal) { return { id: safeId(`${section}-${entry.comment || entry.keys[0] || ordinal}`), name: cleanName(entry.comment || entry.keys[0] || `${section}-${ordinal}`), summary: compact(entry.content, 420), sourceRefs: [sourceRef(world, entry), `${entry.file}:entry ${entry.index}`], sourceKeys: entry.keys || [] }; }

function buildStory(world, entry, ordinal) {
  const titleMatch = entry.content.match(/章节标题\s*[:：]\s*["“]?([^"”\n]+)/);
  const title = cleanName(titleMatch?.[1] || entry.comment || entry.keys[0] || `story-${ordinal}`);
  const storyId = safeId(title || `story-${ordinal}`);
  const file = slash(path.join('stories', storyId, `${storyId}.md`));
  const arc = { id: storyId, name: title, summary: compact(entry.content, 650), file, sourceRef: sourceRef(world, entry), sourceKeys: entry.keys || [] };
  return { storyId, title, file, arc, entry };
}

function buildCuratedWorld(world) {
  const meta = WORLD_META[world];
  const entries = loadRawEntries(world).filter(e => e.enabled);
  const curated = path.join(WORLDS_ROOT, world, 'curated');
  const storiesRoot = path.join(curated, 'stories');
  ensureDir(curated); ensureDir(storiesRoot); cleanupGeneratedStoryIndexes(storiesRoot);
  const classified = entries.map(e => ({ entry: e, kind: classifyWorldEntry(e) }));
  const characterEntries = classified.filter(x => x.kind === 'character').map(x => x.entry);
  const storyEntries = classified.filter(x => x.kind === 'story').map(x => x.entry);
  const worldEntries = classified.filter(x => x.kind === 'world').map(x => x.entry);
  const seen = new Set();
  const characters = [];
  for (const entry of characterEntries) { const ch = buildCharacter(world, entry); if (seen.has(ch.id)) ch.id = `${ch.id}-${entry.index}`; seen.add(ch.id); characters.push(ch); }
  const powerSystems = [], factions = [], rules = [], publicEvents = [];
  for (const entry of worldEntries) {
    const hay = `${entry.comment}\n${entry.keys.join('\n')}\n${entry.content.slice(0, 900)}`;
    if (/权能|能力|魔力|机龙|神装|伐刀者|固有灵装|体系|力量|战力|等级/.test(hay)) powerSystems.push(buildWorldItem(world, entry, 'power', powerSystems.length + 1));
    else if (/组织|结社|学园|王国|帝国|家族|委员会|骑士团|龙匪贼|联盟|教国|势力/.test(hay)) factions.push(buildWorldItem(world, entry, 'faction', factions.length + 1));
    else if (/规则|协议|模式|法则|指南|设定|模板|原则|rank|system/i.test(hay)) rules.push(buildWorldItem(world, entry, 'rule', rules.length + 1));
    else publicEvents.push(buildWorldItem(world, entry, 'entry', publicEvents.length + 1));
  }
  const storyRecords = storyEntries.map((entry, i) => buildStory(world, entry, i + 1));
  for (const s of storyRecords) {
    const storyDir = path.join(storiesRoot, s.storyId); ensureDir(storyDir);
    writeText(path.join(curated, s.file), `# ${s.title}\n\n- sourceRef: ${s.arc.sourceRef}\n- sourceWorldbook: ${s.entry.file}\n- sourceEntryIndex: ${s.entry.index}\n\n${s.entry.content}\n`);
    writeJson(path.join(storyDir, 'index.json'), { schema: 'rp-story-index-v1', worldId: world, storyId: s.storyId, title: s.title, totalChapters: 1, sourceRef: s.arc.sourceRef, arcs: [s.arc] });
  }
  writeJson(path.join(curated, 'characters-index.json'), { schema: 'rp-characters-index-v1', worldId: world, source: 'raw world_query/worldbook entries normalized into curated character index', generatedAt: NOW, characters, totalCharacters: characters.length });
  writeJson(path.join(curated, 'world.json'), { schema: 'rp-world-v1', worldId: world, worldName: meta.name, genre: meta.genre, summary: meta.summary, sandboxPrinciple: 'Source-backed curated layer generated from original worldbook entries. Raw novel text remains separate under sources/raw-text; formal relationship promotion still requires review.', hasFixedFate: true, foreignPowerSuppressionDefault: 'match-local-rules', powerSystems: powerSystems.slice(0, 24), factions: factions.slice(0, 24), energyEnvironment: { keyTerms: meta.keyTerms }, locations: [], timelines: storyRecords.slice(0, 80).map((s, i) => ({ id: s.storyId, name: s.title, order: i + 1, sourceRef: s.arc.sourceRef })), publicEvents: publicEvents.slice(0, 40), hiddenEvents: [], rules: rules.slice(0, 40), extensions: { sourceWorldbooks: [...new Set(entries.map(e => e.file))], generatedAt: NOW } });
  writeJson(path.join(curated, 'source-registry.json'), { schema: 'rp-source-registry-v1', worldId: world, generatedAt: NOW, sources: [...new Set(entries.map(e => e.file))].map(fn => ({ id: fn.replace(/\.json$/, ''), title: fn, type: 'raw-worldbook', path: slash(path.join(RAW_ROOT, world, 'worldbooks', fn)), status: 'indexed', entryCount: entries.filter(e => e.file === fn).length })) });
  writeJson(path.join(curated, 'relationship-graph.json'), { schema: 'rp-relationship-graph-v1', worldId: world, generatedAt: NOW, source: 'nodes only from curated characters-index; semantic edges require human review', nodes: characters.map(ch => ({ id: ch.id, name: ch.name, type: 'character', importance: ch.importance, sourceRefs: ch.sourceRefs })), edges: [], reviewRequired: true });
  writeJson(path.join(curated, 'knowledge-graph.json'), { schema: 'rp-knowledge-graph-v1', worldId: world, generatedAt: NOW, nodes: [...powerSystems.slice(0, 40).map(x => ({ id: x.id, name: x.name, type: 'power-system', summary: x.summary, sourceRefs: x.sourceRefs })), ...factions.slice(0, 40).map(x => ({ id: x.id, name: x.name, type: 'faction', summary: x.summary, sourceRefs: x.sourceRefs }))], edges: [] });
  writeText(path.join(curated, 'curation-notes.md'), `# ${meta.name} normal curated layer\n\n- generatedAt: ${NOW}\n- raw worldbook entries: ${entries.length}\n- characters: ${characters.length}\n- stories: ${storyRecords.length}\n- source: campaigns/world-library/imports/worldviews/${world}/worldbooks/\n\n本层按 world_query 已支持的正式 curated schema 生成：world.json、source-registry.json、characters-index.json、stories/{storyId}/index.json、relationship-graph.json、knowledge-graph.json。\n\n关系图当前只写入角色节点；语义边需要人工复核后再提升。\n`);
  return { world, entries: entries.length, characters: characters.length, stories: storyRecords.length, powerSystems: powerSystems.length, factions: factions.length, rules: rules.length };
}

function updateWorldLibraryIndex(results) {
  const idx = exists(INDEX_PATH) ? readJson(INDEX_PATH) : { version: 1, worlds: {} };
  idx.worlds = idx.worlds || {};
  for (const r of results) {
    const world = r.world;
    const existing = idx.worlds[world] || {};
    const curated = path.join(WORLDS_ROOT, world, 'curated');
    const storiesRoot = path.join(curated, 'stories');
    const stories = {};
    if (exists(storiesRoot)) for (const storyId of fs.readdirSync(storiesRoot).sort()) {
      const indexPath = path.join(storiesRoot, storyId, 'index.json'); if (!exists(indexPath)) continue;
      const si = readJson(indexPath);
      stories[storyId] = { title: si.title || storyId, chapters: (si.arcs || []).length, arcs: (si.arcs || []).map(a => ({ id: a.id, name: a.name, summary: a.summary, file: a.file, sourceRef: a.sourceRef })) };
    }
    idx.worlds[world] = { ...existing, status: 'curated', path: `worlds/${world}/curated/`, rawWorldbookPath: existing.status === 'raw' ? existing.path : existing.rawWorldbookPath, rawWorldbookFiles: existing.status === 'raw' ? existing.files : existing.rawWorldbookFiles, rawWorldbookEntries: existing.status === 'raw' ? existing.entries : existing.rawWorldbookEntries, characters: { count: r.characters }, stories, normalCurated: { generatedAt: NOW, entries: r.entries, characters: r.characters, stories: r.stories } };
  }
  idx.builtAt = NOW; writeJson(INDEX_PATH, idx);
}

function buildNormalCuratedFromWorldbooks(options = {}) {
  const results = TARGET_WORLDS.map(w => buildCuratedWorld(w));
  updateWorldLibraryIndex(results);
  ensureDir(REPORT_ROOT);
  const report = { schema: 'rp-normal-curated-worldbook-build-report-v1', generatedAt: NOW, status: 'passed', worlds: results };
  writeJson(path.join(REPORT_ROOT, 'normal-curated-worldbook-build-report.json'), report);
  writeText(path.join(REPORT_ROOT, 'normal-curated-worldbook-build-report.md'), `# Normal Curated Worldbook Build Report\n\n- generatedAt: ${NOW}\n- status: passed\n\n| world | raw entries | characters | stories | powerSystems | factions | rules |\n|---|---:|---:|---:|---:|---:|---:|\n${results.map(r => `| ${r.world} | ${r.entries} | ${r.characters} | ${r.stories} | ${r.powerSystems} | ${r.factions} | ${r.rules} |`).join('\n')}\n\n本轮从原始 world_query/raw worldbook 条目生成正常 curated schema，不改 world_query 工具。\n`);
  if (!options.quiet) console.log(JSON.stringify(report, null, 2));
  return report;
}

if (require.main === module) buildNormalCuratedFromWorldbooks();
module.exports = { buildNormalCuratedFromWorldbooks };
