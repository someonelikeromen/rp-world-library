# 落第骑士英雄谭 — 提取数据状态

更新日期：2026-07-19

## 概况

- 中文名：落第骑士英雄谭
- slug：`rakudai-kishi`
- 当前形态：P1 / source-backed extracted 的部分成果
- 来源目录：
  - `campaigns/world-library/worlds/rakudai-kishi/sources/raw-text/`
  - `campaigns/world-library/worlds/rakudai-kishi/sources/split-text/`
- 当前 `curated/` 目录存在但为空；RP 检索主要依赖 `extracted/` 与索引工具兼容层。

## 当前文件统计

| 类型 | 文件数 | 说明 |
|---|---:|---|
| characters | 99 | 角色实体 |
| graph | 14 | 图谱与配套数据文件 |
| **合计** | **117** | extracted 下全部文件数 |

## 图谱数据

`graph/` 当前包含：

- `ability-graph.json`
- `char-relations.json`
- `complete-graph.json`
- `event-graph.json`
- `item-graph.json`
- `timeline.json`
- `world-graph.json`
- 以及对应配套数据文件

## 当前判断

落第骑士英雄谭当前 extracted 数据主要是人物层与 graph 文件。未见完整部署的：

- `abilities/`
- `events/`
- `items/`
- `locations/`
- `factions/`
- `systems/`
- `knowledge/`

因此当前状态应标为：

> **P1 extracted 部分成果 / 人物层试抽取，不应标为完整 P1 世界归档。**

## 已知风险

1. 当前实体层不完整，缺少能力、事件、物品、地点、派系、体系、知识等目录。
2. 需要确认 graph 是否由完整数据生成，还是从人物层/中间产物生成。
3. 需要执行 JSON parse / schema 校验。
4. 需要抽样核验 `sourceRef` 是否能定位到 `sources/split-text/` 章节。
5. 需要确认覆盖卷数、wave/merge 记录与审计闭环状态。

## 后续建议

1. 若继续走 P1 管线，应补齐 abilities/events/items/locations/factions/systems/knowledge。
2. 若暂不继续抽取，应在索引或总状态中保持“部分 extracted / 人物层试抽取”标记。
3. 后续重建 graph 前，应先确认源实体层完整性，避免 graph 与实体源不一致。
