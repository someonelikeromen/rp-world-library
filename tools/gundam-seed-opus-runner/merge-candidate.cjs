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
function domainForKind(kind) {
  return {
    'mobile-suit': 'mobile-suits',
    character: 'characters',
    warship: 'warships',
    event: 'events',
    rule: 'rules',
    interpretation: 'interpretations',
    'source-excerpt': 'source-excerpts'
  }[kind] || 'source-excerpts';
}
function mergeFragments(fragments, scope) {
  return fragments.map(f => ({
    entityId: f.entityId,
    kind: f.kind,
    name: f.name,
    title: f.title,
    category: f.category,
    continuityLayer: f.continuityLayer,
    scope: f.scope,
    mergeScope: scope,
    sourceRefs: f.sourceRefs || [],
    sourceRecordRefs: f.sourceRecordRefs || [],
    summaryCandidate: f.summaryCandidate || '',
    structuredFields: f.structuredFields || {},
    claimCount: Array.isArray(f.claims) ? f.claims.length : 0,
    sectionCount: Array.isArray(f.sections) ? f.sections.length : 0,
    imageEvidenceCount: Array.isArray(f.imageEvidence) ? f.imageEvidence.length : 0,
    gates: f.gates,
    sourceBackedStatus: f.canonStatus || 'source-backed-claim-candidate',
    fragmentRef: f.__file
  }));
}
function markdownReport(report) {
  const lines = [];
  lines.push('# Gundam SEED Merge Candidate Report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Fragments: ${report.counts.fragments}`);
  lines.push(`- Sources: ${report.counts.sources}`);
  lines.push(`- Base seed candidate entities: ${report.counts.baseSeedCandidateEntities}`);
  lines.push(`- Extension candidate entities: ${report.counts.extensionCandidateEntities}`);
  lines.push(`- Deploy status: ${report.deploy.status}`);
  lines.push('');
  lines.push('## By Domain');
  lines.push('');
  lines.push('| Domain | Base | Extension |');
  lines.push('|---|---:|---:|');
  for (const d of report.domains) lines.push(`| ${d.domain} | ${d.baseCount} | ${d.extensionCount} |`);
  lines.push('');
  lines.push('## Blockers');
  lines.push('');
  for (const b of report.deploy.blockers) lines.push(`- ${b}`);
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const generatedAt = new Date().toISOString();
  const fragmentFiles = listFiles(path.join(planDir, 'extracted'), '.fragment.json');
  const sourceFiles = listFiles(path.join(planDir, 'sources', 'opus'), '.source.json');
  const fragments = fragmentFiles.map(file => ({ ...readJson(file), __file: rel(planDir, file) })).filter(f => f && f.entityId);
  const byWave = new Map();
  const byDomain = new Map();
  for (const f of fragments) {
    const parts = f.__file.split('/');
    const wave = parts[1] || 'unknown-wave';
    const domain = domainForKind(f.kind);
    if (!byWave.has(wave)) byWave.set(wave, []);
    byWave.get(wave).push(f);
    if (!byDomain.has(domain)) byDomain.set(domain, []);
    byDomain.get(domain).push(f);
  }
  const waveReports = [];
  for (const [wave, arr] of [...byWave.entries()].sort()) {
    const out = {
      schema: 'wave-merged-index-v1',
      generatedAt,
      waveId: wave,
      fragmentCount: arr.length,
      domains: [...new Set(arr.map(f => domainForKind(f.kind)))].sort(),
      fragments: arr.map(f => ({ entityId: f.entityId, kind: f.kind, name: f.name, continuityLayer: f.continuityLayer, fragmentRef: f.__file, sourceRefs: f.sourceRefs || [] }))
    };
    writeJson(path.join(planDir, 'intermediate', 'wave-merged', wave, 'index.json'), out);
    waveReports.push({ waveId: wave, fragmentCount: arr.length, domains: out.domains });
  }
  const domains = [];
  const baseAll = [];
  const extensionAll = [];
  for (const [domain, arr] of [...byDomain.entries()].sort()) {
    const base = arr.filter(f => f.continuityLayer === 'base-seed' && f.scope === 'seed_core');
    const ext = arr.filter(f => !(f.continuityLayer === 'base-seed' && f.scope === 'seed_core'));
    const group = {
      schema: 'group-merged-index-v1',
      generatedAt,
      domain,
      baseCount: base.length,
      extensionCount: ext.length,
      baseSeedCandidates: mergeFragments(base, 'base-seed'),
      extensionCandidates: mergeFragments(ext, 'extension-candidate')
    };
    writeJson(path.join(planDir, 'group-merged', domain, 'index.json'), group);
    writeJson(path.join(planDir, 'merged', 'final-candidate', domain + '.json'), {
      schema: 'final-candidate-domain-v1',
      generatedAt,
      domain,
      deployable: false,
      deployBlocker: 'extendedGate partial; requires audit/fix before curated deploy',
      baseSeedCandidates: group.baseSeedCandidates,
      extensionCandidates: group.extensionCandidates
    });
    baseAll.push(...group.baseSeedCandidates);
    extensionAll.push(...group.extensionCandidates);
    domains.push({ domain, baseCount: base.length, extensionCount: ext.length });
  }
  const nodes = [];
  const edges = [];
  for (const f of fragments) {
    nodes.push({ id: f.entityId, type: f.kind, label: f.name, continuityLayer: f.continuityLayer, scope: f.scope });
    for (const s of f.sourceRefs || []) {
      const sid = `source:${String(s).replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 120)}`;
      nodes.push({ id: sid, type: 'source', label: s });
      edges.push({ from: f.entityId, to: sid, type: 'SOURCE_REF' });
    }
  }
  const uniqNodes = Object.values(Object.fromEntries(nodes.map(n => [n.id, n])));
  const graph = { schema: 'gundam-seed-candidate-graph-v1', generatedAt, nodeCount: uniqNodes.length, edgeCount: edges.length, nodes: uniqNodes, edges };
  writeJson(path.join(planDir, 'graph', 'candidate-graph.json'), graph);
  const deploy = {
    schema: 'candidate-deploy-review-v1',
    generatedAt,
    status: 'blocked',
    target: 'campaigns/world-library/worlds/gundam-seed/curated/',
    blockers: [
      'extendedGate is partial for all extraction packets',
      'domain-specific audit/fix has not run',
      'formal merge conflict review has not run',
      'world_query deployment validation has not run'
    ],
    recommendation: 'Continue with domain audit/fix before any curated deployment.'
  };
  writeJson(path.join(planDir, 'reports', 'candidate-deploy-review.json'), deploy);
  const report = {
    schema: 'gundam-seed-merge-candidate-report-v1',
    generatedAt,
    counts: {
      fragments: fragments.length,
      sources: sourceFiles.length,
      baseSeedCandidateEntities: baseAll.length,
      extensionCandidateEntities: extensionAll.length,
      graphNodes: graph.nodeCount,
      graphEdges: graph.edgeCount
    },
    waveReports,
    domains,
    outputs: {
      waveMergedRoot: 'intermediate/wave-merged/',
      groupMergedRoot: 'group-merged/',
      finalCandidateRoot: 'merged/final-candidate/',
      graph: 'graph/candidate-graph.json',
      deployReview: 'reports/candidate-deploy-review.json'
    },
    deploy
  };
  writeJson(path.join(planDir, 'reports', 'merge-candidate-report.json'), report);
  writeText(path.join(planDir, 'reports', 'merge-candidate-report.md'), markdownReport(report));
  console.log(JSON.stringify({ ok: true, report: path.join(planDir, 'reports', 'merge-candidate-report.json'), counts: report.counts }, null, 2));
}
main();
