// Universal Wenku8 series crawler — 10s delay, resume, skip 插图
// Usage: node crawl-universal.js <world-slug> <series-slug>
const fs=require('fs'); const path=require('path');
const https=require('https'); const http=require('http');
const iconv=require('iconv-lite');

const WORLD=process.argv[2]; const SERIES=process.argv[3];
if(!WORLD||!SERIES){console.error('Usage: node crawl-universal.js <world-slug> <series-slug>');process.exit(1);}

const TOC_FILE=`campaigns/world-library/worlds/${WORLD}/sources/wenku8/${SERIES}.toc.json`;
const OUT_ROOT=`campaigns/world-library/worlds/${WORLD}/sources/raw-text/${SERIES}`;

function fetch(url,retries=2){return new Promise((resolve,reject)=>{
  const mod=url.startsWith('https')?https:http;
  const req=mod.get(url,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},timeout:20000},res=>{
    if(res.statusCode===429){reject(new Error('429'));return;}
    if(res.statusCode!==200){reject(new Error('HTTP '+res.statusCode));return;}
    const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(Buffer.concat(chunks)));
  });req.on('error',reject);req.on('timeout',()=>{req.destroy();reject(new Error('timeout'));});
}).catch(async e=>{if(retries>0&&e.message==='429'){console.log('\n    [429] wait 90s');await new Promise(r=>setTimeout(r,90000));return fetch(url,retries-1);}throw e;});}

function extract(buf){
  const html=iconv.decode(buf,'gbk');
  const m=html.match(/<div[^>]*id\s*=\s*["']?contentmain["']?[^>]*>([\s\S]*?)(?:<div[^>]*id\s*=\s*["']?footlink|$)/i);
  if(!m) return null;
  return m[1].replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\r\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/本文来自.*$/gm,'').replace(/最新最全的日本动漫轻小说.*$/gm,'').trim();
}

async function main(){
  const toc=JSON.parse(fs.readFileSync(TOC_FILE,'utf8'));
  let totalOK=0,totalChars=0;
  console.log(`Crawling ${WORLD}/${SERIES}: ${toc.volumes.length} vols, ${toc.chapterCount} chs, 10s delay`);
  
  for(let vi=0;vi<toc.volumes.length;vi++){
    const vol=toc.volumes[vi];
    const volDir=path.join(OUT_ROOT,`vol-${String(vi+1).padStart(2,'0')}`);
    fs.mkdirSync(volDir,{recursive:true});
    const mp=path.join(volDir,'_manifest.json');
    let manifest=fs.existsSync(mp)?JSON.parse(fs.readFileSync(mp,'utf8')):[];
    const complete=new Set(manifest.filter(m=>m.ok).map(m=>`${m.idx}::${m.title}`));
    
    for(let ci=0;ci<vol.chapters.length;ci++){
      const ch=vol.chapters[ci];
      const chapterKey=`${ci+1}::${ch.title}`;
      if(complete.has(chapterKey)) continue;
      if(ch.title.includes('插图')){const idx=manifest.findIndex(m=>m.idx===ci+1&&m.title===ch.title);if(idx<0)manifest.push({ok:false,idx:ci+1,title:ch.title,chars:0,file:null,error:'illustration'});continue;}
      
      const safe=ch.title.replace(/[\/\\:*?"<>|]/g,'_');
      const fn=`${String(ci+1).padStart(2,'0')}-${safe}.txt`;
      try{
        const buf=await fetch(ch.href); const text=extract(buf);
        if(text&&text.length>50){
          fs.writeFileSync(path.join(volDir,fn),text,'utf8');
          const idx=manifest.findIndex(m=>m.idx===ci+1&&m.title===ch.title);
          const e={ok:true,idx:ci+1,title:ch.title,chars:text.length,file:fn};
          if(idx>=0) manifest[idx]=e; else manifest.push(e);
          totalOK++; totalChars+=text.length;
          process.stdout.write(`\r  ${vol.title} [${ci+1}/${vol.chapters.length}] ${safe.substring(0,30)}... ${text.length}c`);
        } else {
          const idx=manifest.findIndex(m=>m.idx===ci+1&&m.title===ch.title);
          if(idx<0) manifest.push({ok:false,idx:ci+1,title:ch.title,chars:text?text.length:0,file:null,error:'short'});
        }
      }catch(e){
        const idx=manifest.findIndex(m=>m.idx===ci+1&&m.title===ch.title);
        if(idx<0) manifest.push({ok:false,idx:ci+1,title:ch.title,file:null,error:e.message});
        process.stdout.write(`\r  ${vol.title} [${ci+1}/${vol.chapters.length}] ${safe.substring(0,30)}... ${e.message}`);
      }
      fs.writeFileSync(mp,JSON.stringify(manifest,null,2),'utf8');
      if(ci<vol.chapters.length-1) await new Promise(r=>setTimeout(r,10000));
    }
    console.log(`\n  ${vol.title}: ${manifest.filter(m=>m.ok).length}/${vol.chapters.length} OK`);
  }
  console.log(`\n${WORLD}/${SERIES}: ${totalOK} new OK, ${totalChars} chars`);
}
main().catch(e=>console.error(e));
