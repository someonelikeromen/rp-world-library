# 卷级数据提取方案（通用版）— 一卷十产 + 三 agent 审核闭环

> 基于 hidan-no-aria 实战方案通用化
> 适用于任何已有 raw-text 原文的世界观

---

## 零、参数化配置

每次执行前，将以下参数替换为实际值：

| 参数 | 示例值 | 说明 |
|:-----|:--------|:-----|
| `{WORLD}` | `campione` | 世界 slug，对应 `worlds/{WORLD}/` |
| `{WORLD_NAME}` | `弑神者` | 世界中文学名 |
| `{SERIES_LIST}` | `["campione-main","campione-shiniki"]` | 系列列表，每系列独立 raw-text 目录 |
| `{VOLUME_TOTAL}` | `26` | 总卷数（系列合计） |
| `{OUTPUT_DIR}` | `campaigns/world-library/manual-curation/{WORLD}-p1-output` | 输出根目录 |
| `{SOURCE_BASE}` | `campaigns/world-library/worlds/{WORLD}/sources/raw-text` | 原文根目录 |
| `{CHAPTER_PATTERN}` | `full.txt` 或 `split` | 卷内章节文件模式 |
| `{TEMPLATE_DIR}` | `{OUTPUT_DIR}/_templates` | 模板目录 |

---

## 一、目标

每读一卷原文 → 产出 10 类数据文件：

```
每读一卷，产出：
├── characters/{id}.json    ← 角色（periods 增量追加）
├── abilities/{id}.json     ← 能力
├── items/{id}.json         ← 物品
├── events/{id}.json        ← 事件
├── locations/{id}.json     ← 地点
├── systems/{id}.json       ← 体系/等级
├── factions/{id}.json      ← 势力
├── world.json              ← 世界观总览（单文件增量更新）
├── knowledge/{id}.json     ← 情报/秘密
└── index.json              ← 全量索引（动态更新）
```

所有产出基于原文，不猜测不编造。每个字段必须带 `sourceRef`。

---

## 二、先验步骤：准备模板与初始索引

在启动卷级循环前，先建好结构和模板：

### 2.1 创建输出目录

```
{OUTPUT_DIR}/
├── _templates/               ← 下面 2.2
├── characters/
├── abilities/
├── items/
├── events/
├── locations/
├── systems/
├── factions/
├── knowledge/
├── world.json
└── index.json
```

### 2.2 创建模板文件 `_templates/`

直接从附录 A 复制，放在 `{OUTPUT_DIR}/_templates/` 下。首次拷贝后，可根据世界特性追加该世界特有的字段。

模板列表：
```
_templates/character.json    ← 角色（rp-character-v3）
_templates/ability.json      ← 能力（rp-ability-v3）
_templates/item.json         ← 物品（rp-item-v3）
_templates/event.json        ← 事件（rp-event-v1）
_templates/location.json     ← 地点（rp-location-v1）
_templates/system.json       ← 体系（rp-system-v1）
_templates/faction.json      ← 势力（rp-faction-v1）
_templates/knowledge.json    ← 情报（rp-knowledge-v1）
_templates/world.json        ← 世界观（rp-world-v1）
```

### 2.3 创建初始 `index.json`

```json
{
  "_schema": "rp-index-v1",
  "world": "{WORLD}",
  "worldName": "{WORLD_NAME}",
  "lastUpdated": "",
  "totalVolumes": {VOLUME_TOTAL},
  "volumesProcessed": 0,
  "series": {SERIES_LIST},
  "characters": [],
  "abilities": [],
  "items": [],
  "events": [],
  "locations": [],
  "systems": [],
  "factions": [],
  "knowledge": []
}
```

---

## 三、卷原文读取策略

根据 `{CHAPTER_PATTERN}` 选择读取方式：

### 方式 A：合并文件（`full.txt` 模式）

一卷只有一个 `full.txt`，所有章节连续排列。

```
raw-text/{series}/vol-XX/
├── full.txt              ← 全卷合并文本
```

读取方式：先读 `split-text/{series}/vol-XX/chapters.json`（如果存在）获取行范围；
如果不存在，agent 需读全文自行识别章节边界。

