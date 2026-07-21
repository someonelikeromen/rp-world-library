#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(file, fallback=null){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return fallback;}}
function writeJson(file, data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file, JSON.stringify(data,null,2)+'\n','utf8');}
function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const k=a.slice(2);const n=argv[i+1];if(n&&!n.startsWith('--')){out[k]=n;i++;}else out[k]=true;}}return out;}
function uniq(a){return [...new Set((a||[]).filter(Boolean))];}
function byKeyPush(obj,key,id){if(!key)return; if(!obj[key]) obj[key]=[]; if(!obj[key].includes(id)) obj[key].push(id);}
function main(){
  const args=parseArgs(process.argv.slice(2));
  const root=args.root||'campaigns/world-library';
  const world='gundam-seed';
  const curated='worlds/gundam-seed/curated/';
  const idxPath=path.join(root,'.wl-index.json');
  const idx=readJson(idxPath,{version:1,worlds:{},builtAt:null});
  const worldJson=readJson(path.join(root,curated,'world.json'));
  const chars=readJson(path.join(root,curated,'characters-index.json'),{characters:[]}).characters||[];
  const sourceRegistry=readJson(path.join(root,curated,'source-registry.json'),{sources:[],worldbookSeed:[]});
  const rules=readJson(path.join(root,curated,'rules-index.json'),{rules:[]}).rules||[];
  const mobile=readJson(path.join(root,curated,'mobile-suits-index.json'),{mobileSuits:[]}).mobileSuits||[];
  const warships=readJson(path.join(root,curated,'warships-index.json'),{warships:[]}).warships||[];
  const events=readJson(path.join(root,curated,'events-index.json'),{events:[]}).events||[];
  const graph=readJson(path.join(root,curated,'knowledge-graph.json'),{nodes:[],edges:[]});
  const relGraph=readJson(path.join(root,curated,'relationship-graph.json'),{relationships:[]});
  const byName={};
  const byKey={};
  for(const ch of chars){
    const item={
      id:ch.id,
      name:ch.name,
      summary:ch.summary||'',
      aliases:ch.aliases||[],
      factions:[],
      powerSystems:[],
      importance:(ch.layers||[]).includes('base-seed')?'primary':'secondary',
      sourceRefs:[...(ch.sourceRefs||[]),...(ch.seedRefs||[])]
    };
    byName[ch.name]=item;
    byKeyPush(byKey,ch.name,ch.id);
    for(const a of ch.aliases||[]) byKeyPush(byKey,a,ch.id);
  }
  idx.worlds=idx.worlds||{};
  idx.worlds[world]={
    status:'curated',
    slug:world,
    path:curated,
    rawWorldbookPath:'imports/worldviews/gundam-seed/worldbooks/',
    rawWorldbookFiles:1,
    rawWorldbookEntries:128,
    characters:{count:chars.length,byName,byKey,majorCharacters:chars.slice(0,24).map(c=>c.name)},
    world:{
      powerSystems:rules.filter(r=>/energy|technology|rule|世界|装甲|中子|SEED|龙骑兵|创世纪|METEOR/i.test(`${r.name} ${r.summary}`)).slice(0,40).map(r=>({id:r.id,name:r.name,summary:r.summary})),
      factions:rules.filter(r=>/联合|ZAFT|奥布|PLANT|蓝色宇宙|LOGOS|克莱因派|三舰同盟/.test(`${r.name} ${r.summary}`)).slice(0,40).map(r=>({id:r.id,name:r.name,summary:r.summary})),
      rules:rules.slice(0,60).map(r=>({id:r.id,name:r.name,summary:r.summary})),
      locations:[],
      events:events.slice(0,60).map(e=>({id:e.id,name:e.name,summary:e.summary})),
      timelines:(worldJson.timelines||[]),
      extensions:['sourcePolicy','baseExtensionIsolation','worldbookSeedReference','reviewNotes']
    },
    curatedPackage:{
      generatedAt:new Date().toISOString(),
      sourceRecords:(sourceRegistry.sources||[]).length,
      worldbookSeedEntries:(sourceRegistry.worldbookSeed||[]).length,
      mobileSuits:mobile.length,
      warships:warships.length,
      events:events.length,
      rules:rules.length,
      graphNodes:graph.nodeCount||(graph.nodes||[]).length,
      graphEdges:graph.edgeCount||(graph.edges||[]).length,
      relationships:(relGraph.relationships||[]).length,
      validationReport:`${curated}validation-report.json`
    }
  };
  idx.builtAt=new Date().toISOString();
  writeJson(idxPath,idx);
  console.log(JSON.stringify({ok:true,world,status:idx.worlds[world].status,characters:chars.length,path:curated,builtAt:idx.builtAt},null,2));
}
main();
