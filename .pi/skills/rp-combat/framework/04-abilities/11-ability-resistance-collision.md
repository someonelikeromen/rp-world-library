## 11. 能力与抗性碰撞规则

特殊机制碰撞不按名字大小决定，而按能力等级、抗性等级和驱动属性判定。

### 11.1 最小碰撞流程

```text
1. 确认攻击/效果词条
2. 确认防御方是否有对应抗性词条
3. 比较能力等级与抗性等级
4. 若等级不同，高等级一方占优
5. 若等级相同，比较对应驱动属性
6. 若仍接近，比较消耗、控制力、情报、环境和状态
7. 输出结果：无效 / 削弱 / 部分生效 / 完全生效 / 反噬
```

### 11.2 等级比较

```text
能力等级 > 抗性等级：效果可突破抗性，但可能被削弱
能力等级 = 抗性等级：进入驱动属性对抗
能力等级 < 抗性等级：效果被抵抗、偏转或大幅削弱
```

### 11.2.1 无效化阈值规则

从 Fate 对魔力体系提炼——当抗性等级足够高时可直接无效化低等级攻击。

```text
抗性等级 ≥ 攻击等级 + 2  → 完全无效化
抗性等级 ≥ 攻击等级      → 大幅减免（70-90%）
抗性等级 = 攻击等级 - 1  → 部分减免（30-50%）
抗性等级 ≤ 攻击等级 - 2  → 基本不减免
```

仅适用于"同类型"抗性（如 对魔力 只抵抗魔术，不抵抗物理攻击）。
跨类型抗性不适用此规则。

### 11.3 驱动属性

不同机制对应不同驱动属性：

```text
精神控制       MentalStrength / Control / Computation
灵魂攻击       MentalStrength / Soul-related resistance / Control
能量侵蚀       Control / Output / 对应能量资源
概念干涉       Control / MentalStrength / 机制等级
因果干涉       Computation / Control / 机制等级
时间能力       Control / Computation / 能力等级
空间能力       Control / Perception / Computation
信息干涉       Computation / Control / 对应信息抗性
肉体压制       Output / Durability
结界压制       Control / Resource / 术式结构
```

示例：

```text
B 级精神控制 vs B 级精神抗性：等级相同。
进入驱动属性对抗：攻击方 MentalStrength + Control，对防御方 MentalStrength + 对应抗性来源。
若攻击方控制力更高但资源不足，结果可判为“短暂部分生效”。
```

---

