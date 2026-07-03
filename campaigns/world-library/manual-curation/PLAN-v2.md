# 世界观精读提炼计划 v2 — 完全还原体系

> **核心目标**：做到**仅凭 curated 数据就能完整还原原著的任何场景、任何角色、任何事件，不需要回读原文**。
>
> **前置条件**：已确认 5 个世界（弑神者/地错/落第骑士/最弱无败/绯弹的亚里亚）全部拥有完整的 raw-text 小说原文（合计 1267 章节文件）和 worldbook 结构化数据。现有脚本产出的所有 curated 文件全部重写。
>
> **执行策略**：复杂度与轮次不做任何限制，不做任何质量 vs 速度的妥协。所有不确定性标记为 `unverified`，不补全、不猜测。
>
> **每一轮 agent_team 的输出必须经过校验才能进入下一阶段**。未通过的门禁条目不跳过，必须修复。

---

## 第一章：执行原则

1. **source-backed 无条件优先** — 每一条数据必须有 raw-text 原文命中证据。禁止凭常识/百科/wiki 补全。count=0 的条目删除并记入 missing-list。count>0 但仅有1次的条目标注 `evidenceLevel: C`。

2. **先读原文，后建结构** — agent 必须阅读原文章节全文后再产出结构化知识。脚本（`tools/` 下所有 .js 文件）**只能做格式校验、归档、索引构建**，不能做任何内容提炼。任何 agent 的输出中出现「脚本可自动完成」的原文注入，视为违反原则。

3. **完全还原原则** — 每条数据的设计标准是：读完后不需要再看原文，即能准确理解该世界的任何角色动机、事件因果、关系演变、世界规则。无法满足这一标准的条目必须标注 `confidence: low` 并说明为什么。

4. **所有字段必须标注证据等级**：
   - `S` — 原文明确说明（直接引用）
   - `A` — 原文强暗示（跨段落归纳确认）
   - `B` — 跨章归纳（多个章节共同证明）
   - `C` — 推测/待验证（无法在原文直接找到证据，但上下文合理）
   - `D` — 需删除（凭感觉/百科补全的，无原文支持）
   
   拒绝无证据等级的条目。每条 `sourceRef` 必须精确到 `vol-XX/ch-YY`。

5. **六闭环验证是强制流程** — world / character / event-chain / timeline / KG / relationship 六者之间必须互相验证。任何一项的数据变更后，必须同步检查其余五项是否存在引用断裂。断裂引用在修复前不得进入下一阶段。

6. **不做批次限制** — 不以「轮次上限」「agent 数量限制」「时间预算」为由裁剪数据深度。100个角色就跑100个角色，缺一章的因果链就跑一章，直至完整。

7. **所有未确定信息明确标注** — agent 在阅读中遇到的任何无法确认的细节（名字写法不一致、时间线矛盾、能力效果模糊），必须记入 `curation-notes.md` 而非自行脑补。

---

## 第二章：完整数据模型定义

以下所有 JSON 模板定义了**每个世界必须达到的数据完整度**。序列中的每一个字段都是必填，除非标注 `// optional`。

---

### 2.1 world.json — 世界观索引与概要

> `world.json` 的角色是**枢纽索引 + 顶级概览**。它不存储深度细节——深度细节在各自的专有文件中（characters-index.json / event-chains.json / location-graph.json 等）。
>
> 它的作用是：读这一个文件，就知道这个世界的全貌轮廓，以及到哪里去找详细信息。

```json
{
  "schema": "rp-world-v2",
  "worldId": "",
  "worldName": { "zh": "", "en": "", "jp": "" },
  "aliases": [],
  "genre": [],
  "summary": "500-1500字总结。读完即可理解这个世界的本质、核心冲突、叙事情调。",

  // ═════════ 索引：指向所有 curated 文件 ═════════
  "index": {
    "characters": { "file": "characters-index.json", "count": 0 },
    "events": { "file": "event-chains.json", "count": 0, "chains": 0 },
    "timeline": { "file": "timeline.json", "entries": 0 },
    "knowledgeGraph": { "file": "knowledge-graph.json", "nodes": 0, "edges": 0 },
    "relationshipGraph": { "file": "relationship-graph.json", "nodes": 0, "edges": 0 },
    "locationGraph": { "file": "location-graph.json", "nodes": 0, "edges": 0 },
    "battleLog": { "file": "battle-log.json", "count": 0 },
    "styleGuide": { "file": "style-constraints.md" },
    "stories": { "dir": "stories/", "files": [] },
    "indices": { "dir": "indices/", "files": [] },
    "worldRules": { "dir": "world-rules/", "files": [] }
  },

  // ═════════ 原文覆盖情况 ═════════
  "sourceCoverage": {
    "totalVolumes": 0,
    "totalChapters": 0,
    "coverage": "full / partial / partial-lacunae",
    "missingParts": []
  },

  // ═════════ 顶级世界观信息（深度内容 -> 各自文件） ═════════
  "worldOverview": {
    "nature": "世界的本质（如：型月=多种平行世界交织的泛人类史）",
    "coreConflict": "世界的核心矛盾（一句话）",
    "atmosphere": "世界氛围（一句话）"
  },

  "powerSystems": [  // ★ 仅概要。细节 -> knowledge-graph nodes
    {
      "id": "", "name": "",
      "summary": "一句话说明",
      "type": "magic / supernatural / technology / innate",
      "levelCount": 0,
      "kgNodeRef": ""
    }
  ],

  "factions": [  // ★ 仅概要。细节 -> knowledge-graph nodes + relationship-graph
    {
      "id": "", "name": "", "aliases": [],
      "type": "nation / religion / organization / family / secret-society / school / guild",
      "summary": "一句话",
      "leader": "", "headquarters": "",
      "kgNodeRef": ""
    }
  ],

  "geography": {  // ★ 仅概要。细节 -> location-graph nodes
    "worldStructure": "星球/平面/多层/异空间",
    "regionCount": 0,
    "keyRegions": [
      { "id": "", "name": "", "type": "", "summary": "", "locationNodeRef": "" }
    ]
  },

  "historyEras": [  // ★ 仅概要。细节 -> event-chains.json arcs + timeline
    { "id": "", "name": "", "summary": "", "startEvent": "", "endEvent": "", "isPresent": false }
  ],

  "storyArcs": [  // ★ 故事弧概要。细节 -> event-chains arcs
    { "id": "", "name": "", "volumes": "", "summary": "" }
  ],

  "keyArtifacts": [  // ★ 仅概要。细节 -> knowledge-graph nodes
    {
      "id": "", "name": "", "type": "",
      "summary": "一句话",
      "kgNodeRef": ""
    }
  ],

  // ═════════ 原始材料来源 ═════════
  "sourceRegistry": {
    "file": "source-registry.json",
    "summary": ""
  },

  // ═════════ 已知冲突与待解决问题 ═════════
  "knownIssues": [
    { "issue": "", "severity": "high / medium / low", "status": "unresolved / partial / resolved" }
  ],

  "extensions": {}
}
```

