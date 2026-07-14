const { parseN } = require('./pricing');

const ALLOWED_NODE_KINDS = new Set(['abilityBase', 'single', 'multiRank', 'keystone']);
const FORBIDDEN_NODE_KINDS = new Set(['navigation', 'categoryEntry', 'folder', 'empty', 'original']);
const ALLOWED_ORIGIN_TYPES = new Set(['protagonist_baseline', 'canon_source', 'archived_world_source', 'verified_external_source', 'in_story_training', 'story_event_awakened', 'hybrid_training_currency']);
const FORBIDDEN_ORIGIN_TYPES = new Set(['original', 'system_original', 'unclear', 'unknown']);
const ALLOWED_UNLOCK_MODES = new Set(['inherent', 'currency', 'selfTraining', 'storyAchievement', 'hybrid', 'sourceAcquisition']);
const ALLOWED_EDGE_TYPES = new Set(['upgrade', 'prerequisite', 'synergy', 'variant', 'sameSourceLine']);
const ALLOWED_GRANT_SOURCES = new Set(['defeatStrongEnemy', 'worldImpact', 'plotDeviation']);

function hasMemoryRef(refs = []) {
  return refs.some(ref => String(ref).includes('memory/'));
}

function validateSourceWorld(node, settings = {}) {
  const errors = [];
  const s = node.sourceWorld || {};
  if (!s.worldId) errors.push('sourceWorld.worldId required');
  if (!s.worldName) errors.push('sourceWorld.worldName required');
  if (!s.sourceType) errors.push('sourceWorld.sourceType required');
  if (!s.verificationStatus) errors.push('sourceWorld.verificationStatus required');
  if (FORBIDDEN_ORIGIN_TYPES.has(s.sourceType)) errors.push('sourceWorld.sourceType must not be original/unknown');
  if (s.sourceType && !ALLOWED_ORIGIN_TYPES.has(s.sourceType)) errors.push(`invalid sourceWorld.sourceType: ${s.sourceType}`);
  const refs = Array.isArray(s.refs) ? s.refs : [];
  const webSources = Array.isArray(s.webSources) ? s.webSources : [];
  if (s.status === 'archived' && refs.length < 1) errors.push('archived node requires sourceWorld.refs');
  if (s.status === 'unarchived') {
    const min = settings.sourceVerification?.minimumIndependentSources || 2;
    if (webSources.length < min) errors.push('unarchived node requires at least two webSources');
    for (const src of webSources) if (!src.url || !src.title || !src.fetchedAt || !src.summary) errors.push('each webSource requires url/title/fetchedAt/summary');
  }
  if (s.status === 'baseline' && s.verificationStatus !== 'inherent') errors.push('baseline source requires verificationStatus inherent');
  if (s.status === 'story-confirmed' && !hasMemoryRef(refs)) errors.push('story-confirmed source requires memory ref');
  return errors;
}

function validateEvaluation(node, settings = {}) {
  const errors = [];
  const ev = node.evaluation || {};
  const req = settings.evaluation || {};
  if (ev.framework !== (req.framework || 'multi-world-combat-rating')) errors.push('evaluation.framework must be multi-world-combat-rating');
  if (ev.evaluationMethod !== (req.requiredEvaluationMethod || 'multi-world-evaluation-method-v1')) errors.push('evaluation.evaluationMethod must be multi-world-evaluation-method-v1');
  if (ev.ratingSystem !== (req.requiredRatingSystem || 'multi-world-rating-system-n0-n24-v1')) errors.push('evaluation.ratingSystem must be multi-world-rating-system-n0-n24-v1');
  if (!ev.pricingRating) errors.push('evaluation.pricingRating required');
  else { try { parseN(ev.pricingRating); } catch (err) { errors.push(err.message); } }
  if (!ev.basis) errors.push('evaluation.basis required');
  if (!Array.isArray(ev.evidence)) errors.push('evaluation.evidence array required');
  return errors;
}

function validatePricing(node) {
  const errors = [];
  const p = node.pricing || {};
  if (!p.mode) errors.push('pricing.mode required');
  if (p.mode === 'upgrade-delta' && (!p.fromRating || !p.toRating)) errors.push('upgrade-delta pricing requires fromRating and toRating');
  if ((p.mode === 'initial-unlock' || p.mode === 'layer-entry' || p.mode === 'currency') && !p.toRating) errors.push(`${p.mode} pricing requires toRating`);
  if (Array.isArray(p.discounts)) for (const d of p.discounts) if (Number(d.rate || 0) > 0 && !d.evidenceRef) errors.push('discount requires evidenceRef');
  return errors;
}

