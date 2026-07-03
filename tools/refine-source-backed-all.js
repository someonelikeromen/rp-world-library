const fs = require('fs');
const path = require('path');

const ROOT = 'campaigns/world-library/worlds';
const NOW = new Date().toISOString();

const termBank = {
  danmachi: ['贝尔','赫斯缇雅','艾丝','莉莉','莉莉露卡','韦尔夫','琉','芙蕾雅','洛基','奥它','芬恩','里维莉雅','格瑞斯','蒂奥娜','蒂奥涅','蕾菲亚','荷米斯','阿波罗','伊丝塔','春姬','命','地下城','欧拉丽','眷族','法尔纳','魔法','技能','Lv.','第18层','中层','异端儿','战争游戏','怪物','冒险者','黑色歌利亚','伊刻洛斯','狄克斯','费尔斯','乌拉诺斯','阿斯特莉亚','阿尔戈'],
  campione: ['护堂','艾莉卡','佑理','莉莉娅娜','雅典娜','沃班','罗濠','萨尔巴特雷','爱莎','不顺从之神','弑神者','权能','乌鲁斯拉格纳','韦勒斯拉纳','梅尔卡托','草薙','潘多拉','神祖','圣杯','神域','特洛伊','芬里尔','珀尔修斯','兰斯洛特','最后之王','诸神黄昏'],
  'rakudai-kishi': ['一辉','史黛菈','珠雫','绫辻','东堂刀华','黑铁','有栖院','七星剑武祭','伐刀者','固有灵装','魔人','解放军','法米利昂','骑士','学园','剑士杀手','落第骑士','王马','西京宁音','晓学园','比翼'],
  'saijaku-muhai-bahamut': ['路克斯','莉夏','库露露席法','菲尔菲','赛莉丝','夜架','爱理','机龙','神装机龙','巴哈姆特','遗迹','学园','王国','帝国','龙匪贼','圣蚀','七龙骑圣','大圣域','乌洛波洛斯','阿卡迪亚'],
  'hidan-no-aria': ['明里','亚莉亚','志乃','麒麟','莱卡','白雪','夹竹桃','武侦','战姊妹','间宫','星伽','海猫','AA','远山','岛麒麟','乾樱']
};

const arcRules = [
  { re: /战争游戏|阿波罗|攻城|城寨|雅辛托斯/, label: '战争游戏 / 派阀冲突' },
  { re: /春姬|伊丝塔|欢乐街|娼馆|杀生石/, label: '欢乐街 / 春姬与伊丝塔眷族' },
  { re: /异端儿|狄克斯|伊刻洛斯|费尔斯|乌拉诺斯/, label: '异端儿 / 地下城异种族线' },
  { re: /第18层|黑色歌利亚|中层|怪物奉送|歌利亚/, label: '中层远征 / 第18层危机' },
  { re: /琉|疾风|阿斯特莉亚|朱庇特|正义/, label: '琉 / 阿斯特莉亚相关线' },
  { re: /芙蕾雅|希儿|女神祭|奥它|大战派阀|战争游戏/, label: '芙蕾雅 / 希儿主线' },
  { re: /剑姬|艾丝|洛基眷族|蕾菲亚|远征|仙精|怪人/, label: '剑姬神圣谭 / 洛基眷族线' },
  { re: /弑神者|不顺从之神|权能|雅典娜|乌鲁斯拉格纳|梅尔卡托|沃班|罗濠|最后之王/, label: '弑神者与权能神话线' },
  { re: /七星剑武祭|伐刀者|固有灵装|解放军|法米利昂|魔人|剑士杀手/, label: '伐刀者 / 学园与大赛线' },
  { re: /机龙|神装机龙|遗迹|圣蚀|七龙骑圣|大圣域|王国|帝国/, label: '机龙 / 遗迹与国家冲突线' },
  { re: /武侦|战姊妹|间宫|星伽|夹竹桃|岛麒麟/, label: '武侦 / 战姊妹与AA支线' }
];

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ ensureDir(path.dirname(p)); fs.writeFileSync(p,JSON.stringify(v,null,2),'utf8'); }
function escapePipe(s){ return String(s||'').replace(/\|/g,'\\|').replace(/\n/g,' '); }
function rxEscape(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function countTerm(text,term){ return (text.match(new RegExp(rxEscape(term),'g'))||[]).length; }
function wordCountApprox(text){ return text.replace(/\s+/g,'').length; }
function safeId(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80); }

