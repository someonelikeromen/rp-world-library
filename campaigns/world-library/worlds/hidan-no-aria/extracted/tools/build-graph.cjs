#!/usr/bin/env node
/**
 * build-graph.cjs — 从 merged/ 构建完整子图谱
 * 
 * 层级模式:
 * Level 0: 读所有源文件，提取关系字段
 * Level 1: 按类型输出子图谱
 * Level 2: 合并为完整关联图谱
 * 
 * 用法: node build-graph.cjs <type> <merged_dir>
 *   type: chars | abilities | items | events | world | timeline | all
 */
const fs = require('fs'), path = require('path');

const TYPES = ['characters','abilities','events','items','locations','factions','systems','knowledge'];

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch(e) { return null; }
}

// === 1. 角色关系图谱 ===
function buildCharGraph(merged) {
  const rels = [], abilityLinks = [], itemLinks = [];
  const dir = path.join(merged, 'characters');
  if (!fs.existsSync(dir)) return { relationships: [], ability_links: [], item_links: [] };

  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    const d = readJson(path.join(dir, f));
    if (!d) continue;
    const cid = d.character_id || f.replace('.json','');
    const vols = new Set();

    for (const p of (d.periods || [])) {
      if (p.volume) vols.add(p.volume);
      // relationships from periods
      if (p.relationships) {
        for (const [target, val] of Object.entries(p.relationships)) {
          // val may be string "master" or object {type:"master", summary:"..."}
          const relType = typeof val === 'object' && val !== null ? (val.type || val.relation || '') : String(val);
          if (relType) {
            // Strip trailing Chinese punctuation from type
            const cleaned = relType.replace(/[。，；、！？]+$/g, '').trim();
            rels.push({ source: cid, target, type: cleaned, volumes: [p.volume].filter(Boolean) });
          }
        }
      }
      // abilities_owned
      if (p.abilities_owned) {
        for (const a of p.abilities_owned) {
          abilityLinks.push({ character: cid, ability: a, volumes: [p.volume].filter(Boolean) });
        }
      }
      // possessions_owned
      if (p.possessions_owned) {
        for (const i of p.possessions_owned) {
          itemLinks.push({ character: cid, item: i, volumes: [p.volume].filter(Boolean) });
        }
      }
    }

    // Also check top-level relationships (old schema)
    if (d.relationships && !d.periods) {
      for (const [target, val] of Object.entries(d.relationships)) {
        const relType = typeof val === 'object' && val !== null ? (val.type || val.relation || '') : String(val);
        if (relType) {
          const cleaned = relType.replace(/[。，；、！？]+$/g, '').trim();
          rels.push({ source: cid, target, type: cleaned, volumes: [] });
        }
      }
    }
    if (d.abilities_owned && !d.periods) {
      for (const a of d.abilities_owned) abilityLinks.push({ character: cid, ability: a, volumes: [] });
    }
    if (d.possessions_owned && !d.periods) {
      for (const i of d.possessions_owned) itemLinks.push({ character: cid, item: i, volumes: [] });
    }
  }

  // Deduplicate
  const dedup = (arr, keyFn) => {
    const seen = new Set();
    return arr.filter(x => {
      const k = keyFn(x);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  };

  return {
    relationships: dedup(rels, r => `${r.source}|${r.target}|${r.type}`),
    ability_links: dedup(abilityLinks, a => `${a.character}|${a.ability}`),
    item_links: dedup(itemLinks, i => `${i.character}|${i.item}`)
  };
}

// === 2. 能力图谱 ===
function buildAbilityGraph(merged) {
  const abilities = [];
  const dir = path.join(merged, 'abilities');
  if (!fs.existsSync(dir)) return { abilities: [] };

  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    const d = readJson(path.join(dir, f));
    if (!d) continue;
    const id = f.replace('.json','');
    const p = (d.periods || [])[0] || {};
    // 兼容两种 schema：新(rp-*-volume-v1)用 p.type，旧(world-library-entity-v1)用 p.snapshot.type
    const snap = p.snapshot || {};
    abilities.push({
      id,
      type: p.type || snap.type || '',
      owner: (Array.isArray(p.users) ? p.users.join(', ') : p.owner ||
              Array.isArray(snap.users) ? snap.users.join(', ') : snap.owner || ''),
      description: (p.description || snap.description || '').substring(0, 200),
      details: p.details || snap.details || {},
      volumes: [...new Set((d.periods || []).map(x => x.volume).filter(Boolean))]
    });
  }
  return { abilities };
}

// === 3. 物品图谱 ===
function buildItemGraph(merged) {
  const items = [];
  const dir = path.join(merged, 'items');
  if (!fs.existsSync(dir)) return { items: [] };

  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    const d = readJson(path.join(dir, f));
    if (!d) continue;
    const id = f.replace('.json','');
    const p = (d.periods || [])[0] || {};
    const snap = p.snapshot || {};
    items.push({
      id,
      type: p.type || snap.type || '',
      owner: p.owner || snap.owner || '',
      description: (p.description || snap.description || '').substring(0, 200),
      features: p.features || snap.features || [],
      volumes: [...new Set((d.periods || []).map(x => x.volume).filter(Boolean))]
    });
  }
  return { items };
}

