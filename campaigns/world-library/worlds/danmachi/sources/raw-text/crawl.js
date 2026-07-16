// DanMachi series crawler — serial, 30s delay, resume on existing, 429 retry
const fs=require('fs');
const path=require('path');
const https=require('https');
const http=require('http');
const iconv=require('iconv-lite');
const ROOT='campaigns/world-library/worlds/danmachi/sources/raw-text';

function fetch(url, retries=2){
  return new Promise((resolve,reject)=>{
    const mod=url.startsWith('https')?https:http;
    const req=mod.get(url,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},timeout:20000},res=>{
      if(res.statusCode===429){reject(new Error('429-RATELIMIT'));return;}
      if(res.statusCode!==200){reject(new Error(`HTTP ${res.statusCode}`));return;}
      const chunks=[];
      res.on('data',c=>chunks.push(c));
      res.on('end',()=>resolve(Buffer.concat(chunks)));
    });
    req.on('error',reject);
    req.on('timeout',()=>{req.destroy();reject(new Error('timeout'));});
  }).catch(async e=>{
    if(retries>0 && e.message==='429-RATELIMIT'){
      console.log('\n    [429] waiting 90s...');
      await new Promise(r=>setTimeout(r,90000));
      return fetch(url,retries-1);
    }
    throw e;
  });
}

function extract(buf){
  const html=iconv.decode(buf,'gbk');
  const m=html.match(/<div[^>]*id\s*=\s*["']?contentmain["']?[^>]*>([\s\S]*?)(?:<div[^>]*id\s*=\s*["']?footlink|$)/i);
  if(!m) return null;
  return m[1].replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\r\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/本文来自.*$/gm,'').replace(/最新最全的日本动漫轻小说.*$/gm,'').trim();
}

async function crawlSeries(tocFile, seriesSlug){
  const toc=JSON.parse(fs.readFileSync(tocFile,'utf8'));
  let totalOK=0, totalChars=0;
  
  for(let vi=0;vi<toc.volumes.length;vi++){
    const vol=toc.volumes[vi];
    const volDir=path.join(ROOT,seriesSlug,`vol-${String(vi+1).padStart(2,'0')}`);
    fs.mkdirSync(volDir,{recursive:true});
    const manifestPath=path.join(volDir,'_manifest.json');
    let manifest=[];
    if(fs.existsSync(manifestPath)){
      manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    }
    
    for(let ci=0;ci<vol.chapters.length;ci++){
      const ch=vol.chapters[ci];
      const safeName=ch.title.replace(/[\/\\:*?"<>|]/g,'_');
      const fn=`${String(ci+1).padStart(2,'0')}-${safeName}.txt`;
      const outPath=path.join(volDir,fn);
      
      // Skip if this exact chapter position was already downloaded successfully.
      const existing=manifest.find(m=>m.idx===ci+1 && m.title===ch.title && m.ok);
      if(existing && fs.existsSync(outPath)){
        continue;
      }
      
      // Quick skip for illustration pages (no text to extract)
      if(ch.title.includes('插图')){
        const idx=manifest.findIndex(m=>m.idx===ci+1 && m.title===ch.title);
        if(idx<0) manifest.push({ok:false,idx:ci+1,title:ch.title,chars:0,file:null,error:'illustration page'});
        continue;
      }
      try{
        const buf=await fetch(ch.href);
        const text=extract(buf);
        if(text && text.length>50){
          fs.writeFileSync(outPath,text,'utf8');
          const idx=manifest.findIndex(m=>m.idx===ci+1 && m.title===ch.title);
          const entry={ok:true,idx:ci+1,title:ch.title,chars:text.length,file:fn};
          if(idx>=0) manifest[idx]=entry; else manifest.push(entry);
          totalOK++; totalChars+=text.length;
          process.stdout.write(`\r  ${vol.title} [${ci+1}/${vol.chapters.length}] ${safeName.substring(0,30)}... ${text.length}c`);
        } else {
          const idx=manifest.findIndex(m=>m.idx===ci+1 && m.title===ch.title);
          if(idx<0) manifest.push({ok:false,idx:ci+1,title:ch.title,chars:text?text.length:0,file:null,error:'too short'});
          process.stdout.write(`\r  ${vol.title} [${ci+1}/${vol.chapters.length}] ${safeName.substring(0,30)}... SHORT`);
        }
      }catch(e){
        const idx=manifest.findIndex(m=>m.idx===ci+1 && m.title===ch.title);
        if(idx<0) manifest.push({ok:false,idx:ci+1,title:ch.title,file:null,error:e.message});
        process.stdout.write(`\r  ${vol.title} [${ci+1}/${vol.chapters.length}] ${safeName.substring(0,30)}... ${e.message}`);
      }
      
      fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2),'utf8');
      if(ci<vol.chapters.length-1) await new Promise(r=>setTimeout(r,10000));
    }
    console.log(`\n  ${vol.title}: ${manifest.filter(m=>m.ok).length}/${vol.chapters.length} OK`);
  }
  console.log(`\n  Series ${seriesSlug}: ${totalOK} new OK, ${totalChars} new chars`);
}

async function main(){
  const series=process.argv[2]||'danmachi-main';
  const tocFile=`campaigns/world-library/worlds/danmachi/sources/wenku8/${series}.toc.json`;
  if(!fs.existsSync(tocFile)){console.error('TOC not found:',tocFile);process.exit(1);}
  const toc=JSON.parse(fs.readFileSync(tocFile,'utf8'));
  console.log(`Crawling ${series} (${toc.volumes.length} volumes, ${toc.chapterCount} chapters, 10s delay)...`);
  await crawlSeries(tocFile, series);
}

main().catch(e=>console.error(e));
