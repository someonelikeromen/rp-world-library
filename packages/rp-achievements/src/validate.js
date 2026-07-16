const { loadAchievementSettings, getPath, assertRewardAllowedByEnergyContext } = require('./settings');

const VALID_REWARD_TYPES = new Set([
  'item',
  'constitution',
  'ability',
  'technique',
  'knowledge',
  'resourceSystem',
  'resistance',
  'summonOrContract',
]);

const FORBIDDEN_TERMS = [
  '系统道具',
  '一次性凭证',
  '世界通行证',
  '封印钥匙',
  '法则理解',
  '法则翻译器',
  '跨世界兼容槽',
  '世界适应补丁',
];

function validateCanon(reward) {
  if (!reward || typeof reward !== 'object') throw new Error('Reward must be an object');
  if (!reward.canon || reward.canon.required !== true) {
    throw new Error(`Reward ${reward.id || reward.name || ''} lacks required canon evidence`);
  }
  for (const key of ['sourceType', 'work', 'appearsAs', 'evidence']) {
    if (!reward.canon[key]) throw new Error(`Reward ${reward.id || reward.name || ''} missing canon.${key}`);
  }
  return true;
}

function validateRewardType(reward) {
  if (!VALID_REWARD_TYPES.has(reward.type)) throw new Error(`Invalid reward type: ${reward.type}`);
  return true;
}

function validateNoForbiddenConcepts(reward) {
  const text = JSON.stringify(reward);
  const hit = FORBIDDEN_TERMS.find(term => text.includes(term));
  if (hit) throw new Error(`Forbidden achievement reward concept: ${hit}`);
  return true;
}

function validateVerification(reward) {
  const reason = reward.verification && reward.verification.reason;
  if (reason === 'unarchivedWorld' || reason === 'randomAnimeGameWorld') {
    if (
      reward.verification.status !== 'webVerified' ||
      !reward.verification.verifiedWork ||
      !reward.verification.verifiedReward
    ) {
      throw new Error(`Reward ${reward.id || reward.name || ''} requires webVerified verification`);
    }
  }
  return true;
}

function validateRewardProvenance(reward, settings = loadAchievementSettings()) {
  const missing = [];
  for (const path of settings.requiredRewardProvenance || []) {
    const value = getPath(reward, path);
    if (value == null || value === '') missing.push(path);
  }
  if (missing.length) throw new Error(`Reward ${reward.id || reward.name || ''} missing required provenance: ${missing.join(', ')}`);
  return true;
}

function validateReward(reward, options = {}) {
  const settings = options.settings || loadAchievementSettings(options);
  validateRewardType(reward);
  validateCanon(reward);
  validateRewardProvenance(reward, settings);
  validateNoForbiddenConcepts(reward);
  validateVerification(reward);
  if (options.state || options.context) {
    assertRewardAllowedByEnergyContext(reward, { ...(options.context || {}), state: options.state || options.context?.state || {} }, settings);
  }
  return true;
}

module.exports = {
  VALID_REWARD_TYPES,
  FORBIDDEN_TERMS,
  validateCanon,
  validateRewardType,
  validateNoForbiddenConcepts,
  validateVerification,
  validateRewardProvenance,
  validateReward,
};
