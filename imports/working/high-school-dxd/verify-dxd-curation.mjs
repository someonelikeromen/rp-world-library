#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CURATED = path.join(ROOT, 'campaigns/world-library/worlds/high-school-dxd/curated');
const STORIES_DIR = path.join(CURATED, 'stories');
const INDEX = path.join(STORIES_DIR, 'index.json');
const CHARS = path.join(CURATED, 'characters-index.json');
const REL = path.join(CURATED, 'relationship-graph.json');
const PLOT = path.join(CURATED, 'plot-graph.json');
const SRC = path.join(CURATED, 'source-registry.json');
const WL = path.join(ROOT, 'campaigns/world-library/.wl-index.json');
const MAIN = path.join(ROOT, 'imports/working/high-school-dxd/wenku8-dxd-toc-comparison.json');
const RELATED = path.join(ROOT, 'imports/working/high-school-dxd/wenku8-dxd-related-toc-comparison.json');
const OUT = path.join(ROOT, 'imports/working/high-school-dxd/dxd-final-verification-report.md');

function norm(s){return String(s||'').replace(/\s+/g,'').replace(/教学旅行/g,'修学旅行').replace(/真恶魔高校/g,'真惡魔高校').replace(/Kingdom/ig,'王国').replace(/[：:·・．.。！!？?「」『』【】（）()\[\]《》<>〈〉—＿_\-～~☆★,，、]/g,'').toLowerCase()}
function token(a,b){const an=norm(a),bn=norm(b);return an&&bn&&(an===bn||an.includes(bn)||bn.includes(an))&&Math.min(an.length,bn.length)>=4}
function collectStorySourceKeys(stories){
  const keys=new Set();
  for(const s of stories){
    for(const cs of s.canonicalSources||[]) keys.add(`${cs.sourceId}:${cs.vid}`);
  }
  return keys;
}
function addProblem(arr, level, message, detail=''){arr.push({level,message,detail});}

