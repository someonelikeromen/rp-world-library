# Type-Moon Extracted Status Reconciliation — r10

Date: 2026-07-20  
Step: `status-reconciliation-fixer`

## Scope

This file records a status/source-of-truth reconciliation only. No fact content was changed. Raw imports and old curated files were not edited.

Edited surfaces were limited to:

- `campaigns/world-library/manual-curation/type-moon-p1-hybrid/STATUS.md`
- `campaigns/world-library/manual-curation/type-moon-p1-hybrid/tsukihime-dead-apostle-profile-supplement-pilot/STATUS.md`
- `campaigns/world-library/worlds/type-moon-nasuverse/extracted/**` status/index wording

## Auditor-source decisions applied

### Mahoyo profile supplement pilot

Decision applied: **held / not-published pending read-only auditor rerun**.

Evidence basis:

- Pilot `STATUS.md` reports `not-published` and `fixer-retry-completed-pending-auditor-rerun`.
- `audit/merge/merge-report.json` may allow advance to the next gate, but the next gate is still a read-only auditor rerun.
- No pilot-local final auditor artifact was identified to justify terminal promotion.

Reconciliation action:

- Root manual-curation status row now states held/not-published pending read-only auditor rerun.
- Extracted manifest, publication inventory, source gaps, graph, and timeline indexes continue to exclude Mahoyo from formal publication.

### Tsukihime Dead Apostle profile supplement pilot

Decision applied: **held / not-published pending separate final audit**.

Evidence basis:

- `audit/final/final-status.json` reports `status: merge-generated-pending-audit`, `latestAuditStatus: not-run-by-separate-auditor`, `canAdvance: false`, and `publicationStatus: not-published`.
- `audit/merge/merge-report.json` reports controlled merge generation but `validationStatus: pending-read-only-final-audit` and `canAdvance: false`.
- Packet gates passing is not sufficient for formal publication while the merge/final layer remains unaudited.

Reconciliation action:

- Root manual-curation status row now states held/not-published pending separate final audit.
- Pilot-local `STATUS.md` now includes a terminal status block matching `audit/final/final-status.json`.
- Extracted layer status wording now points to the unresolved separate final audit gate rather than to this completed reconciliation.

## Extracted publication state after reconciliation

- Formal publication: **not promoted** for Mahoyo or Tsukihime Dead Apostle.
- Candidate/source-gap isolation: preserved.
- Held pilots remain excluded from formal character/event/relationship/graph/timeline indexes.
- Derived graph/timeline files remain derived indexes only, not primary fact stores.
- Forbidden aggregate basename policy remains unchanged.

## Validation notes

Validation used read/find/grep inspection only; no shell, scripts, or executable JSON parser were run in this fixer pass.