sourceRef 使用行号：`{series}/vol-XX/full.txt:{startLine}-{endLine}`

### 方式 B：拆分文件（`split` 模式）

每章一个独立 `.txt` 文件。

```
raw-text/{series}/vol-XX/
├── 01-序章.txt
├── 02-第一章 ...txt
├── 03-...txt
├── _manifest.json         ← 章节目录元数据（可选）
```

读取方式：先读 `_manifest.json`（如果存在）获取章节列表；
每次只读当前处理的章节文件，减少 token 消耗。

sourceRef 使用文件名：`{series}/vol-XX/02-第一章...txt`

### 方式 C：混合模式

如果一个世界既有 `full.txt` 又有拆分文件，优先用拆分（粒度更精确）。
如果只有 `full.txt`，则用方式 A。

---

## 四、核心流程：父进程控制循环

```
Parent 控制循环，每卷一次：

  ┌─ Step 1: start Agent A（工人）
  │   → 读 vol-XX 原文（按第三章的策略）
  │   → 写所有 10 类数据文件 + index.json
  │   → 完成
  │     ↓
  ├─ Step 2: start Agent B（审核）
  │   → 收到 A 已完成的状态
  │   → 自己读 A 写的文件 + 对照原文
  │   → 输出 issues[] 清单
  │   → 完成
  │     ↓
  ├─ Step 3: Parent 检查 issues
  │   ├─ issues = [] → 进下一卷
  │   ├─ issues > 0 → Parent 决定是否要修
  │   │   ├─ 要修 → Step 4
  │   │   └─ 不修 → 记录 TODO，进下一卷
  │     ↓
  ├─ Step 4: start Agent C（修复）
  │   → 收到 B 的 issues 清单
  │   → 按 issues 逐一修复
  │   → 新建缺失的文件、修正引用关系
  │   → 更新 index.json
  │   → 完成
  │     ↓
  └─ Step 5: 回到 Step 2（重复审核）
      → 再次启动 Agent B 检查修复结果
      → 直到 issues = 0 才进下一卷
```

每次进入下一卷，3 个 agent 都重新启动，不保留上一卷的记忆。

---

## 五、三 agent 隔离设计

| | Agent A（工人） | Agent B（审核） | Agent C（修复） |
|:--|:---------------|:---------------|:---------------|
| 触发 | parent 手动 start | parent 手动 start | parent 手动 start |
| 知道前一个 | 不知道 | 只收到完成状态 | 收到 issue 列表 |
| 接收数据 | — | 不接收，自己读文件 | 接收 issues[] 文本 |
| 工具 | read + write | read only | read + write（只修指出的文件）|
| 输出 | JSON 文件（write 写盘） | issues[] 文本 | 修复后的文件 |
| 上下文 | 当前卷原文 + 当前索引 | 所有已产出文件 + 原文 | issues[] + 模板 |

### 5.1 ACK-first 约束（所有 agent 通用）

所有 Agent A/B/C 的 system prompt 必须包含以下约束，避免首轮长输出触发 RPC timeout：

- **首轮必须以一行 `ACK` 开头，并在同一轮立即调用至少一个工具**（通常先 read 目标文件/模板）。
- 首轮不得输出长计划、长分析、完整修复方案或大段说明。
- 严禁只输出 `ACK` 后结束；如果最终产物只有 `ACK`，视为无效运行，必须重试。
- `ACK` 后继续读取、审核或修复工作，最终回复必须列出实际检查/修改结果。
- 目的：避免首轮 prompt 过长时触发 `RPC command prompt timed out waiting for response`。
- Parent 不得因 ACK 后等待时间较长而手动审核/手动修复；继续用 `run_status waitSeconds=300` 等待子代理最终产物。
- 如果 ACK-first 后仍出现首轮 RPC timeout，说明不是长输出问题；必须继续拆分任务或切换可用子模型，不得改用主会话手动修复。
- 每个子代理 `task` 字段第一行也必须写：`Start with ACK, then immediately use tools; do not stop after ACK.`，避免约束只在 system 中被稀释。
- 修复类任务一次最多处理 1 个独立 issue；复杂 issue 必须拆成子 issue（例如 11a/11b/11c）。

