# RP Exchange System · 设计与使用说明

## 概要

兑换系统是主角专属的可选外挂。它使用多世界战斗框架的 N0–N24 层级为完整兑换项定价，并用多级“奖励点”支付。

系统目标：让主角能用重大事件获得的奖励点，主动兑换完整的体质/血统、能量基盘、能力、技艺传承、物品、非情报类知识和限定契约。

## 和成就系统的关系

- 未联动时：成就系统按自身规则运行，兑换系统独立运行。
- 联动时：成就系统不再随机发原著奖励，而是直接发放奖励点。
- 成就记录仍在 `progression/achievements.json`，奖励点和交易记录在 `progression/exchange.json`。

## 奖励点

奖励点使用等级名称：

| 货币 | 说明 |
|---|---|
| `1级奖励点` | 最低级奖励点 |
| `2级奖励点` | 由 1级奖励点进位 |
| `3级奖励点` | 由 2级奖励点进位 |
| `4级奖励点` | 由 3级奖励点进位 |
| `5级奖励点` | 由 4级奖励点进位 |

默认进位：`1000:1`。

## 推荐价格表

实际价格表在 `data/rp-exchange/settings.json`。默认按每 6 个 N 级进入下一档奖励点：

| N 层级 | 价格 |
|---|---|
| N0 | 1 个 1级奖励点 |
| N1 | 3 个 1级奖励点 |
| N2 | 10 个 1级奖励点 |
| N3 | 30 个 1级奖励点 |
| N4 | 100 个 1级奖励点 |
| N5 | 300 个 1级奖励点 |
| N6 | 1 个 2级奖励点 |
| N7 | 3 个 2级奖励点 |
| N8 | 10 个 2级奖励点 |
| N9 | 30 个 2级奖励点 |
| N10 | 100 个 2级奖励点 |
| N11 | 300 个 2级奖励点 |
| N12 | 1 个 3级奖励点 |
| N13 | 3 个 3级奖励点 |
| N14 | 10 个 3级奖励点 |
| N15 | 30 个 3级奖励点 |
| N16 | 100 个 3级奖励点 |
| N17 | 300 个 3级奖励点 |
| N18 | 1 个 4级奖励点 |
| N19 | 3 个 4级奖励点 |
| N20 | 10 个 4级奖励点 |
| N21 | 30 个 4级奖励点 |
| N22 | 100 个 4级奖励点 |
| N23 | 300 个 4级奖励点 |
| N24 | 1 个 5级奖励点 |

价格只看兑换项自身层级，不看稀有度、主角、当前世界、适配度或来源世界。

## 兑换流程

1. 用户请求兑换或查看面板。
2. 读取 `progression/exchange.json`、`combat/world-adaptation.json` 和 `memory/world-history.md`。
3. 判断兑换项类型是否允许。
4. 判断兑换项是否完整。
5. 查证来源：已归档世界用 `world_query`；非归档世界至少双来源联网/外部验证。
6. 依据多世界战斗框架给兑换项定 N 层级。
7. 按价格表计算价格。
8. 展示面板，等待用户确认。
9. 扣除奖励点并写入交易。
10. 按类型落盘到角色卡模块。
11. 更新 `memory/world-history.md`。

## 兑换类型与落盘建议

| 类型 | 模块 |
|---|---|
| 体质/血统 | `lifeProfile`, `attributes`, `resistances`, `resources`, `worldAdaptation` |
| 能量基盘 | `resources`, `lifeProfile`, `worldAdaptation` |
| 基于基盘的能力 | `abilities`, `resources`, `combatRating`, `worldAdaptation` |
| 不基于基盘的肉身/灵魂/技艺传承 | `attributes`, `lifeProfile`, `resistances`, `abilities`, `combatRating` |
| 物品道具 | `inventory`, `combatRating`, `worldAdaptation` |
| 知识 | `knowledge`, `memory/world-history.md` |
| 契约 | `relationships`, `abilities`, `resources`, `knowledge`, `worldAdaptation` |

## 非归档双来源验证

非归档世界兑换必须至少两个独立来源。建议记录：

```json
{
  "url": "",
  "title": "",
  "fetchedAt": "",
  "summary": "",
  "supports": ["workExists", "entryExists", "completeUnit"]
}
```

两个来源冲突或不足时，不允许兑换。

## 面板显示

允许显示：余额、当前可兑换项、已完成兑换、待确认兑换、来源验证状态、主角状态摘要。

禁止显示：未验证非归档兑换详情、原著未来情报、剧情攻略、NPC 秘密、GM-only 信息。

## 工具

使用 `exchange_edit` 管理兑换账本：

- `evaluate`：检查兑换项是否包含多世界评价框架估价记录。
- `price`：已知 N 层级时查表。
- `quote`：校验 + 估价记录检查 + 报价。
- `grant-points`：因重大事件发放奖励点。
- `add-entry` / `pending` / `complete`：加入可兑换项、创建待兑换、完成扣款记账。

注意：`exchange_edit` 不会自动写入具体能力/物品/知识/关系；完成兑换后仍需用 `card_edit` 同步对应角色卡模块，并更新 `memory/world-history.md`。
