const { validateReward } = require('./validate');
const { assertNotDuplicateReward } = require('./dedupe');

function makeInstantCandidate(input = {}, context = {}) {
  const candidate = {
    schema: 'rp-achievement-instant-reward-candidate-v1',
    generationMode: 'instantGeneratedCandidate',
    achievementId: context.achievementId || null,
    achievementTier: context.achievementTier || null,
    currentWorldRating: context.currentWorldRating || null,
    currentWorldTopRating: context.currentWorldTopRating || null,
    rewardContentIndependentFromAchievement: true,
    ...input,
  };
  if (!candidate.id) throw new Error('Instant candidate requires id');
  if (!candidate.name) throw new Error('Instant candidate requires name');
  return candidate;
}

function validateInstantCandidate(candidate, state = {}) {
  if (candidate.generationMode !== 'instantGeneratedCandidate') throw new Error('Candidate must use instantGeneratedCandidate mode');
  if (candidate.rewardContentIndependentFromAchievement !== true) throw new Error('Candidate must declare rewardContentIndependentFromAchievement=true');
  validateReward(candidate);
  assertNotDuplicateReward(candidate, state);
  return true;
}

function candidateToPendingClaim(achievement, candidate, state = {}) {
  validateInstantCandidate(candidate, state);
  return {
    achievementId: achievement.id,
    rewardId: candidate.id,
    name: candidate.name,
    state: 'pendingClaim',
    createdAt: achievement.unlockedAt || null,
    generationMode: 'instantGeneratedCandidate',
    rewardContentIndependentFromAchievement: true,
    reward: candidate,
  };
}

module.exports = { makeInstantCandidate, validateInstantCandidate, candidateToPendingClaim };
