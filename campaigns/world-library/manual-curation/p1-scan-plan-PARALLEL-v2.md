# 卷级数据提取方案（并行通用版 v2）— 分卷并行提取 + agent 语义合并

> 核心设计：**卷级并行提取（写隔离）→ 角色/能力/事件的语义合并由 agent 完成**
> 脚本只做目录遍历和文件发现，不做内容合并。

---

## 零、原则

1. **脚本不做内容合并** — 脚本只做：遍历目录、收集文件路径、排序、生成议题清单。不做 JSON 字段合并、period 拼接、因果链推断。
2. **合并由 agent 完成** — 合并 agent 读取所有卷片段，理解时间线、版本演变、因果关联后，产出最终合并文件。
3. **角色是核心共享状态** — 角色的跨卷 period 合并不是简单的"按卷拼接"，需要理解成长弧、关系演变、能力进化的语义关联。
4. **精细度不降** — 每卷的 A→B→C 审核闭环不变，合并 agent 同样要经过审核。

---

## 一、参数化配置

| 参数 | 示例值 | 说明 |
|:-----|:--------|:-----|
| `{WORLD}` | `campione` | 世界 slug |
| `{WORLD_NAME}` | `弑神者` | 世界中文学名 |
| `{SERIES_LIST}` | `["campione-main","campione-shiniki"]` | 系列列表 |
| `{VOLUME_TOTAL}` | `26` | 总卷数 |
| `{OUTPUT_DIR}` | `campaigns/world-library/manual-curation/{WORLD}-p1-output` | 输出根目录 |
| `{SOURCE_BASE}` | `campaigns/world-library/worlds/{WORLD}/sources/raw-text` | 原文根目录 |
| `{CHAPTER_PATTERN}` | `full.txt` 或 `split` | 卷内章节文件模式 |
| `{WAVE_SIZE}` | `5` | 每批并行卷数 |
| `{MAX_CONCURRENCY}` | `5` | agent_team 并发上限 |
| `{MERGE_CHAR_BATCH}` | `10` | 每批合并的角色数 |

---

## 二、目录结构

```
manual-curation/{WORLD}-p1-output/
│
├── _templates/                  ← 模板（同串行版）
│
├── waves/                       ← 每批卷的隔离产出
│   ├── wave-001/
│   │   ├── vol-01/
│   │   │   ├── characters/      ← period 片段（仅本卷的 periods[0]）
│   │   │   ├── abilities/       ← 本卷首次发现的能力
│   │   │   ├── items/
│   │   │   ├── events/          ← 本卷发生的事件
│   │   │   ├── locations/
│   │   │   ├── systems/
│   │   │   ├── factions/
│   │   │   ├── knowledge/
│   │   │   └── world.json       ← 本卷贡献的世界观条目
│   │   ├── vol-02/
│   │   └── ...
│   ├── wave-002/
│   └── ...
│
├── fragments/                   ← 跨 Wave 角色 period 汇总（供合并 agent 输入）
│   ├── character-periods/
│   │   ├── kinji.periods.json   ← 该角色在所有 vol-XX 的 periods 合集（纯文件索引）
│   │   └── ...
│   └── fragment-index.json      ← 全量片段索引
│
├── merged/                      ← agent 合并后的最终产物
│   ├── characters/
│   ├── abilities/
│   ├── items/
│   ├── events/
│   ├── locations/
│   ├── systems/
│   ├── factions/
│   ├── knowledge/
│   ├── world.json
│   └── index.json
│
├── wave-manifest.json           ← 批处理进度
└── merge-state.json             ← 合并阶段进度（哪些角色已合并哪些未合并）
```

---

## 三、整体流程

