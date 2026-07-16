# Source Coverage Diff — FSN/FZ Pilot vs Old Curated

Date: 2026-07-12
Step id: `finalize-retry`

## Old curated/source inputs inspected

- `campaigns/world-library/worlds/type-moon-nasuverse/curated/characters-index.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/world.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/index.json`

## Pilot source inputs

- `source-manifest.json`
- `sources/worldbook-text/*`
- `sources/story-text/fate/*`

## Coverage summary

The pilot source layer includes eight normalized source files:

- 4 worldbook-derived source files.
- 4 curated Fate story source files.
- Fate route, UBW route, HF route, and main-tone story files are copied with metadata blocks.
- Fate/Zero single-entry timeline source is captured as a full single-entry timeline.

## Known pilot source limitations

- FSN core worldbook: 53 registry entries, 3 selected anchor entries normalized.
- FSN sandbox lorebook: 84 registry entries, 2 selected rule/empty anchors normalized.
- `型月 (1).worldbook.json`: 535 registry entries, exact filtered FSN/FZ count unresolved; 10 directly observed anchors recorded.

## Old curated coverage advantages

- Old curated archive covers many more Type-Moon characters and global setting topics.
- Old curated Fate story index has the same four Fate story files used as pilot story text sources.

## Pilot coverage advantages

- Source text files have metadata blocks and stable line-oriented sourceRef bases.
- Source credibility and canonStatus are explicit.
- The package is honest about p1-hybrid status and does not claim official canon source backing.

## Decision

Pilot source coverage is sufficient to validate the FSN/FZ p1-hybrid structure and side-by-side package, but not sufficient for direct replacement of old curated coverage.
