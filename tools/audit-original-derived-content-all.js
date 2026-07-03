const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT_DIR = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function exists(p){ return fs.existsSync(p); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ ensureDir(path.dirname(p)); fs.writeFileSync(p,JSON.stringify(v,null,2),'utf8'); }
function rel(p){ return p.split(path.sep).join('/'); }
function compact(s){ return String(s||'').replace(/\s+/g,'').replace(/[「」『』“”‘’《》【】（）()，。！？、：；,.!?;:]/g,''); }
function collectJson(){
  const files=[];
  function walk(d){ if(!exists(d)) return; for(const f of fs.readdirSync(d)){ const p=path.join(d,f); const st=fs.statSync(p); if(st.isDirectory()) walk(p); else if(p.endsWith('.json')) files.push(p); } }
  walk(ROOT); walk(REPORT_DIR);
  const bad=[]; for(const f of files){ try{ JSON.parse(fs.readFileSync(f,'utf8')); } catch(e){ bad.push({file:rel(f),error:e.message}); } }
  return { filesChecked:files.length, bad };
}
function sampledRawFingerprints(worldRoot, chapters){
  const grams = new Set();
  for(const ch of chapters){
    const p=path.join(worldRoot,ch.file);
    if(!exists(p)) continue;
    const c=compact(fs.readFileSync(p,'utf8'));
    if(c.length < 80) continue;
    const step=Math.max(40, Math.floor(c.length/30));
    for(let i=0;i+48<=c.length;i+=step) grams.add(c.slice(i,i+48));
    if(c.length>=48) grams.add(c.slice(Math.max(0,c.length-48)));
  }
  return grams;
}
function checkDerivedAgainstRaw(world, series, volume){
  const worldRoot=path.join(ROOT,world);
  const summaryPath=path.join(worldRoot,'curated','stories','summaries',series.seriesSlug,`${volume.dir}.md`);
  const issues=[];
  if(!exists(summaryPath)) return [{type:'missing-summary', path:rel(summaryPath)}];
  const summary=fs.readFileSync(summaryPath,'utf8');
  const summaryCompact=compact(summary);
  const grams=sampledRawFingerprints(worldRoot, volume.chapters||[]);
  for(const g of grams){
    if(g.length>=48 && summaryCompact.includes(g)){
      issues.push({type:'possible-long-verbatim-overlap', summaryPath:rel(summaryPath), volume:`${series.seriesSlug}/${volume.dir}`, fingerprint:g.slice(0,24)+'…'});
      if(issues.length>=5) break;
    }
  }
  const longLines=summary.split(/\r?\n/).map((line,i)=>({line:i+1,text:line})).filter(x=>x.text.length>1200 && !x.text.startsWith('|'));
  for(const l of longLines.slice(0,5)) issues.push({type:'very-long-derived-line', summaryPath:rel(summaryPath), line:l.line, chars:l.text.length});
  if(!summary.includes('## 章节事件索引')) issues.push({type:'missing-chapter-event-index', summaryPath:rel(summaryPath)});
  if(!summary.includes('source-backed') && !summary.includes('chapter-event-refined') && !summary.includes('正式摘要')) issues.push({type:'missing-source-backed-status', summaryPath:rel(summaryPath)});
  return issues;
}
function checkRuntimeNoRaw(world){
  const issues=[];
  const runtimePath=path.join(ROOT,world,'curated','original-runtime-pack.json');
  if(!exists(runtimePath)) return [{type:'missing-runtime-pack', path:rel(runtimePath)}];
  const runtimeText=fs.readFileSync(runtimePath,'utf8');
  const forbidden=['raw-text/danmachi-main/vol-07/06-第五章 杀生石.txt'];
  for(const f of forbidden){ if(runtimeText.includes('滴答，滴答')) issues.push({type:'raw-prose-in-runtime', path:rel(runtimePath), marker:f}); }
  if(runtimeText.length>5_000_000) issues.push({type:'runtime-pack-too-large', path:rel(runtimePath), bytes:runtimeText.length});
  return issues;
}
function processWorld(world){
  const worldRoot=path.join(ROOT,world);
  const manifestPath=path.join(worldRoot,'sources','raw-text-manifest.json');
  if(!exists(manifestPath)) return null;
  const manifest=readJson(manifestPath);
  const issues=[];
  let volumes=0, chapters=0, summariesChecked=0;
  for(const series of manifest.series||[]){
    for(const volume of series.volumes||[]){
      volumes++; chapters += (volume.chapters||[]).length; summariesChecked++;
      issues.push(...checkDerivedAgainstRaw(world,series,volume));
    }
  }
  issues.push(...checkRuntimeNoRaw(world));
  const report={world, volumes, chapters, summariesChecked, issues};
  const outPath=path.join(worldRoot,'curated','original-derived-content-safety.json');
  writeJson(outPath,{schema:'rp-original-derived-content-safety-v1',worldId:world,createdAt:NOW,policy:'Derived summaries and runtime packs should avoid long verbatim source prose; raw text remains source artifact only.',...report});
  let md=`# ${world} Derived Content Safety\n\n更新日期：${NOW}\n\n`;
  md+=`- Volumes checked: ${volumes}\n- Chapters covered: ${chapters}\n- Summaries checked: ${summariesChecked}\n- Issues: ${issues.length}\n\n`;
  if(issues.length) md+='## Issues\n\n'+issues.map(x=>`- ${x.type}: ${x.summaryPath||x.path||x.volume||''}`).join('\n')+'\n';
  fs.writeFileSync(path.join(worldRoot,'curated','original-derived-content-safety.md'),md,'utf8');
  const runtimePath=path.join(worldRoot,'curated','original-runtime-pack.json');
  if(exists(runtimePath)){
    const runtime=readJson(runtimePath);
    runtime.files=runtime.files||{};
    runtime.files.derivedContentSafety='curated/original-derived-content-safety.json';
    runtime.files.derivedContentSafetyMarkdown='curated/original-derived-content-safety.md';
    runtime.coverage=runtime.coverage||{};
    runtime.coverage.derivedSafetyIssues=issues.length;
    runtime.updatedAt=NOW;
    writeJson(runtimePath,runtime);
  }
  return {world, volumes, chapters, summariesChecked, issues:issues.length};
}
function main(){
  ensureDir(REPORT_DIR);
  const worlds=fs.readdirSync(ROOT).filter(w=>exists(path.join(ROOT,w,'sources','raw-text-manifest.json'))).sort();
  const reports=worlds.map(processWorld).filter(Boolean);
  const validation=collectJson();
  const totalIssues=reports.reduce((n,r)=>n+r.issues,0);
  writeJson(path.join(REPORT_DIR,'original-derived-content-safety-report.json'),{createdAt:NOW,reports,totalIssues,validation});
  let md=`# Original Derived Content Safety Report\n\n更新日期：${NOW}\n\n`;
  md+='本轮检查派生摘要/runtime pack 是否出现明显长段原文泄漏、缺失章节事件索引或异常长行。\n\n';
  md+=`JSON checked: ${validation.filesChecked}\n\nBad JSON: ${validation.bad.length}\n\nTotal issues: ${totalIssues}\n\n`;
  md+='| world | volumes | chapters | summaries checked | issues |\n|---|---:|---:|---:|---:|\n';
  for(const r of reports) md+=`| ${r.world} | ${r.volumes} | ${r.chapters} | ${r.summariesChecked} | ${r.issues} |\n`;
  fs.writeFileSync(path.join(REPORT_DIR,'original-derived-content-safety-report.md'),md,'utf8');
  console.log(JSON.stringify({ok:validation.bad.length===0,totalIssues,reports,validation},null,2));
}
main();
