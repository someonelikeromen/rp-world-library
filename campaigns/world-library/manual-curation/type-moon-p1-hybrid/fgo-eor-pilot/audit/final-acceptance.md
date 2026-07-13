# FGO EoR Final Acceptance

Status: `accepted`

Date: 2026-07-12
Model: `lt-yuyu/gpt-5.5`
Step id: `merge-eor`

## Decision

The FGO Epic of Remnant pilot merge is accepted.

## Basis

- All four parent-verified chapter gates passed before merge: Shinjuku, Agartha, Shimousa, and Salem.
- Canonical source-first merged layers were created under the permitted EoR pilot mutation scope.
- Mandatory appearance, ability, and combat-effect coverage was merged for all four chapters.
- Timeline, graph, candidates, comparison, and final audit reports were created.
- Source-first terminology is preserved. Unsupported labels remain candidates only and are not formal source-backed labels.
- No formal aggregate `characters.json`, `events.json`, or `relationships.json` was created.

## Final Counts

- Chapters: 4
- Events: 65
- Appearance records: 36
- Ability records: 50
- Combat-effect records: 53
- Relationship edges: 24
- Open issues: 0
- Blocked issues: 0

## Validation Status

Final audit completed read-only after writes. The merge can advance.


## Post-Parent-Fix Addendum

Decision after structural repair: `accepted-with-nonblocking-risks`

Parent repair split the two remaining normalized aggregate event files into per-event files:

```text
normalized/eor/shinjuku/events.json -> normalized/eor/shinjuku/events/*.json
normalized/eor/shimousa/events.json -> normalized/eor/shimousa/events/*.json
```

Post-repair validation:

```text
JSON_FILES 252
JSON_BAD 0
EOR_PACKET_GATE PASSED
forbidden aggregate files: none
```

Read-only audit `r19` confirmed:

- `normalized/eor/shinjuku/events.json` no longer exists.
- `normalized/eor/shimousa/events.json` no longer exists.
- Replacement per-event directories and indexes exist.
- Four packet final-status files remain passed.
- Merged events, relationships, appearances, abilities, and combat-effect layers remain present.
- Timeline and graph outputs remain derived indexes.
- Source-first/provenance expectations remain intact in representative samples.

This addendum supersedes any earlier acceptance ambiguity around normalized aggregate `events.json` files.
