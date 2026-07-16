const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const REPORT = 'campaigns/world-library/manual-curation/reports';
const NOW = new Date().toISOString();

const WORLD_CN = {
  'campione': '弑神者！',
  'danmachi': '在地下城寻求邂逅是否搞错了什么',
  'hidan-no-aria': '绯弹的亚里亚',
  'high-school-dxd': '恶魔高校D×D',
  'infinite-stratos': 'IS〈Infinite Stratos〉',
  'rakudai-kishi': '落第骑士英雄谭',
  'saijaku-muhai-bahamut': '最弱无败神装机龙',
  'type-moon-nasuverse': '型月 / Nasuverse'
};
const CLASS_CN = {
  'wenku-rawtext-original-archive': 'Wenku/raw-text 原著归档',
  'existing-curated-story-archive': '既有 curated 剧情归档',
  'no-original-or-story-archive-detected': '未检测到剧情/原著归档产物'
};

function exists(p){ return fs.existsSync(p); }
function readJson(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p,v){ fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, JSON.stringify(v,null,2), 'utf8'); }
function walkFiles(d, pred=()=>true){
  const out=[];
  function walk(x){
    if(!exists(x)) return;
    for(const f of fs.readdirSync(x)){
      const p=path.join(x,f);
      const st=fs.statSync(p);
      if(st.isDirectory()) walk(p);
      else if(pred(p,st)) out.push(p);
    }
  }
  walk(d);
  return out;
}
function jsonOk(p){ try{ JSON.parse(fs.readFileSync(p,'utf8')); return true; } catch { return false; } }
function bytes(files){ return files.reduce((n,f)=>n+fs.statSync(f).size,0); }
function countArrayJson(p, key){ if(!exists(p)) return null; try{ const j=readJson(p); return Array.isArray(j) ? j.length : Array.isArray(j[key]) ? j[key].length : null; } catch { return null; } }
function graphCount(p){
  if(!exists(p)) return {exists:false,nodes:null,edges:null};
  try{ const j=readJson(p); return {exists:true,nodes:Array.isArray(j.nodes)?j.nodes.length:null,edges:Array.isArray(j.edges)?j.edges.length:null}; }
  catch{ return {exists:true,nodes:null,edges:null,bad:true}; }
}
function sourceRegistryCount(p){
  if(!exists(p)) return null;
  try{
    const j=readJson(p);
    if(Array.isArray(j.sources)) return j.sources.length;
    if(Array.isArray(j)) return j.length;
    if(j.sources && typeof j.sources === 'object') return Object.keys(j.sources).length;
    return Object.keys(j).length;
  } catch { return null; }
}
function classifyWorld(world){
  const root=path.join(ROOT, world);
  const curated=path.join(root,'curated');
  const stories=path.join(curated,'stories');
  const sources=path.join(root,'sources');
  const files=walkFiles(root);
  const md=files.filter(f=>f.endsWith('.md'));
  const json=files.filter(f=>f.endsWith('.json'));
  const txt=files.filter(f=>f.endsWith('.txt'));
  const storyMd=walkFiles(stories, p=>p.endsWith('.md'));
  const chapterMeta=walkFiles(path.join(stories,'chapter-metadata'), p=>p.endsWith('.chapters.json'));
  let chapterMetaEntries=0;
  for(const f of chapterMeta){ try{ const j=readJson(f); chapterMetaEntries += Array.isArray(j.chapters) ? j.chapters.length : Array.isArray(j) ? j.length : 0; } catch{} }
  const rawTxt=walkFiles(path.join(sources,'raw-text'), p=>p.endsWith('.txt'));
  const hasOriginalRuntime=exists(path.join(curated,'original-runtime-pack.json'));
  const hasExistingStoryArchive=storyMd.length>0 || chapterMeta.length>0 || exists(path.join(curated,'plot-graph.json')) || exists(path.join(curated,'relationship-graph.json'));
  const plot=graphCount(path.join(curated,'plot-graph.json'));
  const relationship=graphCount(path.join(curated,'relationship-graph.json'));
  const knowledge=graphCount(path.join(curated,'knowledge-graph.json'));
  const characters=countArrayJson(path.join(curated,'characters-index.json'),'characters');
  const sourceRegistry=sourceRegistryCount(path.join(curated,'source-registry.json'));
  const storyIndex=exists(path.join(stories,'index.json')) ? readJson(path.join(stories,'index.json')) : null;
  const storyIndexCount=storyIndex ? (Array.isArray(storyIndex.stories) ? storyIndex.stories.length : Array.isArray(storyIndex) ? storyIndex.length : Object.keys(storyIndex).length) : null;
  let runtimeSourceLayer = null;
  if (hasOriginalRuntime) {
    try { runtimeSourceLayer = readJson(path.join(curated,'original-runtime-pack.json')).sourceLayer || null; } catch {}
  }
  const classification = rawTxt.length > 0 && runtimeSourceLayer !== 'existing-curated-derived'
    ? 'wenku-rawtext-original-archive'
    : hasExistingStoryArchive || hasOriginalRuntime
      ? 'existing-curated-story-archive'
      : 'no-original-or-story-archive-detected';
  return {
    world,
    worldNameCn: WORLD_CN[world] || world,
    classification,
    classificationCn: CLASS_CN[classification],
    totalFiles: files.length,
    bytes: bytes(files),
    jsonFiles: json.length,
    markdownFiles: md.length,
    textFiles: txt.length,
    rawTextFiles: rawTxt.length,
    storyMarkdownFiles: storyMd.length,
    chapterMetadataFiles: chapterMeta.length,
    chapterMetadataEntries: chapterMetaEntries || 0,
    storyIndexEntries: storyIndexCount,
    sourceRegistryEntries: sourceRegistry,
    characters: characters || 0,
    plotGraphNodes: plot.exists ? plot.nodes : null,
    plotGraphEdges: plot.exists ? plot.edges : null,
    relationshipGraphNodes: relationship.exists ? relationship.nodes : null,
    relationshipGraphEdges: relationship.exists ? relationship.edges : null,
    knowledgeGraphNodes: knowledge.exists ? knowledge.nodes : null,
    knowledgeGraphEdges: knowledge.exists ? knowledge.edges : null,
    hasPlotGraph: plot.exists,
    hasRelationshipGraph: relationship.exists,
    hasKnowledgeGraph: knowledge.exists,
    worldJson: exists(path.join(curated,'world.json')),
    hasOriginalRuntime
  };
}
function collectJson(){
  const files=[...walkFiles(ROOT,p=>p.endsWith('.json')), ...walkFiles(REPORT,p=>p.endsWith('.json'))];
  const bad=[];
  for(const f of files) if(!jsonOk(f)) bad.push(f.split(path.sep).join('/'));
  return {files,bad};
}
function v(x){ return x === null || x === undefined ? '' : String(x); }