> ⚠️ 注意：上面所有 `// ★ 仅概要` 的字段，只是指向详细文件的指针。**实体数据不在 world.json 中展开**。
>
> 例如：factions 的详细成员列表、历史、秘密 → 存在 knowledge-graph 中。powerSystems 的完整机制 → knowledge-graph 节点 + world-rules/。
>
> **任何字段都可以扩展添加，但不能删除**。如果后续发现某条概要不够用，直接加字段。但不允许删减现有字段结构。

---

### 2.2 characters-index.json — 角色全息档案

> 这是整个体系中**数据量最大**的部分。每个角色可能占据数千字的结构化数据。不做任何压缩或裁剪。

```json
{
  "schema": "rp-characters-v2",
  "worldId": "",
  "generatedAt": "",
  "totalCharacters": 0,

  "characters": [{
    // ═════════ 基本身份 ═════════
    "id": "",
    "name": { "canonical": "", "original": "" },  // canonical=项目用名, original=原著名(含日文)
    "aliases": [], "titles": [],
    "gender": "", "age": { "atIntroduction": "", "byEnd": "", "born": "" },
    "species": "", "nationality": "",
    "occupation": "", "affiliation": "", "status": "alive / deceased / unknown",

    // ═════════ 外表（从原文精确提取） ═════════
    "appearance": {
      "overview": "第一印象的叙事级描写",
      "physical": {
        "height": "", "build": "",
        "hair": { "color": "", "style": "", "texture": "", "length": "" },
        "eyes": { "color": "", "shape": "", "gaze": "" },
        "skin": "", "distinctive": []
      },
      "attire": {
        "default": "",
        "formal": "",
        "combat": "",
        "variations": [{ "version": "", "description": "", "sourceRef": "" }]
      },
      "combatForm": {  // optional: 仅限有战斗形态变化的角色
        "description": "",
        "visualChanges": [],
        "activationTrigger": "",
        "duration": "",
        "sourceRef": ""
      },
      "voiceQuality": { "tone": "", "pitch": "", "impression": "", "catchphrases": [] },
      "changesOverTime": [{ "atPhase": "", "change": "", "sourceRef": "" }],
      "sourceRefs": []
    },

    // ═════════ 性格（原文行为/对话佐证） ═════════
    "personality": {
      "summary": "300-500字性格概述，可作为 RP 角色人设直接使用",
      "coreTraits": [
        { "trait": "", "manifestation": "原文中的具体表现", "sourceRef": "" }
      ],
      "values": [
        { "value": "", "priority": "high / medium / low", "sourceRef": "" }
      ],
      "moralCode": "行为底线/准则",
      "fears": [{ "fear": "", "origin": "", "sourceRef": "" }],
      "desires": [{ "desire": "", "intensity": "strong / moderate / latent", "sourceRef": "" }],
      "strengths": [{ "strength": "", "example": "", "sourceRef": "" }],
      "flaws": [{ "flaw": "", "example": "", "sourceRef": "" }],
      "innerConflict": "角色内心最深处的矛盾",
      "decisionPattern": {
        "defaultMode": "常规状态下的决策方式",
        "underPressure": "压力下的决策变化",
        "breakingPoint": "什么情况下会突破底线"
      },
      "psychologicalProfile": {
        "defenseMechanisms": [],
        "copingStrategies": [],
        "emotionalTriggers": []
      },
      "sourceRefs": []
    },

    // ═════════ 语气与说话方式（从对话原文精确提取） ═════════
    "voice": {
      "selfReference": "",  // 自称
      "addressPattern": { "toSuperiors": "", "toPeers": "", "toInferiors": "", "toLovers": "" },
      "honorifics": "敬语使用情况",
      "register": {
        "default": { "speed": "", "volume": "", "tone": "" },
        "angry": "",
        "intimate": "",
        "formal": ""
      },
      "catchphrases": [{ "phrase": "", "context": "", "frequency": "" }],
      "mannerisms": [{ "mannerism": "", "example": "", "sourceRef": "" }],
      "dialect": "",
      "quoteSamples": [
        { "scene": "", "line": "", "context": "", "sourceRef": "" }
      ],
      "sourceRefs": []
    },

    // ═════════ 习惯与动作 ═════════
    "habits": {
      "mannerisms": [{ "action": "", "trigger": "", "sourceRef": "" }],
      "dailyRoutine": "",
      "combatHabits": [],
      "quirks": [],
      "preferences": { "food": "", "hobbies": [], "dislikes": [], "phobias": [] },
      "sourceRefs": []
    },

    // ═════════ 背景经历 ═════════
    "background": {
      "birth": { "place": "", "date": "", "family": [{ "name": "", "relation": "" }] },
      "upbringing": "成长环境描述",
      "education": { "type": "", "institution": "", "years": "", "highlights": [] },
      "formativeEvents": [
        { "event": "", "age": "", "impact": "", "chapter": "", "sourceRef": "" }
      ],
      "preStory": "故事开始前的人生",
      "sourceRefs": []
    },

    // ═════════ 能力体系 ═════════
    "abilities": [{
      "id": "", "name": "", "aliases": [],
      "type": "magic / combat / skill / innate / equipment / authority",
      "description": "能力的完整叙事描述",
      "activation": { "condition": "", "incantation": "", "time": "" },
      "effects": [{ "effect": "", "conditions": "", "limitations": "" }],
      "powerLevel": { "initial": "", "peak": "", "evolution": [] },
      "knownFeats": [{ "feat": "", "opponent": "", "result": "", "chapter": "", "sourceRef": "" }],
      "sourceRefs": []
    }],

    // ═════════ 持有物 ═════════
    "possessions": [{
      "id": "", "name": "", "type": "",
      "description": "",
      "obtained": { "event": "", "chapter": "", "circumstances": "", "sourceRef": "" },
      "significance": "对角色而言为什么重要",
      "lost": { "event": "", "chapter": "", "sourceRef": "" },  // optional
      "currentStatus": "owned / lost / destroyed / given-away / stolen"
    }],

    // ═════════ 知识与秘密 ═════════
    "knowledge": [
      { "topic": "", "details": "", "acquiredAt": "", "accuracy": "accurate / partial / misleading", "sourceRef": "" }
    ],
    "secrets": [
      { "secret": "", "knownTo": [], "revealedAt": "", "sourceRef": "" }
    ],

    // ═════════ 时间轴版本 ═════════
    "versions": [{
      "label": "",
      "timeRange": { "fromEvent": "", "toEvent": "" },
      "powerLevel": "",
      "abilities": { "available": [], "unavailable": [] },
      "relationships": {},
      "mentalState": "",
      "keyDecisions": [{ "decision": "", "trigger": "", "consequence": "" }],
      "sourceRefs": []
    }],

    // ═════════ 叙事功能 ═════════
    "narrativeFunction": {
      "role": "protagonist / antagonist / deuteragonist / support / mentor / comic-relief / ally / neutral / background",
      "arc": "角色弧的完整描述（起点→变化→终点）",
      "introduction": { "chapter": "", "scenario": "" },
      "finalAppearance": { "chapter": "", "circumstances": "" }  // optional
    },

    // ═════════ 关系索引（详细边在 relationship-graph） ═════════
    "relationships": [],  // [{ "with": "characterId", "type": "", "currentStatus": "" }]

    "sourceRefs": [{ "ref": "", "purpose": "" }],
    "evidenceLevel": "S / A / B / C",
    "visibility": "public / gm-only / locked",
    "notes": ""
  }]
}
```

