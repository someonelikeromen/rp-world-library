const fs = require('fs');
const path = require('path');

const recordsDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned/records';

const categories = {
  character: { keywords: ['角色', '人物', 'character', '主角', '玩家', 'NPC', '桐人', '亚丝娜', '克莱因', '艾基尔', '莉兹', '西莉卡', '结衣', '希兹克利夫', '茅场', '幸', '启太', '牙王', '须乡', '爱丽丝', '优纪', '诗乃', '米特', '阿尔戈', '斯朵蕾雅', '菲利亚'], weight: 0 },
  location: { keywords: ['地点', '楼层', 'Floor', '区域', '地理', '聚落', '迷宫', '塔', '城镇', '村庄', '街道', '艾恩葛朗特', '阿鲁夫海姆', '世界树'], weight: 0 },
  system: { keywords: ['系统', '机制', '核心设定', '状态栏', '技能系统', '剑技', '战斗', '经济', '掉落', '配方', '商店', '交易', '潜行', 'NerveGear'], weight: 0 },
  event: { keywords: ['事件', '时间线', '剧情', '任务', '委托', '赛季', '章节', '故事', '篇', '年'], weight: 0 },
  rule: { keywords: ['规则', '准则', '生成准则', '运行', '设定', '校验', '过滤', '守卫', '边界', '阈值'], weight: 0 },
  item: { keywords: ['物品', '道具', '武器', '装备', '防具', '药水', '水晶', '掉落物', '配方', '材料', '消耗品'], weight: 0 },
  faction: { keywords: ['公会', '组织', '血盟', '骑士团', '军队', '攻略组', '微笑棺木', '风林火山', '月夜黑猫'], weight: 0 },
  ability: { keywords: ['技能', '剑技', '能力', '专长', '特技', '魔法', '战斗技能', '辅助技能', '生活技能'], weight: 0 },
  timeline: { keywords: ['时间线', '年表', '2022', '2023', '2024', 'SAO篇', 'ALO篇', 'GGO篇'], weight: 0 },
  monster: { keywords: ['怪物', 'Boss', 'BOSS', '首领', '楼层Boss', '野怪', '怪物生成', '遭遇', '敌方'], weight: 0 },
  concept: { keywords: ['概念', '术语', '世界观', '设定', '难度', '心理压力', '死亡游戏', '完全潜行', 'HP', 'MP', '等级'], weight: 0 },
  meta: { keywords: ['记忆', '输出', '清空', '局部变量', '记忆相关', '输出规则', '核心规则', '格式', '生成准则', '指令', '身世背景', '玩家背景', '开场白', 'first_mes', 'creator', 'description', 'personality', 'scenario', 'post_history'], weight: 0 },
};

const results = [];
for (const [catName, catData] of Object.entries(categories)) {
  catData.files = [];
}

function scanDir(dir, sourcePrefix) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const fullPath = path.join(dir, f);
    
    // Read first 500 chars for classification
    const content = fs.readFileSync(fullPath, 'utf-8').substring(0, 2000);
    
    // Score each category
    const scores = {};
    for (const [catName, catData] of Object.entries(categories)) {
      let score = 0;
      for (const kw of catData.keywords) {
        if (content.includes(kw)) score++;
      }
      scores[catName] = score;
    }
    
    // Pick top category
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primaryCat = sorted[0][1] > 0 ? sorted[0][0] : 'concept';
    
    results.push({
      file: f,
      source: sourcePrefix,
      category: primaryCat,
      scores: Object.fromEntries(sorted.slice(0, 3)),
    });
    
    if (!categories[primaryCat].files) categories[primaryCat].files = [];
    categories[primaryCat].files.push(f);
  }
}

scanDir(path.join(recordsDir, 'card-local-1'), 'card-local-1');
scanDir(path.join(recordsDir, 'card-sao-progressive-v1-3'), 'card-sao-progressive-v1-3');
scanDir(path.join(recordsDir, 'wb-sao-v1-1'), 'wb-sao-v1-1');
scanDir(path.join(recordsDir, 'txt-aincrad-trpg-floor-module'), 'txt-aincrad');

// Write classification index
const index = {
  generated: new Date().toISOString(),
  totalFiles: results.length,
  categoryCounts: {},
  files: results,
};

for (const [catName, catData] of Object.entries(categories)) {
  index.categoryCounts[catName] = (catData.files || []).length;
}

const outPath = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/source-cleaned/classification-index.json';
fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
console.log(`Classification index written: ${outPath}`);
console.log(`Total files: ${results.length}`);
console.log('\nCategory breakdown:');
for (const [cat, count] of Object.entries(index.categoryCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}
