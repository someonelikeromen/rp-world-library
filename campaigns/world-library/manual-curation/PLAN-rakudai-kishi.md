# 落第骑士英雄谭 精读提炼计划

> 22卷 / 130章
> 状态：⏸ 待开始

---

## Phase 0 — 摸底阅读

**目标**：通读全部130章，输出每章结构化笔记 + 每agent角色清单。

### 执行

每agent ≤10章。每个 agent 输出两个文件：

1. `raku-p0/rXX-notes.txt` — 每章结构化笔记：
```
---
CHAPTER: rakudai-kishi-main/vol-XX/YY-标题.txt
TITLE: 
SUMMARY: 50-150字事件摘要
CHARS: 角色名*(角色类型)|角色名(角色类型)
  * = 首次登场, 类型: main/support/cameo/mention
LOCATIONS: 地点1|地点2
EVENTS: 事件名/类型(catalyst/setup/conflict/revelation/climax/resolution)
---
```

2. `raku-charlist/rXX-chars.txt` — 纯角色清单（每行一个角色名）：
```
黑铁一辉
史黛菈·法米利昂
...
```

### 校验门禁

```
校验方式：汇总所有角色清单 → 去重计数
通过条件：总数 ≥ 40
不通过 → 列出已发现角色 → 对比该世界应有哪些角色 → 定位缺失卷 → 补读
agent失败 → 拆更小batch（≤5章）重试
```

### Agent 分配

| Agent | 范围 | 章数 | 状态 | 角色数 |
|-------|------|------|------|--------|
| r01 | vol-01 全部 | 7 | ⏸ | — |
| r02 | vol-02 全部 | 7 | ⏸ | — |
| r03 | vol-03 全部 | 7 | ⏸ | — |
| r04 | vol-04 全部 + vol-05 第1~3章 | 5 | ⏸ | — |
| r05 | vol-05 第4~7章 + vol-06 第1~3章 | 7 | ⏸ | — |
| r06 | vol-06 第4~7章 + vol-07 第1~2章 | 6 | ⏸ | — |
| r07 | vol-07 第3~6章 + vol-08 第1~4章 | 8 | ⏸ | — |
| r08 | vol-08 第5~8章 + vol-09 第1~2章 | 6 | ⏸ | — |
| r09 | vol-09 第3~6章 + vol-10 第1~2章 | 6 | ⏸ | — |
| r10 | vol-10 第3~6章 + vol-11 全部 | 8 | ⏸ | — |
| r11 | vol-12 全部 + vol-13 第1~2章 | 8 | ⏸ | — |
| r12 | vol-13 第3~6章 + vol-14 第1~4章 | 8 | ⏸ | — |
| r13 | vol-14 第5~7章 + vol-15 全部 | 10 | ⏸ | — |
| r14 | vol-16 全部 + vol-17 第1~4章 | 9 | ⏸ | — |
| r15 | vol-17 第5~7章 + vol-18 全部 + vol-19 第1章 | 10 | ⏸ | — |
| r16 | vol-19 第2~7章 + vol-20 全部 | 11 | ⏸ | — |
| r17 | vol-21 全部 | 7 | ⏸ | — |

---

## Phase 1 — 角色全息档案

**目标**：为 Phase 0 发现的每一个角色建立全息档案。每角色一个独立 agent。

### 输出格式

```
=====CHARACTER=====
ID: ikki
NAME: 黑铁一辉
ALIASES: 落第骑士|无冠剑士
GENDER: male
APPEARANCE_SUMMARY: 黑色短发，精悍体格，眼神锐利
APPEARANCE_HAIR: 黑色短发
APPEARANCE_EYES: 黑色
APPEARANCE_HEIGHT: 中等
APPEARANCE_BUILD: 精悍
APPEARANCE_FEATURES: 全身多处训练伤痕
APPEARANCE_ATTIRE_DEFAULT: 破军学园制服
APPEARANCE_ATTIRE_COMBAT: 无灵装（仅阴铁剑）
APPEARANCE_SOURCEREF: vol-01/ch-01

PERSONALITY_TRAITS: 努力家|坚韧不拔|对同伴温柔
PERSONALITY_VALUES: 力量是为了保护他人
PERSONALITY_STRENGTHS: 极致的努力与钻研|模仿剑术
PERSONALITY_FLAWS: 过度勉强自己|魔力F级
PERSONALITY_CONFLICT: 最弱的F级骑士却想成为最强
PERSONALITY_SOURCEREF: vol-01

VOICE_SELF: 俺
VOICE_TONE: 沉稳但热血
VOICE_CATCHPHRASES: 我绝对不会放弃
VOICE_EXAMPLES: scene=初遇史黛菈|line=……|source=vol-01/ch-01
VOICE_SOURCEREF: vol-01

HABITS_MANNERISMS: 紧张时会握住阴铁
HABITS_COMBAT: 先用〈模仿剑术〉观察对手
HABITS_QUIRKS: 晨跑是每日必修
HABITS_SOURCEREF: vol-01

BACKGROUND_BIRTH: 黑铁家（伐刀者名门）
BACKGROUND_FAMILY: 黑铁王马（兄）
BACKGROUND_EDUCATION: 破军学园
BACKGROUND_FORMATIVE: 因魔力F级被家族放逐
BACKGROUND_SOURCEREF: vol-01

ABILITIES_01_NAME: 一刀修罗
ABILITIES_01_TYPE: 伐刀绝技
ABILITIES_01_DESC: 将一分钟压缩为一秒的极致加速
ABILITIES_01_ACTIVATION: 限制时间内爆发
ABILITIES_01_LIMITS: 使用后全身剧痛
ABILITIES_01_FEATS: 击败诸星雄大|七星剑武祭|vol-05
ABILITIES_01_SOURCEREF: vol-02

ABILITIES_02_NAME: 模仿剑术
ABILITIES_02_TYPE: 技能
ABILITIES_02_DESC: 看穿并复制对手剑术
ABILITIES_02_SOURCEREF: vol-01

ABILITIES_03_NAME: 七秘剑
ABILITIES_03_TYPE: 剑术奥义
ABILITIES_03_DESC: 包含犀击/雷光/蜃气狼等
ABILITIES_03_SOURCEREF: vol-03

VERSIONS_01_LABEL: 入学前
VERSIONS_01_TIMEFRAME: vol-01之前
VERSIONS_01_POWER: F级骑士，无伐刀绝技
VERSIONS_01_MENTAL: 被家族抛弃但仍不放弃
VERSIONS_01_SOURCEREF: vol-01

VERSIONS_02_LABEL: 七星剑武祭
VERSIONS_02_TIMEFRAME: vol-01~07
VERSIONS_02_POWER: 掌握一刀修罗
VERSIONS_02_MENTAL: 从落第到最强的蜕变
VERSIONS_02_SOURCEREF: vol-01~07

RELATION_01_WITH: stella
RELATION_01_TYPE: 恋人/室友
RELATION_01_DESC: 从初次相遇的半裸事件到月下誓言
RELATION_01_SOURCEREF: vol-01/ch-01

RELATION_02_WITH: shizuku
RELATION_02_TYPE: 兄妹
RELATION_02_DESC: 没有血缘关系的妹妹，深爱一辉
RELATION_02_SOURCEREF: vol-01

NOTES: 魔力F级但从未放弃的落第骑士
```

