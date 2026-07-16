const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const TASK_ROOT = 'taskplane-tasks';
const PREFIX = 'WCA';
const TODAY = '2026-07-02';
const WORLD_CN = {
  campione: '弑神者！',
  danmachi: '在地下城寻求邂逅是否搞错了什么',
  'hidan-no-aria': '绯弹的亚里亚',
  'high-school-dxd': '恶魔高校D×D',
  'infinite-stratos': 'IS〈Infinite Stratos〉',
  'rakudai-kishi': '落第骑士英雄谭',
  'saijaku-muhai-bahamut': '最弱无败神装机龙',
  'type-moon-nasuverse': '型月 / Nasuverse'
};

function exists(p){ return fs.existsSync(p); }
function mkdir(p){ fs.mkdirSync(p, { recursive: true }); }
function write(p, s){ mkdir(path.dirname(p)); fs.writeFileSync(p, s, 'utf8'); }
function readDir(p){ return exists(p) ? fs.readdirSync(p).sort() : []; }
function walkFiles(dir, pred = () => true){
  const out = [];
  function rec(d){
    if (!exists(d)) return;
    for (const f of fs.readdirSync(d).sort()) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) rec(p); else if (pred(p, st)) out.push(p);
    }
  }
  rec(dir);
  return out;
}
function walkDirs(dir, pred = () => true){
  const out = [];
  function rec(d){
    if (!exists(d)) return;
    for (const f of fs.readdirSync(d).sort()) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (!st.isDirectory()) continue;
      if (pred(p)) out.push(p);
      rec(p);
    }
  }
  rec(dir);
  return out;
}
function slash(p){ return p.split(path.sep).join('/'); }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'task'; }
function id(n){ return `${PREFIX}-${String(n).padStart(3, '0')}`; }
function taskDir(tid, name){ return path.join(TASK_ROOT, `${tid}-${slug(name)}`); }
function depText(deps){ return deps.length ? deps.map(d => `- **Task:** ${d}`).join('\n') : '- **None**'; }
function bullets(xs){ return xs.map(x => `- [ ] ${x}`).join('\n'); }
function paths(xs){ return xs.map(x => `- \`${slash(x)}\``).join('\n'); }

function prompt(t){
  return `# Task: ${t.id} - ${t.name}\n\n**Created:** ${TODAY}\n**Size:** ${t.size || 'M'}\n\n## Review Level: 0 (None)\n\n**Assessment:** Additive content-archive task. It reads local source files and writes derived archive artifacts only; core graph overwrite is forbidden.\n**Score:** 1/8 — Blast radius: 1, Pattern novelty: 0, Security: 0, Reversibility: 0\n\n## Canonical Task Folder\n\n\`\`\`\n${slash(taskDir(t.id, t.name))}/\n├── PROMPT.md\n├── STATUS.md\n├── .reviews/\n└── .DONE\n\`\`\`\n\n## Mission\n\n${t.mission}\n\n## Dependencies\n\n${depText(t.deps || [])}\n\n## Context to Read First\n\n**Tier 2 (area context):**\n- \`taskplane-tasks/CONTEXT.md\`\n\n**Tier 3:**\n- \`campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md\` — workflow, schemas, retry policy, and layer definitions.\n- \`campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.json\` — machine-readable implementation policy.\n\n## Environment\n\n- **Workspace:** \`E:/pi-st\`\n- **Services required:** None\n\n## File Scope\n\n${paths(t.fileScope)}\n\n## Steps\n\n${t.steps.map((s, i) => `### Step ${i}: ${s.title}\n\n${bullets(s.items)}\n\n**Artifacts:**\n${paths(s.artifacts)}`).join('\n\n')}\n\n## Documentation Requirements\n\n**Must Update:**\n${paths(t.mustUpdate || [])}\n\n**Check If Affected:**\n- \`campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md\`\n\n## Completion Criteria\n\n- [ ] Every local source file in task scope has an archive JSON/MD or a recorded skip/failure reason.\n- [ ] Validation JSON exists and has no unhandled failures.\n- [ ] Lessons file exists and records retry/quality learnings.\n- [ ] Generated JSON parses successfully.\n- [ ] No formal core graph file was overwritten.\n\n## Git Commit Convention\n\nIf committing, every commit message must include \`${t.id}\`.\n\n## Do NOT\n\n- Do not crawl the network. Only read local files.\n- Do not copy long source passages; write concise derived summaries.\n- Do not overwrite \`relationship-graph.json\`, \`characters-index.json\`, \`knowledge-graph.json\`, or \`plot-graph.json\`.\n- Do not count raw-text files as chapter metadata.\n- Do not promote relationship candidates to formal semantic edges.\n- Do not silently skip blocked, too-short, image-only, or failed units.\n\n---\n\n## Amendments (Added During Execution)\n\n`;
}
function status(t){
  return `# ${t.id}: ${t.name} — Status\n\n**Current Step:** Not Started\n**Status:** 🔵 Ready for Execution\n**Last Updated:** ${TODAY}\n**Review Level:** 0\n**Review Counter:** 0\n**Iteration:** 0\n**Size:** ${t.size || 'M'}\n\n---\n\n${t.steps.map((s, i) => `### Step ${i}: ${s.title}\n**Status:** ⬜ Not Started\n\n${bullets(s.items)}\n`).join('\n---\n\n')}\n\n## Discoveries\n\n- None yet.\n`;
}
function createTask(t){
  const dir = taskDir(t.id, t.name);
  write(path.join(dir, 'PROMPT.md'), prompt(t));
  write(path.join(dir, 'STATUS.md'), status(t));
  return slash(dir);
}

