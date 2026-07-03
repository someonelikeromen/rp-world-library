# Iteration 02 — 卷章摘要层脚手架

更新日期：2026-06-30

## 本轮进展

已为已入库 raw-text 的系列创建逐卷摘要脚手架与 `original-summary-index.json`，用于后续填入卷摘要、章节摘要、角色/地点/事件标签和图谱对齐项。

| world | series | 卷数 | 正文章节 |
|---|---|---:|---:|
| danmachi | danmachi-main | 29 | 375 |
| danmachi | sword-oratoria | 18 | 186 |
| danmachi | familia-chronicle | 3 | 32 |
| danmachi | argonaut | 2 | 30 |
| danmachi | astraea-record | 3 | 58 |
| campione | campione-main | 23 | 204 |
| campione | campione-shiniki | 3 | 29 |
| rakudai-kishi | rakudai-kishi-main | 21 | 130 |
| saijaku-muhai-bahamut | saijaku-muhai-bahamut-main | 21 | 173 |
| hidan-no-aria | hidan-no-aria-aa | 4 | 50 |

## 下一步

1. 从 `danmachi/danmachi-main` 开始填写真摘要。
2. 每卷摘要完成后抽取角色、地点、事件节点。
3. 将事件节点增量合并到 plot / knowledge / relationship 图谱。
4. 原文只保留为 source，不直接进入 RP 常驻上下文。

## 已合并图谱增量

- 2026-06-30：已将 `danmachi-main` 第 1-3 卷摘要事件合并到 `campaigns/world-library/worlds/danmachi/curated/plot-graph.json`。
- 新增/确认事件节点：`orig-main-v01-aiz-rescues-bell`、`orig-main-v01-hestia-knife`、`orig-main-v01-silverback-incident`、`orig-main-v02-lili-supporter`、`orig-main-v03-aiz-training`、`orig-main-v03-minotaur-victory`。
- 增量文件：`campaigns/world-library/worlds/danmachi/curated/stories/original-plot-increment-danmachi-main-v01-v03.json`。

- 2026-06-30：已将 `danmachi-main` 第 4-6 卷摘要事件合并到 `campaigns/world-library/worlds/danmachi/curated/plot-graph.json`。
- 新增/确认事件节点：`orig-main-v04-bell-learns-firebolt`、`orig-main-v04-welf-partner`、`orig-main-v05-middle-floor-crisis`、`orig-main-v05-black-goliath`、`orig-main-v06-apollo-conflict`、`orig-main-v06-war-game-victory`、`orig-main-v06-hestia-familia-expands`。
- 增量文件：`campaigns/world-library/worlds/danmachi/curated/stories/original-plot-increment-danmachi-main-v04-v06.json`。