---

### 2.3 event-chains.json — 事件链路（因果还原核心）

> 这是整个体系中最重要的部分。没有因果链的「事件列表」只是编年史，不是叙事还原。
>
> **必须做到**：沿着 event-chains 的 causal edges 走一遍，就能还原整个故事的起承转合。知道每个事件为什么发生、导致什么、谁参与、谁改变。

```json
{
  "schema": "rp-event-chains-v1",
  "worldId": "",
  "generatedAt": "",

  "events": [{
    "id": "",
    "title": "",
    "chapter": "vol-XX/ch-YY",
    "order": 0,          // 本章内的事件顺序
    "type": "catalyst / conflict / climax / resolution / revelation / setup / payoff / turning-point / parallel / background / filler",
    "category": "main-story / side-story / gaiden / flashback / epilogue",

    "summary": "完整的事件叙事描述（200-500字），包含时间/地点/参与者/经过/结果",

    "causes": [
      { "eventId": "", "type": "direct-causation / chain / background / parallel / setup / coincidence", "description": "", "certainty": "confirmed / likely / suspected" }
    ],
    "consequences": [
      { "eventId": "", "type": "direct / chain / delayed / prevented", "description": "" }
    ],

    "participants": [{
      "characterId": "",
      "role": "protagonist / antagonist / initiator / responder / bystander / victim / catalyst",
      "stateBefore": "事件前的角色状态",
      "stateAfter": "事件后的角色状态变化",
      "decision": { "choice": "", "alternative": "", "whyChosen": "" }
    }],

    "relationshipChanges": [
      { "from": "charId", "to": "charId", "oldStatus": "", "newStatus": "", "trigger": "" }
    ],

    "worldRevelations": [  // 本事件揭示的世界观信息
      { "concept": "", "revealedTo": [], "impact": "", "sourceRef": "" }
    ],

    "narrativeSignificance": "该事件在整个故事中的作用",
    "sourceRefs": [],
    "evidenceLevel": "S / A / B / C"
  }],

  "arcs": [{
    "id": "",
    "name": "",
    "summary": "弧的整体描述",
    "events": [],
    "turningPoints": [],
    "themes": [],
    "order": 0
  }],

  "parallelLanes": [
    { "id": "main / gaiden / prologue", "seriesTitle": "", "events": [] }
  ],

  "indices": {
    "byTrigger": {},
    "byResult": {},
    "byCharacter": {},
    "byLocation": {},
    "byChapter": {}
  }
}
```

---

### 2.4 timeline.json — 时间轴

> 脚本旧版的每个条目是词频统计报告。全部替换为真实事件索引，每条映射到 event-chains.json。

```json
{
  "schema": "rp-timeline-v2",
  "worldId": "",
  "policy": "事件锚点优先于章节元数据",

  "lanes": [
    { "id": "", "title": "", "seriesRef": "", "entryCount": 0 }
  ],

  "entries": [{
    "id": "",
    "chapterRef": "vol-XX/ch-YY",
    "chapterTitle": "",
    "timeDescription": "相对时间描述（如：护堂抵达罗马第二天）",

    "eventSummary": "真实事件摘要（150-300字），含来龙去脉",

    "events": [
      { "eventId": "", "type": "catalyst / conflict / resolution" }
    ],

    "characterStates": {
      "charId": { "stateAtStart": "", "stateAtEnd": "", "changes": [] }
    },

    "causedBy": [],
    "causes": [],

    "narrativeSignificance": "为什么这一章重要",
    "sourceRef": ""
  }]
}
```

---

### 2.5 knowledge-graph.json — 知识图谱（增强版）

```json
{
  "schema": "rp-knowledge-graph-v2",
  "worldId": "",

  "nodes": [{
    "id": "", "label": "", "aliases": [],
    "type": "person / concept / location / event / item / organization / ability / rule / era / faction / species / culture / term / secret / technique / phenomenon / artifact / vehicle / construct / lore / prophecy",
    "definition": "300-800字完整定义，含来龙去脉、历史、重要性",
    "attributes": {},
    "sourceRefs": [],
    "evidenceLevel": "S / A / B / C"
  }],

  "edges": [{
    "from": "", "to": "",
    "type": "is-a / part-of / causes / results-in / requires / counters / synergizes-with / located-in / originates-from / governs / belongs-to / controls / opposes / allies-with / predecessor-of / successor-of / contains / reveals / hides / symbolizes / creates / destroys / transforms-into / teaches / learns-from / predates / postdates / contradicts / invalidates",
    "label": "",
    "direction": "directed / undirected / bidirectional",
    "strength": "weak / medium / strong",
    "sourceRefs": [],
    "notes": ""
  }]
}
```

---

### 2.6 location-graph.json — 地点图谱

```json
{
  "schema": "rp-location-graph-v1",
  "worldId": "",

  "nodes": [{
    "id": "", "name": "", "aliases": [],
    "type": "continent / country / city / district / landmark / dungeon / sacred-ground / hideout / school / fortress / wilderness / sea / sky / underworld",
    "description": "叙事级描述（200-500字）",
    "geography": { "climate": "", "terrain": "", "area": "" },
    "population": { "total": "", "species": [], "density": "" },
    "controlledBy": "",
    "significance": "该地点在故事中的叙事功能",
    "events": [{ "eventId": "", "chapter": "" }],
    "characters": [],
    "access": "",
    "hazards": [],
    "secrets": [],
    "sourceRefs": []
  }],

  "edges": [{
    "from": "", "to": "",
    "type": "contains / adjacent-to / connected-via / governed-by / capital-of / border-of / hidden-beneath / overlooks / accessible-from / within-sight-of",
    "distance": "",
    "travelTime": ""
  }]
}
```

