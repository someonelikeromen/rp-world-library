# FGO Lostbelt 1-2 Merge Retry Summary

Step id: `merge-lb1-lb2-retry`
Model: `lt-yuyu/gpt-5.5`
Status: `passed` / accepted
Final read-only audit: **not run** by delegation.

## Gate Verification

- Source-text manifest: `status=passed`, `expected=2`, `built=2`.
- LB1 packet final status: `status=passed`, `openIssues=0`, `blockedIssues=0`, `canAdvance=true`.
- LB2 packet final status: `status=passed`, `openIssues=0`, `blockedIssues=0`, `canAdvance=true`.

## Built / Repaired Canonical Layers

- `merged/index.json`
- `merged/chapters/lostbelt/chapter-index.json`
- `merged/world-state/lostbelt/world-state-index.json`
- `merged/characters/lostbelt/lb1-anastasia/character-index.json`
- `merged/characters/lostbelt/lb2-gotterdammerung/character-index.json`
- `merged/events/lostbelt/lb1-anastasia/` per-event files
- `merged/events/lostbelt/lb2-gotterdammerung/` per-event files
- `merged/relationships/edges/lostbelt/lb1-anastasia/` per-edge files
- `merged/relationships/edges/lostbelt/lb2-gotterdammerung/` per-edge files
- `merged/appearances/`, `merged/abilities/`, `merged/combat-effects/` chapter record files
- `timeline/lostbelt/index.json`, chapter timelines, and `timeline/lostbelt/master/index.json`
- `graph/index.json` and `graph/lostbelt/derived-index.json`
- `candidates/` indexes
- `comparison/` indexes and comparison report
- final reports under `audit/`

## Counts

- Chapters: 2
- Events: 43 (LB1 24, LB2 19)
- Character records: 43 (LB1 20, LB2 23)
- Relationship edges: 14 (7 per chapter)
- Appearance signals: 69
- Ability signals: 70
- Combat-effect signals: 68
- Explicit not-found records: 75
- Alias candidate records: 10
- Dialogue lines represented upstream: 70

## Compliance Notes

- Source-first terminology was preserved.
- Formal records retain `sourceRefs`, `sourceType`, `credibility`, and `canonStatus`.
- Unsupported English/game/wiki labels were not promoted to formal source-backed labels; they remain candidate-only where present.
- No files named `characters.json`, `events.json`, or `relationships.json` were intentionally created.
- No source imports, old curated files, docs, skills, other pilots, `fgo-script-pilot`, or `fgo-eor-pilot` were modified.
