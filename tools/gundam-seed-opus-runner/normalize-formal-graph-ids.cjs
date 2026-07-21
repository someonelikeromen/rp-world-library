#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function norm(s) { return String(s || '').replace(/[（(]CE\d+年?[）)]/gi, '').replace(/\s+/g, '').trim(); }
function uniqBy(arr, keyFn) { return Object.values(Object.fromEntries(arr.map(x => [keyFn(x), x]))); }

function main() {
  const root = process.argv[2] || 'campaigns/world-library/worlds/gundam-seed/curated';
  const chars = (readJson(path.join(root, 'characters-index.json'), { characters: [] }).characters || []);
  const kg = readJson(path.join(root, 'knowledge-graph.json'), { nodes: [], edges: [] });
  const rg = readJson(path.join(root, 'relationship-graph.json'), { relationships: [], inferredNodes: [] });

  const nameMap = new Map();
  for (const ch of chars) {
    for (const name of [ch.name, ...(ch.aliases || [])]) {
      if (name) nameMap.set(norm(name), ch.id);
    }
  }

  const legacyToFormal = new Map();
  for (const n of kg.nodes || []) {
    if (n.type === 'characters' || n.type === 'character') {
      const hit = nameMap.get(norm(n.label || n.name));
      if (hit) legacyToFormal.set(n.id, hit);
    }
  }
  for (const r of rg.relationships || []) {
    for (const id of [r.from, r.to]) {
      if (legacyToFormal.has(id)) continue;
      const guess = String(id || '').split('——').pop();
      const hit = nameMap.get(norm(guess));
      if (hit) legacyToFormal.set(id, hit);
    }
  }

  const formalCharNodes = chars.map(ch => ({
    id: ch.id,
    label: ch.name,
    name: ch.name,
    type: 'character',
    aliases: ch.aliases || [],
    sourceRefs: ch.sourceRefs || [],
    seedRefs: ch.seedRefs || [],
    layers: ch.layers || []
  }));

  const remap = id => legacyToFormal.get(id) || id;

  const kgNodes = [];
  for (const n of kg.nodes || []) {
    const mapped = remap(n.id);
    if (mapped !== n.id && String(mapped).startsWith('char-')) continue;
    kgNodes.push({ ...n, id: mapped, label: n.label || n.name, name: n.name || n.label });
  }
  kgNodes.push(...formalCharNodes);

  const kgEdges = (kg.edges || []).map(e => ({ ...e, from: remap(e.from), to: remap(e.to) }));

  const relationships = (rg.relationships || []).map(r => ({ ...r, from: remap(r.from), to: remap(r.to) }));
  const relNodes = [...(rg.inferredNodes || []).map(n => ({ ...n, label: n.label || n.name })), ...formalCharNodes];

  const newKgNodes = uniqBy(kgNodes, n => n.id);
  const newKgEdges = uniqBy(kgEdges, e => `${e.from}|${e.type}|${e.to}|${e.relationshipId || ''}`);
  const newRelNodes = uniqBy(relNodes, n => n.id);
  const newRelationships = uniqBy(relationships, r => `${r.from}|${r.type}|${r.to}|${r.relationshipId || ''}`);

  const now = new Date().toISOString();
  writeJson(path.join(root, 'knowledge-graph.json'), {
    ...kg,
    schema: 'gundam-seed-knowledge-graph-v2-formal-ids',
    generatedAt: now,
    idNormalization: { legacyMapped: legacyToFormal.size, formalCharacterNodes: formalCharNodes.length },
    nodeCount: newKgNodes.length,
    edgeCount: newKgEdges.length,
    nodes: newKgNodes,
    edges: newKgEdges
  });
  writeJson(path.join(root, 'relationship-graph.json'), {
    ...rg,
    schema: 'gundam-seed-relationship-graph-v2-formal-ids',
    generatedAt: now,
    idNormalization: { legacyMapped: legacyToFormal.size, formalCharacterNodes: formalCharNodes.length },
    nodeCount: newRelNodes.length,
    relationshipCount: newRelationships.length,
    nodes: newRelNodes,
    inferredNodes: rg.inferredNodes || [],
    relationships: newRelationships,
    edges: newRelationships.map(r => ({ from: r.from, to: r.to, type: r.type, relationshipId: r.relationshipId }))
  });
  console.log(JSON.stringify({ ok: true, legacyMapped: legacyToFormal.size, knowledgeGraph: { nodes: newKgNodes.length, edges: newKgEdges.length }, relationshipGraph: { nodes: newRelNodes.length, relationships: newRelationships.length } }, null, 2));
}
main();