async function main(){
  const problems=[];
  const index=JSON.parse(await fs.readFile(INDEX,'utf8'));
  const chars=JSON.parse(await fs.readFile(CHARS,'utf8'));
  const rel=JSON.parse(await fs.readFile(REL,'utf8'));
  const plot=JSON.parse(await fs.readFile(PLOT,'utf8'));
  const src=JSON.parse(await fs.readFile(SRC,'utf8'));
  const wl=JSON.parse(await fs.readFile(WL,'utf8'));
  const main=JSON.parse(await fs.readFile(MAIN,'utf8'));
  const related=JSON.parse(await fs.readFile(RELATED,'utf8'));
  const stories=index.stories||[];
  const storyIds=new Set(stories.map(s=>s.id));
  if(storyIds.size!==stories.length) addProblem(problems,'error','stories/index.json has duplicate ids');
  for(const s of stories){
    if(!s.id||!s.title||!s.file) addProblem(problems,'error','story missing id/title/file',JSON.stringify(s));
    try{ await fs.access(path.join(STORIES_DIR,s.file)); } catch { addProblem(problems,'error','story file missing',`${s.id} -> ${s.file}`); }
  }

  const storySourceKeys=collectStorySourceKeys(stories);
  for(const c of main.comparisons||[]){
    const sourceId='wenku8-dxd-toc-audit';
    if(c.vid && !storySourceKeys.has(`${sourceId}:${c.vid}`)) addProblem(problems,'error','main TOC group not mapped to a story',`${c.sourceTitle} vid=${c.vid}`);
  }
  for(const r of related.results||[]){
    const sourceId=r.source.id==='wenku8-true-dxd-toc'?'wenku8-true-dxd-toc-audit':'wenku8-slashdog-toc-audit';
    for(const c of r.comparisons||[]) if(c.vid && !storySourceKeys.has(`${sourceId}:${c.vid}`)) addProblem(problems,'error','related TOC group not mapped to a story',`${r.source.label} ${c.sourceTitle} vid=${c.vid}`);
  }

  const expectedSources=['dxd-card-worldbook','dxd-standalone-worldbook','wenku8-dxd-toc-audit','wenku8-true-dxd-toc-audit','wenku8-slashdog-toc-audit'];
  const sourceIds=new Set((src.sources||[]).map(s=>s.id));
  for(const id of expectedSources) if(!sourceIds.has(id)) addProblem(problems,'error','source-registry missing expected source',id);

  const charIds=new Set((chars.characters||[]).map(c=>c.id));
  if(chars.totalCharacters !== (chars.characters||[]).length) addProblem(problems,'error','totalCharacters mismatch',`${chars.totalCharacters} vs ${(chars.characters||[]).length}`);
  for(const forbidden of ['x1305','x2799','x5877','x8032','x2265','unknown-d0yscl']) if(charIds.has(forbidden)) addProblem(problems,'error','old duplicate character id still present',forbidden);
  for(const fileGraph of [{name:'relationship-graph',g:rel},{name:'plot-graph',g:plot}]){
    const nodeIds=new Set((fileGraph.g.nodes||[]).map(n=>n.id));
    for(const n of fileGraph.g.nodes||[]) if(n.type==='character'&&n.characterRef&&!charIds.has(n.characterRef)) addProblem(problems,'error',`${fileGraph.name} characterRef missing`,`${n.id} -> ${n.characterRef}`);
    for(const e of fileGraph.g.edges||[]){
      if(e.from && !nodeIds.has(e.from)) addProblem(problems,'warning',`${fileGraph.name} edge.from has no node`,e.from);
      if(e.to && !nodeIds.has(e.to)) addProblem(problems,'warning',`${fileGraph.name} edge.to has no node`,e.to);
    }
  }

  // Duplicate lexical keys, excluding intentional host/dragon shared titles.
  const allowedDupKeys=new Set(['赤龙帝','赤龍帝','白龙皇']);
  const keyMap=new Map();
  for(const c of chars.characters||[]){
    for(const raw of [c.name,...(c.aliases||[]),...(c.sourceKeys||[])]){
      const k=String(raw||'').trim(); if(k.length<2) continue;
      if(!keyMap.has(k)) keyMap.set(k,new Set());
      keyMap.get(k).add(`${c.id}:${c.name}`);
    }
  }
  for(const [k,set] of keyMap){
    if(set.size>1 && !allowedDupKeys.has(k)) addProblem(problems,'warning','duplicate character key/alias',`${k}: ${[...set].join(' | ')}`);
  }

  const wlDxd=wl.worlds?.['high-school-dxd'];
  if(!wlDxd) addProblem(problems,'error','.wl-index missing high-school-dxd');
  else {
    if(wlDxd.characters?.count !== chars.characters.length) addProblem(problems,'error','.wl-index character count stale',`${wlDxd.characters?.count} vs ${chars.characters.length}`);
    const wlStoryCount = wlDxd.stories && typeof wlDxd.stories === 'object' ? Object.keys(wlDxd.stories).length : 0;
    if(wlStoryCount !== stories.length) addProblem(problems,'error','.wl-index story count stale',`${wlStoryCount} vs ${stories.length}`);
  }

  // Known, acceptable limitations not blocking metadata consistency.
  const limitations=[];
  for(const s of stories.filter(s=>s.canonicalSources?.length && s.bodyMetadataStatus!=='complete')) limitations.push(`${s.id}: chapter body metadata incomplete (${s.bodyMetadataStatus||'none'})`);
  for(const s of stories.filter(s=>!s.canonicalSources?.length)) limitations.push(`${s.id}: aggregate/legacy index story without direct Wenku8 canonical source mapping`);
  limitations.push('Full chapter body text is intentionally not stored in this metadata layer; stored fields are body-derived metadata, hashes, cues, credits, character hits, and term hits.');

  const lines=[];
  lines.push('# High School DxD final verification report');
  lines.push('');
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Stories: ${stories.length}`);
  lines.push(`- Characters: ${chars.characters.length}`);
  lines.push(`- Sources: ${(src.sources||[]).length}`);
  lines.push(`- Problems: ${problems.length}`);
  lines.push('');
  lines.push('## Problems');
  lines.push('');
  if(!problems.length) lines.push('- None blocking metadata consistency.');
  else for(const p of problems) lines.push(`- [${p.level}] ${p.message}${p.detail?`: ${p.detail}`:''}`);
  lines.push('');
  lines.push('## Known limitations / follow-up list');
  lines.push('');
  for(const l of limitations) lines.push(`- ${l}`);
  await fs.writeFile(OUT, lines.join('\n')+'\n','utf8');
  console.log(JSON.stringify({ok: problems.filter(p=>p.level==='error').length===0, problems, limitations: limitations.length, out: OUT},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
