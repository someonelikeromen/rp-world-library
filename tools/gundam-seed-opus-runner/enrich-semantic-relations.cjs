#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) { out[key] = next; i++; }
        else out[key] = true;
      }
    } else out._.push(a);
  }
  return out;
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { ensureDir(path.dirname(file)); fs.writeFileSync(file, text, 'utf8'); }
function listFiles(dir, suffix) {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d)) {
      const f = path.join(d, e);
      const st = fs.statSync(f);
      if (st.isDirectory()) walk(f);
      else if (!suffix || f.endsWith(suffix)) out.push(f);
    }
  }
  walk(dir);
  return out.sort();
}
function safeId(s) { return String(s || '').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 120); }
function uniq(arr) { return [...new Set((arr || []).filter(Boolean))]; }
function normalizeAlias(s) {
  return String(s || '')
    .replace(/^【飞燕惊澜】/, '')
    .replace(/^高达SEED/, '')
    .replace(/ - 哔哩哔哩$/, '')
    .trim();
}
function collectText(item) {
  const claims = (((item.sourceBacked || {}).claims || []).map(c => c.text).join('\n'));
  const summary = (item.sourceBacked || {}).summary || '';
  return `${summary}\n${claims}`;
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const draftRoot = path.join(planDir, 'candidates', 'curated-draft');
  const files = listFiles(path.join(planDir, 'normalized', 'base-seed'), '.json');
  const items = files.map(f => readJson(f)).filter(x => x && x.entityId);
  const aliasRows = [];
  for (const item of items) {
    const aliases = uniq([item.name, ...(item.aliases || [])].map(normalizeAlias))
      .filter(a => a.length >= 2 && a.length <= 30)
      .filter(a => !/^高达SEED|^飞燕惊澜|百科$|人物百科$|机体百科$/.test(a));
    for (const alias of aliases) aliasRows.push({ alias, entityId: item.entityId, name: item.name, domain: item.domain });
  }
  aliasRows.sort((a, b) => b.alias.length - a.alias.length);
  const existing = readJson(path.join(draftRoot, 'relationships.json'), { relationships: [], inferredNodes: [] });
  const rels = [...(existing.relationships || [])];
  const added = [];
  const maxPerSource = Number(args.maxPerSource || 24);
  for (const item of items) {
    const text = collectText(item);
    if (!text) continue;
    let count = 0;
    const seenTargets = new Set();
    for (const row of aliasRows) {
      if (row.entityId === item.entityId) continue;
      if (seenTargets.has(row.entityId)) continue;
      if (text.includes(row.alias)) {
        const id = `rel-${safeId(item.entityId)}-mentions-entity-${safeId(row.entityId)}`;
        const rel = {
          relationshipId: id,
          from: item.entityId,
          to: row.entityId,
          type: 'MENTIONS_ENTITY',
          evidence: { matchedAlias: row.alias, sourceRefs: item.sourceRefs || [], method: 'exact-alias-in-source-backed-claims' },
          confidence: 'text-pattern-needs-review',
          deployable: false
        };
        rels.push(rel);
        added.push(rel);
        seenTargets.add(row.entityId);
        count++;
        if (count >= maxPerSource) break;
      }
    }
  }
  const unique = Object.values(Object.fromEntries(rels.map(r => [r.relationshipId, r])));
  existing.relationships = unique;
  existing.relationshipCount = unique.length;
  existing.generatedAt = new Date().toISOString();
  existing.status = 'draft-not-deployable';
  existing.extractionPolicy = existing.extractionPolicy || {};
  existing.extractionPolicy.relationTypes = uniq([...(existing.extractionPolicy.relationTypes || []), 'MENTIONS_ENTITY']);
  existing.extractionPolicy.limitations = uniq([...(existing.extractionPolicy.limitations || []), 'MENTIONS_ENTITY is exact string matching and needs semantic review']);
  writeJson(path.join(draftRoot, 'relationships.json'), existing);

  const graphFile = path.join(draftRoot, 'graph.json');
  const graph = readJson(graphFile, { nodes: [], edges: [] });
  const nodes = [...(graph.nodes || [])];
  const edges = [...(graph.edges || [])];
  for (const item of items) nodes.push({ id: item.entityId, label: item.name, type: item.domain, layer: item.normalizedLayer });
  for (const r of unique) edges.push({ from: r.from, to: r.to, type: r.type, relationshipId: r.relationshipId });
  const uniqNodes = Object.values(Object.fromEntries(nodes.map(n => [n.id, n])));
  const uniqEdges = Object.values(Object.fromEntries(edges.map(e => [`${e.from}|${e.type}|${e.to}|${e.relationshipId || ''}`, e])));
  writeJson(graphFile, { ...graph, schema: 'gundam-seed-curated-draft-graph-v3', generatedAt: existing.generatedAt, nodeCount: uniqNodes.length, edgeCount: uniqEdges.length, nodes: uniqNodes, edges: uniqEdges });
  const report = {
    schema: 'gundam-seed-semantic-relationship-enrichment-report-v1',
    generatedAt: existing.generatedAt,
    status: 'draft-valid-not-deployable',
    aliasCount: aliasRows.length,
    addedMentionRelationships: added.length,
    totalRelationships: unique.length,
    byType: unique.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {}),
    output: 'candidates/curated-draft/relationships.json',
    graphOutput: 'candidates/curated-draft/graph.json',
    limitation: 'Exact string matches only; all semantic relationships remain non-deployable until review.'
  };
  writeJson(path.join(planDir, 'reports', 'semantic-relationship-enrichment-report.json'), report);
  writeText(path.join(planDir, 'reports', 'semantic-relationship-enrichment-report.md'), `# Gundam SEED Semantic Relationship Enrichment\n\n- Generated: ${report.generatedAt}\n- Added MENTIONS_ENTITY: ${report.addedMentionRelationships}\n- Total relationships: ${report.totalRelationships}\n\n## By Type\n\n${Object.entries(report.byType).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\nLimitation: ${report.limitation}\n`);
  console.log(JSON.stringify({ ok: true, added: added.length, total: unique.length, byType: report.byType }, null, 2));
}
main();
