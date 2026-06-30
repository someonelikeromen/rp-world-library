# RP World Search

世界信息索引、搜索与渐进式加载。RP中需要查询世界观设定时使用。

> **强制使用 `world_query` 工具**（`.pi/extensions/world-query.ts`）。该工具支持渐进式查询：先查 curated 结构化产物，再 fallback 到 raw worldbook，并返回可再次 `get` 的 ref。禁止用 grep/read 手动查询（除非工具未加载）。

## 触发条件

- RP中剧情涉及具体世界观细节
- 需要查找角色/地点/组织/历史事件/力量体系
- 需要跨文件聚合查询或关系图谱遍历

## 1. 世界索引

### 已归档世界观（63个，5精选 + 58原始）

| 状态 | 数量 | 可用功能 |
|------|------|---------|
| **精选 (curated)** | 5 | 全部 action：worlds, overview, search, get, characters, stories, aggregate, graph |
| **原始 (raw)** | 58 | worlds, search, get（raw entry） |

### 5 个精选世界

| 世界 | slug | 角色 | 故事 | 世界观 | 图谱 |
|------|------|------|------|--------|------|
| 型月/Fate | type-moon-nasuverse | 337 | 3子线51章 | 10PS/7派系/9时间线 | ✅ |
| 恶魔高校DxD | high-school-dxd | 41 | 35章 | 5PS/13派系 | ✅ |
| 地错 | danmachi | 31 | 2组(537条时间线) | 2PS/9派系/9时间线 | ✅ |
| 绯弹的亚里亚 | hidan-no-aria | 20 | 3组50章 | 3PS/10派系/7时间线 | ✅ |
| 无限斯特拉托斯 | infinite-stratos | 12 | — | 3PS/7派系 | ✅ |
| **合计** | | **441** | | | |

### 型月世界数据层级（最大最完整）

| 层级 | 路径 | 大小 | 加载时机 |
|------|------|------|---------|
| world.json | `curated/world.json` | 15KB | 进入世界时 |
| 角色索引 | `curated/characters-index.json` | 3.4MB | aggregate/get 按需 |
| 角色详情 | 同上 detail 字段 | 内嵌 | aggregate 或 get 时返回 |
| FGO 故事 | `curated/stories/fgo/` | 51章 | 剧情推进到对应特异点/异闻带 |
| Fate 路线 | `curated/stories/fate/` | 4章 | Fate 线剧情开启时 |
| 妖精国历 | `curated/stories/fairy/` | 17章 | 进入妖精国场景时 |
| 关系图谱 | `curated/relationship-graph.json` | 365节点/289边 | graph action |
| 知识图谱 | `curated/knowledge-graph.json` | 22节点/16边 | 按需 |

## 2. world_query 工具 Action 速查

| Action | 用途 | 示例 |
|--------|------|------|
| `worlds` | 列出所有世界观 | `{action:"worlds", status:"curated"}` |
| `overview` | 世界观总览 | `{action:"overview", world:"type-moon-nasuverse"}` |
| `search` | 关键词搜索 | `{action:"search", world:"high-school-dxd", query:"赤龙帝"}` |
| `search` 跨世界 | 所有世界搜索 | `{action:"search", query:"Saber", allWorlds:true}` |
| `get` | 按 ref 精确取 | `{action:"get", ref:"char:type-moon-nasuverse:fsn-rin"}` |
| `characters` | 角色列表/搜索 | `{action:"characters", world:"danmachi", query:"贝尔"}` |
| `stories` | 故事章节 | `{action:"stories", world:"high-school-dxd"}` |
| **`aggregate`** | **跨文件聚合** | `{action:"aggregate", world:"type-moon-nasuverse", query:"远坂凛"}` |
| **`graph`** | **关系遍历** | `{action:"graph", entityRef:"char:type-moon-nasuverse:fsn-rin"}` |

## 3. 渐进式加载流程

### 进入世界
```
world_query { action: "overview", world: "xxx" }
  → 返回 forces/factions/rules/locations/events/timelines 统计
  → 根据剧情需要，继续 characters / stories / search
```

### 角色查询
```
简单查找 → world_query { action: "characters", world: "xxx", query: "角色名" }
深度查询 → world_query { action: "aggregate", world: "xxx", query: "角色名" }
  → 一次返回角色详情 + 关联派系 + 关联故事 + raw 条目（跨文件聚合）
```

### 关系图谱
```
world_query { action: "graph", entityRef: "char:type-moon-nasuverse:fsn-rin" }
  → 返回同派系角色、同力量体系角色、派系详情、故事登场
```

### 故事剧情
```
列故事 → world_query { action: "stories", world: "xxx" }
读章节 → world_query { action: "stories", world: "xxx", storyId: "fgo", chapter: "lb6" }
```

## 4. 跨世界搜索

```
world_query { action: "search", query: "龙", allWorlds: true, limit: 20 }
  → 搜索所有 63 个世界，返回匹配结果及世界观名
```

## 5. Token 控制

- 优先用 `world_query` 工具，避免直接 read 大文件
- `aggregate` 自动按实体聚合，减少 AI 手动拼接
- `overview` 只返回统计数字，需要详情再用 `get`
- 型月 characters-index 3.4MB——只用工具查询，禁止直接 read
- 同一场景不重复搜索

## 6. 原始世界 Fallback

58 个 raw 世界通过 worldbook entries 搜索：
```
world_query { action: "search", world: "naruto", query: "鸣人", category: "raw" }
  → 返回 raw entries 的 comment + content 片段
```

## 7. 冲突处理

- 用户修正 > curated > raw worldbook
- 发现矛盾记录到 `memory/`

## 相关 Skills

- `rp-engine`：RP主引擎
- `rp-combat`：战斗结算
- `rp-dice`：骰子
- `rp-curation`：世界归档