---

## 六、增量更新规则

### 6.1 角色文件增量

- 已有角色文件：`read` 读出 → `periods[]` 追加新 period → `write` 写回
- 新角色：按模板新建
- 角色 ID 格式：`{角色英文标识}`（全小写，连字符分隔），如 `aria`、`kinji`、`godou`

### 6.2 其他文件增量

| 文件类型 | 增量规则 |
|:---------|:---------|
| `abilities/{id}.json` | 新发现才写。已有能力追加 `_revisions` 和 `known_feats` |
| `items/{id}.json` | 新发现才写。已有物品追加 `history`（归属变化） |
| `events/{id}.json` | 新事件写新文件。跨卷关联事件追加 `related_events` |
| `locations/{id}.json` | 新地点写新文件。已有地点追加 `key_events` |
| `systems/{id}.json` | 新体系写新文件。已有体系追加 `known_practitioners` |
| `factions/{id}.json` | 新势力写新文件。已有势力追加 `成员`、`key_events` |
| `knowledge/{id}.json` | 新情报写新文件。 |
| `world.json` | 单文件增量更新。追加 `timeline[]`、`rules[]`、`history_eras[]` |
| `index.json` | 每卷处理完后统一更新索引计数 |

### 6.3 索引更新流程

每卷处理完后，parent 更新 `index.json`：

```json
{
  "volumesProcessed": {n},
  "characters": [/* 追加新角色条目 */],
  "abilities": [/* 追加新能力条目 */],
  "items": [/* 追加新物品条目 */],
  ...
}
```

每项条目格式：`{ "id": "xxx", "nameZh": "中文名", "file": "characters/xxx.json", "status": "draft" }`

---

## 七、模板驱动

写每个 JSON 前，agent 必须先 `read` 对应的 `_templates/{type}.json` 文件获取精确结构。
**不自己发明字段名**。如果发现模板缺少该世界特有的字段，先在 `_templates/` 中添加字段定义（含注释说明用途），再使用。

---

## 八、核验基准

### 8.1 卷级核验（每卷完成后）

由 Agent B（审核）执行：

```
审核点：
1. 角色 period 数据与原文一致？
2. 能力/物品描述与原文数值一致？
3. 事件/地点/体系/势力是否正确？
4. 有没有遗漏原文中的重要信息？
5. 格式严格遵循 _templates/？
6. 所有 sourceRef 都有且准确？
```

每项 issue 格式：
```
{ severity: "error/warning/suggestion", file: "abilities/hss.json", field: "details.倍率", description: "原文没说具体倍率", suggestion: "改为 unknown", sourceRef: "main/vol-01/full.txt:450" }
```

无问题输出：`issues: []`

### 8.2 全卷核验（全部卷完成后）

参考 `phase0-merged.json`（如果有）或 `raw-text-manifest.json` 统计的角色列表做遗漏检查。

对尚未建立初始角色列表的世界，从 raw-text 做一次全量 grep 提取角色名候选项。

---

## 九、性能与约束

| 指标 | 推荐值 | 说明 |
|:-----|:-------|:-----|
| 每 agent 阅读卷数 | **1 卷** | 一卷十产数据量大，1卷/agent 最稳定 |
| 并发数 | **1** | 三 agent 串行（A→B→C），不自找并发竞争 |
| 每卷超时 | 600-900s | A 要读全文写10类文件，允许较长超时 |
| B/C 超时 | 180-300s | 审核和修复任务较轻 |
| sourceRef 精度 | 文件名/行号 | 见第三章 |

### 9.1 多系列世界的处理

如果一个世界有多个系列（如 danmachi 有 5 个系列，campione 有 2 个系列）：

- **系列独立运行**：每个系列走一套独立的 p1-output 目录，互不干扰
  - `{OUTPUT_DIR}-{series1}/`
  - `{OUTPUT_DIR}-{series2}/`
