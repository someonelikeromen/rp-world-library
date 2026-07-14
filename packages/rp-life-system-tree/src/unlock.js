const { priceForN, upgradeDeltaPrice, canAfford, deductPrice, addPoints, applyDiscount } = require('./pricing');
const { nodeById, prerequisitesMet } = require('./graph');
const { validateNode, validateGrantSource } = require('./validate');

function now() { return new Date().toISOString(); }
function makeId(prefix) { return `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`; }

function zeroBalances(maxLevel = 3) {
  const out = {};
  for (let i = 1; i <= maxLevel; i += 1) out[`${i}级奖励点`] = 0;
  return out;
}

function normalizeState(state, settings) {
  state.schema = state.schema || 'rp-life-system-tree-state-v1';
  state.enabled = !!state.enabled;
  state.owner = state.owner || 'protagonist-only';
  state.uiStyle = state.uiStyle || 'sci-fi';
  state.masterGraphRef = state.masterGraphRef || 'data/rp-life-system-tree/global-graph.json';
  state.masterGraphVersion = state.masterGraphVersion || 'v1';
  state.displayPolicy = state.displayPolicy || settings.displayPolicy;
  state.currency = state.currency || {};
  state.currency.conversionRate = state.currency.conversionRate || settings.currency.conversionRate;
  state.currency.defaultVisibleLevels = state.currency.defaultVisibleLevels || settings.currency.defaultVisibleLevels || [1, 2, 3];
  for (const key of ['balances', 'lifetimeEarned', 'lifetimeSpent']) state.currency[key] = { ...zeroBalances(3), ...(state.currency[key] || {}) };
  state.storyGraph = state.storyGraph || {};
  for (const key of ['unlockedAbilityBases', 'revealedNodes', 'availableNodes', 'unlockedNodes', 'selfAchievedNodes', 'visibleEdges']) state.storyGraph[key] = Array.isArray(state.storyGraph[key]) ? state.storyGraph[key] : [];
  state.storyGraph.nodeRanks = state.storyGraph.nodeRanks || {};
  for (const key of ['searchRecords', 'sourceAudits', 'transactions', 'auditLog']) state[key] = Array.isArray(state[key]) ? state[key] : [];
  return state;
}

function defaultState(settings) {
  return normalizeState({
    schema: 'rp-life-system-tree-state-v1',
    enabled: false,
    owner: 'protagonist-only',
    uiStyle: 'sci-fi',
    masterGraphRef: 'data/rp-life-system-tree/global-graph.json',
    masterGraphVersion: 'v1',
    displayPolicy: settings.displayPolicy,
    currency: { conversionRate: settings.currency.conversionRate, defaultVisibleLevels: [1, 2, 3], balances: zeroBalances(), lifetimeEarned: zeroBalances(), lifetimeSpent: zeroBalances() },
    storyGraph: { unlockedAbilityBases: [], revealedNodes: [], availableNodes: [], unlockedNodes: [], selfAchievedNodes: [], nodeRanks: {}, visibleEdges: [] },
    searchRecords: [], sourceAudits: [], transactions: [], auditLog: []
  }, settings);
}

function priceNode(node, exchangeSettings, settings) {
  const p = node.pricing || {};
  if (p.mode === 'inherent' || p.mode === 'selfTraining' || p.mode === 'storyAchievement') return { amount: 0, pointLevel: 1, display: '0个1级奖励点', mode: p.mode };
  let price;
  if (p.mode === 'upgrade-delta') price = upgradeDeltaPrice(p.fromRating, p.toRating, exchangeSettings);
  else price = priceForN(p.toRating || node.evaluation?.pricingRating, exchangeSettings);
  if (Array.isArray(p.discounts) && p.discounts.length > 0) price = applyDiscount(price, p.discounts, exchangeSettings, false);
  return { ...price, mode: p.mode || 'currency' };
}

function quoteNode(graph, state, nodeId, exchangeSettings, settings) {
  const node = nodeById(graph, nodeId);
  if (!node) return { ok: false, errors: [`node not found: ${nodeId}`] };
  const validation = validateNode(node, settings);
  const prereq = prerequisitesMet(graph, state, nodeId);
  const price = validation.ok ? priceNode(node, exchangeSettings, settings) : null;
  const afford = price ? (price.amount === 0 || canAfford(state.currency.balances, price, exchangeSettings)) : false;
  const already = (state.storyGraph.unlockedNodes || []).includes(nodeId) || (state.storyGraph.selfAchievedNodes || []).includes(nodeId);
  const errors = [...validation.errors];
  if (!prereq.ok) errors.push(`missing prerequisites: ${prereq.missing.join(', ')}`);
  if (already) errors.push('node already unlocked/self-achieved');
  return { ok: errors.length === 0, errors, nodeId, nodeName: node.name, price, afford, prerequisites: prereq, node };
}

