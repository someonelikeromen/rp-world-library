/**
 * Final enhanced parser - uses simple string parsing for skill templates
 */
import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA_DIR = join(ROOT, 'tools/mooncell-scraper/data');
const API = 'https://fgo.wiki/api.php';

function curlGet(url) {
    return JSON.parse(execSync(`curl -s "${url}"`, { encoding: 'utf-8', maxBuffer: 10*1024*1024 }));
}

function getField(text, key) {
    const m = text.match(new RegExp(`\\|${key}\\s*=\\s*(.+)`));
    return m ? m[1].trim() : '';
}

// Extract all {{持有技能}} blocks
function parseSkills(t) {
    const skills = [];
    let pos = 0;
    const seen = new Set();
    while ((pos = t.indexOf('{{持有技能', pos)) !== -1) {
        const end = t.indexOf('\n}}', pos);
        if (end === -1) { pos++; continue; }
        const block = t.substring(pos, end);
        
        // Split: {{持有技能|icon|name_zh|name_jp|cooldown\n|effect|v1|v2|...|v10\n|effect2|...
        const lines = block.split('\n');
        const headerParts = lines[0].split('|').map(s => s.trim());
        const icon = headerParts[1] || '';
        const name_zh = headerParts[2] || '';
        const name_jp = headerParts[3] || '';
        const cd = parseInt(headerParts[4]) || 0;
        
        const effects = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('}}')) continue;
            const clean = line.replace(/^\|/, '');
            const parts = clean.split('|').map(s => s.trim());
            const desc = parts[0].replace(/<[^>]+>/g, '');
            const values = parts.slice(1).filter(v => v && v !== '∅');
            if (desc) effects.push({ desc, values });
        }

        const key = `${name_zh}|${cd}`;
        if (!seen.has(key)) {
            seen.add(key);
            skills.push({ icon, name_zh, name_jp, cooldown: cd, effects });
        }
        pos = end + 3;
    }
    return skills;
}

// Extract class skills
function parseClassSkills(t) {
    const csMatch = t.match(/\{\{职阶技能\|([\s\S]*?)\n\}\}/);
    if (!csMatch) return [];
    const skills = [];
    const parts = csMatch[1].split('|').map(p => p.trim()).filter(Boolean);
    for (let i = 0; i + 3 < parts.length; i += 4) {
        skills.push({
            icon: parts[i],
            name_zh: parts[i + 1],
            rank: parts[i + 2],
            effect: parts[i + 3].replace(/<[^>]+>/g, ''),
        });
    }
    return skills;
}

// Extract NP details
function parseNP(t) {
    const npMatches = [...t.matchAll(/\{\{宝具\s*\n([\s\S]*?)\n\}\}/g)];
    if (npMatches.length === 0) return null;
    const lastNP = npMatches[npMatches.length - 1][1];
    const result = {
        name_zh: getField(lastNP, '中文名'),
        name_jp: getField(lastNP, '日文名'),
        card: getField(lastNP, '卡色'),
        type: getField(lastNP, '类型'),
        rank: getField(lastNP, '阶级'),
        category: getField(lastNP, '种类'),
        effects: [],
    };
    const effectKeys = lastNP.match(/\|效果(\w+)=/g) || [];
    for (const ek of effectKeys) {
        const key = ek.match(/效果(\w+)=/)[1];
        const descMatch = lastNP.match(new RegExp(`\\|效果${key}=([^<\\n]+)`));
        const desc = descMatch ? descMatch[1].trim() : '';
        const vals = [];
        for (let lv = 1; lv <= 5; lv++) {
            const vm = lastNP.match(new RegExp(`\\|数值${key}${lv}=([^|\\n]+)`));
            if (vm) vals.push(vm[1].trim());
        }
        if (desc) result.effects.push({ key, effect: desc, levels: vals });
    }
    return result;
}

// Extract profile
function parseProfile(t) {
    const pm = t.match(/\{\{个人资料\s*\n([\s\S]*?)\n\}\}/);
    if (!pm) return {};
    const profile = {};
    const fields = pm[1].split(/\n\|/);
    for (const field of fields) {
        const eqIdx = field.indexOf('=');
        if (eqIdx === -1) continue;
        let key = field.substring(0, eqIdx).trim();
        let val = field.substring(eqIdx + 1).trim();
        if (key.endsWith('条件') || key.endsWith('日文')) continue;
        profile[key] = val;
    }
    return profile;
}

// Extract bond points
function parseBondPoints(t) {
    const bm = t.match(/\{\{牵绊点数\|([^}]+)\}\}/);
    if (!bm) return null;
    return bm[1].split('|').map(n => parseInt(n.trim()) || 0);
}

function parseServantV2(wikitext, title, images) {
    const result = {
        pageid: 0, name_zh: title,
        rarity: 0, class: '', id: '',
        atk_base: 0, atk_max: 0, hp_base: 0, hp_max: 0,
        gender: '', attribute1: '', attribute2: '',
        seiyuu: '', illustrator: '', height: '', weight: '',
        name_jp: '', name_en: '',
        np: null, skills: [], classSkills: [],
        profile: {}, bondPoints: null,
        cardImages: (images || []).filter(img => img.includes('卡面') && img.endsWith('.png')),
    };

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

    result.np = parseNP(wikitext);
    result.skills = parseSkills(wikitext);
    result.classSkills = parseClassSkills(wikitext);
    result.profile = parseProfile(wikitext);
    result.bondPoints = parseBondPoints(wikitext);

    return result;
}

async function main() {
    console.log('Re-scraping all servants with enhanced parser v2...');
    const index = JSON.parse(readFileSync(join(DATA_DIR, 'servant-index.json'), 'utf-8'));
    const outDir = join(DATA_DIR, 'servants');
    mkdirSync(outDir, { recursive: true });

    let done = 0, skipped = 0, failed = 0;
    for (let i = 0; i < index.servants.length; i += 20) {
        const batch = index.servants.slice(i, i + 20);
        for (const s of batch) {
            const outPath = join(outDir, `${s.pageid}.json`);
            try {
                const data = curlGet(`${API}?action=parse&pageid=${s.pageid}&prop=wikitext|images&format=json`);
                const parsed = parseServantV2(data.parse.wikitext['*'], s.title, data.parse.images || []);
                parsed.pageid = s.pageid;
                writeFileSync(outPath, JSON.stringify(parsed, null, 2));
                done++;
            } catch (e) {
                failed++;
            }
            await new Promise(r => setTimeout(r, 50));
        }
        if (done % 100 === 0) console.log(`  Progress: ${done}/${index.servants.length} (${failed} failed)`);
    }
    console.log(`  Done: ${done} scraped, ${failed} failed`);
}

// Run main if called directly
const isMain = process.argv[1] && process.argv[1].includes('rescrape-v2');
if (isMain) main().catch(e => { console.error('FATAL:', e); process.exit(1); });
