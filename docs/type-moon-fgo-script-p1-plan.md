# Type-Moon FGO Worldbook-Script P1 Plan

## 0. 定位

本计划用于将 FGO 相关 worldbook 中的剧情脚本化条目，转为 p1-plan 风格的可审计归档流水线。

本计划不是普通 archive plan，而是面向执行的 p1-style plan：

```text
source classification
→ source unit manifest
→ work packet queue
→ per-chapter extraction
→ chapter audit/fix loop
→ normalized entity fragments
→ canonical per-entity merge
→ tree merge
→ graph/timeline indexes
→ final audit/comparison/migration recommendation
```

核心原则：

```text
1. source-first，不从总结直接生成正式事实。
2. 每个 source unit 可追溯。
3. 每个 work packet 有输入、输出、禁区、验收标准。
4. 正式 character/event/relationship/location/system 不写成单个大 JSON。
5. index.json 只做索引，不做事实主存储。
6. timeline 和 graph 是派生索引，不能成为唯一事实来源。
7. Generator → Auditor → Fixer 无限迭代直到 passed。
8. 不覆盖旧 curated。
```

---

### 0.1 三 agent 强制规则引用

FGO script p1 的 packet / merge / graph / timeline / final-fix / retrospective correction 必须遵守：

```text
rules/type-moon-three-agent-loop-rules.md
docs/type-moon-three-agent-loop-protocol.md
```

本计划中所有 `Generator → Auditor → Fixer → Auditor rerun` 均指**分离 agent 角色**，不得由单一 agent 内部自审代替。

执行确认后只能做确认计划内事项。任何计划外补结构、补 canonical layer、补 wrapper、迁移、发布、或 nonblocking risk 修复，都必须先提交新计划并等待用户确认。
## 1. 已核实的 FGO source 结构

### 1.1 主 source：`[沙盒]FGO 0.8.worldbook.json`

路径：

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

结构：

```text
entryCount: 118
fields: index, enabled, keys, secondaryKeys, comment, content, constant, selective, position, extensions, raw
content length: min 0 / median 1280 / max 8258
```

该文件不是普通设定 worldbook，而是包含 FGO 剧情脚本化条目。典型章节条目结构：

```text
<world_state>
  特异点名称
  时代
  地点
  评级
  环境特征
  异常根源
  底层逻辑
</world_state>

<stage_characters>
  阵营：角色(职能/事件作用)
</stage_characters>

<world_timeline>
  -事件A: 标题 (时间)[触发:...|完成:...]: 摘要
  【角色】台词
</world_timeline>
```

推荐 sourceType：

```text
user-file-worldbook-script
```

推荐 canonStatus：

```text
canon-like / adapted
```

禁止标为：

```text
canon-text
official-script
```

### 1.2 Part 1 script-like entries

| entryIndex | comment | estimated events | estimated quotes | source use |
|---:|---|---:|---:|---|
| 80 | FGO_特异点F_冬木 | 11 | 22 | script-primary |
| 81 | FGO_第一特异点_奥尔良 | 16 | 38 | script-primary |
| 82 | FGO_第二特异点_七丘之城 | 16 | 33 | script-primary |
| 83 | FGO_第三特异点_俄刻阿诺斯 | 14 | 29 | script-primary |
| 84 | FGO_第四特异点_伦敦 | 14 | 29 | script-primary |
| 85 | FGO_第五特异点_合众为一 | 23 | 34 | script-primary |
| 86 | FGO_第六特异点_卡美洛 | 33 | 65 | script-primary |
| 87 | FGO_第七特异点_巴比伦尼亚 | 23 | 36 | script-primary |
| 88 | FGO_终局特异点_所罗门 | 23 | 25 | script-primary |

### 1.3 EoR script-like entries

| entryIndex | comment | estimated events | estimated quotes | source use |
|---:|---|---:|---:|---|
| 89 | FGO_亚种特异点I_新宿 | 19 | 27 | script-primary |
| 90 | FGO_亚种特异点II_雅戈泰 | 17 | 32 | script-primary |
| 91 | FGO_亚种特异点III_下总国 | 17 | 36 | script-primary |
| 92 | FGO_亚种特异点IV_塞勒姆 | 12 | 22 | script-primary |

### 1.4 Lostbelt / Ordeal Call script-like entries

已确认存在：

```text
93  FGO_LB1_安娜塔西亚
94  FGO_LB2_诸神黄昏
95  FGO_LB3_人智统合真国
96  FGO_LB4_创世灭亡轮回
97  FGO_LB5_1_亚特兰蒂斯
98  FGO_LB5_2_奥林波斯
100 FGO_LB6_1_阿瓦隆前篇
104 FGO_奏章I_纸月
105 FGO_奏章II_伊德
106 FGO_奏章III_统合
117 FGO_LB6_2_圆桌后篇
```

LB 与 OC 应在 Part 1 pilot passed 后再独立扩展。

### 1.5 summary source：`型月 (1).worldbook.json`

路径：

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json
```

用途：章节摘要、设定补点、cross-check，不作为事件主 source。

典型条目：

```text
169 主线剧情：序章·燃烧污染都市 冬木
170 主线剧情：第一特异点·邪龙百年战争 奥尔良
171 主线剧情：第二特异点·永续狂气帝国 七丘之城
172 主线剧情：第三特异点·封锁终局四海 俄刻阿诺斯
173 主线剧情：第四特异点·死界魔雾都市 伦敦
174 主线剧情：第五特异点·北美神话大战 合众为一
175 主线剧情：第六特异点·神圣圆桌领域 卡美洛
176 主线剧情：第七特异点·绝对魔兽战线 巴比伦尼亚
177 主线剧情：终局特异点·冠位时间神殿 所罗门
```

推荐 sourceType：

```text
user-file-worldbook-summary
```

### 1.6 character profile supplement：`奇妙的世界书DLC_型月篇2026_0126.worldbook.json`

路径：

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/奇妙的世界书DLC_型月篇2026_0126.worldbook.json
```

用途：人物档案、variants、relatedForms、doNotMerge、能力补充。

不作为事件主 source。

推荐 sourceType：