function readChapter(worldSlug, file){
  const p=path.join(ROOT, worldSlug, file);
  return fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
}

function volumeStats(worldSlug, volume){
  const terms=termBank[worldSlug]||[];
  const total=new Map();
  const chapters=[];
  let allTitles=[];
  for(const ch of volume.chapters||[]){
    const text=readChapter(worldSlug,ch.file);
    const local=[];
    for(const term of terms){
      const c=countTerm(text,term);
      if(c>0){ local.push([term,c]); total.set(term,(total.get(term)||0)+c); }
    }
    local.sort((a,b)=>b[1]-a[1]);
    allTitles.push(ch.title||'');
    chapters.push({ ...ch, chars: ch.chars || wordCountApprox(text), mentions: local.slice(0,10).map(([k])=>k), topCounts: local.slice(0,10) });
  }
  const topTerms=[...total.entries()].sort((a,b)=>b[1]-a[1]);
  const titleText=allTitles.join(' / ');
  const joined=titleText+' / '+topTerms.slice(0,20).map(([k])=>k).join(' / ');
  const arcs=arcRules.filter(r=>r.re.test(joined)).map(r=>r.label);
  return { chapters, topTerms, arcs: [...new Set(arcs)] };
}

function buildRefinedSummary(worldSlug, series, volume, stats){
  const chCount=stats.chapters.length;
  const titleSpan=stats.chapters.length ? `从《${stats.chapters[0].title}》到《${stats.chapters[stats.chapters.length-1].title}》` : '无章节标题';
  const top=stats.topTerms.slice(0,10).map(([k,v])=>`${k}(${v})`).join('、') || '无高频命中';
  const arc=stats.arcs.length ? stats.arcs.join('；') : '未命中特定规则弧线，按卷级剧情节点保留';
  return `本卷为 ${series.title || series.seriesSlug} 的 ${volume.title}，共 ${chCount} 个正文章节，章节范围${titleSpan}。依据本地正文频次、章节标题和系列术语规则，本卷归入：${arc}。高频证据为：${top}。本摘要只记录源文本可支持的卷级定位、人物/术语候选和章节推进关系，不复制原文、不扩写未被标题或频次支持的细节；需要 RP 精确时间点时，应继续读取对应章节源文件。`;
}

function chapterSummary(ch){
  const tags=(ch.mentions||[]).length ? ch.mentions.join('、') : '待进一步命名实体抽取';
  return `该章推进《${ch.title}》所标示的局部剧情；源文本高频关联为：${tags}。`;
}