function rawVolumes(){
  const out = [];
  for (const world of readDir(ROOT)) {
    const rawRoot = path.join(ROOT, world, 'sources', 'raw-text');
    for (const d of walkDirs(rawRoot, p => /[/\\]vol-[^/\\]+$/.test(p))) {
      const txtCount = walkFiles(d, p => p.endsWith('.txt')).length;
      if (!txtCount) continue;
      const rel = slash(path.relative(rawRoot, d));
      const [series, volume] = rel.split('/');
      out.push({ type: 'raw-volume', world, worldName: WORLD_CN[world] || world, series, volume, sourceDir: slash(d), sourceCount: txtCount });
    }
  }
  return out.sort((a, b) => `${a.world}/${a.series}/${a.volume}`.localeCompare(`${b.world}/${b.series}/${b.volume}`));
}
function curatedUnits(){
  const out = [];
  const high = 'campaigns/world-library/worlds/high-school-dxd/curated/stories';
  if (exists(high)) out.push({ type: 'curated-unit', world: 'high-school-dxd', worldName: WORLD_CN['high-school-dxd'], unit: 'stories', sourceDir: high, sourceCount: walkFiles(high, p => p.endsWith('.md')).length });
  const inf = 'campaigns/world-library/worlds/infinite-stratos/curated/stories';
  for (const d of readDir(inf).map(f => path.join(inf, f)).filter(p => exists(p) && fs.statSync(p).isDirectory())) {
    const sourceCount = walkFiles(d, p => p.endsWith('.md')).length;
    if (sourceCount) out.push({ type: 'curated-unit', world: 'infinite-stratos', worldName: WORLD_CN['infinite-stratos'], unit: path.basename(d), sourceDir: slash(d), sourceCount });
  }
  const tm = 'campaigns/world-library/worlds/type-moon-nasuverse/curated/stories';
  for (const d of readDir(tm).map(f => path.join(tm, f)).filter(p => exists(p) && fs.statSync(p).isDirectory())) {
    const sourceCount = walkFiles(d, p => p.endsWith('.md')).length;
    if (sourceCount) out.push({ type: 'curated-unit', world: 'type-moon-nasuverse', worldName: WORLD_CN['type-moon-nasuverse'], unit: path.basename(d), sourceDir: slash(d), sourceCount });
  }
  return out.sort((a, b) => `${a.world}/${a.unit}`.localeCompare(`${b.world}/${b.unit}`));
}

