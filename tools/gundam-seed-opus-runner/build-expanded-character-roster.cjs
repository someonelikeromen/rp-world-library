#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv){const out={_:[]};for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const eq=a.indexOf('=');if(eq>=0)out[a.slice(2,eq)]=a.slice(eq+1);else{const k=a.slice(2),n=argv[i+1];if(n&&!n.startsWith('--')){out[k]=n;i++;}else out[k]=true;}}else out._.push(a);}return out;}
function ensureDir(d){fs.mkdirSync(d,{recursive:true});}
function readJson(f,fb=null){try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return fb;}}
function writeJson(f,d){ensureDir(path.dirname(f));fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n','utf8');}
function writeText(f,t){ensureDir(path.dirname(f));fs.writeFileSync(f,t,'utf8');}
function listFiles(dir,suffix){const out=[];function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d)){const f=path.join(d,e),st=fs.statSync(f);if(st.isDirectory())walk(f);else if(!suffix||f.endsWith(suffix))out.push(f);}}walk(dir);return out.sort();}
function rel(base,f){return path.relative(base,f).replace(/\\/g,'/');}
function cleanName(name){return String(name||'').replace(/^【飞燕惊澜】/,'').replace(/^高达SEED/,'').replace(/人物百科——/,'').replace(/ - 哔哩哔哩$/,'').trim();}
function stripPeriod(name){return cleanName(name).replace(/[（(]CE\d+年?[）)]/gi,'').replace(/[（(]C\.E\.\d+年?[）)]/gi,'').trim();}
function canonicalKey(name){return stripPeriod(name).toLowerCase().replace(/[·・\.\s_\-—/（）()，,]/g,'').replace(/阿兹拉埃尔/g,'阿兹埃尔').replace(/杜兰达尔/g,'迪兰达尔').replace(/米丽雅莉亚/g,'米莉亚莉亚').replace(/塞依/g,'賽伊').replace(/浅葱/g,'阿莎奇').replace(/伍/g,'吴');}
function safeId(name){return String(name||'unknown').replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,120)||'unknown';}
function isGroupLike(name){return /骨干|成员|姐弟|部队|试飞员|三小强|与|和|鱼狗花|队员|船员一览|三人娘|小队|一览/.test(name||'');}
function extractHeading(content){return (String(content||'').match(/^#\s+(.+)$/m)||[])[1]||'';}
function worldbookName(entry){return cleanName(extractHeading(entry.content)||entry.title||entry.comment||'');}
function baseTextFromNorm(c){return [c.name,c.title,(c.sourceBacked&&c.sourceBacked.summary)||'',...(((c.sourceBacked||{}).claims||[]).map(x=>`${x.label}\n${x.text}`)),...(c.interpretationNotes||[]).map(x=>x.text)].join('\n');}
function baseTextFromWb(w){return [w.title,w.comment,w.content,...(w.keys||[])].join('\n');}
function mergeChar(target, source){
  target.names = [...new Set([...(target.names||[]), ...(source.names||[])].filter(Boolean))];
  target.aliases = [...new Set([...(target.aliases||[]), ...(source.aliases||[])].filter(Boolean))];
  target.layers = [...new Set([...(target.layers||[]), source.layer].filter(Boolean))];
  target.sourceRefs = [...new Set([...(target.sourceRefs||[]), ...(source.sourceRefs||[])].filter(Boolean))];
  target.sourceRecordRefs = [...new Set([...(target.sourceRecordRefs||[]), ...(source.sourceRecordRefs||[])].filter(Boolean))];
  target.seedRefs = [...new Set([...(target.seedRefs||[]), ...(source.seedRefs||[])].filter(Boolean))];
  target.evidenceRefs = [...(target.evidenceRefs||[]), ...(source.evidenceRefs||[])];
  target.periods = [...new Set([...(target.periods||[]), ...(source.periods||[])].filter(Boolean))];
  target.continuityLayers = [...new Set([...(target.continuityLayers||[]), ...(source.continuityLayers||[])].filter(Boolean))];
  target.summaryCandidates = [...(target.summaryCandidates||[]), ...(source.summaryCandidates||[])].filter(Boolean).slice(0,8);
  target.groupDerived = target.groupDerived || source.groupDerived || false;
  return target;
}
function periodFromName(name){const m=String(name||'').match(/CE\d+|C\.E\.\d+/i);return m?m[0].replace('C.E.','CE'):'';}
function sourceCharFromNorm(item,file,planDir){const name=stripPeriod(item.name);return {key:canonicalKey(name),names:[name],aliases:[...(item.aliases||[]).map(stripPeriod),item.name].filter(Boolean),layer:item.normalizedLayer||'unknown',sourceRefs:item.sourceRefs||[],sourceRecordRefs:item.sourceRecordRefs||[],seedRefs:[],evidenceRefs:[rel(planDir,file)],periods:[periodFromName(item.name)],continuityLayers:[item.continuityLayer||item.normalizedLayer],summaryCandidates:[(item.sourceBacked&&item.sourceBacked.summary)||''],raw:item};}
function sourceCharFromWorldbook(entry,file,planDir){const nm=worldbookName(entry);const name=stripPeriod(nm);return {key:canonicalKey(name),names:[name],aliases:[nm,...(entry.keys||[])].filter(Boolean),layer:entry.scope==='seed_core'?'worldbook-seed-base':'worldbook-seed-extension',sourceRefs:[entry.sourceRef].filter(Boolean),sourceRecordRefs:[],seedRefs:[entry.seedId].filter(Boolean),evidenceRefs:[rel(planDir,file)],periods:[],continuityLayers:[entry.scope||'worldbook-seed'],summaryCandidates:[String(entry.content||'').split('\n').slice(1,5).join('\n').slice(0,800)],raw:entry};}
function findMembers(groupText, known){const members=[];for(const k of known){const aliases=[...(k.aliases||[]),...(k.names||[])].filter(a=>a&&a.length>=2&&a.length<=30).sort((a,b)=>b.length-a.length);if(aliases.some(a=>groupText.includes(a))){members.push({characterId:k.characterId,matchedAlias:aliases.find(a=>groupText.includes(a)),name:k.primaryName});}}
  return Object.values(Object.fromEntries(members.map(m=>[m.characterId,m])));
}
const hardGroups={
  '嗑药三小强':['史汀克','奥尔','史黛拉'],
  '萨哈克姐弟':['罗ンド·吉纳·萨哈克','隆德·蜜纳·萨哈克','萨哈克姐弟'],
  '缪蒂和夏姆斯':['缪蒂','夏姆斯'],
  '姜凯利与爱德华':['姜凯利','爱德华'],
  '鱼狗花':['史汀克','奥尔','史黛拉'],
  '奥布猎豹部队':['巴瑞·何','奥布猎豹部队'],
  '2ND试飞员':['2ND试飞员'],
  'AA骨干':['玛琉','穆','娜塔尔','米莉亚莉亚','賽伊','卡兹','托尔']
};
function addHardMembers(groupName, roster){const arr=[];for(const [k,names] of Object.entries(hardGroups)){if(groupName.includes(k)){for(const n of names){const key=canonicalKey(n);const hit=roster.find(r=>r.key===key||r.aliases.some(a=>canonicalKey(a)===key));arr.push(hit?{characterId:hit.characterId,name:hit.primaryName,matchedAlias:n}:{characterId:`char-${safeId(n)}`,name:n,matchedAlias:n,needsSeed:true});}}}return arr;}
function md(report){const lines=['# Gundam SEED Expanded Character Roster','',`- Generated: ${report.generatedAt}`,`- Individual characters: ${report.counts.individualCharacters}`,`- Character groups: ${report.counts.characterGroups}`,`- Worldbook seed characters: ${report.counts.worldbookSeedCharacters}`,`- Bilibili normalized character entries: ${report.counts.bilibiliCharacterEntries}`,'','## Counts','','| Layer | Count |','|---|---:|'];for(const [k,v] of Object.entries(report.counts.byLayer))lines.push(`| ${k} | ${v} |`);lines.push('','## Notes','','- Bilibili group entries were preserved in `character-groups.json`.','- Worldbook entries are seed/reference content and do not override Bilibili source-backed claims.','- Hardcoded group expansion is marked in membership evidence and remains review-needed when no independent source entry exists.','');return lines.join('\n');}
function main(){const args=parseArgs(process.argv.slice(2));const planDir=args.planDir||'campaigns/world-library/manual-curation/gundam-seed-opus-p1-style';const normFiles=[...listFiles(path.join(planDir,'normalized','base-seed','characters'),'.json'),...listFiles(path.join(planDir,'normalized','extension-candidates','characters'),'.json')];const wbFiles=listFiles(path.join(planDir,'worldbook-seed','entries'),'.json').filter(f=>(readJson(f)||{}).category==='character');const groups=[];const map=new Map();
  function add(src){if(!src.key)return; if(!map.has(src.key)){map.set(src.key,{characterId:`char-${safeId(src.names[0])}`,primaryName:src.names[0],key:src.key,names:[],aliases:[],layers:[],sourceRefs:[],sourceRecordRefs:[],seedRefs:[],evidenceRefs:[],periods:[],continuityLayers:[],summaryCandidates:[],groupDerived:false});}mergeChar(map.get(src.key),src);}
  const groupSources=[];
  for(const f of normFiles){const item=readJson(f);if(!item)continue;const name=stripPeriod(item.name);if(isGroupLike(name)){groupSources.push({source:'bilibili',name,item,file:f,text:baseTextFromNorm(item),layer:item.normalizedLayer});}else add(sourceCharFromNorm(item,f,planDir));}
  for(const f of wbFiles){const item=readJson(f);if(!item)continue;const name=stripPeriod(worldbookName(item));if(isGroupLike(name)){groupSources.push({source:'worldbook',name,item,file:f,text:baseTextFromWb(item),layer:item.scope});}else add(sourceCharFromWorldbook(item,f,planDir));}
  let roster=[...map.values()];
  for(const g of groupSources){let members=findMembers(g.text,roster);const hard=addHardMembers(g.name,roster);for(const h of hard){if(h.needsSeed&&!roster.some(r=>r.characterId===h.characterId)){const rec={characterId:h.characterId,primaryName:h.name,key:canonicalKey(h.name),names:[h.name],aliases:[h.name],layers:['group-derived-review-needed'],sourceRefs:[],sourceRecordRefs:[],seedRefs:[],evidenceRefs:[rel(planDir,g.file)],periods:[],continuityLayers:['group-derived'],summaryCandidates:[`Derived from group entry ${g.name}; requires review.`],groupDerived:true};roster.push(rec);map.set(rec.key,rec);}members.push(h);}members=Object.values(Object.fromEntries(members.map(m=>[m.characterId,m])));
    groups.push({groupId:`group-${safeId(g.name)}`,name:g.name,source:g.source,layer:g.layer,groupEntryRef:rel(planDir,g.file),members,memberCount:members.length,splitStatus:members.length?'split-with-review':'unsplit-needs-review'});
  }
  roster=Object.values(Object.fromEntries(roster.map(r=>[r.characterId,r]))).sort((a,b)=>a.primaryName.localeCompare(b.primaryName,'zh'));
  for(const r of roster){r.names=[...new Set(r.names.filter(Boolean))];r.aliases=[...new Set(r.aliases.filter(Boolean))];r.layers=[...new Set(r.layers.filter(Boolean))];r.sourceRefs=[...new Set(r.sourceRefs.filter(Boolean))];r.seedRefs=[...new Set(r.seedRefs.filter(Boolean))];r.reviewStatus=r.groupDerived?'needs-independent-source-review':'candidate';}
  const byLayer={};for(const r of roster){for(const l of r.layers||['unknown'])byLayer[l]=(byLayer[l]||0)+1;}
  const report={schema:'gundam-seed-expanded-character-roster-report-v1',generatedAt:new Date().toISOString(),counts:{individualCharacters:roster.length,characterGroups:groups.length,bilibiliCharacterEntries:normFiles.length,worldbookSeedCharacters:wbFiles.length,byLayer:Object.fromEntries(Object.entries(byLayer).sort())},policy:{worldbookSeedDoesNotOverrideBilibili:true,groupsPreserved:true,groupDerivedNeedsReview:true},outputs:{charactersExpanded:'candidates/curated-draft/characters-expanded.json',characterGroups:'candidates/curated-draft/character-groups.json'},sampleGroups:groups.slice(0,20)};
  writeJson(path.join(planDir,'candidates','curated-draft','characters-expanded.json'),{schema:'gundam-seed-characters-expanded-v1',generatedAt:report.generatedAt,count:roster.length,items:roster});
  writeJson(path.join(planDir,'candidates','curated-draft','character-groups.json'),{schema:'gundam-seed-character-groups-v1',generatedAt:report.generatedAt,count:groups.length,items:groups});
  writeJson(path.join(planDir,'reports','expanded-character-roster-report.json'),report);writeText(path.join(planDir,'reports','expanded-character-roster-report.md'),md(report));console.log(JSON.stringify({ok:true,report:path.join(planDir,'reports','expanded-character-roster-report.json'),counts:report.counts},null,2));}
main();
