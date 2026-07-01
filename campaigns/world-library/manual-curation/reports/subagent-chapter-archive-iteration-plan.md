# Subagent 逐章节归档自动迭代计划

更新时间：2026-07-01

## 目标

让 subagent 按“逐章节阅读全文 -> 章级手工归档 -> 卷级校验 -> 经验沉淀 -> 失败重试”的闭环，重新归档所有有正文来源的世界。归档结果必须明确区分：

- `raw-text`：本地保存的小说正文 `.txt` 源文件，只是来源层。
- 章级归档：读完单章全文后生成的结构化人工归档。
- 卷级归档：整卷所有章节归档后的合并、校验、复盘结果。
- 世界级归档：所有卷完成后沉淀的运行包、检索索引、时间线、实体/关系候选。
- 人工正式图谱：`relationship-graph.json`、核心 `characters-index.json` 等，不由 subagent 自动覆盖。

## 基本原则

1. 每个章节必须全文阅读，不允许只扫标题、摘要或关键词。
2. 每读完一章，立即写入该章归档文件，避免等整卷读完后凭记忆补写。
3. 单章归档必须引用来源路径和章节序号，但不得长段复制正文。
4. 每卷完成后必须跑卷级校验，校验失败则只重试失败章节或失败字段。
5. 每个 subagent 只负责一个明确范围，优先“一个 subagent = 一卷”。
6. 同一卷内部串行处理章节，保证上下文和剧情连续性。
7. 不自动写入人工正式图谱；只生成 `original-*`、`review-*`、`draft-*` 或 `proposed-*` 层。
8. 所有失败、跳过、低置信度项目都必须进入 retry/worklist，不允许静默丢弃。

## 适用来源范围

### 有 raw-text 正文的世界

这些世界可以直接按章节读取 `.txt`：

- 弑神者！：`campione`
- 在地下城寻求邂逅是否搞错了什么：`danmachi`
- 绯弹的亚里亚：`hidan-no-aria` 的可用外传/AA 部分；本篇 blocked 不纳入正文完成率
- 落第骑士英雄谭：`rakudai-kishi`
- 最弱无败神装机龙：`saijaku-muhai-bahamut`

正文源位置：

```text
campaigns/world-library/worlds/<world>/sources/raw-text/<series>/vol-XX/*.txt
```

### 只有 curated 剧情文本的世界

这些没有本轮 Wenku raw-text 正文源，但有已整理剧情 Markdown，可作为“既有 curated 剧情归档”处理：

- 恶魔高校D×D：`high-school-dxd`
- IS〈Infinite Stratos〉：`infinite-stratos`
- 型月 / Nasuverse：`type-moon-nasuverse`

处理方式不同：不能宣称有 raw-text 原文，只能读取 `curated/stories/**/*.md` 并生成 curated-derived 审计层。

## 子代理分工

### 1. Chapter Archivist / 章节归档代理

范围：一个卷目录。

输入：

- `_manifest.json`，如果存在
- 本卷所有章节 `.txt`
- 已有上一卷/本卷之前章节的卷级状态摘要

输出：每章一个 JSON 和一个简短 Markdown：

```text
curated/stories/chapter-archives/<series>/vol-XX/ch-YYY.json
curated/stories/chapter-archives/<series>/vol-XX/ch-YYY.md
```

章级 JSON 字段：

```json
{
  "schema": "rp-chapter-archive-v1",
  "worldId": "",
  "seriesId": "",
  "volumeId": "vol-XX",
  "chapterId": "ch-YYY",
  "sourcePath": "sources/raw-text/...txt",
  "title": "",
  "readStatus": "complete | blocked | too-short | failed",
  "summary": "派生摘要，不长段引用正文",
  "events": [],
  "characters": [],
  "locations": [],
  "terms": [],
  "items": [],
  "factions": [],
  "relationshipSignals": [],
  "timelineSignals": [],
  "continuityNotes": [],
  "uncertainties": [],
  "qualityFlags": [],
  "retryNeeded": false
}
```

