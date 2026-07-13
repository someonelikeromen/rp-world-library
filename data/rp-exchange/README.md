# RP Exchange Data

兑换系统数据目录。

## 原则

- 本目录不维护庞大的固定商品池。
- 兑换项应按用户请求、当前剧情或世界查询即时生成，并进行来源验证。
- 已归档世界优先使用 `world_query` 证明兑换项存在。
- 非归档世界必须至少双来源验证。
- 定价必须先依据多世界战斗/评价框架估出兑换项自身 N0–N24 层级，再读取 `settings.json > priceByN` 查表。
- 高强度兑换仅通过价格区分，不附加前置、适配期、弱化、拆分等限制。
- 兑换必须完整，不允许碎片、残缺版、试用版、弱化版或单独一招。
- 知识类不包含情报；不得兑换剧情攻略、原著未来情报、NPC 秘密、世界隐藏真相。
- 不支持系统类兑换；系统自带仅基本语言、初始身份、状态/兑换面板显示。

## 文件

- `settings.json`：兑换系统设置、价格表、允许类型、来源验证规则。
- `schemas/exchange-state.schema.json`：角色卡 `progression/exchange.json` 状态 schema。
- `schemas/exchange-entry.schema.json`：兑换项 schema。
- `schemas/exchange-transaction.schema.json`：兑换交易 schema。
