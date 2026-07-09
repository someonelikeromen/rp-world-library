const assert = require('node:assert');
const ach = require('../src');

function reward(overrides = {}) {
  return {
    id: overrides.id || 'reward-example-001',
    name: overrides.name || '示例作品 · 示例奖励',
    type: overrides.type || 'ability',
    requiresEnergySystem: overrides.requiresEnergySystem ?? false,
    rewardRating: { rating: 'N2 墙壁级', score: 420 },
    canon: { required: true, sourceType: 'manga', work: '示例作品', appearsAs: '示例奖励', evidence: '示例原著依据' },
    origin: {
      sourceWorld: '示例作品',
      originalOwner: '示例原主人',
      originalOwnerExperience: '原主人在对应剧情阶段的长期使用经验。',
      realmOrStage: '入门境界',
      masteryLevel: '基础可用',
      protagonistCurrentUsability: '主角领取后可发挥最低稳定水平。',
      limitations: '需要训练与适配。',
    },
    targetModules: ['abilities'],
    ...overrides,
  };
}

function testSettings() {
  const settings = ach.loadAchievementSettings();
  assert.equal(settings.schema, 'rp-achievement-system-settings-v1');
  assert.equal(settings.rewardGeneration.globalRandomPool, true);
  assert.equal(settings.ui.theme, 'translucent-cyan-sci-fi');
  assert.ok(settings.requiredRewardProvenance.includes('origin.originalOwnerExperience'));
}

function testRatings() {
  assert.equal(ach.parseRatingN('N6 城镇级'), 6);
  const range = ach.nRangeForAchievementTier('major', 'N6 城镇级', 'N8 山脉/区域级');
  assert.deepEqual(range, { minN: 5, maxN: 7, anchorN: 6, topN: 8 });
  assert.equal(ach.makeRewardRating(2, 'mid').rating, 'N2 墙壁级');
}

function testRd100() {
  const table = ach.buildWorldRd100({
    rng: () => 0.5,
    archivedWorlds: [{ world: '火影忍者', slug: 'naruto' }],
    unarchivedWorlds: [{ world: '浪客剑心', slug: 'rurouni-kenshin' }],
  });
  assert.equal(table.slots.length, 100);
  assert.equal(table.settingsVersion, ach.loadAchievementSettings().version);
  assert.equal(table.slots.filter(s => s.slug === 'naruto').length, 3);
  assert.equal(table.slots.filter(s => s.slug === 'rurouni-kenshin').length, 2);
  assert.equal(table.slots.filter(s => s.source === 'randomAnimeGameWorld').length, 95);
  assert.ok(ach.selectRd100Slot(table, 1));
}

function testDedupeAndClaim() {
  const r = reward({ id: 'reward-naruto-substitution-jutsu-001', name: '火影世界 · 替身术', type: 'ability', requiresEnergySystem: true, canon: { required: true, sourceType: 'manga', work: '火影忍者', appearsAs: '替身术', evidence: '原著基础忍术' }, origin: { sourceWorld: '火影忍者', originalOwner: '忍者基础教育体系', originalOwnerExperience: '基础学院和实战规避经验。', realmOrStage: '下忍入门', masteryLevel: '可完成一次标准替身', protagonistCurrentUsability: '需有查克拉或已接触能量体系。', limitations: '需要查克拉、替换物和结印。' } });
  const energyState = { worldExposure: { currentWorld: { name: '火影忍者', hasEnergySystem: true }, experiencedWorlds: [] }, claimedRewardIds: [] };
  assert.equal(ach.isDuplicateReward(r, energyState), false);
  assert.equal(ach.isDuplicateReward(r, { claimedRewardIds: [r.id] }), true);
  const pending = ach.createPendingClaim({ id: 'ach-1' }, r, energyState);
  assert.equal(pending.state, 'pendingClaim');
  const claimed = ach.claimReward(pending);
  assert.equal(claimed.state, 'claimed');
}

