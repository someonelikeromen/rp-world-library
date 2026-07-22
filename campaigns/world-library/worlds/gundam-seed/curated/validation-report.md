# Gundam SEED Full Auto Completion Report

- Generated: 2026-07-21T17:22:37.621Z
- World: gundam-seed
- Status: complete-with-recorded-gaps

| Item | Value |
|---|---:|
| Status | complete-with-recorded-gaps |
| Characters | 104 |
| Character groups | 14 |
| Mobile suits | 48 |
| Warships | 14 |
| Events | 19 |
| Rules | 44 |
| Relationships | 1885 |
| Semantic auto promoted | 412 |
| Semantic review candidates | 70 |
| Complete graph | 478 nodes / 4116 edges |
| Image vision | 4899/4931 done; 31 blocked; 1 failed |
| JSON validation | 961 checked / 0 errors |

## Gate Summary

- sourceIngest: passed
- normalizedCandidateAudit: passed
- curatedRuntimePackage: passed
- worldQueryOverview: passed-prior-tool-validation
- worldQueryCharacters: passed-prior-tool-validation
- worldQueryGraph: passed-prior-tool-validation
- semanticRelations: passed
- worldbookConflict: passed-with-reference-layer-decisions
- groupDerived: passed-with-review-needed-residuals
- extendedGate: passed-with-provider-blocked-residuals
- jsonValidation: passed

## Residual Review

- Group-derived review-needed characters: 10
- Semantic review candidates: 70
- Field conflicts recorded: 17
- Image recognition queue: 4899/4931 done, 31 blocked, 1 failed
- Destiny/Freedom/Astray/MSV: remain isolated extension layers

## Conclusion

The base SEED source-backed curated runtime layer is complete and queryable. The image layer has been triaged and the recognition queue executed; remaining image gaps are provider/network residuals, not skipped workflow.

## Image Evidence Integration

- Integrated: 2026-07-22T02:42:45.018Z
- Evidence records: 6114
- Recognized: 4899/4931
- Register-only: 1183
- Blocked: 31
- Failed: 1
- Policy: image evidence metadata only; no image-only canon promotion.

Outputs:
- campaigns/world-library/worlds/gundam-seed/curated/image-evidence-index.json
- campaigns/world-library/worlds/gundam-seed/curated/image-evidence-summary.json
- campaigns/world-library/worlds/gundam-seed/curated/image-evidence-gaps.json
