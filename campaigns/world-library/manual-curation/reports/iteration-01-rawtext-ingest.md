# Iteration 01 — Raw Text 入库与质检

更新日期：2026-06-30

## 本轮目标

1. 将已登记 Wenku8 链接的正文按规则爬取到本地 `sources/raw-text/`。
2. 保留目录索引 `sources/wenku8/*.toc.json` 作为覆盖对照。
3. 生成 raw-text 质检报告，区分正文、插图、版权屏蔽/空正文、失败/未记录。
4. 修复同卷同名章节导致的断点续传误判。

## 产物

- `campaigns/world-library/manual-curation/reports/raw-text-qc.md`
- `campaigns/world-library/manual-curation/reports/raw-text-qc.json`
- `tools/crawl-wenku8.js`：通用 Wenku8 串行爬虫，10 秒间隔，支持断点续传。
- `campaigns/world-library/worlds/*/sources/wenku8/*.toc.json`
- `campaigns/world-library/worlds/*/sources/raw-text/*/vol-*/`

## 入库结果

| world | series | 状态 |
|---|---|---|
| `danmachi` | 本篇、剑姬神圣谭、眷族编年史、阿尔戈、阿斯特莉亚回忆录 | 已入库 |
| `campione` | 弑神者！、神域的弑神者们 | 已入库 |
| `rakudai-kishi` | 落第骑士英雄谭 | 已入库 |
| `saijaku-muhai-bahamut` | 最弱无败神装机龙 | 已入库 |
| `hidan-no-aria` | 绯弹的亚莉亚 AA | 已入库 |
| `hidan-no-aria` | 绯弹的亚里亚本篇 | 未入库：章节页版权屏蔽/空正文 |

## 技术修正

第一轮发现 `familia-chronicle` 中同一卷内存在多个同名章节（如 `②/③/④` 分属不同小篇），旧爬虫用标题判断是否已完成，导致误跳过。已修复为：

- 判重键：`卷内序号 + 标题`
- 插图页：快速跳过，标记无正文
- 429：等待 90 秒重试
- 请求间隔：10 秒

## 下一轮迭代计划

### Iteration 02 — 卷章摘要层

优先级：

1. `danmachi`：因为已有 curated 世界，先把 raw-text 摘要对齐现有 `stories/`、`plot-graph.json`、`knowledge-graph.json`。
2. `campione`：补建 curated 基线和神话/权能/弑神者图谱。
3. `rakudai-kishi`：补建 Blazer/固有灵装/七星剑武祭等战斗体系和角色关系。
4. `saijaku-muhai-bahamut`：补建机龙/遗迹/学园/国家关系。
5. `hidan-no-aria`：AA 可先摘要；本篇需另找可用原文源。

输出格式建议：

- `sources/raw-text-manifest.json`：统一正文清单。
- `curated/stories/original-summary-index.json`：系列/卷/章摘要索引。
- `curated/stories/summaries/{series}/vol-XX.md`：逐卷摘要。
- 图谱增量：`plot-graph.json` / `knowledge-graph.json` / `relationship-graph.json`。

## 注意

正文只作为 source 使用；正式 RP 检索仍应读取整理后的摘要、设定、人物索引和图谱，不直接加载大正文。
