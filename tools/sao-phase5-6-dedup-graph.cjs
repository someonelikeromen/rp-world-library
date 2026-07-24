/**
 * Phase 5: Deduplication - identify duplicate entities across sources.
 * Phase 6: Graph building - extract relationships from descriptions.
 */
const fs = require('fs');
const path = require('path');

const extractedDir = 'E:/pi-st/campaigns/world-library/manual-curation/sword-art-online/extracted';
const graphDir = path.join(extractedDir, 'graph');
fs.mkdirSync(graphDir, { recursive: true });

// Load all extracted JSON
const entities = [];
for (const cat of fs.readdirSync(extractedDir)) {
  const catDir = path.join(extractedDir, cat);
  if (!fs.statSync(catDir).isDirectory()) continue;
  if (cat === 'graph') continue;
  
  for (const f of fs.readdirSync(catDir)) {
    if (!f.endsWith('.json') || f === 'index.json') continue;
    const j = JSON.parse(fs.readFileSync(path.join(catDir, f), 'utf-8'));
    entities.push(j);
  }
}

console.log(`Total entities: ${entities.length}`);

// === Phase 5: Deduplication ===
// Group by name similarity (same name from different sources)
const nameGroups = new Map();
for (const e of entities) {
  const key = e.name.replace(/[·•·\s]/g, '').toLowerCase();
  if (!nameGroups.has(key)) nameGroups.set(key, []);
  nameGroups.get(key).push(e);
}

const duplicates = [];
const merged = new Map();
for (const [name, group] of nameGroups) {
  if (group.length <= 1) {
    merged.set(name, group[0]);
    continue;
  }
  // Multiple entities with same name - merge
  const primary = group[0];
  const sources = group.map(g => ({ source: g.source, sourceFile: g.sourceFile }));
  // Append descriptions from all sources
  const allDescriptions = group.map(g => g.description).join('\n\n---\n\n');
  primary.description = allDescriptions;
  primary.sources = sources;
  duplicates.push({
    name: primary.name,
    id: primary.id,
    count: group.length,
    sources: sources.map(s => `${s.source}/${s.sourceFile}`),
  });
  merged.set(name, primary);
}

console.log(`\n=== Phase 5: Deduplication ===`);
console.log(`Unique entities after dedup: ${merged.size} (from ${entities.length})`);
console.log(`Duplicate groups: ${duplicates.length}`);
console.log(`\nTop duplicates:`);
duplicates.slice(0, 15).forEach(d => {
  console.log(`  ${d.name}: ${d.count} sources ${d.sources.map(s => s.split('/')[1]).join(', ')}`);
});

// Write dedup report
const dupReport = {
  phase: 5,
  totalEntities: entities.length,
  uniqueEntities: merged.size,
  duplicateGroups: duplicates.length,
  duplicates: duplicates.map(d => ({
    name: d.name,
    id: d.id,
    sources: d.sources,
  })),
};
fs.writeFileSync(
  path.join(extractedDir, '..', 'duplicates-report.json'),
  JSON.stringify(dupReport, null, 2)
);

// === Phase 6: Graph Building ===
// Extract relationships from entity descriptions using keyword patterns
const nodes = [];
const edges = [];
const entityById = new Map();

// Build nodes
for (const e of entities) {
  const node = {
    id: e.id,
    name: e.name,
    type: e.type,
    source: e.source,
    category: e.type,
  };
  nodes.push(node);
  entityById.set(e.id, e);
}

// Extract edges from content
const relationPatterns = [
  // Chinese patterns
  { pattern: /属于\s*(.+?)(?:[，,。\n]|$)/g, type: 'belongs_to' },
  { pattern: /位于\s*(.+?)(?:[，,。\n]|$)/g, type: 'located_in' },
  { pattern: /拥有\s*(.+?)(?:[，,。\n]|$)/g, type: 'has' },
  { pattern: /公会[：:]\s*(.+?)(?:[，,。\n]|$)/g, type: 'member_of' },
  { pattern: /武器[：:]\s*(.+?)(?:[，,。\n]|$)/g, type: 'wields' },
  { pattern: /使用\s*(.+?)(?:[，,。\n]|$)/g, type: 'uses' },
  { pattern: /楼层\s*(\d+)/g, type: 'on_floor' },
  { pattern: /Boss[：:]\s*(.+?)(?:[，,。\n]|$)/g, type: 'boss_of' },
  { pattern: /关系[：:]\s*(.+?)(?:[，,。\n]|$)/g, type: 'related_to' },
];

let edgeCount = 0;
for (const e of entities) {
  const desc = e.description;
  for (const { pattern, type } of relationPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(desc)) !== null) {
      const targetName = match[1].trim();
      // Find target entity by name
      const target = entities.find(t => 
        t.name.includes(targetName) || targetName.includes(t.name));
      if (target && target.id !== e.id) {
        edges.push({
          source: e.id,
          target: target.id,
          type,
          description: match[0],
        });
        edgeCount++;
      }
    }
  }
}

// Also add source-based edges (same character from different sources)
for (const d of duplicates) {
  const group = entities.filter(e => e.name === d.name);
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      edges.push({
        source: group[i].id,
        target: group[j].id,
        type: 'same_entity',
        description: 'Same entity from different sources',
      });
    }
  }
}

console.log(`\n=== Phase 6: Graph ===`);
console.log(`Nodes: ${nodes.length}`);
console.log(`Edges: ${edges.length}`);

// Write graph files
const graph = {
  phase: 6,
  generated: new Date().toISOString(),
  nodes,
  edges,
};

fs.writeFileSync(path.join(graphDir, 'nodes.json'), JSON.stringify(nodes, null, 2));
fs.writeFileSync(path.join(graphDir, 'edges.json'), JSON.stringify(edges, null, 2));

// Adjacency index
const adjacency = {};
for (const node of nodes) {
  adjacency[node.id] = {
    outgoing: edges.filter(e => e.source === node.id).map(e => ({ target: e.target, type: e.type })),
    incoming: edges.filter(e => e.target === node.id).map(e => ({ source: e.source, type: e.type })),
  };
}
fs.writeFileSync(path.join(graphDir, 'adjacency-index.json'), JSON.stringify(adjacency, null, 2));

console.log('Graph files written to', graphDir);
