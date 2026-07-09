const fs = require('node:fs');
const path = require('node:path');

const SETTINGS_REL = path.join('data', 'rp-achievements', 'settings.json');

function findProjectRoot(cwd = process.cwd()) {
  let cur = path.resolve(cwd);
  while (true) {
    if (fs.existsSync(path.join(cur, SETTINGS_REL))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return path.resolve(cwd);
    cur = parent;
  }
}

function achievementSettingsPath(cwd = process.cwd()) {
  return path.join(findProjectRoot(cwd), SETTINGS_REL);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadAchievementSettings(options = {}) {
  const file = options.file || achievementSettingsPath(options.cwd || process.cwd());
  if (!fs.existsSync(file)) throw new Error(`Achievement system settings not found: ${file}`);
  const settings = readJson(file);
  validateAchievementSettings(settings);
  return settings;
}

function validateAchievementSettings(settings) {
  if (!settings || typeof settings !== 'object') throw new Error('Achievement settings must be an object');
  if (settings.schema !== 'rp-achievement-system-settings-v1') throw new Error(`Unsupported achievement settings schema: ${settings.schema}`);
  if (settings.loadPolicy?.required !== true) throw new Error('Achievement settings must declare loadPolicy.required=true');
  if (settings.rewardGeneration?.globalRandomPool !== true) throw new Error('Achievement reward generation must keep globalRandomPool=true');
  if (!settings.rewardGeneration?.energyGate?.enabled) throw new Error('Achievement reward generation must enable energyGate');
  if (!Array.isArray(settings.requiredRewardProvenance) || settings.requiredRewardProvenance.length === 0) throw new Error('Achievement settings missing requiredRewardProvenance');
  if (settings.ui?.theme !== 'translucent-cyan-sci-fi') throw new Error('Achievement UI theme must be translucent-cyan-sci-fi');
  return true;
}

function getPath(obj, dotPath) {
  return String(dotPath || '').split('.').filter(Boolean).reduce((cur, key) => (cur == null ? undefined : cur[key]), obj);
}

function normalizeToken(value) {
  if (typeof value === 'boolean') return value;
  if (value == null) return undefined;
  return String(value).trim().toLowerCase();
}

function tokenIn(list = [], value) {
  const token = normalizeToken(value);
  return list.some(item => normalizeToken(item) === token);
}

function energyValue(value, settings) {
  const gate = settings.rewardGeneration.energyGate;
  if (tokenIn(gate.energyValues, value)) return true;
  if (tokenIn(gate.noEnergyValues, value)) return false;
  return undefined;
}

function worldEnergyValue(world, settings) {
  if (!world || typeof world !== 'object') return undefined;
  for (const key of ['hasEnergySystem', 'energySystem', 'energyType', 'energyProfile', 'powerSystem']) {
    const value = key === 'energyProfile' && typeof world.energyProfile === 'object' ? (world.energyProfile.hasEnergySystem ?? world.energyProfile.type ?? world.energyProfile.name) : world[key];
    const parsed = energyValue(value, settings);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function collectExperiencedWorlds(context = {}, settings) {
  const state = context.state || context;
  const paths = settings.rewardGeneration.energyGate.experiencedWorldsPaths || [];
  const worlds = [];
  for (const p of paths) {
    const value = getPath(state, p);
    if (Array.isArray(value)) worlds.push(...value);
  }
  return worlds;
}

function evaluateEnergyExposure(context = {}, settings = loadAchievementSettings()) {
  const state = context.state || context;
  const gate = settings.rewardGeneration.energyGate;
  const values = [];
  const basis = [];
  for (const p of gate.exposureStatePaths || []) {
    const value = getPath(state, p);
    const parsed = energyValue(value, settings);
    if (parsed !== undefined) { values.push(parsed); basis.push({ path: p, value, hasEnergySystem: parsed }); }
  }
  const currentWorld = context.currentWorld || state.worldExposure?.currentWorld || state.currentWorld;
  const curParsed = worldEnergyValue(currentWorld, settings);
  if (curParsed !== undefined) { values.push(curParsed); basis.push({ path: 'currentWorld', value: currentWorld, hasEnergySystem: curParsed }); }
  for (const [idx, world] of collectExperiencedWorlds(context, settings).entries()) {
    const parsed = worldEnergyValue(world, settings);
    if (parsed !== undefined) { values.push(parsed); basis.push({ path: `experiencedWorlds[${idx}]`, value: world, hasEnergySystem: parsed }); }
  }
  const hasEnergySystem = values.includes(true);
  const allKnownNoEnergy = values.length > 0 && values.every(v => v === false);
  return {
    hasEnergySystem,
    allKnownNoEnergy,
    energyAllowed: hasEnergySystem || !allKnownNoEnergy,
    knownWorldCount: values.length,
    unknownExposure: values.length === 0,
    basis,
  };
}

function rewardText(reward) {
  return JSON.stringify({
    id: reward.id,
    name: reward.name,
    type: reward.type,
    energyClassification: reward.energyClassification,
    requiresEnergySystem: reward.requiresEnergySystem,
    canon: reward.canon,
    origin: reward.origin,
    minimumUseGrant: reward.minimumUseGrant,
  });
}

function classifyRewardEnergy(reward = {}, settings = loadAchievementSettings()) {
  const gate = settings.rewardGeneration.energyGate;
  if (reward.energyClassification?.requiresEnergySystem === true || reward.requiresEnergySystem === true) return { requiresEnergySystem: true, basis: ['explicit requiresEnergySystem'] };
  if (reward.energyClassification?.requiresEnergySystem === false || reward.requiresEnergySystem === false) return { requiresEnergySystem: false, basis: ['explicit non-energy reward'] };
  const typeRule = settings.rewardGeneration.rewardTypes?.[reward.type] || {};
  if (typeRule.defaultRequiresEnergySystem === true) return { requiresEnergySystem: true, basis: [`type ${reward.type} defaults to energy`] };
  const text = rewardText(reward).toLowerCase();
  const hits = (gate.energyRewardMarkers || []).filter(marker => text.includes(String(marker).toLowerCase()));
  return { requiresEnergySystem: hits.length > 0, basis: hits.map(hit => `marker:${hit}`) };
}

function shouldRerollReward(reward, context = {}, settings = loadAchievementSettings()) {
  const classification = classifyRewardEnergy(reward, settings);
  const exposure = evaluateEnergyExposure(context, settings);
  const reroll = settings.rewardGeneration.energyGate.rerollEnergyRewardsWhenNoEnergyExposure === true && classification.requiresEnergySystem && exposure.allKnownNoEnergy && !exposure.hasEnergySystem;
  return { reroll, classification, exposure };
}

function assertRewardAllowedByEnergyContext(reward, context = {}, settings = loadAchievementSettings()) {
  const decision = shouldRerollReward(reward, context, settings);
  if (decision.reroll) throw new Error(`Energy-gated reward must be rerolled because current and experienced worlds are all no-energy: ${reward.id || reward.name}`);
  return decision;
}

function drawRewardCandidate(candidates, context = {}, options = {}) {
  const settings = options.settings || loadAchievementSettings(options);
  if (!Array.isArray(candidates) || candidates.length === 0) throw new Error('drawRewardCandidate requires non-empty candidates');
  const rng = options.rng || Math.random;
  const maxAttempts = options.maxAttempts || Math.max(20, candidates.length * 3);
  const attempts = [];
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = candidates[Math.floor(rng() * candidates.length)];
    const decision = shouldRerollReward(candidate, context, settings);
    attempts.push({ id: candidate.id || candidate.name, reroll: decision.reroll, requiresEnergySystem: decision.classification.requiresEnergySystem });
    if (!decision.reroll) return { candidate, attempts, decision };
  }
  throw new Error('No reward candidate survived achievement energy-gate reroll rules');
}

function settingsPublicSummary(settings = loadAchievementSettings()) {
  return {
    schema: settings.schema,
    version: settings.version,
    uiTheme: settings.ui.theme,
    globalRandomPool: settings.rewardGeneration.globalRandomPool,
    energyGate: settings.rewardGeneration.energyGate.decision,
    requiredRewardProvenance: settings.requiredRewardProvenance,
  };
}

module.exports = {
  SETTINGS_REL,
  achievementSettingsPath,
  loadAchievementSettings,
  validateAchievementSettings,
  getPath,
  evaluateEnergyExposure,
  classifyRewardEnergy,
  shouldRerollReward,
  assertRewardAllowedByEnergyContext,
  drawRewardCandidate,
  settingsPublicSummary,
};
