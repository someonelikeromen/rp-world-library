## 14. 状态记录标准

所有影响战斗的状态都需要统一记录。

```json
{
  "states": [
    {
      "id": "overload-01",
      "name": "魔力过载",
      "type": "overload",
      "source": "强行提高术式输出",
      "startTurn": 18,
      "duration": "3 回合",
      "effects": [
        { "target": "output", "change": "+40%" },
        { "target": "control", "change": "-20%" }
      ],
      "costPerTurn": "魔力 15，身体负荷上升",
      "risks": ["肌肉撕裂", "术式失控"],
      "visibleSigns": ["血管发亮", "呼吸急促"],
      "endCondition": "主动解除或魔力低于 10"
    }
  ]
}
```

状态类型包括：伤势、疲劳、污染、封印、强化、形态、过载、冷却、资源消耗、精神异常、灵魂损伤、装备损坏。

---

