const { parseN } = require('./pricing');

function nodeById(graph, nodeId) {
  return (graph.nodes || []).find(n => n.id === nodeId);
}

function protagonistRatingCap(overallRating, offset = 1) {
  const n = parseN(overallRating || 'N0');
  return Math.min(24, n + offset);
}

function isNodeWithinCap(node, cap) {
  const ratings = [];
  if (Array.isArray(node.layers)) for (const layer of node.layers) ratings.push(parseN(layer));
  if (node.evaluation?.pricingRating) ratings.push(parseN(node.evaluation.pricingRating));
  return ratings.length > 0 && Math.min(...ratings) <= cap;
}

function stateSet(state, key) {
  return new Set(state.storyGraph?.[key] || []);
}

function isVisibleNode(node, state, cap) {
  if (!isNodeWithinCap(node, cap)) return false;
  const unlocked = stateSet(state, 'unlockedNodes');
  const achieved = stateSet(state, 'selfAchievedNodes');
  const revealed = stateSet(state, 'revealedNodes');
  const available = stateSet(state, 'availableNodes');
  const bases = stateSet(state, 'unlockedAbilityBases');
  if (unlocked.has(node.id) || achieved.has(node.id) || revealed.has(node.id) || available.has(node.id)) return true;
  if (node.nodeKind === 'abilityBase') return bases.has(node.id);
  const edges = state.storyGraph?.visibleEdges || [];
  return edges.some(eid => false);
}

function visibleGraph(graph, state, protagonistOverall = 'N0', settings = {}) {
  const offset = state.displayPolicy?.maxVisibleRatingOffsetFromProtagonistOverall ?? settings.displayPolicy?.maxVisibleRatingOffsetFromProtagonistOverall ?? 1;
  const cap = protagonistRatingCap(protagonistOverall, offset);
  const visibleNodes = (graph.nodes || []).filter(node => isVisibleNode(node, state, cap));
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = (graph.edges || []).filter(e => visibleIds.has(e.from) && visibleIds.has(e.to) && (state.storyGraph?.visibleEdges || []).includes(e.id));
  return { cap: `N${cap}`, capN: cap, nodes: visibleNodes, edges: visibleEdges, policy: { showHiddenNodeSilhouettes: false, requiresActiveSearchForUnknownAbilityBases: true } };
}

function searchGraph(graph, query = {}, protagonistOverall = 'N0', state = {}, settings = {}) {
  const cap = protagonistRatingCap(protagonistOverall, settings.displayPolicy?.maxVisibleRatingOffsetFromProtagonistOverall ?? 1);
  const text = String(query.text || query.query || '').toLowerCase();
  const category = query.category;
  const worldId = query.worldId;
  const layer = query.layer ? parseN(query.layer) : undefined;
  const results = (graph.nodes || []).filter(node => {
    if (!isNodeWithinCap(node, cap)) return false;
    if (category && node.category !== category) return false;
    if (worldId && node.sourceWorld?.worldId !== worldId) return false;
    if (layer !== undefined && !(node.layers || []).some(l => parseN(l) === layer)) return false;
    if (text) {
      const hay = `${node.id} ${node.name} ${node.category} ${node.sourceWorld?.worldName || ''}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
  return { cap: `N${cap}`, results };
}

function prerequisitesMet(graph, state, nodeId) {
  const unlocked = new Set([...(state.storyGraph?.unlockedNodes || []), ...(state.storyGraph?.selfAchievedNodes || [])]);
  const prereqEdges = (graph.edges || []).filter(e => e.to === nodeId && e.affectsUnlock && (e.type === 'prerequisite' || e.type === 'upgrade'));
  const missing = prereqEdges.filter(e => !unlocked.has(e.from)).map(e => e.from);
  return { ok: missing.length === 0, missing };
}

function upsertById(arr, item) {
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx >= 0) arr[idx] = item;
  else arr.push(item);
}

module.exports = { nodeById, protagonistRatingCap, visibleGraph, searchGraph, prerequisitesMet, upsertById, isNodeWithinCap };
