# 最弱无败神装机龙 精读提炼计划

> 21卷 / 169章
> 状态：⏸ 待开始

---

## Phase 0 — 摸底阅读

**目标**：通读全部169章，输出每章结构化笔记 + 每agent角色清单。

### 执行

21个 agent 并行阅读，每 agent 1 卷（5-11章）。每个 agent 输出两个文件：

1. `sai-p0/sXX-notes.txt` — 每章的结构化笔记，格式：
```
---
CHAPTER: saijaku-muhai-bahamut-main/vol-XX/YY-标题.txt
TITLE: 标题
SUMMARY: 50-150字事件摘要
CHARS: 角色名*(角色类型)|角色名(角色类型)
  * = 首次登场
  角色类型: main/support/cameo/mention
LOCATIONS: 地点1|地点2
EVENTS: 事件名/类型
  (catalyst/setup/conflict/revelation/climax/resolution)
---
```

2. `sai-charlist/sXX-chars.txt` — 纯角色清单（每行一个角色名，无格式无序号）：
```
路克斯
提耶尔法
爱理
...
```

### 校验门禁

校验方式（实时执行，每完成一个 agent 跑一次）：
```
1. 读取 sai-charlist/ 下所有已完成的角色清单文件
2. 去重合并
3. 输出当前唯一角色总数
4. 全部 21 个 agent 完成后：
   a. 总数 ≥ 30？ → 通过，进入 Phase 1
   b. 总数 < 30？ → 不通过
      - 列出已发现角色清单
      - 对比已知该世界应有角色，识别缺失
      - 定位缺失角色所在的卷
      - 为该卷单独启动补读 agent（1卷/agent）
      - 重新校验
   c. 如果某 agent 失败（timeout/terminated）：
      - 该 agent 的卷拆为更小 batch（每batch 1-3章）重试
```

### Agent 分配

| Agent | 范围 | 章数 | 状态 | 角色数 |
|-------|------|------|------|--------|
| s01 | vol-01 | 10 | ⏸ | — |
| s02 | vol-02 | 8 | ⏸ | — |
| s03 | vol-03 | 8 | ⏸ | — |
| s04 | vol-04 | 8 | ⏸ | — |
| s05 | vol-05 | 5 | ⏸ | — |
| s06 | vol-06 | 10 | ⏸ | — |
| s07 | vol-07 | 9 | ⏸ | — |
| s08 | vol-08 | 8 | ⏸ | — |
| s09 | vol-09 | 8 | ⏸ | — |
| s10 | vol-10 | 11 | ⏸ | — |
| s11 | vol-11 | 8 | ⏸ | — |
| s12 | vol-12 | 8 | ⏸ | — |
| s13 | vol-13 | 9 | ⏸ | — |
| s14 | vol-14 | 7 | ⏸ | — |
| s15 | vol-15 | 7 | ⏸ | — |
| s16 | vol-16 | 9 | ⏸ | — |
| s17 | vol-17 | 8 | ⏸ | — |
| s18 | vol-18 | 8 | ⏸ | — |
| s19 | vol-19 | 7 | ⏸ | — |
| s20 | vol-20 | 7 | ⏸ | — |
| s21 | vol-21 | 10 | ⏸ | — |

---

## Phase 1 — 角色全息档案

**目标**：为 Phase 0 发现的每一个角色建立全息档案。

### 执行

每角色一个独立 agent。从 raw-text 中读取该角色出现的章节，输出全息档案。

