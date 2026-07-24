const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IMPORT_ROOT = path.join(ROOT, 'campaigns/world-library/imports/worldviews/sword-art-online');
const OUT = path.join(ROOT, 'campaigns/world-library/manual-curation/sword-art-online/source-split');

const SOURCES = [
  {
    id: 'wb-sao-v1-1',
    kind: 'worldbook-json',
    path: 'worldbooks/刀剑神域SAO v1.1.worldbook.json',
    entriesPath: ['entries'],
  },
  {
    id: 'card-sao-progressive-v1-3',
    kind: 'character-card-json',
    path: 'local-ingest/SAO_Progressive_v1.3.json',
    entriesPath: ['data', 'character_book', 'entries'],
  },
  {
    id: 'card-local-1',
    kind: 'character-card-json',
    path: 'local-ingest/-_1.card.json',
    entriesPath: ['data', 'character_book', 'entries'],
  },
  {
    id: 'txt-aincrad-trpg-floor-module',
    kind: 'txt-structured',
    path: 'local-ingest/新建 文本文档.txt',
  },
];

const CARD_TEXT_FIELDS = [
  'description',
  'personality',
  'scenario',
  'first_mes',
  'mes_example',
  'creator_notes',
  'system_prompt',
  'post_history_instructions',
  'creatorcomment',
];

const CATEGORY_ORDER = [
  'characters',
  'character-voice',
  'relationships',
  'factions',
  'locations',
  'floor-data',
  'events',
  'timeline',
  'systems',
  'engine-rules',
  'runtime-prompts',
  'abilities',
  'items',
  'bosses',
  'monsters',
  'quests',
  'world-basics',
  'terminology',
  'narrative-scenes',
  'style-tone',
  'mixed',
  'duplicate-candidate',
  'conflict-candidate',
  'unclear',
];

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(IMPORT_ROOT, relPath), 'utf8'));
}

