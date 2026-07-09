## 9. 资源与续航系统

每个角色、能力、道具和力量体系都需要记录资源与续航。

### 9.1 资源类型

```text
Stamina        体力
Mana           魔力
SpiritualPower 灵力
MentalPower    精神力
SoulPower      灵魂力
LifeForce      生命力
Faith          信仰
Ammunition     弹药
Charge         充能
Cooldown       冷却
Material       材料/媒介
Authority      权柄额度
```

### 9.2 资源字段

```json
{
  "resources": [
    {
      "id": "mana",
      "name": "魔力",
      "capacity": 100,
      "current": 70,
      "recoveryRate": "每分钟 3 点，魔力浓度高时翻倍",
      "externalDependency": "需要环境魔力或自身魔力炉",
      "combatEndurance": "中等强度战斗约 20 分钟",
      "exhaustionEffects": ["施法失败率上升", "身体强化解除"]
    }
  ]
}
```

### 9.3 续航判定

续航需要区分：

- 常态维持消耗。
- 普通出手消耗。
- 大招消耗。
- 防御消耗。
- 恢复速度。
- 外界补给条件。
- 爆发后虚弱期。
- 资源耗尽后的最低战斗能力。

---