输出格式（严格按照 KEY: VALUE 格式，每个角色用 `=====CHARACTER=====` 分隔）：
```
=====CHARACTER=====
ID: lux
NAME: 路克斯·阿卡迪亚
ALIASES: 黑色英雄|最弱无败
GENDER: male
APPEARANCE_SUMMARY: 银发灰瞳少年
APPEARANCE_HAIR: 银色
APPEARANCE_EYES: 灰色
APPEARANCE_HEIGHT: 中等
APPEARANCE_BUILD: 修长但不虚弱
APPEARANCE_ATTIRE_DEFAULT: 学园制服
APPEARANCE_ATTIRE_COMBAT: 机龙骑士装甲
APPEARANCE_SOURCEREF: vol-01/ch-01
PERSONALITY_TRAITS: 温柔|坚韧|为他人着想
PERSONALITY_VALUES: 保护同伴|不放弃任何人
PERSONALITY_STRENGTHS: 机龙战术天才
PERSONALITY_FLAWS: 过度自我牺牲
PERSONALITY_CONFLICT: 作为前帝国皇子的身份与现在的信念
PERSONALITY_SOURCEREF: vol-01
VOICE_SELF: 僕
VOICE_TONE: 温和但坚定
VOICE_CATCHPHRASES: 我不会放弃
VOICE_SOURCEREF: vol-01
HABITS_MANNERISMS: 战斗前闭上眼睛深呼吸
HABITS_COMBAT: 先观察后行动
HABITS_SOURCEREF: vol-01
BACKGROUND_BIRTH: 阿卡迪亚帝国
BACKGROUND_FAMILY: 爱理（妹）
BACKGROUND_FORMATIVE: 帝国覆灭|与机龙的契约
BACKGROUND_SOURCEREF: vol-01
ABILITIES_01_NAME: 机龙·巴哈姆特
ABILITIES_01_TYPE: 神装机龙
ABILITIES_01_DESC: 古代遗产的机龙，拥有最强之力
ABILITIES_01_FEATS: 击败帝国骑士团|vol-01
ABILITIES_01_SOURCEREF: vol-01
VERSIONS_01_LABEL: 入学前
VERSIONS_01_TIMEFRAME: vol-01之前
VERSIONS_01_POWER: 未觉醒
VERSIONS_01_SOURCEREF: vol-01
RELATION_01_WITH: airi
RELATION_01_TYPE: 兄妹
RELATION_01_SOURCEREF: vol-01
NOTES:
```

**重要规则**（必须遵守）：
- 每项必须有原文 sourceRef（vol-XX/ch-YY）
- 原文中找不到证据的字段填 `NO_EVIDENCE`
- 首次登场的章节、关键剧情转折点必须标注
- 能力的战绩必须标注对手和章节
- 关系变化必须跟随时间轴版本

### 校验门禁

```
校验方式：统计 characters-index.json 中的角色数量
通过条件：角色数 == Phase 0 发现总数

不通过处理：
  1. Phase 1 角色数 < Phase 0 总数
  2. 对比差异 → 哪些角色没有 profile 文件
  3. 为缺失角色单独启动 agent 补跑
  4. 重新校验
```

---

## Phase 2 — 事件链路

**目标**：构建全部169章的事件因果链。

### 执行

每agent ≤10章，输出事件节点和因果边。

输出格式：
```
---EVENT---
ID: saijaku-volXX-chYY-eN
TITLE: 事件标题
CHAPTER: vol-XX/ch-YY
TYPE: catalyst/conflict/climax/resolution/revelation/setup/payoff/turning-point
SUMMARY: 100-200字事件描述（谁+做了什么+结果）
CAUSES: 前置事件ID|因果类型(direct-causation/chain/background/setup)|确定性(confirmed/likely/suspected)
CONSEQUENCES: 后续事件ID|类型(direct/chain/delayed)|描述
PARTICIPANTS: 角色ID|角色类型(protagonist/antagonist/initiator/victim)|事件前状态|事件后状态
RELCHANGE: 角色A|角色B|旧关系|新关系
SIGNIFICANCE: 该事件在整部作品中的作用
---
```

规则：
- 每章至少2个事件
- 跨卷因果必须标注（如vol-01的事件导致vol-05的事件）
- 因果关系不确定时标注 suspected

### 校验门禁

```
校验方式：统计 event-chains.json 中的事件总数 + 检查因果关系
通过条件：
  1. 事件数 ≥ 169 × 1.5 = 254
  2. 每章至少2个事件（抽样10%检查）
  3. 至少有跨卷因果边

不通过处理：
  1. 事件数不足 → 识别事件缺失的卷段
  2. 拆更小 batch（每batch ≤5章）重跑
  3. 重新校验
```

---

## Phase 3 — 时间轴

**目标**：构建按时间排序的事件索引，每章一条。

### 执行

每agent ≤10章。

输出格式：
```
---TIMELINE---
ID: tl-saijaku-volXX
CHAPTER: vol-XX/ch-YY
TITLE: 章节标题
SUMMARY: 100-200字
EVENTS: 包含的事件ID（逗号分隔）
CHARS: 角色ID|进入本章时状态|离开本章时状态
SIG: 本章在整部作品中的作用
---
```

### 校验门禁

```
校验方式：统计 timeline.json 条目数
通过条件：条目数 == 169（每章1条）

不通过处理：
  1. 缺失哪些章节 → 定位
  2. 拆小batch补跑
```

---

## Phase 4 — 世界观提取

**目标**：提取力量体系、势力、地理、历史、物品、文化。

### 执行

每agent 5-8卷。