```
┌─────────────────────────────────────────────────────────────────┐
│  阶段一：批量提取（并行）—— 写隔离                              │
│                                                                  │
│  反复运行 agent_team graph，每批 N 卷：                          │
│  ┌────┐ ┌────┐ ┌────┐                                          │
│  │v01 │ │v02 │ │v03 │  ← 并行 A→B→C 审核闭环                    │
│  │A→B→C│ │A→B→C│ │A→B→C│                                       │
│  └────┘ └────┘ └────┘                                          │
│       ↓ 每卷写到 waves/wave-N/vol-XX/ 隔离目录                    │
│       ↓ 每卷角色只写一个 period 片段                              │
│       ↓ 每批完成后重建 fragments/ 索引                            │
│       ↓ 所有批完成后 → 阶段二                                    │
├─────────────────────────────────────────────────────────────────┤
│  阶段二：合并（并行语义合并）—— agent 驱动                        │
│                                                                  │
│  Step Merge-1: 构建 fragments 索引                               │
│    └─ 脚本遍历 waves/*/vol-*/ -> fragments/character-periods/*    │
│    └─ 脚本统计每个角色有多少个 period 片段                          │
│                                                                  │
│  Step Merge-2: 角色合并（每 agent 处理一批角色，并行）              │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│    │merge-1  │ │merge-2  │ │merge-3  │  ← 每 agent 10 角色       │
│    │kinji    │ │sherlock │ │giii     │                           │
│    │aria     │ │beretta  │ │...      │                           │
│    │snow     │ │nemo     │ │         │                           │
│    │riko     │ │...      │ │         │                           │
│    │reki     │ │         │ │         │                           │
│    └────┬────┘ └────┬────┘ └────┬────┘                           │
│         │           │           │                                │
│         │  读取 fragments/character-periods/{id}.periods.json    │
│         │  语义理解 time/cause-effect → 写 merged/characters/   │
│         │           │           │                                │
│    ┌────▼────┐ ┌────▼────┐ ┌────▼────┐                           │
│    │审核B-1  │ │审核B-2  │ │审核B-3  │  ← 审核角色档案           │
│    └─────────┘ └─────────┘ └─────────┘                           │
│                                                                  │
│  Step Merge-3: 能力/物品/事件语义合并（每类型一个 agent）          │
│    ├─ merge-abilities agent: 理解 "同一个能力" vs "进化版"       │
│    ├─ merge-items agent: 理解 "同一物品" vs "升级版"             │
│    ├─ merge-events agent: 理解跨卷因果链 → linked events         │
│    ├─ merge-locations agent: 合并跨卷出现的地点                          │
│    ├─ merge-systems agent                                             │
│    ├─ merge-factions agent                                            │
│    └─ merge-world agent                                               │
│                                                                  │
│  Step Merge-4: 跨索引引用校验 agent                                 │
│    └─ 检查 abilities_owned/possessions_owned/related_events 联通  │
│    └─ 检查 relationship 两端存在                                        │
│    └─ 输出 index.json                                              │
├─────────────────────────────────────────────────────────────────┤
│  阶段三：全量校验（脚本 + agent 抽样）                                    │
│                                                                  │
│  ├─ 脚本：全部 JSON 可 parse、无重复 id                            │
│  ├─ agent 抽样：抽查 20% 角色档案 vs 原文一致性                         │
│  └─ 人类：确认合并报告                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、阶段一：批量提取（并行）

### 4.1 分 Wave 策略

```
Wave 1: vol-01 ~ vol-{WAVE_SIZE}
Wave 2: vol-{WAVE_SIZE+1} ~ vol-{WAVE_SIZE*2}
...
Wave M: 剩余卷
```

每 Wave 内的所有卷**同时启动提取**。

### 4.2 每卷提取内容

写到 `waves/wave-NNN/vol-XX/`：

```
waves/wave-NNN/vol-XX/
├── characters/{id}.json    ← period 片段（periods[] 只含一项：本卷）
├── abilities/{id}.json     ← 本卷首次发现的能力
├── items/{id}.json         ← 本卷首次发现的物品
├── events/{id}.json        ← 本卷发生的事件
├── locations/{id}.json     ← 本卷首次出现的地点
├── systems/{id}.json       ← 本卷首次出现的体系
├── factions/{id}.json      ← 本卷首次出现的势力
├── knowledge/{id}.json     ← 本卷揭示的情报
├── world.json              ← 本卷的 timeline/event 条目
└── index.json              ← 本卷文件索引
```

### 4.3 角色 period 片段格式

每个卷写的字符文件只含**一个 period**（当前卷的），与模板结构完全一致：

```json
{
  "_schema": "rp-character-v3",
  "character_id": "kinji",
  "name": { "zh": "远山金次", "en": "Tohyama Kinji", "jp": "とおやま きんじ" },
  "aliases": [],
  "periods": [
    {
      "period_id": "vol-01",
      "label": "第一卷",
      "volumes": "vol-01",
      "summary": "第一卷剧情概括...",
      "status": { "occupation": "东京武侦高中侦探科", ... },
      "appearance": { ... },
      "personality": { ... },
      "abilities_owned": ["hss"],
      "abilities_new": ["hss"],
      "possessions_owned": [],
      "relationships": { "aria": { "type": "搭档" } },
      "key_events": [...],
      "evidence_level": "S"
    }
  ],
  "_revisions": [],
  "source_refs": []
}
```

### 4.4 跨 Wave 的角色认知 + 硬性约束

后续 Wave 的 agent 需要知道角色是否已在前面的 Wave 出现过（以追踪角色已有能力 vs 新能力）：

```
Agent A 启动时（vol-06）：
  1. 读 merged/characters/{id}.json（如果存在）
     → 如果存在：表示角色已合并过，有完整的历史记录
     → 本卷的 period 标注 abilities_new（相对于历史的新增）
  2. 如果不存在：新角色，normal 写法
  3. 注意：Agent A 只写 waves/wave-N/vol-XX/，不写 merged/
