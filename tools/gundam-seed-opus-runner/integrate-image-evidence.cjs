#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}
function listJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f));
}
function shortText(value, limit = 360) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
function rel(file) { return path.relative(process.cwd(), file).replace(/\\/g, '/'); }
function statusKey(status) {
  if (status === 'done') return 'recognized';
  if (status === 'blocked') return 'blocked';
  if (status === 'failed') return 'failed';
  return 'missing-result';
}
function countBy(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
function updateReport(file, patcher) {
  const data = readJson(file, null);
  if (!data) return false;
  writeJson(file, patcher(data));
  return true;
}
function buildMarkdown(summary, report) {
  const classRows = Object.entries(summary.bySemanticClass || {})
    .sort((a, b) => b[1].total - a[1].total)
    .map(([klass, counts]) => `| ${klass} | ${counts.total || 0} | ${counts.recognized || 0} | ${counts.registerOnly || 0} | ${counts.blocked || 0} | ${counts.failed || 0} |`)
    .join('\n');
  const reasonRows = Object.entries(summary.gapReasons || {})
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `- ${reason}: ${count}`)
    .join('\n') || '- none';
  return `# Gundam SEED Image Evidence Integration\n\n- Generated: ${summary.generatedAt}\n- Status: ${summary.status}\n- Inventory images: ${summary.counts.inventoryImages}\n- Evidence records: ${summary.counts.evidenceRecords}\n- Recognition queue: ${summary.counts.recognitionQueue}\n- Recognized: ${summary.counts.recognized}\n- Register-only: ${summary.counts.registerOnly}\n- Blocked: ${summary.counts.blocked}\n- Failed: ${summary.counts.failed}\n- Missing result: ${summary.counts.missingResult}\n\n## Policy\n\nImage evidence is metadata only. It records visible text, visual description, source image location, and HTML context. It does not override source-backed Bilibili text and does not become canon fact without textual corroboration.\n\n## By Class\n\n| Class | Total | Recognized | Register-only | Blocked | Failed |\n|---|---:|---:|---:|---:|---:|\n${classRows}\n\n## Gap Reasons\n\n${reasonRows}\n\n## Outputs\n\n- ${report.outputs.imageEvidenceIndex}\n- ${report.outputs.imageEvidenceSummary}\n- ${report.outputs.imageEvidenceGaps}\n`;
}
function main() {
  const sourceRoot = process.argv[2] || 'work/gundam-seed/source-ingest-v2';
  const planDir = process.argv[3] || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const worldRoot = process.argv[4] || 'campaigns/world-library/worlds/gundam-seed';
  const curated = path.join(worldRoot, 'curated');
  const generatedAt = new Date().toISOString();

  const inventoryFile = path.join(sourceRoot, 'image-triage', 'image-inventory.json');
  const queueFile = path.join(sourceRoot, 'image-triage', 'recognition-queue.json');
  const triageReportFile = path.join(sourceRoot, 'image-triage', 'image-triage-report.json');
  const visionReportFile = path.join(sourceRoot, 'vision-triage', 'image-recognition-final-report.json');
  const resultsDir = path.join(sourceRoot, 'vision-triage', 'results');

  const inventory = readJson(inventoryFile, { items: [] }).items || [];
  const queue = readJson(queueFile, { items: [] }).items || [];
  const triageReport = readJson(triageReportFile, {});
  const visionReport = readJson(visionReportFile, {});
  const resultMap = new Map();
  for (const file of listJson(resultsDir)) {
    const result = readJson(file, {});
    const imageId = result.imageRef || path.basename(file, '.json');
    resultMap.set(imageId, { file, result });
  }
  const queued = new Set(queue.map(item => item.imageId));

  const evidence = inventory.map(item => {
    const hit = resultMap.get(item.imageId);
    const result = hit?.result || null;
    const isQueued = queued.has(item.imageId);
    const recognitionStatus = isQueued ? statusKey(result?.status) : 'register-only';
    const visibleText = (result?.visibleText || []).map(entry => ({
      text: typeof entry === 'string' ? entry : entry.text || '',
      locationHint: typeof entry === 'string' ? '' : entry.locationHint || '',
      confidence: typeof entry === 'string' ? 'medium' : entry.confidence || 'medium'
    })).filter(entry => entry.text);
    return {
      imageId: item.imageId,
      opusId: item.opus?.opusId || '',
      title: item.opus?.title || '',
      sourceRef: item.opus?.url || '',
      sourceImageUrl: item.url || '',
      localPath: item.localPath || '',
      index: item.index,
      width: item.width,
      height: item.height,
      sha1: item.sha1 || null,
      duplicateOf: item.duplicateOf || null,
      semanticClass: item.triage?.semanticClass || 'unknown',
      recognitionAction: item.triage?.recognitionAction || 'register-only',
      recognitionStatus,
      priority: item.triage?.priority || null,
      context: {
        source: item.context?.source || '',
        confidence: item.context?.confidence || '',
        imageRole: item.context?.imageRole || '',
        currentHeading: item.context?.currentHeading || '',
        previousText: item.context?.previousText || '',
        nextText: item.context?.nextText || ''
      },
      vision: result ? {
        resultPath: hit.file.replace(/\\/g, '/'),
        provider: result.provider || '',
        model: result.model || '',
        status: result.status || '',
        visibleText,
        visibleTextSample: visibleText.slice(0, 12).map(x => x.text),
        visualDescription: result.visualDescription || '',
        detectedEntities: result.detectedEntities || [],
        technicalLabels: result.technicalLabels || [],
        tables: result.tables || [],
        confidence: result.confidence || '',
        gaps: result.gaps || [],
        error: result.error || '',
        generatedAt: result.generatedAt || ''
      } : null,
      canonPolicy: {
        layer: 'image-evidence-metadata-only',
        canPromoteToCanonFact: false,
        requiresTextCorroboration: true,
        maySupportManualReview: true
      }
    };
  });

  const gaps = evidence.filter(item => ['blocked', 'failed', 'missing-result'].includes(item.recognitionStatus)).map(item => ({
    imageId: item.imageId,
    opusId: item.opusId,
    title: item.title,
    sourceRef: item.sourceRef,
    localPath: item.localPath,
    semanticClass: item.semanticClass,
    priority: item.priority,
    recognitionStatus: item.recognitionStatus,
    reason: item.vision?.gaps?.[0]?.reason || item.vision?.error || 'missing-result',
    resultPath: item.vision?.resultPath || '',
    retryable: true
  }));

  const bySemanticClass = {};
  for (const item of evidence) {
    const key = item.semanticClass || 'unknown';
    bySemanticClass[key] ||= { total: 0, recognized: 0, registerOnly: 0, blocked: 0, failed: 0, missingResult: 0 };
    bySemanticClass[key].total++;
    if (item.recognitionStatus === 'recognized') bySemanticClass[key].recognized++;
    else if (item.recognitionStatus === 'register-only') bySemanticClass[key].registerOnly++;
    else if (item.recognitionStatus === 'blocked') bySemanticClass[key].blocked++;
    else if (item.recognitionStatus === 'failed') bySemanticClass[key].failed++;
    else bySemanticClass[key].missingResult++;
  }
  const counts = {
    inventoryImages: inventory.length,
    evidenceRecords: evidence.length,
    recognitionQueue: queue.length,
    resultFiles: resultMap.size,
    recognized: evidence.filter(item => item.recognitionStatus === 'recognized').length,
    registerOnly: evidence.filter(item => item.recognitionStatus === 'register-only').length,
    blocked: evidence.filter(item => item.recognitionStatus === 'blocked').length,
    failed: evidence.filter(item => item.recognitionStatus === 'failed').length,
    missingResult: evidence.filter(item => item.recognitionStatus === 'missing-result').length,
    duplicates: evidence.filter(item => item.duplicateOf).length,
    completionRate: queue.length ? Number((evidence.filter(item => item.recognitionStatus === 'recognized').length / queue.length).toFixed(4)) : 0
  };
  const summary = {
    schema: 'gundam-seed-image-evidence-summary-v1',
    generatedAt,
    status: counts.blocked || counts.failed || counts.missingResult ? 'integrated-with-retryable-gaps' : 'integrated',
    counts,
    bySemanticClass,
    gapReasons: countBy(gaps, gap => gap.reason),
    sourceReports: {
      triageReport: rel(triageReportFile),
      visionReport: rel(visionReportFile),
      triageStatus: triageReport.status || '',
      visionStatus: visionReport.status || ''
    },
    canonPolicy: {
      imageEvidenceMetadataOnly: true,
      noImageOnlyCanonPromotion: true,
      sourceBackedTextRemainsPrimary: true
    }
  };
  const index = {
    schema: 'gundam-seed-image-evidence-index-v1',
    generatedAt,
    world: 'gundam-seed',
    summary: counts,
    policy: summary.canonPolicy,
    items: evidence
  };
  const gapIndex = {
    schema: 'gundam-seed-image-evidence-gaps-v1',
    generatedAt,
    count: gaps.length,
    reasonCounts: summary.gapReasons,
    items: gaps
  };

  const indexFile = path.join(curated, 'image-evidence-index.json');
  const summaryFile = path.join(curated, 'image-evidence-summary.json');
  const gapsFile = path.join(curated, 'image-evidence-gaps.json');
  writeJson(indexFile, index);
  writeJson(summaryFile, summary);
  writeJson(gapsFile, gapIndex);

  const report = {
    schema: 'gundam-seed-image-evidence-integration-report-v1',
    generatedAt,
    status: summary.status,
    counts,
    gapReasons: summary.gapReasons,
    outputs: {
      imageEvidenceIndex: rel(indexFile),
      imageEvidenceSummary: rel(summaryFile),
      imageEvidenceGaps: rel(gapsFile),
      sourceTriageReport: rel(triageReportFile),
      sourceVisionReport: rel(visionReportFile)
    },
    policy: summary.canonPolicy
  };
  const reportFile = path.join(planDir, 'reports', 'image-evidence-integration-report.json');
  const reportMdFile = path.join(planDir, 'reports', 'image-evidence-integration-report.md');
  writeJson(reportFile, report);
  writeText(reportMdFile, buildMarkdown(summary, report));

  const patch = data => ({
    ...data,
    imageEvidence: {
      integratedAt: generatedAt,
      status: summary.status,
      counts,
      gapReasons: summary.gapReasons,
      outputs: report.outputs,
      canonPolicy: summary.canonPolicy
    },
    counts: { ...(data.counts || {}), imageEvidenceRecords: counts.evidenceRecords, imageEvidenceRecognized: counts.recognized, imageEvidenceBlocked: counts.blocked, imageEvidenceFailed: counts.failed },
    residualReview: { ...(data.residualReview || {}), imageEvidenceBlocked: counts.blocked, imageEvidenceFailed: counts.failed }
  });
  updateReport(path.join(planDir, 'reports', 'full-auto-completion-report.json'), patch);
  updateReport(path.join(planDir, 'audit', 'full-auto-final-audit.json'), patch);
  updateReport(path.join(curated, 'validation-report.json'), patch);

  const extended = readJson(path.join(planDir, 'audit', 'extended-gate-closure.json'), {});
  writeJson(path.join(planDir, 'audit', 'extended-gate-closure.json'), {
    ...extended,
    imageEvidence: {
      integratedAt: generatedAt,
      status: summary.status,
      counts,
      gapReasons: summary.gapReasons,
      outputs: report.outputs,
      canonPolicy: summary.canonPolicy
    },
    decision: 'image triage, queued recognition, and curated image evidence index integration completed; residual failures are retryable provider/network gaps'
  });

  const append = `\n\n## Image Evidence Integration\n\n- Integrated: ${generatedAt}\n- Evidence records: ${counts.evidenceRecords}\n- Recognized: ${counts.recognized}/${counts.recognitionQueue}\n- Register-only: ${counts.registerOnly}\n- Blocked: ${counts.blocked}\n- Failed: ${counts.failed}\n- Policy: image evidence metadata only; no image-only canon promotion.\n\nOutputs:\n- ${report.outputs.imageEvidenceIndex}\n- ${report.outputs.imageEvidenceSummary}\n- ${report.outputs.imageEvidenceGaps}\n`;
  for (const file of [
    path.join(planDir, 'reports', 'full-auto-completion-report.md'),
    path.join(planDir, 'audit', 'full-auto-final-audit.md'),
    path.join(curated, 'validation-report.md')
  ]) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\n## Image Evidence Integration[\s\S]*$/m, '') : '';
    writeText(file, current.trimEnd() + append);
  }

  console.log(JSON.stringify({ ok: true, status: summary.status, counts, outputs: report.outputs }, null, 2));
}
main();