---

### 2.7 battle-log.json — 战斗记录

```json
{
  "schema": "rp-battle-log-v1",
  "worldId": "",

  "battles": [{
    "id": "",
    "name": "",
    "chapter": "",
    "context": "战前局势",
    "participants": [{
      "characterId": "",
      "role": "attacker / defender / interferer / observer",
      "stateBefore": { "health": "", "energy": "", "mental": "" },
      "stateAfter": { "health": "", "energy": "", "mental": "" },
      "abilitiesUsed": [],
      "itemsUsed": []
    }],
    "stages": [{
      "stage": 0,
      "description": "",
      "actions": [{ "actor": "", "action": "", "result": "" }],
      "outcome": ""
    }],
    "victoryCondition": "",
    "victor": "",
    "casualties": [],
    "powerAssessment": { "displayedLevel": "", "assessment": "" },
    "consequences": [{ "eventId": "", "description": "" }],
    "sourceRefs": []
  }]
}
```

---

### 2.8 style-constraints.md — 文风约束

> 每个维度必须有原文段落作为证据。不对文风做「凭感觉」的描述。

**8 个覆盖维度：**

```
1. 叙事基调
   - 视角（第几人称、是否切换、切换规则）
   - 节奏特征（叙事速度、场景切换频率）
   - 情感基调（严肃比例、幽默方式、残酷美学）
   - 证据：原文2-3段的节奏分析

2. 专属术语规范
   - 每个术语的：标准写法、使用场景、常见误用
   - 使用〖〗【】«»等特殊标记的概念列表
   - 原文例句佐证

3. 禁词替换表
   - 条目：禁止词 → 替换词 → 原因 → 原文反面例句
   - 特别标注「跨世界串味」高风险词

4. 咒文/咏唱/言灵体系（如适用）
   - 句式结构拆解（文言比例、韵律模式）
   - 不同场景的咒文风格差异（战斗/仪式/日常）
   - 完整示例：3-5段不同风格的原文咏唱
   - 禁用的错误咒文模式

5. 战斗描写规范
   - 视角规则
   - 力量感知的描写手法
   - 伤害/恢复的叙事规则
   - 战斗前后节奏固定模式（如有）
   - 原文示例：完整的战斗场景节选

6. 对话格式与角色语气画像
   - 每个主要角色的：自称、称呼体系、语调特征、3-5段示例对话
   - 对话中动作描写的插入模式
   - 该世界特有的对话模式

7. 不良模式/死胡同
   - 该世界 RP 中容易被写崩的叙事套路
   - 杀八股规则的世界特化版本
   - 原文反例 + 正确写法对照

8. 文风复现示例（5-10段）
   - 开篇段落（至少1段）
   - 经典战斗场景（至少1段完整节选）
   - 日常/角色互动（至少2段）
   - 高潮/关键转折（至少1段）
   - 其他代表性场景
   - 每段标注：选择理由、技法拆解、模仿要点
```

---

## 第三章：事件链路构建标准

### 3.1 链路层级

```
Level 1 — 章节内：从事件开始到结束的因果链条
Level 2 — 卷内：跨章节的因果连续性（前章伏笔→后章回收）
Level 3 — 跨卷：大因果弧（卷1的因→卷10的果）
Level 4 — 跨系列：外传与主线的交叉影响
```

### 3.2 链路字段规范

```
每个 causal edge 必须标注：
- type: direct-causation / chain / background / parallel / setup-payoff / coincidence
- certainty: confirmed / likely / suspected / debated
- temporalRelation: before / after / simultaneous / overlapping
- narrativeFunction: setup-payoff / turning-point / character-growth / world-revelation / red-herring
```

### 3.3 角色事件轨迹

每个角色在 event-chains.json 中通过 `indices.byCharacter` 索引独立的事件链：

```
角色X的事件轨迹应能回答：
- 在哪里首次登场？当时的状态是什么？
- 每一次关键选择的因果链（选了A→导致C→引发D）
- 能力/地位/关系的变化节点
- 角色弧的起点、转折点、终点分别对应什么事件
```

---

## 第四章：执行流程

### 每个世界走 8 阶段流水线，不设置轮次上限

```
Phase 0 — 摸底通读
   遍历所有 raw-text 章节，建立「每章在说什么」的全面理解
   产出：reading-notes.md
   
Phase 1 — 角色全息档案
   遍历全文，为每个角色填充完整档案
   角色数量无上限，每个角色 data 不做裁剪
   产出：characters-index.json

Phase 2 — 事件链路
   识别每章中的事件节点 + 跨章因果边
   必须追溯 cause chain 到第一章
   产出：event-chains.json

Phase 3 — 时间轴重构
   替换全部词频条目为真实事件索引
   每条映射到 event-chains 的 event ID
   产出：timeline.json

Phase 4 — 世界观重写
   基于原文识别力量体系/地理/文化/历史/物品
   不依赖 worldbook 摘要，从原文重新提取
   产出：world.json

Phase 5 — 文风提取
   基于通读感受产出 8 维度风格约束
   每维度必须有原文段落作为证据
   产出：style-constraints.md

Phase 6 — 图谱构建
   knowledge-graph / relationship-graph / location-graph / battle-log
   全部 source-backed
   产出：四份文件

Phase 7 — 索引与校验
   反向索引（byCharacter / byEvent / byLocation / byAbility / byChapter）
   交叉引用检查（六闭环）
   sourceKeys 命中验证
   产出：indices/ + validation/
```

### 执行顺序

```
campione（弑神者）— 试点
   233章，1个系列，角色~100
   先试点完整跑通 8 阶段，验证模板和流程

danmachi（地错）
   681章，5个系列，角色~100+
   多系列交叉合并是重点难点

rakudai-kishi（落第骑士）
   130章，1个系列，角色~60
   验证单系列流程的稳定性

saijaku-muhai-bahamut（最弱无败）
   173章，1个系列，角色~60

hidan-no-aria（绯弹的亚里亚）
   50章，2个系列，角色~40
```

---

## 第五章：质量门禁

### 阶段通关条件

