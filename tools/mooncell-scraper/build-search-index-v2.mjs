/**
 * Rebuild search index v2 - includes NP effects, skills, class skills, profile
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MOONCELL_DIR = join(ROOT, 'campaigns/world-library/worlds/type-moon-nasuverse/extracted/characters/fgo-part1/mooncell');
const IMAGE_DIR = join(MOONCELL_DIR, 'images');
const SERVANT_DIR = MOONCELL_DIR;

const classMap = {
    Saber: '剑士', Lancer: '枪兵', Archer: '弓兵', Rider: '骑兵',
    Caster: '魔术师', Assassin: '暗杀者', Berserker: '狂战士',
    Ruler: '裁定者', Avenger: '复仇者', Alterego: '他人格',
    MoonCancer: '月癌', Foreigner: '降临者', Pretender: '伪装者',
    Shielder: '盾兵', Beast: '兽',
};

const files = readdirSync(SERVANT_DIR).filter(f =>
    f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json'
);

const servants = [];
let imgTotal = 0;

for (const file of files) {
    try {
        const data = JSON.parse(readFileSync(join(SERVANT_DIR, file), 'utf-8'));
        const cls = data.class || 'Unknown';
        const clsClean = cls.replace(/[Ⅰ-Ⅶ\/\s]/g, '').trim();
        const pageid = data.pageid;

        // Find associated images
        const cardImages = [];
        if (existsSync(IMAGE_DIR)) {
            for (const img of readdirSync(IMAGE_DIR)) {
                if (img.startsWith(`${pageid}_`) || img.includes(`_${pageid}_`)) {
                    cardImages.push(`characters/fgo-part1/mooncell/images/${img}`);
                }
            }
        }
        imgTotal += cardImages.length;

        // Build aliases
        const aliases = [];
        if (data.name_jp && data.name_jp !== data.name_zh) aliases.push(data.name_jp);
        if (data.name_en && data.name_en !== data.name_zh) aliases.push(data.name_en);
        if (clsClean) aliases.push(`${data.name_zh}(${clsClean})`);
        if (clsClean && classMap[clsClean]) aliases.push(`${classMap[clsClean]} ${data.name_zh}`);

        // Build source keys
        const sourceKeys = [data.name_zh];
        if (data.name_jp) sourceKeys.push(data.name_jp);
        if (data.name_en) sourceKeys.push(data.name_en);
        sourceKeys.push(clsClean);
        if (classMap[clsClean]) sourceKeys.push(classMap[clsClean]);
        // Add NP name as search key
        if (data.np?.name_zh) sourceKeys.push(data.np.name_zh);

        // Build rich summary
        const rarityStars = '★'.repeat(data.rarity || 0);
        const npLine = data.np ? `NP: ${data.np.name_zh}(${data.np.card} ${data.np.type} ${data.np.rank})` : '';
        const skillLine = `技能: ${data.skills?.map(s => s.name_zh).join('、') || ''}`;
        const classSkillLine = `职阶技能: ${data.classSkills?.map(s => `${s.name_zh} ${s.rank}`).join('、') || ''}`;
        const summary = `${rarityStars} ${cls} | ${npLine} | ATK:${data.atk_max || '?'} HP:${data.hp_max || '?'} | CV:${data.seiyuu || ''} | ${skillLine} | ${classSkillLine}`;

        // Build rich detail
        const detailLines = [
            `名称: ${data.name_zh}`,
            `日文名: ${data.name_jp || ''}`,
            `英文名: ${data.name_en || ''}`,
            `星级: ${rarityStars} (${data.rarity})`,
            `职阶: ${cls}`,
            `编号: ${data.id || ''}`,
            `属性: ${data.attribute1 || ''}·${data.attribute2 || ''}`,
            `性别: ${data.gender || ''}`, `身高: ${data.height || ''}`, `体重: ${data.weight || ''}`,
            `声优: ${data.seiyuu || ''}`, `画师: ${data.illustrator || ''}`,
            `ATK: ${data.atk_base}-${data.atk_max}`, `HP: ${data.hp_base}-${data.hp_max}`,
            '',
            '【宝具】',
        ];
        if (data.np) {
            detailLines.push(`  ${data.np.name_zh} (${data.np.card} ${data.np.type} ${data.np.rank} ${data.np.category})`);
            for (const e of data.np.effects || []) {
                detailLines.push(`  ${e.effect}: ${e.levels.join(' / ')}`);
            }
        }
        if (data.skills?.length) {
            detailLines.push('', '【持有技能】');
            for (const s of data.skills) {
                detailLines.push(`  ${s.name_zh} (CD:${s.cooldown})`);
                for (const e of s.effects || []) {
                    detailLines.push(`    ${e.desc}: ${e.values.join(' / ')}`);
                }
            }
        }
        if (data.classSkills?.length) {
            detailLines.push('', '【职阶技能】');
            for (const s of data.classSkills) {
                detailLines.push(`  ${s.name_zh} ${s.rank}: ${s.effect}`);
            }
        }
        if (data.profile?.detail) {
            detailLines.push('', '【角色详情】', `  ${data.profile.detail}`);
        }
        const detail = detailLines.join('\n');

        const entry = {
            id: `mooncell-${pageid}`,
            name: data.name_zh,
            series: 'Fate/Grand Order',
            variant: cls,
            aliases, sourceKeys,
            visibility: 'public',
            summary,
            detail,
            roles: [cls],
            factions: [],
            locations: [],
            powerSystems: ['英灵召唤', '从者系统'],
            abilities: (data.skills || []).map(s => s.name_zh),
            items: [],
            appearance: { height: data.height || '', weight: data.weight || '', note: '' },
            personality: { core: [], surface: [], inner: [] },
            relationships: [],
            relatedEntries: [],
            forms: [{ id: `${pageid}-base`, name: '通常形态', type: 'base' }],
            importance: data.rarity >= 5 ? 'major' : 'medium',
            evidenceLevel: 'B',
            sourceRefs: [`Mooncell: ${data.name_zh} (pageid ${pageid})`],
            notes: '',
            sourceContent: detail,
            sourceContentLen: detail.length,
            sourceFile: 'fgo.wiki (Mooncell)',
            sourceIndex: pageid,
            psyche: { primary: '', primaryScore: 0, secondary: [], confidence: 'low', forbiddenRules: [] },
            cardImages,
            _dataRef: `mooncell/${file}`,
        };
        servants.push(entry);
    } catch (e) {
        console.error(`ERR: ${file}: ${e.message}`);
    }
}

// Sort: rarity desc, then name
servants.sort((a, b) => {
    const ra = parseInt(a.summary?.match(/★+/)?.[0]?.length || 0);
    const rb = parseInt(b.summary?.match(/★+/)?.[0]?.length || 0);
    if (ra !== rb) return rb - ra;
    return a.name.localeCompare(b.name, 'zh');
});

// Build indices
const byClass = {}, byRarity = {}, byKey = {}, byName = {};
for (const s of servants) {
    const cls = s.variant;
    if (!byClass[cls]) byClass[cls] = [];
    byClass[cls].push(s.id);

    const rMatch = s.summary.match(/★+/);
    const rKey = rMatch ? `★${rMatch[0].length}` : '★?';
    if (!byRarity[rKey]) byRarity[rKey] = [];
    byRarity[rKey].push(s.id);

    for (const key of [...s.sourceKeys, ...s.aliases]) {
        if (!byKey[key]) byKey[key] = [];
        if (!byKey[key].includes(s.id)) byKey[key].push(s.id);
    }
    byName[s.name] = s.id;
}

const searchIndex = {
    schema: 'mooncell-servant-search-index-v2',
    worldId: 'type-moon-nasuverse',
    generatedAt: new Date().toISOString(),
    source: 'Mooncell FGO Wiki (fgo.wiki)',
    totalCharacters: servants.length,
    characters: servants,
    indices: { byClass, byRarity, byFaction: {}, byKey, byName },
    enrichmentStats: {
        withImages: servants.filter(s => s.cardImages.length > 0).length,
        withNP: servants.filter(s => s.detail.includes('【宝具】')).length,
        withSkills: servants.filter(s => s.detail.includes('【持有技能】')).length,
        withClassSkills: servants.filter(s => s.detail.includes('【职阶技能】')).length,
        withProfile: servants.filter(s => s.detail.includes('【角色详情】')).length,
        totalImages: imgTotal,
    },
};

const outPath = join(MOONCELL_DIR, 'search-index.json');
writeFileSync(outPath, JSON.stringify(searchIndex, null, 2));
console.log(`Search index v2 built: ${servants.length} servants`);
console.log(`  NP: ${searchIndex.enrichmentStats.withNP} | Skills: ${searchIndex.enrichmentStats.withSkills} | ClassSkills: ${searchIndex.enrichmentStats.withClassSkills} | Profile: ${searchIndex.enrichmentStats.withProfile}`);
console.log(`  Images: ${searchIndex.enrichmentStats.totalImages}`);
console.log(`  Size: ${(JSON.stringify(searchIndex).length / 1024 / 1024).toFixed(1)} MB`);

// Update mooncell index.json
const mooncellIndex = JSON.parse(readFileSync(join(MOONCELL_DIR, 'index.json'), 'utf-8'));
mooncellIndex.searchIndex = 'search-index.json';
writeFileSync(join(MOONCELL_DIR, 'index.json'), JSON.stringify(mooncellIndex, null, 2));