const worlds=fs.readdirSync(ROOT).filter(w=>fs.statSync(path.join(ROOT,w)).isDirectory()).sort().map(classifyWorld);
const originalRuntime=worlds.filter(w=>w.classification==='wenku-rawtext-original-archive');
const existingCurated=worlds.filter(w=>w.classification==='existing-curated-story-archive');
const none=worlds.filter(w=>w.classification==='no-original-or-story-archive-detected');
const jsonValidation=collectJson();
const totals={
  worlds: worlds.length,
  wenkuRawtextWorlds: originalRuntime.length,
  existingCuratedStoryWorlds: existingCurated.length,
  noStoryArchiveWorlds: none.length,
  storyMarkdownFiles: worlds.reduce((n,w)=>n+w.storyMarkdownFiles,0),
  chapterMetadataFiles: worlds.reduce((n,w)=>n+w.chapterMetadataFiles,0),
  chapterMetadataEntries: worlds.reduce((n,w)=>n+(w.chapterMetadataEntries||0),0),
  rawTextFiles: worlds.reduce((n,w)=>n+w.rawTextFiles,0),
  plotGraphNodes: worlds.reduce((n,w)=>n+(w.plotGraphNodes||0),0),
  plotGraphEdges: worlds.reduce((n,w)=>n+(w.plotGraphEdges||0),0),
  relationshipGraphNodes: worlds.reduce((n,w)=>n+(w.relationshipGraphNodes||0),0),
  relationshipGraphEdges: worlds.reduce((n,w)=>n+(w.relationshipGraphEdges||0),0),
  knowledgeGraphNodes: worlds.reduce((n,w)=>n+(w.knowledgeGraphNodes||0),0),
  knowledgeGraphEdges: worlds.reduce((n,w)=>n+(w.knowledgeGraphEdges||0),0),
  bytes: worlds.reduce((n,w)=>n+w.bytes,0)
};
const audit={createdAt:NOW, archiveStatus: jsonValidation.bad.length===0 ? '统计完成' : '存在 JSON 问题', totals, worlds, jsonValidation, note:'图谱节点/边已拆分为独立列；中文名用于展示，world 字段保留 slug。'};
writeJson(path.join(REPORT,'all-world-story-archive-coverage-audit.json'), audit);
let md='# 全世界剧情/原著归档覆盖审计\n\n';
md+=`更新日期：${NOW}\n\n`;
md+=`归档统计状态：${audit.archiveStatus}\n\n`;
md+=`JSON 校验数：${jsonValidation.files.length}\n\nJSON 错误：${jsonValidation.bad.length}\n\n`;
md+='说明：原先 “293/1174” 这类写法表示“节点数/边数”；现在已拆成“节点”和“边”两列。\n\n';
md+='## 分类汇总\n\n';
md+=`- 世界总数：${totals.worlds}\n- Wenku/raw-text 原著归档世界：${totals.wenkuRawtextWorlds}\n- 既有 curated 剧情归档世界：${totals.existingCuratedStoryWorlds}\n- 未检测到剧情/原著归档产物世界：${totals.noStoryArchiveWorlds}\n- 剧情 Markdown 文件：${totals.storyMarkdownFiles}\n- 章节元数据文件：${totals.chapterMetadataFiles}\n- 章节元数据条目：${totals.chapterMetadataEntries}\n- raw-text 正文文件：${totals.rawTextFiles}\n- 剧情图：${totals.plotGraphNodes} 节点 / ${totals.plotGraphEdges} 边\n- 关系图：${totals.relationshipGraphNodes} 节点 / ${totals.relationshipGraphEdges} 边\n- 知识图：${totals.knowledgeGraphNodes} 节点 / ${totals.knowledgeGraphEdges} 边\n\n`;
md+='## 世界明细\n\n';
md+='| 世界 | 世界名 | 归档类型 | 剧情 MD | 章节元数据文件 | 章节元数据条目 | raw-text | 角色 | 剧情图节点 | 剧情图边 | 关系图节点 | 关系图边 | 知识图节点 | 知识图边 | source registry |\n';
md+='|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
for(const w of worlds){
  md+=`| ${w.world} | ${w.worldNameCn} | ${w.classificationCn} | ${w.storyMarkdownFiles} | ${w.chapterMetadataFiles} | ${w.chapterMetadataEntries || ''} | ${w.rawTextFiles} | ${w.characters || ''} | ${v(w.plotGraphNodes)} | ${v(w.plotGraphEdges)} | ${v(w.relationshipGraphNodes)} | ${v(w.relationshipGraphEdges)} | ${v(w.knowledgeGraphNodes)} | ${v(w.knowledgeGraphEdges)} | ${w.sourceRegistryEntries ?? ''} |\n`;
}
md+='\n## 既有 curated 剧情归档世界\n\n';
for(const w of existingCurated) md+=`- ${w.worldNameCn}（${w.world}）：剧情 MD ${w.storyMarkdownFiles}，章节元数据 ${w.chapterMetadataFiles} 文件 / ${w.chapterMetadataEntries || 0} 条，关系图 ${w.hasRelationshipGraph?'有':'无'}。\n`;
fs.writeFileSync(path.join(REPORT,'all-world-story-archive-coverage-audit.md'), md, 'utf8');
console.log(JSON.stringify({ok:jsonValidation.bad.length===0, totals, existingCuratedWorlds: existingCurated.map(w=>({world:w.world,name:w.worldNameCn})), noStoryArchiveWorlds: none.map(w=>w.world), jsonFilesChecked: jsonValidation.files.length, badJson: jsonValidation.bad.length}, null, 2));