function unlockNode(graph, state, nodeId, exchangeSettings, settings, options = {}) {
  const q = quoteNode(graph, state, nodeId, exchangeSettings, settings);
  if (!q.ok) throw new Error(q.errors.join('; '));
  if (!q.afford) throw new Error('Insufficient reward points');
  if (q.price.amount > 0) {
    state.currency.balances = deductPrice(state.currency.balances, q.price, exchangeSettings);
    state.currency.lifetimeSpent = addPoints(state.currency.lifetimeSpent, q.price.amount, q.price.pointLevel, exchangeSettings);
  }
  state.storyGraph.unlockedNodes.push(nodeId);
  if (q.node.nodeKind === 'abilityBase' && !state.storyGraph.unlockedAbilityBases.includes(nodeId)) state.storyGraph.unlockedAbilityBases.push(nodeId);
  state.storyGraph.nodeRanks[nodeId] = Math.max(1, Number(options.rank || 1));
  const tx = { id: makeId('unlock'), type: 'unlock', state: 'completed', nodeId, nodeName: q.node.name, price: q.price, createdAt: now(), completedAt: now(), cardModuleUpdates: options.cardModuleUpdates || [], memoryUpdates: options.memoryUpdates || [] };
  state.transactions.push(tx);
  state.auditLog.push({ id: makeId('audit'), at: now(), action: 'unlock', nodeId, transactionId: tx.id });
  return { state, transaction: tx, quote: q };
}

function selfAchieveNode(graph, state, nodeId, settings, options = {}) {
  const node = nodeById(graph, nodeId);
  if (!node) throw new Error(`node not found: ${nodeId}`);
  const validation = validateNode(node, settings);
  if (!validation.ok) throw new Error(validation.errors.join('; '));
  if (!options.evidenceRef && !(node.sourceWorld?.refs || []).some(ref => String(ref).includes('memory/'))) throw new Error('self-achieve requires memory evidenceRef');
  if (!state.storyGraph.selfAchievedNodes.includes(nodeId)) state.storyGraph.selfAchievedNodes.push(nodeId);
  if (!state.storyGraph.unlockedNodes.includes(nodeId)) state.storyGraph.unlockedNodes.push(nodeId);
  if (node.nodeKind === 'abilityBase' && !state.storyGraph.unlockedAbilityBases.includes(nodeId)) state.storyGraph.unlockedAbilityBases.push(nodeId);
  const tx = { id: makeId('self-achieve'), type: 'self-achieve', state: 'completed', nodeId, nodeName: node.name, evidenceRef: options.evidenceRef, createdAt: now(), completedAt: now(), cardModuleUpdates: options.cardModuleUpdates || [], memoryUpdates: options.memoryUpdates || [] };
  state.transactions.push(tx);
  state.auditLog.push({ id: makeId('audit'), at: now(), action: 'self-achieve', nodeId, transactionId: tx.id });
  return { state, transaction: tx };
}

function grantPoints(state, sourceType, amount, pointLevel, reason, eventRef, settings, exchangeSettings) {
  const v = validateGrantSource(sourceType, reason, eventRef, settings);
  if (!v.ok) throw new Error(v.errors.join('; '));
  state.currency.balances = addPoints(state.currency.balances, amount, pointLevel, exchangeSettings);
  state.currency.lifetimeEarned = addPoints(state.currency.lifetimeEarned, amount, pointLevel, exchangeSettings);
  const tx = { id: makeId('grant'), type: 'grant-points', state: 'completed', sourceType, amount, pointLevel, display: `${amount}个${pointLevel}级奖励点`, reason, eventRef, createdAt: now(), completedAt: now() };
  state.transactions.push(tx);
  state.auditLog.push({ id: makeId('audit'), at: now(), action: 'grant-points', transactionId: tx.id });
  return { state, transaction: tx };
}

module.exports = { defaultState, normalizeState, priceNode, quoteNode, unlockNode, selfAchieveNode, grantPoints };