function rawTask(tid, x, deps){
  const base = `campaigns/world-library/worlds/${x.world}/curated/stories`;
  const arch = `${base}/chapter-archives/${x.series}/${x.volume}`;
  const vol = `${base}/volume-archives/${x.series}`;
  const refined = `${base}/volume-refined/${x.series}`;
  const retry = `${base}/retry-queues/${x.series}`;
  return { id: tid, name: `${x.world} ${x.series} ${x.volume} chapter archive`, deps, fileScope: [x.sourceDir, arch, vol, refined, retry], mustUpdate: [`${vol}/${x.volume}.validation.json`, `${vol}/${x.volume}.lessons.md`],
    mission: `Read every .txt chapter in \`${x.sourceDir}\` fully and in filename order. After each chapter, immediately write chapter archive JSON/MD. Then validate and refine ${x.worldName} / ${x.series} / ${x.volume}. Detected source files: ${x.sourceCount}.`,
    steps: [
      { title: 'Preflight', items: [`Verify source dir exists: ${x.sourceDir}`, 'List all .txt files in stable order', 'Create archive, validation, refined, and retry directories'], artifacts: [arch, vol, refined, retry] },
      { title: 'Read chapters and write immediate archives', items: ['Read each .txt fully, using offset reads for large files', 'Write one rp-chapter-archive-v1 JSON and one Markdown file per chapter immediately after reading', 'Capture summary, events, characters, locations, terms, items, factions, relationshipSignals, timelineSignals, continuityNotes, uncertainties, and qualityFlags', 'Avoid long verbatim excerpts'], artifacts: [`${arch}/*.json`, `${arch}/*.md`] },
      { title: 'Validate volume and retry failures', items: ['Compare archive coverage against source files and _manifest.json when present', 'Explain exceptions for afterword/setting/blocked/too-short/image-only chapters', 'Retry failed or empty units within policy limits, otherwise write retry queue entries', 'Confirm generated JSON parses'], artifacts: [`${vol}/${x.volume}.validation.json`, `${retry}/${x.volume}.retry.json`] },
      { title: 'Refine volume and record lessons', items: ['Write volume summary, event chain, entity increments, relationship candidates, timeline increments, and search keywords', 'Write lessons covering name conventions, relationship signals, special structures, and retry learnings', 'Confirm no core graph files changed'], artifacts: [`${vol}/${x.volume}.json`, `${vol}/${x.volume}.md`, `${vol}/${x.volume}.lessons.md`, `${refined}/${x.volume}.json`, `${refined}/${x.volume}.md`] }
    ] };
}
function curatedTask(tid, x, deps){
  const base = `campaigns/world-library/worlds/${x.world}/curated/stories`;
  const arch = `${base}/chapter-archives-curated/${x.unit}`;
  const unit = `${base}/curated-unit-archives`;
  const retry = `${base}/retry-queues-curated/${x.unit}`;
  return { id: tid, name: `${x.world} ${x.unit} curated story archive`, deps, fileScope: [x.sourceDir, arch, unit, retry], mustUpdate: [`${unit}/${x.unit}.validation.json`, `${unit}/${x.unit}.lessons.md`],
    mission: `Read every Markdown story source in \`${x.sourceDir}\` fully. After each file, immediately write curated-derived archive JSON/MD. Then validate and refine ${x.worldName} / ${x.unit}. Detected source files: ${x.sourceCount}.`,
    steps: [
      { title: 'Preflight', items: [`Verify source dir exists: ${x.sourceDir}`, 'List all Markdown source files in stable order', 'Create curated-derived archive, validation, and retry directories'], artifacts: [arch, unit, retry] },
      { title: 'Read source files and write immediate archives', items: ['Read each Markdown file fully, using offset reads for large files', 'Write one rp-chapter-archive-v1-compatible JSON and one Markdown file per source with sourceLayer=existing-curated-derived', 'Extract events, characters, locations, terms, relationshipSignals, timelineSignals, continuityNotes, and uncertainties', 'Do not claim raw-text provenance'], artifacts: [`${arch}/*.json`, `${arch}/*.md`] },
      { title: 'Validate unit and retry failures', items: ['Compare archive coverage against Markdown source list', 'Explain exceptions for non-story notes or settings files', 'Retry failed or empty units within policy limits, otherwise write retry queue entries', 'Confirm generated JSON parses'], artifacts: [`${unit}/${x.unit}.validation.json`, `${retry}/${x.unit}.retry.json`] },
      { title: 'Refine unit and record lessons', items: ['Write unit summary, event chain, entity increments, relationship candidates, timeline increments, and search keywords', 'Write lessons covering name conventions, source limitations, and retry learnings', 'Confirm no core graph files changed'], artifacts: [`${unit}/${x.unit}.json`, `${unit}/${x.unit}.md`, `${unit}/${x.unit}.lessons.md`] }
    ] };
}
function pilotGate(tid, deps){
  return { id: tid, name: 'pilot validation gate', size: 'S', deps, fileScope: ['campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.*', 'campaigns/world-library/worlds/*/curated/stories/chapter-archives/*/vol-01/*'], mustUpdate: ['campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.md'],
    mission: 'Validate the three pilot volume archives before opening the full batch. If anything fails, write exact retry instructions and do not hide failures.',
    steps: [
      { title: 'Preflight', items: ['Locate all three pilot output directories', 'Confirm each pilot source directory has outputs'], artifacts: ['campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.json'] },
      { title: 'Pilot validation', items: ['Check archive coverage and JSON parse status', 'Check validation and lessons files exist', 'List failures with exact retry paths'], artifacts: ['campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.json', 'campaigns/world-library/manual-curation/reports/pilot-chapter-archive-validation.md'] }
    ] };
}
function worldTask(tid, world, deps){
  const cur = `campaigns/world-library/worlds/${world}/curated`;
  return { id: tid, name: `${world} world integration`, deps, fileScope: [`${cur}/stories/chapter-archives*`, `${cur}/stories/volume-archives`, `${cur}/stories/volume-refined`, `${cur}/original-*.json`, `${cur}/original-*.md`, `${cur}/proposed-*.json`, `${cur}/proposed-*.md`], mustUpdate: [`${cur}/original-archive-validation.json`, `${cur}/original-archive-lessons.md`],
    mission: `Integrate completed chapter/unit archives for ${WORLD_CN[world] || world}. Generate additive original/proposed layers, validation, runtime/search/timeline packs, and human-review queues without overwriting formal core graph files.`,
    steps: [
      { title: 'Preflight', items: ['Locate all completed chapter/unit archive outputs for this world', 'Record missing/failed volume or unit tasks', 'Read existing core graph files only as reference'], artifacts: [`${cur}/original-archive-validation.json`] },
      { title: 'Aggregate derived layers', items: ['Build original chapter archive index and volume archive index', 'Build derived entity index, relationship candidates, timeline, search index, and runtime pack', 'Separate raw-text-derived and existing-curated-derived provenance'], artifacts: [`${cur}/original-chapter-archive-index.json`, `${cur}/original-volume-archive-index.json`, `${cur}/original-entity-index.json`, `${cur}/original-relationship-candidates.json`, `${cur}/original-timeline.json`, `${cur}/original-search-index.json`, `${cur}/original-runtime-pack.json`] },
      { title: 'Validate and queue human review', items: ['Validate coverage, JSON parse status, blocked/failed units, and long-verbatim risk', 'Generate proposed core graph gap review instead of editing formal graphs', 'Write world lessons'], artifacts: [`${cur}/original-archive-validation.json`, `${cur}/original-archive-lessons.md`, `${cur}/proposed-core-graph-gap-review.json`, `${cur}/proposed-core-graph-gap-review.md`] }
    ] };
}
function finalTask(tid, deps){
  return { id: tid, name: 'global final archive audit', deps, fileScope: ['campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.*', 'campaigns/world-library/manual-curation/STATUS.md', 'campaigns/world-library/manual-curation/INDEX.md'], mustUpdate: ['campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.md', 'campaigns/world-library/manual-curation/STATUS.md', 'campaigns/world-library/manual-curation/INDEX.md'],
    mission: 'Produce the final all-world implementation audit after all world integrations complete, with separate columns for raw-text, chapter archives, volume archives, validation, retries, human-review queues, and core graph gaps.',
    steps: [
      { title: 'Preflight', items: ['Confirm all world integration tasks completed', 'Collect validation reports and retry queues', 'Collect failed/skipped items'], artifacts: ['campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.json'] },
      { title: 'Final Chinese audit', items: ['Build final Chinese report with separated source/derived/manual columns', 'Validate generated JSON files', 'Do not report missing manual graph layers as complete'], artifacts: ['campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.json', 'campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.md'] },
      { title: 'Documentation sync', items: ['Update manual-curation STATUS and INDEX', 'Record remaining human-review items and next actions'], artifacts: ['campaigns/world-library/manual-curation/STATUS.md', 'campaigns/world-library/manual-curation/INDEX.md'] }
    ] };
}