**规则**：
- 每项必须有原文 sourceRef
- 原文找不到填 NO_EVIDENCE
- 能力的 feats 必须标注对手和章节
- 关系变化跟随时间轴版本

### 校验门禁

```
通过条件：角色数 == Phase 0 发现总数
不通过 → 对比差异 → 为缺失角色补跑 agent
```

---

## Phase 2 — 事件链路

**目标**：构建全部130章的事件因果链。每agent ≤10章。

### 输出格式

```
---EVENT---
ID: raku-volXX-chYY-eN
TITLE: 
CHAPTER: vol-XX/ch-YY
TYPE: catalyst/conflict/climax/resolution/revelation/setup/payoff/turning-point
SUMMARY: 100-200字
CAUSES: 前置事件ID|因果类型|确定性
CONSEQUENCES: 后续事件ID|类型
PARTICIPANTS: 角色ID|角色类型|事件前状态|事件后状态
RELCHANGE: 角色A|角色B|旧关系|新关系
SIGNIFICANCE: 
---
```

规则：每章≥2事件；跨卷因果必须标注；不确定标注 suspected。

### 校验门禁

```
通过条件：
  1. 事件数 ≥ 130 × 1.5 = 195
  2. 每章≥2事件（抽样10%）
  3. 有跨卷因果边
不通过 → 识别缺失卷段 → 拆≤5章重跑
```

---

## Phase 3 — 时间轴

**目标**：每章一条时间轴条目。

### 输出格式

```
---TIMELINE---
ID: tl-raku-volXX-chYY
CHAPTER: vol-XX/ch-YY
TITLE: 
SUMMARY: 100-200字
EVENTS: 事件ID
CHARS: 角色ID|进入状态|离开状态
SIG: 
---
```

### 校验门禁

```
通过条件：条目数 == 130
不通过 → 定位缺失章节 → 补跑
```

---

## Phase 4 — 世界观提取

输出格式：
```
---POWERSYSTEM---
ID: 
NAME: 
TYPE: magic/technology/authority/innate
PRINCIPLE: 
ENERGY: 
USERS: 
LIMITS: 
SOURCE: 
---
---FACTION---/---LOCATION---/---ERA---/---ARTIFACT---/---CULTURE---
（同 saijaku PLAN 格式）
```

### 校验门禁

```
通过条件：
  1. 力量体系 ≥ 5
  2. 地点 ≥ 5
  3. 势力 ≥ 3
  4. 每项有 sourceRef
```

---

## Phase 5 — 文风提取

style-constraints.md 必须覆盖8维度：叙事基调/专属术语/禁词/战斗描写/对话格式/角色语气/不良模式/原文示例。

### 校验门禁

```
通过条件：文件存在 ≥100行 ≥6维度 ≥3段原文示例
```

---

## Phase 6 — 图谱构建

脚本生成5个文件：knowledge-graph / relationship-graph / plot-graph / location-graph / battle-log

### 校验门禁

```
KG: 节点≥角色数, 边≥节点数
RG: 边≥角色数×2
PG: 非空
LG: 非空
BL: ≥5场战斗
```

---

## Phase 7 — 索引与校验

脚本生成5个索引 + completeness-report.json。

### 校验门禁

```
allClear == true
不通过 → 修复断裂引用 → 重新生成
```

---

## Phase 7.5 — 清理

```bash
rm -f curated/original-* curated/proposed-* curated/*.bak stories/
rm -rf raku-p0/ raku-charlist/
```