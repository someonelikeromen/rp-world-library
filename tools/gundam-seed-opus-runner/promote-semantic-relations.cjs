#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}
function listJson(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const file = path.join(dir, entry);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) listJson(file, out);
    else if (file.endsWith('.json')) out.push(file);
  }
  return out.sort();
}
function norm(s) {
  return String(s || '')
    .replace(/（CE\d+年?）|\(CE\d+年?\)/gi, '')
    .replace(/[\s·・.\-—_/（）()，,：:【】《》“”"'’‘]/g, '')
    .toLowerCase();
}
function shortText(s, n = 300) {
  const text = String(s || '').replace(/\s+/g, ' ').trim();
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}
function uniqBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}
function splitList(value) {
  return String(value || '')
    .split(/[、，,\/；;和与]/)
    .map(x => x.trim())
    .filter(Boolean);
}
function edgeId(from, type, to) {
  return `auto-${from}-${type}-${to}`.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]+/g, '-').slice(0, 220);
}
function buildAliasMap(items, getId, getName) {
  const map = new Map();
  for (const item of items) {
    const id = getId(item);
    const names = [getName(item), ...(item.aliases || [])].filter(Boolean);
    for (const name of names) {
      const key = norm(name);
      if (key && !map.has(key)) map.set(key, { id, name: getName(item), item, matchedAlias: name });
    }
  }
  return map;
}
function findByText(map, text) {
  const t = norm(text);
  if (!t) return null;
  if (map.has(t)) return map.get(t);
  let best = null;
  for (const [alias, item] of map.entries()) {
    if (alias.length < 2) continue;
    if (t.includes(alias) || alias.includes(t)) {
      if (!best || alias.length > best.alias.length) best = { alias, item };
    }
  }
  return best?.item || null;
}
function relationFromLabelAndOpening(label, text) {
  const opening = String(text || '').replace(/^\s+/, '').slice(0, 80);
  const signal = `${label || ''} ${opening}`;
  if (/（前恋人关系）|\(前恋人关系\)|（恋人关系）|\(恋人关系\)|未婚|婚约|爱慕|好感|情侣|情敌/.test(signal)) return 'ROMANTIC_OR_AFFECTION';
  if (/亲父母|养父母|父亲|母亲|妹妹|姐姐|哥哥|兄弟|姐妹|双胞胎|家人|萨拉家|飞鸟一家/.test(label)) return 'FAMILY_OR_KIN';
  if (/好友|幼年学校|羁绊|同伴|战友|同期|朋友|信赖|伙伴|青梅竹马/.test(signal)) return 'ALLY_OR_BOND';
  if (/敌对|宿敌|复仇|打倒|对峙|交战|互相厮杀|憎恨/.test(signal)) return 'ADVERSARY_OR_RIVAL';
  if (/舰长|上司|长官|部下|指挥|辅佐|议长|队长|领导/.test(label)) return 'COMMAND_OR_SUBORDINATE';
  if (/驾驶|搭乘|座机|操纵|机师/.test(signal)) return 'PILOTS_OR_OPERATES';
  if (/[&＆]/.test(label)) return 'EXPLICIT_RELATION_CLAIM';
  return null;
}
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function hasLocalPilotEvidence(text, aliases) {
  const source = String(text || '');
  return aliases.filter(Boolean).some(alias => {
    const needle = String(alias);
    if (needle.length < 2) return false;
    const name = escapeRegex(needle);
    const pilotVerb = '(驾驶(?!舱|席|座|座席|员之间|员的人数|员要|员乘降)|搭乘|操纵|运用|队长机|专用)';
    const patterns = [
      new RegExp(`${name}.{0,16}${pilotVerb}`),
      new RegExp(`${pilotVerb}.{0,16}${name}`),
      new RegExp(`由.{0,6}${name}.{0,10}${pilotVerb}`),
      new RegExp(`${name}.{0,8}的.{0,8}${pilotVerb}`)
    ];
    return patterns.some(re => re.test(source));
  });
}