function refineVolume(worldSlug, series, volume){
  const outDir=path.join(ROOT,worldSlug,'curated','stories','summaries',series.seriesSlug);
  ensureDir(outDir);
  const outPath=path.join(outDir,`${volume.dir}.md`);
  const existing=fs.existsSync(outPath)?fs.readFileSync(outPath,'utf8'):'';
  const preserveFormal=existing.includes('Iteration 02 第一批正式摘要')||existing.includes('Iteration 02 第二批正式摘要');
  if(preserveFormal){
    return { path: outPath, status:'preserved-formal' };
  }
  const stats=volumeStats(worldSlug,volume);
  let md=`# ${volume.title}\n\n`;
  md+=`世界：${worldSlug}\n\n系列：${series.seriesSlug} / ${series.title||''}\n\n`;
  md+=`状态：refined-source-backed。基于本地 raw-text、章节标题、高频实体/术语和规则弧线进行精修；不复制正文。\n\n`;
  md+=`## 准确度说明\n\n- 本文件只写“源文本支持的卷级定位 + 章节推进 + 候选实体/事件”。\n- 未直接由章节标题、高频命中或系列规则支持的细节不写入，避免幻觉。\n- 需要更细剧情时，继续读取章节清单中的源文件。\n\n`;
  md+=`## 卷摘要\n\n${buildRefinedSummary(worldSlug,series,volume,stats)}\n\n`;
  md+=`## 弧线判定\n\n${stats.arcs.length ? stats.arcs.map(a=>`- ${a}`).join('\n') : '- 未命中特定规则弧线。'}\n\n`;
  md+=`## 章节清单\n\n| 序号 | 标题 | 字数 | 主要命中 | 源文件 |\n|---:|---|---:|---|---|\n`;
  for(const ch of stats.chapters){
    md+=`| ${ch.idx} | ${escapePipe(ch.title)} | ${ch.chars||0} | ${(ch.mentions||[]).join('、')||'—'} | \`${ch.file}\` |\n`;
  }
  md+=`\n## 章节摘要\n\n`;
  for(const ch of stats.chapters) md+=`- ${ch.idx}. ${chapterSummary(ch)}\n`;
  md+=`\n## 抽取候选\n\n`;
  md+=`- 高频人物/术语：${stats.topTerms.slice(0,16).map(([k,v])=>`${k}(${v})`).join('、')||'待精修'}\n`;
  md+=`- 事件节点：${stats.arcs.length ? stats.arcs.join('；') : volume.title + ' 卷级剧情节点'}\n`;
  md+=`- 图谱对齐：${worldSlug}/${series.seriesSlug}/${volume.dir}\n`;
  md+=`- 剧透等级：refined-source-backed，后续按 RP 时间线可再细分。\n\n`;
  md+=`## 名词命中统计\n\n${stats.topTerms.slice(0,30).map(([k,v])=>`- ${k}: ${v}`).join('\n')||'- 无命中'}\n`;
  fs.writeFileSync(outPath,md,'utf8');
  return { path: outPath, status:'refined-source-backed', arcs: stats.arcs, topTerms: stats.topTerms.slice(0,10) };
}

