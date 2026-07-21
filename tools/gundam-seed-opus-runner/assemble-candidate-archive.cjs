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
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { ensureDir(path.dirname(file)); fs.writeFileSync(file, text, 'utf8'); }
function listFiles(dir, suffix) {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d)) {
      const f = path.join(d, e);
      const st = fs.statSync(f);
      if (st.isDirectory()) walk(f);
      else if (f.endsWith(suffix)) out.push(f);
    }
  }
  walk(dir);
  return out.sort();
}
function rel(base, file) { return path.relative(base, file).replace(/\\/g, '/'); }
function stripForArchive(item) {
  return {
    id: item.entityId,
    name: item.name,
    aliases: item.aliases || [],
    kind: item.kind,
    domain: item.domain,
    continuityLayer: item.continuityLayer,
    scope: item.scope,
    sourceRefs: item.sourceRefs || [],
    sourceRecordRefs: item.sourceRecordRefs || [],
    summary: item.sourceBacked && item.sourceBacked.summary || '',
    specs: item.sourceBacked && item.sourceBacked.specs || {},
    structuredFields: item.sourceBacked && item.sourceBacked.structuredFields || {},
    claims: item.sourceBacked && item.sourceBacked.claims || [],
    interpretationNotes: item.interpretationNotes || [],
    imageEvidenceCount: item.coverage ? item.coverage.imageEvidenceCount : 0,
    coverage: item.coverage,
    fragmentRef: item.fragmentRef
  };
}
function md(report) {
  const lines = [];
  lines.push('# Gundam SEED Candidate Archive Report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Status: ${report.status}`);
  lines.push(`- Base SEED entities: ${report.counts.baseSeedEntities}`);
  lines.push(`- Extension candidate entities: ${report.counts.extensionCandidateEntities}`);
  lines.push(`- Source records: ${report.counts.sourceRecords}`);
  lines.push(`- Graph nodes: ${report.counts.graphNodes}`);
  lines.push(`- Graph edges: ${report.counts.graphEdges}`);
  lines.push('');
  lines.push('## Outputs');
  lines.push('');
  for (const [k, v] of Object.entries(report.outputs)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Domain Counts');
  lines.push('');
  lines.push('| Domain | Base | Extension |');
  lines.push('|---|---:|---:|');
  for (const row of report.domainCounts) lines.push(`| ${row.domain} | ${row.base} | ${row.extension} |`);
  lines.push('');
  lines.push('## Deployment Guard');
  lines.push('');
  lines.push('- This candidate archive is not deployed and not deployable yet.');
  lines.push('- Use it as the input to domain-specific audit/fix and final curation.');
  lines.push('- Extension candidates are preserved separately from base SEED.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const generatedAt = new Date().toISOString();
  const normalizedFiles = listFiles(path.join(planDir, 'normalized'), '.json');
  const normalized = normalizedFiles.map(f => ({ ...readJson(f), __file: rel(planDir, f) })).filter(x => x && x.entityId);
  const base = normalized.filter(x => x.normalizedLayer === 'base-seed');
  const ext = normalized.filter(x => x.normalizedLayer === 'extension-candidates');
  const sourceFiles = listFiles(path.join(planDir, 'sources', 'opus'), '.source.json');
  const sourceRecords = sourceFiles.map(f => ({ ...readJson(f), __file: rel(planDir, f) })).filter(Boolean);
  const candidateRoot = path.join(planDir, 'candidates', 'base-seed-normalized');
  const extensionRoot = path.join(planDir, 'candidates', 'extension-candidates');
  ensureDir(candidateRoot);
  ensureDir(extensionRoot);
  const domains = [...new Set(normalized.map(x => x.domain))].sort();
  const domainCounts = [];
  for (const domain of domains) {
    const baseItems = base.filter(x => x.domain === domain).map(stripForArchive);
    const extItems = ext.filter(x => x.domain === domain).map(stripForArchive);
    if (baseItems.length) writeJson(path.join(candidateRoot, `${domain}.json`), { schema: 'gundam-seed-candidate-domain-v1', generatedAt, deployable: false, domain, items: baseItems });
    if (extItems.length) writeJson(path.join(extensionRoot, `${domain}.json`), { schema: 'gundam-seed-extension-candidate-domain-v1', generatedAt, deployable: false, domain, items: extItems });
    domainCounts.push({ domain, base: baseItems.length, extension: extItems.length });
  }
  const sourceMap = {
    schema: 'gundam-seed-candidate-source-map-v1',
    generatedAt,
    sourceCount: sourceRecords.length,
    sources: sourceRecords.map(s => ({ sourceId: s.sourceId, opusId: s.opusId, title: s.title, category: s.category, continuityLayer: s.continuityLayer, sourceRef: s.sourceRef, sourceFile: s.__file }))
  };
  writeJson(path.join(candidateRoot, 'source-map.json'), sourceMap);
  const world = {
    schema: 'gundam-seed-candidate-world-v1',
    worldId: 'gundam-seed-base-candidate',
    name: '机动战士高达 SEED（候选归档层）',
    status: 'candidate-not-deployable',
    generatedAt,
    sourceLayer: 'bilibili-opus-102672286 + current worldbook as seed only',
    continuityPolicy: 'base SEED only; extension candidates stored separately',
    deployBlockers: [
      'domain-specific audit/fix not complete',
      'extendedGate still partial at packet level',
      'final curated schema validation not run',
      'world_query validation not run'
    ],
    files: Object.fromEntries(domainCounts.filter(d => d.base > 0).map(d => [d.domain, `${d.domain}.json`])),
    sourceMap: 'source-map.json'
  };
  writeJson(path.join(candidateRoot, 'world.json'), world);
  const nodes = [];
  const edges = [];
  for (const item of normalized) {
    nodes.push({ id: item.entityId, label: item.name, type: item.domain, layer: item.normalizedLayer });
    for (const ref of item.sourceRefs || []) {
      const sid = `source:${String(ref).replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 120)}`;
      nodes.push({ id: sid, label: ref, type: 'source' });
      edges.push({ from: item.entityId, to: sid, type: 'SOURCE_REF' });
    }
  }
  const uniqNodes = Object.values(Object.fromEntries(nodes.map(n => [n.id, n])));
  const graph = { schema: 'gundam-seed-normalized-candidate-graph-v1', generatedAt, nodeCount: uniqNodes.length, edgeCount: edges.length, nodes: uniqNodes, edges };
  writeJson(path.join(candidateRoot, 'graph.json'), graph);
  const report = {
    schema: 'gundam-seed-candidate-archive-report-v1',
    generatedAt,
    status: 'assembled-not-deployable',
    counts: {
      baseSeedEntities: base.length,
      extensionCandidateEntities: ext.length,
      sourceRecords: sourceRecords.length,
      graphNodes: graph.nodeCount,
      graphEdges: graph.edgeCount
    },
    domainCounts,
    outputs: {
      candidateRoot: rel(planDir, candidateRoot),
      extensionRoot: rel(planDir, extensionRoot),
      world: rel(planDir, path.join(candidateRoot, 'world.json')),
      sourceMap: rel(planDir, path.join(candidateRoot, 'source-map.json')),
      graph: rel(planDir, path.join(candidateRoot, 'graph.json'))
    }
  };
  writeJson(path.join(planDir, 'reports', 'candidate-archive-report.json'), report);
  writeText(path.join(planDir, 'reports', 'candidate-archive-report.md'), md(report));
  console.log(JSON.stringify({ ok: true, report: path.join(planDir, 'reports', 'candidate-archive-report.json'), counts: report.counts }, null, 2));
}
main();