function config(){
  write('.pi/taskplane-config.json', JSON.stringify({
    configVersion: 1,
    taskRunner: {
      project: { name: 'pi-rp world archive', description: 'Full chapter-by-chapter world archive implementation.' },
      paths: { tasks: TASK_ROOT },
      testing: { commands: { test: 'node -e "console.log(\'no test suite configured; validate generated JSON per task\')"' } },
      standards: { docs: ['campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md'], rules: ['Read full local sources', 'No network crawling', 'No core graph overwrite', 'No long verbatim excerpts'] },
      worker: { model: 'lt-yuyu/gpt-5.5', tools: 'read,write,edit,bash,grep,find,ls', thinking: 'off' },
      reviewer: { model: 'lt-yuyu/gpt-5.5', tools: 'read,write,bash,grep,find,ls', thinking: 'off' },
      context: { workerContextWindow: 200000, warnPercent: 70, killPercent: 85, maxWorkerIterations: 35, maxReviewCycles: 1, noProgressLimit: 5 },
      taskAreas: { 'world-archive': { path: TASK_ROOT, prefix: PREFIX, context: `${TASK_ROOT}/CONTEXT.md` } },
      referenceDocs: { archivePlan: 'campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md', archivePlanJson: 'campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.json' },
      neverLoad: [],
      selfDocTargets: {},
      protectedDocs: []
    },
    orchestrator: { orchestrator: { maxLanes: 3, worktreeLocation: 'subdirectory', worktreePrefix: '.worktrees', batchIdFormat: 'timestamp', spawnMode: 'subprocess', operatorId: 'world-archive' }, dependencies: { source: 'prompt', cache: true }, assignment: { strategy: 'affinity-first', sizeWeights: { S: 1, M: 2, L: 4 } }, preWarm: { autoDetect: false, commands: {}, always: [] }, merge: { model: 'lt-yuyu/gpt-5.5', tools: 'read,write,edit,bash,grep,find,ls', thinking: 'off' } }
  }, null, 2));
}
function context(next){
  write(path.join(TASK_ROOT, 'CONTEXT.md'), `# World Archive — Context\n\n**Last Updated:** ${TODAY}  \n**Status:** Active  \n**Next Task ID:** ${next}\n\n---\n\n## Current State\n\nThis task area implements full chapter-by-chapter archives for all worlds. Local raw-text files are source files only, not curated metadata. Workers read local sources fully, write immediate chapter/source archives, validate by volume or curated unit, retry failures, and integrate additive derived layers only after validation.\n\nFormal core graph files such as \`relationship-graph.json\`, \`characters-index.json\`, \`knowledge-graph.json\`, and \`plot-graph.json\` must not be overwritten by automatic candidates.\n\n## Key Files\n\n| Category | Path |\n|---|---|\n| Archive plan | \`campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md\` |\n| Machine plan | \`campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.json\` |\n| Worlds | \`campaigns/world-library/worlds/\` |\n| Reports | \`campaigns/world-library/manual-curation/reports/\` |\n\n## Technical Debt / Future Work\n\n- [ ] Promote proposed relationship edges only after human review.\n- [ ] Build formal chapter metadata for worlds that currently only have raw-text or curated Markdown sources.\n`);
}