要求：

- `events` 必须有来源章节内依据，避免泛泛概述。
- `characters` 区分登场、被提及、回忆/传闻。
- `relationshipSignals` 只能写“信号/证据”，不能直接提升为正式关系边。
- `uncertainties` 必须保留模糊称呼、译名疑点、身份未确认项。

### 2. Volume Validator / 卷级校验代理

范围：一个完整卷。

触发条件：本卷所有章节 `readStatus` 为 `complete`、`blocked` 或明确可解释状态。

输入：

- 本卷所有 `chapter-archives/*.json`
- 本卷 raw-text `_manifest.json`
- 上一卷 volume summary（如果存在）

输出：

```text
curated/stories/volume-archives/<series>/vol-XX.json
curated/stories/volume-archives/<series>/vol-XX.md
curated/stories/volume-archives/<series>/vol-XX.validation.json
curated/stories/volume-archives/<series>/vol-XX.lessons.md
```

校验项：

- 章节数是否与 manifest 匹配。
- 所有正文章节是否都有归档文件。
- 是否存在空摘要、空事件、异常短归档。
- 人物/地点/术语是否跨章节命名一致。
- 关系信号是否引用具体章节。
- 是否有大段正文复写风险。
- 是否有明显漏章、重复章、插图页误入正文。

失败处理：

- `missing-chapter-archive`：重跑对应章节。
- `empty-events`：重读章节并补事件。
- `name-conflict`：生成译名对照建议，不自动覆盖全局索引。
- `verbatim-risk`：压缩摘要，保留来源引用，不保留长句。
- `low-confidence`：进入人工复核队列。

### 3. Volume Refiner / 卷级精炼代理

范围：一个通过校验的卷。

输出：

- 卷摘要
- 卷事件链
- 卷人物增量
- 卷地点/术语增量
- 卷关系候选
- 卷时间线增量

位置：

```text
curated/stories/volume-refined/<series>/vol-XX.json
curated/stories/volume-refined/<series>/vol-XX.md
```

限制：

- 只生成候选和增量，不覆盖核心图谱。
- 与既有 `plot-graph.json` 合并前必须单独审计。

### 4. Series Auditor / 系列级审计代理

范围：一个系列所有卷。

输出：

```text
curated/stories/series-archive/<series>.json
curated/stories/series-archive/<series>.md
curated/stories/series-archive/<series>.validation.json
curated/stories/series-archive/<series>.lessons.md
```

审计项：

- 卷顺序完整性。
- 跨卷角色命名一致性。
- 重要事件是否重复或冲突。
- 长期伏笔、组织、术语是否持续追踪。
- blocked/too-short 项是否解释清楚。

### 5. World Integrator / 世界级整合代理

范围：一个世界全部系列。

输出只写派生层：

```text
curated/original-chapter-archive-index.json
curated/original-volume-archive-index.json
curated/original-entity-index.json
curated/original-relationship-candidates.json
curated/original-timeline.json
curated/original-search-index.json
curated/original-runtime-pack.json
curated/original-archive-validation.json
curated/original-archive-lessons.md
```

禁止事项：

- 不直接覆盖 `relationship-graph.json`。
- 不直接覆盖人工 `characters-index.json`。
- 不把 co-occurrence 关系候选当正式语义关系。
- 不把 raw-text 文件数当章节元数据条目。

## 自动迭代状态机

每个卷按以下状态推进：

```text
pending
  -> reading-chapters
  -> chapter-archived
  -> volume-validating
  -> volume-failed | volume-passed
  -> retrying-failed-chapters
  -> volume-refining
  -> volume-finalized
```

每个世界按以下状态推进：

```text
pending
  -> series-running
  -> series-validating
  -> world-integrating
  -> world-validating
  -> complete | needs-human-review
```