function refineWorld(worldSlug){
  const worldRoot=path.join(ROOT,worldSlug);
  const manifestPath=path.join(worldRoot,'sources','raw-text-manifest.json');
  if(!fs.existsSync(manifestPath)) return null;
  const manifest=readJson(manifestPath);
  const storiesRoot=path.join(worldRoot,'curated','stories');
  ensureDir(storiesRoot);
  const idx={schema:'rp-story-summary-index-v1',worldId:worldSlug,createdAt:NOW,method:'refined-source-backed pass: source-backed volume summaries, formal hand summaries preserved',series:[]};
  const allNodes=[];
  const report={worldSlug,series:[],refined:0,preserved:0};
  for(const series of manifest.series||[]){
    const sEntry={seriesSlug:series.seriesSlug,title:series.title,author:series.author,url:series.url,sourceToc:series.sourceToc,volumes:[]};
    const inc={schema:'rp-plot-graph-increment-v1',worldId:worldSlug,createdAt:NOW,source:`${worldSlug}/${series.seriesSlug} refined-source-backed`,nodes:[]};
    for(const volume of series.volumes||[]){
      const result=refineVolume(worldSlug,series,volume);
      if(result.status==='preserved-formal') report.preserved++; else report.refined++;
      const stats=volumeStats(worldSlug,volume);
      const node={
        id:`orig-${safeId(series.seriesSlug)}-${volume.dir}`,
        series:series.seriesSlug,
        volume:volume.dir,
        label:`${series.seriesSlug} ${volume.title}`,
        type:'volume-event',
        summary:buildRefinedSummary(worldSlug,series,volume,stats),
        arcs:stats.arcs,
        characters:stats.topTerms.slice(0,10).map(([k])=>k),
        organizations:[],
        terms:stats.topTerms.slice(10,20).map(([k])=>k),
        spoilerLevel:'refined-source-backed',
        sourceRefs:[`curated/stories/summaries/${series.seriesSlug}/${volume.dir}.md`],
        originalTextBacked:true
      };
      inc.nodes.push(node); allNodes.push(node);
      sEntry.volumes.push({id:volume.dir,title:volume.title,summaryFile:`curated/stories/summaries/${series.seriesSlug}/${volume.dir}.md`,chapterCount:volume.okCount || (volume.chapters||[]).length,sourceVolume:volume.sourceVolume,summaryStatus:result.status,graphNode:node.id});
    }
    const incPath=path.join(storiesRoot,`original-plot-increment-${series.seriesSlug}-refined-all.json`);
    writeJson(incPath,inc);
    sEntry.graphIncrement=`curated/stories/original-plot-increment-${series.seriesSlug}-refined-all.json`;
    idx.series.push(sEntry);
    report.series.push({seriesSlug:series.seriesSlug,volumes:sEntry.volumes.length});
  }
  writeJson(path.join(storiesRoot,'original-summary-index.json'),idx);
  const graphPath=path.join(worldRoot,'curated','plot-graph.json');
  let graph=fs.existsSync(graphPath)?readJson(graphPath):{schema:'rp-plot-graph-v1',worldId:worldSlug,nodes:[],edges:[],generatedAt:NOW};
  if(!Array.isArray(graph.nodes)) graph.nodes=[];
  if(!Array.isArray(graph.edges)) graph.edges=[];
  const nodeMap=new Map(graph.nodes.map((n,i)=>[n.id,i]));
  let added=0,updated=0;
  for(const node of allNodes){
    if(nodeMap.has(node.id)){
      graph.nodes[nodeMap.get(node.id)]={...graph.nodes[nodeMap.get(node.id)],...node};
      updated++;
    } else {
      graph.nodes.push(node); nodeMap.set(node.id,graph.nodes.length-1); added++;
    }
  }
  const edgeKeys=new Set(graph.edges.map(e=>`${e.from}::${e.to}::${e.type}`));
  let prev=null, addedEdges=0;
  for(const node of allNodes){
    if(prev){
      const key=`${prev}::${node.id}::refined-volume-order`;
      if(!edgeKeys.has(key)){ graph.edges.push({from:prev,to:node.id,type:'refined-volume-order',sourceRefs:['refined-source-backed volume order']}); edgeKeys.add(key); addedEdges++; }
    }
    prev=node.id;
  }
  graph.generatedAt=NOW;
  writeJson(graphPath,graph);
  report.graph={path:graphPath,added,updated,addedEdges,totalNodes:graph.nodes.length,totalEdges:graph.edges.length};
  return report;
}

function main(){
  const worlds=fs.readdirSync(ROOT).filter(w=>fs.existsSync(path.join(ROOT,w,'sources','raw-text-manifest.json'))).sort();
  const reports=worlds.map(refineWorld).filter(Boolean);
  const outDir='campaigns/world-library/manual-curation/reports'; ensureDir(outDir);
  writeJson(path.join(outDir,'refinement-source-backed-report.json'),{createdAt:NOW,reports});
  let md=`# Source-Backed Refinement Report\n\n更新日期：${NOW}\n\n`;
  md+=`本轮对所有可用小说 raw-text 执行同一套精修操作：读取正文频次、章节标题和系列术语规则，生成 source-backed 卷级摘要；已有人写正式摘要的 DanMachi 第 1-6 卷被保留。\n\n`;
  md+=`| world | series | refined | preserved formal | graph total |\n|---|---:|---:|---:|---:|\n`;
  for(const r of reports) md+=`| ${r.worldSlug} | ${r.series.length} | ${r.refined} | ${r.preserved} | ${r.graph.totalNodes}/${r.graph.totalEdges} |\n`;
  md+=`\n## 判据\n\n- 不复制正文。\n- 所有卷必须有 summary 文件、summary index 条目和 plot graph 节点。\n- 摘要只写章节标题/本地正文高频命中/规则弧线支持的内容。\n`;
  fs.writeFileSync(path.join(outDir,'refinement-source-backed-report.md'),md,'utf8');
  console.log(JSON.stringify({ok:true,reports},null,2));
}

main();
