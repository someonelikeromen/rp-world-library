const assert = require('node:assert');
const life = require('../src');

function settings() { return life.loadLifeTreeSettings(); }
function exchangeSettings() { return life.loadExchangeSettings(); }

function node(overrides = {}) {
  return {
    id: 'human-body',
    name: '人类身体',
    nodeKind: 'abilityBase',
    originType: 'protagonist_baseline',
    category: 'body',
    layers: ['N0'],
    isLayerStart: true,
    isTreeRoot: true,
    sourceWorld: {
      worldId: 'real-world-baseline',
      worldName: '现实世界 / 普通人类基线',
      sourceType: 'protagonist_baseline',
      status: 'baseline',
      refs: [],
      webSources: [],
      verificationStatus: 'inherent'
    },
    unlockModes: ['inherent'],
    evaluation: {
      framework: 'multi-world-combat-rating',
      evaluationMethod: 'multi-world-evaluation-method-v1',
      ratingSystem: 'multi-world-rating-system-n0-n24-v1',
      baseRating: 'N0',
      peakRating: 'N0',
      conditionalRating: null,
      pricingRating: 'N0',
      basis: '主角当前具备的普通人类身体基础，不提供超凡能力。',
      evidence: ['角色初始状态'],
      limitations: [],
      disputes: [],
      excludedInflations: []
    },
    pricing: { mode: 'inherent', toRating: 'N0' },
    effects: [{ targetModule: 'lifeProfile', operation: 'baseline', id: 'human-body', payload: {} }],
    ...overrides,
  };
}

function graph(nodes = [node()], edges = []) {
  return { schema: 'rp-life-system-tree-global-graph-v1', version: 'v1', nodes, edges, layers: [], internalIndex: {}, auditLog: [] };
}

function testValidation() {
  const s = settings();
  assert.equal(life.validateNode(node(), s).ok, true);
  assert.equal(life.validateNode(node({ nodeKind: 'navigation' }), s).ok, false);
  assert.equal(life.validateNode(node({ originType: 'original', sourceWorld: { worldId: 'x', worldName: 'x', sourceType: 'original', status: 'baseline', verificationStatus: 'inherent' } }), s).ok, false);
  assert.equal(life.validateNode(node({ sourceWorld: undefined }), s).ok, false);
  assert.equal(life.validateNode(node({ evaluation: { ...node().evaluation, evaluationMethod: 'wrong' } }), s).ok, false);
  assert.equal(life.validateNode(node({ effects: [] }), s).ok, false);
  const story = node({
    id: 'basic-firearms',
    name: '基础枪械',
    originType: 'in_story_training',
    category: 'combat_skill',
    sourceWorld: { worldId: 'hidan-no-aria', worldName: '绯弹的亚里亚', sourceType: 'in_story_training', status: 'story-confirmed', refs: ['memory/world-history.md#训练'], verificationStatus: 'story-confirmed' },
    unlockModes: ['selfTraining', 'hybrid'],
    pricing: { mode: 'selfTraining', toRating: 'N0' },
  });
  assert.equal(life.validateNode(story, s).ok, true);
  const unarchived = node({
    sourceWorld: { worldId: 'x', worldName: '未归档', sourceType: 'canon_source', status: 'unarchived', verificationStatus: 'verified', webSources: [
      { url: 'https://example.com/a', title: 'A', fetchedAt: '2026-07-14T00:00:00Z', summary: '证明' },
      { url: 'https://example.com/b', title: 'B', fetchedAt: '2026-07-14T00:00:00Z', summary: '证明' }
    ] }
  });
  assert.equal(life.validateNode(unarchived, s).ok, true);
}

function testPricing() {
  const ex = exchangeSettings();
  assert.deepEqual(life.priceForN('N3', ex), { n: 3, amount: 30, pointLevel: 1, display: '30个1级奖励点' });
  const delta = life.upgradeDeltaPrice('N2', 'N3', ex);
  assert.equal(delta.amount, 20);
  assert.equal(delta.pointLevel, 1);
  const cross = life.upgradeDeltaPrice('N5', 'N6', ex);
  assert.equal(cross.amount, 700);
  assert.equal(cross.pointLevel, 1);
}

function testVisibilityAndUnlock() {
  const s = settings();
  const ex = exchangeSettings();
  const n0 = node();
  const n3 = node({ id: 'life-flow-analysis', name: '生命流动解析', nodeKind: 'single', category: 'sense', layers: ['N3'], isLayerStart: false, isTreeRoot: false, unlockModes: ['currency'], evaluation: { ...node().evaluation, pricingRating: 'N3', basis: 'N3示例' }, pricing: { mode: 'initial-unlock', toRating: 'N3' }, effects: [{ targetModule: 'abilities', operation: 'upsert', id: 'life-flow-analysis', payload: {} }] });
  const n5 = node({ id: 'hidden-n5', name: '不应显示N5', nodeKind: 'single', category: 'sense', layers: ['N5'], isLayerStart: false, isTreeRoot: false, unlockModes: ['currency'], evaluation: { ...node().evaluation, pricingRating: 'N5', basis: 'N5示例' }, pricing: { mode: 'initial-unlock', toRating: 'N5' }, effects: [{ targetModule: 'abilities', operation: 'upsert', id: 'hidden-n5', payload: {} }] });
  const g = graph([n0, n3, n5]);
  let state = life.defaultState(s);
  state.storyGraph.revealedNodes.push('life-flow-analysis', 'hidden-n5');
  const vis = life.visibleGraph(g, state, 'N3', s);
  assert.equal(vis.cap, 'N4');
  assert.equal(vis.nodes.some(x => x.id === 'life-flow-analysis'), true);
  assert.equal(vis.nodes.some(x => x.id === 'hidden-n5'), false);
  state.currency.balances['1级奖励点'] = 30;
  const q = life.quoteNode(g, state, 'life-flow-analysis', ex, s);
  assert.equal(q.ok, true);
  assert.equal(q.afford, true);
  const r = life.unlockNode(g, state, 'life-flow-analysis', ex, s);
  assert.equal(r.state.storyGraph.unlockedNodes.includes('life-flow-analysis'), true);
  assert.equal(r.state.currency.balances['1级奖励点'], 0);
}

function testGrantSource() {
  const s = settings();
  const ex = exchangeSettings();
  let state = life.defaultState(s);
  assert.throws(() => life.grantPoints(state, 'dailyQuest', 1, 1, '普通任务', 'memory/x', s, ex), /invalid grant sourceType/);
  const r = life.grantPoints(state, 'defeatStrongEnemy', 2, 1, '击败强敌', 'memory/world-history.md#强敌', s, ex);
  assert.equal(r.state.currency.balances['1级奖励点'], 2);
}

testValidation();
testPricing();
testVisibilityAndUnlock();
testGrantSource();
console.log('rp-life-system-tree tests passed');
