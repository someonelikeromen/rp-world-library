# exchange_edit — 兑换系统状态工具

`exchange_edit` 是主角专属兑换系统的项目工具。它管理目录型角色卡中的：

```text
progression/exchange.json
```

工具负责：估价记录结构检查、价格查表、奖励点余额、兑换项校验、待兑换/完成兑换交易、来源验证记录。具体能力、资源、物品、知识、关系等仍需用 `card_edit` 写入对应角色卡模块。

## 定价原则

定价分两步：

```text
按多世界战斗/评价框架估价 → 得出兑换项自身 N0–N24 层级 → 只按层级价格表定价
```

`price` 只做查表；`quote` 必须检查 entry 是否包含多世界框架估价记录。

价格不受主角、当前世界、稀有度、唯一性、适配度影响。

## Actions

| Action | 用途 |
|---|---|
| `init` | 初始化或规范化 `progression/exchange.json`。 |
| `status` | 显示兑换面板允许显示的余额、可见兑换项、待兑换、已兑换和来源验证摘要。 |
| `evaluate` | 检查兑换项是否有多世界评价框架估价记录。 |
| `price` | 已知 N 层级时查价格表。 |
| `grant-points` | 因重大事件发放奖励点。 |
| `normalize-points` | 按 1000:1 进位整理余额。 |
| `validate-entry` | 校验兑换项类型、完整性、来源和估价记录。 |
| `quote` | 校验 + 估价记录检查 + 报价 + 余额检查。 |
| `add-entry` | 将合法兑换项加入可见兑换项。 |
| `pending` | 创建待兑换记录，检查余额但不扣款。 |
| `complete` | 完成兑换、扣款、写入交易记录。 |
| `record-source` | 记录或更新非归档双来源验证。 |
| `validate` | 校验兑换状态文件。 |

## 估价 entry 最小结构

```json
{
  "id": "exchange-style-001",
  "name": "完整格斗术流派传承",
  "type": "non_foundation_body_soul_technique",
  "subtype": "martial_arts_style",
  "source": {
    "worldName": "示例世界",
    "status": "archived",
    "refs": ["world:example:abilities:style"],
    "verificationStatus": "verified"
  },
  "completeness": {
    "isCompleteUnit": true,
    "notFragment": true,
    "notTrial": true,
    "notWeakened": true
  },
  "evaluation": {
    "framework": "multi-world-combat-rating",
    "overall": "N2",
    "basis": "依据原文表现与多世界评价框架，完整传承稳定支持墙壁级战斗表现。",
    "dimensions": {
      "overall": "N2",
      "offense": "N2",
      "defense": "N1",
      "reaction": "N2",
      "mobility": "N1",
      "control": "N2"
    },
    "confidence": "medium"
  }
}
```

## 示例

查价：

```json
{ "action": "price", "rating": "N12" }
```

发放奖励点：

```json
{
  "action": "grant-points",
  "card": "protagonist",
  "pointLevel": 2,
  "amount": 3,
  "reason": "击败强敌并改变地区势力格局",
  "eventRef": "memory/world-history.md#重大事件"
}
```

完成兑换后仍需同步具体模块：

```json
{
  "action": "complete",
  "card": "protagonist",
  "entryId": "exchange-style-001",
  "cardModuleUpdates": ["abilities", "combatRating"],
  "memoryUpdates": ["memory/world-history.md"]
}
```
