# Source Prep Fix Trail

## Issue 1: Scope leakage risk
**Observed risk:** The Type-Moon curated archive contains many non-FSN/FZ series and cross-series entries.

**Fix applied:** The selection was narrowed to world anchors, FSN core characters, FZ core characters, and the FSN route / FZ baseline story summaries only.

## Issue 2: Manifest-source mismatch risk
**Observed risk:** The source manifest could drift from the actual source layer paths.

**Fix applied:** The manifest now points only to files under `sources/worldbook-text/` and `sources/story-text/` inside the pilot root.

## Issue 3: Audit gap risk
**Observed risk:** Prep work without a repair trail would not satisfy the self-iteration requirement.

**Fix applied:** `audit/source-prep-audit.md` records the final pass, and this file records the fix path.

## Final status
No blocking issues remain for the prep phase.
