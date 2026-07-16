const fs = require('fs');

// Characters needing completion, grouped by type
const charGroups = {
  fillFields: [
    { id: 'athena', name: '雅典娜(Athena)', chapters: 'campione-main vol-01~vol-19', desc: 'appearance/personality/habits/background已有voice/abilities/versions' },
    { id: 'salvatore', name: '萨尔巴特雷·多尼', chapters: 'campione-main vol-01~vol-23', desc: '补全剩余字段' },
    { id: 'yuri', name: '万里谷佑理', chapters: 'campione-main vol-01~vol-23', desc: '补全剩余字段' },
    { id: 'liliana', name: '琍琍亚娜·葛兰尼查尔', chapters: 'campione-main vol-02~vol-23', desc: '补全剩余字段' },
    { id: 'woban', name: '德扬史塔尔·沃邦', chapters: 'campione-main', desc: '补全剩余字段' },
    { id: 'luo-hao', name: '罗濠教主/罗翠莲', chapters: 'campione-main', desc: '补全剩余字段' },
    { id: 'alek', name: '黑王子亚雷克', chapters: 'campione-main', desc: '补全剩余字段' },
    { id: 'smith', name: '约翰·布鲁托·史密斯', chapters: 'campione-main', desc: '补全剩余字段' },
    { id: 'ena', name: '清秋院惠那', chapters: 'campione-main', desc: '补全剩余字段' },
  ],
  fullProfile: [
    { id: 'kanko', name: '甘粕冬马', chapters: 'campione-main', desc: '正史编纂委员会特务' },
    { id: 'hikaru', name: '万里谷光', chapters: 'campione-main', desc: '佑理的妹妹' },
    { id: 'shizuka', name: '草薙静花', chapters: 'campione-main', desc: '护堂的妹妹' },
    { id: 'kaoru', name: '沙耶宫馨', chapters: 'campione-main', desc: '正史编纂委员会首领' },
    { id: 'alice', name: '爱丽丝公主', chapters: 'campione-main', desc: '王国的通灵王女' },
    { id: 'goku', name: '齐天大圣孙悟空', chapters: 'campione-main', desc: '钢之英雄' },
    { id: 'ren', name: '六波罗莲', chapters: 'campione-shiniki', desc: '神域篇新主角' },
    { id: 'rina', name: '鸟羽梨于奈', chapters: 'campione-shiniki', desc: '神域篇女主角' },
    { id: 'rama', name: '罗摩/最后之王', chapters: 'campione-main', desc: '最终反派' },
    { id: 'athia', name: '艾西亚夫人', chapters: 'campione-main', desc: '魔性之女弑神者' },
    { id: 'lancelot', name: '兰斯洛特', chapters: 'campione-main', desc: '湖上骑士' },
  ]
};

const steps = [];
let stepIdx = 0;

