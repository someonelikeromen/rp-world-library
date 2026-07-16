# FGO Part 1 Script Pilot Status

Status: `passed-with-nonblocking-risks`

Last updated: 2026-07-12

## Scope

This pilot covers FGO Part 1 script-like source units from `[沙盒]FGO 0.8.worldbook.json` entries 80-88:

1. Fuyuki
2. Orleans
3. Septem
4. Okeanos
5. London
6. America
7. Camelot
8. Babylonia
9. Solomon

All outputs are isolated under:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-script-pilot/
```

The legacy curated archive and source worldbook imports are not publication targets for this pilot and must remain untouched unless a later explicit migration step is approved.

## Acceptance Summary

The pilot has passed the current p1-hybrid acceptance gate with nonblocking risks:

- Source text layer: 9/9 Part 1 source texts built.
- Work packets: 9/9 Part 1 packets present.
- Packet final statuses: 9/9 passed.
- Canonical event wrappers: 173.
- Canonical relationship edge wrappers: 70.
- Appearance / ability / combat-effect extracted signal indexes: 27.
- Normalized appearance / ability / combat-effect record files: 27.
- Merged appearance / ability / combat-effect canonical record files: 27.
- Full JSON parse check: 955 JSON files, 0 parse errors.
- Forbidden formal aggregate files not present: `characters.json`, `events.json`, `relationships.json`.

## Required Layers Present

The pilot now includes mandatory source-first visual/ability/combat layers:

```text
extracted/part1/<chapter>/appearance-signals/index.json
extracted/part1/<chapter>/ability-signals/index.json
extracted/part1/<chapter>/combat-effect-signals/index.json

normalized/part1/<chapter>/appearances/records.json
normalized/part1/<chapter>/abilities/records.json
normalized/part1/<chapter>/combat-effects/records.json

merged/appearances/part1/<chapter>/records.json
merged/abilities/part1/<chapter>/records.json
merged/combat-effects/part1/<chapter>/records.json
```

Source-backed records use current source wording. Unsupported external labels are not formal source-backed facts; if retained, they are represented as unsupported alias candidates or legacy path slugs.

## Audit / Fix History

Key runs and rounds:

- `r5`: preparation retry succeeded.
- `r7`: chapter packets and final merge succeeded.
- `r8`: read-only pilot audit found canonical/provenance gaps.
- `r9`: audit/fix R1 closed canonical/provenance blockers; result `passed-with-nonblocking-risks`.
- `r10`: visual/ability/combat R1 generated mandatory layers but auditor found source-first terminology blockers.
- `r11`: visual/ability/combat R2 repaired unsupported source-backed terminology and direct provenance fields.
- Parent syntax repair: fixed six malformed JSON files introduced during R2; full JSON parse passed.
- `r12`: read-only visual/ability/combat R3 audit result `passed-with-nonblocking-risks`.

## Nonblocking Risks

The following risks remain nonblocking but must be preserved for later migration review:

1. Some legacy filenames/path slugs still contain unsupported English labels such as `ars-nova`, `excalibur`, or `forneus`; file contents distinguish these as unsupported aliases or legacy slugs rather than source-backed formal labels.
2. Some visual/costume/animation details are `not-found-in-source` because the current script-like source does not explicitly describe them.
3. Orleans has duplicate raw `事件N` and absent raw `事件M`; no synthetic `事件M` was created.
4. Okeanos has a Heracles continuity tension; it is preserved as a source continuity note.
5. Solomon support-cast coverage is partial/key-fragment based and must not be treated as exhaustive cameo coverage.

## Migration Position

This pilot is accepted as a source-backed candidate/canonical-pilot layer for FGO Part 1. It is not approved for direct overwrite of the legacy Type-Moon curated archive.

Recommended next step: execute the EoR script p1 batch using the updated plan and mandatory appearance / ability / combat-effect extraction rules from the start.
