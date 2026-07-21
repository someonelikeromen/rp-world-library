# World Archive — Context

**Last Updated:** 2026-07-02  
**Status:** Active  
**Next Task ID:** WCA-156

---

## Current State

This task area implements full chapter-by-chapter archives for all worlds. Local raw-text files are source files only, not curated metadata. Workers read local sources fully, write immediate chapter/source archives, validate by volume or curated unit, retry failures, and integrate additive derived layers only after validation.

Gundam SEED opus P1-style tasks use the supplemental `GSEED-001` through `GSEED-004` track. As of the 2026-07-20 bash-free repair pass, their packet contracts are textually repaired, but no generated ingest, extraction, audit, final-status, merge, graph, or migration outputs were produced.

Formal core graph files such as `relationship-graph.json`, `characters-index.json`, `knowledge-graph.json`, and `plot-graph.json` must not be overwritten by automatic candidates.

## Key Files

| Category | Path |
|---|---|
| Archive plan | `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.md` |
| Machine plan | `campaigns/world-library/manual-curation/reports/subagent-chapter-archive-iteration-plan.json` |
| Worlds | `campaigns/world-library/worlds/` |
| Reports | `campaigns/world-library/manual-curation/reports/` |

## Technical Debt / Future Work

- [ ] Promote proposed relationship edges only after human review.
- [ ] Build formal chapter metadata for worlds that currently only have raw-text or curated Markdown sources.
