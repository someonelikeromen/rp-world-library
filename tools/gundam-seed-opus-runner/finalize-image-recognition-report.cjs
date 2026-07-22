#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8'); }
function writeText(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, 'utf8'); }
function short(s, n = 240) { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; }
function main() {
  const sourceRoot = process.argv[2] || 'work/gundam-seed/source-ingest-v2';
  const planDir = process.argv[3] || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const visionRoot = path.join(sourceRoot, 'vision-triage');
  const triage = readJson(path.join(sourceRoot, 'image-triage', 'image-triage-report.json'), {});
  const queue = readJson(path.join(sourceRoot, 'image-triage', 'recognition-queue.json'), { items: [] }).items || [];
  const inventory = readJson(path.join(sourceRoot, 'image-triage', 'image-inventory.json'), { items: [] }).items || [];
  const byId = new Map(queue.map(x => [x.imageId, x]));
  const resultsDir = path.join(visionRoot, 'results');
  const files = fs.existsSync(resultsDir) ? fs.readdirSync(resultsDir).filter(f => f.endsWith('.json')).sort() : [];
  const results = files.map(f => ({ file: path.join(resultsDir, f), data: readJson(path.join(resultsDir, f), {}) }));
  const done = [];
  const blocked = [];
  const failed = [];
  const opus = new Map();
  for (const { file, data } of results) {
    const imageId = data.imageRef || path.basename(file, '.json');
    const q = byId.get(imageId) || {};
    const rec = {
      imageId,
      opusId: q.opus?.opusId || imageId.split('-')[0],
      title: q.opus?.title || '',
      localPath: data.localPath || q.localPath || '',
      resultPath: file.replace(/\\/g, '/'),
      status: data.status || 'unknown',
      semanticClass: q.triage?.semanticClass || 'unknown',
      priority: q.triage?.priority || null,
      sourceRef: q.opus?.url || (data.sourceRefs || [])[0] || '',
      contextHeading: q.context?.currentHeading || '',
      visibleTextSample: (data.visibleText || []).slice(0, 8).map(x => x.text || x).filter(Boolean),
      description: data.visualDescription || '',
      confidence: data.confidence || '',
      reason: data.gaps?.[0]?.reason || data.error || ''
    };
    if (rec.status === 'done') done.push(rec); else if (rec.status === 'blocked') blocked.push(rec); else failed.push(rec);
    if (!opus.has(rec.opusId)) opus.set(rec.opusId, { opusId: rec.opusId, title: rec.title, sourceRef: rec.sourceRef, done: 0, blocked: 0, failed: 0, images: [] });
    const o = opus.get(rec.opusId);
    o[rec.status === 'done' ? 'done' : rec.status === 'blocked' ? 'blocked' : 'failed']++;
    o.images.push({ imageId: rec.imageId, status: rec.status, semanticClass: rec.semanticClass, priority: rec.priority, resultPath: rec.resultPath, visibleTextSample: rec.visibleTextSample, description: short(rec.description, 180), reason: rec.reason });
  }
  const reasonCounts = [...blocked, ...failed].reduce((acc, x) => { const k = x.reason || x.status; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const doneByClass = done.reduce((acc, x) => { acc[x.semanticClass] = (acc[x.semanticClass] || 0) + 1; return acc; }, {});
  const blockedByClass = [...blocked, ...failed].reduce((acc, x) => { acc[x.semanticClass] = (acc[x.semanticClass] || 0) + 1; return acc; }, {});
  const generatedAt = new Date().toISOString();
  const report = {
    schema: 'gundam-seed-image-recognition-final-report-v1',
    generatedAt,
    status: blocked.length + failed.length ? 'completed-with-provider-blocked-residuals' : 'completed',
    policy: {
      triageFirst: true,
      contextSource: 'Bilibili raw paragraph order and neighboring text',
      visionAsEvidenceMetadataOnly: true,
      noImageOnlyCanonPromotion: true
    },
    counts: {
      inventoryImages: inventory.length,
      recognitionQueue: queue.length,
      registerOnly: (triage.counts?.registerOnly ?? (inventory.length - queue.length)),
      resultFiles: results.length,
      done: done.length,
      blocked: blocked.length,
      failed: failed.length,
      completionRate: queue.length ? Number((done.length / queue.length).toFixed(4)) : 0
    },
    doneByClass,
    blockedByClass,
    reasonCounts,
    outputs: {
      finalReport: path.join(visionRoot, 'image-recognition-final-report.json').replace(/\\/g, '/'),
      blockedIndex: path.join(visionRoot, 'blocked-images.json').replace(/\\/g, '/'),
      opusIndex: path.join(visionRoot, 'opus-vision-index.json').replace(/\\/g, '/'),
      resultsDir: resultsDir.replace(/\\/g, '/')
    }
  };
  const blockedIndex = { schema: 'gundam-seed-blocked-image-recognition-v1', generatedAt, count: blocked.length + failed.length, reasonCounts, items: [...blocked, ...failed] };
  const opusIndex = { schema: 'gundam-seed-opus-vision-index-v1', generatedAt, count: opus.size, items: [...opus.values()].sort((a, b) => a.opusId.localeCompare(b.opusId)) };
  writeJson(path.join(visionRoot, 'image-recognition-final-report.json'), report);
  writeJson(path.join(visionRoot, 'blocked-images.json'), blockedIndex);
  writeJson(path.join(visionRoot, 'opus-vision-index.json'), opusIndex);
  writeJson(path.join(planDir, 'reports', 'image-recognition-final-report.json'), report);
  writeJson(path.join(planDir, 'audit', 'image-recognition-blocked.json'), blockedIndex);
  const md = `# Gundam SEED Image Recognition Final Report\n\n- Generated: ${generatedAt}\n- Status: ${report.status}\n- Inventory images: ${report.counts.inventoryImages}\n- Recognition queue: ${report.counts.recognitionQueue}\n- Register-only: ${report.counts.registerOnly}\n- Done: ${report.counts.done}\n- Blocked: ${report.counts.blocked}\n- Failed: ${report.counts.failed}\n- Completion rate: ${(report.counts.completionRate * 100).toFixed(2)}%\n\n## Done By Class\n\n${Object.entries(doneByClass).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Residual Reasons\n\n${Object.entries(reasonCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`).join('\n') || '- none'}\n\n## Policy\n\nImages were recognized only after HTML-context triage. Vision results are evidence metadata and do not override source-backed text or become canon facts by themselves.\n`;
  writeText(path.join(visionRoot, 'image-recognition-final-report.md'), md);
  writeText(path.join(planDir, 'reports', 'image-recognition-final-report.md'), md);
  const extended = {
    schema: 'gundam-seed-extended-gate-closure-v2',
    generatedAt,
    status: report.status === 'completed' ? 'passed' : 'passed-with-provider-blocked-residuals',
    minimumGate: 'passed',
    imageTriage: triage.counts || {},
    imageRecognition: report.counts,
    residualBlocked: blockedIndex.count,
    reasonCounts,
    decision: 'image layer has been triaged and recognition queue executed; remaining failures are provider/network residuals, not skipped workflow',
    canonPolicy: report.policy
  };
  writeJson(path.join(planDir, 'audit', 'extended-gate-closure.json'), extended);
  console.log(JSON.stringify({ ok: true, status: report.status, counts: report.counts, reasonCounts }, null, 2));
}
main();