function main() {
  const planDir = process.argv[2] || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const worldRoot = process.argv[3] || 'campaigns/world-library/worlds/gundam-seed';
  const curated = path.join(worldRoot, 'curated');
  const generatedAt = new Date().toISOString();

  const charsIndex = readJson(path.join(curated, 'characters-index.json'), { characters: [] });
  const mobileIndex = readJson(path.join(curated, 'mobile-suits-index.json'), { mobileSuits: [] });
  const warshipIndex = readJson(path.join(curated, 'warships-index.json'), { warships: [] });
  const eventIndex = readJson(path.join(curated, 'events-index.json'), { events: [] });
  const relGraph = readJson(path.join(curated, 'relationship-graph.json'), { relationships: [], inferredNodes: [], nodes: [] });
  const knowledge = readJson(path.join(curated, 'knowledge-graph.json'), { nodes: [], edges: [] });
  const plot = readJson(path.join(curated, 'plot-graph.json'), { nodes: [], edges: [] });

  const characters = charsIndex.characters || [];
  const mobileSuits = mobileIndex.mobileSuits || [];
  const warships = warshipIndex.warships || [];
  const events = eventIndex.events || [];
  const charMap = buildAliasMap(characters, ch => ch.id, ch => ch.name);

  const promoted = [];
  const reviewCandidates = [];
  function addPromoted(from, to, type, evidence, deployable = true) {
    if (!from || !to || from === to) return;
    const item = {
      relationshipId: edgeId(from, type, to),
      from,
      to,
      type,
      evidence,
      confidence: evidence.confidence || 'source-backed-heuristic',
      deployable,
      generatedBy: 'promote-semantic-relations.cjs'
    };
    if (deployable) promoted.push(item);
    else reviewCandidates.push(item);
  }

  const normalizedCharacters = listJson(path.join(planDir, 'normalized'))
    .filter(file => file.split(path.sep).includes('characters'))
    .map(file => ({ file, data: readJson(file) }))
    .filter(x => x.data && x.data.kind === 'character');

  for (const { data } of normalizedCharacters) {
    const source = findByText(charMap, data.name) || findByText(charMap, String(data.name || '').replace(/（CE\d+年?）/g, ''));
    if (!source) continue;
    for (const claim of (data.sourceBacked?.claims || [])) {
      const label = claim.label || '';
      if (!/[&＆]/.test(label)) continue;
      const text = claim.text || '';
      const relation = relationFromLabelAndOpening(label, text) || 'EXPLICIT_RELATION_CLAIM';
      for (const part of label.split(/[&＆]/).map(x => x.trim()).filter(Boolean)) {
        const target = findByText(charMap, part);
        if (target && target.id !== source.id) {
          addPromoted(source.name, target.name, relation, {
            sourceRefs: [claim.sourceRef].filter(Boolean),
            claimId: claim.claimId,
            label,
            text: shortText(text),
            method: 'explicit-character-relationship-claim-label',
            confidence: relation === 'EXPLICIT_RELATION_CLAIM' ? 'source-backed-explicit-claim-review-label' : 'source-backed-explicit-claim'
          }, relation !== 'EXPLICIT_RELATION_CLAIM');
        }
      }
    }
  }

  for (const ch of characters) {
    const affiliation = (ch.summary || '').match(/【所属：([^】]+)】/)?.[1];
    for (const faction of splitList(affiliation)) {
      addPromoted(ch.name, `org-${faction}`, 'AFFILIATED_WITH', { sourceRefs: ch.sourceRefs || [], field: '所属', value: faction, confidence: 'source-backed-field' });
    }
  }

  for (const ms of mobileSuits) {
    const sf = ms.structuredFields || {};
    const affiliation = sf['归属'] || sf['机体归属'] || sf['所属'] || (ms.summary?.match(/【归属：([^】]+)】/) || [])[1];
    for (const faction of splitList(affiliation)) addPromoted(ms.id, `org-${faction}`, 'AFFILIATED_WITH', { sourceRefs: ms.sourceRefs || [], field: '机体归属', value: faction, confidence: 'source-backed-field' });
    // Do not promote pilot links from mobile-suit entries alone. These entries often describe
    // battlefield context and cockpit mechanics; explicit pilot links require character claims
    // or a later manual semantic review packet.
  }

  for (const ws of warships) {
    const sf = ws.structuredFields || {};
    for (const faction of splitList(sf['战舰归属'] || sf['归属'] || sf['所属'])) addPromoted(ws.id, `org-${faction}`, 'AFFILIATED_WITH', { sourceRefs: ws.sourceRefs || [], field: '战舰归属', value: faction, confidence: 'source-backed-field' });
    for (const cap of splitList(sf['舰长'])) {
      const hit = findByText(charMap, cap);
      addPromoted(hit ? hit.name : cap, ws.id, 'CAPTAIN_OF_WARSHIP', { sourceRefs: ws.sourceRefs || [], field: '舰长', value: cap, confidence: hit ? 'source-backed-field' : 'source-backed-field-unmatched-character' });
    }
  }

  for (const ev of events) {
    const text = JSON.stringify(ev);
    for (const ch of characters) {
      if ([ch.name, ...(ch.aliases || [])].filter(Boolean).some(alias => alias.length >= 2 && text.includes(alias))) {
        addPromoted(ev.id, ch.name, 'PARTICIPANT', { sourceRefs: ev.sourceRefs || [], matchedEntity: ch.name, method: 'character-name-in-event-entry', confidence: 'source-backed-event-text' });
      }
    }
    for (const ms of mobileSuits) {
      if ([ms.name, ...(ms.aliases || [])].filter(Boolean).some(alias => alias.length >= 2 && text.includes(alias))) {
        addPromoted(ev.id, ms.id, 'INVOLVES_MOBILE_SUIT', { sourceRefs: ev.sourceRefs || [], matchedEntity: ms.name, method: 'mobile-suit-name-in-event-entry', confidence: 'source-backed-event-text' });
      }
    }
    for (const ws of warships) {
      if ([ws.name, ...(ws.aliases || [])].filter(Boolean).some(alias => alias.length >= 2 && text.includes(alias))) {
        addPromoted(ev.id, ws.id, 'INVOLVES_WARSHIP', { sourceRefs: ev.sourceRefs || [], matchedEntity: ws.name, method: 'warship-name-in-event-entry', confidence: 'source-backed-event-text' });
      }
    }
  }

  const existingRelationships = (relGraph.relationships || []).filter(r => r.generatedBy !== 'promote-semantic-relations.cjs');
  const allRelationships = uniqBy([...existingRelationships, ...promoted], r => `${r.from}|${r.type}|${r.to}|${r.relationshipId || ''}`);
  const promotedUnique = allRelationships.filter(r => r.generatedBy === 'promote-semantic-relations.cjs');
  const nodes = [];
  for (const ch of characters) nodes.push({ id: ch.name, name: ch.name, type: 'character', canonicalId: ch.id });
  for (const r of allRelationships) {
    if (String(r.to).startsWith('org-')) nodes.push({ id: r.to, name: r.to.replace(/^org-/, ''), type: 'organization-or-faction', inferredFrom: 'semantic-relation' });
    if (String(r.from).startsWith('org-')) nodes.push({ id: r.from, name: r.from.replace(/^org-/, ''), type: 'organization-or-faction', inferredFrom: 'semantic-relation' });
  }

  writeJson(path.join(curated, 'relationship-graph.json'), {
    ...relGraph,
    schema: 'gundam-seed-relationship-graph-v3-semantic-auto',
    generatedAt,
    semanticPromotion: { generatedAt, promotedRelationships: promotedUnique.length, reviewCandidates: reviewCandidates.length, policy: 'source-backed explicit fields/claims only; ambiguous relation claims are review candidates' },
    relationshipCount: allRelationships.length,
    nodes: uniqBy([...(relGraph.nodes || []), ...(relGraph.inferredNodes || []), ...nodes], n => n.id),
    relationships: allRelationships,
    reviewCandidates,
    edges: allRelationships.map(r => ({ from: r.from, to: r.to, type: r.type, relationshipId: r.relationshipId }))
  });

  const baseKgEdges = (knowledge.edges || []).filter(e => !e.relationshipId || !String(e.relationshipId).startsWith('auto-'));
  const kgNodes = uniqBy([...(knowledge.nodes || []), ...nodes.map(n => ({ id: n.id, label: n.name, name: n.name, type: n.type }))], n => n.id);
  const kgEdges = uniqBy([...baseKgEdges, ...promotedUnique.map(r => ({ from: r.from, to: r.to, type: r.type, sourceRefs: r.evidence?.sourceRefs || [], relationshipId: r.relationshipId, category: 'semantic-auto' }))], e => `${e.from}|${e.type}|${e.to}|${e.relationshipId || ''}`);
  writeJson(path.join(curated, 'knowledge-graph.json'), { ...knowledge, schema: 'gundam-seed-knowledge-graph-v3-semantic-auto', generatedAt, nodeCount: kgNodes.length, edgeCount: kgEdges.length, nodes: kgNodes, edges: kgEdges });

  const basePlotEdges = (plot.edges || []).filter(e => !e.relationshipId || !String(e.relationshipId).startsWith('auto-'));
  const plotNodes = uniqBy([...(plot.nodes || []), ...kgNodes.map(n => ({ id: n.id, label: n.label || n.name, name: n.name || n.label, type: n.type, group: n.type }))], n => n.id);
  const plotEdges = uniqBy([...basePlotEdges, ...promotedUnique.map(r => ({ from: r.from, to: r.to, source: r.from, target: r.to, type: r.type, relation: r.type, category: 'semantic-auto', relationshipId: r.relationshipId }))], e => `${e.from}|${e.type || e.relation}|${e.to}|${e.relationshipId || ''}`);
  writeJson(path.join(curated, 'plot-graph.json'), { ...plot, schema: 'rp-plot-graph-v1', generatedAt, nodes: plotNodes, edges: plotEdges, stats: { ...(plot.stats || {}), semanticAutoEdges: promotedUnique.length, semanticReviewCandidates: reviewCandidates.length, nodes: plotNodes.length, edges: plotEdges.length } });

  const byType = promotedUnique.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
  const report = { schema: 'gundam-seed-semantic-relation-promotion-report-v2', generatedAt, status: 'passed', counts: { promoted: promotedUnique.length, reviewCandidates: reviewCandidates.length, totalRelationships: allRelationships.length, knowledgeNodes: kgNodes.length, knowledgeEdges: kgEdges.length, plotNodes: plotNodes.length, plotEdges: plotEdges.length }, byType, policy: { sourceBackedOnly: true, noAuthorInterpretationPromotion: true, ambiguousClaimsAreReviewCandidates: true } };
  writeJson(path.join(planDir, 'reports', 'semantic-relation-promotion-report.json'), report);
  writeText(path.join(planDir, 'reports', 'semantic-relation-promotion-report.md'), `# Gundam SEED Semantic Relation Promotion\n\n- Generated: ${generatedAt}\n- Status: passed\n- Promoted relationships: ${promotedUnique.length}\n- Review candidates: ${reviewCandidates.length}\n- Total relationships: ${allRelationships.length}\n- Knowledge graph: ${kgNodes.length} nodes / ${kgEdges.length} edges\n- Plot graph: ${plotNodes.length} nodes / ${plotEdges.length} edges\n\n## By Type\n\n${Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Policy\n\nOnly source-backed fields and explicit claim labels/openings were promoted. Ambiguous relation claims are retained as review candidates, not deployable semantic facts.\n`);
  console.log(JSON.stringify({ ok: true, ...report.counts, byType }, null, 2));
}

main();
