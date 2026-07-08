const fs = require('fs');
const path = 'E:/pi-st/campaigns/world-library/worlds/danmachi/sources/raw-text/danmachi-main/vol-19';
const outDir = 'E:/pi-st/campaigns/world-library/manual-curation/dm-p0';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Read the manifest for chapter titles
const manifest = JSON.parse(fs.readFileSync(path + '/_manifest.json', 'utf8'));
const chapters = manifest.chapters || [];

// Read all files and output a digest
let notes = '# 地错精读笔记 - Vol.19 (第16卷)\n\n';
let chars = new Set();

const files = fs.readdirSync(path).sort();
for (const f of files) {
  if (!f.endsWith('.txt') || f.startsWith('_')) continue;
  const content = fs.readFileSync(path + '/' + f, 'utf8');
  // Find manifest entry
  const num = f.split('-')[0];
  const chap = chapters.find(c => String(c.number) === num || c.file === f);
  const title = chap ? chap.title : '';
  
  notes += `---\nCHAPTER: vol-19/${f}\nTITLE: ${title}\n`;
  
  // Extract first ~200 chars as summary
  const lines = content.split('\n').filter(l => l.trim());
  let summary = '';
  for (const line of lines) {
    if (line.startsWith('第十六卷') || line.startsWith('台版') || line.startsWith('图源') || line.startsWith('录入') || line.startsWith('     ')) continue;
    if (line.trim().length > 5) {
      summary = line.trim().substring(0, 200);
      break;
    }
  }
  notes += `SUMMARY: ${summary}\n`;
  notes += `\n`;
}

// Also extract character names
// Common danmachi characters  
const commonChars = [
  '贝尔·克朗尼', '赫斯缇雅', '艾丝·华伦斯坦', '希儿·福罗瓦', '琉',
  '莉莉露卡·厄德', '韦尔夫·克罗佐', '春姬', '命', '达芙妮', '卡珊德拉',
  '赫定·瑟兰德', '艾伦·傅洛摩', '奥它', '芙蕾雅', '赫格尼·拉格纳尔',
  '赫伦', '蜜雅', '阿妮雅', '可萝伊', '露诺娃', '荷米斯', '亚丝菲',
  '狄蜜特', '哈索尔', '达弥亚', '费尔斯', '玛丽亚', '莱伊', '菲娜', '小路',
  '奥辛', '潘恩', '阿尔弗利克', '杜华林', '贝尔林', '格尔', '贾里巴',
  '芬恩', '里维莉雅', '格瑞斯', '蒂奥娜', '蒂奥涅', '蕾菲亚', '洛基',
  '伊丝塔', '阿波罗', '建御雷', '米赫', '埃伊娜', '雷诺娃'
];

// Scan for character appearances
const contentAll = files.map(f => {
  if (!f.endsWith('.txt') || f.startsWith('_')) return '';
  return fs.readFileSync(path + '/' + f, 'utf8');
}).join('\n');

for (const ch of commonChars) {
  if (contentAll.includes(ch)) {
    chars.add(ch);
  }
}

notes += '\n## 角色出场\n';
for (const ch of [...chars].sort()) {
  notes += `- ${ch}\n`;
}

fs.writeFileSync(outDir + '/d09-notes.txt', notes, 'utf8');
console.log('Written notes.');
console.log('Characters found:', [...chars].sort().join(', '));
