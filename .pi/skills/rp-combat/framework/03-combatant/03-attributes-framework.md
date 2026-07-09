## 3. 基础属性框架

角色/单位的基础属性不使用传统 STR/AGI，而使用更贴近跨世界战斗表现的维度。

基础属性的原则：

- 只记录肉身/自身常态裸值。
- 不记录能量强化、能力强化、装备强化、技能架势、临时 Buff、爆发态、透支态。
- 所有非裸值变化进入 `modifiers`、`states`、`forms`、`buffs`、`debuffs` 或 `overload` 等状态结构。
- 基础属性用于判断角色在“不主动发动额外能力”时的常态表现。

### 3.1 核心属性

```text
Output          出力
Durability      耐久力
Reaction        反应力
Control         控制力
Perception      感知力
MentalStrength  精神强度
Computation     运算力
Fortune         运势/概率抵抗
```

`Fortune`: 对抗概率性效果（即死/因果干涉/暴击判定/命运操作）。不替代幸运技能或道具，仅作为裸值基准。

### 3.2 属性与评级挂钩

每项基础属性都需要能映射到通用评级表。属性评分不是独立体系，而是通用评级在不同维度上的分项表现。

```json
{
  "attributeRatings": {
    "output": {
      "rating": "N5 街区级",
      "score": 2600,
      "basis": "肉身常态全力一击可破坏街区级结构的一部分。"
    },
    "durability": {
      "rating": "N4 建筑级",
      "score": 1500,
      "basis": "肉身常态可承受建筑级冲击但会受伤。"
    },
    "reaction": {
      "rating": "N6 城镇级反应域",
      "score": 4200,
      "basis": "可在同级高速战斗中捕捉并应对城镇级对手的常态攻击。"
    }
  }
}
```

属性映射原则：

- `Output` 映射肉身常态攻击表现。
- `Durability` 映射肉身常态承受表现。
- `Reaction` 映射常态反应与身体执行表现，不等于移动速度全项。
- `Control` 映射对自身力量/能量/技巧的精细控制等级。
- `Perception` 映射发现、识别、追踪同级目标和异常的能力。
- `MentalStrength` 映射精神/灵魂对抗与支撑能力。
- `Computation` 映射战斗建模、术式计算、并行处理、学习解析能力。

同一角色不同属性可以跨级。例如：

```text
玻璃大炮：Output N8，Durability N4，Reaction N6。
高速刺客：Output N5，Durability N4，Reaction N8，Perception N7。
术式学者：Output N4，Control N8，Computation N9，MentalStrength N6。
```

综合战力需要以分项属性、能力、词条、抗性、资源、战斗经验共同判断，不能只取属性平均值。

### 3.3 战斗对象评级面板

每个战斗对象都需要建立相同结构的评级面板。

```json
{
  "combatRating": {
    "overall": {
      "rating": "N6 城镇级",
      "score": 5200,
      "basis": "综合常态战斗表现。"
    },
    "offense": {
      "rating": "N7 城市级",
      "score": 9200,
      "basis": "最强常态攻击技能可稳定达到城市级下段。"
    },
    "defense": {
      "rating": "N5 街区级",
      "score": 3100,
      "basis": "肉身与常态防护只能稳定承受街区级攻击。"
    },
    "durability": {
      "rating": "N5 街区级",
      "score": 2800,
      "basis": "常态肉身耐久。"
    },
    "reaction": {
      "rating": "N7 城市级",
      "score": 8700,
      "basis": "可反应并规避城市级速度域内的攻击。"
    },
    "mobility": {
      "rating": "N6 城镇级",
      "score": 6100,
      "basis": "短距离机动与战斗位移。"
    },
    "control": {
      "rating": "N8 区域级",
      "score": 17400,
      "basis": "能力精细控制水平。"
    },
    "perception": {
      "rating": "N6 城镇级",
      "score": 4600,
      "basis": "常态探知与锁定能力。"
    },
    "mental": {
      "rating": "N7 城市级",
      "score": 8100,
      "basis": "精神/灵魂对抗能力。"
    },
    "hax": {
      "rating": "N8 区域级",
      "score": 19000,
      "basis": "特殊机制上限，不等于常态破坏力。"
    }
  }
}
```

建议分项：

```text
overall      综合评级
offense      攻击面评级
defense      防御面评级
durability   肉身耐久评级
reaction     反应评级
mobility     机动评级
control      控制评级
perception   感知评级
mental       精神/灵魂对抗评级
hax          特殊机制/规则能力评级
resistance   抗性评级，可细分为多个标签
resource     资源量/续航评级
```

