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
function rel(base, file) { return path.relative(base, file).replace(/\\/g, '/'); }
function safeId(s) { return String(s || '').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 120); }
function getAffiliation(item) {
  const specs = (item.sourceBacked || {}).specs || {};
  const fields = (item.sourceBacked || {}).structuredFields || {};
  return specs.affiliation || fields['归属'] || fields['所属'] || fields['阵营'] || '';
}
function relation(id, from, to, type, evidence, confidence = 'heuristic-source-field') {
  return { relationshipId: id, from, to, type, evidence, confidence, deployable: false };
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const draftRoot = path.join(planDir, 'candidates', 'curated-draft');
  const files = listFiles(path.join(planDir, 'normalized', 'base-seed'), '.json');
  const items = files.map(f => ({ ...readJson(f), __file: rel(planDir, f) })).filter(x => x && x.entityId);
  const rels = [];
  const orgNodes = new Map();
  const sourceBuckets = new Map();
  for (const item of items) {
    const affiliation = getAffiliation(item);
    if (affiliation && !/不明|无|未知/.test(affiliation)) {
      const orgId = `org-${safeId(affiliation)}`;
      orgNodes.set(orgId, { id: orgId, name: affiliation, type: 'organization-or-faction', inferredFrom: 'structuredFields.affiliation' });
      rels.push(relation(`rel-${safeId(item.entityId)}-affiliation-${safeId(affiliation)}`, item.entityId, orgId, 'AFFILIATED_WITH', { sourceRefs: item.sourceRefs || [], field: '归属/所属/阵营', value: affiliation }));
    }
    for (const ref of item.sourceRefs || []) {
      if (!sourceBuckets.has(ref)) sourceBuckets.set(ref, []);
      sourceBuckets.get(ref).push(item.entityId);
    }
    for (const tag of item.extensionMentions || []) {
      const tagId = `continuity-${safeId(tag)}`;
      orgNodes.set(tagId, { id: tagId, name: tag, type: 'continuity-tag', inferredFrom: 'extensionMentions' });
      rels.push(relation(`rel-${safeId(item.entityId)}-mentions-${safeId(tag)}`, item.entityId, tagId, 'MENTIONS_CONTINUITY_LAYER', { sourceRefs: item.sourceRefs || [], value: tag }, 'source-inventory-heuristic'));
    }
  }
  for (const [ref, ids] of sourceBuckets.entries()) {
    if (ids.length < 2 || ids.length > 10) continue;
    const sourceId = `source-${safeId(ref)}`;
    for (const id of ids) {
      rels.push(relation(`rel-${safeId(id)}-co-source-${safeId(ref)}`, id, sourceId, 'HAS_SOURCE', { sourceRef: ref }, 'explicit-source-ref'));
    }
  }
  const unique = Object.values(Object.fromEntries(rels.map(r => [r.relationshipId, r])));
  const relationships = {
    schema: 'gundam-seed-curated-draft-relationships-v2',
    generatedAt: new Date().toISOString(),
    status: 'draft-not-deployable',
    relationshipCount: unique.length,
    inferredNodes: [...orgNodes.values()],
    relationships: unique,
    extractionPolicy: {
      sourceBackedOnly: true,
      relationTypes: ['AFFILIATED_WITH', 'MENTIONS_CONTINUITY_LAYER', 'HAS_SOURCE'],
      limitations: ['No semantic relationship conflict review yet', 'No character relationship extraction beyond structured affiliation']
    }
  };
  writeJson(path.join(draftRoot, 'relationships.json'), relationships);
  const graphFile = path.join(draftRoot, 'graph.json');
  const graph = readJson(graphFile, { nodes: [], edges: [] });
  const nodes = [...(graph.nodes || []), ...relationships.inferredNodes.map(n => ({ id: n.id, label: n.name, type: n.type }))];
  const edges = [...(graph.edges || []), ...unique.map(r => ({ from: r.from, to: r.to, type: r.type, relationshipId: r.relationshipId }))];
  const uniqNodes = Object.values(Object.fromEntries(nodes.map(n => [n.id, n])));
  const uniqEdges = Object.values(Object.fromEntries(edges.map(e => [`${e.from}|${e.type}|${e.to}|${e.relationshipId || ''}`, e])));
  writeJson(graphFile, { ...graph, schema: 'gundam-seed-curated-draft-graph-v2', generatedAt: relationships.generatedAt, nodeCount: uniqNodes.length, edgeCount: uniqEdges.length, nodes: uniqNodes, edges: uniqEdges });
  const report = {
    schema: 'gundam-seed-relationship-extraction-report-v1',
    generatedAt: relationships.generatedAt,
    status: 'draft-valid-not-deployable',
    relationshipCount: unique.length,
    inferredNodeCount: relationships.inferredNodes.length,
    byType: unique.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {}),
    output: 'candidates/curated-draft/relationships.json',
    graphOutput: 'candidates/curated-draft/graph.json',
    remainingGaps: ['No semantic/family/romance/rivalry relationship extraction yet', 'No conflict review yet']
  };
  writeJson(path.join(planDir, 'reports', 'relationship-extraction-report.json'), report);
  writeText(path.join(planDir, 'reports', 'relationship-extraction-report.md'), `# Gundam SEED Relationship Extraction Report\n\n- Generated: ${report.generatedAt}\n- Status: ${report.status}\n- Relationships: ${report.relationshipCount}\n- Inferred nodes: ${report.inferredNodeCount}\n\n## By Type\n\n${Object.entries(report.byType).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Remaining Gaps\n\n${report.remainingGaps.map(g=>`- ${g}`).join('\n')}\n`);
  console.log(JSON.stringify({ ok: true, report: path.join(planDir, 'reports', 'relationship-extraction-report.json'), relationshipCount: report.relationshipCount, byType: report.byType }, null, 2));
}
main();
