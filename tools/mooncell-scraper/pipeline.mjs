/**
 * Mooncell FGO Servant Scraper - Pipeline
 * 
 * Usage:
 *   node tools/mooncell-scraper/pipeline.mjs [phase] [batchSize]
 *   phases: 1=list 2=detail 3=images 4=sync  all=default
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MOONCELL = join(ROOT, 'tools/mooncell-scraper');
const DATA_DIR = join(MOONCELL, 'data');
const IMAGE_DIR = join(MOONCELL, 'images');
const EXTRACTED = join(ROOT, 'campaigns/world-library/worlds/type-moon-nasuverse/extracted/characters/fgo-part1');

const API_BASE = 'https://fgo.wiki/api.php';
const MOONCELL_BASE = 'https://fgo.wiki';

function ensureDir(dir) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function curlGet(url) {
    const result = execSync(`curl -s "${url}"`, { encoding: 'utf-8', maxBuffer: 10*1024*1024 });
    return JSON.parse(result);
}

// ===== Phase 1: Fetch servant list =====
async function phase1_fetchList() {
    console.log('[Phase 1] Fetching servant list...');
    ensureDir(DATA_DIR);
    const data = curlGet(`${API_BASE}?action=query&list=categorymembers&cmtitle=Category:%E8%8B%B1%E7%81%B5%E5%9B%BE%E9%89%B4&format=json&cmlimit=500`);
    const servants = data.query.categorymembers.map(s => ({ pageid: s.pageid, title: s.title }));
    const index = { total: servants.length, source: 'Mooncell FGO Wiki', fetchedAt: new Date().toISOString(), servants };
    writeFileSync(join(DATA_DIR, 'servant-index.json'), JSON.stringify(index, null, 2));
    console.log(`  Done: ${servants.length} servants indexed`);
    return index;
}

// ===== Phase 2: Fetch details =====
function getField(text, key) {
    const re = new RegExp(`\\|${key}\\s*=\\s*(.+)`);
    const m = text.match(re);
    return m ? m[1].trim() : '';
}

function parseServant(wikitext, title) {
    const result = { name_zh: title, rarity: 0, class: '', skills: [], traits: [], card_images: [] };
    const boxMatch = wikitext.match(/\{\{基础数值([\s\S]*?)\}\}/);
    if (boxMatch) {
        const b = boxMatch[1];
        result.name_jp = getField(b, '日文名');
        result.name_en = getField(b, '英文名');
        result.rarity = parseInt(getField(b, '稀有度')) || 0;
        result.class = getField(b, '职阶');
        result.id = getField(b, '序号');
        result.atk_base = parseInt(getField(b, '基础ATK')) || 0;
        result.atk_max = parseInt(getField(b, '满级ATK')) || 0;
        result.hp_base = parseInt(getField(b, '基础HP')) || 0;
        result.hp_max = parseInt(getField(b, '满级HP')) || 0;
        result.gender = getField(b, '性别');
        result.attribute1 = getField(b, '属性1');
        result.attribute2 = getField(b, '属性2');
        result.seiyuu = getField(b, '声优');
        result.illustrator = getField(b, '画师');
        result.height = getField(b, '身高');
        result.weight = getField(b, '体重');
    }
    const npNameMatch = wikitext.match(/\{\{宝具\s*\n\|中文名=(.+)/);
    if (npNameMatch) result.np_name = npNameMatch[1];
    result.skill_count = (wikitext.match(/\{\{持有技能\|/g) || []).length;
    return result;
}

async function phase2_fetchDetails(batchSize = 5) {
    console.log('[Phase 2] Fetching servant details...');
    ensureDir(join(DATA_DIR, 'servants'));
    const index = JSON.parse(readFileSync(join(DATA_DIR, 'servant-index.json'), 'utf-8'));
    const servants = index.servants;
    let done = 0, total = servants.length;
    for (let i = 0; i < servants.length; i += batchSize) {
        const batch = servants.slice(i, i + batchSize);
        for (const s of batch) {
            const outPath = join(DATA_DIR, 'servants', `${s.pageid}.json`);
            if (existsSync(outPath)) { done++; continue; }
            try {
                const data = curlGet(`${API_BASE}?action=parse&pageid=${s.pageid}&prop=wikitext|images&format=json`);
                const wikitext = data.parse.wikitext['*'];
                const images = data.parse.images || [];
                const parsed = parseServant(wikitext, s.title);
                parsed.pageid = s.pageid;
                parsed.card_images = images.filter(img => img.includes('卡面') && img.endsWith('.png'));
                writeFileSync(outPath, JSON.stringify(parsed, null, 2));
                done++;
            } catch (e) { console.error(`  ERR: ${s.title} - ${e.message}`); }
            await new Promise(r => setTimeout(r, 50));
        }
        if (done % 50 === 0 || done === total) console.log(`  Progress: ${done}/${total}`);
    }
    console.log(`  Done: ${done} servants parsed`);
}

// ===== Phase 3: Download images =====
async function phase3_fetchImages() {
    console.log('[Phase 3] Downloading servant images...');
    ensureDir(IMAGE_DIR);
    const p3Dir = join(DATA_DIR, 'servants');
    const p3Files = readdirSync(p3Dir).filter(f => f.endsWith('.json'));
    let imgDone = 0;
    for (const file of p3Files) {
        const servant = JSON.parse(readFileSync(join(p3Dir, file), 'utf-8'));
        if (!servant.card_images || servant.card_images.length === 0) continue;
        for (const img of servant.card_images) {
            const imgName = img.replace(/[\/:*?\"<>|]/g, '_');
            const imgPath = join(IMAGE_DIR, `${servant.pageid}_${imgName}`);
            if (existsSync(imgPath)) continue;
            try {
                const imgUrl = `${MOONCELL_BASE}/images/${img}`;
                execSync(`curl -s -o "${imgPath}" "${imgUrl}"`, { encoding: 'utf-8', timeout: 15000 });
            } catch (e) { /* skip */ }
        }
        imgDone++;
        if (imgDone % 10 === 0) console.log(`  Images: ${imgDone}/${p3Files.length}`);
    }
    console.log(`  Done: images downloaded for ${imgDone} servants`);
}