注意：

- `offense` 可以高于 `overall`，例如玻璃大炮。
- `defense` 可以高于 `offense`，例如重装坦克。
- `hax` 只代表特殊机制有效时的威胁，不代表常规出力。
- `resistance` 必须按词条拆分，例如精神抗性、灵魂抗性、火焰抗性、侵蚀抗性。
- 所有战斗参与者都必须使用同一套面板，避免只详细评估玩家、不评估敌人。

### 3.4 属性解释

#### 出力 Output

角色肉身常态出力，不包含能量、能力、技能、装备、爆发、透支带来的额外输出。

包括：

- 常态肌肉力量。
- 常态身体发力效率。
- 不使用超凡强化时的物理打击基础。
- 不开启特殊形态时的搬运、冲撞、压制等肉身表现。

不包括：

- 能量炮、法术、灵压释放等能量输出。
- 技能倍率造成的爆发输出。
- 装备增幅。
- 临时 Buff。
- 透支身体或燃烧生命获得的输出。

#### 耐久力 Durability

角色肉身常态耐久，不包含护盾、铠甲、能量防护、技能减伤、特殊形态等外部或主动强化。

包括：

- 常态身体防御。
- 常态抗打击能力。
- 常态组织强度。
- 常态伤势承受。
- 常态体力与负荷承受。

不包括：

- 能量护盾。
- 装甲防护。
- 技能减伤。
- 再生能力额外效果。
- 透支状态下的硬抗。

#### 反应力 Reaction

角色肉身与神经系统的常态反应，不包含预知、感知技能、加速能力、时间系能力、装备辅助等加成。

包括：

- 常态神经反应。
- 常态身体执行速度。
- 常态战斗本能。
- 不依赖技能时的即时应对。

不包括：

- 预知未来。
- 时间减速/加速。
- 技能提供的反射增强。
- 装备辅助瞄准。
- 高速思维术式。

#### 控制力 Control

精细操控自身力量、能力、能量和战斗节奏的能力。

包括：

- 能量精密控制。
- 技能稳定性。
- 多线程操作。
- 降低消耗。
- 减少副作用。

#### 感知力 Perception

发现、识别、追踪、预警的能力。

包括：

- 五感强化。
- 能量感知。
- 灵觉。
- 杀意感知。
- 空间/因果/精神异常感知。

#### 精神强度 MentalStrength

用于对抗、承载或支撑精神/灵魂层面的攻击、能力、污染、控制和压力。

包括：

- 抗恐惧。
- 抗精神攻击。
- 对抗灵魂冲击。
- 支撑精神类能力发动。
- 支撑灵魂类能力发动。
- 保持自我。
- 忍耐痛苦。
- 抵抗污染、洗脑、魅惑、幻觉。

不等同于普通智力，也不等同于运算力。

#### 运算力 Computation

理解、计算、建模、快速学习和战斗推演能力。

包括：

- 法术模型计算。
- 战术推演。
- 多目标处理。
- 技术解析。
- 高速学习。

### 3.5 抗性处理

抗性不作为常规属性之一，而由以下来源共同决定：

- 生命等级。
- 身体结构。
- 灵魂结构。
- 能量体系特性。
- 特殊能力。
- 道具。
- 环境加护。
- 训练与经验。

抗性应以标签和等级记录，等级可与词条等级体系共用或映射：

```json
{
  "resistances": [
    {
      "tag": "mental-interference",
      "name": "精神干涉抗性",
      "level": "C",
      "source": "精神强度 + 训练",
      "notes": "对普通催眠和恐惧诱导有效，对高阶概念污染不足。"
    }
  ]
}
```

---

### 3.6 状态加成与变化层

基础属性之外，所有加成和削弱都进入状态层。

```json
{
  "modifiers": [
    {
      "id": "mana-body-enhancement",
      "name": "魔力身体强化",
      "source": "ability",
      "type": "sustained-buff",
      "affectedStats": {
        "output": "+30%",
        "durability": "+20%",
        "reaction": "+15%"
      },
      "cost": "每分钟消耗 5 点魔力",
      "duration": "持续维持",
      "limits": ["魔力不足时自动解除", "控制力不足会造成肌肉撕裂"]
    }
  ]
}
```

状态类型建议：

```text
passive-modifier   被动常驻加成
sustained-buff     持续维持强化
temporary-buff     临时强化
burst              爆发态
overload           透支态
debuff             削弱
injury             伤势
seal               封印
form               形态变化
equipment-bonus    装备加成
environment-bonus  环境加成
```

---