```

**⚠️ [硬性规则] 角色写入约束**

如果角色文件已存在（在 merged/characters/ 或之前 wave 的输出中）：

1. **⛔ 禁止合并或修改已有的 periods**
   - 保留所有已有 periods 的原始结构和内容
   - 不得将多个已有 periods 压缩为一条汇总（如 `pre-XX-summary`）
   - 不得重排、重命名、合并已有 periods
   - 不得修改已有 periods 的字段内容

2. **✅ 只允许的操作**
   - 读取已有 periods → 了解角色历史（用于判断本卷 abilities_new）
   - 通过 `json-tool.cjs append` 追加一条新的 period（本卷）
   - 如果本卷角色未出场 → 不追加 period，不修改文件

3. **写入方式**
   - 先用 `json-tool.cjs read` 读出完整文件
   - 用 `json-tool.cjs append` 或 `json-tool.cjs batch` 追加本卷 period
   - 不要用 write 重新写整个文件——这会覆盖其他 agent 的并发写入

**违例后果**：已有 periods 被合并压缩会导致 vol-01~24 级别的数据永久丢失。审核 agent 会专门检查此问题。

这样后面的卷能感知角色历史，避免把"已有能力"误标为 abilities_new。

### 4.5 三 agent 审核闭环（每卷独立）

```
per volume:
  Agent A（工人）→ 写 waves/wave-N/vol-XX/
  Agent B（审核）→ 审核，输出 issues[]
  Agent C（修复）→ 按 issues 修复
  → 重复 B 直到 issues = 0
```

与串行版完全相同，只是路径改为 waves/wave-N/vol-XX/。

#### Agent B 审核检查项（含硬性约束）

```
1. 【硬性】检查 period 完整性
   - 查找是否有 pre-*-summary / merged / summary 等汇总型 period_id
   - 如果有 → issue: error, severity: critical
   - 说明：已有 periods 被合并压缩是不可逆数据丢失

2. 【硬性】检查 sourceRef 有效性
   - ❌ 空字符串 "" → error
   - ❌ 省略号 "..." → error
   - ❌ 占位符 "[TODO]" / "[TBD]" / "FIXME" → error
   - ✅ 必须包含 {series}/vol-XX/ 和文件名 → 通过

3. 当前卷数据与原文一致？
4. 本卷出现的所有角色是否都在 index.json 中？
5. 能力/物品/事件描述与原文数值一致？
6. 格式严格遵循 _templates/？
```

### 4.6 Wave 内并发控制

```
Step 1: 启动 N 个 Agent A（并行）
  → N = min(WAVE_SIZE, MAX_CONCURRENCY)
  → 每个绑定一个卷
  → 全部完成

Step 2: 启动 N 个 Agent B（并行）
  → 全部完成

Step 3: 收集 issues
  ├─ 全空 → Wave 通过
  └─ 有 issues → Step 4

Step 4: 启动 N 个 Agent C（并行，只修复有 issues 的卷）
  → 全部完成 → 回到 Step 2

Step 5: Wave 完成
  ├─ 更新 wave-manifest.json
  └─ 重建 fragments/ 索引（脚本）
```

---

## 五、阶段二：合并（agent 语义合并）

### 5.1 Step Merge-1：构建 fragments 索引（脚本）

```javascript
// build-fragments-index.js —— 纯遍历，不合并内容

// 输入：扫描 waves/wave-*/vol-*/characters/*.json
// 输出：fragments/character-periods/{id}.periods.json

