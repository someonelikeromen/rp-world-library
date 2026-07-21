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
function safeFile(id) { return String(id).replace(/[\\/:*?"<>|]+/g, '-').slice(0, 160); }
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
function cleanName(name) {
  let n = String(name || '').replace(/^【飞燕惊澜】/, '').replace(/^高达SEED/, '').trim();
  if (n.includes('——')) n = n.split('——').pop().trim();
  n = n.replace(/ - 哔哩哔哩$/, '').trim();
  return n || String(name || '').trim();
}
function splitAuthorAnalysis(text) {
  const marker = '飞燕惊澜：';
  const s = String(text || '').trim();
  const idx = s.indexOf(marker);
  if (idx < 0) return { sourceText: s, interpretationText: '' };
  return { sourceText: s.slice(0, idx).trim(), interpretationText: s.slice(idx + marker.length).trim() };
}
function normalizeClaims(fragment) {
  const sourceBackedClaims = [];
  const interpretationNotes = [];
  for (const claim of fragment.claims || []) {
    if (!claim.text) continue;
    const split = splitAuthorAnalysis(claim.text);
    if (split.sourceText) {
      sourceBackedClaims.push({
        claimId: claim.claimId,
        label: claim.label,
        text: split.sourceText,
        sourceRef: claim.sourceRef,
        confidence: claim.confidence || 'source-text'
      });
    }
    if (split.interpretationText) {
      interpretationNotes.push({
        noteId: `${claim.claimId}-interpretation`,
        label: claim.label,
        text: split.interpretationText,
        sourceRef: claim.sourceRef,
        author: '飞燕惊澜',
        canonStatus: 'interpretation-only'
      });
    }
  }
  if (!sourceBackedClaims.length) {
    for (const section of fragment.sections || []) {
      const raw = String(section.text || '').trim();
      if (!raw) continue;
      const split = splitAuthorAnalysis(raw);
      if (split.sourceText) {
        sourceBackedClaims.push({
          claimId: `${section.sectionId}-fallback-claim`,
          label: section.heading || 'section-text',
          text: split.sourceText,
          sourceRef: section.sourceRef || (fragment.sourceRefs || [])[0] || '',
          confidence: 'source-section-fallback'
        });
      }
      if (split.interpretationText) {
        interpretationNotes.push({
          noteId: `${section.sectionId}-fallback-interpretation`,
          label: section.heading || 'section-text',
          text: split.interpretationText,
          sourceRef: section.sourceRef || (fragment.sourceRefs || [])[0] || '',
          author: '飞燕惊澜',
          canonStatus: 'interpretation-only'
        });
      }
    }
  }
  return { sourceBackedClaims, interpretationNotes };
}
function parseSpecFields(fields) {
  return {
    classification: fields['机型分类'] || fields['舰种'] || fields['人物分类'] || '',
    modelNumber: fields['型号'] || fields['编号'] || '',
    energyType: fields['能源类型'] || '',
    dimensions: fields['机体规格'] || fields['规格'] || '',
    armorMaterial: fields['装甲材质'] || '',
    affiliation: fields['归属'] || fields['所属'] || fields['阵营'] || ''
  };
}
function normalize(fragment, planDir) {
  const domain = domainForKind(fragment.kind);
  const layer = fragment.continuityLayer === 'base-seed' && fragment.scope === 'seed_core' ? 'base-seed' : 'extension-candidates';
  const claims = normalizeClaims(fragment);
  const fields = fragment.structuredFields || {};
  const normalized = {
    schema: 'gundam-seed-normalized-candidate-v1',
    entityId: fragment.entityId,
    kind: fragment.kind,
    domain,
    name: cleanName(fragment.name),
    title: fragment.title,
    aliases: [...new Set([cleanName(fragment.name), fragment.name, fragment.title].filter(Boolean))],
    continuityLayer: fragment.continuityLayer,
    normalizedLayer: layer,
    scope: fragment.scope,
    extensionMentions: fragment.extensionMentions || [],
    sourceRefs: fragment.sourceRefs || [],
    sourceRecordRefs: fragment.sourceRecordRefs || [],
    fragmentRef: fragment.__file || '',
    sourceBacked: {
      summary: splitAuthorAnalysis(fragment.summaryCandidate || '').sourceText,
      structuredFields: fields,
      specs: parseSpecFields(fields),
      claims: claims.sourceBackedClaims
    },
    interpretationNotes: claims.interpretationNotes,
    sections: (fragment.sections || []).map(s => ({ sectionId: s.sectionId, heading: s.heading, sourceRef: s.sourceRef, textPreview: String(s.text || '').slice(0, 800) })),
    imageEvidence: fragment.imageEvidence || [],
    coverage: {
      minimumGate: fragment.gates && fragment.gates.minimumGate ? fragment.gates.minimumGate.status : 'unknown',
      extendedGate: 'partial',
      sourceBackedClaimCount: claims.sourceBackedClaims.length,
      interpretationNoteCount: claims.interpretationNotes.length,
      sectionCount: (fragment.sections || []).length,
      imageEvidenceCount: (fragment.imageEvidence || []).length,
      deployable: false,
      deployBlocker: 'candidate requires domain audit/fix before curated deployment'
    },
    mergePolicy: layer === 'base-seed' ? 'eligible-for-base-seed-audit-merge' : 'preserve-only-do-not-merge-into-base-seed',
    generatedAt: new Date().toISOString()
  };
  return { normalized, layer, domain };
}
function md(report) {
  const lines = [];
  lines.push('# Gundam SEED Normalized Candidate Report');
  lines.push('');
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Total normalized: ${report.counts.total}`);
  lines.push(`- Base SEED: ${report.counts.baseSeed}`);
  lines.push(`- Extension candidates: ${report.counts.extensionCandidates}`);
  lines.push('');
  lines.push('## By Domain');
  lines.push('');
  lines.push('| Domain | Count |');
  lines.push('|---|---:|');
  for (const [k, v] of Object.entries(report.counts.byDomain)) lines.push(`| ${k} | ${v} |`);
  lines.push('');
  lines.push('## Interpretation Split');
  lines.push('');
  lines.push(`- Source-backed claims: ${report.counts.sourceBackedClaims}`);
  lines.push(`- Interpretation notes split out: ${report.counts.interpretationNotes}`);
  lines.push('');
  lines.push('## Policy');
  lines.push('');
  lines.push('- Normalized candidates are still not deployable.');
  lines.push('- Author analysis after `飞燕惊澜：` was moved to `interpretationNotes`.');
  lines.push('- Extension candidates remain in a separate layer.');
  lines.push('');
  return lines.join('\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  const planDir = args.planDir || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const files = listFiles(path.join(planDir, 'extracted'), '.fragment.json');
  const counts = { total: 0, baseSeed: 0, extensionCandidates: 0, byDomain: {}, sourceBackedClaims: 0, interpretationNotes: 0 };
  const outputs = [];
  for (const file of files) {
    const fragment = readJson(file, null);
    if (!fragment || !fragment.entityId) continue;
    fragment.__file = rel(planDir, file);
    const { normalized, layer, domain } = normalize(fragment, planDir);
    const out = path.join(planDir, 'normalized', layer, domain, `${safeFile(normalized.entityId)}.json`);
    writeJson(out, normalized);
    counts.total++;
    if (layer === 'base-seed') counts.baseSeed++; else counts.extensionCandidates++;
    counts.byDomain[domain] = (counts.byDomain[domain] || 0) + 1;
    counts.sourceBackedClaims += normalized.sourceBacked.claims.length;
    counts.interpretationNotes += normalized.interpretationNotes.length;
    outputs.push({ entityId: normalized.entityId, name: normalized.name, layer, domain, out: rel(planDir, out), sourceBackedClaimCount: normalized.sourceBacked.claims.length, interpretationNoteCount: normalized.interpretationNotes.length });
  }
  counts.byDomain = Object.fromEntries(Object.entries(counts.byDomain).sort());
  const report = { schema: 'gundam-seed-normalized-candidate-report-v1', generatedAt: new Date().toISOString(), counts, outputs };
  writeJson(path.join(planDir, 'reports', 'normalized-candidate-report.json'), report);
  writeText(path.join(planDir, 'reports', 'normalized-candidate-report.md'), md(report));
  console.log(JSON.stringify({ ok: true, report: path.join(planDir, 'reports', 'normalized-candidate-report.json'), counts }, null, 2));
}
main();