// === 4. 事件图谱 ===
function buildEventGraph(merged) {
  const events = [], causalEdges = [];
  const dir = path.join(merged, 'events');
  if (!fs.existsSync(dir)) return { events: [], causal_edges: [] };

  const allEvents = [];
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    const d = readJson(path.join(dir, f));
    if (!d) continue;
    const id = f.replace('.json','');
    const p = (d.periods || [])[0] || {};
    const snap = p.snapshot || {};
    allEvents.push({
      id,
      volume: p.volume || '',
      type: p.type || snap.type || '',
      participants: p.participants || snap.participants || [],
      cause: (p.cause || snap.cause || '').substring(0, 500),
      outcome: (p.outcome || snap.outcome || '').substring(0, 500),
      aftermath: (p.aftermath || snap.aftermath || '').substring(0, 500),
      related_events: p.related_events || snap.related_events || [],
      significance: (p.significance || snap.significance || '').substring(0, 200)
    });
  }

  // Build causal edges from related_events
  for (const e of allEvents) {
    if (e.related_events) {
      for (const re of e.related_events) {
        if (typeof re === 'string') {
          causalEdges.push({ source: e.id, target: re, relation: 'related_to' });
        } else if (re.id) {
          causalEdges.push({ source: e.id, target: re.id, relation: re.relation || 'related_to' });
        }
      }
    }
  }

  return { events: allEvents, causal_edges: causalEdges };
}

// === 5. 世界图谱 ===
function buildWorldGraph(merged) {
  const result = { locations: [], factions: [], systems: [], knowledge: [] };

  for (const type of ['locations', 'factions', 'systems', 'knowledge']) {
    const dir = path.join(merged, type);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (!f.endsWith('.json')) continue;
      const d = readJson(path.join(dir, f));
      if (!d) continue;
      const id = f.replace('.json','');
      const p = (d.periods || [])[0] || {};
      const entry = { id, type: p.type || '' };
      if (p.affiliated_faction) entry.affiliated_faction = p.affiliated_faction;
      if (p.members) entry.members = p.members;
      if (p.related_abilities) entry.related_abilities = p.related_abilities;
      if (p.related_entities) entry.related_entities = p.related_entities;
      if (p.related_events) entry.related_events = p.related_events;
      if (p.allied_factions) entry.allied_factions = p.allied_factions;
      result[type].push(entry);
    }
  }
  return result;
}

// === 6. 时间轴 ===
function buildTimeline(merged) {
  const entries = [];
  for (const type of TYPES) {
    const dir = path.join(merged, type);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (!f.endsWith('.json')) continue;
      const d = readJson(path.join(dir, f));
      if (!d) continue;
      const id = d[type === 'characters' ? 'character_id' : type === 'abilities' ? 'ability_id' : type === 'items' ? 'item_id' : type === 'events' ? 'event_id' : type === 'locations' ? 'location_id' : type === 'factions' ? 'faction_id' : type === 'systems' ? 'system_id' : 'knowledge_id'] || f.replace('.json','');
      for (const p of (d.periods || [])) {
        if (p.period_id) {
          const inferredVol = p.volume || (d.periods || []).find(x => x.volume)?.volume || '';
          entries.push({
            period_id: p.period_id,
            entity_id: id,
            entity_type: type,
            volume: inferredVol,
            time: p.time || '',
            label: (p.name?.zh || p.label || '').substring(0, 100),
            summary: (p.summary || '').substring(0, 200)
          });
        }
      }
    }
  }

  // Sort by volume then time
  entries.sort((a, b) => {
    const va = a.volume || '', vb = b.volume || '';
    if (va !== vb) return va.localeCompare(vb);
    return (a.time || '').localeCompare(b.time || '');
  });

  return { timeline_entries: entries, total: entries.length };
}

