# FGO Epic of Remnant P1 Pilot

Status: scaffold prepared; source text and extraction not started.

This pilot prepares the Epic of Remnant batch for the FGO script p1 pipeline using the updated source-first plan and the mandatory appearance / ability / combat-effect layers.

## Scope

Selected primary source entries from:

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

- Entry 89: `FGO_亚种特异点I_新宿` / Shinjuku
- Entry 90: `FGO_亚种特异点II_雅戈泰` / Agartha
- Entry 91: `FGO_亚种特异点III_下总国` / Shimousa
- Entry 92: `FGO_亚种特异点IV_塞勒姆` / Salem

All prepared outputs are isolated under:

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-eor-pilot/
```

## Prepared artifacts

- `PLAN.locked.md`
- `STATUS.md`
- `source-inventory.json`
- `source-classification-report.md`
- `source-unit-manifest.json`
- `execution-log.md`
- `work-packets/eor/shinjuku.json`
- `work-packets/eor/agartha.json`
- `work-packets/eor/shimousa.json`
- `work-packets/eor/salem.json`

Exactly four EoR work packets are expected under `work-packets/eor/`.

## Locked rules

- Required model for later execution agents: `lt-yuyu/gpt-5.5`.
- No automatic model downgrade is permitted.
- No bash, shell, python, node, deno, powershell, cmd, or executable script tools are permitted.
- Source type is `user-file-worldbook-script`; canon status is `canon-like`, not `canon-text` or `official-script`.
- Source-first extraction is mandatory. Summary/profile/curated mirrors may not overwrite script-primary facts.
- Every event, character fragment, relationship signal/edge, appearance signal, ability / Noble Phantasm / skill signal, and combat-effect signal must carry `sourceRefs`.
- If source explicitly describes appearance, outfit/equipment visuals, ability/Noble Phantasm/skill activation, or combat effects, extract source-backed records.
- If the source does not explicitly describe those mandatory layers, create `not-found-in-source` records. Do not silently omit them.
- No game memory, wiki impression, or model knowledge may be used to fill visual/ability/combat details.
- Each packet must run `Generator -> Auditor -> Fixer -> Auditor rerun` until passed with zero open or blocked issues.

## Current gate

Preparation scaffold is complete for the four selected entries. Extraction remains closed until line-addressable source text is built/read and each packet is executed through the required audit/fix loop.
