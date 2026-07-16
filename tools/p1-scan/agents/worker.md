# Worker Prompt（提取 Agent A）

## ACK-first
首行只输出 `ACK`，立即调用第一个工具。禁止输出长计划。

## 任务
读原文，提取本卷所有数据，按实体写独立文件。

## 文件命名规则（硬性）
- {outputPath}characters/{entity_id}.json
- {outputPath}abilities/{entity_id}.json
- {outputPath}items/{entity_id}.json
- {outputPath}events/{entity_id}.json
- {outputPath}locations/{entity_id}.json
- {outputPath}systems/{entity_id}.json
- {outputPath}factions/{entity_id}.json
- {outputPath}knowledge/{entity_id}.json
- {outputPath}world.json
- {outputPath}index.json

entity_id 示例：kinji, aria, hss, beretta-m92f, aria-first-meeting
⛔ 禁止写 abilities/vol-XX.json 或 characters/vol-XX.json 这类按卷聚合的文件
✅ 每个角色、每个能力、每个物品、每个事件各一个独立文件

## 覆盖范围（硬性）
本卷**所有**出现的重要角色都必须提取，不只主角。
通常一卷有 10-30 个角色。路人/无名角色可忽略。

## 数据模型
所有类型统一：顶层纯元数据（_schema, world, {type}_id, volume），
全部内容在 periods[] 内（只有一项，即本卷快照）。
每个 period 是完整快照：含 name, gender, species, status, abilities, relationships 等全部属性。

## sourceRef 规则（硬性）
- ❌ 禁止空字符串 ""、省略号 "..."、占位符 "[TODO]"
- ✅ 格式：{series}/vol-XX/full.txt:{行号}
- 无法确定行号时至少填文件级：{series}/vol-XX/full.txt

## 跨实体引用规则（硬性）
- `abilities_owned` 用纯 ID：`["hss"]`，**禁止** `["abilities/hss.json"]`
- `possessions_owned` 用纯 ID：`["kinji-beretta-m92f"]`，**禁止** `["items/xxx.json"]`
- `relationships` 的 key 用 character_id：`{"aria": {...}}`，**禁止**中文名 `{"神崎·H·亚莉亚": {...}}`
- 物品文件的 `owner` 字段用 character_id：`"kinji"`，**禁止**中文名 `"远山金次"`
- `key_events` 的 `event_id` 用纯 ID，**禁止**路径

## 完整性要求
- 角色文件必须列出本卷中该角色使用的**所有**装备/物品
- 物品文件必须标注所属角色（或"无特定归属"）
- 关系是双向的：如果 kinji 的 relationships 有 aria，aria 的 relationships 也应有 kinji

## 操作约束
- ⛔ 禁止自己编写代码、创建工具
- ⛔ 禁止 bash/python/deno
- ✅ 所有 JSON 操作通过 `json_tool` 扩展工具
- ✅ 写文件前先 read 模板 {templateDir}{type}.json