// 格式：
{
  "character_id": "kinji",
  "fragments": [
    {
      "vol": "vol-01",
      "wave": "wave-001",
      "path": "waves/wave-001/vol-01/characters/kinji.json",
      "periodId": "vol-01"
    },
    {
      "vol": "vol-06",
      "wave": "wave-002",
      "path": "waves/wave-002/vol-06/characters/kinji.json",
      "periodId": "vol-06"
    }
    // ...
  ]
}
```

同样为 abilities/items/events 构建类似的片段索引（但去重逻辑不同）。

### 5.2 Step Merge-2：角色合并（agent 驱动，并行）

**输入**：`fragments/character-periods/{id}.periods.json`
**输出**：`merged/characters/{id}.json`

每 agent 处理 **MERGE_CHAR_BATCH（推荐10）** 个角色：

```
merge-agent 提示词要点：

1. 读 fragments/character-periods/{char1}.periods.json
2. 按 vol 顺序读取每个 period 片段文件
3. 语义合并规则：

   角色基本信息（character_id, name, aliases, gender, species...）：
     → 以首次出现为准，后续别名追加到 aliases
   
   periods[]：
     → 按卷序排列
     → 如果两卷之间角色状态无变化（status/abilities/relationships 完全一致）：
       合并为一条 period，标注 volumes: "vol-01~vol-02"
     → 如果变化较大：
       保留两条独立的 period
       period_id: "vol-03" → "vol-03"
       period_id: "vol-06" → "vol-06"
     → 如果某卷角色未出场但能力/关系被他人提及：
       不创建 period，但在该角色的 knowledge 中补充
   
   abilities_owned：
     → 跨卷归并（vol-01 有 hss，vol-06 追加 fire-gun-skill）
     → abilities_new 只保留首次出现的卷内
     → abilities_owned 在每个 period 中反映"截至本卷共有哪些"
   
   relationships：
     → 追踪变化：同事→挚友→恋人
     → 在 period.relationships 中标注 currentStatus 随卷变化
   
   key_events：
     → 跨卷合并，按时间序排列
   
   background.pre_story：
     → 只在首次出现的 period 中写
   
   evidence_level：
     → 整个角色采用最高的 evidence_level

4. 审核（同一个 agent 内置）:
   ├─ 检查合并不是简单拼接（是否有时间矛盾？关系演变是否合理？）
   ├─ 标注 overlap/dubious 到 _revisions
   └─ 确认所有 sourceRef 跨卷都存在
```

**并发**：角色之间无依赖 → 完全可并行。每 agent 10 角色，50 角色的世界只需 5 个并行 merge agent。

### 5.3 Step Merge-3：能力/物品/事件语义合并（agent 驱动）

与角色不同，能力/物品/事件的跨卷关系更复杂——**需要区分为"同一个"还是"进化版"**。

#### 能力合并 agent

```
输入：fragments/ability-periods/{id}.periods.json
问题：跨卷的同一 id 能力：
  ├─ 是同一个能力的新 feats？
  └─ 是进化/升级版？

规则：
  1. 如果 type / activation.condition 一致 → 同一个能力
     → 合并 known_feats（按时间序）
     → 追加 power_level.evolution（如果描述有变化）
     → 追加 source_refs
   
  2. 如果 type 变化 / 原理不同 → 是进化支
     → 第一条为主能力文件
     → 后续变为 variations[]
     → 在源角色中 abilities_owned 标注 "hss" → "hss-v2"
   
  3. 同卷不同 id → 不同能力，不合并
```

#### 事件合并 agent

```
输入：fragments/event-periods/{id}.periods.json
规则：
  1. 如果 event_id 相同 → 同事件被多卷引用
     → 合并 summary（取最完整版本）
     → 追加 aftermath（后续卷揭示的后果）
     → 追加 related_events（跨卷因果链）
   
  2. 如果事件 A 的 outcome 引用了事件 B → 建立 causal link

  3. 跨卷因果链推断：
     ├─ "vol-01 的事件 X 导致 vol-05 的事件 Y"
     └─ 在 related_events 中标注 type: "direct-causation"
```

#### 物品合并 agent

```
规则：
  1. 同一物品跨卷 → 合并 description，追加 history（归属变化）
  2. 物品升级 → 追加到 history 数组
  3. 物品毁坏 → history 最后一条标注 state: "destroyed"
```

### 5.4 Step Merge-4：跨索引引用校验 agent

```
输入：merged/ 下所有文件
任务：遍历检查