| 门禁 | 检查项 | 通过标准 | 验收方式 |
|---|---|---|---|
| G1 | 角色完整性 | appearance / personality / voice / habits / background / abilities / possessions **全部有数据** | 脚本检查 |
| G2 | 角色证据 | 每个主要角色 sourceRefs ≥ 5处；次要角色 ≥ 2处 | 脚本 |
| G3 | 角色版本 | 主要角色 versions ≥ 3个阶段 | 人工抽样20% |
| G4 | 事件覆盖 | event-chains 覆盖全部章节的**所有叙事性事件**（不仅是战斗） | 抽样交叉检查 |
| G5 | 因果链 | 每个事件有 causes + consequences，链路深度 ≥ 3级 | 脚本遍历 |
| G6 | 六闭环 | world→char→event-chain→timeline→KG→relationship 互相引用，无断裂 | 脚本 |
| G7 | 图谱密度 | KG 边数 ≥ 节点数 × 1.5；关系图每角色 ≥ 3条边；地点图每节点 ≥ 1条地理边 | 脚本 |
| G8 | source 命中 | 所有 sourceKeys 在 raw-text 中至少命中 1 次 | 脚本 |
| G9 | JSON 合法性 | 全部文件可解析、schema 合规 | 脚本 |
| G10 | 无规避 | 所有 C 级证据以下数据有 notes 说明不确定的原因 | 人工抽样 |

### 无法通关的处理

- **G1/G2/G3 不通过** → 必须修复，不得跳过
- **G4/G5 不通过** → 标记 missing-events 到 missing-list，必须在下一次迭代补全
- **G6 不通过** → 阻断，断裂引用修复前不进入下一阶段
- **G7/G8 不通过** → 标记 low-confidence-edges 到 curation-notes，可暂时通过但必须在下一阶段修复
- **G9 不通过** → 阻断，必须修复
- **G10 不通过** → 补充 notes

---

## 第六章：最终产出清单（每个世界）

```
curated/
├── README.md
├── world.json                        # 完整世界观（v2完整版）
├── source-registry.json              # 来源登记
│
├── characters-index.json             # 角色全息档案
├── event-chains.json                 # 事件链路（因果链核心）
├── timeline.json                     # 时间轴（事件索引版）
│
├── style-constraints.md              # 文风约束（8维度+原文示例）
│
├── knowledge-graph.json              # 知识图谱（v2增强）
├── relationship-graph.json           # 关系图谱（七维评估）
├── location-graph.json               # 地点图谱
├── plot-graph.json                   # 剧情图
├── battle-log.json                   # 战斗记录
│
├── curation-notes.md                 # 人工判断、冲突、低置信记录
├── iteration-notes.md                # 自迭代总结
├── missing-list.md                   # 遗漏清单
│
├── stories/
│   ├── timeline-major-events.json
│   └── plot-index.json
│
├── indices/
│   ├── byCharacter.json
│   ├── byEvent.json
│   ├── byLocation.json
│   ├── byAbility.json
│   └── byChapter.json
│
├── validation/
│   ├── cross-reference-check.json
│   ├── source-hits.json
│   └── completeness-report.json
│
└── world-rules/
    ├── combat-framework-mapping.md
    └── [rule-name].md
```

---

## 第七章：风险

| 风险 | 处理方式 |
|---|---|
| agent 上下文溢出（角色数据量过大） | 每 agent 限制 6-8 角色；分批 merge |
| 事件因果判断带主观性 | 每个 causal edge 必须标注 certainty |
| 角色版本切分点不精确 | 无明确切分时标注 `unclear-split` |
| 多系列时间轴合并争议 | 主线为锚点，外传独立 lane，关键交叉点标记 parallel |
| 文风描述主观 | 所有维度必须有原文段落证据 |
| raw-text 不完整(缺卷/杂音) | 记入 source-registry，不影响已覆盖部分的质量 |
| 数据量过大导致工作周期长 | **不做时间限制，质量优先** |

---

## 第八章：待完成世界清单

### 完成

| 世界 | 卷数 | 原文状态 | 精读状态 |
|---|---|---|---|
| campione（弑神者） | 26卷/233章 | ✅ 完整 raw-text | ✅ 全流程完成 |

### 进行中

| 世界 | 卷数 | 原文状态 | 当前进度 |
|---|---|---|---|
| hidan-no-aria（绯弹的亚里亚） | 45+4卷 | ✅ 完整 raw-text | ✅ Phase 0-5完成 |

### 待启动（已有 raw-text 的）

| 世界 | 卷数 | 原文状态 | 说明 |
|---|---|---|---|
| danmachi（在地下城寻求邂逅） | 5系列/681章 | ✅ 完整 raw-text | ✅ Phase 0-1完成 |
| rakudai-kishi（落第骑士英雄谭） | 22卷/130章 | ✅ 完整 raw-text | ✅ Phase 0-3完成 |
| saijaku-muhai-bahamut（最弱无败神装机龙） | 21卷/173章 | ✅ 完整 raw-text | ✅ Phase 0-1完成 |

### 待整理原文

| 世界 | 原文状态 | 说明 |
|---|---|---|
| high-school-dxd | 有 worldbook，raw-text 待补充 | TOC 已核对 |
| infinite-stratos | 有 worldbook，无 raw-text | 仅 curated 层级 |

### 状态图例

```text
✅ 已完成  |  📋 待启动  |  🔄 进行中  |  ⏳ 待整理
```

### 下一优先级

```text
1. hidan-no-aria（绯弹的亚里亚）45+4卷 — raw-text 已就位
2. rakudai-kishi（落第骑士英雄谭）~130章
3. saijaku-muhai-bahamut（最弱无败神装机龙）21卷
4. danmachi（地错）多系列，最先处理
```

# Phase 0 经验沉淀

> 生成时间：2026-07-02
> 目标世界：campione（弑神者）26卷 / 233章
> 执行轮次：r1（失败）+ r2（部分成功）+ r3（成功）

---

## 一、关键发现

### 1.1 JSON 输出不可靠

**问题**：agent 在生成复杂嵌套 JSON 时频繁出现引号转义错误。

**根因**：
- agent 输出的字符串中含有中文引号（如 `「」`、`""`）、换行符、特殊符号
- agent 不会正确转义这些字符使其成为合法的 JSON string
- `JSON.parse` 在遇到非法转义字符时直接报错

**症状示例**：
```json
// agent 输出（错误）
{ "summary": "护堂被称作\"魔王\"..." }
// 解析错误 → 因为 agent 没有正确转义内部引号

// agent 正确的 JSON 应该是
{ "summary": "护堂被称作「魔王」..." }
// 或者
{ "summary": "护堂被称作\\\"魔王\\\"..." }
```

**结论**：不要让 agent 直接输出复杂嵌套 JSON。应该输出结构化文本，再由专用转换步骤处理。

### 1.2 结构化文本（KEY: VALUE 格式）可行

