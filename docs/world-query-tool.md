# world_query — 世界书库渐进查询工具

项目扩展工具，AI 可直接调用。配置文件：`.pi/rp-data-tools.json`

## Actions

| Action | 参数 | 用途 |
|--------|------|------|
| `worlds` | `status?`, `query?`, `limit?` | 列出所有世界观（63个=5精选+58原始） |
| `overview` | `world`, `category?` | 世界观总览：力量体系/派系/规则/地点/事件/时间线/故事/角色统计 |
| `search` | `world`, `query`, `category?`, `allWorlds?`, `limit?` | 关键词搜索。allWorlds=true 跨世界搜索 |
| `get` | `ref` | 按 ref 精确取条目内容 |
| `characters` | `world`, `query?`, `limit?` | 角色索引列表/搜索 |
| `stories` | `world`, `storyId?`, `chapter?` | 故事章节索引/内容（支持 flat 和 nested 两种索引格式） |
| `aggregate` | `world`, `query` | 跨文件聚合查询：一次搜索返回实体的完整信息（角色+世界条目+故事+原始） |
| `graph` | `entityRef` | 关系图谱遍历：从角色出发查同派系/同力量体系/故事登场 |

## Ref 体系

| 前缀 | 格式 | 示例 |
|------|------|------|
| `char:` | `char:{world}:{charId}` | `char:type-moon-nasuverse:fsn-rin` |
| `world:` | `world:{world}:{section}:{id}` | `world:high-school-dxd:factions:gremory` |
| `story:` | `story:{world}:{storyId}:{chapter}` | `story:high-school-dxd:第一卷:1` |
| `rule:` | `rule:{world}:{filename}` | `rule:high-school-dxd:combat-framework` |
| `source:` | `source:{world}:{sourceId}` | `source:type-moon-nasuverse:fate-stay-night` |
| `raw:` | `raw:{world}:{filename}:{index}` | `raw:naruto:火影忍者.json:42` |

## Schema 兼容

`overview()` 自动识别多种 world.json schema 格式：
- 数组格式：`powerSystems: [{...}, ...]`
- 对象格式：`powerSystems: { key: {...} }`
- 别名映射：`divinityAndFamiliaSystem` → `powerSystems`，`factionsAndCrime` → `factions` 等

## Stories 索引格式

支持两种格式：
- **Flat**（DxD/danmachi/aria）：`stories/index.json`，stories 数组平铺
- **Nested**（型月）：`stories/{storyId}/index.json`，每线独立目录

## 跨世界搜索

```json
{ "action": "search", "query": "Saber", "allWorlds": true, "limit": 20 }
```

搜索所有 63 个世界，返回结果含世界观名称和状态。

## 排序规则

通过 `.pi/rp-data-tools.json` 的 `rankingRules` 配置：
- curated 优先于 raw
- character 优先于 world section
- importance 权重排序
