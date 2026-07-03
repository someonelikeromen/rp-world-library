# Original Refinement Pipeline

更新日期：2026-07-01

本文件记录已入库 Wenku8 原著正文的本地精修管线。raw-text 是来源材料；RP 运行时应优先读取 curated 产物，不应常驻加载小说正文。

## 覆盖范围

- `campione`
- `danmachi`
- `hidan-no-aria`（仅 `hidan-no-aria-aa`，本篇版权屏蔽）
- `rakudai-kishi`
- `saijaku-muhai-bahamut`

## 管线顺序

1. `node tools/iterate-rawtext-all.js`
   - 从 `sources/raw-text-manifest.json` 生成 auto-pass 逐卷摘要、卷级 plot increment、基础 graph 节点。

2. `node tools/refine-source-backed-all.js`
   - 基于章节标题、正文高频实体/术语、弧线规则，生成 `refined-source-backed` 逐卷摘要。

3. `node tools/refine-chapter-events-all.js`
   - 为每个正文章节生成 `chapter-event` 节点。
   - 回写逐卷摘要中的 `## 章节事件索引`。
   - 向 `plot-graph.json` 写入 `contains-chapter-event` / `chapter-next` 边。

4. `node tools/extract-entities-relationships-all.js`
   - 生成 `original-entity-index.json`。
   - 生成章节共现候选 `original-relationship-candidates.json`。
   - 写入候选实体节点和共现边。

5. `node tools/build-original-runtime-packs-all.js`
   - 生成 `original-runtime-pack.json/md`，作为 RP 运行时入口。

6. `node tools/build-original-timelines-all.js`
   - 生成 `original-timeline.json/md`。
   - 写入 `timeline-next` 边。

7. `node tools/build-original-search-indexes-all.js`
   - 生成 `original-search-index.json/md`。
   - 建立 series / volume / chapter-event / entity / relationship-candidate 检索入口。

8. `node tools/build-original-provenance-all.js`
   - 生成 `original-provenance-manifest.json/md`。
   - 为 raw-text 与派生 curated 产物记录 SHA-256 指纹。

9. `node tools/audit-original-derived-content-all.js`
   - 检查派生摘要/runtime pack 是否存在明显长段原文泄漏、缺失章节事件索引或异常长行。

10. `node tools/build-relationship-review-queues-all.js`
    - 把章节共现关系候选分层为：
      - `semantic-review-priority`
      - `rp-context-anchor`
      - `keep-as-search-signal`
      - `low-priority-signal`
    - 生成 `original-relationship-review-queue.json/md`。

11. `node tools/sync-final-safety-docs.js`
    - 同步 final report、`STATUS.md`、`INDEX.md` 的 safety/runtime 统计。

12. `node tools/sync-final-relationship-docs.js`
    - 同步 relationship review queue 统计到 final report、`STATUS.md`、`INDEX.md`。

## 关键入口

- 总报告：`campaigns/world-library/manual-curation/reports/original-refinement-final-report.md`
- 当前状态：`campaigns/world-library/manual-curation/STATUS.md`
- 总索引：`campaigns/world-library/manual-curation/INDEX.md`
- 每世界运行时入口：`campaigns/world-library/worlds/*/curated/original-runtime-pack.json`
- 每世界检索入口：`campaigns/world-library/worlds/*/curated/original-search-index.json`
- 每世界时间线：`campaigns/world-library/worlds/*/curated/original-timeline.json`
- 每世界来源指纹：`campaigns/world-library/worlds/*/curated/original-provenance-manifest.json`
- 每世界关系复核队列：`campaigns/world-library/worlds/*/curated/original-relationship-review-queue.json`

## 当前验收口径

- JSON 解析必须为 0 错误。
- 所有 manifest 正文章节必须存在 chapter-event 节点。
- 所有 volume summary 必须包含 `## 章节事件索引`。
- runtime pack 必须引用 timeline / search index / provenance / derived content safety / relationship review queue。
- `original-relationship-candidates.json` 与 `original-relationship-review-queue.json` 不直接替代人工 `relationship-graph.json`。
- derived-content safety issues 必须为 0。

## 后续人工精修入口

1. 先看 `original-relationship-review-queue.md` 中 `semantic-review-priority`。
2. 逐条打开 `evidenceRefs` 指向的章节源文件核验语义关系。
3. 只把人工确认的关系写入正式 `relationship-graph.json`。
4. 对关键卷进一步把 `chapter-event` 摘要改成更具体的人类剧情摘要。
5. 每次精修后重跑：
   - `node tools/audit-original-derived-content-all.js`
   - `node tools/sync-final-safety-docs.js`
   - `node tools/sync-final-relationship-docs.js`
