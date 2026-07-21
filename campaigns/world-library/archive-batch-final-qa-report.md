# World Library Batch Archive QA Report

Generated: 2026-07-21T01:38:02.902Z

## Scope

- Newly archived/normalized worlds in this run: **54**
  - Remaining imported worlds archived in batch: **52**
  - Earlier same-session archives included in final QA: **acg-character-database**, **naruto**
- All outputs are sourceRef-first and local-worldbook-backed.
- No remote commit/push was performed.

## Final validation status

- JSON validation for 54 new archives: **8781 JSON files checked, 0 bad**
- Forbidden basename check for 54 new archives: **0 hits**
  - Forbidden: `characters.json`, `events.json`, `relationships.json`, `facts.json`, `graph.json`, `timeline.json`
- Formal metadata coverage for 54 new archives: **7555 records checked, 0 missing**
  - Required metadata: `sourceRefs`, `sourceType`, `credibility`, `canonStatus`
- Import/archive parity: **63 imported worldviews, 63 archived world dirs, 0 remaining imports**
- Extracted manifest parity after legacy manifest pass: **63/63 archived dirs have extracted/manifest.json**

## Totals for 54 new archives

```json
{
  "sourceEntries": 7720,
  "sourceFiles": 59,
  "characters": 2246,
  "abilities": 1624,
  "items": 112,
  "factions": 339,
  "locations": 392,
  "events": 264,
  "systems": 234,
  "knowledge": 714,
  "engineRules": 1453,
  "graphNodes": 5868,
  "graphEdges": 16693,
  "derivedMentionEdges": 16693,
  "psychologicalModels": 46,
  "instructionEntries": 2,
  "organizations": 124,
  "rules": 7,
  "sourceRefCooccurrenceEdges": 0
}
```

## Repair passes

- Misclassified-character cleanup: moved **1012** obvious non-character records out of `characters` into `engine-rules`, `systems`, `events`, or `locations`.
- Character restoration pass: moved **774** records with explicit character structure back into `characters`.
- Graph rebuild pass: rebuilt derived graphs for **52** batch worlds; latest total for those graphs: **5252 nodes / 10817 edges**.
- Legacy manifest pass: added minimal legacy `extracted/manifest.json` for **8** pre-existing worlds without changing/renaming their legacy extracted files.
- Alias normalization pass: updated **483** character files and added **416** stable base-name aliases.
- Alias cleanup pass: cleaned **161** character files and removed **169** invalid/regex/unbalanced aliases.

## Per-world counts