function testValidation() {
  assert.throws(() => ach.validateReward({ id: 'bad', type: 'prop', canon: { required: true } }), /Invalid reward type/);
  assert.throws(() => ach.validateReward(reward({ id: 'bad2', type: 'item', name: '系统道具' })), /Forbidden/);
  assert.throws(() => ach.validateReward(reward({ id: 'bad3', type: 'item', verification: { reason: 'randomAnimeGameWorld', status: 'pending' } })), /webVerified/);
  assert.throws(() => ach.validateReward({ id: 'bad4', name: '缺来源', type: 'item', canon: { required: true, sourceType: 'manga', work: 'x', appearsAs: 'y', evidence: 'z' }, targetModules: ['inventory'] }), /missing required provenance/);
}

function testEnergyGate() {
  const settings = ach.loadAchievementSettings();
  const noEnergyState = { worldExposure: { currentWorld: { name: '现实世界', hasEnergySystem: false }, experiencedWorlds: [{ name: '日常世界', energySystem: 'none' }] } };
  const energyState = { worldExposure: { currentWorld: { name: '现实世界', hasEnergySystem: false }, experiencedWorlds: [{ name: '火影忍者', energySystem: 'chakra' }] } };
  const chakra = reward({ id: 'reward-energy', name: '火影世界 · 查克拉基础', type: 'ability', requiresEnergySystem: true, canon: { required: true, sourceType: 'manga', work: '火影忍者', appearsAs: '查克拉', evidence: '原著基础体系' }, origin: { sourceWorld: '火影忍者', originalOwner: '忍者群体', originalOwnerExperience: '长期提炼与使用查克拉的经验。', realmOrStage: '入门', masteryLevel: '最低提炼', protagonistCurrentUsability: '有能量经历时可最低限度驱动。', limitations: '无能量经历时必须重抽。' } });
  const mundane = reward({ id: 'reward-mundane', name: '枪械维护经验', type: 'knowledge', requiresEnergySystem: false, canon: { required: true, sourceType: 'anime', work: '现实系作品', appearsAs: '枪械维护', evidence: '角色训练描写' }, origin: { sourceWorld: '现实系作品', originalOwner: '资深枪械教官', originalOwnerExperience: '长期维护和排障经验。', realmOrStage: '职业熟练', masteryLevel: '基础维护', protagonistCurrentUsability: '可直接学习和实践。', limitations: '需要工具与训练时间。' } });
  assert.equal(ach.shouldRerollReward(chakra, { state: noEnergyState }, settings).reroll, true);
  assert.equal(ach.shouldRerollReward(chakra, { state: energyState }, settings).reroll, false);
  assert.equal(ach.shouldRerollReward(mundane, { state: noEnergyState }, settings).reroll, false);
  const rolls = [0, 0.75];
  const selected = ach.drawRewardCandidate([chakra, mundane], { state: noEnergyState }, { settings, rng: () => rolls.shift() ?? 0.75, maxAttempts: 3 });
  assert.equal(selected.candidate.id, 'reward-mundane');
  assert.equal(selected.attempts[0].reroll, true);
  assert.equal(selected.attempts[1].reroll, false);
}

function testInstantCandidate() {
  const state = { worldExposure: { currentWorld: { name: '能量世界', hasEnergySystem: true }, experiencedWorlds: [] } };
  const candidate = ach.makeInstantCandidate(reward({ id: 'reward-example-instant' }), { achievementId: 'ach-x', achievementTier: 'major', currentWorldRating: 'N3 房屋级' });
  assert.equal(candidate.generationMode, 'instantGeneratedCandidate');
  assert.equal(candidate.rewardContentIndependentFromAchievement, true);
  assert.equal(ach.validateInstantCandidate(candidate, state), true);
  const pending = ach.candidateToPendingClaim({ id: 'ach-x' }, candidate, state);
  assert.equal(pending.state, 'pendingClaim');
}

testSettings();
testRatings();
testRd100();
testDedupeAndClaim();
testValidation();
testEnergyGate();
testInstantCandidate();
console.log('rp-achievements tests passed');
