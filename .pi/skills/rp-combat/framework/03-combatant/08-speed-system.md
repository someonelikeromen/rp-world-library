## 8. 速度体系

速度必须拆分，不使用单一“速度等级”覆盖所有表现。

### 8.1 速度分项

```text
ReactionSpeed      反应速度：发现威胁并做出反应
ActionSpeed        出手速度：完成攻击/施法/技能动作的速度
MovementSpeed      移动速度：常规跑动、飞行、位移速度
TravelSpeed        长距离赶路速度
ThinkingSpeed      思维速度：分析、计算、决策速度
CastingSpeed       施法/蓄力/构筑速度
ProjectileSpeed    弹道/攻击飞行速度
Teleportation      瞬移/传送，不直接等同移动速度
```

示例：

```json
{
  "speedProfile": {
    "reactionSpeed": { "rating": "N7", "score": 9000 },
    "actionSpeed": { "rating": "N6", "score": 6100 },
    "movementSpeed": { "rating": "N5", "score": 2800 },
    "thinkingSpeed": { "rating": "N8", "score": 18000 },
    "castingSpeed": { "rating": "N6", "score": 5300 },
    "notes": ["反应和思维远高于移动，适合防反和术式解析。"]
  }
}
```

### 8.2 速度判定原则

- 命中判定看 `ReactionSpeed`、`ActionSpeed`、`Perception`、技能轨迹和攻击范围。
- 追击/逃跑看 `MovementSpeed`、`TravelSpeed`、地形和续航。
- 法术对轰看 `CastingSpeed`、`Computation`、`Control`。
- 瞬移/传送单独记录距离、条件、冷却、锁定方式和可否被打断。
- 时间停止、时间加速、预知未来等不归入普通速度，应作为能力或特殊机制处理。

---