检查项：
1. abilities_owned 中的每个 id → 必须在 merged/abilities/ 中存在
2. possessions_owned 中的每个 id → 必须在 merged/items/ 中存在
3. key_events 引用的 event_id → 必须在 merged/events/ 中存在
4. locations 引用的 location_id → 必须在 merged/locations/ 中存在
5. relationships 的 character_id → 必须在 merged/characters/ 中存在
6. 无 dangling reference

修复：
  ├─ 缺失 → 记入 missing-list.md
  └─ 临时占位 → 标注 "unresolved"
```

---

## 六、断点续跑

### 6.1 提取阶段

```
检查 wave-manifest.json：
├─ 找到第一个 status != "completed" 的 wave
├─ 该 wave 内：
│   ├─ vol-XX 完整 → 跳过
│   └─ vol-XX 缺失 → 重新提取
└─ 从中断 wave 继续
```

### 6.2 合并阶段

```
检查 merge-state.json：
├─ 记录每个字符/能力/物品的合并状态
├─ status: "pending" → 尚未开始
├─ status: "completed" → 已完成
└─ status: "failed" → 重试

从中断的条目继续。
每个角色/能力的合并是独立的 → 重试不影响其他。
```

---

## 七、并行加速预估

假设每卷提取时间 = T，合并时间 = M_per_char：

```
阶段一：N 卷，每批 WAVE_SIZE 卷并行
  时间 = ceil(N / WAVE_SIZE) × T

阶段二：
  角色合并：ceil(角色数 / MERGE_CHAR_BATCH) × M_per_char
  能力/物品合并：与角色合并并行（不同类型无依赖）
  全量校验：固定时间

