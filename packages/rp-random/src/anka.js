const { rollTable } = require('./table');

function rollAnka(table, options = {}, runtime = {}) {
  const result = rollTable(table, options, runtime);
  return {
    ...result,
    kind: 'anka',
    legalityReminder: '安科结果仍需通过角色内生推演、感知、能力、动机、OOC 与世界规则检查。',
  };
}

module.exports = { rollAnka };
