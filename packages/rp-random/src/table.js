const fs = require('node:fs');
const { createInstantRng, randomInt } = require('./seed');

function loadTable(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function entryLabel(entry) {
  return entry.text || entry.result || entry.label || entry.id || JSON.stringify(entry);
}

function rollD100Table(table, rng) {
  const roll = randomInt(rng, 1, 100);
  const selected = (table.entries || []).find(entry => {
    const range = entry.range || entry.roll || entry.d100;
    if (!Array.isArray(range) || range.length !== 2) return false;
    return roll >= Number(range[0]) && roll <= Number(range[1]);
  });
  if (!selected) throw new Error(`No d100 table entry matched roll ${roll}`);
  return { roll, selected };
}

function rollWeightedTable(table, rng) {
  const entries = table.entries || [];
  const weights = entries.map(entry => Math.max(0, Number(entry.weight ?? 1)));
  const total = weights.reduce((sum, x) => sum + x, 0);
  if (total <= 0) throw new Error('Weighted table has no positive weights');
  let cursor = rng() * total;
  for (let i = 0; i < entries.length; i++) {
    cursor -= weights[i];
    if (cursor < 0) return { roll: null, selected: entries[i], weight: weights[i], totalWeight: total };
  }
  return { roll: null, selected: entries[entries.length - 1], weight: weights[weights.length - 1], totalWeight: total };
}

function rollTable(table, options = {}, runtime = {}) {
  const created = runtime.rng ? null : createInstantRng(options.now);
  const rng = runtime.rng || created.rng;
  const seedInfo = runtime.seedInfo || created.seedInfo;
  const mode = table.type === 'd100' || table.roll === 'd100' || (table.entries || []).some(e => e.range || e.d100) ? 'd100' : 'weighted';
  const rolled = mode === 'd100' ? rollD100Table(table, rng) : rollWeightedTable(table, rng);
  return {
    kind: 'table', tableId: table.id || null, tableName: table.name || null,
    mode, seed: seedInfo, roll: rolled.roll, selected: rolled.selected,
    selectedText: entryLabel(rolled.selected), weight: rolled.weight, totalWeight: rolled.totalWeight,
  };
}

module.exports = { loadTable, rollTable };
