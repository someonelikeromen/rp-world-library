#!/usr/bin/env node
// wl — world-library search & index tool
// 用法:
//   node tools/world-index/cli.js build                 重建全量索引
//   node tools/world-index/cli.js search <world> <kw>   搜索世界
//   node tools/world-index/cli.js get <world> <uid>     获取条目全文
//   node tools/world-index/cli.js worlds                列出世界及状态
//   node tools/world-index/cli.js chars <world> [kw]    列出/搜索角色
//   node tools/world-index/cli.js story <world> <id>    列出故事章节
//   node tools/world-index/cli.js story read <w> <s> <c> 读故事章节

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const INDEX_PATH = path.join(PROJECT_ROOT, 'campaigns/world-library/.wl-index.json');
const WORLDS_DIR = path.join(PROJECT_ROOT, 'campaigns/world-library/worlds');
const IMPORTS_DIR = path.join(PROJECT_ROOT, 'campaigns/world-library/imports/worldviews');

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) return { version: 1, worlds: {} };
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
}

function saveIndex(idx) {
  idx.builtAt = new Date().toISOString();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
}

// ============== BUILD ==============
function build() {
  console.log('Building world library index...');
  const idx = { version: 1, worlds: {} };

  // Scan curated worlds
  if (fs.existsSync(WORLDS_DIR)) {
    for (const slug of fs.readdirSync(WORLDS_DIR)) {
      const curatedPath = path.join(WORLDS_DIR, slug, 'curated');
      if (!fs.existsSync(curatedPath)) continue;

      const world = { status: 'curated', slug, path: `worlds/${slug}/curated/` };

      // Characters
      const charsPath = path.join(curatedPath, 'characters-index.json');
      if (fs.existsSync(charsPath)) {
        try {
          const chars = JSON.parse(fs.readFileSync(charsPath, 'utf-8'));
          const byName = {};
          const byKey = {};
          for (const ch of (chars.characters || [])) {
            const entry = {
              id: ch.id,
              name: ch.name,
              summary: (ch.summary || '').substring(0, 150),
              aliases: ch.aliases || [],
              factions: ch.factions || [],
              powerSystems: ch.powerSystems || [],
              importance: ch.importance || 'medium',
              sourceRefs: ch.sourceRefs || []
            };
            byName[ch.name] = entry;
            for (const k of (ch.sourceKeys || [])) {
              if (!byKey[k]) byKey[k] = [];
              byKey[k].push(ch.id);
            }
            for (const a of (ch.aliases || [])) {
              if (!byKey[a]) byKey[a] = [];
              byKey[a].push(ch.id);
            }
          }
          world.characters = { 
            count: chars.characters.length, 
            byName,
            byKey,
            majorCharacters: (chars.indices && chars.indices.majorCharacters) || []
          };
        } catch (e) { console.log('  WARN ' + slug + ' characters: ' + e.message); }
      }

      // World
      const worldPath = path.join(curatedPath, 'world.json');
      if (fs.existsSync(worldPath)) {
        try {
          const w = JSON.parse(fs.readFileSync(worldPath, 'utf-8'));
          world.world = {
            powerSystems: (w.powerSystems || []).map(p => ({ id: p.id, name: p.name, summary: (p.summary||'').substring(0, 100) })),
            factions: (w.factions || []).map(f => ({ id: f.id, name: f.name, summary: (f.summary||'').substring(0, 100) })),
            rules: (w.rules || []).map(r => ({ id: r.id, name: r.name, summary: (r.summary||'').substring(0, 100) })),
            locations: (w.locations || []).map(l => ({ id: l.id, name: l.name, summary: (l.summary||'').substring(0, 100) })),
            events: (w.events || []).concat(w.publicEvents || []).concat(w.hiddenEvents || []).map(e => ({ id: e.id, name: e.name, summary: (e.summary||'').substring(0, 100) })),
            timelines: (w.timelines || []).map(t => ({ id: t.id, name: t.name, summary: (t.summary||'').substring(0, 100) })),
            extensions: Object.keys(w.extensions || {})
          };
        } catch (e) { console.log('  WARN ' + slug + ' world: ' + e.message); }
      }

      // Mechanics supplement
      const mechSupp = path.join(curatedPath, 'mechanics-supplement.md');
      if (fs.existsSync(mechSupp)) {
        try {
          const mech = fs.readFileSync(mechSupp, 'utf-8');
          const sections = mech.split(/\n## /);
          world.mechanics = [];
          for (const s of sections.slice(1)) {
            const titleEnd = s.indexOf('\n');
            const title = s.substring(0, titleEnd).trim();
            if (title.length > 0) world.mechanics.push({ title, preview: s.substring(titleEnd, titleEnd + 150).trim() });
          }
        } catch (e) {}
      }

      // Stories
      const storiesDir = path.join(curatedPath, 'stories');
      if (fs.existsSync(storiesDir)) {
        world.stories = {};
        for (const storyId of fs.readdirSync(storiesDir)) {
          const indexFile = path.join(storiesDir, storyId, 'index.json');
          if (fs.existsSync(indexFile)) {
            try {
              const si = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
              world.stories[storyId] = {
                title: si.title || storyId,
                chapters: si.totalChapters || 0,
                arcs: (si.arcs || []).map(a => ({ id: a.id, name: a.name, summary: a.summary, file: a.file }))
              };
            } catch (e) {}
          }
        }
      }

      idx.worlds[slug] = world;
      console.log('  ' + slug + ': curated, ' + (world.characters ? world.characters.count : 0) + ' chars, ' + 
        (world.stories ? Object.keys(world.stories).length : 0) + ' stories');
    }
  }

  // Scan raw worlds (not yet curated)
  if (fs.existsSync(IMPORTS_DIR)) {
    for (const slug of fs.readdirSync(IMPORTS_DIR)) {
      if (idx.worlds[slug]) continue; // Already curated
      const wbDir = path.join(IMPORTS_DIR, slug, 'worldbooks');
      if (!fs.existsSync(wbDir)) continue;

      const files = fs.readdirSync(wbDir).filter(f => f.endsWith('.json'));
      let totalEntries = 0;
      let sampleComments = [];
      for (const fn of files.slice(0, 3)) {
        try {
          const d = JSON.parse(fs.readFileSync(path.join(wbDir, fn), 'utf-8'));
          totalEntries += (d.entries || []).length;
          for (const e of (d.entries || []).slice(0, 50)) {
            if (e.comment && e.comment.length > 0) sampleComments.push(e.comment);
          }
        } catch (e) {}
      }

      idx.worlds[slug] = {
        status: 'raw',
        slug,
        path: `imports/worldviews/${slug}/worldbooks/`,
        files: files.length,
        entries: totalEntries,
        sampleComments: [...new Set(sampleComments)].slice(0, 100)
      };
      console.log('  ' + slug + ': raw, ' + files.length + ' files, ~' + totalEntries + ' entries');
    }
  }

  saveIndex(idx);
  console.log('\nIndex: ' + Object.keys(idx.worlds).length + ' worlds');
  console.log('  curated: ' + Object.values(idx.worlds).filter(w => w.status === 'curated').length);
  console.log('  raw: ' + Object.values(idx.worlds).filter(w => w.status === 'raw').length);
}

// ============== SEARCH ==============
function search(worldSlug, keyword) {
  const idx = loadIndex();
  const world = idx.worlds[worldSlug];
  if (!world) { console.log('World not found: ' + worldSlug); return; }

  const kw = keyword.toLowerCase();
  const results = [];

  if (world.status === 'curated' && world.characters) {
    // Search mechanics supplement
    for (const m of (world.mechanics || [])) {
      if (m.title.toLowerCase().includes(kw) || (m.preview||'').toLowerCase().includes(kw)) {
        results.push({ type: 'mechanics', title: m.title, preview: m.preview });
      }
    }
    // Search world-rules
    const wrDir = path.join(WORLDS_DIR, worldSlug, 'curated', 'world-rules');
    if (fs.existsSync(wrDir)) {
      for (const fn of fs.readdirSync(wrDir)) {
        if (!fn.endsWith('.md')) continue;
        const wr = fs.readFileSync(path.join(wrDir, fn), 'utf-8');
        if (wr.toLowerCase().includes(kw)) {
          results.push({ type: 'world-rule', file: fn, preview: wr.substring(0, 150) });
        }
      }
    }
    // Search characters by name, alias, key
    for (const [name, entry] of Object.entries(world.characters.byName)) {
      if (name.toLowerCase().includes(kw)) {
        results.push({ type: 'character', match: 'name', name, ...entry });
      }
    }
    for (const [key, ids] of Object.entries(world.characters.byKey)) {
      if (key.toLowerCase().includes(kw)) {
        for (const id of ids) {
          const ch = Object.values(world.characters.byName).find(c => c.id === id);
          if (ch && !results.find(r => r.id === id)) {
            results.push({ type: 'character', match: 'key:' + key, name: ch.name, ...ch });
          }
        }
      }
    }
    // Search world
    for (const section of ['powerSystems', 'factions', 'rules', 'locations', 'events', 'timelines']) {
      for (const item of (world.world || {})[section] || []) {
        if ((item.name || '').toLowerCase().includes(kw) || (item.summary || '').toLowerCase().includes(kw)) {
          results.push({ type: section, name: item.name, summary: item.summary, id: item.id });
        }
      }
    }
    // Search stories
    for (const [storyId, story] of Object.entries(world.stories || {})) {
      for (const arc of (story.arcs || [])) {
        if ((arc.name || '').toLowerCase().includes(kw) || (arc.summary || '').toLowerCase().includes(kw)) {
          results.push({ type: 'story', story: storyId, chapter: arc.name, summary: arc.summary, file: arc.file });
        }
      }
    }
  }

  if (world.status === 'raw') {
    // Search sample comments
    for (const comment of (world.sampleComments || [])) {
      if (comment.toLowerCase().includes(kw)) {
        results.push({ type: 'raw-entry', comment });
      }
    }
    if (results.length === 0) {
      results.push({ type: 'hint', text: 'Raw world — use grep to search full content:\n  grep -li "' + keyword + '" ' + IMPORTS_DIR + '/' + worldSlug + '/worldbooks/*.json' });
    }
  }

  console.log(JSON.stringify({ world: worldSlug, keyword, count: results.length, results }, null, 2));
}

// ============== GET ==============
function get(worldSlug, uid) {
  const curatedPath = path.join(WORLDS_DIR, worldSlug, 'curated', 'characters-index.json');
  if (!fs.existsSync(curatedPath)) { console.log('Curated data not found'); return; }
  const chars = JSON.parse(fs.readFileSync(curatedPath, 'utf-8'));
  const ch = (chars.characters || []).find(c => c.id === uid || c.name === uid);
  if (!ch) { console.log('Character not found: ' + uid); return; }
  console.log('# ' + ch.name + '\n');
  console.log('## Summary\n' + (ch.summary || '') + '\n');
  console.log('## Detail\n' + (ch.detail || '') + '\n');
  if (ch.sourceRefs) console.log('## Source\n' + ch.sourceRefs.join('\n'));
}

// ============== WORLDS ==============
function worlds(filter) {
  const idx = loadIndex();
  const list = Object.entries(idx.worlds).sort((a, b) => {
    if (a[1].status === 'curated' && b[1].status !== 'curated') return -1;
    if (a[1].status !== 'curated' && b[1].status === 'curated') return 1;
    return a[0].localeCompare(b[0]);
  });

  for (const [slug, w] of list) {
    if (filter && !slug.includes(filter)) continue;
    const status = w.status === 'curated' ? '✅' : '⏳';
    let info = '';
    if (w.characters) info += w.characters.count + ' chars';
    if (w.stories) info += ', ' + Object.keys(w.stories).length + ' stories';
    if (w.entries) info += '~' + w.entries + ' entries';
    console.log(status + ' ' + slug + ' [' + w.status + '] ' + info);
  }
}

// ============== CHARS ==============
function chars(worldSlug, kw) {
  const idx = loadIndex();
  const world = idx.worlds[worldSlug];
  if (!world || !world.characters) { console.log('No character data'); return; }

  let list = Object.entries(world.characters.byName);
  if (kw) {
    const k = kw.toLowerCase();
    list = list.filter(([name]) => name.toLowerCase().includes(k));
  }
  
  console.log(JSON.stringify(list.map(([name, entry]) => ({
    id: entry.id, name, summary: entry.summary, importance: entry.importance, factions: entry.factions
  })), null, 2));
}

// ============== STORY ==============
function story(worldSlug, storyId, chapter) {
  const storyDir = path.join(WORLDS_DIR, worldSlug, 'curated', 'stories', storyId);
  if (!fs.existsSync(storyDir)) { console.log('Story not found: ' + storyId); return; }

  if (chapter) {
    // Read specific chapter — try fuzzy match
    const files = fs.readdirSync(storyDir).filter(f => f.endsWith('.md'));
    let match = files.find(f => f.includes(chapter));
    if (!match) {
      // Try reading index to find matching arc
      const indexFile = path.join(storyDir, 'index.json');
      if (fs.existsSync(indexFile)) {
        const si = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
        const arc = (si.arcs || []).find(a => a.id.includes(chapter) || a.name.includes(chapter));
        if (arc) match = path.basename(arc.file);
      }
    }
    if (!match) { console.log('Chapter not found: ' + chapter); return; }
    console.log(fs.readFileSync(path.join(storyDir, match), 'utf-8'));
  } else {
    // List chapters
    const indexFile = path.join(storyDir, 'index.json');
    if (fs.existsSync(indexFile)) {
      const si = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      console.log('# ' + si.title + ' (' + si.totalChapters + ' chapters)\n');
      for (const arc of (si.arcs || [])) {
        console.log('- **' + arc.name + '**: ' + (arc.summary || ''));
      }
    } else {
      console.log('No index found');
    }
  }
}

// ============== CLI ==============
const cmd = process.argv[2];

if (!cmd || cmd === 'help') {
  console.log(`wl — world library search & index

Usage:
  node tools/world-index/cli.js build                    Rebuild full index
  node tools/world-index/cli.js worlds [filter]          List all worlds
  node tools/world-index/cli.js search <world> <kw>      Search world by keyword
  node tools/world-index/cli.js chars <world> [kw]       List/search characters
  node tools/world-index/cli.js get <world> <uid>         Get character full detail
  node tools/world-index/cli.js story <world> <id>       List story chapters
  node tools/world-index/cli.js story read <w> <s> <c>   Read story chapter`);
  process.exit(0);
}

if (cmd === 'build') build();
else if (cmd === 'search') search(process.argv[3], process.argv[4]);
else if (cmd === 'get') get(process.argv[3], process.argv[4]);
else if (cmd === 'worlds') worlds(process.argv[3]);
else if (cmd === 'chars') chars(process.argv[3], process.argv[4]);
else if (cmd === 'story') {
  if (process.argv[3] === 'read') story(process.argv[4], process.argv[5], process.argv[6]);
  else story(process.argv[3], process.argv[4]);
}
else console.log('Unknown command: ' + cmd);
