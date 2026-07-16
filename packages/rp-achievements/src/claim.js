const { assertNotDuplicateReward } = require('./dedupe');
const { validateReward } = require('./validate');

function createPendingClaim(achievement, reward, state = {}, options = {}) {
  validateReward(reward, { ...options, state });
  assertNotDuplicateReward(reward, state);
  return {
    achievementId: achievement.id,
    rewardId: reward.id,
    name: reward.name,
    state: 'pendingClaim',
    createdAt: achievement.unlockedAt || null,
    reward,
  };
}

function claimReward(pendingClaim, options = {}) {
  if (!pendingClaim || pendingClaim.state !== 'pendingClaim') throw new Error('Reward is not pendingClaim');
  const reward = pendingClaim.reward || pendingClaim;
  return {
    ...pendingClaim,
    state: 'claimed',
    claimedAt: options.claimedAt || null,
    reward: {
      ...reward,
      state: options.nextState || reward.nextStateAfterClaim || 'adaptationRequired',
      minimumUseGrantApplied: Boolean(reward.minimumUseGrant),
    },
  };
}

module.exports = { createPendingClaim, claimReward };