// Template for a character agent
function makeCharStep(id, name, chapters, mode, desc) {
  const needsFields = mode === 'fill' 
    ? '需要补全：APPEARANCE / PERSONALITY / HABITS / BACKGROUND（已有voice/abilities/versions/relationships，不要重复写）'
    : '需要建立全部字段：APPEARANCE / PERSONALITY / VOICE / HABITS / BACKGROUND / ABILITIES / VERSIONS / RELATIONSHIPS';

  return {
    id: `char-${id}`,
    agent: {
      system: `你是弑神者的角色分析师。为角色 ${name} (${id}) 撰写全息档案。

${needsFields}

先用 phase0 笔记定位该角色登场的章节：
E:/pi-st/campaigns/world-library/manual-curation/phase0-output/reader-*.txt

再从 raw-text 原文中读登场章节：
E:/pi-st/campaigns/world-library/worlds/campione/sources/raw-text/${chapters.includes('shiniki') ? 'campione-shiniki' : 'campione-main'}

注意：不要重复写已存在的字段。${mode === 'fill' ? '只写缺失的四个部分' : '写全部字段'}

输出格式（=====CHARACTER===== 分隔）：

=====CHARACTER=====
ID: ${id}
NAME: ${name}
${mode === 'fill' ? '（只写缺失字段）' : ''}

APPEARANCE_SUMMARY: 外貌整体印象
APPEARANCE_HAIR: 发色发型
APPEARANCE_EYES: 瞳色眼神
APPEARANCE_HEIGHT: 身高
APPEARANCE_BUILD: 体型
APPEARANCE_FEATURES: 标志性外貌特征
APPEARANCE_ATTIRE_DEFAULT: 日常着装
APPEARANCE_ATTIRE_COMBAT: 战斗着装
APPEARANCE_SOURCEREF: vol-XX/ch-YY: 描写出处

PERSONALITY_TRAITS: 特质|原文证据
PERSONALITY_VALUES: 价值观
PERSONALITY_STRENGTHS: 优势
PERSONALITY_FLAWS: 缺陷
PERSONALITY_CONFLICT: 内心矛盾
PERSONALITY_SOURCEREF: 

VOICE_SELF: 自称
VOICE_TONE: 语调
VOICE_CATCHPHRASES: 口头禅
VOICE_EXAMPLES: scene=场景|line=对话|source=章节
VOICE_SOURCEREF: 

HABITS_MANNERISMS: 小动作
HABITS_COMBAT: 战斗习惯
HABITS_QUIRKS: 怪癖
HABITS_SOURCEREF: 

BACKGROUND_BIRTH: 出身
BACKGROUND_FAMILY: 家族
BACKGROUND_FORMATIVE: 塑造事件|影响|章节
BACKGROUND_SOURCEREF: 

ABILITIES_01_NAME: 能力名
ABILITIES_01_TYPE: 类型
ABILITIES_01_DESC: 描述
ABILITIES_01_ACTIVATION: 发动条件
ABILITIES_01_LIMITS: 限制
ABILITIES_01_FEATS: 战绩|对手|章节
ABILITIES_01_SOURCEREF: 

VERSIONS_01_LABEL: 时期
VERSIONS_01_TIMEFRAME: 时间范围
VERSIONS_01_POWER: 力量等级
VERSIONS_01_MENTAL: 心理状态
VERSIONS_01_SOURCEREF: 

RELATION_01_WITH: 关系对象
RELATION_01_TYPE: 关系类型
RELATION_01_DESC: 关系描述
RELATION_01_SOURCEREF: 

规则：
- 每项必须有原文 sourceRef (vol-XX/ch-YY)
- 不确定的标注[待确认]
- 读完原文再写`,
      tools: ['read', 'grep', 'find', 'ls', 'edit', 'write']
    },
    task: `为 ${name}(${id}) 建立全息档案。登场于 ${chapters}。\n输出：E:/pi-st/campaigns/world-library/manual-curation/phase1-output/char-final-${id}-profile.txt`,
    mutationScope: 'E:/pi-st/campaigns/world-library/manual-curation/phase1-output/',
    cwd: 'E:/pi-st'
  };
}

// Generate fill steps
for (const c of charGroups.fillFields) {
  steps.push(makeCharStep(c.id, c.name, c.chapters, 'fill', c.desc));
  stepIdx++;
}

// Generate full profile steps
for (const c of charGroups.fullProfile) {
  steps.push(makeCharStep(c.id, c.name, c.chapters, 'full', c.desc));
  stepIdx++;
}

// Add merge step that depends on all
const allCharStepIds = steps.map(s => s.id);
steps.push({
  id: 'merge-final',
  agent: {
    system: '你是数据合并员。收集所有角色档案文件，合并为完整的 characters-index.json。\n\n读取 phase1-output 下 char-final-*-profile.txt 和已有的 char-*-profile.txt、chars-core-*-profile.txt、fill-*-profile.txt。\n\n注意：对于重复角色，保留已有字段，添加缺失字段。不要删除已有数据。\n\n输出：E:/pi-st/campaigns/world-library/manual-curation/phase1-output/characters-index.json',
    tools: ['read', 'grep', 'find', 'ls', 'edit', 'write']
  },
  task: '读取 phase1-output 下所有 profile 文件。合并为完整 characters-index.json。\n对于重复角色：保留已有字段，添加缺失字段。',
  needs: allCharStepIds,
  mutationScope: 'E:/pi-st/campaigns/world-library/manual-curation/phase1-output/',
  cwd: 'E:/pi-st'
});

const graph = {
  objective: '为 campione 全部核心角色建立完整全息档案。20个角色各一个agent，完成后合并。',
  authority: {
    allowFilesystemRead: true,
    allowMutationTools: true,
    allowShellTools: false,
    allowProjectCode: true
  },
  library: { sources: ['project'] },
  limits: { concurrency: 12 },
  steps
};

fs.writeFileSync(
  'campaigns/world-library/manual-curation/campione-phase1-final-graph.json',
  JSON.stringify(graph, null, 2),
  'utf8'
);

console.log(`Generated graph with ${steps.length} steps:`);
console.log(`- Fill fields: ${charGroups.fillFields.length} characters`);
console.log(`- Full profile: ${charGroups.fullProfile.length} characters`);
console.log(`- Merge: 1 step`);
console.log(`- Total: ${steps.length} steps`);
console.log(`- Concurrency: ${graph.limits.concurrency}`);
