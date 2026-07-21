# 在地下城寻求邂逅是否搞错了什么 / 地错 — 提取数据状态

更新日期：2026-07-19

## 概况

- 中文名：在地下城寻求邂逅是否搞错了什么 / 地错
- slug：`danmachi`
- 当前形态：P1 / source-backed extracted 数据已存在，但缺少完整人工验收说明
- 来源目录：
  - `campaigns/world-library/worlds/danmachi/sources/raw-text/`
  - `campaigns/world-library/worlds/danmachi/sources/split-text/`
- 当前 `curated/` 目录存在但为空；RP 检索主要依赖 `extracted/` 与索引工具兼容层。

## 当前文件统计

| 类型 | 文件数 | 说明 |
|---|---:|---|
| characters | 156 | 角色实体 |
| abilities | 31 | 能力/技能/魔法等 |
| events | 644 | 事件与剧情节点 |
| items | 39 | 道具/装备/物品 |
| locations | 48 | 地点/场景 |
| factions | 18 | 派系/眷族/组织 |
| systems | 36 | 世界规则/体系 |
| knowledge | 22 | 背景知识 |
| graph | 14 | 图谱与配套数据文件 |
| **合计** | **1,010** | extracted 下全部文件数 |

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

地错已具备较大规模 extracted 数据，事件层尤其丰富；但目前缺少类似绯弹的亚里亚 / 弑神者那样的 README 级质量保证记录，因此状态应标为：

> **已有 P1 extracted 成果，未完成最终人工验收说明。**

## 已知风险

1. 需要补充或确认卷数覆盖范围。
2. 需要执行 JSON parse / schema 校验。
3. 需要抽样核验 `sourceRef` 是否能定位到 `sources/split-text/` 章节。
4. 需要检查 graph 是否有 dangling edge、重复 ID、schema 兼容问题。
5. `manual-curation/danmachi-output/child-check-report.md` 显示 2026-07-11 曾进行 child agent / `lt-yuyu/gpt-5.5` 模型访问诊断；后续继续抽取时需显式指定 provider/model。

## 后续建议

1. 补一份覆盖卷数与 wave/merge 来源记录。
2. 对 extracted 下全部 JSON 做解析校验。
3. 对 characters/events/abilities 抽样执行原文 sourceRef 核验。
4. 若要让 `world_query` 更准确统计角色与故事，应补齐或生成 curated 兼容索引，或扩展索引工具读取 extracted schema。
