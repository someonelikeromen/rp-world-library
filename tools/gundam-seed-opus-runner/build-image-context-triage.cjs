#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
function shortText(s, n = 360) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}
function normUrl(url) {
  return String(url || '').replace(/^https:/, 'http:');
}
function basenameNoExt(file) {
  return path.basename(file, path.extname(file));
}
function sha1File(file) {
  try { return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex'); } catch { return null; }
}
function textFromNodes(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textFromNodes).filter(Boolean).join('');
  if (typeof value !== 'object') return '';
  if (value.word?.words) return value.word.words;
  if (value.text?.nodes) return textFromNodes(value.text.nodes);
  if (value.heading?.nodes) return textFromNodes(value.heading.nodes);
  if (value.list?.items) return textFromNodes(value.list.items);
  if (value.nodes) return textFromNodes(value.nodes);
  return '';
}
function paragraphText(p) {
  if (!p) return '';
  if (p.heading) return textFromNodes(p.heading.nodes);
  if (p.text) return textFromNodes(p.text.nodes || p.text);
  if (p.list) return textFromNodes(p.list.items || p.list);
  if (p.blockquote) return textFromNodes(p.blockquote);
  return textFromNodes(p);
}
function classifyOpus(title, text) {
  const s = `${title || ''}\n${text || ''}`;
  if (/战斗分析|攻防战|海峡战|战役|战斗/.test(title)) return 'battle';
  if (/人物百科/.test(title)) return 'character';
  if (/机体百科/.test(title)) return 'mobile_suit';
  if (/战舰百科/.test(title)) return 'warship';
  if (/百科——/.test(title) && /调整者|自然人|PLANT|地球联合|扎夫特|奥布|中子|宇宙|年表|势力/.test(s)) return 'world_rule';
  if (/小说|翻译/.test(title)) return 'novel_translation';
  if (/争议|辨析|分析/.test(title)) return 'controversy';
  return 'unknown';
}
function classifyScope(title, text) {
  const s = `${title || ''}\n${text || ''}`;
  if (/DESTINY|Destiny|命运|CE73|C\.E\.73/.test(title)) return 'destiny_extension';
  if (/FREEDOM|Freedom|自由/.test(title)) return 'freedom_extension';
  if (/ASTRAY|Astray|异端|MSV|外传/.test(title)) return 'astray_or_msv_extension';
  if (/DESTINY|FREEDOM|ASTRAY|MSV|外传|C\.E\.73|CE73/.test(s)) return 'seed_core_with_extension_mentions';
  return 'seed_core';
}
function entityFromTitle(title) {
  const cleaned = String(title || '').replace(/ - 哔哩哔哩$/, '');
  const afterDash = cleaned.split('——').pop() || cleaned;
  return afterDash.replace(/^【飞燕惊澜】/, '').trim();
}
function confidenceFromContext(ctx) {
  let score = 0;
  if (ctx.rawParagraphMatched) score += 3;
  if (ctx.currentHeading) score += 2;
  if (ctx.previousText) score += 1;
  if (ctx.nextText) score += 1;
  if (ctx.isCover) score += 1;
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
function semanticClass(item) {
  const h = item.context.currentHeading || '';
  const around = `${item.context.previousText || ''}\n${h}\n${item.context.nextText || ''}`;
  const cat = item.opus.category;
  const ratio = item.width && item.height ? item.width / item.height : 1;

  if (item.context.isCover) return { class: 'cover-or-title-visual', recognize: false, priority: 4, reason: 'top cover/title image; register as visual index unless later needed' };
  if (/规格|参数|机体规格|数据|年表|时间线|列表|表/.test(around)) return { class: 'text-heavy-or-table', recognize: true, priority: 1, reason: 'HTML context indicates specs/table/timeline text likely embedded in image' };
  if (/关系|势力|组织|家系|阵营|路线|地图|战况|攻防|作战|战役|布阵/.test(around) || cat === 'battle') return { class: 'diagram-map-or-battle-frame', recognize: true, priority: 1, reason: 'battle/diagram/map context benefits from image understanding' };
  if (/武器|装备|特征|结构|驾驶舱|形态|部位|对比|改造|武装/.test(around)) return { class: 'entity-detail-visual', recognize: true, priority: 2, reason: 'entity feature context may contain labels or visual details to index' };
  if (cat === 'character') return { class: 'character-visual', recognize: false, priority: 3, reason: 'character entry visual; register only unless text/diagram context requires OCR' };
  if (cat === 'mobile_suit' || cat === 'warship') return { class: 'entity-visual', recognize: false, priority: 3, reason: 'mobile suit/warship visual; source text already carries primary facts' };
  if (ratio > 1.8 || ratio < 0.65) return { class: 'layout-suspect-needs-sampling', recognize: true, priority: 2, reason: 'unusual aspect ratio may indicate map/comparison/table' };
  return { class: 'contextual-visual-register-only', recognize: false, priority: 4, reason: 'HTML context is sufficient for coarse image role; no embedded text signal detected' };
}
function extractParagraphEvents(detail) {
  const events = [];
  const modules = detail.raw?.modules || [];
  for (const m of modules) {
    if (m.module_type === 'MODULE_TYPE_TOP') {
      const pics = m.module_top?.display?.album?.pics || [];
      for (const pic of pics) events.push({ type: 'image', imageRole: 'cover', url: normUrl(pic.url), width: pic.width, height: pic.height, text: '' });
    }
    const paragraphs = m.module_content?.paragraphs || [];
    for (const p of paragraphs) {
      if (p.pic?.pics?.length) {
        for (const pic of p.pic.pics) events.push({ type: 'image', imageRole: 'content', url: normUrl(pic.url), width: pic.width, height: pic.height, text: pic.comment || '' });
        continue;
      }
      const text = shortText(paragraphText(p), 1000);
      if (!text) continue;
      events.push({ type: p.heading ? 'heading' : 'text', text, headingLevel: p.heading?.level || null });
    }
  }
  return events;
}
function contextForImage(events, imageUrl) {
  const idx = events.findIndex(e => e.type === 'image' && e.url === normUrl(imageUrl));
  if (idx < 0) return { rawParagraphMatched: false, isCover: false, currentHeading: '', previousText: '', nextText: '' };
  let currentHeading = '';
  for (let i = idx - 1; i >= 0; i--) {
    if (events[i].type === 'heading') { currentHeading = events[i].text; break; }
  }
  const prev = [];
  for (let i = idx - 1; i >= 0 && prev.length < 3; i--) if (events[i].type !== 'image') prev.unshift(events[i].text);
  const next = [];
  for (let i = idx + 1; i < events.length && next.length < 3; i++) if (events[i].type !== 'image') next.push(events[i].text);
  return {
    rawParagraphMatched: true,
    isCover: events[idx].imageRole === 'cover',
    currentHeading,
    previousText: shortText(prev.join('\n'), 500),
    nextText: shortText(next.join('\n'), 500),
    paragraphIndex: idx,
    imageRole: events[idx].imageRole
  };
}
function main() {
  const sourceRoot = process.argv[2] || 'work/gundam-seed/source-ingest-v2';
  const planDir = process.argv[3] || 'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';
  const outRoot = path.join(sourceRoot, 'image-triage');
  const generatedAt = new Date().toISOString();
  const detailsDir = path.join(sourceRoot, 'details');
  const imagesDir = path.join(sourceRoot, 'images');
  const details = fs.readdirSync(detailsDir).filter(f => f.endsWith('.json')).sort();
  const imageInventory = [];
  const opusSummaries = [];
  const hashSeen = new Map();
  let missingManifest = 0;

  for (const file of details) {
    const detail = readJson(path.join(detailsDir, file));
    if (!detail) continue;
    const opusId = detail.opusId || basenameNoExt(file);
    const manifest = readJson(path.join(imagesDir, opusId, 'manifest.json'), null);
    if (!manifest) { missingManifest++; continue; }
    const events = extractParagraphEvents(detail);
    const category = classifyOpus(detail.title, detail.contentText || detail.moduleText || '');
    const scope = classifyScope(detail.title, detail.contentText || detail.moduleText || '');
    const entityName = entityFromTitle(detail.title);
    const opus = { opusId, title: detail.title, url: detail.url || manifest.source, category, scope, entityName };
    let recognizeCount = 0;
    let registerOnlyCount = 0;
    for (const img of manifest.images || []) {
      const absLocal = path.resolve(String(img.localPath || '').replace(/\\/g, path.sep));
      const fileHash = sha1File(absLocal);
      const duplicateOf = fileHash && hashSeen.has(fileHash) ? hashSeen.get(fileHash) : null;
      if (fileHash && !hashSeen.has(fileHash)) hashSeen.set(fileHash, `${opusId}:${img.index}`);
      const ctx = contextForImage(events, img.url);
      const item = {
        imageId: `${opusId}-${String(img.index).padStart(3, '0')}`,
        opus,
        index: img.index,
        url: img.url,
        localPath: String(img.localPath || '').replace(/\\/g, '/'),
        width: img.width,
        height: img.height,
        size: img.size,
        status: img.status,
        sha1: fileHash,
        duplicateOf,
        context: {
          ...ctx,
          confidence: confidenceFromContext(ctx),
          source: ctx.rawParagraphMatched ? 'bilibili-raw-paragraph-order' : 'manifest-only'
        }
      };
      const cls = duplicateOf ? { class: 'duplicate-image', recognize: false, priority: 5, reason: `duplicate of ${duplicateOf}` } : semanticClass(item);
      item.triage = {
        semanticClass: cls.class,
        recognitionAction: cls.recognize ? 'recognize' : 'register-only',
        priority: cls.priority,
        reason: cls.reason,
        expectedExtractionTarget: cls.recognize ? ['visibleText', 'labels', 'diagramStructure', 'noncanonicalVisualNotes'] : ['visualIndex', 'contextBinding']
      };
      if (item.triage.recognitionAction === 'recognize') recognizeCount++; else registerOnlyCount++;
      imageInventory.push(item);
    }
    opusSummaries.push({ ...opus, manifestImages: (manifest.images || []).length, rawContentImages: (detail.contentImages || []).length, rawAllImages: (detail.images || []).length, recognizeCount, registerOnlyCount, paragraphEvents: events.length });
  }

  const recognitionQueue = imageInventory.filter(x => x.triage.recognitionAction === 'recognize').sort((a, b) => a.triage.priority - b.triage.priority || a.opus.opusId.localeCompare(b.opus.opusId) || a.index - b.index);
  const registerOnly = imageInventory.filter(x => x.triage.recognitionAction !== 'recognize');
  const byClass = imageInventory.reduce((acc, x) => { acc[x.triage.semanticClass] = (acc[x.triage.semanticClass] || 0) + 1; return acc; }, {});
  const byCategory = imageInventory.reduce((acc, x) => { acc[x.opus.category] = (acc[x.opus.category] || 0) + 1; return acc; }, {});
  const recognitionByClass = recognitionQueue.reduce((acc, x) => { acc[x.triage.semanticClass] = (acc[x.triage.semanticClass] || 0) + 1; return acc; }, {});
  const report = {
    schema: 'gundam-seed-image-context-triage-v1',
    generatedAt,
    status: 'passed',
    policy: {
      primaryContext: 'Bilibili raw paragraph order: cover/content image nodes, headings, preceding text, following text',
      visionUse: 'only images whose HTML context indicates table/text/diagram/battle/detail value enter recognition queue',
      canonPolicy: 'vision output remains image evidence metadata and must not override source-backed text'
    },
    counts: {
      opus: opusSummaries.length,
      missingManifest,
      manifestImages: imageInventory.length,
      recognitionQueue: recognitionQueue.length,
      registerOnly: registerOnly.length,
      duplicates: imageInventory.filter(x => x.duplicateOf).length,
      rawContextMatched: imageInventory.filter(x => x.context.rawParagraphMatched).length,
      rawContextMissing: imageInventory.filter(x => !x.context.rawParagraphMatched).length
    },
    byClass,
    byCategory,
    recognitionByClass,
    outputs: {
      imageInventory: path.relative(process.cwd(), path.join(outRoot, 'image-inventory.json')).replace(/\\/g, '/'),
      recognitionQueue: path.relative(process.cwd(), path.join(outRoot, 'recognition-queue.json')).replace(/\\/g, '/'),
      registerOnly: path.relative(process.cwd(), path.join(outRoot, 'register-only.json')).replace(/\\/g, '/'),
      opusSummary: path.relative(process.cwd(), path.join(outRoot, 'opus-image-summary.json')).replace(/\\/g, '/')
    }
  };
  writeJson(path.join(outRoot, 'image-inventory.json'), { schema: 'gundam-seed-image-inventory-v1', generatedAt, items: imageInventory });
  writeJson(path.join(outRoot, 'recognition-queue.json'), { schema: 'gundam-seed-image-recognition-queue-v1', generatedAt, policy: report.policy, count: recognitionQueue.length, items: recognitionQueue });
  writeJson(path.join(outRoot, 'register-only.json'), { schema: 'gundam-seed-image-register-only-v1', generatedAt, count: registerOnly.length, items: registerOnly });
  writeJson(path.join(outRoot, 'opus-image-summary.json'), { schema: 'gundam-seed-opus-image-summary-v1', generatedAt, items: opusSummaries });
  writeJson(path.join(outRoot, 'image-triage-report.json'), report);
  writeJson(path.join(planDir, 'reports', 'image-triage-report.json'), report);

  const classRows = Object.entries(byClass).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `| ${k} | ${v} | ${recognitionByClass[k] || 0} |`).join('\n');
  const md = `# Gundam SEED Image Context Triage\n\n- Generated: ${generatedAt}\n- Status: passed\n- Opus: ${report.counts.opus}\n- Manifest images: ${report.counts.manifestImages}\n- Raw paragraph context matched: ${report.counts.rawContextMatched}\n- Recognition queue: ${report.counts.recognitionQueue}\n- Register-only: ${report.counts.registerOnly}\n- Duplicates: ${report.counts.duplicates}\n\n## Policy\n\nThe first-pass image meaning is derived from Bilibili raw paragraph order: cover/content image nodes, headings, preceding text, and following text. Vision is queued only when HTML context suggests table/text/diagram/battle/detail value. Vision output remains image evidence metadata and cannot override source-backed text.\n\n## Classes\n\n| Class | Images | Queued for Recognition |\n|---|---:|---:|\n${classRows}\n\n## Outputs\n\n- ${report.outputs.imageInventory}\n- ${report.outputs.recognitionQueue}\n- ${report.outputs.registerOnly}\n- ${report.outputs.opusSummary}\n`;
  writeText(path.join(outRoot, 'image-triage-report.md'), md);
  writeText(path.join(planDir, 'reports', 'image-triage-report.md'), md);
  console.log(JSON.stringify({ ok: true, ...report.counts, byClass, recognitionByClass }, null, 2));
}

main();
