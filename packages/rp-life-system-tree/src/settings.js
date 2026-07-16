const fs = require('node:fs');
const path = require('node:path');

function projectRoot() {
  return path.resolve(__dirname, '../../..');
}

function loadLifeTreeSettings(file = path.join(projectRoot(), 'data/rp-life-system-tree/settings.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadExchangeSettings(file = path.join(projectRoot(), 'data/rp-exchange/settings.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadGlobalGraph(file = path.join(projectRoot(), 'data/rp-life-system-tree/global-graph.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = { projectRoot, loadLifeTreeSettings, loadExchangeSettings, loadGlobalGraph };