- **系列关口**：每个系列完成后做一次全量交叉引用核验（跨系列角色/事件/地点关联）
- **最终合并**：所有系列完成后，合并为一个全集 `characters-index.json` 和 `relationship-graph.json`

### 9.2 `full.txt` + `chapters.json` 的卷

如果世界已经有 `split-text/` 目录（如 hidan-no-aria），优先使用 split-text 的章节切分信息（`chapters.json` 中包含 `startLine`/`endLine`）：
- Agent A 先读 `chapters.json` 获取章节边界
- 再读 `full.txt` 中对应行范围
- 按章节逐个提取，减少上下文压力

---

## 十、目录结构产出示例

```
manual-curation/{WORLD}-p1-output/
├── _templates/                    ← 模板文件
│   ├── character.json
│   ├── ability.json
│   ├── item.json
│   ├── event.json
│   ├── location.json
│   ├── system.json
│   ├── faction.json
│   ├── knowledge.json
│   └── world.json
│
├── characters/                    ← 角色，194+ 文件
│   ├── kinji.json
│   ├── aria.json
│   └── ...
│
├── abilities/                     ← 能力，181+ 文件
│   ├── hss-standard.json
│   └── ...
│
├── items/                         ← 物品，216+ 文件
│   └── ...
│
├── events/                        ← 事件，291+ 文件
│   └── ...
│
├── locations/                     ← 地点，136+ 文件
│   └── ...
│
├── systems/                       ← 体系，38+ 文件
│   └── ...
│
├── factions/                      ← 势力，41+ 文件
│   └── ...
│
├── knowledge/                     ← 情报，186+ 文件
│   └── ...
│
├── world.json                     ← 世界观总览
│
└── index.json                     ← 全量索引
```

---

## 十一、agent_team 图定义模板

### Agent A（工人）

```json
{
  "id": "extract-{WORLD}-vol-{XX}",
  "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/",
  "agent": {
    "system": "ACK-FIRST...",
    "tools": ["read", "write"]
  },
  "task": "Start with ACK, then immediately use tools; do not stop after ACK.\n\n读 {WORLD} vol-{XX}，写 10 类数据。\n\n先读模板，再读原文，然后写文件。\n\n原文：{SOURCE_BASE}/{series}/vol-{XX}/\n输出：{OUTPUT_DIR}/\n模板：{TEMPLATE_DIR}/"
}
```

### Agent B（审核）

```json
{
  "id": "audit-{WORLD}-vol-{XX}",
  "authority": { "allowFilesystemRead": true },
  "needs": ["extract-{WORLD}-vol-{XX}"],
  "agent": {
    "system": "ACK-FIRST...(只读模式)",
    "tools": ["read"]
  },
  "task": "Start with ACK...\n\n审核 {WORLD} vol-{XX}。对照原文检查。\n\n原文：{SOURCE_BASE}/{series}/vol-{XX}/\n输出：{OUTPUT_DIR}/"
}
```

### Agent C（修复）

```json
{
  "id": "fix-{WORLD}-vol-{XX}",
  "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/",
  "needs": ["audit-{WORLD}-vol-{XX}"],
  "agent": {
    "system": "ACK-FIRST...(修复模式)",
    "tools": ["read", "write"]
  },
  "task": "Start with ACK...\n\n修复 vol-{XX} 的问题。\n\nParent 提供的 issues：\n（实际传递）"
}
```

---

## 附录 A：模板定义（通用版）

> 以下模板可直接复制到 `_templates/` 目录。
> 如需追加该世界特有字段，直接在模板中追加，并用 `// 世界特有` 注释标记。

### A.1 `_templates/character.json`