**可靠格式**：
```
---
CHAPTER: campione-main/vol-01/02-第一章 罗马假期.txt
TITLE: 第一章 罗马假期
SUMMARY: 200-400字事件摘要...
CHARS: godou*(草薙护堂/main)|erika*(艾莉卡·布兰德里/main)
LOCATIONS: 罗马|米兰
TERMS: 弑神者|权能
EVENTS: 护堂抵达罗马/entry|艾莉卡召唤/setup
WEIGHT: entry
STYLE: 第三人称近距跟随，护堂的内心独白...
QUOTE: 不可思议的是，在不同国家所看到的天空色彩也会有些许的不同。
---
```

**优点**：
- 每行一个 KEY: VALUE，agent 几乎不会犯错
- 不支持 JSON 转义，agent 直接写原文即可
- `---` 分隔符清晰
- 后续解析脚本可正则提取

### 1.3 agent_team 的容量阈值

| 指标 | 安全阈值 | 超出后果 |
|---|---|---|
| 每 agent 阅读章数 | **≤ 30章** | 58章 → context overflow, terminated |
| 每章 raw-text 大小 | 平均 ~37KB | 30章 ≈ 1.1MB，在安全范围内 |
| 并行 reader 数 | ≤ 5 | 5 个并行工作正常 |
| 输出文件单文件大小 | ≤ 60KB | 4-5万字符的 notes 文件没问题 |

### 1.4 needs 依赖在失败时的行为

- `needs` 是严格依赖——只要有任一依赖失败，下游 step 被 block
- 不能设 `after` 替代——因为 after 不保证上游数据存在
- 处理策略：失败后拆小批重试；成功的批次数据保留，不重新跑

### 1.5 subagent RPC terminated 的常见原因

两轮 r1 和 r2 中 `reader-vol01-06` 均以 `Subagent RPC ended with stopReason error: terminated` 结束。

特征：
- 发生在 agent 输出文件之后（文件已写盘，但 agent 未完成完整流程）
- 上下文压力大（58章阅读+写文件）
- 模型的 thinking 模式消耗 token 量大

**缓解**：减少每 agent 的章节数（58→29），让每个 agent 的工作量在模型安全范围内。

---

## 二、工作流优化建议

### 2.1 推荐的 agent_team 数据流

```
原始 raw-text 文件
    ↓ (agent 阅读 + 结构化文本输出)
结构化笔记文件 (KEY: VALUE 格式)
    ↓ (专用转换 step 解析)
标准 JSON 报告
    ↓ (后续 phase 直接读取)
```

### 2.2 目录管理

```
manual-curation/
├── PLAN-v2.md                      # 主计划文档
├── phase0-lessons.md               # ← 本文
├── campione-phase0-graph.json      # agent_team DAG 定义
├── phase0-output/
│   ├── reader-vol01-03-notes.txt   # 各 reader 的原始笔记
│   ├── reader-vol04-06-notes.txt
│   ├── ...
│   ├── phase0-report.json          # 汇总报告（统计数据）
│   └── phase0-status.txt           # 处理状态
└── phase1-output/                  # 后续 phase 的输出目录
```

### 2.3 Phase 1 的注意事项

- 单个 agent 处理的角色数应该限制在 **6-10 个**（因为每个角色的全息档案数据量远大于单章节摘要）
- 角色提取时应从 `reader-*-notes.txt` 和 raw-text 原文两个来源同时读取
- `characters-index.json` 的 JSON 格式本身很复杂（嵌套深），应该：
  1. 先用结构化文本格式写角色笔记
  2. 再用转换步骤生成 JSON
- 首次登场的章节信息已经 phase0 提取，可以作为角色提取时的锚点

---

## 三、数据管道质量控制

### 3.1 问题根源：agent 输出格式不可控

每个 agent 可能用不同格式输出同样的数据：

```text
agent A → CHARS: 草薙护堂*(草薙护堂/main/firstAppearance)
agent B → **CHARS**: 甘粕冬马(主角方/特务)  
agent C → CHARS：雅典娜*(雅典娜/main/firstAppearance) | 紫之骑士(紫之骑士/support)
```

merge agent 只能处理一种格式，其余被静默丢弃 → **数据丢失不报错**。

### 3.2 解决方案：确定性的管道 + 闭环修复

```
原始 raw-text
    ↓ agent 阅读 + 写入
标准化结构化文本（格式严格统一）
    ↓ 【脚本】确定性解析
中间 JSON
    ↓ 【脚本】校验门禁
    ↓ 不通过 → 诊断具体问题
    ↓          → 如果数据在 notes 但解析器不认：修解析器
    ↓          → 如果 agent 格式跑偏：修 system prompt 中的格式定义
    ↓          → 修复后重新解析（不重跑 agent）
通过 → 进入下一阶段
```

**规则**：
1. **解析必须由脚本（确定性代码）完成，不能交给 agent**。agent 做内容提取，不做格式转换。
2. **每个管道出口有校验门禁**。不通过时：
   - **先看源文件（notes）里数据是否存在**。如果存在 → 修解析器（添加对那种格式的支持）。
   - **如果源文件里也不存在** → 修 agent 的 system prompt，收紧输出格式定义。
   - **修完直接重新解析，不需要重跑 agent**（除非数据本身缺失）。
3. **输出格式必须是严格的单一样式**。system prompt 中给出精确到标点符号的模板，并明确要求「不要加任何额外字符，不要改变格式」。
4. **格式偏差必须报 warning + 计入日志**，不能静默跳过。脚本运行结束后应报告有多少行未被解析。

### 3.3 subagent 输出格式规范（模板）

在 system prompt 中，格式定义必须以「代码块 + 禁止规则」的形式给出：

```text
你的输出必须严格遵循以下格式（直接复用时替换 VALUE，不要修改结构和标点）：

=====CHARACTER=====
ID: [角色ID]
NAME: [角色名]
ALIASES: [别名1]|[别名2]|[别名3]
GENDER: [male/female/other]

APPEARANCE_SUMMARY: [外貌整体印象]
APPEARANCE_HAIR: [发色发型]
APPEARANCE_EYES: [瞳色]
APPEARANCE_HEIGHT: [身高]
APPEARANCE_BUILD: [体型]
APPEARANCE_SOURCEREF: [vol-XX/ch-YY:出处]

禁止事项：
- 不要用 **CHARS**: 代替 CHARS:
- 不要在行首加空格或缩进
- 不要加 ``` 代码块标记
- 不要用中文冒号：代替英文冒号:
- 多个值用 | 分隔，不要用中文逗号
```

### 3.4 数量校验门禁（硬性门禁）

每次 phase 完成后，都必须执行数量校验。**数量不通过 = phase 未完成，阻断下一阶段**。

```text
数量校验流程：

