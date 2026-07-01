# WCA-021: campione campione-main vol-18 chapter archive — Status

**Current Step:** Not Started
**Status:** 🔵 Ready for Execution
**Last Updated:** 2026-07-02
**Review Level:** 0
**Review Counter:** 0
**Iteration:** 0
**Size:** M

---

### Step 0: Preflight
**Status:** ⬜ Not Started

- [ ] Verify source dir exists: campaigns/world-library/worlds/campione/sources/raw-text/campione-main/vol-18
- [ ] List all .txt files in stable order
- [ ] Create archive, validation, refined, and retry directories

---

### Step 1: Read chapters and write immediate archives
**Status:** ⬜ Not Started

- [ ] Read each .txt fully, using offset reads for large files
- [ ] Write one rp-chapter-archive-v1 JSON and one Markdown file per chapter immediately after reading
- [ ] Capture summary, events, characters, locations, terms, items, factions, relationshipSignals, timelineSignals, continuityNotes, uncertainties, and qualityFlags
- [ ] Avoid long verbatim excerpts

---

### Step 2: Validate volume and retry failures
**Status:** ⬜ Not Started

- [ ] Compare archive coverage against source files and _manifest.json when present
- [ ] Explain exceptions for afterword/setting/blocked/too-short/image-only chapters
- [ ] Retry failed or empty units within policy limits, otherwise write retry queue entries
- [ ] Confirm generated JSON parses

---

### Step 3: Refine volume and record lessons
**Status:** ⬜ Not Started

- [ ] Write volume summary, event chain, entity increments, relationship candidates, timeline increments, and search keywords
- [ ] Write lessons covering name conventions, relationship signals, special structures, and retry learnings
- [ ] Confirm no core graph files changed


## Discoveries

- None yet.
