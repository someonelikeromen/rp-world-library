# RP World Search

世界信息索引、搜索与渐进式加载。RP中需要查询世界观设定时使用。

> **强制使用 `world_query` 工具**（`.pi/extensions/world-query.ts`）。该工具支持三层渐进搜索：**extracted → curated → raw**。禁止用 grep/read 手动查询（除非工具未加载）。

## 触发条件
- RP中剧情涉及具体世界观细节
- 需要查找角色/地点/组织/历史事件/力量体系
- 需要跨文件聚合查询或关系图谱遍历

## 1. 世界索引

### 搜索优先级
```
第 1 层: extracted/ ← 优先（实体文件，含 periods[] 丰富数据）
第 2 层: curated/  ← 回退（characters-index.json, world.json）
第 3 层: raw       ← 最后手段（原始 worldbook 条目）
```

### 已提取数据世界（已归档）

| 世界 | 提取实体 | 支持功能 |
|------|---------|---------|
| hidan-no-aria | 4,171 | search, get entity:, aggregate, graph（含图谱） |
| campione | 1,844 | search, get entity:, aggregate, graph（含图谱） |

### 精选（curated only）世界

| 世界 | 角色 | 故事 |
|------|------|------|
| type-moon-nasuverse | 337 | 3子线51章 |
| high-school-dxd | 41 | 35章 |
| danmachi | 31 | 2组 |
| infinite-stratos | 12 | — |

## 2. world_query 工具 Action 速查

| Action | 用途 | 示例 |
|--------|------|------|
| `worlds` | 列出所有世界观 | `{action:"worlds", status:"curated"}` |
| `overview` | 世界观总览（含 extracted 统计） | `{action:"overview", world:"hidan-no-aria"}` |
| `search` | 关键词搜索（extracted > curated > raw） | `{action:"search", world:"campione", query:"护堂"}` |
| `search` 跨世界 | 所有世界搜索 | `{action:"search", query:"Saber", allWorlds:true}` |
| **`get`** | 支持 2 种 ref | 见下方 ref 格式 |
| `characters` | 角色列表（curated 层） | `{action:"characters", world:"danmachi"}` |
| `stories` | 故事章节（curated 层） | `{action:"stories", world:"type-moon-nasuverse"}` |
| **`aggregate`** | **跨文件聚合 + 图谱关联** | `{action:"aggregate", world:"hidan-no-aria", query:"金次"}` |
| **`graph`** | **图谱遍历（含预构建边）** | `{action:"graph", entityRef:"entity:campione:characters:godou-kusanagi"}` |

## 3. Ref 格式

| 前缀 | 格式 | 示例 | 数据来源 | 加载方式 |
|------|------|------|---------|---------|
| `entity` | `entity:{world}:{type}:{id}` | `entity:hidan-no-aria:characters:kinji` | `extracted/{type}/{id}.json` | 直接读 JSON 全文 |
| `char` | `char:{world}:{id}` | `char:type-moon-nasuverse:fsn-rin` | `curated/characters-index.json` | 从索引取 |
| `world` | `world:{slug}:{section}:{id}` | `world:campione:powerSystems:盟约大法` | `curated/world.json` | 按 section 索引 |
| `story` | `story:{world}:{storyId}:{chapterId}` | `story:type-moon-nasuverse:fgo:ch-01` | `curated/stories/` | 读故事文件 |
| `raw` | `raw:{world}:{file}:{index}` | `raw:campione:ssg_card.worldbook.json:5` | `imports/worldviews/` | 原始 worldbook |

## 4. 调用模式

### 快速查角色
```
world_query { action: "search", world: "campione", query: "护堂" }
  → 返回 extracted 结果+ref → get entity:...
```

### 深度聚合（含图谱）
```
world_query { action: "aggregate", world: "hidan-no-aria", query: "金次" }
  → 提取数据 + 图谱边 + 关联能力
```

### 图谱遍历
```
world_query { action: "graph", entityRef: "entity:campione:characters:godou-kusanagi" }
  → extracted 关系 + char-relations 边 + complete-graph 边 + 能力/事件关联
```

## 5. 渐进式加载流程

```
1. overview → 知道世界有什么
2. search   → 找到感兴趣的实体
3. get/aggregate → 加载详情（含图谱关系）
4. graph    → 遍历关联实体
```