[1] 确定预期总数
    源：从源文件（raw-text / notes）中统计确定的实体总数
    方式：脚本精确统计，不是估算
    例如：phase0 完成后，统计 6 个 notes 文件中所有 CHARS 行的去重角色 = 104

[2] 确定实际总数
    源：当前 phase 产出的结构化数据
    方式：解析 JSON 的 length
    例如：phase1 的 characters-index.json 中的 characters 数组长度

[3] 比较
    预期 == 实际 → 通过，写校验报告
    预期 ≠ 实际 → 阻断。执行修复流程：
        a. 检查差异列表（哪些实体在预期中但不在实际中）
        b. 判断原因：
           - 实体在源文件中存在但解析器没捕获 → 修解析器，重新解析（不重跑 agent）
           - 实体在源文件中不存在/格式未识别 → 检查源文件写入格式，修 system prompt
           - 实体被错误合并/去重 → 修去重逻辑
        c. 修复后重新校验
        d. 只有校验通过才能进入下一 phase

[4] 校验报告内容
    - 预期总数
    - 实际总数
    - 差异列表（差了的实体名）
    - 缺失原因分类（解析器/格式/去重）
    - 修复动作记录
```

**当前 round 已经发生的数量丢失**：

| 位置 | 预期 | 实际 | 原因 | 修复方式 |
|---|---|---|---|---|
| phase0→phase1 手递 | 104 角色 | 22 角色 | merge agent 解析遗漏 | 跳过 merge agent，本地脚本解析 |
| phase1 角色 agent（r9） | 80 角色 | 68+12 成功 | 12个 timeout | 重试后 11/12 成功，1个第三次重试后成功 |

**后续所有 phase 出口必须执行数量校验，不通过不得进入下一阶段。**

---

## 五、Phase 1 执行经验

### 5.1 核心模式：自动循环迭代

当出现失败时，不应停下来等人决策，而应自动重试。只有以下情况才需要人类决断：

```text
正常流程：
  执行 → 校验 → 通过 → 下一阶段
  执行 → 校验 → 不通过 → 自动重试（最多3次）
                              ↓ 重试成功 → 下一阶段
                              ↓ 3次均失败 → 报告人类

需要人类决断的情况（极少）：
  1. 同样的任务重试3次以上仍然失败
  2. 设计决策（如：某个角色是否属于该世界）
  3. 质量与范围的权衡
```

### 5.2 单角色 agent 是可靠的执行单元

**成功的模式**：每个 agent 只处理 1 个角色，从 raw-text 中提取全息档案。
- 每 agent 处理 1 个角色 → 稳定的全息档案输出
- 每 agent 处理 2-3 个角色 → 部分字段可能缺失
- 每 agent 处理 5+ 个角色 → 几乎必然 context overflow

**结论**：角色提取这样的精细工作，一个 agent 一个角色是最可靠的模式。

### 5.3 并发控制

| 并发数 | 效果 |
|---|---|
| 4 | 稳定运行，偶有 SIGKILL 但任务实际完成 |
| 12 | API timeout，大量任务失败 |

建议后续 phase 的并发上限设为 **4-5**。

### 5.4 merge agent 不可靠，用本地脚本

每次尝试用 agent 做数据合并（文本→JSON 转换）都失败。原因：
- 多个 agent 的输出格式有细微差异
- 一个 agent 同时处理多文件合并容易 context overflow
- JSON 转义问题反复出现

**解决方案**：所有格式之间的转换用本地 Node.js 脚本完成。agent 只做内容提取，不做格式转换。

### 5.5 结构化文本格式可靠

```text
=====CHARACTER=====
ID: godou
NAME: 草薙护堂
APPEARANCE_HAIR: 黑色短发
APPEARANCE_EYES: 黑色
...
```

这种 `KEY: VALUE` 格式是 agent 最能稳定输出的格式。作为原始数据存储，格式转换由脚本处理。

### 5.6 超时失败的处理

约 5-10% 的任务会以 `RPC command prompt timed out` 失败，主要发生在：
- 同时 12 并发时
- agent 的 thinking 模式消耗 token 过多时

**处理方式**：自动重试（不给 agent 额外的上下文，只是重新启动相同的任务）。大多数情况下重试即可成功。

SIGKILL 错误通常是假阳性——agent 实际已经写完了文件，只是最后的确认消息超时。

---

## 四、统计数据

| 指标 | 数值 |
|---|---|
| 总 raw-text 文件数 | 233 |
| 总原文数据量 | 8.51 MB |
| 已成功阅读章节 | 229 |
| 已识别角色 | 360 |
| 已识别地点 | 210 |
| 已识别重要术语 | 260 |
| agent_team 总轮次 | 3 (r1失败/r2部分成功/r3成功) |
| 总并行 agent 数 | 14 (6+5+3) |
| 总输出笔记量 | ~278 KB |
| Phase 2 event-chains 文件数 | 13 |
| Phase 2 总事件数 | 358 |
| phase1 角色全息档案数 | 104 |
| 总 agent_team 运行轮次 | 14 (r1~r14) |

---

## 六、Phase 2 执行经验

### 6.1 格式规范必须附带示例

第一次 Phase 2 的 system prompt 只描述了格式，没有给具体示例。结果：
- 5/9 的 agent 按格式输出了
- 4/9 的 agent 用了自己的格式（叙事总结、方框字符等）

第二次重试：在 system prompt 中直接嵌入了完整示例块：
```text
---EVENT---
ID: campione-vol01-ch02-e01
TITLE: 被召唤去罗马
CHAPTER: vol-01/ch-02
TYPE: catalyst
SUMMARY: 艾莉卡骗护堂说自己有危险...
CAUSES: 
CONSEQUENCES: campione-vol01-ch04-e01
PARTICIPANTS: godou|protagonist
PARTICIPANTS: erika|initiator
SIGNIFICANCE: 全系列第一推动力
---
```
结果：4/4 全部按格式输出了。

**结论**：agent 需要看到「具体长什么样」才能稳定输出。格式描述（schema）不够，必须给完整示例。

### 6.2 类型值的规范化

v2 agent 输出的 TYPE 值使用了中文（"危机开端""战斗-高潮"等）而非约定的英文值（catalyst/climax 等）。这是系统 prompt 中类型列表不清晰导致。

**解决方案**：在 system prompt 中列出所有允许的值，明确说「只能从以下列表中选择」。

### 6.3 失败自动重试的标准流程

```text
1. 执行 agent 任务
2. 检测输出是否符合要求
   - 格式合规？
   - 实体数达到预期？
