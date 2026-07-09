## 1. 世界数据框架

每个世界应记录其自身的力量体系、势力、环境与规则，而不是被统一模板强行抹平。

### 1.1 世界基础信息

建议字段：

```json
{
  "worldId": "",
  "worldName": "",
  "genre": [],
  "summary": "",
  "sandboxPrinciple": "剧情不固定，角色行动与事件自然演化。",
  "hasFixedFate": false,
  "foreignPowerSuppressionDefault": false
}
```

说明：

- `hasFixedFate`：大多数世界为 `false`。只有世界观明确有命运、剧本、世界线收束时才为 `true`。
- `foreignPowerSuppressionDefault`：默认 `false`。除非该世界设定中明确有禁魔、排异、法则压制等。

### 1.2 力量体系列表

一个世界可以有多个力量体系。

例如：

```json
{
  "powerSystems": [
    {
      "id": "martial-arts",
      "name": "武道",
      "category": "body-technique",
      "principle": "通过肉体锻炼、技法、气血调动形成战斗力。",
      "energySource": "self",
      "hasExternalEnergy": false,
      "externalEnergyName": null,
      "energyTraits": [],
      "levelMapping": []
    },
    {
      "id": "mana-magic",
      "name": "魔法",
      "category": "external-energy-control",
      "principle": "通过精神模型与术式结构调动外界魔力。",
      "energySource": "external",
      "hasExternalEnergy": true,
      "externalEnergyName": "魔力",
      "energyTraits": ["可塑性高", "受环境浓度影响", "可被术式约束"],
      "levelMapping": []
    }
  ]
}
```

### 1.3 力量体系等级映射

每个本地力量体系需要说明其本地等级对应通用评级体系的哪个范围。

```json
{
  "levelMapping": [
    {
      "localLevel": "初级魔法师",
      "description": "能稳定施展低阶术式。",
      "universalRange": {
        "rank": "街头级",
        "minScore": 80,
        "maxScore": 150
      },
      "typicalAttributes": {
        "output": "D",
        "durability": "E+",
        "reaction": "D",
        "control": "C",
        "perception": "D+",
        "mentalStrength": "C",
        "computation": "C+"
      }
    }
  ]
}
```

注意：

- **levelMapping 是强制要求**，每个世界归档时必须为每个 powerSystem 填写。
- 本地等级不是绝对战力，只是常见范围。
- 同等级角色可因能力、经验、道具、相性差异产生巨大差别。
- 映射应允许范围，而非单点数值。
- 参考: 型月世界 `curated/world-rules/combat-framework-mapping.md` 含完整的 Fate N0-N24 映射示例。

### 1.4 势力与准则

世界需要记录主要势力、制度、准则与禁忌。

```json
{
  "factions": [
    {
      "id": "",
      "name": "",
      "type": "academy / guild / empire / cult / corporation / clan / loose-network",
      "summary": "",
      "powerSystemAffinity": [],
      "publicRules": [],
      "hiddenRules": [],
      "attitudeToOutsiders": "neutral",
      "knownMembers": []
    }
  ]
}
```

准则可以包括：

- 世界公开法律。
- 超凡者内部规则。
- 势力禁忌。
- 决斗、战争、交易、传承、禁术相关约束。

---

