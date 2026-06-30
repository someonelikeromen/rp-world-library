# RP World Search

世界信息索引、搜索与渐进式加载。RP中需要查询世界观设定时使用。

> 优先使用项目本地扩展工具 `world_query`（`.pi/extensions/world-query.ts`）。该工具面向 AI 渐进式查询世界书：先查 curated 结构化产物，再 fallback 到 raw worldbook，并返回可再次 `get` 的 ref。只有在工具未加载或需要人工调试时才使用 grep/read 手动查询。

## 触发条件

- RP中剧情涉及具体世界观细节
- 需要查找角色/地点/组织/历史事件/力量体系
- 用户在世界书或knowledge中存放了资料

## 1. 世界索引

### 已归档世界观（63个）

索引文件：`campaigns/world-library/manual-curation/INDEX.md`

| 世界 | slug | 状态 | 数据位置 |
|------|------|------|---------|
| 型月/Fate | type-moon-nasuverse | ✅ 已归档 | `worlds/type-moon-nasuverse/curated/` |
| 其他 62 世界 | 各 slug | ⏳ 待归档 | `imports/worldviews/<slug>/worldbooks/` |

型月世界使用 **渐进式加载**，其他世界使用 raw worldbook 搜索（fallback）。

### 型月世界数据层级

| 层级 | 路径 | 大小 | 加载时机 |
|------|------|------|---------|
| world.json 摘要 | `curated/world.json` | 15KB | 进入世界时 |
| 角色索引 | `curated/characters-index.json` (indices) | ~10KB | 进入世界时 |
| 角色全文 | `curated/characters-index.json` (detail）| 5MB | 角色出现时按 name/key 查 |
| 势力/地点 | `curated/world.json` (factions/locations）| 内嵌 | 涉及对应势力时 |
| FGO 故事索引 | `curated/stories/fgo/index.json` | 8KB | FGO 剧情开启时 |
| FGO 故事章节 | `curated/stories/fgo/fgo-*.md` | 2-8KB | 剧情推进到该章节时 |
| Fate 路线索引 | `curated/stories/fate/index.json` | 1KB | Fate 剧情开启时 |
| 妖精国历索引 | `curated/stories/fairy/index.json` | 8KB | 进入妖精国场景时 |
| 关系图谱 | `curated/relationship-graph.json` | 11KB | 按需 |
| 知识图谱 | `curated/knowledge-graph.json` | 8KB | 按需 |
| 引擎评审 | `curated/engine-review-analysis.md` | 18KB | 框架进化讨论时 |

## 2. 渐进式加载流程

### 进入世界

```
1. read curated/world.json                  — 15KB, 力量/势力/地点/事件概览
2. read curated/characters-index.json 只读 indices 部分
   → grep -A1 '"indices"' → 获取角色名+势力索引 (~10KB)
3. read curated/stories/<story>/index.json  — 剧情索引导航
```

### 角色触发

```
关键词匹配 → grep characters-index.json indices.byKey
  → 找到角色 ID → grep 该角色的 sourceRefs
  → 已有 sourceContent（原文内嵌，已在文件中）→ 直接读
  → 或 read raw worldbook 按 sourceRefs 精确定位
```

### 故事触发

```
剧情推进到某章节 → read stories/<story>/index.json 确认章节 slug
  → read stories/<story>/<chapter>.md  (2-8KB)
  → 过期章节移出上下文
```

### 势力/地点/机制触发

```
涉及某势力 → grep world.json 对应 faction → 读 summary
涉及某力量体系 → grep world.json powerSystems → 读全文
涉及某规则 → grep world.json rules → 读全文
```

## 3. 搜索策略

### 搜索 curated 产物

```bash
# 搜索角色
grep -i "关键词" campaigns/world-library/worlds/<slug>/curated/characters-index.json

# 搜索世界设定
grep -i "关键词" campaigns/world-library/worlds/<slug>/curated/world.json

# 搜索故事索引
grep -i "关键词" campaigns/world-library/worlds/<slug>/curated/stories/*/index.json
```

### Fallback: 搜索 raw worldbook

```bash
grep -li "关键词" campaigns/world-library/imports/worldviews/<slug>/worldbooks/*.json
```

## 4. Token 控制

- **禁止一次性 read 完整的 characters-index.json**（5MB）
- 用 grep 定位后用 `read offset limit` 精读
- 进入世界只加载 indices 层（~10KB）
- 故事每个章节独立 2-8KB，只看当前章节
- 同一场景不重复搜索

## 5. 冲突处理

- 用户修正 > curated > raw worldbook
- 发现矛盾记录到 `memory/project.md`

## 6. 跨世界知识边界

- 角色只知道自身世界的知识 + 已接触过的设定
- 不跨世界泄露设定信息
- 不同世界的"同名"概念不等价

## 相关 Skills

- `rp-engine`：RP主引擎
- `rp-combat`：战斗结算
- `rp-dice`：骰子
- `rp-curation`：世界归档