总时间 ≈ ceil(N/WAVE_SIZE)×T + ceil(角色数/10)×M_per_char
```

| 世界 | 卷 | 角色 | 串行 | 并行 |
|:----|:---|:----|:----|:----|
| hidan | 49 | ~200 | 49T + 200M | 10T + 20M |
| campione | 26 | ~104 | 26T + 104M | 6T + 11M |
| danmachi | 55 | ~200+ | 55T + 200M | 11T + 20M |

---

## 八、agent_team 图模板

### 8.1 Wave 提取图

```json
{
  "objective": "提取 {WORLD} wave-{N}（vol-{START}~vol-{END}）",
  "authority": {
    "allowFilesystemRead": true,
    "allowMutationTools": true
  },
  "limits": {
    "concurrency": {MAX_CONCURRENCY},
    "timeoutSecondsPerStep": 900
  },
  "steps": [
    // 工程师 × N
    {
      "id": "extract-{WORLD}-vol-{XX}",
      "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/waves/wave-{N}/vol-{XX}/",
      "agent": {
        "system": "ACK-FIRST...（写 waves/wave-{N}/vol-{XX}/ 路径）",
        "tools": ["read", "write"]
      },
      "task": "Start with ACK...\n读 {SOURCE_BASE}/{series}/vol-{XX}/...\n\n如果角色已在 merged/characters/ 存在，先 read 了解已有能力，标注 abilities_new"
    },

    // 审核员 × N
    {
      "id": "audit-{WORLD}-vol-{XX}",
      "authority": { "allowFilesystemRead": true },
      "needs": ["extract-{WORLD}-vol-{XX}"],
      "agent": {
        "system": "ACK-FIRST... 审核 vol-XX...",
        "tools": ["read"]
      },
      "task": "Start with ACK...\n审核 waves/wave-{N}/vol-{XX}/"
    }

    // 修复员根据需要由 parent 决定是否追加
  ]
}
```

### 8.2 角色合并图

```json
{
  "objective": "合并 {WORLD} 角色 periods 到完整档案",
  "authority": {
    "allowFilesystemRead": true,
    "allowMutationTools": true
  },
  "limits": {
    "concurrency": 5,
    "timeoutSecondsPerStep": 600
  },
  "steps": [
    // 合并 agent × ceil(角色/MERGE_CHAR_BATCH)
    {
      "id": "merge-chars-batch-{B}",
      "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/merged/characters/",
      "agent": {
        "system": "你是角色档案合并专家。\n\n读 fragments/character-periods/{charId}.periods.json 获取该角色的所有 period 片段路径。\n\n按卷序读每个 period 片段。\n\n语义合并规则：\n1. 角色基本信息 → 首次出现为准\n2. periods[] → 按时间序排列，连续无变化的卷合并为一条\n3. abilities_owned → 跨卷归并，abilities_new 仅保留首次\n4. relationships → 追踪变化\n5. key_events → 同 id 不重复\n6. 标注证据等级\n\n输出到 merged/characters/{charId}.json",
        "tools": ["read", "write"]
      },
      "task": "Start with ACK...\n\n合并以下角色：\n{charId1}, {charId2}, ..., {charId10}\n\n每个角色读 fragments/character-periods/{id}.periods.json → 读 period 文件 → 语义合并 → 写 merged/characters/{id}.json"
    }
  ]
}
```

### 8.3 能力/物品/事件合并图

```json
{
  "objective": "合并 {WORLD} 能力/物品/事件",
  "authority": {
    "allowFilesystemRead": true,
    "allowMutationTools": true
  },
  "limits": {
    "concurrency": 3,
    "timeoutSecondsPerStep": 600
  },
  "steps": [
    {
      "id": "merge-abilities-{WORLD}",
      "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/merged/abilities/",
      "agent": {
        "system": "你是能力数据合并专家。\n\n遍历 waves/*/vol-*/abilities/*.json。\n\n按 id 分组。\n- 同 id → 同一能力：合并 known_feats、追加 power_level.evolution、追加 source_refs\n- 同 id 但 type/activation 变化 → 基础能力 + variations[]\n- 不同 id → 不同能力\n\n输出到 merged/abilities/{id}.json",
        "tools": ["read", "write"]
      },
      "task": "Start with ACK...\n合并 {WORLD} 所有能力。\n扫描 waves/*/vol-*/abilities/*.json"
    },
    {
      "id": "merge-items-{WORLD}",
      "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/merged/items/",
      "needs": [],
      "agent": {
        "system": "你是物品数据合并专家...",
        "tools": ["read", "write"]
      },
      "task": "Start with ACK...\n合并 {WORLD} 所有物品。"
    },
    {
      "id": "merge-events-{WORLD}",
      "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/merged/events/",
      "needs": [],
      "agent": {
        "system": "你是事件因果链合并专家。\n\n遍历 waves/*/vol-*/events/*.json。\n\n按 id 分组归并。\n\n额外任务：跨卷因果链推断\n- 事件 A 的 outcome 指向事件 B → related_events 中建立 causal 边\n- 事件 B 的 cause 指向事件 A → 反向建立 reference\n\n输出到 merged/events/{id}.json",
        "tools": ["read", "write"]
      },
      "task": "Start with ACK...\n合并 {WORLD} 所有事件并建立跨卷因果链。"
    }
  ]
}
```

---

## 九、与串行版的关键区别

| 维度 | 串行版 | ✅ 并行 v2 |
|:-----|:-------|:----------|
| 提取 | 一次一卷 A→B→C | **N 卷并行** A→B→C，每卷写隔离目录 |
| 角色合并 | 实时增量追加 | **合并 agent 语义驱动**，理解因果/版本 |
| 能力/物品合并 | 实时增量追加 | **合并 agent 语义去重**，区分"同一能力" vs "进化版" |
| 事件因果链 | 实时关联（仅跨卷不明显） | **合并 agent 批量建立**跨卷因果边 |
| 审核闭环 | 每卷审核 | ✅ **相同**（提取期）+ 合并期额外审核 |
| 精细度 | 高 | ✅ **相同**（agent 合并保留语义） |
| 断点续跑 | 逐卷 | ✅ 逐 Wave / 逐角色 / 逐类型 |
| 总时间 | 串行累加 | ✅ **批并行 + 角色并行 = 3-5× 加速** |

---

## 附录：合并 agent 审核门禁

每个合并 agent 完成后，必须输出一份合并报告：

```json
{
  "type": "character-merge-report",
  "characterId": "kinji",
  "totalPeriodsIn": 8,        // 输入片段数
  "totalPeriodsOut": 5,        // 合并后 period 数（合并了连续无变化的卷）
  "mergedVolumes": "vol-01~vol-45",
  "abilityChanges": [
    { "ability": "hss", "event": "跨卷归并，追加 3 个 known_feats" },
    { "ability": "fire-gun", "event": "vol-06 新获得" }
  ],
  "relationshipChanges": [
    { "relationship": "aria", "arc": "陌生→搭档→恋人" }
  ],
  "conflicts": [
    { "type": "appearance", "volA": "vol-01", "volB": "vol-10", "description": "发色描述不一致", "resolution": "以 vol-01（首次）为准，vol-10 标注版本变体" }
  ],
  "unresolvedIssues": []
}
```

无 conflicts 或 all resolved 才视为合并完成。
