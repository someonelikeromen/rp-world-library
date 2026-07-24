/**
 * Phase 8: Timeline extraction and cross-linking.
 * Scans all entity descriptions for date/year references,
 * builds chronological timeline and links entities.
 */
const fs = require('fs');
const path = require('path');

const extractedDir = 'E:/pi-st/campaigns/world-library/worlds/sword-art-online/extracted';
const timelineDir = path.join(extractedDir, 'timelines');
fs.mkdirSync(timelineDir, { recursive: true });

// Load all entities
const entities = [];
for (const cat of fs.readdirSync(extractedDir)) {
  const catDir = path.join(extractedDir, cat);
  if (!fs.statSync(catDir).isDirectory() || cat === 'graph' || cat === 'timelines') continue;
  for (const f of fs.readdirSync(catDir)) {
    if (!f.endsWith('.json') || f === 'index.json') continue;
    entities.push(JSON.parse(fs.readFileSync(path.join(catDir, f), 'utf-8')));
  }
}

// Extract date references from descriptions
const datePatterns = [
  // Year patterns
  { pattern: /2022年\s*(\d+)月\s*(\d+)日/g, extract: (m) => ({ year: 2022, month: parseInt(m[1]), day: parseInt(m[2]) }) },
  { pattern: /2023年\s*(\d+)月\s*(\d+)日/g, extract: (m) => ({ year: 2023, month: parseInt(m[1]), day: parseInt(m[2]) }) },
  { pattern: /2024年\s*(\d+)月\s*(\d+)日/g, extract: (m) => ({ year: 2024, month: parseInt(m[1]), day: parseInt(m[2]) }) },
  { pattern: /2025年\s*(\d+)月\s*(\d+)日/g, extract: (m) => ({ year: 2025, month: parseInt(m[1]), day: parseInt(m[2]) }) },
  { pattern: /2022年\s*(\d+)月/g, extract: (m) => ({ year: 2022, month: parseInt(m[1]), day: null }) },
  { pattern: /2023年\s*(\d+)月/g, extract: (m) => ({ year: 2023, month: parseInt(m[1]), day: null }) },
  { pattern: /2024年\s*(\d+)月/g, extract: (m) => ({ year: 2024, month: parseInt(m[1]), day: null }) },
  { pattern: /2025年\s*(\d+)月/g, extract: (m) => ({ year: 2025, month: parseInt(m[1]), day: null }) },
  // Year only
  { pattern: /2022年/g, extract: () => ({ year: 2022, month: null, day: null }) },
  { pattern: /2023年/g, extract: () => ({ year: 2023, month: null, day: null }) },
  { pattern: /2024年/g, extract: () => ({ year: 2024, month: null, day: null }) },
  // ISO dates
  { pattern: /2022[-\/](\d{1,2})[-\/](\d{1,2})/g, extract: (m) => ({ year: 2022, month: parseInt(m[1]), day: parseInt(m[2]) }) },
  { pattern: /2023[-\/](\d{1,2})[-\/](\d{1,2})/g, extract: (m) => ({ year: 2023, month: parseInt(m[1]), day: parseInt(m[2]) }) },
  { pattern: /2024[-\/](\d{1,2})[-\/](\d{1,2})/g, extract: (m) => ({ year: 2024, month: parseInt(m[1]), day: parseInt(m[2]) }) },
  // SAO-specific: Nov 2022
  { pattern: /11月6日/g, extract: (m) => ({ year: 2022, month: 11, day: 6 }) },
  { pattern: /11月\s*7日/g, extract: (m) => ({ year: 2022, month: 11, day: 7 }) },
  // Season references
  { pattern: /SAO死亡游戏.{0,5}开始/g, extract: () => ({ year: 2022, month: 11, day: 6 }) },
  { pattern: /SAO.{0,10}通关/g, extract: () => ({ year: 2024, month: 11, day: 7 }) },
];

// Timeline entries
const timeline = [];
const entityLinks = new Map(); // entityId -> timeline entries

for (const e of entities) {
  const desc = e.description;
  let hasDate = false;
  
  for (const { pattern, extract } of datePatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(desc)) !== null) {
      const date = extract(match);
      if (!date.year) continue;
      
      const dateKey = `${date.year}-${String(date.month || 0).padStart(2, '0')}-${String(date.day || 0).padStart(2, '0')}`;
      const entry = {
        date: dateKey,
        entityId: e.id,
        entityName: e.name,
        entityType: e.type,
        context: desc.substring(Math.max(0, match.index - 50), match.index + match[0].length + 100).trim(),
      };
      timeline.push(entry);
      
      if (!entityLinks.has(e.id)) entityLinks.set(e.id, []);
      entityLinks.get(e.id).push(dateKey);
      hasDate = true;
    }
  }
  
  // Special: explicit timeline entities
  if (e.name.includes('时间线') || e.name.includes('年') || e.name.includes('篇')) {
    if (!hasDate) {
      // Extract any year from the name or description
      for (const y of [2022, 2023, 2024, 2025]) {
        if (desc.includes(`${y}年`) || e.name.includes(`${y}`)) {
          timeline.push({
            date: `${y}-00-00`,
            entityId: e.id,
            entityName: e.name,
            entityType: e.type,
            context: e.name,
          });
          break;
        }
      }
    }
  }
}

// Sort by date
timeline.sort((a, b) => a.date.localeCompare(b.date));

// Group by month/year
const grouped = {};
for (const t of timeline) {
  const groupKey = t.date.substring(0, 7);
  if (!grouped[groupKey]) grouped[groupKey] = [];
  grouped[groupKey].push(t);
}

// Build timeline JSON
const timelineOutput = {
  title: 'SAO 时间轴',
  generated: new Date().toISOString(),
  totalEntries: timeline.length,
  dateRange: {
    earliest: timeline[0]?.date || '2022-00-00',
    latest: timeline[timeline.length - 1]?.date || '2025-00-00',
  },
  byMonth: {},
  entries: timeline,
};

// Fill byMonth
for (const [key, entries] of Object.entries(grouped).sort()) {
  timelineOutput.byMonth[key] = {
    count: entries.length,
    entries: entries.map(e => ({
      date: e.date,
      entity: e.entityName,
      type: e.entityType,
      context: e.context,
    })),
  };
}

fs.writeFileSync(path.join(timelineDir, 'timeline.json'), JSON.stringify(timelineOutput, null, 2));

// Write timeline-index.json per year
const byYear = {};
for (const t of timeline) {
  const year = t.date.substring(0, 4);
  if (!byYear[year]) byYear[year] = [];
  byYear[year].push(t);
}

for (const [year, entries] of Object.entries(byYear)) {
  fs.writeFileSync(
    path.join(timelineDir, `${year}.json`),
    JSON.stringify({
      year,
      count: entries.length,
      entries: entries.map(e => ({
        date: e.date,
        entity: e.entityName,
        type: e.entityType,
        context: e.context,
      })),
    }, null, 2)
  );
}

// Write index
const timelineIndex = {
  years: Object.keys(byYear).sort(),
  totalEntries: timeline.length,
  files: Object.keys(byYear).map(y => `${y}.json`),
};
fs.writeFileSync(path.join(timelineDir, 'index.json'), JSON.stringify(timelineIndex, null, 2));

console.log(`Timeline: ${timeline.length} entries across ${Object.keys(byYear).length} years`);
console.log(`Monthly breakdown:`);
for (const [key, entries] of Object.entries(grouped).sort()) {
  console.log(`  ${key}: ${entries.length} entries`);
}