输出格式：
```
---POWERSYSTEM---
ID: 
NAME: 
TYPE: magic/technology/authority/innate
PRINCIPLE: 核心原理
ENERGY: 能量来源
USERS: 使用者条件
LIMITS: 限制
SOURCE: vol-XX/ch-YY
---
---FACTION---
ID: 
NAME: 
TYPE: organization/nation/school/family
SUMMARY: 描述
LEADER: 
KNOWN_MEMBERS: 
SOURCE: 
---
---LOCATION---
ID: 
NAME: 
TYPE: country/city/landmark/school/ruin
DESCRIPTION: 
SOURCE: 
---
---ERA---
ID: 
NAME: 
SUMMARY: 
SOURCE: 
---
---ARTIFACT---
ID: 
NAME: 
TYPE: weapon/treasure/artifact
DESCRIPTION: 
HOLDER: 
SOURCE: 
---
---CULTURE---
TOPIC: 
SUMMARY: 
SOURCE: 
---
```

### 校验门禁

```
通过条件：
  1. power-systems.json 中力量体系 ≥ 5 条
  2. 地点 ≥ 5 个
  3. 势力 ≥ 3 个
  4. 以上每项必须有 sourceRef

不通过处理：补跑对应卷段的 agent
```

---

## Phase 5 — 文风提取

**目标**：撰写 style-constraints.md

### 执行

1 agent 阅读全部原文，产出 style-constraints.md。

必须覆盖8个维度：
1. 叙事基调（视角/节奏/情感基调，应有原文段落佐证）
2. 专属术语规范（机龙、神装机龙、骑士等专有名词用法）
3. 禁词替换表（容易串味的通用玄幻词 → 本世界正确用词）
4. 战斗描写约束（机龙战的描写规则、视角切换）
5. 对话格式与角色语气画像（每个主角的说话特征）
6. 不良模式（该世界RP中容易被写崩的表达）
7. 文风复现示例（3-8段代表性原文，含开篇/战斗/日常各至少1段）

### 校验门禁

```
通过条件：
  1. 文件存在
  2. ≥100行
  3. 覆盖至少6个维度
  4. 至少3段原文示例

不通过处理：重新生成，补充缺失维度
```

---

## Phase 6 — 图谱构建

**目标**：从已有数据脚本生成全部图谱。

### 执行

使用脚本从 characters-index.json / event-chains.json / timeline.json 生成：

| 文件 | 数据来源 | 内容 |
|------|---------|------|
| knowledge-graph.json | 角色 + 能力 + 世界设定 | 节点(角色+概念) 边(has-ability, belongs-to) |
| relationship-graph.json | 角色关系数据 | 节点(角色) 边(关系类型+七维评估) |
| plot-graph.json | timeline + event | 节点(角色+章节) 边(appears-in) |
| location-graph.json | 世界观位置数据 | 节点(地点) |
| battle-log.json | 事件中提取的战斗 | 战斗记录 |

### 校验门禁

```
通过条件（全部5个文件）：
  1. KG: 节点 ≥ 角色数, 边 ≥ 节点数
  2. RG: 节点 ≥ 角色数, 边 ≥ 角色数×2
  3. PG: 有章节节点和 appears-in 边
  4. LG: 有地点节点
  5. BL: ≥ 5 场战斗记录

不通过处理：脚本修复数据源后重新生成
```

---

## Phase 7 — 索引与校验

**目标**：建立反向索引，运行完整性检查。

### 执行

脚本生成：

| 文件 | 内容 |
|------|------|
| indices/byCharacter.json | 角色→能力/关系 反向索引 |
| indices/byEvent.json | 事件→参与者 反向索引 |
| indices/byLocation.json | 地点→事件/角色 反向索引 |
| indices/byAbility.json | 能力→使用者 反向索引 |
| indices/byChapter.json | 章节→角色/事件 反向索引 |
| validation/completeness-report.json | 完整性报告 |

### 校验门禁

```
通过条件（完整性报告）：
  1. 所有 JSON 可解析
  2. 角色关系边两端都存在有效角色ID
  3. 事件参与者都是有效角色ID
  4. 所有文件和索引生成成功
  5. allClear == true

不通过处理：
  1. 列出所有断裂引用
  2. 修复数据源后重新生成
  3. 重新校验直到 allClear
```

---

## Phase 7.5 — 清理

```bash
# 删除旧脚本文件
rm -f curated/original-*.json curated/original-*.md
rm -f curated/proposed-*.json curated/proposed-*.md
rm -f curated/*.bak
rm -rf curated/stories/

# 删除工作目录（此plan对应的临时文件）
rm -rf sai-p0/ sai-charlist/
```