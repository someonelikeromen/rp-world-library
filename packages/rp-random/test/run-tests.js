const assert = require('node:assert/strict');
const { rollPool, contestPool, rollTable, prepareAnkage, makeInstantSeed } = require('../src');

function rngFromD10(values) {
  const queue = values.slice();
  return () => {
    if (queue.length === 0) throw new Error('rng queue exhausted');
    return (queue.shift() - 1) / 10;
  };
}
function rngFromPercent(values) {
  const queue = values.slice();
  return () => {
    if (queue.length === 0) throw new Error('rng queue exhausted');
    return (queue.shift() - 1) / 100;
  };
}
const seedInfo = { seedTime: '2026-07-08T00:00:00Z', seedHash: 'test', replayable: false, salt: 'internal-hidden' };

{
  const r = rollPool({ pool: 3, dc: 2 }, { rng: rngFromD10([8, 7, 10, 8]), seedInfo });
  assert.equal(r.successes, 3); assert.equal(r.outcome, 'success'); assert.equal(r.rolls.length, 4); assert.equal(r.rolls[2].triggersAgain, true);
}
{
  const r = rollPool({ pool: 3, dc: 2 }, { rng: rngFromD10([8, 2, 3]), seedInfo });
  assert.equal(r.successes, 1); assert.equal(r.outcome, 'failure');
}
{
  const r = rollPool({ pool: 3, dc: 1 }, { rng: rngFromD10([1, 2, 7]), seedInfo });
  assert.equal(r.successes, 0); assert.equal(r.outcome, 'bigFailure');
}
{
  const r = rollPool({ pool: 1, dc: 2, again: 8 }, { rng: rngFromD10([8, 9, 7]), seedInfo });
  assert.equal(r.successes, 2); assert.equal(r.outcome, 'success'); assert.equal(r.rolls.length, 3);
}
{
  const r = contestPool({ actor: { pool: 2 }, opponent: { pool: 2 } }, { rng: rngFromD10([8, 7, 9, 2]), seedInfo });
  assert.equal(r.actor.successes, 1); assert.equal(r.opponent.successes, 1); assert.equal(r.winner, 'tie');
}
{
  const table = { id: 't', type: 'd100', entries: [{ range: [1, 50], text: 'low' }, { range: [51, 100], text: 'high' }] };
  const r = rollTable(table, {}, { rng: rngFromPercent([50]), seedInfo });
  assert.equal(r.roll, 50); assert.equal(r.selectedText, 'low');
}
{
  const p = prepareAnkage(['A', { id: 'b', text: 'B', status: 'rejected' }, { id: 'c', text: 'C', status: 'highRisk' }]);
  assert.equal(p.total, 3); assert.equal(p.selectableCount, 2); assert.equal(p.rejected.length, 1);
}
{
  const s = makeInstantSeed(new Date('2026-07-08T12:34:56.789Z'));
  assert.equal(s.seedTime, '2026-07-08T12:34:56Z'); assert.equal(s.replayable, false); assert.equal(s.salt, 'internal-hidden'); assert.ok(!Object.prototype.hasOwnProperty.call(s, 'internalSalt'));
}
console.log('rp-random tests ok');
