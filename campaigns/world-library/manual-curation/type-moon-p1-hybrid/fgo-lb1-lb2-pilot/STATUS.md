# FGO Lostbelt 1-2 Pilot Status

Date: 2026-07-12
Latest step id: `merge-lb1-lb2-retry`
Model: `lt-yuyu/gpt-5.5`
Status: **merge accepted / passed**

## Gate Status

- Source text manifest: `passed`, expected `2`, built `2`.
- LB1 Anastasia packet: `passed`, open issues `0`, blocked issues `0`, can advance `true`.
- LB2 Gotterdammerung packet: `passed`, open issues `0`, blocked issues `0`, can advance `true`.

## Merge Outputs

- Canonical merge index: `merged/index.json`
- Chapter index: `merged/chapters/lostbelt/chapter-index.json`
- World-state index: `merged/world-state/lostbelt/world-state-index.json`
- Character indexes:
  - `merged/characters/lostbelt/lb1-anastasia/character-index.json`
  - `merged/characters/lostbelt/lb2-gotterdammerung/character-index.json`
- Event directories:
  - `merged/events/lostbelt/lb1-anastasia/`
  - `merged/events/lostbelt/lb2-gotterdammerung/`
- Relationship edge directories:
  - `merged/relationships/edges/lostbelt/lb1-anastasia/`
  - `merged/relationships/edges/lostbelt/lb2-gotterdammerung/`
- Signal record directories: `merged/appearances/`, `merged/abilities/`, `merged/combat-effects/`
- Timeline indexes: `timeline/lostbelt/index.json`, `timeline/lostbelt/master/index.json`
- Graph indexes: `graph/index.json`, `graph/lostbelt/derived-index.json`
- Candidate indexes: `candidates/index.json`, `candidates/alias-candidate-index.json`, `candidates/relationship-candidate-index.json`
- Comparison: `comparison/index.json`, `comparison/lb1-lb2-comparison.json`
- Final reports:
  - `audit/final-known-issues.json`
  - `audit/final-pass-report.json`
  - `audit/final-audit-summary.md`
  - `audit/final-acceptance.md`

## Counts

- Chapters: 2
- Events: 43 (LB1 24, LB2 19)
- Character records: 43 (LB1 20, LB2 23)
- Relationship edges: 14
- Appearance signals: 69
- Ability signals: 70
- Combat-effect signals: 68
- Explicit not-found records: 75
- Alias candidate records: 10
- Dialogue lines represented upstream: 70

## Guardrails Observed

- No source imports modified.
- No old curated files modified.
- No docs, skills, `fgo-script-pilot`, `fgo-eor-pilot`, or other pilots modified.
- No final read-only audit run in this step.
- No forbidden aggregate files named `characters.json`, `events.json`, or `relationships.json` intentionally created.
- Unsupported English/game/wiki labels remain candidate-only when unsupported by current source, or legacy path slugs.


## Independent Final Audit Addendum

Final independent read-only audit: `passed-with-nonblocking-risks` (`r4`, `audit-lb1-lb2-final-retry`).

Parent validation after merge retry:

- `JSON_FILES 180`
- `JSON_BAD 0`
- Both packet gates passed (`openIssues: 0`, `blockedIssues: 0`, `canAdvance: true`).
- Merged events: 43 per-event files.
- Merged relationship edges: 14 per-edge files.
- Appearance, ability, and combat-effect records exist for both chapters.
- Forbidden aggregate files (`characters.json`, `events.json`, `relationships.json`): 0.

The Lostbelt 1-2 pilot is accepted for side-by-side/manual-curation use with nonblocking risks retained in the audit report. Old curated and source imports remain outside this pilot scope.
