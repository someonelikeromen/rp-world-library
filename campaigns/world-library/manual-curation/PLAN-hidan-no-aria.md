# 绯弹的亚里亚 精读提炼计划

> 45卷正传 + 4卷AA外传
> 状态：⏸ 待开始

---

## Phase 0 — 摸底阅读

**目标**：通读全部49卷（45正传+4AA），输出每卷结构化笔记 + 每agent角色清单。

### 执行

每agent 2卷（因每卷是单个full.txt，2卷数据量≈10章）。每个 agent 输出两个文件：

1. `hidan-p0/hXX-notes.txt` — 每卷结构化笔记：
```
---
VOLUME: hidan-no-aria-main/vol-XX
TITLE: 第X卷 标题
SUMMARY: 200-400字事件摘要（每卷多个章节的综合）
CHARS: 角色名*(角色类型)|角色名(角色类型)
  * = 首次登场, 类型: main/support/cameo/mention
LOCATIONS: 地点1|地点2
TERMS: 术语1|术语2
EVENTS: 事件/类型(catalyst/setup/conflict/revelation/climax/resolution)
---
```

2. `hidan-charlist/hXX-chars.txt` — 纯角色清单：
```
远山金次
神崎·H·亚莉亚
...
```

### 校验门禁

```
汇总所有角色清单 → 去重 → 总数 ≥ 60？
通过 → Phase 1
不通过 → 列出已发现角色 → 对比缺失 → 拆1卷/agent补读
agent失败 → 拆1卷/agent重试
```

### Agent 分配

| Agent | 范围 | 状态 | 角色数 |
|-------|------|------|--------|
| h01 | vol-01~02 | ⏸ | — |
| h02 | vol-03~04 | ⏸ | — |
| h03 | vol-05~06 | ⏸ | — |
| h04 | vol-07~08 | ⏸ | — |
| h05 | vol-09~10 | ⏸ | — |
| h06 | vol-11~12 | ⏸ | — |
| h07 | vol-13~14 | ⏸ | — |
| h08 | vol-15~16 | ⏸ | — |
| h09 | vol-17~18 | ⏸ | — |
| h10 | vol-19~20 | ⏸ | — |
| h11 | vol-21~22 | ⏸ | — |
| h12 | vol-23~24 | ⏸ | — |
| h13 | vol-25~26 | ⏸ | — |
| h14 | vol-27~28 | ⏸ | — |
| h15 | vol-29~30 | ⏸ | — |
| h16 | vol-31~32 | ⏸ | — |
| h17 | vol-33~34 | ⏸ | — |
| h18 | vol-35~36 | ⏸ | — |
| h19 | vol-37~38 | ⏸ | — |
| h20 | vol-39~40 | ⏸ | — |
| h21 | vol-41~42 | ⏸ | — |
| h22 | vol-43~44 | ⏸ | — |
| h23 | vol-45 | ⏸ | — |
| h24 | AA vol-01~02 | ⏸ | — |
| h25 | AA vol-03~04 | ⏸ | — |

---

## Phase 1 — 角色全息档案

**目标**：为 Phase 0 发现的每一个角色建立全息档案。每角色1 agent。

### 输出格式

同 saijaku PLAN 的 Phase 1 格式：
```
=====CHARACTER=====
ID: kintarou
NAME: 远山金次
ALIASES: 金次|爆发模式
GENDER: male
APPEARANCE_SUMMARY: 黑色短发，武侦高中2年A班
APPEARANCE_SOURCEREF: vol-01
...（全部字段同 saijaku PLAN）
```

**规则**：
- 每项有原文 sourceRef
- 原文找不到填 NO_EVIDENCE
- 能力的战绩标注对手和章节
- 关系变化跟随时间轴版本

### 校验门禁

```
通过条件：角色数 == Phase 0 发现总数
不通过 → 为缺失角色补跑 agent
```

---

## Phase 2 — 事件链路

**目标**：全部49卷的事件因果链。每agent 2卷。

### 输出格式

```
---EVENT---
ID: aria-volXX-chYY-eN
TITLE: 
CHAPTER: vol-XX
TYPE: catalyst/conflict/climax/resolution/revelation/setup/payoff/turning-point
SUMMARY: 100-200字
CAUSES: 前置|类型|确定性
CONSEQUENCES: 后续|类型
PARTICIPANTS: 角色ID|角色|前状态|后状态
RELCHANGE: 角色A|角色B|旧关系|新关系
SIGNIFICANCE: 
---
```

### 校验门禁

```
事件数 ≥ 卷数×2 = 98
每卷≥2事件
不通过 → 拆1卷/agent重跑
```

---

## Phase 3 — 时间轴

每卷一条时间轴条目。

### 校验门禁

```
条目数 == 49卷
不通过 → 定位缺失卷 → 补跑
```

---

## Phase 4 — 世界观提取

### 校验门禁

```
力量体系≥5 | 地点≥5 | 势力≥3 | 每项有sourceRef
```

---

## Phase 5 — 文风

### 校验门禁

```
style-constraints.md ≥100行 ≥6维度 ≥3段原文
```

---

## Phase 6 — 图谱

### 校验门禁

| 文件 | 门禁 |
|------|------|
| knowledge-graph.json | 节点≥角色数, 边≥节点数 |
| relationship-graph.json | 边≥角色数×2 |
| plot-graph.json | 非空 |
| location-graph.json | 非空 |
| battle-log.json | ≥10场战斗 |

---

## Phase 7 — 索引与校验

### 校验门禁

```
allClear == true
不通过 → 修复 → 重新生成
```

---

## Phase 7.5 — 清理

```bash
rm -f curated/original-* curated/proposed-* curated/*.bak stories/
rm -rf hidan-p0/ hidan-charlist/
```