function validateNode(node, settings = {}) {
  const errors = [];
  if (!node || typeof node !== 'object') errors.push('node must be object');
  if (!node?.id) errors.push('node.id required');
  if (!node?.name) errors.push('node.name required');
  if (!ALLOWED_NODE_KINDS.has(node?.nodeKind)) errors.push(`invalid nodeKind: ${node?.nodeKind}`);
  if (FORBIDDEN_NODE_KINDS.has(node?.nodeKind)) errors.push('nodeKind must not be navigation/category/folder/empty/original');
  if (!ALLOWED_ORIGIN_TYPES.has(node?.originType)) errors.push(`invalid originType: ${node?.originType}`);
  if (FORBIDDEN_ORIGIN_TYPES.has(node?.originType)) errors.push('originType must not be original/unknown');
  if (!node?.category) errors.push('node.category required');
  if (!Array.isArray(node?.layers) || node.layers.length < 1) errors.push('node.layers required');
  else for (const layer of node.layers) try { parseN(layer); } catch (err) { errors.push(`invalid layer ${layer}`); }
  if (!Array.isArray(node?.unlockModes) || node.unlockModes.length < 1) errors.push('node.unlockModes required');
  else for (const mode of node.unlockModes) if (!ALLOWED_UNLOCK_MODES.has(mode)) errors.push(`invalid unlock mode: ${mode}`);
  if (node.nodeKind === 'abilityBase') {
    if (!Array.isArray(node.effects) || node.effects.length < 1) errors.push('abilityBase must have concrete effects');
    if (node.isTreeRoot !== true && node.isLayerStart !== true) errors.push('abilityBase should be tree root or layer start');
  }
  errors.push(...validateSourceWorld(node, settings));
  errors.push(...validateEvaluation(node, settings));
  errors.push(...validatePricing(node));
  if (!Array.isArray(node?.effects)) errors.push('node.effects array required');
  return { ok: errors.length === 0, errors };
}

function validateEdge(edge) {
  const errors = [];
  if (!edge?.id) errors.push('edge.id required');
  if (!edge?.from) errors.push('edge.from required');
  if (!edge?.to) errors.push('edge.to required');
  if (!ALLOWED_EDGE_TYPES.has(edge?.type)) errors.push(`invalid edge.type: ${edge?.type}`);
  if (edge?.type === 'navigation' || edge?.type === 'category-entry' || edge?.type === 'folder') errors.push('navigation/category/folder edges are forbidden');
  return { ok: errors.length === 0, errors };
}

function validateGraph(graph, settings = {}) {
  const errors = [];
  if (graph.schema !== 'rp-life-system-tree-global-graph-v1') errors.push('graph.schema must be rp-life-system-tree-global-graph-v1');
  const ids = new Set();
  for (const n of graph.nodes || []) {
    if (ids.has(n.id)) errors.push(`duplicate node id: ${n.id}`);
    ids.add(n.id);
    const v = validateNode(n, settings);
    if (!v.ok) errors.push(`node ${n.id}: ${v.errors.join('; ')}`);
  }
  for (const e of graph.edges || []) {
    const v = validateEdge(e);
    if (!v.ok) errors.push(`edge ${e.id}: ${v.errors.join('; ')}`);
    if (e.from && !ids.has(e.from)) errors.push(`edge ${e.id}: missing from node ${e.from}`);
    if (e.to && !ids.has(e.to)) errors.push(`edge ${e.id}: missing to node ${e.to}`);
  }
  return { ok: errors.length === 0, errors };
}

function validateGrantSource(sourceType, reason = '', eventRef = '', settings = {}) {
  const errors = [];
  if (!ALLOWED_GRANT_SOURCES.has(sourceType)) errors.push(`invalid grant sourceType: ${sourceType}`);
  for (const hint of settings.forbiddenGrantHints || []) if (reason.includes(hint)) errors.push(`forbidden grant reason hint: ${hint}`);
  if (!eventRef) errors.push('grant requires eventRef');
  return { ok: errors.length === 0, errors };
}

module.exports = { validateNode, validateEdge, validateGraph, validateSourceWorld, validateEvaluation, validatePricing, validateGrantSource, ALLOWED_NODE_KINDS, ALLOWED_ORIGIN_TYPES, ALLOWED_UNLOCK_MODES };