function main(){
  if (exists(TASK_ROOT)) {
    for (const f of fs.readdirSync(TASK_ROOT)) if (/^WCA-\d+/.test(f)) fs.rmSync(path.join(TASK_ROOT, f), { recursive: true, force: true });
  }
  config();
  const raw = rawVolumes();
  const curated = curatedUnits();
  const pilotKeys = new Set(['campione/campione-main/vol-01', 'rakudai-kishi/rakudai-kishi-main/vol-01', 'saijaku-muhai-bahamut/saijaku-muhai-bahamut-main/vol-01']);
  let n = 1;
  const tasks = [];
  const worldDeps = new Map();
  const add = t => { t.dir = createTask(t); tasks.push(t); if (t.world) { if (!worldDeps.has(t.world)) worldDeps.set(t.world, []); worldDeps.get(t.world).push(t.id); } };
  const pilot = [];
  for (const x of raw.filter(r => pilotKeys.has(`${r.world}/${r.series}/${r.volume}`))) { const tid = id(n++); pilot.push(tid); add({ ...rawTask(tid, x, []), ...x }); }
  const gate = id(n++); tasks.push({ ...pilotGate(gate, pilot), type: 'pilot-gate', dir: createTask(pilotGate(gate, pilot)) });
  for (const x of raw.filter(r => !pilotKeys.has(`${r.world}/${r.series}/${r.volume}`))) add({ ...rawTask(id(n++), x, [gate]), ...x });
  for (const x of curated) add({ ...curatedTask(id(n++), x, [gate]), ...x });
  const integrators = [];
  for (const world of Object.keys(WORLD_CN).sort()) {
    const deps = worldDeps.get(world) || [];
    if (!deps.length) continue;
    const tid = id(n++); integrators.push(tid); tasks.push({ ...worldTask(tid, world, deps), type: 'world-integrator', world, dir: createTask(worldTask(tid, world, deps)) });
  }
  const final = id(n++); tasks.push({ ...finalTask(final, integrators), type: 'global-final', dir: createTask(finalTask(final, integrators)) });
  context(id(n));
  const index = { createdAt: new Date().toISOString(), totalTasks: tasks.length, rawVolumeTasks: raw.length, curatedUnitTasks: curated.length, pilotTasks: pilot, pilotGate: gate, worldIntegratorIds: integrators, finalTask: final, tasks: tasks.map(t => ({ id: t.id, type: t.type, world: t.world, series: t.series, volume: t.volume, unit: t.unit, dir: t.dir })) };
  write(path.join(TASK_ROOT, 'TASK_INDEX.json'), JSON.stringify(index, null, 2));
  let md = `# World Archive Task Index\n\nCreated: ${index.createdAt}\n\n- Total tasks: ${index.totalTasks}\n- Raw volume tasks: ${index.rawVolumeTasks}\n- Curated unit tasks: ${index.curatedUnitTasks}\n- Pilot tasks: ${pilot.join(', ')}\n- Pilot gate: ${gate}\n- World integrators: ${integrators.join(', ')}\n- Final task: ${final}\n\n| ID | Type | World | Series/Unit | Volume | Folder |\n|---|---|---|---|---|---|\n`;
  for (const t of index.tasks) md += `| ${t.id} | ${t.type} | ${t.world || ''} | ${t.series || t.unit || ''} | ${t.volume || ''} | \`${t.dir}\` |\n`;
  write(path.join(TASK_ROOT, 'TASK_INDEX.md'), md);
  console.log(JSON.stringify({ totalTasks: index.totalTasks, rawVolumeTasks: raw.length, curatedUnitTasks: curated.length, pilotTasks: pilot, pilotGate: gate, worldIntegratorIds: integrators, finalTask: final, nextTaskId: id(n) }, null, 2));
}
main();
