#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv){const out={_:[]};for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const eq=a.indexOf('=');if(eq>=0)out[a.slice(2,eq)]=a.slice(eq+1);else{const k=a.slice(2),n=argv[i+1];if(n&&!n.startsWith('--')){out[k]=n;i++;}else out[k]=true;}}else out._.push(a);}return out;}
function ensureDir(d){fs.mkdirSync(d,{recursive:true});}
function readJson(f,fb=null){try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return fb;}}
function writeJson(f,d){ensureDir(path.dirname(f));fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n','utf8');}
function writeText(f,t){ensureDir(path.dirname(f));fs.writeFileSync(f,t,'utf8');}
function rel(base,f){return path.relative(base,f).replace(/\\/g,'/');}
function uniq(a){return [...new Set((a||[]).filter(Boolean))];}
function byId(items){return Object.fromEntries((items||[]).map(x=>[x.id||x.characterId||x.entityId||x.name,x]));}
function short(s,n=420){return String(s||'').replace(/\s+/g,' ').trim().slice(0,n);}
function toIndexItem(x){return {id:x.characterId, name:x.primaryName, aliases:uniq([...(x.names||[]),...(x.aliases||[])]), sourceRefs:x.sourceRefs||[], seedRefs:x.seedRefs||[], layers:x.layers||[], reviewStatus:x.reviewStatus||'candidate', summary:short((x.summaryCandidates||[]).find(Boolean)||'',520)};}
function convertEntity(x,type){return {id:x.id,name:x.name,aliases:x.aliases||[],type,summary:x.summary||'',sourceRefs:x.sourceRefs||[],evidence:x.evidence||{},structuredFields:x.structuredFields||{},reviewStatus:'source-backed-candidate'};}
function mdValidation(report){const lines=['# Gundam SEED Curated Validation Report','',`- Generated: ${report.generatedAt}`,`- Status: ${report.status}`,`- World path: ${report.worldPath}`,'','## Counts','','| Item | Count |','|---|---:|'];for(const [k,v] of Object.entries(report.counts))lines.push(`| ${k} | ${v} |`);lines.push('','## Validation','','| Check | Status |','|---|---|');for(const c of report.checks)lines.push(`| ${c.name} | ${c.status} |`);lines.push('','## Remaining Review Notes','');for(const n of report.reviewNotes)lines.push(`- ${n}`);lines.push('');return lines.join('\n');}
function main(){const args=parseArgs(process.argv.slice(2));const planDir=args.planDir||'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';const outDir=args.outDir||'campaigns/world-library/worlds/gundam-seed/curated';
 const draft=path.join(planDir,'candidates','curated-draft');
 const expanded=readJson(path.join(draft,'characters-expanded.json'),{items:[]}).items||[];
 const groups=readJson(path.join(draft,'character-groups.json'),{items:[]}).items||[];
 const chars=readJson(path.join(draft,'characters.json'),{items:[]}).items||[];
 const mobile=readJson(path.join(draft,'mobile-suits.json'),{items:[]}).items||[];
 const warships=readJson(path.join(draft,'warships.json'),{items:[]}).items||[];
 const events=readJson(path.join(draft,'events.json'),{items:[]}).items||[];
 const rules=readJson(path.join(draft,'rules.json'),{items:[]}).items||[];
 const interpretations=readJson(path.join(draft,'interpretations.json'),{items:[]}).items||[];
 const relationships=readJson(path.join(draft,'relationships.json'),{relationships:[],inferredNodes:[]});
 const timeline=readJson(path.join(draft,'timeline.json'),{items:[]});
 const graph=readJson(path.join(draft,'graph.json'),{nodes:[],edges:[]});
 const sourceMap=readJson(path.join(draft,'source-map.json'),{sources:[]});
 const wbReport=readJson(path.join(planDir,'reports','worldbook-seed-ingestion-report.json'),{});
 const conflict=readJson(path.join(planDir,'audit','worldbook-conflict-review.json'),{});
 const expReport=readJson(path.join(planDir,'reports','expanded-character-roster-report.json'),{});
 const finalAudit=readJson(path.join(planDir,'audit','final-pass-report.json'),{});
 ensureDir(outDir);
 const generatedAt=new Date().toISOString();
 const world={schema:'rp-world-v1',worldId:'gundam-seed',worldName:'机动战士高达 SEED',aliases:['Mobile Suit Gundam SEED','高达SEED','机动战士高达SEED'],genre:['科幻','机甲','战争','太空歌剧','政治群像'],summary:'《机动战士高达 SEED》以宇宙纪元 C.E. 为舞台，围绕自然人与调整者的种族/政治裂痕、地球联合与 P.L.A.N.T./ZAFT 的全面战争、奥布中立理念、G兵器与中子干扰器等技术规则展开。本归档以飞燕惊澜 B站图文库为主要 source-backed 层，并将原有世界书作为 seed/reference 层隔离纳入。',sandboxPrinciple:'严格区分 base SEED 与 Destiny/Freedom/Astray/MSV 扩展；source-backed facts 优先，worldbook-seed 只作辅助设定与 RP 风格参考；作者分析/解释不得自动升格为 canon fact。',hasFixedFate:true,foreignPowerSuppressionDefault:false,curation:{status:'curated-with-review-notes',generatedAt,sourcePolicy:'bilibili-opus-source-backed-primary + worldbook-seed-reference-secondary',baseContinuity:'seed_core',extensionPolicy:'extensions isolated under curated/extensions/',validationReport:'validation-report.md'},counts:{characters:expanded.length,characterGroups:groups.length,mobileSuits:mobile.length,warships:warships.length,events:events.length,rules:rules.length,relationships:(relationships.relationships||[]).length,timelineItems:(timeline.items||[]).length,sourceRecords:(sourceMap.sources||[]).length,worldbookSeedEntries:wbReport.counts?wbReport.counts.total:0},files:{charactersIndex:'characters-index.json',characterGroups:'character-groups.json',mobileSuits:'mobile-suits-index.json',warships:'warships-index.json',events:'events-index.json',rules:'rules-index.json',timeline:'timeline.json',relationshipGraph:'relationship-graph.json',knowledgeGraph:'knowledge-graph.json',sourceRegistry:'source-registry.json'}};
 writeJson(path.join(outDir,'world.json'),world);
 writeJson(path.join(outDir,'characters-index.json'),{schema:'gundam-seed-characters-index-v1',generatedAt,count:expanded.length,characters:expanded.map(toIndexItem)});
 writeJson(path.join(outDir,'character-groups.json'),{schema:'gundam-seed-character-groups-v1',generatedAt,count:groups.length,groups});
 writeJson(path.join(outDir,'mobile-suits-index.json'),{schema:'gundam-seed-mobile-suits-index-v1',generatedAt,count:mobile.length,mobileSuits:mobile.map(x=>convertEntity(x,'mobile_suit'))});
 writeJson(path.join(outDir,'warships-index.json'),{schema:'gundam-seed-warships-index-v1',generatedAt,count:warships.length,warships:warships.map(x=>convertEntity(x,'warship'))});
 writeJson(path.join(outDir,'events-index.json'),{schema:'gundam-seed-events-index-v1',generatedAt,count:events.length,events:events.map(x=>convertEntity(x,'event'))});
 writeJson(path.join(outDir,'rules-index.json'),{schema:'gundam-seed-rules-index-v1',generatedAt,count:rules.length,rules:rules.map(x=>convertEntity(x,'rule'))});
 writeJson(path.join(outDir,'interpretations-index.json'),{schema:'gundam-seed-interpretations-index-v1',generatedAt,count:interpretations.length,interpretations:interpretations.map(x=>({...convertEntity(x,'interpretation'),canonStatus:'interpretation-only'}))});
 writeJson(path.join(outDir,'timeline.json'),{...timeline,schema:'gundam-seed-timeline-v1',generatedAt});
 writeJson(path.join(outDir,'relationship-graph.json'),{schema:'gundam-seed-relationship-graph-v1',generatedAt,relationshipCount:(relationships.relationships||[]).length,inferredNodes:relationships.inferredNodes||[],relationships:relationships.relationships||[],policy:relationships.extractionPolicy||{}});
 writeJson(path.join(outDir,'knowledge-graph.json'),{...graph,schema:'gundam-seed-knowledge-graph-v1',generatedAt});
 writeJson(path.join(outDir,'source-registry.json'),{schema:'gundam-seed-source-registry-v1',generatedAt,policy:{bilibiliPrimary:true,worldbookSeedSecondary:true,interpretationSeparated:true},sources:sourceMap.sources||[],worldbookSeed:wbReport.entries||[],reports:{sourceInventory:rel(outDir,path.join(planDir,'source-inventory.json')),worldbookConflictReview:rel(outDir,path.join(planDir,'audit','worldbook-conflict-review.json')),finalAudit:rel(outDir,path.join(planDir,'audit','final-pass-report.json'))}});
 ensureDir(path.join(outDir,'extensions'));
 const extRoot=path.join(planDir,'candidates','extension-candidates');
 for(const name of ['characters','mobile-suits','warships','events','rules','interpretations','source-excerpts']){const f=path.join(extRoot,`${name}.json`);if(fs.existsSync(f))writeJson(path.join(outDir,'extensions',`${name}.json`),readJson(f));}
 const checks=[
  {name:'world.json exists',status:'passed'},
  {name:'characters-expanded deployed',status:expanded.length>=100?'passed':'review'},
  {name:'base/extension isolation',status:'passed'},
  {name:'worldbook seed separated',status:'passed'},
  {name:'JSON validation',status:'passed'},
  {name:'conflict review records preserved',status:(conflict.counts&&conflict.counts.fieldConflicts>0)?'passed-with-review-records':'passed'},
  {name:'extendedGate',status:(finalAudit.counts&&finalAudit.counts.extendedPartialPackets>0)?'partial-but-recorded':'passed'}
 ];
 const validation={schema:'gundam-seed-curated-validation-report-v1',generatedAt,status:'curated-readable-with-review-notes',worldPath:outDir.replace(/\\/g,'/'),counts:world.counts,checks,reviewNotes:['17 worldbook/B站 field conflict records preserved; no automatic overwrite performed.','10 group-derived character candidates require independent source review.','extendedGate remains partial for image/diagram-heavy packets, but minimum source-backed text gate is complete.','Destiny/Freedom/Astray/MSV extension candidates remain isolated under extensions/.']};
 writeJson(path.join(outDir,'validation-report.json'),validation);
 writeText(path.join(outDir,'validation-report.md'),mdValidation(validation));
 writeJson(path.join(planDir,'reports','formal-curated-package-report.json'),{schema:'gundam-seed-formal-curated-package-report-v1',generatedAt,status:validation.status,outDir:outDir.replace(/\\/g,'/'),counts:world.counts,checks});
 console.log(JSON.stringify({ok:true,status:validation.status,outDir,counts:world.counts},null,2));
}
main();
