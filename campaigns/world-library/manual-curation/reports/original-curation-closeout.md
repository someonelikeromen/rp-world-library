# 原著精修收口

更新日期：2026-07-01

本轮原著正文精修已完成到“封板归档”层。正式 `relationship-graph.json` 未被自动写入；新增的 `original-relationship-graph.json` 是独立的 source-backed 原著归档层。

## 已完成层级

- raw-text 入库与 manifest
- source-backed 逐卷摘要
- chapter-event-refined 章节事件
- original-entity-index
- original-relationship-candidates
- original-runtime-pack
- original-timeline
- original-search-index
- original-provenance-manifest
- original-derived-content-safety
- original-relationship-review-queue
- original-relationship-review-packets
- original-relationship-review-worklist
- original-relationship-semantic-hints
- original-relationship-semantic-draft
- original-relationship-semantic-merge-plan
- original-relationship-graph
- original-archive-seal

## 最终统计

- 世界数：5
- 系列：10
- 卷数：127
- 章节事件：1267
- 实体：183
- 关系候选：2358
- 关系复核证据包：750
- 可人工标注关系证据包：240
- 关系语义提示：240
- 证据较充分语义提示：115
- 语义草案边：115
- 有正式图谱的世界：2/5
- JSON 校验数：396
- JSON 错误：0
- 运行时引用问题：0
- 世界产物问题：0
- 原著关系图：75 节点 / 115 边
- 归档状态：封板完成

## 合并前计划结论

| 判定 | 数量 | 含义 |
|---|---:|---|
| 疑似已有正式边：需查重 | 65 | DanMachi 草案大多能映射到现有正式图谱边，应人工复核后更新已有边而非新增重复边。 |
| 无正式图谱：需先建图谱 | 41 | Campione / Rakudai / Saijaku 当前没有正式 relationship-graph，应先建立人工图谱骨架。 |
| 候选新边：需人工确认 | 7 | hidan-no-aria 存在可新增候选，但仍需人工阅读 sourceRefs。 |
| 合并前需节点映射 | 2 | hidan-no-aria 有节点映射不明确项，需先人工映射角色节点。 |

## 核心报告入口

- `campaigns/world-library/manual-curation/reports/original-refinement-final-report.md`
- `campaigns/world-library/manual-curation/reports/original-archive-seal.md`
- `campaigns/world-library/manual-curation/reports/original-archive-seal-audit.md`
- `campaigns/world-library/manual-curation/reports/original-archive-actual-worlds-audit.md`
- `campaigns/world-library/manual-curation/reports/original-full-archive-completion-audit.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-graph-report.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-semantic-merge-plan-report.md`
