# Card Edit Tool

项目本地 Pi 扩展：`.pi/extensions/card-edit.ts`

用途：给 AI 一个通用的 RP 人物卡快速查询/修改工具。默认注册主角卡 `card/linjie.json`，但结构通过 `.pi/rp-data-tools.json` 配置，可继续扩展到更多角色卡或新字段结构。

## 工具名

`card_edit`

## 配置入口

`.pi/rp-data-tools.json`

当前注册：

```json
{
  "cards": {
    "protagonist": {
      "path": "card/linjie.json",
      "schema": "rp-character-v1",
      "aliases": ["linjie", "林界", "主角"],
      "idArrays": {
        "magic.knownSpells": "id",
        "abilities": "id",
        "resources": "id",
        "relationships": "id"
      }
    }
  }
}
```

## 参数

```ts
{
  action: "cards" | "get" | "set" | "merge" | "append" | "upsert" | "remove" | "batch" | "validate",
  card?: string,
  path?: string,
  value?: any,
  item?: any,
  id?: string,
  idField?: string,
  operations?: Array<Operation>,
  dryRun?: boolean,
  backup?: boolean,
  note?: string,
  maxBytes?: number
}
```

## 路径语法

支持：

```text
age
currentStatus.location
magic.circuits.currentReserve
resources[id=mana].current
magic.knownSpells[id=reinforcement].panelLevel
relationships[id=waver].currentRelation
abilities[0].name
```

数组可用：

- `[0]`：数字索引。
- `[id=mana]`：按字段选择，字段和值可替换。
- `idField`：对 `upsert/remove` 指定数组 id 字段；不填时使用 `.pi/rp-data-tools.json` 中 `idArrays`，再 fallback 到 `id`。

## 常用调用

### 列出已注册人物卡

```json
{ "action": "cards" }
```

### 读取整张主角卡

```json
{ "action": "get", "card": "protagonist" }
```

### 读取单个字段

```json
{ "action": "get", "card": "protagonist", "path": "currentStatus" }
```

### 修改年龄

```json
{ "action": "set", "card": "protagonist", "path": "age", "value": 19 }
```

### 修改魔力当前值

```json
{ "action": "batch", "card": "protagonist", "operations": [
  { "action": "set", "path": "magic.circuits.currentReserve", "value": 15000 },
  { "action": "set", "path": "resources[id=mana].current", "value": 15000 },
  { "action": "set", "path": "combatRating.resource.mana.current", "value": 15000 }
] }
```

### 更新技能等级

```json
{
  "action": "set",
  "card": "protagonist",
  "path": "magic.knownSpells[id=reinforcement].panelLevel",
  "value": "Lv.16（0/1638400）"
}
```

### 更新关系

```json
{
  "action": "set",
  "card": "protagonist",
  "path": "relationships[id=waver].currentRelation",
  "value": "时钟塔同学，关系升温，互相信任"
}
```

### 添加或更新资源/能力/关系

```json
{
  "action": "upsert",
  "card": "protagonist",
  "path": "resources",
  "item": { "id": "command-seal", "name": "令咒", "current": 3, "unit": "划" }
}
```

### 批量更新当前状态

```json
{
  "action": "merge",
  "card": "protagonist",
  "path": "currentStatus",
  "value": {
    "world": "type-moon-nasuverse",
    "location": "伦敦时钟塔",
    "time": "1993年2月",
    "condition": "完成一次训练结算，魔力小幅消耗。"
  }
}
```

### 先 dry-run 再真正写入

```json
{
  "action": "set",
  "card": "protagonist",
  "path": "resources[id=mana].current",
  "value": 16000,
  "dryRun": true
}
```

### 校验同步状态

```json
{ "action": "validate", "card": "protagonist" }
```

## 写入行为

- 默认每次修改前备份到 `backup/card-edits/`。
- 写入是临时文件 + rename 的原子写入。
- `dryRun: true` 不写文件，只返回变化预览和校验结果。
- 修改后自动运行基础校验：必需路径、魔力/资金一致性等。

## 每轮 RP 后的主角卡同步要求

剧情推进后优先用 `card_edit` 同步：

- `age`
- `magic.circuits.currentReserve`
- `magic.knownSpells[].panelLevel`
- `combatRating.*.score`
- `resources[].current`
- `inventory`（如果后续加入）
- `relationships[].currentRelation`
- `currentStatus`

## 自扩展方式

后续要新增人物卡，只需在 `.pi/rp-data-tools.json` 的 `cards` 下增加：

```json
"some-card": {
  "path": "card/some-card.json",
  "schema": "rp-character-v1",
  "label": "某角色",
  "aliases": ["某角色"],
  "requiredPaths": ["name", "currentStatus"],
  "idArrays": { "resources": "id", "relationships": "id" },
  "extensionSlots": {
    "customValidators": [],
    "derivedFields": [],
    "postUpdateHooks": []
  }
}
```
