## 4. 能力框架

能力需要记录类型、原理、消耗、外观、实际效果、词条、成长与限制。

### 4.1 基础能力类型

当前基础类型：

```text
Physical       肉体型
Energy         能量型
Technique      技巧型
Mental         精神型
Soul           灵魂型
Concept        概念型
Causality      因果型
Authority      权柄型
Technology     科技型
Artifact       道具型
Talent         天赋型
Knowledge      知识型
```

后续可按世界需要继续增加。

### 4.2 能力完整字段

```json
{
  "id": "",
  "name": "",
  "types": ["Energy", "Technique"],
  "rank": "C",
  "universalScoreRange": {
    "min": 300,
    "max": 600
  },
  "principle": "",
  "source": "self / external / hybrid / item / knowledge / talent",
  "dependencies": [],
  "cost": {
    "resource": "",
    "mode": "fixed / variable / sustained / conditional",
    "fixedAmount": null,
    "minAmount": null,
    "maxAmount": null,
    "scalingRule": "",
    "canIncreaseOutput": false,
    "canReduceCost": false
  },
  "effect": {
    "summary": "",
    "range": "",
    "duration": "",
    "targets": "",
    "mechanics": [],
    "scaling": []
  },
  "activation": {
    "requirements": [],
    "castingTime": "",
    "cooldown": "",
    "posture": "",
    "gesture": "",
    "chant": "",
    "externalSigns": []
  },
  "tags": [],
  "limitations": [],
  "sideEffects": [],
  "growth": "",
  "consistencyNotes": ""
}
```

### 4.3 消耗规则

能力必须明确：

- 消耗什么资源。
- 是固定消耗、可变消耗、持续消耗，还是条件消耗。
- 如果可变，最小值与最大值是多少。
- 增大消耗会如何增强效果。
- 减少消耗会牺牲什么。
- 是否能通过控制力、道具、环境、熟练度降低消耗。

示例：

```json
{
  "cost": {
    "resource": "暗影能量",
    "mode": "variable",
    "minAmount": 10,
    "maxAmount": 80,
    "scalingRule": "消耗越高，侵蚀速度与范围越强，但精神负荷同步上升。",
    "canIncreaseOutput": true,
    "canReduceCost": true
  }
}
```

### 4.4 外在特征记录

为避免前后不一致，能力需要记录发动表现。

包括：

- 外表变化。
- 光效/气息/声音。
- 姿势。
- 手势。
- 咏唱。
- 道具响应。
- 环境反应。

示例：

```json
{
  "activation": {
    "posture": "右手自然下垂，指尖先出现黑色裂纹。",
    "gesture": "发动瞬间五指向内扣合。",
    "externalSigns": [
      "影子边缘变得像液体一样晃动",
      "附近低阶灵体会本能后退",
      "空气中出现短暂的焦糊味"
    ]
  }
}
```

### 4.5 词条系统

能力与道具可携带词条，用于描述相性与特殊效果。

词条不是简单有/无，需要记录等级。词条等级表示该特性的强度、优先级、穿透力或影响范围。

示例结构：

```json
{
  "tags": [
    {
      "id": "dark-energy",
      "name": "黑暗能量",
      "level": "C",
      "intensity": 3,
      "notes": "具备基础侵蚀性，可污染低阶灵体。"
    },
    {
      "id": "anti-spirit",
      "name": "对灵",
      "level": "B",
      "intensity": 5,
      "notes": "对无实体灵体有显著伤害加成。"
    }
  ]
}
```

示例词条：

```text
黑暗能量
对灵
侵蚀
净化
空间
时间
灵魂
精神干涉
物理穿透
结界破坏
再生抑制
污染
神圣
诅咒
信息干涉
```

词条用于：

- 相性判断。
- 抗性判定。
- 世界体系交互。
- 道具与能力联动。
- 穿透、克制、污染、净化等效果强度判断。
- GM 保持效果一致性。

词条等级建议：

```text
E：微弱，仅对无防护目标产生影响
D：低阶，可影响普通超凡目标
C：标准，可作为稳定战斗特性
B：高阶，可突破常规防护
A：强力，可决定同级战斗走向
S：顶级，可跨级造成显著威胁
EX：规格外，需要单独解释规则
```

---