```json
{
  "_schema": "rp-character-v3",
  "character_id": "",
  "name": { "zh": "", "en": "", "jp": "" },
  "aliases": [],
  "titles": [],
  "gender": "",
  "species": "",
  "nationality": "",
  "occupation": "",
  "affiliation": "",
  "status": "",
  "periods": [
    {
      "period_id": "",
      "label": "",
      "volumes": "",
      "chapters": "",
      "time": "",
      "summary": "",
      "status": {
        "age": "",
        "occupation": "",
        "affiliation": "",
        "rank": "",
        "location": ""
      },
      "appearance": {
        "overview": "",
        "physical": {
          "height": "", "build": "",
          "hair": { "color": "", "style": "", "length": "" },
          "eyes": { "color": "", "shape": "", "expression": "" },
          "skin": "",
          "distinctive": []
        },
        "attire": {
          "default": "", "combat": "", "formal": "",
          "variations": []
        },
        "combat_form": {
          "description": "", "visual_changes": [], "trigger": ""
        },
        "voice_quality": {
          "tone": "", "pitch": "", "speed": "", "impression": "", "catchphrases": []
        },
        "changes_over_time": []
      },
      "personality": {
        "summary": "",
        "core_traits": [],
        "values": [],
        "fears": [],
        "desires": [],
        "strengths": [],
        "flaws": [],
        "inner_conflict": "",
        "decision_pattern": {
          "default": "", "under_pressure": "", "breaking_point": ""
        },
        "psychological_profile": {
          "defense_mechanisms": [], "coping_strategies": [], "emotional_triggers": []
        }
      },
      "voice": {
        "self_reference": "",
        "address_pattern": {},
        "register": {
          "default": { "speed": "", "volume": "", "tone": "" },
          "angry": "", "intimate": "", "formal": ""
        },
        "catchphrases": [],
        "dialect": "",
        "quote_samples": []
      },
      "habits": {
        "mannerisms": [],
        "daily_routine": "",
        "combat_habits": [],
        "quirks": [],
        "preferences": { "food": "", "hobbies": [], "dislikes": [], "phobias": [] }
      },
      "background": {
        "birth": { "place": "", "date": "", "family": [] },
        "upbringing": "",
        "education": {},
        "formative_events": [],
        "pre_story": ""
      },
      "abilities_owned": [],
      "abilities_new": [],
      "possessions_owned": [],
      "possessions_new": [],
      "relationships": {},
      "key_events": [],
      "knowledge": [],
      "evidence_level": ""
    }
  ],
  "_revisions": [],
  "source_refs": []
}
```

### A.2 `_templates/ability.json`

```json
{
  "_schema": "rp-ability-v3",
  "ability_id": "",
  "name": { "zh": "", "en": "" },
  "aliases": [],
  "type": "innate / combat / skill / supernatural / technology / genetic / magic / authority / equipment",
  "description": "",
  "details": {
    "原文例句": "", "原理": "", "数值": "",
    "条件": "", "效果": "", "限制": "", "副作用": ""
  },
  "activation": {
    "condition": "", "incantation": "", "time": "", "cost": ""
  },
  "effects": [],
  "power_level": { "initial": "", "peak": "", "evolution": [] },
  "known_feats": [],
  "shared_by": [],
  "see_also": [],
  "countered_by": [],
  "counters": [],
  "variations": [],
  "_revisions": [],
  "source_refs": []
}
```

### A.3 `_templates/item.json`

```json
{
  "_schema": "rp-item-v3",
  "item_id": "",
  "name": { "zh": "", "en": "" },
  "aliases": [],
  "type": "weapon / equipment / artifact / pet-companion / consumable / key-item / vehicle / treasure",
  "description": "",
  "details": {
    "原文例句": "", "外观": "", "材质": "",
    "功能": "", "特殊效果": "", "限制": "", "制作方": ""
  },
  "history": [],
  "associated_abilities": [],
  "_revisions": [],
  "source_refs": []
}
```

### A.4 `_templates/event.json`

```json
{
  "_schema": "rp-event-v1",
  "event_id": "",
  "name": { "zh": "", "en": "" },
  "type": "battle / incident / revelation / milestone / disaster / conspiracy / ceremony / meeting / journey",
  "time": "",
  "location": "",
  "volumes": "",
  "chapters": "",
  "summary": "",
  "cause": "",
  "process": "",
  "outcome": "",
  "aftermath": "",
  "participants": [],
  "casualties": [],
  "related_events": [],
  "significance": "",
  "source_refs": []
}
```

### A.5 `_templates/location.json`

