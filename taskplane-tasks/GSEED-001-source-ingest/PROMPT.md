# Task: GSEED-001 - Gundam SEED Opus Source Ingest

**Created:** 2026-07-19
**Size:** L

## Review Level: 1 (Plan)

**Assessment:** Network-backed source ingestion and durable archive source preparation. Additive file writes only.
**Score:** 3/8 — Blast radius: 1, Pattern novelty: 1, Security: 0, Reversibility: 1

## Mission

Refresh and complete the Bilibili opus source layer for the Gundam SEED P1-style archive. The user asked for unattended execution with maximum concurrency 2 and retry handling for unstable upstream network failures.

## Dependencies

- **None**

## Context to Read First

- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/PLAN.locked.md`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/execution-plan.json`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/source-classification-report.md`
- `tools/source-ingest/cli.cjs`

## Environment

- **Workspace:** `E:/pi-st`
- **Max concurrency:** 2
- **Network retry policy:** For transient Bilibili/network failures, wait 5 minutes and retry. Maximum 3 attempts total, 15 minutes total wait per failing item. Record all retries.
- **Bash-free mode:** If the execution harness forbids shell or command execution, do not attempt source ingest. Record the command-dependent steps as blocked in task outputs and leave completion criteria unchecked.

## File Scope

- `work/gundam-seed/source-ingest-v2/**`
- `campaigns/world-library/manual-curation/gundam-seed-opus-p1-style/source-classification-report.md`

## Steps

### Step 0: Preflight

- [ ] Verify `tools/source-ingest/cli.cjs` exists and supports Bilibili opus commands.
- [ ] Verify or create `work/gundam-seed/source-ingest-v2/`.
- [ ] Read current `opus-index.json` if present.

**Artifacts:**
- `work/gundam-seed/source-ingest-v2/ingest-run-report.json`

### Step 1: Refresh Index

- [ ] Run or verify `node tools/source-ingest/cli.cjs bilibili-opus-index --hostMid 102672286 --out work/gundam-seed/source-ingest-v2 --maxPages 30`.
- [ ] Confirm total unique opus count is 213.
- [ ] Confirm title contains SEED count is 212 and one retained unmarked item exists, unless upstream changed; if changed, record exact diff.

**Artifacts:**
- `work/gundam-seed/source-ingest-v2/opus-index.json`
- `work/gundam-seed/source-ingest-v2/opus-index.md`

### Step 2: Fetch Details

- [ ] For every opus ID in `opus-index.json`, ensure `work/gundam-seed/source-ingest-v2/details/<opusId>.json` exists.
- [ ] Fetch missing detail files with `node tools/source-ingest/cli.cjs bilibili-opus-detail --opusId <id> --out work/gundam-seed/source-ingest-v2/details`.
- [ ] Keep active network operations at 2 or below.
- [ ] Apply the 5-minute retry policy for transient failures.
- [ ] Record missing, failed, retried, and skipped items.

**Artifacts:**
- `work/gundam-seed/source-ingest-v2/details/*.json`
- `work/gundam-seed/source-ingest-v2/details/*.md`
- `work/gundam-seed/source-ingest-v2/details/*.html`

### Step 3: Build Image Manifests

- [ ] For each detail with images, ensure `work/gundam-seed/source-ingest-v2/images/<opusId>/manifest.json` exists.
- [ ] Download images only when required for manifest completeness or when not already present.
- [ ] Keep active downloads at 2 or below.
- [ ] Record image counts and failed image downloads separately from detail failures.

**Artifacts:**
- `work/gundam-seed/source-ingest-v2/images/<opusId>/manifest.json`

### Step 4: Source Report

- [ ] Write `ingest-run-report.json` with counts: expected, indexed, detailsExisting, detailsFetched, detailsFailed, imagesManifested, imageDownloadFailures, retries.
- [ ] Write `ingest-run-report.md` with concise Chinese summary and unresolved issues.
- [ ] Update `source-classification-report.md` only if counts changed.

**Artifacts:**
- `work/gundam-seed/source-ingest-v2/ingest-run-report.json`
- `work/gundam-seed/source-ingest-v2/ingest-run-report.md`

## Completion Criteria

- [ ] `opus-index.json` parses and contains 213 unique items or an explicit upstream-change note.
- [ ] Every indexed opus has a detail JSON or a recorded blocked issue after retry policy.
- [ ] Every detail with images has a manifest or a recorded blocked issue.
- [ ] Retry behavior is recorded.
- [ ] Generated JSON parses.

## Do NOT

- Do not modify formal world library outputs.
- Do not invent source records.
- Do not exceed concurrency 2 for network work.
- Do not treat image OCR as complete if OCR tooling is unavailable; record it as a later gap.