// ===== Phase 4: Sync =====
async function phase4_sync() {
    console.log('[Phase 4] Syncing to extracted character database...');
    const p4Dir = join(DATA_DIR, 'servants');
    const mooncellDir = join(EXTRACTED, 'mooncell');
    ensureDir(mooncellDir);
    const p4Files = readdirSync(p4Dir).filter(f => f.endsWith('.json'));
    const mooncellIndex = { schema: 'mooncell-servant-index-v1', source: 'Mooncell FGO Wiki', fetchedAt: new Date().toISOString(), total: p4Files.length, servants: [] };
    for (const file of p4Files) {
        const servant = JSON.parse(readFileSync(join(p4Dir, file), 'utf-8'));
        writeFileSync(join(mooncellDir, file), JSON.stringify(servant, null, 2));
        mooncellIndex.servants.push({ pageid: servant.pageid, name_zh: servant.name_zh, name_jp: servant.name_jp, name_en: servant.name_en, class: servant.class, rarity: servant.rarity, id: servant.id });
    }
    writeFileSync(join(mooncellDir, 'index.json'), JSON.stringify(mooncellIndex, null, 2));
    console.log(`  Done: ${p4Files.length} servants synced`);

    // Update extracted characters/index.json
    const charIndexPath = join(EXTRACTED, '../index.json');
    if (existsSync(charIndexPath)) {
        const charIndex = JSON.parse(readFileSync(charIndexPath, 'utf-8'));
        const existing = charIndex.formalRecordFamilies.find(f => f.familyId === 'mooncell-servant-database');
        if (!existing) {
            charIndex.formalRecordFamilies.push({
                familyId: 'mooncell-servant-database',
                sourcePilot: 'mooncell-scraper',
                recordType: 'entity',
                continuityScope: ['fgo-all-servants'],
                acceptedArtifactRefs: ['characters/fgo-part1/mooncell/index.json', 'characters/fgo-part1/mooncell/'],
                summaryCountRef: 'characters/fgo-part1/mooncell/index.json#/total',
                sourceType: 'mooncell-wiki-api',
                credibility: 'B',
                canonStatus: 'canon-like',
                candidateOnly: false,
                sourceGap: false,
            });
            writeFileSync(charIndexPath, JSON.stringify(charIndex, null, 2));
            console.log('  Updated characters/index.json');
        }
    }
}

// ===== Main =====
const phase = process.argv[2] || 'all';
const BATCH = parseInt(process.argv[3]) || 5;

(async () => {
    if (phase === '1' || phase === 'all') await phase1_fetchList();
    if (phase === '2' || phase === 'all') await phase2_fetchDetails(BATCH);
    if (phase === '3' || phase === 'all') await phase3_fetchImages();
    if (phase === '4' || phase === 'all') await phase4_sync();
    console.log('Pipeline complete.');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
