const assert = require('node:assert');
const ex = require('../src');

function entry(overrides = {}) {
  return {
    id: 'exchange-entry-001',
    name: '示例完整格斗术传承',
    type: 'non_foundation_body_soul_technique',
    subtype: 'martial_arts_style',
    description: '原著中可独立成立的完整格斗术流派传承。',
    rating: { n: 2, label: 'N2 墙壁级', evidence: '示例证据' },
    evaluation: {
      framework: 'multi-world-combat-rating',
      evaluationMethod: 'multi-world-evaluation-method-v1',
      ratingSystem: 'multi-world-rating-system-n0-n24-v1',
      overall: 'N2',
      pricingRating: 'N2',
      basis: '按多世界评价方式拆解证据后，完整格斗术传承稳定支持墙壁级表现。',
      evidence: ['示例证据'],
      dimensions: { overall: 'N2', offense: 'N2', defense: 'N1', reaction: 'N2' },
      excludedInflations: ['流派名气'],
      confidence: 'medium'
    },
    price: { amount: 10, pointLevel: 1, display: '10个1级奖励点' },
    source: { worldName: '示例归档世界', status: 'archived', refs: ['world:example:abilities:style'], verificationStatus: 'verified' },
    completeness: { isCompleteUnit: true, notFragment: true, notTrial: true, notWeakened: true, notes: '完整流派。' },
    targetModules: ['abilities'],
    ...overrides,
  };
}

function testSettingsAndPricing() {
  const settings = ex.loadExchangeSettings();
  assert.equal(settings.schema, 'rp-exchange-settings-v1');
  assert.equal(settings.currency.conversionRate, 1000);
  assert.deepEqual(ex.priceForN('N0', settings), { n: 0, amount: 1, pointLevel: 1, display: '1个1级奖励点' });
  assert.deepEqual(ex.priceForN('N12', settings), { n: 12, amount: 1, pointLevel: 3, display: '1个3级奖励点' });
  assert.equal(ex.pointName(5), '5级奖励点');
}

function testCurrency() {
  const settings = ex.loadExchangeSettings();
  const normalized = ex.normalizeBalances({ '1级奖励点': 2500, '2级奖励点': 1 }, 5, 1000);
  assert.equal(normalized['1级奖励点'], 500);
  assert.equal(normalized['2级奖励点'], 3);
  const price = ex.priceForN('N6', settings); // 1个2级奖励点
  assert.equal(ex.canAfford({ '1级奖励点': 1000 }, price, settings), true);
  assert.equal(ex.canAfford({ '1级奖励点': 999 }, price, settings), false);
  const after = ex.deductPrice({ '1级奖励点': 1500 }, price, settings);
  assert.equal(after['1级奖励点'], 500);
  assert.equal(after['2级奖励点'], 0);
}

function testValidation() {
  assert.equal(ex.validateEntry(entry()), true);
  assert.throws(() => ex.validateEntry(entry({ type: 'system_service' })), /Invalid exchange type/);
  assert.throws(() => ex.validateEntry(entry({ type: 'knowledge', subtype: 'information' })), /must not include information/);
  assert.throws(() => ex.validateEntry(entry({ type: 'contract', subtype: 'random_contract' })), /Invalid contract subtype/);
  assert.throws(() => ex.validateEntry(entry({ completeness: { isCompleteUnit: false, notFragment: true, notTrial: true, notWeakened: true } })), /complete unit/);
  assert.throws(() => ex.validateEntry(entry({ name: '示例碎片', completeness: { isCompleteUnit: true, notFragment: true, notTrial: true, notWeakened: true } })), /Forbidden exchange hint/);
  assert.throws(() => ex.validateEntry(entry({ evaluation: { framework: 'multi-world-combat-rating', overall: 'N2', basis: '缺少评价方式标记', evidence: ['示例'] } })), /multi-world-evaluation-method-v1/);
  const unarchived = entry({
    source: {
      worldName: '非归档作品',
      status: 'unarchived',
      verificationStatus: 'verified',
      webSources: [
        { url: 'https://example.com/a', title: '来源A', fetchedAt: '2026-07-14T00:00:00Z', summary: '证明作品与兑换项存在。' },
        { url: 'https://example.com/b', title: '来源B', fetchedAt: '2026-07-14T00:00:00Z', summary: '独立证明完整内容。' }
      ]
    }
  });
  assert.equal(ex.validateEntry(unarchived), true);
  assert.throws(() => ex.validateEntry(entry({ source: { worldName: '非归档作品', status: 'unarchived', verificationStatus: 'verified', webSources: [] } })), /at least two/);
}

testSettingsAndPricing();
testCurrency();
testValidation();
console.log('rp-exchange tests passed');
