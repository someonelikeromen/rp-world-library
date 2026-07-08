function normalizeId(value) {
  return String(value || '').trim().toLowerCase();
}

function collectRewardIds(state = {}) {
  const ids = new Set();
  const add = value => { const id = normalizeId(value); if (id) ids.add(id); };
  for (const key of ['ownedRewardIds', 'claimedRewardIds', 'pendingRewardIds']) {
    for (const id of state[key] || []) add(id);
  }
  for (const achievement of state.achievements || []) {
    for (const reward of achievement.rewards || []) add(reward.id || reward.name);
  }
  for (const reward of state.pendingClaims || []) add(reward.id || reward.name);
  return ids;
}

function isDuplicateReward(reward, state = {}) {
  const ids = collectRewardIds(state);
  return ids.has(normalizeId(reward.id || reward.name));
}

function assertNotDuplicateReward(reward, state = {}) {
  if (isDuplicateReward(reward, state)) throw new Error(`Duplicate reward: ${reward.id || reward.name}`);
  return true;
}

module.exports = { normalizeId, collectRewardIds, isDuplicateReward, assertNotDuplicateReward };