function getAt(value, keys) {
  return keys.reduce((acc, key) => (acc == null ? undefined : acc[key]), value);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(relPath, value) {
  const full = path.join(OUT, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(relPath, value) {
  const full = path.join(OUT, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, value, 'utf8');
}

function safeId(text) {
  return String(text || 'unit')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unit';
}

function preview(text, max = 220) {
  const oneLine = String(text || '').replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}...` : oneLine;
}

function entryTitle(entry, fallback) {
  return (
    entry.comment ||
    entry.name ||
    entry.title ||
    (Array.isArray(entry.keys) && entry.keys[0]) ||
    (Array.isArray(entry.key) && entry.key[0]) ||
    fallback
  );
}

function addIf(set, cond, category) {
  if (cond) set.add(category);
}

function inferCategories(title, content, sourceKind, fieldName = '') {
  const categories = new Set();
  const text = `${title}\n${fieldName}\n${content}`;
  const lower = text.toLowerCase();

  addIf(categories, /(^|[\s:：·])角色[:：]|<[^>]*character>|名字[:：]|性别[:：]|心理模型|Trauma:|Defense:|Trigger:|Need:/i.test(text), 'characters');
  addIf(categories, /对话范例|口吻|语气|说话|character-voice|first_mes|mes_example|alternate_greetings/i.test(text), 'character-voice');
  addIf(categories, /关系|羁绊|搭档|恋人|同伴|队友|会长|成员|兄弟|师徒|伙伴|组队/.test(text), 'relationships');
  addIf(categories, /公会|组织|阵营|旅团|解放队|血盟|风林火山|微笑棺木|军队|DKB|ALS|guild/i.test(text), 'factions');
  addIf(categories, /地点|地理|聚落|城市|城镇|村|镇|广场|宫|迷宫|地貌|区域|楼层|Floor_\d+|艾恩葛朗特|Aincrad/i.test(text), 'locations');
  addIf(categories, /Floor_\d+|楼层特征|地理聚落|地貌区域|传说之地|挑战与怪物|BOSS机制/.test(text), 'floor-data');
  addIf(categories, /事件|发生|攻略战|开服|宣告|死亡游戏正式|战死|讨伐|救下|击败|通关/.test(text), 'events');
  addIf(categories, /\b20\d{2}年|\d{1,2}月\d{1,2}日|凌晨|傍晚|当晚|时间线|timeline/i.test(text), 'timeline');
  addIf(categories, /系统|机制|规则|设定|界面|状态栏|变量|MVU|NerveGear|Cardinal|卡迪纳尔|HP|UI|登出|复活|死亡惩罚|鉴定|经济|货币/i.test(text), 'systems');
  addIf(categories, /规则|输出|格式|模板|模版|禁止|必须|绝对不能|system_prompt|post_history|<[^>]*(SYSTEM|RULE|FORMAT|PROMPT)[^>]*>/i.test(text), 'engine-rules');
  addIf(categories, /{{|setvar|<\/?[A-Z_]+>|prompt|before_char|after_char|局部变量|记忆存储|状态格式/i.test(text), 'runtime-prompts');
  addIf(categories, /技能|剑技|能力|魔法|咏唱|体术|索敌|隐藏|锻造|烹饪|招式|Sword Skill/i.test(text), 'abilities');
  addIf(categories, /物品|道具|装备|武器|防具|饰品|剑|刀|水晶|药水|大衣|戒指|掉落|素材|珂尔|Cor/i.test(text), 'items');
  addIf(categories, /Boss|BOSS|守关|区域Boss|楼层Boss|最终 Boss|名称[:：]/i.test(text), 'bosses');
  addIf(categories, /怪物|Mob|Mobs|野外怪物|兽型|哨兵|牛|蜂|蜘蛛|树妖|狗头人|monster/i.test(text), 'monsters');
  addIf(categories, /任务|Quest|战役|护送|侦察|交付|服务|攻略会议|任务线/i.test(text), 'quests');
  addIf(categories, /世界设定|世界背景|核心概念|游戏名称|VRMMORPG|死亡游戏|SAO篇|艾恩葛朗特篇/i.test(text), 'world-basics');
  addIf(categories, /术语|名词|概念|缩写|别名|英文|日文|中文名|translation/i.test(text), 'terminology');
  addIf(categories, /<story_scene>|剧情|场景|旁白|开场|first_mes|mes_example|greeting/i.test(text), 'narrative-scenes');
  addIf(categories, /文风|风格|语气|氛围|描写|叙事|style|tone/i.test(text), 'style-tone');

  if (sourceKind === 'txt-structured' && /Floor_\d+/.test(title)) categories.add('floor-data');
  if (fieldName && /system_prompt|post_history_instructions|creator_notes/.test(fieldName)) categories.add('runtime-prompts');
  if (fieldName && /personality/.test(fieldName)) categories.add('character-voice');

  const factCategories = [...categories].filter((cat) => !['runtime-prompts', 'engine-rules', 'mixed', 'unclear'].includes(cat));
  if ((String(content || '').length > 3000 && factCategories.length >= 2) || factCategories.length >= 4) categories.add('mixed');
  if (categories.size === 0 || lower.trim().length === 0) categories.add('unclear');
  return [...categories].sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
}

function extractNameCandidates(title, content) {
  const names = new Set();
  const titleText = String(title || '').trim();
  const titleMatch = titleText.match(/(?:角色|人物|character)[:：·_\s-]*(.+)$/i);
  if (titleMatch) names.add(cleanName(titleMatch[1]));

  for (const match of String(content || '').matchAll(/(?:^|\n)\s*(?:名字|名称|姓名)[:：]\s*([^\n]+)/g)) {
    const raw = match[1].split(/[（(]/)[0];
    for (const part of raw.split(/[\/／,，|]/)) names.add(cleanName(part));
  }

  return [...names].filter(Boolean).slice(0, 8);
}

function cleanName(name) {
  return String(name || '')
    .replace(/<[^>]+>/g, '')
    .replace(/（.*?）|\(.*?\)/g, '')
    .replace(/^[\s:：·_\-]+|[\s:：·_\-]+$/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function addJsonEntries(units, source) {
  const json = readJson(source.path);
  const entries = getAt(json, source.entriesPath) || [];
  entries.forEach((entry, index) => {
    const content = String(entry.content || '');
    const title = entryTitle(entry, `${source.id} entry ${index}`);
    const unitId = `${source.id}-${String(index).padStart(4, '0')}-${safeId(title)}`;
    const categories = inferCategories(title, content, source.kind);
    units.push({
      unitId,
      unitKind: 'json-entry',
      sourceId: source.id,
      sourceKind: source.kind,
      sourcePath: source.path,
      sourcePointer: `${source.entriesPath.join('.')}.${index}`,
      sourceIndex: index,
      title,
      enabled: entry.enabled ?? entry.disable === false,
      constant: entry.constant ?? null,
      selective: entry.selective ?? null,
      keys: entry.keys || entry.key || [],
      secondaryKeys: entry.secondary_keys || entry.secondaryKeys || entry.keysecondary || [],
      position: entry.position ?? entry.extensions?.position ?? null,
      categories,
      nameCandidates: extractNameCandidates(title, content),
      content,
      rawEntry: entry,
      splitNote: 'One original JSON worldbook/character_book entry preserved as one source unit.',
    });
  });

  if (source.kind === 'character-card-json') {
    const data = json.data || json;
    CARD_TEXT_FIELDS.forEach((fieldName) => {
      const value = data[fieldName];
      if (typeof value !== 'string' || !value.trim()) return;
      const title = `card-field:${fieldName}`;
      const unitId = `${source.id}-field-${safeId(fieldName)}`;
      units.push({
        unitId,
        unitKind: 'card-text-field',
        sourceId: source.id,
        sourceKind: source.kind,
        sourcePath: source.path,
        sourcePointer: `data.${fieldName}`,
        sourceIndex: null,
        title,
        enabled: null,
        constant: null,
        selective: null,
        keys: [],
        secondaryKeys: [],
        position: null,
        categories: inferCategories(title, value, source.kind, fieldName),
        nameCandidates: extractNameCandidates(title, value),
        content: value,
        rawEntry: { fieldName, value },
        splitNote: 'Standalone character-card text field preserved as one source unit.',
      });
    });
  }
}

function parseTxtUnits(source) {
  const text = fs.readFileSync(path.join(IMPORT_ROOT, source.path), 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const units = [];
  let currentFloor = '';
  let current = null;

  function flush() {
    if (!current) return;
    const content = current.lines.join('\n').trim();
    if (!content) {
      current = null;
      return;
    }
    const unitId = `${source.id}-${String(units.length).padStart(4, '0')}-${safeId(current.title)}`;
    units.push({
      unitId,
      unitKind: 'txt-unit',
      sourceId: source.id,
      sourceKind: source.kind,
      sourcePath: source.path,
      sourcePointer: `line:${current.startLine}`,
      sourceIndex: units.length,
      title: current.title,
      enabled: null,
      constant: null,
      selective: null,
      keys: [],
      secondaryKeys: [],
      position: null,
      categories: inferCategories(current.title, content, source.kind),
      nameCandidates: extractNameCandidates(current.title, content),
      content,
      rawEntry: { startLine: current.startLine, endLine: current.endLine, floor: currentFloor || null },
      splitNote: 'TXT split by Floor_N and four-space YAML-like section boundaries.',
    });
    current = null;
  }

  lines.forEach((line, zeroIndex) => {
    const lineNo = zeroIndex + 1;
    const floorMatch = line.match(/^\s{2}(Floor_\d+):\s*$/);
    const sectionMatch = line.match(/^\s{4}([^\s].*?):(?:\s+.*)?$/);

    if (floorMatch) {
      flush();
      currentFloor = floorMatch[1];
      current = { title: currentFloor, startLine: lineNo, endLine: lineNo, lines: [line] };
      return;
    }

    if (sectionMatch && currentFloor) {
      flush();
      current = {
        title: `${currentFloor} / ${sectionMatch[1].trim()}`,
        startLine: lineNo,
        endLine: lineNo,
        lines: [line],
      };
      return;
    }

    if (!current) {
      current = { title: 'txt-preamble', startLine: lineNo, endLine: lineNo, lines: [] };
    }
    current.lines.push(line);
    current.endLine = lineNo;
  });
  flush();
  return units;
}

function summarizeUnit(unit) {
  return {
    unitId: unit.unitId,
    unitKind: unit.unitKind,
    sourceId: unit.sourceId,
    sourcePath: unit.sourcePath,
    sourcePointer: unit.sourcePointer,
    sourceIndex: unit.sourceIndex,
    title: unit.title,
    categories: unit.categories,
    nameCandidates: unit.nameCandidates,
    enabled: unit.enabled,
    contentLength: unit.content.length,
    contentPreview: preview(unit.content),
  };
}

function main() {
  if (!fs.existsSync(IMPORT_ROOT)) throw new Error(`Missing source root: ${IMPORT_ROOT}`);
  fs.rmSync(OUT, { recursive: true, force: true });
  ensureDir(OUT);

  const allUnits = [];
  const sourceSummaries = [];

  for (const source of SOURCES) {
    const fullPath = path.join(IMPORT_ROOT, source.path);
    if (!fs.existsSync(fullPath)) throw new Error(`Missing source: ${source.path}`);
    const before = allUnits.length;
    if (source.kind === 'txt-structured') allUnits.push(...parseTxtUnits(source));
    else addJsonEntries(allUnits, source);
    sourceSummaries.push({
      ...source,
      sourcePath: source.path,
      units: allUnits.length - before,
      bytes: fs.statSync(fullPath).size,
    });
  }

  const nameIndex = new Map();
  for (const unit of allUnits) {
    for (const name of unit.nameCandidates) {
      const key = name.toLocaleLowerCase('zh-CN');
      if (!nameIndex.has(key)) nameIndex.set(key, { name, units: [] });
      nameIndex.get(key).units.push(summarizeUnit(unit));
    }
  }

  const duplicateNameCandidates = [...nameIndex.values()]
    .filter((record) => record.units.length > 1)
    .sort((a, b) => b.units.length - a.units.length || a.name.localeCompare(b.name, 'zh-CN'));
  const duplicateUnitIds = new Set(duplicateNameCandidates.flatMap((record) => record.units.map((unit) => unit.unitId)));
  for (const unit of allUnits) {
    if (duplicateUnitIds.has(unit.unitId) && !unit.categories.includes('duplicate-candidate')) {
      unit.categories.push('duplicate-candidate');
    }
  }

  const categoryBuckets = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, []]));
  for (const unit of allUnits) {
    for (const category of unit.categories) {
      if (!categoryBuckets[category]) categoryBuckets[category] = [];
      categoryBuckets[category].push(summarizeUnit(unit));
    }
  }

  for (const unit of allUnits) {
    const base = unit.unitKind === 'txt-unit' ? 'txt-units' : 'json-entries';
    writeJson(`${base}/${unit.sourceId}/${unit.unitId}.json`, unit);
  }

  for (const [category, units] of Object.entries(categoryBuckets)) {
    writeJson(`categories/${category}.json`, { category, count: units.length, units });
  }

  writeJson('diagnostics/duplicate-name-candidates.json', {
    count: duplicateNameCandidates.length,
    note: 'Heuristic only. Repeated names indicate possible same-character or same-entity material that needs later human/agent consolidation.',
    candidates: duplicateNameCandidates,
  });

  const manifest = {
    slug: 'sword-art-online',
    stage: 'source-split-only',
    generatedAt: new Date().toISOString(),
    sourceRoot: 'campaigns/world-library/imports/worldviews/sword-art-online/',
    outputRoot: 'campaigns/world-library/manual-curation/sword-art-online/source-split/',
    sourceCount: SOURCES.length,
    sources: sourceSummaries,
    totals: {
      units: allUnits.length,
      jsonEntryUnits: allUnits.filter((unit) => unit.unitKind === 'json-entry').length,
      cardTextFieldUnits: allUnits.filter((unit) => unit.unitKind === 'card-text-field').length,
      txtUnits: allUnits.filter((unit) => unit.unitKind === 'txt-unit').length,
      duplicateNameCandidates: duplicateNameCandidates.length,
    },
    categoryCounts: Object.fromEntries(Object.entries(categoryBuckets).map(([category, units]) => [category, units.length])),
    boundaries: [
      'No formal worlds/sword-art-online archive is created.',
      'No facts are merged, corrected, canonicalized, graphed, or promoted.',
      'Categories are heuristic material labels only.',
      'Runtime prompt/template material is isolated as engine-rules/runtime-prompts when detected.',
    ],
  };
  writeJson('manifest.json', manifest);
  writeText('README.md', '# Sword Art Online Source Split\n\nThis workspace is only the first split/classification layer for SAO source materials.\n\n- Source root: `campaigns/world-library/imports/worldviews/sword-art-online/`\n- Formal archive output: none\n- Fact merging/correction: none\n- Graph/timeline publication: none\n\nThe category files contain heuristic labels and references to preserved source units. Repeated names are only duplicate candidates for later review.\n');

  console.log(JSON.stringify(manifest, null, 2));
}

main();