// === 7. 完整关联图谱 ===
function buildCompleteGraph(charGraph, abilityGraph, itemGraph, eventGraph, worldGraph, mergedDir) {
  const nodes = [], edges = [];

  // Character nodes
  for (const r of charGraph.relationships) {
    if (!nodes.find(n => n.id === r.source)) nodes.push({ id: r.source, type: 'character', group: 'character' });
    if (!nodes.find(n => n.id === r.target)) nodes.push({ id: r.target, type: 'character', group: 'character' });
    edges.push({ source: r.source, target: r.target, relation: r.type, category: 'relationship' });
  }

  // Ability nodes + character→ability edges
  for (const a of charGraph.ability_links) {
    if (!nodes.find(n => n.id === a.ability)) nodes.push({ id: a.ability, type: 'ability', group: 'ability' });
    if (!nodes.find(n => n.id === a.character)) nodes.push({ id: a.character, type: 'character', group: 'character' });
    edges.push({ source: a.character, target: a.ability, relation: 'has_ability', category: 'ownership' });
  }

  // Item nodes + character→item edges
  for (const i of charGraph.item_links) {
    if (!nodes.find(n => n.id === i.item)) nodes.push({ id: i.item, type: 'item', group: 'item' });
    if (!nodes.find(n => n.id === i.character)) nodes.push({ id: i.character, type: 'character', group: 'character' });
    edges.push({ source: i.character, target: i.item, relation: 'owns', category: 'ownership' });
  }

  // Event nodes + participant edges
  for (const e of eventGraph.events) {
    if (!nodes.find(n => n.id === e.id)) nodes.push({ id: e.id, type: 'event', group: 'event' });
    for (const p of (e.participants || [])) {
      if (!nodes.find(n => n.id === p)) {
        const charFile = path.join(mergedDir, 'characters', p + '.json');
        if (fs.existsSync(charFile)) {
          nodes.push({ id: p, type: 'character', group: 'character' });
        } else {
          nodes.push({ id: p, type: 'unknown', group: 'unknown' });
        }
      }
      edges.push({ source: e.id, target: p, relation: 'participant', category: 'involvement' });
    }
  }

  return { nodes, edges };
}

// === Main ===
const [,, cmd, mergedDir] = process.argv;
if (!cmd || !mergedDir) {
  console.error('Usage: node build-graph.cjs <type> <merged_dir>');
  console.error('  type: chars | abilities | items | events | world | timeline | complete | all');
  process.exit(1);
}

const outDir = path.join(mergedDir, 'graph');
fs.mkdirSync(path.join(mergedDir, 'graph', '.batches'), { recursive: true });

switch (cmd) {
  case 'chars': {
    const g = buildCharGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'char-relations.json'), JSON.stringify(g, null, 2));
    console.log(`char-relations.json: ${g.relationships.length} rels, ${g.ability_links.length} abl, ${g.item_links.length} items`);
    break;
  }
  case 'abilities': {
    const g = buildAbilityGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'ability-graph.json'), JSON.stringify(g, null, 2));
    console.log(`ability-graph.json: ${g.abilities.length} abilities`);
    break;
  }
  case 'items': {
    const g = buildItemGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'item-graph.json'), JSON.stringify(g, null, 2));
    console.log(`item-graph.json: ${g.items.length} items`);
    break;
  }
  case 'events': {
    const g = buildEventGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'event-graph.json'), JSON.stringify(g, null, 2));
    console.log(`event-graph.json: ${g.events.length} events, ${g.causal_edges.length} edges`);
    break;
  }
  case 'world': {
    const g = buildWorldGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'world-graph.json'), JSON.stringify(g, null, 2));
    console.log(`world-graph.json: loc=${g.locations.length} fac=${g.factions.length} sys=${g.systems.length} know=${g.knowledge.length}`);
    break;
  }
  case 'timeline': {
    const g = buildTimeline(mergedDir);
    fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify(g, null, 2));
    console.log(`timeline.json: ${g.total} entries`);
    break;
  }
  case 'complete': {
    const cg = buildCharGraph(mergedDir);
    const ag = buildAbilityGraph(mergedDir);
    const ig = buildItemGraph(mergedDir);
    const eg = buildEventGraph(mergedDir);
    const wg = buildWorldGraph(mergedDir);
    const complete = buildCompleteGraph(cg, ag, ig, eg, wg);
    fs.writeFileSync(path.join(outDir, 'complete-graph.json'), JSON.stringify(complete, null, 2));
    console.log(`complete-graph.json: ${complete.nodes.length} nodes, ${complete.edges.length} edges`);
    break;
  }
  case 'all': {
    const cg = buildCharGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'char-relations.json'), JSON.stringify(cg, null, 2));
    console.log(`char-relations.json: ${cg.relationships.length} rels`);

    const ag = buildAbilityGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'ability-graph.json'), JSON.stringify(ag, null, 2));
    console.log(`ability-graph.json: ${ag.abilities.length} abilities`);

    const ig = buildItemGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'item-graph.json'), JSON.stringify(ig, null, 2));
    console.log(`item-graph.json: ${ig.items.length} items`);

    const eg = buildEventGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'event-graph.json'), JSON.stringify(eg, null, 2));
    console.log(`event-graph.json: ${eg.events.length} events`);

    const wg = buildWorldGraph(mergedDir);
    fs.writeFileSync(path.join(outDir, 'world-graph.json'), JSON.stringify(wg, null, 2));
    console.log(`world-graph.json: done`);

    const tl = buildTimeline(mergedDir);
    fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify(tl, null, 2));
    console.log(`timeline.json: ${tl.total} entries`);

    const complete = buildCompleteGraph(cg, ag, ig, eg, wg, mergedDir);
    fs.writeFileSync(path.join(outDir, 'complete-graph.json'), JSON.stringify(complete, null, 2));
    console.log(`complete-graph.json: ${complete.nodes.length} nodes, ${complete.edges.length} edges`);
    break;
  }
}
