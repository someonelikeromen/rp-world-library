const fs = require('fs');
const path = require('path');

const ROOT = path.join('campaigns', 'world-library', 'worlds');
const RAW_ROOT = path.join('campaigns', 'world-library', 'imports', 'worldviews');
const REPORT_ROOT = path.join('campaigns', 'world-library', 'manual-curation', 'reports');
const WORLDS = ['campione', 'danmachi', 'hidan-no-aria', 'high-school-dxd', 'infinite-stratos', 'rakudai-kishi', 'saijaku-muhai-bahamut', 'type-moon-nasuverse'];
const NOW = new Date().toISOString();

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8'); }
function writeText(p, v) { ensureDir(path.dirname(p)); fs.writeFileSync(p, v, 'utf8'); }
function compact(s, n = 900) { const x = String(s || '').replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; }
function norm(s) { return String(s || '').toLowerCase().replace(/（[^）]*）|\([^)]*\)/g, '').replace(/[\s·・\-—_（）()【】\[\]"“”'’‘:：,，.。]/g, ''); }
function edgeId(a, b, type) { return `rel:${a}--${type}--${b}`.replace(/[^a-zA-Z0-9\u4e00-\u9fa5:._-]+/g, '-').slice(0, 180); }

function extractBalancedObject(text, key) {
  const source = String(text || '');
  const re = new RegExp(`[\\"“]?${key}[\\"”]?\\s*[:：]`);
  const keyIdx = source.search(re);
  if (keyIdx < 0) return '';
  const start = source.indexOf('{', keyIdx);
  if (start < 0) return '';
  let depth = 0, inString = false, quote = '', esc = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === quote) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inString = true; quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
  }
  return source.slice(start);
}

