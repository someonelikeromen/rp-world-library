const fs = require('node:fs');
const path = require('node:path');

function projectRoot() {
  return path.resolve(__dirname, '../../..');
}

function loadExchangeSettings(file = path.join(projectRoot(), 'data/rp-exchange/settings.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = { projectRoot, loadExchangeSettings };