| slug | sourceEntries | characters | abilities | factions/orgs | locations | events | engineRules | graphNodes | graphEdges |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| absolute-duo | 75 | 27 | 13 | 0 | 0 | 4 | 30 | 45 | 87 |
| acg-character-database | 395 | 188 |  |  |  |  |  |  |  |
| akame-ga-kill | 38 | 22 | 5 | 1 | 0 | 0 | 5 | 33 | 154 |
| black-bullet | 159 | 37 | 31 | 15 | 19 | 2 | 9 | 150 | 230 |
| blue-archive | 25 | 0 | 7 | 11 | 0 | 1 | 0 | 25 | 12 |
| bocchi-the-rock | 9 | 0 | 1 | 1 | 0 | 0 | 0 | 9 | 0 |
| cheng-long-adventures | 40 | 3 | 17 | 1 | 2 | 0 | 0 | 40 | 65 |
| chunibyo | 12 | 10 | 0 | 0 | 0 | 1 | 1 | 11 | 0 |
| claymore | 11 | 3 | 4 | 0 | 0 | 0 | 3 | 8 | 1 |
| cross-ange | 89 | 33 | 5 | 0 | 0 | 0 | 46 | 43 | 60 |
| d-gray-man | 113 | 35 | 9 | 2 | 0 | 3 | 20 | 93 | 205 |
| dantalian-no-shoka | 59 | 6 | 3 | 5 | 5 | 1 | 16 | 43 | 16 |
| date-a-live | 37 | 25 | 0 | 1 | 0 | 0 | 10 | 27 | 10 |
| dragon-ball | 215 | 138 | 26 | 3 | 26 | 2 | 12 | 203 | 135 |
| dungeon-fighter-online | 629 | 125 | 254 | 54 | 52 | 11 | 20 | 609 | 1875 |
| elemental-gelade | 79 | 31 | 8 | 0 | 1 | 0 | 37 | 42 | 39 |
| evangelion | 88 | 25 | 24 | 1 | 5 | 0 | 20 | 68 | 65 |
| gate-jsdf | 156 | 23 | 45 | 22 | 5 | 9 | 20 | 136 | 106 |
| haganai | 21 | 13 | 2 | 2 | 0 | 0 | 0 | 21 | 62 |
| honkai-impact-3rd | 683 | 17 | 232 | 48 | 68 | 23 | 171 | 512 | 1703 |
| ikki-tousen | 143 | 93 | 3 | 2 | 1 | 0 | 32 | 111 | 445 |
| jojo | 7 | 1 | 6 | 0 | 0 | 0 | 0 | 7 | 8 |
| kaguya-sama | 80 | 39 | 4 | 4 | 8 | 4 | 15 | 65 | 22 |
| kekkaishi | 100 | 45 | 12 | 6 | 3 | 21 | 12 | 88 | 1 |
| kenichi | 283 | 95 | 58 | 4 | 9 | 2 | 72 | 211 | 695 |
| kill-la-kill | 72 | 16 | 19 | 13 | 4 | 0 | 6 | 66 | 88 |
| kimetsu-no-yaiba | 355 | 130 | 143 | 4 | 15 | 2 | 26 | 329 | 1350 |
| madan-no-ou | 93 | 41 | 1 | 0 | 0 | 30 | 20 | 73 | 121 |
| majo-no-tabitabi | 19 | 1 | 14 | 0 | 0 | 0 | 0 | 19 | 39 |
| marvel-cinematic-universe | 273 | 54 | 92 | 12 | 9 | 7 | 69 | 204 | 35 |
| monster-hunter | 49 | 1 | 9 | 5 | 7 | 0 | 5 | 44 | 2 |
| naruto | 701 | 159 | 132 | 124 | 26 | 81 | 85 | 616 | 5876 |
| negima-uq-holder | 223 | 142 | 8 | 0 | 0 | 0 | 73 | 150 | 97 |
| omamori-himari | 76 | 28 | 2 | 0 | 0 | 1 | 45 | 31 | 57 |
| overlord | 173 | 32 | 22 | 1 | 2 | 5 | 99 | 70 | 116 |
| persona-5 | 59 | 15 | 20 | 8 | 5 | 0 | 8 | 51 | 120 |
| record-of-ragnarok | 157 | 55 | 37 | 3 | 4 | 3 | 26 | 131 | 95 |
| rozen-maiden | 97 | 21 | 2 | 0 | 4 | 1 | 20 | 77 | 68 |
| seikoku-no-dragonar | 207 | 28 | 50 | 24 | 28 | 2 | 15 | 192 | 123 |
| sekirei | 89 | 32 | 7 | 1 | 7 | 4 | 35 | 54 | 17 |
| senran-kagura | 228 | 179 | 9 | 5 | 1 | 1 | 32 | 196 | 608 |
| sora-no-otoshimono | 97 | 5 | 23 | 5 | 6 | 5 | 30 | 67 | 158 |
| spice-and-wolf | 100 | 0 | 16 | 10 | 24 | 2 | 21 | 79 | 0 |
| strike-the-blood | 164 | 6 | 66 | 22 | 10 | 4 | 25 | 139 | 233 |
| sword-art-online | 35 | 1 | 4 | 1 | 1 | 0 | 9 | 26 | 18 |
| taimanin | 12 | 5 | 1 | 2 | 0 | 0 | 2 | 10 | 7 |
| testament-sister-new-devil | 94 | 2 | 32 | 7 | 2 | 2 | 15 | 79 | 151 |
| to-love-ru | 108 | 5 | 22 | 11 | 11 | 5 | 36 | 72 | 120 |
| toaru | 74 | 51 | 1 | 0 | 0 | 14 | 6 | 68 | 110 |
| tokyo-ghoul | 87 | 56 | 16 | 4 | 2 | 0 | 9 | 78 | 610 |
| toriko | 99 | 60 | 16 | 0 | 0 | 0 | 19 | 80 | 118 |
| world-god-only-knows | 114 | 33 | 25 | 13 | 3 | 4 | 28 | 86 | 57 |
| xianjian-1 | 298 | 45 | 56 | 5 | 17 | 7 | 136 | 162 | 303 |
| zero-no-tsukaima | 21 | 9 | 10 | 0 | 0 | 0 | 2 | 19 | 0 |

## Notes

- Derived graph files are **navigation/search signals**, not primary fact stores. They are marked `derivedOnly: true`, `primaryFactStore: false`, `introducesNewFacts: false`.
- Engine/status/MVU/output-format rules are isolated under `engine-rules/` where detected.
- ACG Character Database is a `cross-world-character-library`, not a single-world canon archive.
- Naruto has both formal extracted indexes and derived graph compatibility files for existing `world_query graph entityRef=...` behavior.
- `.pi/extensions/world-query.ts` was updated for generic derived graph lookup, organization search support, manifest display fallback, and extracted exact-name ranking logic. Current running tool instances may need extension reload/restart to pick up all ranking changes.