```text
user-file-character-profile
```

风险：

```text
1. 多作品混合。
2. fan/RP 设定混入。
3. 人物经历跨 continuity。
4. 超长档案不能直接覆盖 script 抽取事实。
```

### 1.7 curated story mirror

路径：

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fgo/*.md
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/chapter-archives-curated/fgo/*.json
```

用途：line-addressable mirror、校对、旧归档对比。

推荐 sourceType：

```text
curated-story-derived-from-worldbook-script
```

---

## 2. 不覆盖边界

本计划所有输出必须落在：

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-script-pilot/
```

禁止修改：

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/
```

可选 side-by-side preview，只有用户确认后才创建：

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated-v2-pilot/fgo/
```

---

## 3. 推荐顶层目录

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-script-pilot/
├── PLAN.md
├── README.md
├── source-inventory.json
├── source-classification-report.md
├── source-unit-manifest.json
├── work-packets/
│   ├── part1/
│   ├── eor/
│   ├── lostbelt/
│   └── ordeal-call/
├── sources/
│   ├── worldbook-script/
│   ├── curated-story-mirror/
│   ├── summary-crosscheck/
│   ├── character-profile-supplement/
│   └── engine-rules/
├── extracted/
│   ├── part1/
│   ├── eor/
│   ├── lostbelt/
│   └── ordeal-call/
├── normalized/
│   ├── part1/
│   ├── eor/
│   ├── lostbelt/
│   └── ordeal-call/
├── merged/
│   ├── index.json
│   ├── characters/
│   ├── events/
│   ├── relationships/
│   ├── locations/
│   ├── factions/
│   ├── systems/
│   └── world-rules/
├── timeline/
│   ├── index.json
│   ├── part1/
│   ├── eor/
│   ├── lostbelt/
│   └── ordeal-call/
├── graph/
│   ├── relationship-graph.json
│   ├── timeline-graph.json
│   ├── faction-graph.json
│   ├── character-event-bipartite.json
│   └── graph-candidates.json
├── candidates/
│   ├── relationship-candidates.json
│   ├── merge-candidates.json
│   ├── timeline-candidates.json
│   └── event-candidates.json
├── audit/
│   ├── packet-audits/
│   ├── merge-audits/
│   ├── final-audit-summary.md
│   ├── final-known-issues.json
│   └── final-pass-report.json
└── comparison/
    ├── source-coverage-diff.md
    ├── old-curated-diff.md
    ├── graph-noise-report.md
    ├── timeline-improvement-report.md
    └── migration-recommendation.md
```

---

## 4. Source unit manifest

`source-unit-manifest.json` 是 p1-plan 的核心。Worker 不应自由搜索全库，而应处理 manifest 分配的 source unit。

### 4.1 Manifest 最小模板

```json
{
  "schema": "tm-fgo-source-unit-manifest-v1",
  "worldId": "type-moon-nasuverse",
  "project": "fgo-script-pilot",
  "generatedAt": "",
  "sourceUnits": [
    {
      "unitId": "src-fgo-part1-fuyuki",
      "arc": "part1",
      "chapterId": "fgo-part1-fuyuki",
      "chapterOrder": 0,
      "sourceFile": "campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json",
      "entryIndex": 80,
      "comment": "FGO_特异点F_冬木",
      "sourceType": "user-file-worldbook-script",
      "canonStatus": "canon-like",
      "credibility": "B",
      "sections": ["world_state", "stage_characters", "world_timeline"],
      "eventCountEstimated": 11,
      "quoteCountEstimated": 22,
      "recommendedUse": [
        "event-extraction",
        "timeline-build",
        "character-periods",
        "relationship-temporal-graph"
      ],
      "sourceTextPath": "sources/worldbook-script/part1/ch-000-fuyuki.txt"
    }
  ]
}
```

### 4.2 Source classification 枚举

```text
script-like
story-summary
character-profile
world-rule
engine-rule
sandbox-rule
candidate
excluded
```

### 4.3 sourceType 枚举

```text
user-file-worldbook-script
curated-story-derived-from-worldbook-script
user-file-worldbook-summary
user-file-character-profile
sandbox-rule
rp-engine-rule
agent-inference
unknown
```

---

## 5. Work packet 结构

Work packet 是最小执行任务单元。

### 5.1 Work packet 最小模板

```json
{
  "schema": "tm-fgo-work-packet-v1",
  "packetId": "pkt-fgo-part1-fuyuki-extract",
  "stage": "chapter-extraction",
  "arc": "part1",
  "chapterId": "fgo-part1-fuyuki",
  "inputUnits": ["src-fgo-part1-fuyuki"],
  "inputSourceRefs": [
    "sources/worldbook-script/part1/ch-000-fuyuki.txt"
  ],
  "outputs": [
    "extracted/part1/fuyuki/world-state.json",
    "extracted/part1/fuyuki/stage-characters/index.json",
    "extracted/part1/fuyuki/events/*.json",
    "extracted/part1/fuyuki/dialogue/*.json",
    "extracted/part1/fuyuki/appearance-signals/*.json",
    "extracted/part1/fuyuki/ability-signals/*.json",
    "extracted/part1/fuyuki/combat-effect-signals/*.json",
    "extracted/part1/fuyuki/extraction-report.json"
  ],
  "requiredExtraction": [
    "world_state",
    "stage_characters",
    "all_timeline_events",
    "dialogue_refs",
    "appearance_descriptions",
    "ability_or_noble_phantasm_activations",
    "combat_visual_effects",
    "not_found_markers_for_required_visual_ability_fields",
    "trigger",
    "completion",
    "time_raw",
    "orderIndex"
  ],
  "forbidden": [
    "invent_calendar_dates",
    "merge_worldbook_summary_into_script_fact",
    "write_engine_rules_as_canon",
    "place_stage_character_instruction_in_canon_fact"
  ],
  "acceptance": [
    "every raw -事件X becomes one extracted event file",
    "every extracted event has sourceRefs",
    "trigger and completion are preserved",
    "dialogue lines are linked as dialogueRefs",
    "source-backed appearance / ability / combat-effect descriptions are extracted when present",
    "missing appearance / ability / combat-effect details are explicitly recorded as not-found-in-source",
    "uncertain fields use relative-only or script-raw"
  ]
}
```

---

## 6. Source text 格式

每个 script source text 必须 line-addressable，并保留原始结构。

示例：

```text
---
worldId: type-moon-nasuverse
project: fgo-script-pilot
sourceUnitId: src-fgo-part1-fuyuki
chapterId: fgo-part1-fuyuki
sourceType: user-file-worldbook-script
canonStatus: canon-like
credibility: B
sourceFile: campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
entryIndex: 80
comment: FGO_特异点F_冬木
---

# World State
<world_state>
...
</world_state>

# Stage Characters
<stage_characters>
...
</stage_characters>

# World Timeline
<world_timeline>
-事件A: ...
【玛修】...
</world_timeline>
```

sourceRef 格式：

```text
fgo/worldbook-script/part1/ch-000-fuyuki.txt#world_state
fgo/worldbook-script/part1/ch-000-fuyuki.txt#stage_characters:chaldea
fgo/worldbook-script/part1/ch-000-fuyuki.txt#event-A
fgo/worldbook-script/part1/ch-000-fuyuki.txt#event-B:quote-001
```

---

## 7. Extracted 层结构

`extracted/` 是章节局部抽取结果，不是最终 canonical 实体库。

以 Fuyuki 为例：

```text
extracted/part1/fuyuki/
├── extraction-report.json
├── audit/
│   ├── audit-round-001.json
│   ├── fix-round-001.json
│   └── final-status.json
├── world-state.json
├── stage-characters/
│   ├── index.json
│   ├── chaldea.json
│   ├── neutral.json
│   ├── shadow-servants.json
│   ├── boss.json
│   └── demon-god.json
├── events/
│   ├── event-a-prologue.json
│   ├── event-b-burning-city.json
│   └── event-k-grand-order.json
├── dialogue/
│   ├── event-a-dialogue.json
│   ├── event-b-dialogue.json
│   └── event-k-dialogue.json
├── appearance-signals/
│   ├── index.json
│   └── mash-shield-visual.json
├── ability-signals/
│   ├── index.json
│   └── mash-noble-phantasm.json
├── combat-effect-signals/
│   ├── index.json
│   └── event-h-shield-defense.json
├── mentions/
│   ├── character-mentions.json
│   ├── location-mentions.json
│   ├── system-mentions.json
│   └── relationship-signals.json
└── candidates/
    ├── uncertain-events.json
    ├── uncertain-characters.json
    └── relationship-candidates.json
```

### 7.1 Extracted event 最小模板

```json
{
  "schema": "tm-fgo-extracted-event-v1",
  "event_id": "fgo-part1-fuyuki-event-b-burning-city",
  "chapterId": "fgo-part1-fuyuki",
  "rawEventCode": "事件B",
  "title": "燃烧的城市",
  "time": {
    "raw": "2004年 凌晨",
    "value": null,
    "precision": "script-raw",
    "relative": "Fuyuki event B",
    "orderIndex": 1
  },
  "trigger": "到达特异点",
  "completion": "确立主从契约",
  "summary": "",
  "participantsRaw": [],
  "dialogueRefs": [],
  "sourceRefs": []
}
```

### 7.2 Dialogue file 最小模板

```json
{
  "schema": "tm-fgo-dialogue-refs-v1",
  "chapterId": "fgo-part1-fuyuki",
  "eventId": "fgo-part1-fuyuki-event-b-burning-city",
  "dialogues": [
    {
      "dialogueId": "q001",
      "speakerRaw": "罗曼医生",
      "speakerIdCandidate": "romani-archaman",
      "text": "",
      "sourceRefs": []
    }
  ]
}
```

### 7.3 Stage character group 最小模板

```json
{
  "schema": "tm-fgo-stage-character-group-v1",
  "chapterId": "fgo-part1-fuyuki",
  "groupId": "chaldea",
  "groupNameRaw": "迦勒底",
  "members": [
    {
      "nameRaw": "立香",
      "characterIdCandidate": "fujimaru-ritsuka",
      "rolesRaw": ["御主", "推进"],
      "sourceRefs": []
    }
  ],
  "engineInstructionRefs": [],
  "sourceRefs": []
}
```

注意：`stage_characters` 中的系统判定指令必须放入 `engineInstructionRefs` 或 engine-rules，不得写成 canon fact。

### 7.4 Appearance signal 最小模板

```json
{
  "schema": "tm-fgo-appearance-signal-v1",
  "chapterId": "fgo-part1-fuyuki",
  "characterIdCandidate": "mash-kyrielight",
  "characterNameRaw": "玛修",
  "eventRefs": [],
  "appearanceText": "",
  "outfit": "",
  "visualTraits": [],
  "equipmentVisual": [],
  "status": "source-backed | not-found-in-source",
  "notFoundReason": "",
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

### 7.5 Ability / Noble Phantasm signal 最小模板

```json
{
  "schema": "tm-fgo-ability-signal-v1",
  "chapterId": "fgo-part1-fuyuki",
  "characterIdCandidate": "mash-kyrielight",
  "characterNameRaw": "玛修",
  "abilityType": "noble-phantasm | skill | magecraft | authority | transformation | summoning | other",
  "abilityNameRaw": "",
  "activationScene": "",
  "visualEffect": "",
  "mechanicalEffect": "",
  "target": "",
  "costOrConsequence": "",
  "eventRefs": [],
  "status": "source-backed | not-found-in-source",
  "notFoundReason": "",
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

### 7.6 Combat effect signal 最小模板

```json
{
  "schema": "tm-fgo-combat-effect-signal-v1",
  "chapterId": "fgo-part1-fuyuki",
  "eventId": "fgo-part1-fuyuki-event-h",
  "actorRaw": "玛修",
  "effectType": "attack | defense | noble-phantasm | sacrifice | transformation | summoning | field-effect | other",
  "description": "",
  "visualEffect": "",
  "result": "",
  "affectedTargets": [],
  "status": "source-backed | not-found-in-source",
  "notFoundReason": "",
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

规则：外貌、宝具/技能、战斗演出不得从游戏常识、wiki 印象或模型记忆补写。source 中没有明确描述时，必须保留 `not-found-in-source` 记录；不能静默缺失。

---

## 8. Normalized 层结构

`normalized/` 是从章节抽取结果转换来的实体碎片。它不是最终 canonical。

```text
normalized/part1/fuyuki/
├── characters/
│   ├── fujimaru-ritsuka.fragment.json
│   ├── mash-kyrielight.fragment.json
│   ├── olga-marie-animusphere.fragment.json
│   ├── romani-archaman.fragment.json
│   ├── cu-chulainn-caster.fragment.json
│   ├── saber-alter.fragment.json
│   └── lev-lainur.fragment.json
├── events/
│   ├── fgo-part1-fuyuki-event-a.json
│   ├── fgo-part1-fuyuki-event-b.json
│   └── ...
├── relationships/
│   ├── fujimaru-mash-contract-fuyuki.json
│   ├── olga-marie-chaldea-command-fuyuki.json
│   └── cu-caster-temporary-alliance.json
├── appearances/
│   ├── mash-kyrielight.fragment.json
│   └── not-found-index.json
├── abilities/
│   ├── mash-lord-chaldeas.fragment.json
│   └── not-found-index.json
├── combat-effects/
│   ├── event-h-shield-defense.json
│   └── not-found-index.json
├── locations/
│   ├── fuyuki-city.json
│   ├── fuyuki-leyline.json
│   └── greater-grail-cavern.json
└── systems/
    ├── rayshift.json
    ├── demi-servant-contract.json
    └── grand-order-mission.json
```

### 8.1 Character fragment 最小模板

```json
{
  "schema": "tm-fgo-character-fragment-v1",
  "character_id": "mash-kyrielight",
  "chapterId": "fgo-part1-fuyuki",
  "observedNames": ["玛修", "玛修·基列莱特"],
  "observedRoles": ["亚从者", "守护"],
  "observedStatus": {},
  "eventRefs": [],
  "relationshipSignals": [],
  "appearanceRefs": [],
  "abilityRefs": [],
  "combatEffectRefs": [],
  "sourceRefs": []
}
```

### 8.2 Appearance fragment 最小模板

```json
{
  "schema": "tm-fgo-appearance-fragment-v1",
  "characterId": "mash-kyrielight",
  "characterName": "玛修·基列莱特",
  "chapterId": "fgo-part1-fuyuki",
  "periodId": "part1-fuyuki",
  "appearanceText": "",
  "outfit": "",
  "visualTraits": [],
  "equipmentVisual": [],
  "status": "source-backed | not-found-in-source",
  "notFoundReason": "",
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

### 8.3 Ability fragment 最小模板

```json
{
  "schema": "tm-fgo-ability-fragment-v1",
  "characterId": "mash-kyrielight",
  "characterName": "玛修·基列莱特",
  "chapterId": "fgo-part1-fuyuki",
  "abilityType": "noble-phantasm | skill | magecraft | authority | transformation | summoning | other",
  "name": "",
  "activationScene": "",
  "visualEffect": "",
  "mechanicalEffect": "",
  "target": "",
  "costOrConsequence": "",
  "eventRefs": [],
  "status": "source-backed | not-found-in-source",
  "notFoundReason": "",
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

### 8.4 Combat effect fragment 最小模板

```json
{
  "schema": "tm-fgo-combat-effect-fragment-v1",
  "chapterId": "fgo-part1-fuyuki",
  "eventId": "fgo-part1-fuyuki-event-h",
  "actor": "mash-kyrielight",
  "effectType": "attack | defense | noble-phantasm | sacrifice | transformation | summoning | field-effect | other",
  "description": "",
  "visualEffect": "",
  "result": "",
  "affectedTargets": [],
  "status": "source-backed | not-found-in-source",
  "notFoundReason": "",
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

---

## 9. Merged 层：per-entity canonical files

正式实体必须拆文件，不得塞入单个大 JSON。

```text
merged/
├── index.json
├── characters/
│   ├── index.json
│   ├── chaldea/
│   ├── servants/
│   ├── beasts/
│   ├── crypters/
│   └── npc/
├── events/
│   ├── index.json
│   ├── part1/
│   ├── eor/
│   ├── lostbelt/
│   └── ordeal-call/
├── relationships/
│   ├── index.json
│   ├── contracts/
│   ├── alliances/
│   ├── enemies/
│   ├── identities/
│   ├── master-servant/
│   ├── organization-membership/
│   └── revelations/
├── appearances/
│   ├── index.json
│   └── part1/
├── abilities/
│   ├── index.json
│   └── part1/
├── combat-effects/
│   ├── index.json
│   └── part1/
├── locations/
├── factions/
├── systems/
└── world-rules/
```

### 9.1 Character 目录式结构

跨长线角色推荐目录式：

```text
merged/characters/chaldea/mash-kyrielight/
├── character.json
├── periods/
│   ├── part1-fuyuki.json
│   ├── part1-orleans.json
│   ├── part1-camelot.json
│   ├── part1-solomon.json
│   ├── lostbelt-ortinax.json
│   └── lb6-fairy-britain.json
├── abilities/
│   ├── lord-chaldeas.json
│   ├── lord-camelot.json
│   └── ortinax.json
└── index.json
```

外貌、宝具/技能、战斗演出也必须进入 canonical 层。推荐结构：

```text
merged/appearances/part1/<character>/<chapter-or-period>.json
merged/abilities/part1/<character>/<ability>.json
merged/combat-effects/part1/<chapter>/<effect>.json
```

### 9.2 character.json 最小模板

```json
{
  "schema": "tm-fgo-character-v1",
  "character_id": "mash-kyrielight",
  "name": {
    "zh": "玛修·基列莱特",
    "ja": "",
    "en": "Mash Kyrielight"
  },
  "entityType": "character",
  "continuity": "fgo",
  "canonicalStatus": "canon-like",
  "sourceType": "user-file-worldbook-script",
  "periodRefs": [],
  "relationshipRefs": [],
  "eventRefs": [],
  "appearanceRefs": [],
  "abilityRefs": [],
  "combatEffectRefs": [],
  "sourceRefs": []
}
```

### 9.3 period 最小模板

```json
{
  "schema": "tm-fgo-character-period-v1",
  "character_id": "mash-kyrielight",
  "period_id": "part1-fuyuki",
  "timelineId": "fgo-part1-fuyuki",
  "chapterId": "fgo-part1-fuyuki",
  "timeRange": {
    "start": {
      "raw": "2015年7月30日 15:00 / 2004年 凌晨",
      "precision": "script-raw",
      "relative": "Fuyuki event A-B",
      "orderIndex": 0
    },
    "end": {
      "raw": "2004年 早上",
      "precision": "script-raw",
      "relative": "Fuyuki event K",
      "orderIndex": 10
    }
  },
  "status": {},
  "knowledgeState": [],
  "abilityRefs": [],
  "eventRefs": [],
  "relationshipRefs": [],
  "sourceRefs": []
}
```

### 9.4 Appearance canonical 文件

```json
{
  "schema": "tm-fgo-character-appearance-v1",
  "characterId": "mash-kyrielight",
  "characterName": "玛修·基列莱特",
  "chapterId": "fgo-part1-fuyuki",
  "periodId": "part1-fuyuki",
  "appearanceText": "",
  "outfit": "",
  "visualTraits": [],
  "equipmentVisual": [],
  "status": "source-backed | not-found-in-source",
  "notFoundReason": "",
  "fragmentRefs": [],
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

### 9.5 Ability / Noble Phantasm canonical 文件

```json
{
  "schema": "tm-fgo-ability-v1",
  "characterId": "mash-kyrielight",
  "characterName": "玛修·基列莱特",
  "abilityType": "noble-phantasm | skill | magecraft | authority | transformation | summoning | other",
  "name": "Lord Chaldeas",
  "activationScene": "",
  "visualEffect": "",
  "mechanicalEffect": "",
  "target": "",
  "costOrConsequence": "",
  "eventRefs": [],
  "fragmentRefs": [],
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

### 9.6 Combat effect canonical 文件

```json
{
  "schema": "tm-fgo-combat-effect-v1",
  "chapterId": "fgo-part1-fuyuki",
  "eventId": "fgo-part1-fuyuki-event-h",
  "actor": "mash-kyrielight",
  "effectType": "attack | defense | noble-phantasm | sacrifice | transformation | summoning | field-effect | other",
  "description": "",
  "visualEffect": "",
  "result": "",
  "affectedTargets": [],
  "fragmentRefs": [],
  "sourceRefs": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "canonStatus": "canon-like"
}
```

### 9.7 Event canonical 文件

```text
merged/events/part1/fuyuki/event-a-prologue.json
merged/events/part1/fuyuki/event-b-burning-city.json
...
```

Event 最小模板：

```json
{
  "schema": "tm-fgo-event-v1",
  "event_id": "fgo-part1-fuyuki-event-b-burning-city",
  "chapterId": "fgo-part1-fuyuki",
  "timelineId": "fgo-part1-fuyuki",
  "rawEventCode": "事件B",
  "title": "燃烧的城市",
  "time": {
    "raw": "2004年 凌晨",
    "value": null,
    "precision": "script-raw",
    "relative": "Fuyuki event B",
    "orderIndex": 1
  },
  "trigger": "到达特异点",
  "completion": "确立主从契约",
  "summary": "",
  "participants": [],
  "locationRefs": [],
  "dialogueRefs": [],
  "stateChanges": [],
  "relationshipChanges": [],
  "sourceType": "user-file-worldbook-script",
  "credibility": "B",
  "sourceRefs": []
}
```

### 9.8 Relationship canonical 文件

```text
merged/relationships/master-servant/fujimaru-mash-contract-fuyuki.json
merged/relationships/enemies/chaldea-vs-goetia-solomon.json
merged/relationships/identities/romani-solomon-revelation.json
```

Relationship 最小模板：

```json
{
  "schema": "tm-fgo-relationship-v1",
  "edge_id": "fujimaru-mash-contract-fuyuki",
  "from": "fujimaru-ritsuka",
  "to": "mash-kyrielight",
  "type": "master-servant-contract",
  "timelineId": "fgo-part1-fuyuki",
  "timeRange": {
    "start": {
      "raw": "2004年 凌晨",
      "precision": "script-raw",
      "relative": "Fuyuki event B",
      "orderIndex": 1
    },
    "end": {
      "relative": "continues across Part 1",
      "precision": "relative-only"
    }
  },
  "eventRefs": [],
  "sourceRefs": []
}
```

---

## 10. Timeline 是索引，不吞事件正文

```text
timeline/
├── index.json
├── part1/
│   ├── fuyuki.json
│   ├── orleans.json
│   ├── septem.json
│   ├── okeanos.json
│   ├── london.json
│   ├── america.json
│   ├── camelot.json
│   ├── babylonia.json
│   └── solomon.json
├── eor/
├── lostbelt/
└── ordeal-call/
```

Timeline 文件只保存排序和 eventRef：

```json
{
  "schema": "tm-fgo-timeline-v1",
  "timelineId": "fgo-part1-fuyuki",
  "chapterId": "fgo-part1-fuyuki",
  "events": [
    {
      "eventRef": "merged/events/part1/fuyuki/event-a-prologue.json",
      "orderIndex": 0,
      "rawTime": "2015年7月30日 15:00"
    }
  ],
  "sourceRefs": []
}
```

---

## 11. Graph 是派生层

Graph 可以单文件，但必须引用正式实体文件，不能成为事实唯一来源。

```text
graph/
├── relationship-graph.json
├── timeline-graph.json
├── faction-graph.json
├── character-event-bipartite.json
└── graph-candidates.json
```

Graph edge 示例：

```json
{
  "edge_id": "fujimaru-mash-contract-fuyuki",
  "edgeRef": "merged/relationships/master-servant/fujimaru-mash-contract-fuyuki.json",
  "fromRef": "merged/characters/chaldea/fujimaru-ritsuka/character.json",
  "toRef": "merged/characters/chaldea/mash-kyrielight/character.json"
}
```

禁止：

```text
只在 graph 中保存关系事实。
把 co-occurrence candidate 写入 formal relationship graph。
把 特异点/异闻带/灵基/职阶/英灵 等概念放入 character graph。
```

---

## 12. Stage 规划

### Stage -1: Source classification

目标：对所有 FGO 相关 source 进行分类。

输入：

```text
[沙盒]FGO 0.8.worldbook.json
型月 (1).worldbook.json
奇妙的世界书DLC_型月篇2026_0126.worldbook.json
curated/stories/fgo/*.md
chapter-archives-curated/fgo/*.json
```

输出：

```text
source-inventory.json
source-classification-report.md
source-unit-manifest.draft.json
```

验收：

```text
script-like entries 全部列出。
engine/ejs/mvu 规则已排除出 formal facts。
summary 与 character profile 没有混入 script primary。
```

### Stage 0: Script unitization

目标：把 script-like worldbook entries 转为 line-addressable source text。

输出：

```text
sources/worldbook-script/part1/*.txt
sources/worldbook-script/eor/*.txt
sources/worldbook-script/lostbelt/*.txt
sources/worldbook-script/ordeal-call/*.txt
source-unit-manifest.json
```

### Stage 1: Work packet generation

目标：按 source unit 生成 packet。

Part 1 packet：

```text
pkt-fgo-part1-fuyuki-extract
pkt-fgo-part1-orleans-extract
pkt-fgo-part1-septem-extract
pkt-fgo-part1-okeanos-extract
pkt-fgo-part1-london-extract
pkt-fgo-part1-america-extract
pkt-fgo-part1-camelot-extract
pkt-fgo-part1-babylonia-extract
pkt-fgo-part1-solomon-extract
```

输出：

```text
work-packets/part1/*.json
```

### Stage 2: Per-chapter extraction

每个 packet 产生 extracted shards：

```text
world-state.json
stage-characters/*.json
events/*.json
dialogue/*.json
appearance-signals/*.json
ability-signals/*.json
combat-effect-signals/*.json
mentions/*.json
candidates/*.json
```

### Stage 3: Chapter audit/fix loop

每个 chapter packet 必须执行三 agent 闭环：

```text
Generator → Auditor → Fixer → Auditor rerun
```

该循环不限制轮数。packet 不 passed 不得进入 normalization、merge 或 graph/timeline 构建。

通过条件：

```text
final-status.status == passed
openIssues == 0
blockedIssues == 0
latestAudit.status == passed
canAdvance == true
```

禁止跳过：

```text
failed
partial
blocked
openIssues > 0
blockedIssues > 0
latestAudit.status != passed
```

`known-issues.json` 只能记录当前阻塞项或迁移风险，不能作为跳过审核的出口。

#### Generator 职责

输入：

```text
work-packet.json
source-unit-manifest.json
line-addressable source text
schema templates
```

输出：

```text
extracted/<arc>/<chapter>/**
extraction-report.json
reports/generation-report.json
```

Generator 必须：

```text
1. 抽取 source 中所有 -事件X。
2. 保留 rawEventCode、title、raw time、trigger、completion。
3. 为每条【角色】台词建立 dialogueRef。
4. 抽取 world_state、stage_characters、world_timeline。
5. 抽取 source-backed 外貌、服装、装备视觉、宝具/技能发动、战斗演出效果。
6. 若 source 对这些强制面没有明确描述，写入 not-found-in-source 记录，不得静默遗漏。
7. 把不确定实体放入 candidates。
8. 不跨 packet 扩大范围。
```

Generator 禁止：

```text
编造日期。
补写 source 中没有的事件。
把 summary worldbook 覆盖为 script fact。
把 engine/ejs/mvu 规则写成剧情事实。
把 stage_characters 的系统判定指令写成 canon fact。
```

#### Auditor 职责

Auditor 必须只读。

输入：

```text
work-packet.json
source text
extracted outputs
generation-report.json
```

输出：

```text
audit/audit-round-NNN.json
issues/open-issues.json
issues/blocked-issues.json
issues/resolved-issues.json
```

Auditor 必查：

```text
每个 -事件X 都被抽取。
每个事件保留 rawEventCode、title、raw time、trigger、completion。
每条【角色】台词有 dialogueRef 或 skipped reason。
未编造具体日期。
stage_characters 中系统判定指令没有进入 canon facts。
engine/ejs/mvu 条目没有进入剧情事实。
所有正式条目有 sourceRefs。
外貌、宝具/技能、战斗演出有 source-backed shard 或 not-found-in-source 记录。
这些 shard 不得使用游戏常识、wiki 印象或模型记忆补写。
每个 JSON 合法。
每个 extracted event 能回溯到 sourceRef。
```

#### Fixer 职责

输入：

```text
audit-round-NNN.json
open-issues.json
extracted outputs
```

输出：

```text
修复后的 extracted outputs
fix-round-NNN.json
更新后的 open/resolved/blocked issues
```

Fixer 必须：

```text
1. 只修 Auditor 指出的 issue。
2. 若事实无 source 支持，则删除 formal 或降级到 candidates。
3. 若时间无法确定，使用 script-raw / relative-only，不得编造日期。
4. 若连续两轮同一 issue 未解决，必须改变策略或标记 blocked。
5. 若 source 缺失或规则冲突，标记 blocked 并请求 Parent 决策。
```

Fixer 禁止：

```text
修改 source text。
修改旧 curated。
扩大修复范围到未被 audit 标记的文件。
只修 graph/timeline 派生层而不修源层。
```

### Stage 4: Normalization

目标：把 extracted chapter shards 转为 normalized entity fragments。

输出：

```text
normalized/part1/<chapter>/characters/*.fragment.json
normalized/part1/<chapter>/events/*.json
normalized/part1/<chapter>/relationships/*.json
normalized/part1/<chapter>/appearances/*.json
normalized/part1/<chapter>/abilities/*.json
normalized/part1/<chapter>/combat-effects/*.json
normalized/part1/<chapter>/locations/*.json
normalized/part1/<chapter>/systems/*.json
```

### Stage 5: Tree merge

树状合并：

```text
chapter extracted/normalized
  → chapter canonical merge
  → arc merge: part1
  → fgo-global merge
```

Part 1 merge 输出：

```text
merged/characters/**/character.json
merged/characters/**/periods/*.json
merged/events/part1/**/*.json
merged/relationships/**/*.json
merged/appearances/part1/**/*.json
merged/abilities/part1/**/*.json
merged/combat-effects/part1/**/*.json
merged/locations/part1/**/*.json
merged/systems/*.json
merged/world-rules/*.md
timeline/part1/*.json
```

### Stage 6: Part 1 graph/timeline build

输出：

```text
timeline/part1/fuyuki.json
...
timeline/part1/solomon.json
timeline/part1/index.json
graph/relationship-graph.json
graph/timeline-graph.json
graph/faction-graph.json
graph/character-event-bipartite.json
```

### Stage 7: Part 1 final audit

审核重点：

```text
玛修从 Fuyuki 到 Solomon 的状态变化。
罗曼/所罗门/盖提亚身份揭示不提前泄漏。
Saber Alter、狮子王、Artoria variants 不错误合并。
每个事件都有 sourceRef。
每个 relationship edge 有 timelineId/timeRange。
外貌、宝具/技能、战斗演出层有 source-backed 记录或 not-found-in-source 记录。
co-occurrence 不进 formal graph。
```

### Stage 8: Expansion after Part 1 passed

只有 Part 1 passed 后再扩展：

```text
EoR
Lostbelt 1-5
Lostbelt 6-7
Ordeal Call
```

---

## 13. Packet 三 Agent 报告模板

### 13.1 generation-report.json

```json
{
  "schema": "tm-fgo-generation-report-v1",
  "packetId": "pkt-fgo-part1-fuyuki-extract",
  "chapterId": "fgo-part1-fuyuki",
  "status": "generated",
  "generatedAt": "",
  "sourceUnitsRead": [],
  "sourceRefsRead": [],
  "filesCreated": [],
  "filesUpdated": [],
  "counts": {
    "worldState": 1,
    "stageCharacterGroups": 0,
    "events": 0,
    "dialogues": 0,
    "appearanceSignals": 0,
    "abilitySignals": 0,
    "combatEffectSignals": 0,
    "notFoundAppearanceRecords": 0,
    "notFoundAbilityRecords": 0,
    "notFoundCombatEffectRecords": 0,
    "mentions": 0,
    "candidates": 0
  },
  "uncertainties": [],
  "candidateOnlyItems": []
}
```

### 13.2 audit-round-NNN.json

```json
{
  "schema": "tm-fgo-audit-report-v1",
  "packetId": "pkt-fgo-part1-fuyuki-extract",
  "chapterId": "fgo-part1-fuyuki",
  "round": 1,
  "status": "passed",
  "auditedAt": "",
  "filesChecked": [],
  "sourceRefsVerified": 0,
  "rawEventsExpected": 0,
  "rawEventsExtracted": 0,
  "dialogueLinesExpected": 0,
  "dialogueLinesExtracted": 0,
  "appearanceAbilityCombatCoverage": {
    "sourceBackedRecords": 0,
    "notFoundRecords": 0,
    "missingCoverage": 0
  },
  "issues": [],
  "summary": {
    "errors": 0,
    "warnings": 0,
    "blocked": 0
  }
}
```

Issue 最小结构：

```json
{
  "issueId": "PKT-FUYUKI-A-001",
  "severity": "error",
  "category": "missing-event|missing-dialogue|missing-appearance|missing-ability|missing-combat-effect|fabrication|schema|sourceRef|engine-rule-leak|timeline|character-type|relationship",
  "file": "extracted/part1/fuyuki/events/event-b-burning-city.json",
  "path": "trigger",
  "detail": "",
  "expected": "",
  "sourceRefs": [],
  "status": "open"
}
```

### 13.3 fix-round-NNN.json

```json
{
  "schema": "tm-fgo-fix-report-v1",
  "packetId": "pkt-fgo-part1-fuyuki-extract",
  "chapterId": "fgo-part1-fuyuki",
  "round": 1,
  "status": "fixed",
  "fixedAt": "",
  "issuesHandled": [
    {
      "issueId": "PKT-FUYUKI-A-001",
      "action": "set|merge|delete|move-to-candidates|add-sourceRef|split-file",
      "file": "",
      "result": "fixed|blocked|unresolved",
      "notes": ""
    }
  ],
  "filesChanged": [],
  "unresolvedIssues": []
}
```

### 13.4 final-status.json

```json
{
  "schema": "tm-fgo-packet-final-status-v1",
  "packetId": "pkt-fgo-part1-fuyuki-extract",
  "chapterId": "fgo-part1-fuyuki",
  "status": "passed",
  "passedAt": "",
  "totalRounds": 0,
  "openIssues": 0,
  "blockedIssues": 0,
  "latestAuditReport": "",
  "latestFixReport": "",
  "canAdvance": true
}
```

`canAdvance` 只有在以下条件同时满足时才能为 true：

```text
status == passed
openIssues == 0
blockedIssues == 0
latestAuditReport.status == passed
```

## 14. Merge / Graph / Timeline 三 Agent 循环

Chapter packet 通过后，merge、graph、timeline 也必须执行三 agent 循环。

### 14.1 Merge loop

```text
Merger → Merge-Auditor → Merge-Fixer → Merge-Auditor rerun
```

Merge-Auditor 必查：

```text
per-character directory 是否存在。
periods 是否按 timeline/orderIndex 排序。
同名角色是否错误合并。
Artoria variants 是否通过 relatedForms/doNotMerge 区分。
罗曼/所罗门/盖提亚身份揭示是否按时间保留。
sourceRefs 是否在 merge 中丢失。
```

### 14.2 Timeline loop

```text
Timeline-Builder → Timeline-Auditor → Timeline-Fixer → Timeline-Auditor rerun
```

Timeline-Auditor 必查：

```text
timeline 只保存 eventRef 与排序，不吞事件正文。
事件顺序与 source raw event order 一致。
raw time 保留。
不编造 YYYY-MM-DD。
跨章节 orderIndex 不冲突。
```

### 14.3 Graph loop

```text
Graph-Builder → Graph-Auditor → Graph-Fixer → Graph-Auditor rerun
```

Graph-Auditor 必查：

```text
graph 只引用 canonical files。
edgeRef 指向 merged/relationships 下的正式关系文件。
concept/system/location/faction 不进入 character graph。
co-occurrence 只在 candidates。
formal edge 有 sourceRefs、timelineId、timeRange。
```

Graph-Fixer 必须修 canonical source layer，禁止只修 graph 派生文件。

## 15. Agent 模型与工具约束

沿用 Type-Moon p1-hybrid 约束。

模型：

```text
lt-yuyu/gpt-5.5
```

不可用时：

```text
blocked，不自动降级
```

并发建议：

```text
concurrency: 3
```

禁止 subagent 工具：

```text
bash
shell
python
node
deno
powershell
cmd
任意可执行脚本调用
```

允许工具：

```text
read
json_tool
json_struct_read
json_struct_edit
write
edit
```

Auditor 只读：

```text
read
json_tool
json_struct_read
```

---

## 16. 推荐 Batch 划分

### Batch 1: FGO Part 1 Script Pilot

范围：

```text
entry 80 Fuyuki
entry 81 Orleans
entry 82 Septem
entry 83 Okeanos
entry 84 London
entry 85 America
entry 86 Camelot
entry 87 Babylonia
entry 88 Solomon
```

这是最小可验证 p1-plan。

### Batch 2: Epic of Remnant

```text
entry 89 Shinjuku
entry 90 Agartha
entry 91 Shimousa
entry 92 Salem
```

### Batch 3: Lostbelt 1-5

```text
entry 93 LB1
entry 94 LB2
entry 95 LB3
entry 96 LB4
entry 97 LB5-1
entry 98 LB5-2
```

### Batch 4: Lostbelt 6-7

```text
entry 100 LB6-1
entry 117 LB6-2
LB7 source 需重新确认 entryIndex
```

LB6 建议单独大 batch，因为妖精历和女王历需要独立 timeline。

### Batch 5: Ordeal Call

```text
entry 104 OC I
entry 105 OC II
entry 106 OC III
```

---

## 17. Part 1 查询验收

Part 1 pilot 完成后，至少应能回答：

```text
1. Fuyuki 中藤丸与玛修何时确立契约？证据在哪个事件？
2. 玛修在 Fuyuki、Camelot、Solomon 的状态如何变化？
3. 罗曼医生在 Solomon 之前的身份信息是否被正确延迟揭示？
4. 七大特异点按什么顺序修复？
5. 每个特异点的异常根源是什么？
6. 每章 stage_characters 中哪些角色是友方、敌方、BOSS、系统外干涉者？
7. 哪些关系是临时同盟，哪些是主从契约，哪些是敌对？
8. Artoria 相关角色是否被正确区分：Saber Alter、狮子王、普通 Artoria？
9. 终局所罗门中罗曼/所罗门/盖提亚关系如何表示？
10. graph 中是否没有把“特异点”“从者”“灵基”当 character？
```

---

## 18. Final acceptance

通过条件：

```text
1. source-unit-manifest.json 完整列出 Part 1 source units。
2. 每个 Part 1 source unit 有 line-addressable source text。
3. 每个 Part 1 chapter 有 extracted/world-state.json。
4. 每个 Part 1 chapter 的所有 -事件X 都有独立 event JSON。
5. 每个 event 保留 rawEventCode、raw time、trigger、completion、sourceRefs。
6. 每个 dialogue line 有 dialogueRef 或明确记录 skipped reason。
7. characters 使用 per-entity file 或 per-character directory，不使用单一 characters.json。
8. events 使用 per-event file，不使用单一 events.json。
9. relationships 使用 per-edge/per-group file，不使用单一 relationships.json。
10. timeline 只做 eventRef 排序，不吞事件正文。
11. graph 只引用 canonical files，不作为唯一事实源。
12. 每个 packet 的 audit/fix loop passed。
13. Part 1 merge audit passed。
14. old curated 未被覆盖。
15. migration-recommendation.md 已生成。
16. 每章存在 appearance / ability / combat-effect 抽取层。
17. 有明确 source 描述的外貌、宝具/技能、战斗演出进入 source-backed shard。
18. source 未明确描述的强制面以 not-found-in-source 记录，不静默缺失。
19. merged/appearances、merged/abilities、merged/combat-effects canonical 层与索引已生成。
20. 上述正式文件均带 sourceRefs、sourceType、credibility、canonStatus。
```

---

## 19. 推荐下一步

不要直接执行全 FGO。下一步建议只执行：

```text
Batch 1: FGO Part 1 Script Pilot
```

执行前先只读生成：

```text
source-unit-manifest.draft.json
work-packets/part1/*.draft.json
execution-plan-for-current-run.md
```

等待确认后，再构建 source text 与 packet 输出。

## 20. 三 Agent 强制执行协议


FGO script p1 后续所有新批次、补审、补修和 retrospective correction 以以下文件为最高执行约束：

```text
rules/type-moon-three-agent-loop-rules.md
docs/type-moon-three-agent-loop-protocol.md
```

强制执行规则：

```text
1. Packet / merge / graph / timeline / final-fix 必须使用分离的 Generator、Auditor、Fixer、Auditor rerun。
2. 单 agent 内部自称完成三 agent 循环不满足本计划。
3. Auditor 只读；Fixer 只修 Auditor 指定 blocking/required issues。
4. Nonblocking risk 默认只记录，不修复。
5. Parent 不得生成事实内容、补 canonical layer、补 wrapper、补 relationship edge、从 extracted/normalized 派生 formal outputs。
6. Partial / failed output 不得推进下游；只能重试同一阶段或按用户确认的新计划执行。
7. 缺 final-status.json 时，不得由 parent 机械补 wrapper；必须由 Fixer/Auditor rerun 产出。
8. 对既有非严格执行批次，只能走 Retrospective Auditor → Fixer → Auditor rerun。
```

所有 future batch prompt 必须显式引用上述规则文件，并在任务范围中写明：不得执行计划外事项。
