#!/usr/bin/env node
const fs = require('node:fs');
const {
  rollPool,
  contestPool,
  loadTable,
  rollTable,
  rollAnka,
  prepareAnkage,
  formatResult,
} = require('../src');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else { args[key] = next; i += 1; }
  }
  return args;
}

function numberArg(args, key, fallback) {
  if (args[key] === undefined) return fallback;
  const n = Number(args[key]);
  if (!Number.isFinite(n)) throw new Error(`--${key} must be numeric`);
  return n;
}

function print(result, json) {
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.log(formatResult(result));
}

function help() {
  console.log(`rp-random commands\n\n  pool --pool N --dc N [--again 10|9|8|none] [--label TEXT] [--json]\n  contest --actor-pool N --opponent-pool N [--json]\n  table path/to/table.json [--json]\n  anka path/to/table.json [--json]\n  ankage path/to/candidates.json [--include-irreversible] [--json]\n`);
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const json = !!args.json;
  if (!command || command === 'help' || command === '--help') return help();

  if (command === 'pool') {
    const again = args.again === 'none' ? 'none' : numberArg(args, 'again', 10);
    return print(rollPool({
      pool: numberArg(args, 'pool', undefined),
      dc: numberArg(args, 'dc', numberArg(args, 'difficulty', 1)),
      again,
      label: args.label,
    }), json);
  }

  if (command === 'contest') {
    return print(contestPool({
      actor: { pool: numberArg(args, 'actor-pool', undefined), label: args['actor-label'] || 'actor' },
      opponent: { pool: numberArg(args, 'opponent-pool', undefined), label: args['opponent-label'] || 'opponent' },
    }), json);
  }

  if (command === 'table' || command === 'anka') {
    const path = args._[0];
    if (!path) throw new Error(`${command} requires a table JSON path`);
    const table = loadTable(path);
    return print(command === 'anka' ? rollAnka(table) : rollTable(table), json);
  }

  if (command === 'ankage') {
    const path = args._[0];
    if (!path) throw new Error('ankage requires a candidates JSON path');
    const candidates = JSON.parse(fs.readFileSync(path, 'utf8'));
    return print(prepareAnkage(Array.isArray(candidates) ? candidates : candidates.candidates || [], { includeIrreversible: !!args['include-irreversible'] }), json);
  }

  throw new Error(`Unknown command: ${command}`);
}

try { main(); }
catch (err) { console.error(err && err.stack ? err.stack : String(err)); process.exit(1); }