```json
{
  "_schema": "rp-location-v1",
  "location_id": "",
  "name": { "zh": "", "en": "" },
  "aliases": [],
  "type": "school / city / building / region / facility / natural / supernatural / dungeon / country / continent",
  "description": "",
  "地理位置": "",
  "历史": "",
  "重要性": "",
  "first_appeared": "",
  "key_events": [],
  "notable_residents": [],
  "related_locations": [],
  "affiliation": "",
  "source_refs": []
}
```

### A.6 `_templates/system.json`

```json
{
  "_schema": "rp-system-v1",
  "system_id": "",
  "name": { "zh": "", "en": "" },
  "aliases": [],
  "type": "magic / technology / supernatural / combat / rank / classification / social / power-system",
  "description": "",
  "principles": "",
  "classification": "",
  "levels": [],
  "known_practitioners": [],
  "origin": "",
  "limitations": "",
  "related_systems": [],
  "source_refs": []
}
```

### A.7 `_templates/faction.json`

```json
{
  "_schema": "rp-faction-v1",
  "faction_id": "",
  "name": { "zh": "", "en": "" },
  "aliases": [],
  "type": "organization / family / school / secret-society / nation / guild / religion / resistance / kingdom",
  "description": "",
  "历史": "",
  "目标": "",
  "结构": "",
  "leader": "",
  "headquarters": "",
  "成员": [],
  "盟友": [],
  "敌对": [],
  "first_appeared": "",
  "key_events": [],
  "source_refs": []
}
```

### A.8 `_templates/knowledge.json`

```json
{
  "_schema": "rp-knowledge-v1",
  "knowledge_id": "",
  "name": { "zh": "", "en": "" },
  "type": "secret / lore / intel / truth / history / technique / prophecy / taboo",
  "description": "",
  "详情": "",
  "revealed_in": "",
  "revealed_by": [],
  "known_to": [],
  "impact": "",
  "related_knowledge": [],
  "verification": "confirmed / partial / unverified",
  "source_refs": []
}
```

### A.9 `_templates/world.json`

```json
{
  "_schema": "rp-world-v1",
  "world_name": { "zh": "{WORLD_NAME}", "en": "", "jp": "" },
  "genre": [],
  "summary": "",
  "core_conflict": "",
  "atmosphere": "",
  "setting": "",
  "history_eras": [],
  "rules": [],
  "timeline": [],
  "source_refs": []
}
```

---

## 附录 B：快速启动清单

开始一个新世界的卷级提取前，确认以下各项已就位：

```
[ ] 1. 确认 raw-text 完整
     ├─ 所有卷的原文文件已就位（{SOURCE_BASE}/{series}/vol-XX/）
     ├─ raw-text-manifest.json 已存在
     └─ 章节模式已确认（full.txt / split）

[ ] 2. 创建输出目录
     └─ manual-curation/{WORLD}-p1-output/

[ ] 3. 拷贝模板
     └─ 从本附录 A 拷贝 9 个模板到 _templates/

[ ] 4. 创建初始 index.json
     └─ 填写 {WORLD}/{WORLD_NAME}/{SERIES_LIST}/{VOLUME_TOTAL}

[ ] 5. 确定卷序
     └─ 主系列 vol-01 开始，逐卷递增

[ ] 6. 启动第一卷
     └─ Agent A（工人）→ Agent B（审核）→ 循环至 issues=0 → 下一卷
```

---

## 附录 C：执行规则汇总

1. **一卷十产**：角色/能力/物品/事件/地点/体系/势力/世界观/知识/索引
2. **模板驱动**：不自己发明字段，严格遵循 `_templates/`
3. **增量更新**：已有文件追加新 period / new data，不重复创建
4. **物品与角色同步**：`items/` 与角色的 `possessions_owned` 互相对应
5. **审核迭代至零问题**：A → B → 有 issues → C → B（循环直到 `issues=[]`）
6. **不猜测不编造**：原文没写就不写
7. **sourceRef 精确到原文行号或文件名**
8. **ACK-first 约束**：所有 agent 首行必须输出 ACK + 立即调用工具
9. **逐卷推进**：每卷通过审核后再进下一卷
10. **多系列隔离**：每系列独立 output 目录，最终合并
