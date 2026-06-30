#!/usr/bin/env node
/**
 * Crawl Wenku8 chapter pages and store body-derived metadata for local RP use.
 * Stores metadata, hashes, short opening/ending cues, detected credits, and
 * character/term hits. Does not store complete chapter body text.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const CURATED = path.join(ROOT, 'campaigns/world-library/worlds/high-school-dxd/curated');
const STORIES_DIR = path.join(CURATED, 'stories');
const META_DIR = path.join(STORIES_DIR, 'chapter-metadata');
const WORK_META_DIR = path.join(ROOT, 'imports/working/high-school-dxd/chapter-metadata');
const CACHE_DIR = path.join(WORK_META_DIR, 'cache');
const INDEX_PATH = path.join(STORIES_DIR, 'index.json');
const CHARS_PATH = path.join(CURATED, 'characters-index.json');
const WORLD_PATH = path.join(CURATED, 'world.json');
const MAIN_JSON = path.join(ROOT, 'imports/working/high-school-dxd/wenku8-dxd-toc-comparison.json');
const RELATED_JSON = path.join(ROOT, 'imports/working/high-school-dxd/wenku8-dxd-related-toc-comparison.json');
const FINAL_REPORT = path.join(ROOT, 'imports/working/high-school-dxd/dxd-chapter-metadata-crawl-report.md');

const SOURCE_ID_BY_RELATED = {
  'wenku8-true-dxd-toc': 'wenku8-true-dxd-toc-audit',
  'wenku8-slashdog-toc': 'wenku8-slashdog-toc-audit'
};

function decodeHtmlEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
function stripTags(html) {
  return decodeHtmlEntities(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  );
}
function normalizeText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.replace(/[\u00a0　]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}
function cleanContentText(raw) {
  const lines = normalizeText(raw).split('\n');
  return lines.filter(l => {
    if (/^(添加书签|返回书页|上一页|下一页|返回书目)/.test(l)) return false;
    if (/Ai女友|绅士之道/.test(l)) return false;
    if (/本文来自\s*轻小说文库|最新最全的日本动漫轻小说\s*轻小说文库/.test(l)) return false;
    if (/^\s*$/.test(l)) return false;
    return true;
  }).join('\n');
}
function textHash(text) { return crypto.createHash('sha256').update(text, 'utf8').digest('hex'); }
function short(s, n=180) { return String(s||'').replace(/\s+/g,' ').trim().slice(0,n); }
function splitSentences(text) {
  return String(text||'').replace(/\n+/g,' ').split(/(?<=[。！？!?])\s*/).map(s=>s.trim()).filter(Boolean);
}
function topHits(text, keys, max=20) {
  const out=[];
  for(const k of keys){
    if(!k || k.length<2) continue;
    const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g');
    const count=(text.match(re)||[]).length;
    if(count>0) out.push({key:k,count});
  }
  return out.sort((a,b)=>b.count-a.count || a.key.localeCompare(b.key)).slice(0,max);
}
function unique(arr){return [...new Set((arr||[]).filter(Boolean))];}
function chapterTitleFromHtml(html) {
  const divTitle = html.match(/<div\s+id=["']title["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (divTitle) return stripTags(divTitle).trim();
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  return title ? stripTags(title).split('-')[0].trim() : '';
}
function extractContent(html) {
  let block = html.match(/<div\s+id=["']content["'][^>]*>([\s\S]*?)<div\s+id=["']footlink["']/i)?.[1];
  if (!block) block = html.match(/<div\s+id=["']content["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (!block) return '';
  return cleanContentText(stripTags(block));
}
function detectCredits(lines) {
  return lines.filter(l => /(转自|录入|扫图|翻译|校对|台版|轻之国度|SOSG|LK|转载)/i.test(l)).slice(0,8);
}
async function fetchChapter(url, retries=8) {
  let last;
  for(let i=1;i<=retries;i++){
    try{
      const res = await fetch(url, {headers:{'user-agent':'Mozilla/5.0 (compatible; pi-rp-local-metadata/1.0)'}});
      if(!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const buf=Buffer.from(await res.arrayBuffer());
      return new TextDecoder('gb18030').decode(buf);
    }catch(e){
      last=e;
      const waitMs = e?.status === 429 ? Math.min(45000, 8000 * i) : 1200 * i;
      await new Promise(r=>setTimeout(r, waitMs));
    }
  }
  throw last;
}
function buildVolumeMap(main, related) {
  const map = new Map();
  for(const v of main.volumes||[]) map.set(`wenku8-dxd-toc-audit:${v.vid}`, {sourceId:'wenku8-dxd-toc-audit', sourceUrl:main.source.url, volume:v});
  for(const r of related.results||[]) {
    const sourceId=SOURCE_ID_BY_RELATED[r.source.id];
    for(const v of r.volumes||[]) map.set(`${sourceId}:${v.vid}`, {sourceId, sourceUrl:r.source.url, volume:v});
  }
  return map;
}
function buildCharacterKeys(chars) {
  const keys=[];
  for(const c of chars.characters||[]) {
    const aliases=unique([c.name, ...(c.aliases||[]), ...(c.sourceKeys||[])]).filter(x=>String(x).length>=2);
    keys.push({id:c.id, name:c.name, aliases});
  }
  return keys;
}
function buildTermKeys(world) {
  const keys=[];
  const collect=(x)=>{
    if(Array.isArray(x)) for(const y of x) collect(y);
    else if(x && typeof x==='object') {
      for(const k of ['id','name','title','term','summary']) if(typeof x[k]==='string') keys.push(x[k]);
      for(const v of Object.values(x)) if(typeof v==='object') collect(v);
    }
  };
  collect(world.powerSystems); collect(world.factions); collect(world.rules); collect(world.locations); collect(world.events); collect(world.timelines);
  keys.push('神器','神灭具','赤龙帝','白龙皇','禁手','霸龙','排名游戏','恶魔棋子','三大势力','祸之团','DXD','D×D','圣剑','魔剑','冥界','驹王学园','吉蒙里','西迪','堕天使','天使','恶魔');
  return unique(keys).filter(k=>String(k).length>=2 && String(k).length<=30);
}
async function mapLimit(items, limit, fn, delayMs=0) {
  const out=new Array(items.length); let idx=0;
  async function worker(){
    while(idx<items.length){
      const i=idx++;
      if (delayMs) await new Promise(r=>setTimeout(r, delayMs));
      out[i]=await fn(items[i],i);
    }
  }
  await Promise.all(Array.from({length:limit},worker));
  return out;
}

function cacheFileFor(jobKey){ return path.join(CACHE_DIR, Buffer.from(jobKey).toString('base64url') + '.json'); }
async function readJsonMaybe(file){ try { return JSON.parse(await fs.readFile(file,'utf8')); } catch { return null; } }

async function main(){
  await fs.mkdir(META_DIR,{recursive:true});
  await fs.mkdir(WORK_META_DIR,{recursive:true});
  await fs.mkdir(CACHE_DIR,{recursive:true});
  const index=JSON.parse(await fs.readFile(INDEX_PATH,'utf8'));
  const chars=JSON.parse(await fs.readFile(CHARS_PATH,'utf8'));
  const world=JSON.parse(await fs.readFile(WORLD_PATH,'utf8'));
  const main=JSON.parse(await fs.readFile(MAIN_JSON,'utf8'));
  const related=JSON.parse(await fs.readFile(RELATED_JSON,'utf8'));
  const volumeMap=buildVolumeMap(main,related);
  const characterKeys=buildCharacterKeys(chars);
  const termKeys=buildTermKeys(world);

  const chapterJobs=[];
  const storyChapterRefs=new Map();
  for(const story of index.stories||[]) {
    const refs=[];
    for(const cs of story.canonicalSources||[]) {
      const vm=volumeMap.get(`${cs.sourceId}:${cs.vid}`);
      if(!vm) continue;
      for(const [chapterIndex,ch] of vm.volume.chapters.entries()) {
        const jobKey=`${cs.sourceId}:${cs.vid}:${chapterIndex}`;
        chapterJobs.push({jobKey, storyId:story.id, storyTitle:story.title, sourceId:cs.sourceId, sourceUrl:vm.sourceUrl, vid:cs.vid, volumeTitle:vm.volume.title, chapterIndex:chapterIndex+1, tocTitle:ch.title, href:ch.href});
        refs.push(jobKey);
      }
    }
    if(refs.length) storyChapterRefs.set(story.id, refs);
  }
  const uniqueJobs=[...new Map(chapterJobs.map(j=>[j.jobKey,j])).values()];
  const aggregatePath = path.join(WORK_META_DIR,'wenku8-dxd-chapter-metadata.json');
  let previousByJob = new Map();
  try {
    const prev = JSON.parse(await fs.readFile(aggregatePath,'utf8'));
    for (const r of (prev.chapters||[]).filter(r=>r.fetched)) {
      previousByJob.set(r.jobKey,r);
      await fs.writeFile(cacheFileFor(r.jobKey), JSON.stringify(r,null,2)+'\n','utf8').catch(()=>{});
    }
  } catch {}
  for (const j of uniqueJobs) {
    if (!previousByJob.has(j.jobKey)) {
      const cached = await readJsonMaybe(cacheFileFor(j.jobKey));
      if (cached?.fetched) previousByJob.set(j.jobKey, cached);
    }
  }
  const jobsToFetch = uniqueJobs.filter(j=>!previousByJob.has(j.jobKey));
  console.log(`Chapter pages total=${uniqueJobs.length}; cached=${previousByJob.size}; fetching=${jobsToFetch.length}...`);

  const fetchedNow = await mapLimit(jobsToFetch, 1, async (job, i) => {
    let result;
    try{
      const html=await fetchChapter(job.href);
      const title=chapterTitleFromHtml(html) || job.tocTitle;
      const text=extractContent(html);
      const lines=text.split('\n').filter(Boolean);
      const bodyNoCredits=lines.filter(l=>!/(转自|录入|扫图|翻译|校对|台版|轻之国度|SOSG|LK|转载)/i.test(l)).join('\n');
      const sentences=splitSentences(bodyNoCredits);
      const charHits=[];
      for(const c of characterKeys){
        const hits=topHits(bodyNoCredits,c.aliases,5);
        const total=hits.reduce((s,x)=>s+x.count,0);
        if(total>0) charHits.push({id:c.id,name:c.name,count:total,matched:hits});
      }
      charHits.sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name));
      result = {
        ...job,
        fetched: true,
        pageTitle: title,
        textHash: textHash(text),
        charCount: text.length,
        bodyCharCount: bodyNoCredits.length,
        paragraphCount: lines.length,
        sentenceCount: sentences.length,
        creditLines: detectCredits(lines),
        openingCue: short(sentences.slice(0,3).join(' '), 260),
        endingCue: short(sentences.slice(-3).join(' '), 260),
        characterHits: charHits.slice(0,20),
        termHits: topHits(bodyNoCredits, termKeys, 30),
        crawledAt: new Date().toISOString()
      };
    }catch(e){
      result = {...job, fetched:false, error:String(e?.message||e), crawledAt:new Date().toISOString()};
    } finally {
      if (result?.fetched) await fs.writeFile(cacheFileFor(result.jobKey), JSON.stringify(result,null,2)+'\n','utf8');
      if((i+1)%25===0) console.log(`  fetched ${i+1}/${jobsToFetch.length}`);
    }
    return result;
  }, 1800);
  const byJob=new Map([...previousByJob, ...fetchedNow.map(r=>[r.jobKey,r])]);
  const results = uniqueJobs.map(j=>byJob.get(j.jobKey)).filter(Boolean);

  for(const story of index.stories||[]) {
    const refs=storyChapterRefs.get(story.id)||[];
    if(!refs.length) continue;
    const chapters=refs.map(r=>byJob.get(r)).filter(Boolean);
    const file=`${story.id}.chapters.json`;
    const storyMeta={
      schema:'rp-story-chapter-body-metadata-v1',
      worldId:'high-school-dxd',
      storyId:story.id,
      storyTitle:story.title,
      generatedAt:new Date().toISOString(),
      storagePolicy:'body-derived metadata only; full chapter body text is not stored',
      chapterCount:chapters.length,
      fetchedCount:chapters.filter(c=>c.fetched).length,
      chapters
    };
    await fs.writeFile(path.join(META_DIR,file), JSON.stringify(storyMeta,null,2)+'\n','utf8');
    story.chapterMetadataFile=`chapter-metadata/${file}`;
    story.bodyMetadataStatus=storyMeta.fetchedCount===storyMeta.chapterCount?'complete':'partial';
    story.bodyMetadataGeneratedAt=storyMeta.generatedAt;
  }
  await fs.writeFile(INDEX_PATH, JSON.stringify(index,null,2)+'\n','utf8');

  const aggregate={schema:'wenku8-dxd-chapter-body-metadata-v1', generatedAt:new Date().toISOString(), storagePolicy:'metadata only; no full body text', totalChapters:results.length, fetchedCount:results.filter(r=>r.fetched).length, failed:results.filter(r=>!r.fetched), chapters:results};
  await fs.writeFile(aggregatePath, JSON.stringify(aggregate,null,2)+'\n','utf8');

  const report=[];
  report.push('# High School DxD Wenku8 chapter body metadata crawl');
  report.push('');
  report.push(`- Generated: ${aggregate.generatedAt}`);
  report.push(`- Total chapter pages: ${aggregate.totalChapters}`);
  report.push(`- Fetched: ${aggregate.fetchedCount}`);
  report.push(`- Failed: ${aggregate.failed.length}`);
  report.push(`- Story metadata dir: ${path.relative(ROOT,META_DIR)}`);
  report.push(`- Aggregate metadata: ${path.relative(ROOT,path.join(WORK_META_DIR,'wenku8-dxd-chapter-metadata.json'))}`);
  report.push('');
  if(aggregate.failed.length){
    report.push('## Failed pages'); report.push('');
    for(const f of aggregate.failed) report.push(`- ${f.href} (${f.error})`);
  }
  await fs.writeFile(FINAL_REPORT, report.join('\n')+'\n','utf8');
  console.log(JSON.stringify({ok:aggregate.failed.length===0,total:aggregate.totalChapters,fetched:aggregate.fetchedCount,failed:aggregate.failed.length,report:FINAL_REPORT},null,2));
}

main().catch(e=>{console.error(e);process.exit(1)});
