# wave-001 Audit Report

Status: passed
Model: lt-yuyu/gpt-5.5
Scope: Source inventory and dedupe scan for current FSN/FZ pilot source layer.

## Audit Checks

- Output remains under `campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/waves/wave-001/`.
- No curated archive paths are modified.
- All eight current source text files from the source manifest are represented.
- Source credibility, source type, canon status, and capture status are carried forward.
- Dedupe decisions preserve continuity/version boundaries and avoid blind same-name merges.
- Known source-layer partial coverage is recorded as a limitation, not hidden.
- Locations and abilities are not promoted into this wave beyond deferred notes because the locked wave plan assigns them to wave-007 and wave-008.

## Findings

No blocking findings remain.

## Residual Risk

The inventory is complete for the current source layer only. It is not a complete transcription of every raw worldbook entry because `src-fsn-core-extract`, `src-fsn-sandbox-rules`, and `src-type-moon-filtered-anchors` are partial or filtered extracts.
