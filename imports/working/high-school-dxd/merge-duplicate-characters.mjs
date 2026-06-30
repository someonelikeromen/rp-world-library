#!/usr/bin/env node
/**
 * Merge same-continuity duplicate High School DxD character entries.
 * Timeline policy:
 * - Main DxD and True DxD are same continuity with later timeline, not separate identities.
 * - SlashDog is a prequel/spinoff; shared persons stay one identity unless data names a distinct era/person.
 * - The duplicate entries handled here are translation/curation duplicates, not timeline variants.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CURATED = path.join(ROOT, 'campaigns/world-library/worlds/high-school-dxd/curated');
const CHAR_PATH = path.join(CURATED, 'characters-index.json');
const REL_PATH = path.join(CURATED, 'relationship-graph.json');
const PLOT_PATH = path.join(CURATED, 'plot-graph.json');
const OUT_DIR = path.join(ROOT, 'imports/working/high-school-dxd');

const MERGES = [
  { from: 'x1305', to: 'xenovia', reason: '同一角色：Xenovia Quarta / 洁诺薇亚·夸塔 / 杰诺瓦，译名差异；无独立时间线差异。' },
  { from: 'x2799', to: 'rossweisse', reason: '同一角色：Rossweisse，罗丝薇瑟/罗斯维瑟译名差异；无独立时间线差异。' },
  { from: 'x5877', to: 'sona-sitri', reason: '同一角色：Sona Sitri，支取苍那为人间化名，苍那·西迪为本名；同一时间线身份。' },
  { from: 'x8032', to: 'x7451', reason: '同一角色：Shinra Tsubaki，椿姬真罗/真罗椿姬译序差异；x8032 内容主体污染，保留可用别名。' },
  { from: 'x2265', to: 'greyfia-lucifuge', reason: '同一角色：Grayfia Lucifuge，葛瑞菲雅不同译名；无独立时间线差异。' }
];
const REMOVE_ONLY = [
  { id: 'unknown-d0yscl', reason: '占位/污染条目：name 为“未知”，内容实际混入木场佑斗资料，sourceRef 不完整；不作为独立角色保留。' }
];
const MAP = Object.fromEntries(MERGES.map(m => [m.from, m.to]));

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    if (x == null) continue;
    const key = typeof x === 'string' ? x : JSON.stringify(x);
    if (!seen.has(key)) { seen.add(key); out.push(x); }
  }
  return out;
}

function mergeStringArrays(base, extra, fields) {
  for (const f of fields) base[f] = uniq([...(base[f] || []), ...(extra[f] || [])]);
}

function rewriteId(id) { return MAP[id] || id; }
function rewritePlotNodeId(id) {
  if (typeof id !== 'string') return id;
  for (const [from, to] of Object.entries(MAP)) {
    if (id === `char-${from}`) return `char-${to}`;
  }
  if (id === 'char-unknown-d0yscl') return null;
  return id;
}
function rewriteObjectRefs(obj) {
  if (Array.isArray(obj)) return obj.map(rewriteObjectRefs).filter(x => x !== null);
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if ((k === 'id' || k === 'from' || k === 'to') && typeof v === 'string') {
      out[k] = rewritePlotNodeId(v) ?? rewriteId(v);
    } else if ((k === 'characterRef' || k === 'target') && typeof v === 'string') {
      out[k] = rewriteId(v);
    } else {
      out[k] = rewriteObjectRefs(v);
    }
  }
  return out;
}
function mergeNodes(nodes) {
  const map = new Map();
  for (const n of nodes || []) {
    if (!n || !n.id) continue;
    if (n.id === null) continue;
    if (!map.has(n.id)) map.set(n.id, n);
    else {
      const prev = map.get(n.id);
      map.set(n.id, { ...prev, ...n, label: prev.label || n.label, importance: prev.importance || n.importance });
    }
  }
  return [...map.values()];
}
function mergeEdges(edges) {
  const out = [];
  const seen = new Set();
  for (const e of edges || []) {
    if (!e || !e.from || !e.to || e.from === null || e.to === null) continue;
    const key = JSON.stringify({ from: e.from, to: e.to, types: e.types || e.type || '', summary: e.summary || '' });
    if (!seen.has(key)) { seen.add(key); out.push(e); }
  }
  return out;
}

async function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.copyFile(file, `${file}.bak-${stamp}`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await Promise.all([backup(CHAR_PATH), backup(REL_PATH), backup(PLOT_PATH)]);

  const charIndex = JSON.parse(await fs.readFile(CHAR_PATH, 'utf8'));
  const chars = charIndex.characters || [];
  const byId = new Map(chars.map(c => [c.id, c]));
  const audit = [];

  for (const m of MERGES) {
    const base = byId.get(m.to);
    const dup = byId.get(m.from);
    if (!base || !dup) {
      audit.push({ action: 'skip-merge', ...m, foundBase: !!base, foundDuplicate: !!dup });
      continue;
    }
    mergeStringArrays(base, dup, ['aliases', 'sourceKeys', 'sourceRefs', 'factions', 'locations', 'powerSystems', 'abilities', 'items', 'roles']);
    base.relationships = uniq([...(base.relationships || []), ...(dup.relationships || [])].map(r => {
      if (r && typeof r === 'object' && typeof r.target === 'string') return { ...r, target: rewriteId(r.target) };
      return r;
    }));
    base.notes = [base.notes, `Merged duplicate ${m.from} (${dup.name}): ${m.reason}`].filter(Boolean).join('\n');
    audit.push({ action: 'merge', from: m.from, fromName: dup.name, to: m.to, toName: base.name, reason: m.reason });
    byId.delete(m.from);
  }

  for (const r of REMOVE_ONLY) {
    if (byId.delete(r.id)) audit.push({ action: 'remove', id: r.id, reason: r.reason });
    else audit.push({ action: 'skip-remove', id: r.id, reason: r.reason });
  }

  const cleaned = [...byId.values()].map(c => {
    const out = rewriteObjectRefs(c);
    // remove accidental embedded index blocks from corrupted entries if present
    delete out.byFaction;
    delete out.byPowerSystem;
    delete out.byVisibility;
    delete out.majorCharacters;
    return out;
  });
  charIndex.characters = cleaned;
  charIndex.totalCharacters = cleaned.length;
  await fs.writeFile(CHAR_PATH, JSON.stringify(charIndex, null, 2) + '\n', 'utf8');

  const rel = JSON.parse(await fs.readFile(REL_PATH, 'utf8'));
  const rel2 = rewriteObjectRefs(rel);
  rel2.nodes = mergeNodes(rel2.nodes).filter(n => !REMOVE_ONLY.some(r => r.id === n.characterRef || n.id === r.id));
  rel2.edges = mergeEdges(rel2.edges);
  await fs.writeFile(REL_PATH, JSON.stringify(rel2, null, 2) + '\n', 'utf8');

  const plot = JSON.parse(await fs.readFile(PLOT_PATH, 'utf8'));
  const plot2 = rewriteObjectRefs(plot);
  plot2.nodes = mergeNodes(plot2.nodes).filter(n => n.id !== null && !REMOVE_ONLY.some(r => n.characterRef === r.id || n.id === `char-${r.id}`));
  plot2.edges = mergeEdges(plot2.edges);
  await fs.writeFile(PLOT_PATH, JSON.stringify(plot2, null, 2) + '\n', 'utf8');

  const report = [];
  report.push('# High School DxD 角色融合审计');
  report.push('');
  report.push(`- 执行时间：${new Date().toISOString()}`);
  report.push('- 时间线策略：主线 DxD 与真 DxD 视为同一连续时间线；SlashDog 为前传/外传，但本次处理的重复项均为译名或清洗重复，不是需要拆分的时间线变体。');
  report.push('');
  report.push('## 操作');
  report.push('');
  for (const a of audit) report.push(`- ${a.action}: ${a.from || a.id || ''} -> ${a.to || ''} ${a.fromName ? `(${a.fromName})` : ''} ${a.reason || ''}`.trim());
  report.push('');
  report.push(`## 结果`);
  report.push('');
  report.push(`- characters-index totalCharacters: ${cleaned.length}`);
  report.push('- 已同步 relationship-graph 与 plot-graph 中的角色引用。');

  const reportPath = path.join(OUT_DIR, 'dxd-character-merge-audit.md');
  await fs.writeFile(reportPath, report.join('\n'), 'utf8');
  console.log(JSON.stringify({ ok: true, reportPath, totalCharacters: cleaned.length, audit }, null, 2));
}

main().catch(err => { console.error(err?.stack || err); process.exit(1); });
