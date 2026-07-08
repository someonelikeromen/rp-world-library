# card_edit — 角色卡读写工具

项目扩展工具，AI 可直接调用。配置文件：`.pi/rp-data-tools.json`

## Actions

| Action | 参数 | 用途 |
|--------|------|------|
| `cards` | — | 列出所有已注册角色卡（含 NPC） |
| `get` | `card?`, `path?` | 读取卡数据，支持 dot path |
| `status` | `card?` | 轻量摘要：基本信息/魔力/战斗/资源/关键关系/物品摘要 |
| `set` | `card?`, `path`, `value` | 设置精确值 |
| `merge` | `card?`, `path?`, `value` | 深度合并对象 |
| `append` | `card?`, `path`, `value` | 追加到数组 |
| `upsert` | `card?`, `path`, `item`, `id?`, `idField?` | 插入或更新（按 id 匹配） |
| `remove` | `card?`, `path`, `id?`, `idField?` | 删除（支持按 id 选择数组元素） |
| `batch` | `card?`, `operations` | 批量原子操作 |
| `validate` | `card?` | 一致性校验（路径+自定义规则+cross-field） |
| `register` | `card`, `cardPath`, `cardLabel?`, `cardAliases?` | 注册 NPC 卡到配置 |

## Dot Path 语法

| 语法 | 示例 | 说明 |
|------|------|------|
| 简单路径 | `age` | 直接字段 |
| 嵌套路径 | `magic.circuits` | 多级嵌套 |
| 数组索引 | `relationships[0]` | 按索引选择 |
| ID 选择器 | `resources[id=mana].current` | 按数组元素的 id 字段选择 |
| 通配符 | `combatRating.*.score` | 校验时遍历所有子对象 |

## 自动钩子 (postUpdateHooks)

写入成功后自动执行（配置在 `.pi/rp-data-tools.json`）：

| 钩子 | 行为 |
|------|------|
| `log` | 记录变更到 `memory/card-edit-{timestamp}.json`（含快照和变更列表） |
| `memory-sync` | 更新 `memory/card-status-snapshot.md`（轻量状态摘要） |

## 自动计算 (derivedFields)

| 规则 | 行为 |
|------|------|
| `resources[id=mana].current` | 自动同步自 `magic.circuits.currentReserve` |
| `combatRatingFromStats` | 根据各分项 score 自动计算 overall 综合评分 |

## 校验 (customValidators)

| 类型 | 示例 |
|------|------|
| `range` | `magic.circuits.currentReserve` 必须在 0 到 maxReserve 之间 |
| `required` | `name` 和 `currentStatus` 不能为空 |
| `equal` | 两个路径的值必须相等 |

## RP 使用流程（强制）

每次推进剧情后：

```
1. card_edit { action: "status" }          → 查看当前状态摘要
2. card_edit { action: "batch",            → 批量更新所有变更
    operations: [
      { action: "set", path: "age", value: 19 },
      { action: "set", path: "magic.circuits.currentReserve", value: 15000 },
      ...
    ]
  }
```

写入后自动触发 memory 同步，无需手动更新 memory 文件。

## 目录型统一角色卡

统一角色卡是多文件目录结构，不依赖单个角色 JSON。初始化会从多世界战斗框架模板一次性创建所有模块文件。

### 新增 Actions

| Action | 参数 | 用途 |
|--------|------|------|
| `init` | `card`, `cardPath?`, `template?` | 从统一模板初始化完整角色卡目录并注册 |
| `modules` | `card` | 列出目录型角色卡的所有模块文件 |

### 模块读写

`get/set/merge/append/upsert/remove/batch/validate/status` 支持目录型角色卡。目录型角色卡可通过 `module` 指定模块文件，通过 `path` 精确到模块内任意层级字段或列表项。

示例：

```json
{ "action": "init", "card": "hero", "cardPath": "card/hero", "template": "unified-character-v1" }
```

```json
{ "action": "get", "card": "hero", "module": "combatRating", "path": "combatRating.offense.score" }
```

```json
{ "action": "set", "card": "hero", "module": "resources", "path": "resources[id=mana].current", "value": 120 }
```

```json
{ "action": "upsert", "card": "hero", "module": "abilities", "path": "abilities", "id": "shadow-step", "item": { "id": "shadow-step", "name": "影步", "types": ["Technique"], "rank": "C" } }
```

模块别名来自 `.pi/rp-data-tools.json > cardTemplates.templates.unified-character-v1.modules`，也可以直接传模块相对路径，例如 `combat/resources.json`。
