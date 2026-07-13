# Source Entry Selection — FSN/FZ Pilot

Prepared on: 2026-07-12
Status: draft selection for prep gate; source text not built yet

## Read evidence

Authoritative plan/skill read:

- `docs/type-moon-p1-hybrid-archive-plan.md`
- `.pi/skills/type-moon-p1-hybrid-archive/SKILL.md`

Relevant Type-Moon archive/readme/notes read:

- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/README.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/README.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/source-registry.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/curation-notes.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/index.json`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-主基调剧情.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-fate线.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-unlimited_blade_works线.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-heaven-s_feel线.md`
- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/Fate stay night.worldbook.json` partial read
- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/FateStayNight - 沙盒's Lorebook.worldbook.json` partial read
- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/fatezero.worldbook.json`
- `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json` partial read focused on beginning FSN/system entries

Missing or ambiguous paths are logged in `execution-log.md`.

## Source pool decision

### Include: FSN core worldbook

Path:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/Fate stay night.worldbook.json
```

Registry id: `src-fate-stay-night`
Registry count: 53 entries
Registry credibility: B
Registry scope: characters

Use:

- Character and servant source pool for waves 004, 005, 008, 014, 017, 018.
- Must treat as user-file worldbook, not official canon text.
- Must filter RP/character-card styling fields from formal canon-like facts unless directly useful and properly classified.

Initial evidence from partial read: entries contain FSN characters such as Rider/美杜莎, Caster/美狄亚, 间桐樱, with long character-card details and source metadata.

### Include: FSN sandbox lorebook

Path:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/FateStayNight - 沙盒's Lorebook.worldbook.json
```

Registry id: `src-fsn-sandbox`
Registry count: 84 entries
Registry credibility: B
Registry scope: all

Use:

- Main pool for wave-013 sandbox/rp-engine/style-rule stratification.
- Secondary pool for rules/systems only when facts are classified as `sandbox-rule`, `rp-engine-rule`, `discarded-engine-mechanic`, `style-constraint`, or carefully reviewed `canon-like-world-rule`.

Initial evidence from partial read:

- Entry 0 is an empty constant output-rule entry.
- Entry 1 is a large output/world-engine rule block, including Holy Grail War sandbox engine timing, NPC logic, combat metrics, wlog formatting, and RP output constraints.
- This source is engine-heavy; it must not be merged blindly into formal canon-like world rules.

### Include: Fate/Zero worldbook

Path:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/fatezero.worldbook.json
```

Registry id: `src-fate-zero`
Registry count: 1 entry
Registry credibility: A
Registry scope: characters / timeline

Use:

- Primary FZ timeline and fourth-war event pool for waves 012, 015, 016, 017, 018.
- Strong source for ordered FZ events, but still user-file worldbook rather than official source.

Initial evidence from full read: single entry gives a detailed 1994 Fate/Zero timeline, including prehistory, Fourth Holy Grail War events, end state, and postwar notes.

### Include: curated Fate story summaries

Paths:

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-主基调剧情.md
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-fate线.md
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-unlimited_blade_works线.md
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/fate-heaven-s_feel线.md
```

Index path:

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/index.json
```

Count: 4 story files
Source type for later source text: `curated-story-derived`
Credibility: B unless later audit determines otherwise

Use:

- `fate-fate线.md` → wave-009.
- `fate-unlimited_blade_works线.md` → wave-010.
- `fate-heaven-s_feel线.md` → wave-011.
- `fate-主基调剧情.md` → context/comparison only, because it includes crossover/sandbox/fha/fantasy-carnival assumptions outside strict FSN/FZ pilot scope.

### Include: filtered Type-Moon main worldbook entries

