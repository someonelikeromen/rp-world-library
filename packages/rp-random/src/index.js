const seed = require('./seed');
const dicePool = require('./dice-pool');
const table = require('./table');
const anka = require('./anka');
const ankage = require('./ankage');
const format = require('./format');

module.exports = {
  ...seed,
  ...dicePool,
  ...table,
  ...anka,
  ...ankage,
  ...format,
};
