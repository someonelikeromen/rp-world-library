# GSEED-001: Gundam SEED Opus Source Ingest — Status

**Current Step:** Not Started
**Status:** 🔵 Ready for Execution
**Last Updated:** 2026-07-19
**Review Level:** 1
**Review Counter:** 0
**Iteration:** 0
**Size:** L

---

### Step 0: Preflight
**Status:** ⬜ Not Started

- [ ] Verify `tools/source-ingest/cli.cjs` exists and supports Bilibili opus commands.
- [ ] Verify or create `work/gundam-seed/source-ingest-v2/`.
- [ ] Read current `opus-index.json` if present.

---

### Step 1: Refresh Index
**Status:** ⬜ Not Started

- [ ] Run or verify `node tools/source-ingest/cli.cjs bilibili-opus-index --hostMid 102672286 --out work/gundam-seed/source-ingest-v2 --maxPages 30`.
- [ ] Confirm total unique opus count is 213.
- [ ] Confirm title contains SEED count is 212 and one retained unmarked item exists, unless upstream changed; if changed, record exact diff.

---

### Step 2: Fetch Details
**Status:** ⬜ Not Started

- [ ] For every opus ID in `opus-index.json`, ensure `work/gundam-seed/source-ingest-v2/details/<opusId>.json` exists.
- [ ] Fetch missing detail files.
- [ ] Keep active network operations at 2 or below.
- [ ] Apply the 5-minute retry policy for transient failures.
- [ ] Record missing, failed, retried, and skipped items.

---

### Step 3: Build Image Manifests
**Status:** ⬜ Not Started

- [ ] Ensure manifests exist for details with images.
- [ ] Download images only when required for manifest completeness or when not already present.
- [ ] Keep active downloads at 2 or below.
- [ ] Record image counts and failed image downloads separately.

---

### Step 4: Source Report
**Status:** ⬜ Not Started

- [ ] Write source ingestion audit report.
- [ ] Update classification report only if counts changed.

## Discoveries

- 2026-07-20 bash-free repair audit: this task is still not started. Source ingest requires command execution and likely network access, so no ingest outputs were generated in this documentation-only pass.
- Next execution attempt must either run the listed Node ingest commands under the existing concurrency/retry limits, or record a blocked issue instead of marking any source layer complete.