## Retry 规则

每次失败必须写入：

```text
curated/stories/retry-queues/<series>/vol-XX.retry.json
```

字段：

```json
{
  "attempt": 1,
  "failedStep": "chapter-archive | volume-validation | volume-refine",
  "target": "source path or archive path",
  "reason": "",
  "fixInstruction": "",
  "lastError": "",
  "nextAction": "retry | human-review | skip-with-justification"
}
```

重试上限：

- 章节读取失败：最多 3 次。
- 结构化字段缺失：最多 2 次。
- 命名冲突/语义不确定：不强行自动解决，进入人工复核。

## 并行策略

- 网络爬取：继续保持串行，不并发。
- 本地 raw-text 读取：可以跨卷并行，但同一卷内部串行。
- 建议并发粒度：每个 subagent 处理一卷。
- 重要世界优先级：先处理缺人工核心层的 `campione`、`rakudai-kishi`、`saijaku-muhai-bahamut`，再处理已有核心层但缺章级归档的世界。

## 每章归档质量门槛

一章归档至少应包含：

- 非空摘要。
- 至少一个事件；后记/设定页可例外，但必须说明。
- 登场/提及人物列表。
- 关键地点或“无明确地点”。
- 术语/组织/能力/物品变化。
- 与前后文连续性相关的备注。
- 不确定项。

## 每卷校验质量门槛

一卷通过前必须满足：

- 正文章节归档覆盖率 100%。
- 插图页、blocked 页、too-short 页都有解释。
- JSON 全部可解析。
- 事件链顺序稳定。
- 角色名合并建议存在，但未强行污染人工索引。
- 摘要无长段正文复写。
- 失败队列为空，或所有失败项有 `skip-with-justification`。

## 经验沉淀

每卷完成后写：

```text
curated/stories/volume-archives/<series>/vol-XX.lessons.md
```

内容：

- 本卷译名/称呼规则。
- 本卷容易漏掉的关系信号。
- 本卷特殊结构，例如短篇、后记、广播剧、设定页。
- 下一卷 subagent 应继承的上下文摘要。
- 失败原因和修复方式。

每系列完成后写：

```text
curated/stories/series-archive/<series>.lessons.md
```

每世界完成后写：

```text
curated/original-archive-lessons.md
```

## 首轮执行建议

第一轮不要全世界同时跑。先用一个小范围验证流程：

1. `campione-main/vol-01`
2. `rakudai-kishi-main/vol-01`
3. `saijaku-muhai-bahamut-main/vol-01`

原因：这三个世界有 raw-text，但缺人工核心角色/关系/知识图。先跑一卷可以验证章级归档质量，再扩展到全系列。

通过首轮后，再按世界推进：

1. 弑神者！全卷
2. 落第骑士英雄谭全卷
3. 最弱无败神装机龙全卷
4. 地错全系列复审
5. 绯弹可用来源复审
6. DXD / IS / 型月按 curated-stories 模式补章级归档审计

## 最终产物口径

最终报告必须拆分以下列，不能混报：

- raw-text 正文源文件数
- 章级归档文件数
- 卷级归档文件数
- 卷级校验通过数
- 失败/跳过章节数
- 人工核心角色数
- 自动派生角色候选数
- 人工核心关系边数
- 自动关系候选边数
- 原著运行包状态
- 人工复核待办数

## 当前注意事项

- `raw-text` 不是“已经人工归档”，只是原文来源。
- 章节元数据目前确实大多没有；不能用 raw-text 文件数冒充章节元数据条目。
- 弑神者、落第骑士、最弱无败神装机龙目前已有 raw-text 和 original 派生层，但人工核心角色/关系/知识图仍应视为缺口，不能用自动派生图谱冒充。
- DXD、IS、型月有既有 curated 剧情文本和核心图谱，但没有 Wenku raw-text；应按 curated-derived 模式归档，而不是 raw-text 模式。
