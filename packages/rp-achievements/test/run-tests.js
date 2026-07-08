const assert = require('node:assert');
const ach = require('../src');

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
  assert.equal(table.slots.filter(s => s.slug === 'naruto').length, 3);
  assert.equal(table.slots.filter(s => s.slug === 'rurouni-kenshin').length, 2);
  assert.equal(table.slots.filter(s => s.source === 'randomAnimeGameWorld').length, 95);
  assert.ok(ach.selectRd100Slot(table, 1));
}

function testDedupeAndClaim() {
  const reward = {
    id: 'reward-naruto-substitution-jutsu-001',
    name: '火影世界 · 替身术',
    type: 'ability',
    canon: { required: true, sourceType: 'manga', work: '火影忍者', appearsAs: '替身术', evidence: '原著基础忍术' },
  };
  assert.equal(ach.isDuplicateReward(reward, { claimedRewardIds: [] }), false);
  assert.equal(ach.isDuplicateReward(reward, { claimedRewardIds: [reward.id] }), true);
  const pending = ach.createPendingClaim({ id: 'ach-1' }, reward, {});
  assert.equal(pending.state, 'pendingClaim');
  const claimed = ach.claimReward(pending);
  assert.equal(claimed.state, 'claimed');
}

function testValidation() {
  assert.throws(() => ach.validateReward({ id: 'bad', type: 'prop', canon: { required: true } }), /Invalid reward type/);
  assert.throws(() => ach.validateReward({ id: 'bad2', type: 'item', canon: { required: true, sourceType: 'manga', work: 'x', appearsAs: 'y', evidence: 'z' }, name: '系统道具' }), /Forbidden/);
  assert.throws(() => ach.validateReward({ id: 'bad3', type: 'item', canon: { required: true, sourceType: 'manga', work: 'x', appearsAs: 'y', evidence: 'z' }, verification: { reason: 'randomAnimeGameWorld', status: 'pending' } }), /webVerified/);
}

function testInstantCandidate() {
  const candidate = ach.makeInstantCandidate({
    id: 'reward-example-instant',
    name: '示例作品 · 示例奖励',
    type: 'ability',
    rewardRating: { rating: 'N2 墙壁级', score: 420 },
    canon: { required: true, sourceType: 'manga', work: '示例作品', appearsAs: '示例奖励', evidence: '示例原著依据' },
    targetModules: ['abilities'],
  }, { achievementId: 'ach-x', achievementTier: 'major', currentWorldRating: 'N3 房屋级' });
  assert.equal(candidate.generationMode, 'instantGeneratedCandidate');
  assert.equal(candidate.rewardContentIndependentFromAchievement, true);
  assert.equal(ach.validateInstantCandidate(candidate, {}), true);
  const pending = ach.candidateToPendingClaim({ id: 'ach-x' }, candidate, {});
  assert.equal(pending.state, 'pendingClaim');
}

testRatings();
testRd100();
testDedupeAndClaim();
testValidation();
testInstantCandidate();
console.log('rp-achievements tests passed');