Path:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json
```

Registry id: `src-type-moon-main`
Registry count: 535 entries
Registry credibility: B
Registry scope: all

Use:

- Filter to FSN/FZ/冬木/圣杯战争/御三家/魔术协会/英灵/从者/令咒/宝具/第三法/固有结界/相关 route/system entries.
- Do not include broad FGO, Prisma, Tsukihime, Kara no Kyoukai, Mahoyo, Apocrypha, Extra, Strange Fake, Lostbelt entries unless directly needed for terminology disambiguation and explicitly marked out-of-scope/cross-continuity.

Initial direct hits observed in partial read:

- Entry 0 — `Fate/stay night世界线 (基础时间线)`; keys include FSN, 冬木市, 第五次圣杯战争, 卫宫士郎, Fate/Zero, 第四次圣杯战争.
- Entry 6 — `核心机制：英灵与从者系统`.
- Entry 7 — `核心机制：宝具 (Noble Phantasm)`.
- Entry 8 — `核心机制：令咒 (Command Spell)`.
- Entry 9 — `关键组织：魔术协会`.
- Entry 10 — `设定：从者基础七职阶`.
- Entry 11 — `世界法则：根源`.
- Entry 12 — `五大魔法：第三法·天之杯`.
- Entry 13 — `大魔术：固有结界`.
- Entry 14 — `世界法则：抑止力`.

Minimum directly observed relevant entries: 10. Exact filtered count is unresolved until a structured read/filter pass is performed in Phase 0 without shell.

## Exclude for this pilot

- `[沙盒]FGO 0.8.worldbook.json` large FGO mainline source.
- `妖精国历.worldbook.json`.
- `魔法少女伊莉雅_Worldbooks2.worldbook.json`.
- `奇妙的世界书DLC_型月篇2026_0126.worldbook.json`, except later comparison if explicitly requested; the plan's inclusion boundary does not list it for pilot source text even though the existing curated Fate story index notes it as story source.
- Broad Type-Moon main entries for Extra, Prototype, Apocrypha, Strange Fake, FGO, Lostbelt, Tsukihime/Kara no Kyoukai/Mahoyo unless used only as out-of-scope disambiguation notes.
- `original-full-*` derived layers as formal sources; comparison-only if needed later.

## Candidate source count summary

| Source pool | Total entries/files | Prep selection status | Minimum candidate source units |
|---|---:|---|---:|
| FSN core worldbook | 53 entries | include all, later classify/filter fields | 53 |
| FSN sandbox lorebook | 84 entries | include for rule stratification; engine-heavy | 84 |
| Fate/Zero worldbook | 1 entry | include | 1 |
| Curated Fate stories | 4 files | include route files; main tone context/comparison | 4 |
| 型月 (1) filtered | 535 total | include FSN/FZ/system/family/location-related subset | at least 10 observed; exact TBD |
| **Minimum prep total** | — | — | **152** |

## Wave source routing draft

| Wave | Main source pools | Candidate count estimate |
|---|---|---:|
| wave-001 Source inventory | all selected pools | min 152, exact TBD |
| wave-002 Canonical IDs | FSN core, Type-Moon filtered, FZ, route stories | 60+ |
| wave-003 FSN worldline/HGW rules | Type-Moon filtered entries 0, 6-8, 10-13; sandbox rules reviewed | 8-20 |
| wave-004 Masters/human characters | FSN core; FZ timeline; route stories | 20-40 |
| wave-005 Servants/heroic spirits | FSN core; Type-Moon entries 6, 7, 10; route stories | 20-40 |
| wave-006 Organizations/families/factions | Type-Moon entry 9; FSN/FZ character context; route stories | 8-20 |
| wave-007 Locations | route stories; FSN sandbox; Type-Moon filtered | 4-15 |
| wave-008 Abilities/magecraft/Noble Phantasms | FSN core; Type-Moon entries 7, 8, 12, 13; route stories | 20-60 |
| wave-009 Fate route events | `fate-fate线.md` | 1 story file |
| wave-010 UBW route events | `fate-unlimited_blade_works线.md` | 1 story file |
| wave-011 HF route events | `fate-heaven-s_feel线.md` | 1 story file |
| wave-012 Fate/Zero/Fourth War | `fatezero.worldbook.json`; Type-Moon entry 0 | 2+ |
| wave-013 Sandbox/engine rules | FSN sandbox lorebook | up to 84 |
| wave-014 Relationship candidates | outputs from waves 004-012 plus sources | derived after prior waves |
| wave-015 Timeline skeleton | FZ entry; route stories | 5+ |
| wave-016 Event time review | event waves 009-012 | derived after event waves |
| wave-017 Character periods | waves 004-005/009-012 | derived after character/event waves |
| wave-018 Time-aware graph | waves 014-017 | derived after relation/timeline waves |

## Ambiguities for next phase

1. `campaigns/world-library/imports/worldviews/type-moon-nasuverse/source-registry.json` was missing. The existing registry was read from `campaigns/world-library/worlds/type-moon-nasuverse/curated/source-registry.json` instead.
2. `campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/README.md` was missing. The parent import README was used as the raw worldbook summary.
3. Exact filtered count for `型月 (1).worldbook.json` is not known from prep-only structured reads. Phase 0 should create a filtered manifest from source text construction without shell.
4. Existing curated Fate story index names `奇妙的世界书DLC` as story source, but the approved plan includes only curated `stories/fate/*.md`, not the DLC worldbook itself.
5. The approved plan says Phase -1 should wait for user confirmation before source text; this delegated prep run is only writing prep artifacts and does not advance to source text.
