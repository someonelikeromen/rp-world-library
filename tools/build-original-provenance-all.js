const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function exists(p){ return fs.existsSync(p); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ ensureDir(path.dirname(p)); fs.writeFileSync(p,JSON.stringify(v,null,2),'utf8'); }
function rel(p){ return p.split(path.sep).join('/'); }
function sha256(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function fileInfo(base, p, role){
  const st = fs.statSync(p);
  return { role, path: rel(path.relative(base,p)), bytes: st.size, mtime: st.mtime.toISOString(), sha256: sha256(p) };
}
function addIfFile(arr, base, p, role){ if(exists(p) && fs.statSync(p).isFile()) arr.push(fileInfo(base,p,role)); }
function listFiles(dir, pred){
  const out=[];
  function walk(d){ if(!exists(d)) return; for(const f of fs.readdirSync(d)){ const p=path.join(d,f); const st=fs.statSync(p); if(st.isDirectory()) walk(p); else if(!pred || pred(p)) out.push(p); } }
  walk(dir);
  return out.sort();
}
function buildWorld(world){
  const worldRoot=path.join(ROOT,world);
  const manifestPath=path.join(worldRoot,'sources','raw-text-manifest.json');
  if(!exists(manifestPath)) return null;
  const manifest=readJson(manifestPath);
  const files=[];
  addIfFile(files, worldRoot, manifestPath, 'raw-text-manifest');
  let sourceFiles=0, sourceBytes=0;
  for(const s of manifest.series||[]) for(const v of s.volumes||[]) for(const ch of v.chapters||[]) {
    const p=path.join(worldRoot,ch.file);
    if(exists(p)) { const info=fileInfo(worldRoot,p,'raw-text-chapter'); files.push(info); sourceFiles++; sourceBytes+=info.bytes; }
  }
  const curatedRoot=path.join(worldRoot,'curated');
  const curatedImportant=[
    'plot-graph.json','original-runtime-pack.json','original-runtime-pack.md','original-timeline.json','original-timeline.md','original-search-index.json','original-search-index.md','original-entity-index.json','original-relationship-candidates.json','stories/original-summary-index.json'
  ];
  for(const f of curatedImportant) addIfFile(files, worldRoot, path.join(curatedRoot,f), 'curated-runtime-artifact');
  for(const p of listFiles(path.join(curatedRoot,'stories'), p => /original-(chapter-events|plot-increment).*\.json$/.test(path.basename(p)))) addIfFile(files, worldRoot, p, 'curated-increment');
  for(const p of listFiles(path.join(curatedRoot,'stories','summaries'), p => p.endsWith('.md'))) addIfFile(files, worldRoot, p, 'curated-volume-summary');
  const byRole={};
  for(const f of files){ byRole[f.role]=(byRole[f.role]||0)+1; }
  const manifestOut={
    schema:'rp-original-provenance-manifest-v1',
    worldId:world,
    createdAt:NOW,
    policy:'SHA-256 fingerprints for raw source files and derived curated artifacts. Use this to detect drift before future refinement iterations.',
    coverage:{ files:files.length, sourceFiles, sourceBytes, byRole },
    files
  };
  const outPath=path.join(curatedRoot,'original-provenance-manifest.json');
  writeJson(outPath, manifestOut);
  let md=`# ${world} Original Provenance Manifest\n\n更新日期：${NOW}\n\n`;
  md+='用途：记录 raw-text 与派生精修产物的 SHA-256 指纹，后续迭代前可检测源文件或派生产物是否漂移。\n\n';
  md+=`- Files: ${files.length}\n- Source files: ${sourceFiles}\n- Source bytes: ${sourceBytes}\n\n`;
  md+='## By Role\n\n| role | count |\n|---|---:|\n';
  for(const [role,count] of Object.entries(byRole).sort()) md+=`| ${role} | ${count} |\n`;
  md+='\n## Files\n\n| role | path | bytes | sha256 |\n|---|---|---:|---|\n';
  for(const f of files) md+=`| ${f.role} | \`${f.path}\` | ${f.bytes} | \`${f.sha256}\` |\n`;
  fs.writeFileSync(path.join(curatedRoot,'original-provenance-manifest.md'),md,'utf8');
  const runtimePath=path.join(curatedRoot,'original-runtime-pack.json');
  if(exists(runtimePath)){
    const runtime=readJson(runtimePath);
    runtime.files=runtime.files||{};
    runtime.files.provenanceManifest='curated/original-provenance-manifest.json';
    runtime.files.provenanceManifestMarkdown='curated/original-provenance-manifest.md';
    runtime.coverage=runtime.coverage||{};
    runtime.coverage.provenanceFiles=files.length;
    runtime.coverage.sourceFiles=sourceFiles;
    runtime.coverage.sourceBytes=sourceBytes;
    runtime.updatedAt=NOW;
    writeJson(runtimePath,runtime);
  }
  return { world, files:files.length, sourceFiles, sourceBytes, byRole };
}
function validateJson(){
  const files=[];
  function walk(d){ if(!exists(d)) return; for(const f of fs.readdirSync(d)){ const p=path.join(d,f); const st=fs.statSync(p); if(st.isDirectory()) walk(p); else if(p.endsWith('.json')) files.push(p); } }
  walk(ROOT); walk(REPORT_DIR);
  const bad=[];
  for(const f of files){ try{ JSON.parse(fs.readFileSync(f,'utf8')); }catch(e){ bad.push({file:rel(f),error:e.message}); } }
  return { filesChecked:files.length, bad };
}
function main(){
  ensureDir(REPORT_DIR);
  const worlds=fs.readdirSync(ROOT).filter(w=>exists(path.join(ROOT,w,'sources','raw-text-manifest.json'))).sort();
  const reports=worlds.map(buildWorld).filter(Boolean);
  const validation=validateJson();
  writeJson(path.join(REPORT_DIR,'original-provenance-report.json'),{createdAt:NOW,reports,validation});
  let md=`# Original Provenance Report\n\n更新日期：${NOW}\n\n`;
  md+='本轮为所有已入库原著正文世界生成 SHA-256 provenance manifest，并把入口写入 runtime pack。\n\n';
  md+=`JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\n`;
  md+='| world | fingerprinted files | raw source files | raw source bytes |\n|---|---:|---:|---:|\n';
  for(const r of reports) md+=`| ${r.world} | ${r.files} | ${r.sourceFiles} | ${r.sourceBytes} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR,'original-provenance-report.md'),md,'utf8');
  console.log(JSON.stringify({ok:validation.bad.length===0,reports,validation},null,2));
}
main();
