#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) { out[key] = next; i++; }
        else out[key] = true;
      }
    } else out._.push(a);
  }
  return out;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { ensureDir(path.dirname(file)); fs.writeFileSync(file, text, 'utf8'); }
function markdown(plan, outDir) {
  const lines = [];
  lines.push('# Gundam SEED Work Packets v2');
  lines.push('');
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Source plan: ${plan.schema}`);
  lines.push(`- Output dir: ${outDir}`);
  lines.push('');
  lines.push('| Wave | Packet | Stage | Scope | Expected | Path |');
  lines.push('|---|---|---|---|---:|---|');
  for (const p of plan.workPackets) {
    lines.push(`| ${p.waveId} | ${p.packetId} | ${p.stage} | ${p.scope} | ${p.expectedCount} | ${outDir}/${p.waveId}-${p.packetId}.json |`);
  }
  lines.push('');
  lines.push('## Execution Rule');
  lines.push('');
  lines.push('- These v2 packets supersede the older broad work-packets for the next extraction pass.');
  lines.push('- They are generated from source inventory, not manually assigned by stale counts.');
  lines.push('- Extension candidate packets preserve material but must not merge into base SEED core.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const plan = readJson(path.join(planDir, 'reorganized-wave-plan.json'));
  const outDir = path.join(planDir, args.outDir || 'work-packets-v2');
  ensureDir(outDir);
  const index = {
    schema: 'gundam-seed-work-packets-v2-index',
    generatedAt: new Date().toISOString(),
    sourcePlanRef: 'reorganized-wave-plan.json',
    packets: []
  };
  for (const p of plan.workPackets || []) {
    const file = path.join(outDir, `${p.waveId}-${p.packetId}.json`);
    const packet = {
      schema: 'gundam-seed-work-packet-v2',
      generatedAt: index.generatedAt,
      ...p,
      loop: {
        sequence: ['Generator', 'Auditor', 'Fixer', 'Auditor rerun'],
        until: { status: 'passed', openIssues: 0, blockedIssues: 0, canAdvance: true },
        automatedToolPath: 'tools/gundam-seed-opus-runner/extract-source-backed.cjs'
      },
      gates: {
        minimumGate: 'required-for-wave-merge',
        extendedGate: 'required-for-final-deploy'
      }
    };
    writeJson(file, packet);
    index.packets.push({ waveId: p.waveId, packetId: p.packetId, path: path.relative(planDir, file).replace(/\\/g, '/'), expectedCount: p.expectedCount, scope: p.scope });
  }
  writeJson(path.join(outDir, 'INDEX.json'), index);
  writeText(path.join(outDir, 'README.md'), markdown(plan, path.relative(planDir, outDir).replace(/\\/g, '/')));
  console.log(JSON.stringify({ ok: true, outDir, packets: index.packets.length }, null, 2));
}
main();