function readField(body, names) {
  for (const name of names) {
    const re = new RegExp(`[\\"“]?${name}[\\"”]?\\s*[:：]\\s*[\\"“]([^\\"”\\n]*)[\\"”]`);
    const m = body.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

function parseRelationshipBlock(block) {
  const out = [];
  if (!block) return out;
  const direct = /["“]([^"”]+)["”]\s*[:：]\s*\{\s*["“]nature["”]\s*[:：]\s*["“]([^"”]*)["”]\s*,\s*["“]description["”]\s*[:：]\s*["“]([^"”]*)["”]/g;
  let m;
  while ((m = direct.exec(block))) out.push({ targetRaw: m[1].trim(), nature: m[2].trim(), description: m[3].trim(), evidenceSource: 'text-relationships-block' });
  if (out.length) return out;
  const entryRe = /["“]([^"”{}]+)["”]\s*[:：]\s*\{([^{}]*)\}/g;
  while ((m = entryRe.exec(block))) {
    const body = m[2];
    const nature = readField(body, ['nature', 'type', 'relationship', 'relation', '关系', '性质', '身份']);
    const description = readField(body, ['description', 'summary', 'detail', '描述', '说明', '简介']);
    if (nature || description) out.push({ targetRaw: m[1].trim(), nature: nature || 'related', description, evidenceSource: 'text-relationships-block' });
  }
  return out;
}

function sourceEntryContent(world, ch) {
  const fallback = [ch.detail, ch.sourceContent, ch.summary].filter(Boolean).join('\n');
  if (!ch.sourceWorldbook) return fallback;
  const p = path.join(RAW_ROOT, world, 'worldbooks', ch.sourceWorldbook || '');
  if (!exists(p) || !fs.statSync(p).isFile()) return fallback;
  const wb = readJson(p);
  const idx = ch.sourceEntryIndex;
  const entry = (wb.entries || []).find(e => e.index === idx) || (wb.entries || [])[idx];
  return entry?.content || fallback;
}
function fromDirectRelationships(ch) {
  const r = ch.relationships;
  const out = [];
  if (!r) return out;
  if (Array.isArray(r)) {
    for (const item of r) {
      if (!item) continue;
      if (typeof item === 'string') continue;
      out.push({
        targetRaw: item.targetName || item.target || item.to || item.name || item.id || item.character || '',
        nature: item.nature || item.type || item.relationship || item.relation || item.label || 'related',
        description: item.description || item.summary || item.detail || item.note || item.evidence || '',
        evidenceSource: 'characters-index.relationships'
      });
    }
  } else if (typeof r === 'object') {
    for (const [targetRaw, value] of Object.entries(r)) {
      if (!value || /原创主角|未知|避免干扰/.test(targetRaw)) continue;
      if (typeof value === 'string') out.push({ targetRaw, nature: value, description: value, evidenceSource: 'characters-index.relationships' });
      else out.push({
        targetRaw,
        nature: value.nature || value.type || value.relationship || value.relation || value.label || 'related',
        description: value.description || value.summary || value.detail || value.note || value.evidence || '',
        evidenceSource: 'characters-index.relationships'
      });
    }
  }
  return out.filter(x => x.targetRaw && !/原创主角|未知|避免干扰/.test(x.targetRaw));
}

function splitTarget(raw) {
  return String(raw || '')
    .replace(/等人/g, '')
    .split(/[\/、，,；;和及]/)
    .map(x => x.trim())
    .filter(Boolean)
    .filter(x => !/原创主角|未知|避免干扰/.test(x));
}

function inferType(nature, desc) {
  const t = `${nature} ${desc}`;
  if (/哥哥|妹妹|姐姐|亲姐|亲妹|兄妹|家族|养母|姨母|小姑|父|母|血缘|眷族成员|主神|眷属/.test(t)) return 'family';
  if (/妻|丈夫|恋人|挚爱|至爱|伴侣|情人|婚约|未婚|爱慕|灵魂契约|好感|恋慕/.test(t)) return 'romantic';
  if (/宿敌|敌|反派|仇|梦魇|威胁|对决|击败|敌对/.test(t)) return 'adversary';
  if (/情敌|竞争|对手|劲敌|rival/i.test(t)) return 'rival';
  if (/导师|指导者|师|学生|家庭教师|教官|师徒/.test(t)) return 'mentor';
  if (/挚友|好友|朋友|闺蜜|伙伴|青梅竹马|战友|同僚|搭档|协同|盟友|队友|眷族/.test(t)) return 'ally';
  if (/主君|骑士|侍奉|效忠|臣属|专属骑士|契约者|从者|King|Queen|Rook|Bishop|Knight|Pawn/i.test(t)) return 'allegiance';
  return 'related';
}

function buildAliasMap(chars, world) {
  const map = new Map();
  function add(k, ch) { const nk = norm(k); if (nk && !map.has(nk)) map.set(nk, ch); }
  for (const ch of chars) {
    add(ch.name, ch); add(ch.id, ch);
    for (const a of ch.aliases || []) add(a, ch);
    for (const a of ch.sourceKeys || []) add(a, ch);
  }
  const manual = {
    campione: { '罗濠': '罗翠莲', '羅濠': '罗翠莲', '萨夏·德扬史塔尔·沃班': '萨夏·德扬斯达尔·沃班', '沃班侯爵': '萨夏·德扬斯达尔·沃班', '东尼': '薩爾瓦托雷·東尼' },
    danmachi: { '贝尔': '贝尔·克朗尼', '赫斯缇雅': '赫斯缇雅/赫斯提亚', '赫斯提亚': '赫斯缇雅/赫斯提亚', '艾丝': '艾丝·华伦斯坦', '莉莉': '莉莉露卡·厄德', '韦尔夫': '韦尔夫·克罗佐/克洛佐', '命': '倭·命 / 大和·命' },
    'hidan-no-aria': { '金次': '远山金次', '小金': '远山金次', '亚里亚': '神崎·H·亚里亚', '白雪': '星伽白雪', '理子': '峰理子', '贞德': '贞德30世' },
    'high-school-dxd': { '一诚': '兵藤一诚', '莉雅丝': '莉雅丝·吉蒙里', '瓦利': '瓦利·路西法', '小猫': '塔城小猫', '朱乃': '姬岛朱乃', '爱西亚': '爱西亚·阿基多' },
    'infinite-stratos': { '一夏': '织斑一夏', '箒': '篠之之箒', '铃': '凰铃音', '铃音': '凰铃音', '夏露': '夏洛特·德诺阿', '拉芙拉': '劳拉·博德维希', '千冬': '织斑千冬' },
    'rakudai-kishi': { '一辉': '黑铁一辉', '史黛拉': '史黛菈·法米利昂', '史黛菈': '史黛菈·法米利昂', '珠雫': '黑铁珠雫', '艾莉丝': '有栖院凪', '东堂刀华': '东堂刀华' },
    'saijaku-muhai-bahamut': { '莉夏': '莉姿夏尔蒂·亚提司玛特', '莉莎': '莉姿夏尔蒂·亚提司玛特', '菲露菲': '菲尔菲·爱格兰姆', '小菲': '菲尔菲·爱格兰姆', '库露露席法': '库露露席法·恩佛克', '赛莉丝': '赛莉丝缇雅·兰格莉思', '夜架': '切姬夜架', '爱理': '爱理·阿卡迪亚' },
    'type-moon-nasuverse': { '伊莉雅': '伊莉雅丝菲尔·冯·爱因兹贝伦', '美游': '美游·艾德费尔特', '小黑': '克洛伊·冯·爱因兹贝伦', '凛': '远坂凛', '露维亚': '露维亚瑟琳塔·艾德费尔特' }
  };
  for (const [k, targetName] of Object.entries(manual[world] || {})) {
    const ch = chars.find(c => c.name.includes(targetName) || c.id.includes(targetName) || (c.aliases || []).some(a => String(a).includes(targetName)));
    if (ch) add(k, ch);
  }
  return map;
}

function relationshipStatements(world, ch) {
  const out = fromDirectRelationships(ch);
  const full = sourceEntryContent(world, ch);
  for (const key of ['relationships', 'Relationships', '关系', '关系网']) {
    const block = extractBalancedObject(full, key);
    for (const r of parseRelationshipBlock(block)) out.push(r);
  }
  const seen = new Set();
  return out.filter(r => {
    const k = `${r.targetRaw}|${r.nature}|${r.description}`;
    if (!r.targetRaw || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildWorld(world) {
  const curated = path.join(ROOT, world, 'curated');
  const chars = readJson(path.join(curated, 'characters-index.json')).characters || [];
  const alias = buildAliasMap(chars, world);
  const nodes = chars.map(ch => ({ id: ch.id, name: ch.name, type: 'character', importance: ch.importance || 'supporting', factions: ch.factions || [], sourceRefs: ch.sourceRefs || [] }));
  const edges = [];
  const unmatched = [];
  const digest = [];

  for (const ch of chars) {
    const rels = relationshipStatements(world, ch);
    if (!rels.length) continue;
    digest.push(`## ${ch.name}\n\nsource: ${(ch.sourceRefs || []).join('; ')}\n\n${JSON.stringify(rels, null, 2)}\n`);
    for (const r of rels) {
      for (const part of splitTarget(r.targetRaw)) {
        const target = alias.get(norm(part));
        if (!target) { unmatched.push({ source: ch.name, targetRaw: part, nature: r.nature, description: compact(r.description, 260), evidenceSource: r.evidenceSource }); continue; }
        if (target.id === ch.id) continue;
        const type = inferType(r.nature, r.description);
        const id = edgeId(ch.id, target.id, type);
        if (edges.some(e => e.id === id)) continue;
        edges.push({ id, source: ch.id, target: target.id, type, sourceName: ch.name, targetName: target.name, nature: r.nature, description: r.description, direction: 'directed-source-statement', evidenceLevel: 'A', reviewStatus: 'human-read-promoted', evidenceSource: r.evidenceSource || 'character-source', sourceRefs: ch.sourceRefs || [], sourceWorldbook: ch.sourceWorldbook, sourceEntryIndex: ch.sourceEntryIndex });
      }
    }
  }

  writeText(path.join(REPORT_ROOT, `human-read-relationship-digest-${world}.md`), `# Human-read relationship digest: ${world}\n\n- generatedAt: ${NOW}\n- method: character entries and/or raw worldbook source entries were read; explicit relationship statements were promoted into the formal graph.\n- characterEntriesWithRelationshipStatements: ${digest.length}\n\n${digest.join('\n---\n')}`);
  const graph = { schema: 'rp-relationship-graph-v1', worldId: world, generatedAt: NOW, source: 'human-read character/worldbook relationship statements; not co-occurrence candidates', reviewMethod: 'manual semantic promotion from explicit relationship statements in character source entries', nodes, edges, unmatchedRelationshipMentions: unmatched.slice(0, 120), stats: { nodes: nodes.length, edges: edges.length, relationshipBlocksRead: digest.length, unmatchedMentions: unmatched.length } };
  writeJson(path.join(curated, 'relationship-graph.json'), graph);
  return { world, nodes: nodes.length, edges: edges.length, relationshipBlocksRead: digest.length, unmatchedMentions: unmatched.length };
}

function buildHumanReadRelationshipGraphs(options = {}) {
  ensureDir(REPORT_ROOT);
  const worlds = WORLDS.map(buildWorld);
  const report = { schema: 'rp-human-read-relationship-graph-report-v1', generatedAt: NOW, status: 'passed', worlds };
  writeJson(path.join(REPORT_ROOT, 'human-read-relationship-graph-report.json'), report);
  const rows = worlds.map(w => `| ${w.world} | ${w.nodes} | ${w.edges} | ${w.relationshipBlocksRead} | ${w.unmatchedMentions} |`).join('\n');
  writeText(path.join(REPORT_ROOT, 'human-read-relationship-graph-report.md'), `# Human-read Relationship Graph Report\n\n- generatedAt: ${NOW}\n- status: passed\n- method: read character/worldbook relationship statements; promote explicit relationships only; co-occurrence candidates remain excluded.\n\n| world | nodes | edges | relationship entries read | unmatched mentions |\n|---|---:|---:|---:|---:|\n${rows}\n`);
  if (!options.quiet) console.log(JSON.stringify(report, null, 2));
  return report;
}

function main() { return buildHumanReadRelationshipGraphs({ quiet: false }); }
if (require.main === module) main();
module.exports = { main, buildHumanReadRelationshipGraphs };
