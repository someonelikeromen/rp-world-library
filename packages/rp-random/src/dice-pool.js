const { createInstantRng, randomInt } = require('./seed');

function asInteger(value, name, fallback) {
  const raw = value === undefined || value === null || value === '' ? fallback : value;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error(`${name} must be an integer`);
  return n;
}

function normalizeModifiers(modifiers) {
  if (!modifiers) return { total: 0, entries: [] };
  const entries = Array.isArray(modifiers) ? modifiers : [modifiers];
  const normalized = entries.map((entry, index) => {
    if (typeof entry === 'number') return { label: `modifier_${index + 1}`, value: entry };
    if (entry && typeof entry === 'object') {
      const value = asInteger(entry.value, `modifiers[${index}].value`, 0);
      return { label: entry.label || `modifier_${index + 1}`, value };
    }
    throw new Error(`Invalid modifier at index ${index}`);
  });
  return { total: normalized.reduce((sum, x) => sum + x.value, 0), entries: normalized };
}

function normalizeAgain(again) {
  if (again === false || again === null || again === 'none') return null;
  const n = asInteger(again, 'again', 10);
  if (n < 8 || n > 10) throw new Error('again must be 8, 9, 10, or none; minimum enhanced again is 8');
  return n;
}

function evaluateOutcome(successes, dc) {
  if (successes >= dc) return { outcome: 'success', label: '成功', margin: successes - dc };
  if (successes === 0) return { outcome: 'bigFailure', label: '大失败', margin: successes - dc };
  return { outcome: 'failure', label: '失败', margin: successes - dc };
}

function rollPool(options = {}, runtime = {}) {
  const created = runtime.rng ? null : createInstantRng(options.now);
  const rng = runtime.rng || options.rng || created.rng;
  const seedInfo = runtime.seedInfo || options.seedInfo || created.seedInfo;

  const basePool = asInteger(options.pool ?? options.basePool, 'pool', 0);
  const modifierInfo = normalizeModifiers(options.modifiers);
  const pool = Math.max(0, basePool + modifierInfo.total);
  const dc = Math.max(1, asInteger(options.dc ?? options.difficulty, 'dc', 1));
  const targetNumber = asInteger(options.targetNumber, 'targetNumber', 8);
  if (targetNumber !== 8) throw new Error('Current project default requires targetNumber = 8');
  const again = normalizeAgain(options.again === undefined ? 10 : options.again);
  const maxRolls = Math.max(pool, asInteger(options.maxRolls, 'maxRolls', 1000));

  const rolls = [];
  let successes = 0;

  function rollOne(kind, parentIndex) {
    if (rolls.length >= maxRolls) throw new Error(`Exceeded maxRolls=${maxRolls}; possible runaway exploding dice`);
    const value = randomInt(rng, 1, 10);
    const success = value >= targetNumber;
    const triggersAgain = again !== null && value >= again;
    const index = rolls.length;
    rolls.push({ index, kind, parentIndex: parentIndex ?? null, value, success, triggersAgain });
    if (success) successes += 1;
    if (triggersAgain) rollOne('again', index);
  }

  for (let i = 0; i < pool; i++) rollOne('initial', null);

  const ranked = evaluateOutcome(successes, dc);
  return {
    kind: 'pool',
    label: options.label || null,
    seed: seedInfo,
    config: {
      basePool,
      modifiers: modifierInfo.entries,
      modifierTotal: modifierInfo.total,
      pool,
      dc,
      targetNumber,
      again,
      ones: 'ignore',
      showDetails: options.showDetails !== false,
    },
    rolls,
    successes,
    dc,
    margin: ranked.margin,
    outcome: ranked.outcome,
    outcomeLabel: ranked.label,
  };
}

function contestPool(options = {}, runtime = {}) {
  if (!options.actor || !options.opponent) throw new Error('contestPool requires actor and opponent');
  const created = runtime.rng ? null : createInstantRng(options.now);
  const sharedRuntime = { rng: runtime.rng || created.rng, seedInfo: runtime.seedInfo || created.seedInfo };
  const actor = rollPool({ ...options.actor, dc: options.actor.dc || 1, label: options.actor.label || 'actor' }, sharedRuntime);
  const opponent = rollPool({ ...options.opponent, dc: options.opponent.dc || 1, label: options.opponent.label || 'opponent' }, sharedRuntime);
  const margin = actor.successes - opponent.successes;
  const winner = margin > 0 ? 'actor' : margin < 0 ? 'opponent' : 'tie';
  return {
    kind: 'contest',
    seed: sharedRuntime.seedInfo,
    actor,
    opponent,
    winner,
    margin,
    outcomeLabel: winner === 'tie' ? '平局' : winner === 'actor' ? '行动方胜' : '对抗方胜',
  };
}

module.exports = {
  rollPool,
  contestPool,
  evaluateOutcome,
};
