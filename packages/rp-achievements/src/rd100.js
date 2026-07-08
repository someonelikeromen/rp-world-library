function repeatSlots(world, count) {
  return Array.from({ length: count }, () => ({ ...world }));
}

function shuffleInPlace(items, rng = Math.random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function defaultMatchesWorldRating(world) {
  return world && world.ratingMismatch !== true;
}

function buildWorldRd100(options = {}) {
  const rng = options.rng || Math.random;
  const matchesWorldRating = options.matchesWorldRating || defaultMatchesWorldRating;
  const archived = (options.archivedWorlds || []).filter(matchesWorldRating);
  const unarchived = (options.unarchivedWorlds || []).filter(matchesWorldRating);
  const rejected = [...(options.archivedWorlds || []), ...(options.unarchivedWorlds || [])].filter(w => !matchesWorldRating(w));
  let candidates = [];
  for (const world of archived) candidates.push(...repeatSlots({ source: 'archivedWorld', requiresWebVerification: false, ...world }, 3));
  for (const world of unarchived) candidates.push(...repeatSlots({ source: 'unarchivedWorld', requiresWebVerification: true, ...world }, 2));
  if (candidates.length > 100) {
    shuffleInPlace(candidates, rng);
    candidates = candidates.slice(0, 100);
  }
  while (candidates.length < 100) {
    candidates.push({ source: 'randomAnimeGameWorld', world: null, requiresWebVerification: true });
  }
  shuffleInPlace(candidates, rng);
  const slots = candidates.map((entry, idx) => ({ roll: idx + 1, ...entry }));
  return {
    type: '.rd100',
    currentWorldRating: options.currentWorldRating || null,
    currentWorldTopRating: options.currentWorldTopRating || null,
    slots,
    shuffle: true,
    rejectedForRating: rejected,
  };
}

function selectRd100Slot(table, roll) {
  const selected = (table.slots || []).find(slot => Number(slot.roll) === Number(roll));
  if (!selected) throw new Error(`No .rd100 slot for roll ${roll}`);
  return selected;
}

module.exports = { buildWorldRd100, selectRd100Slot };
