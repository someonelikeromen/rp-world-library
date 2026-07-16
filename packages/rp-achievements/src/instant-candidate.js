const { validateReward } = require('./validate');
const { assertNotDuplicateReward } = require('./dedupe');
const { loadAchievementSettings, shouldRerollReward, drawRewardCandidate } = require('./settings');

function makeInstantCandidate(input = {}, context = {}) {
  const settings = context.settings || loadAchievementSettings(context);
  const candidate = {
    schema: 'rp-achievement-instant-reward-candidate-v1',
    settingsVersion: settings.version,
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

function validateInstantCandidate(candidate, state = {}, options = {}) {
  const settings = options.settings || loadAchievementSettings(options);
  if (candidate.generationMode !== 'instantGeneratedCandidate') throw new Error('Candidate must use instantGeneratedCandidate mode');
  if (candidate.rewardContentIndependentFromAchievement !== true) throw new Error('Candidate must declare rewardContentIndependentFromAchievement=true');
  const gate = shouldRerollReward(candidate, { ...(options.context || {}), state }, settings);
  if (gate.reroll) throw new Error(`Candidate ${candidate.id || candidate.name} must be rerolled by achievement energy-gate`);
  validateReward(candidate, { state, settings, context: options.context || {} });
  assertNotDuplicateReward(candidate, state);
  return true;
}

function candidateToPendingClaim(achievement, candidate, state = {}, options = {}) {
  validateInstantCandidate(candidate, state, options);
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

function selectInstantCandidate(candidates, state = {}, options = {}) {
  const selected = drawRewardCandidate(candidates, { ...(options.context || {}), state }, options);
  validateInstantCandidate(selected.candidate, state, options);
  return selected;
}

module.exports = { makeInstantCandidate, validateInstantCandidate, candidateToPendingClaim, selectInstantCandidate };