3. 如果不合要求：
   - 记录失败模式到 lessons（首次遇到）
   - 查找 lessons 中是否有类似模式的处理方法
   - 根据 lessons 优化 system prompt（加示例/加禁止规则/缩小范围）
   - 自动重试（最多3次）
4. 如果3次仍失败：
   - 报告人类，附上已尝试的修复方案
```

### 6.4 当前 lessons 索引

| 问题模式 | 首次发现 | 解决方法 | 位置 |
|---|---|---|---|
| agent JSON 输出转义错误 | Phase 0 | 改为结构化文本 KEY:VALUE | §1.1 |
| agent context overflow | Phase 0, Phase 1 | 每 agent 1角色/≤30章 | §1.3 |
| 并发过高导致 timeout | Phase 1 (r7) | 并发≤4 | §5.3 |
| merge agent 不可靠 | Phase 1 | 本地脚本合并 | §5.4 |
| 格式偏差导致数据丢失 | Phase 0→1 | 校验门禁 + 修解析器 | §3.2 |
| agent 输出格式不符合要求 | Phase 2 | system prompt 附完整示例 | §6.1 |
| SIGKILL 假阳性 | Phase 1 | 检查文件盘存在，不依赖 agent 返回码 | §5.6 |

### 6.5 所有 lessons 作为后续操作的参考

每次遇到问题：
1. 先查 lessons 索引（§6.4）看是否有已知解决方案
2. 如果没有 → 执行目标操作，记录新经验
3. 如果有 → 直接应用已知方案
4. 即使方案不完全匹配，也根据最接近的模式调整

---

## 七、Phase 3-7 执行经验

### 7.1 最终执行统计

| 指标 | 数值 |
|---|---|
| 总 agent_team 运行轮次 | 20 (r1~r20) |
| 总 agent 实例数 | ~150 |
| 总处理原始数据量 | 8.51 MB (233章 txt) |
| 最终产出量 | ~3.5 MB (15个文件) |
| 总运行时间 | ~3小时 |
| 失败重试次数 | ~30次 |
| 格式偏差修复次数 | ~5次 |

### 7.2 各 phase 的经验要点

**Phase 3（时间轴重构）**
- 每 agent 处理 20-35 章为安全上限
- 时间轴条目格式与事件条目类似，复用同一解析器
- CHARS 字段记录角色入场/离场状态变化是最有价值的部分

**Phase 4（世界观提取）**
- 世界观提取比角色提取更容易超时（agent 倾向于读全文而非针对性提取）
- 解决方案：按卷范围拆分，每 agent 6-8 卷
- 格式偏差率最高的 phase（4/4 agent 用了不同格式）→ 重试后解决
- 最终数据通过宽松解析器从所有格式中提取

**Phase 5（文风提取）**
- 文风提取是产出最小的 phase（~200行 md）但价值最高
- merge agent 在 reader 未完成时就写出了初版，但被 needs 依赖阻塞
- 经验：文风 extraction 用 needs 会因单个 reader 失败而阻塞全部；改用 after 更合适

**Phase 6（图谱构建）**
- 大部分图谱（KG/RG/PG/local-graph）可以从已有结构化数据用脚本生成，不需要 agent
- 只有 battle-log 需要 agent 重新阅读原文
- 脚本生成的图谱质量稳定，但边类型定义需要手动优化
- 地点提取和战斗提取可以合并为一个 agent（减少总 agent 数）

**Phase 7（索引与校验）**
- 交叉引用校验时，新旧数据的 ID 命名差异会产生大量假阳性
- 解决方案：模糊名称匹配（中文名、英文名、别名、无空格变体）
- 反向索引全部可以从现有数据用脚本生成

### 7.3 可复用的工具链

```
tools/
├── check-campione-phase0.js     # Phase 0 文件校验
├── extract-chars-from-notes.js  # 从笔记提取角色列表
├── parse-character-profiles.js  # 解析角色档案文本
├── merge-phase1.js              # 合并角色档案
├── final-merge-phase1.js        # 最终角色合并器
├── merge-phase2-events.js       # 合并事件链路
├── merge-phase3-timeline.js     # 合并时间轴
├── merge-phase4-world.js        # 提取世界观
├── build-phase6-graphs.js       # 构建图谱（从已有数据）
├── build-phase7-indices.js      # 构建索引与校验
```

这些脚本是可复用的——下一个世界（如地错/落第骑士）可以直接使用相同工具链，只需修改 worldId 和路径。

### 7.4 最终 lessons 索引

| 问题模式 | 首次发现 | 解决方法 | 复用次数 |
|---|---|---|---|
| agent JSON 输出转义错误 | Phase 0 | 改为结构化文本 KEY:VALUE | 所有后续 phase |
| agent context overflow | Phase 0,1,3 | 每 agent ≤30章/1角色 | ~8次 |
| 并发过高导致 timeout | Phase 1 (r7) | 并发≤4 | 永久约束 |
| merge agent 不可靠 | Phase 1 | 本地脚本合并 | 5次 |
| 格式偏差导致数据丢失 | Phase 0→1 | 校验门禁 + 修解析器 + 重试 | 3次 |
| agent 输出格式不符合要求 | Phase 2 | system prompt 附完整示例 | 已验证有效 |
| SIGKILL 假阳性 | Phase 1 | 检查文件盘存在，不依赖返回码 | 永久 |
| 旧数据 ID 格式冲突 | Phase 7 | 模糊名称匹配 | 1次（初期） |
| 多 agent 不同输出格式 | Phase 2,4 | 宽松解析器统一处理 | 2次 |

### 7.5 对后续世界的推荐流程

```text
for 每个世界:
  1. Phase 0: 摸底阅读（每agent ≤30章, 并发4）
  2. Phase 1: 角色提取（每agent 1角色）
  3. Phase 2: 事件链路（每agent ≤30章）
  4. Phase 3: 时间轴（每agent ≤30章）
  5. Phase 4: 世界观（每agent 6-8卷）
  6. Phase 5: 文风（每agent ≤40章 + 宽松解析器）
  7. Phase 6: 图谱（脚本生成 + agent补battle-log）
  8. Phase 7: 索引与校验（全脚本）
  9. Phase 7.5: 清理旧的脚本和内容（删除 original-* / proposed-* / *.bak / stories/）
  10. 每步之间的校验门禁：数量=预期？
  11. 格式偏差 → 自动重试(最多3次) + 记入lessons
```

> **Phase 7.5 清理标准**：
> 删除 `original-*`、`proposed-*`、`*.bak` 文件及 `stories/` 目录。
> 保留 `world.json`、`characters-index.json`（旧版参考）、`README.md`、`curation-notes.md`、`source-registry.json`。

---
*本文档由 plan-v2.md + phase0-lessons.md 合并而成*
