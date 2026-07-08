# 卷级数据提取方案（并行通用版）— 分卷隔离 + 批合并

> 基于串行方案通用化，保持同等精细度，引入并行提取能力。
> 核心设计：**提取写隔离 + 批审核 + 确定性脚本合并**，消除写冲突。

---

## 零、核心思路

串行方案的瓶颈在于**每卷串行 A→B→C→审核循环**，而事实上：

| 数据类型 | 卷间独立性 | 能否并行 |
|:---------|:-----------|:---------|
| 事件 events/{id}.json | ✅ 每卷独立 | ✅ 完全并行 |
| 能力 abilities/{id}.json | ✅ 每卷独立 | ✅ 完全并行 |
| 物品 items/{id}.json | ✅ 每卷独立 | ✅ 完全并行 |
| 地点 locations/{id}.json | ✅ 每卷独立 | ✅ 完全并行 |
| 体系 systems/{id}.json | ✅ 每卷独立 | ✅ 完全并行 |
| 势力 factions/{id}.json | ✅ 每卷独立 | ✅ 完全并行 |
| 情报 knowledge/{id}.json | ✅ 每卷独立 | ✅ 完全并行 |
| **角色 characters/{id}.json** | ❌ 跨卷共享（periods 追加） | ⚠️ 需隔离合并 |
| **world.json** | ❌ 单文件跨卷累积 | ⚠️ 需隔离合并 |
| **index.json** | ❌ 单文件跨卷累积 | ⚠️ 需隔离合并 |

**解决方案：两阶段架构**

```
阶段一（并行）：每卷独立产出 → 写到分隔离目录 vol-XX/
    └── 只写"每卷独立"的数据（事件/能力/物品/地点/体系/势力/情报/角色）
        角色也写分隔离版（只含本卷角色的 period 片段）
    
阶段二（串行合并）：所有卷完成后 → 确定性脚本合并
    ├── 角色 periods 跨卷拼接
    ├── 能力/物品/事件 dedup
    ├── world.json 归并
    └── index.json 重建
```

这样卷之间**完全无写冲突**，任意卷可并行，合并纯脚本完成。

---

## 一、参数化配置

每次执行前替换以下参数：

| 参数 | 示例值 | 说明 |
|:-----|:--------|:-----|
| `{WORLD}` | `campione` | 世界 slug，对应 `worlds/{WORLD}/` |
| `{WORLD_NAME}` | `弑神者` | 世界中文学名 |
| `{SERIES_LIST}` | `["campione-main","campione-shiniki"]` | 系列列表 |
| `{VOLUME_TOTAL}` | `26` | 总卷数 |
| `{OUTPUT_DIR}` | `campaigns/world-library/manual-curation/{WORLD}-p1-output` | 输出根目录 |
| `{SOURCE_BASE}` | `campaigns/world-library/worlds/{WORLD}/sources/raw-text` | 原文根目录 |
| `{CHAPTER_PATTERN}` | `full.txt` 或 `split` | 卷内章节文件模式 |
| `{WAVE_SIZE}` | `5` | 每批并行卷数 |
| `{MAX_CONCURRENCY}` | `5` | agent_team 并发上限 |

---

## 二、目录结构

```
manual-curation/{WORLD}-p1-output/
│
├── _templates/                  ← 模板（与串行版相同）
│   └── character.json, ability.json, ...
│
├── waves/                       ← 每批卷的隔离产出
│   ├── wave-001/
│   │   ├── vol-01/
│   │   ├── vol-02/
│   │   └── ...
│   ├── wave-002/
│   │   ├── vol-06/
│   │   └── ...
│   └── ...
│
├── merged/                      ← 最终合并产物
│   ├── characters/              ← 跨卷合并后的角色
│   ├── abilities/               ← 去重后的能力
│   ├── items/                   ← 去重后的物品
│   ├── events/                  ← 去重后的事件
│   ├── locations/               ← 去重后的地点
│   ├── systems/                 ← 去重后的体系
│   ├── factions/                ← 去重后的势力
│   ├── knowledge/               ← 去重后的情报
│   ├── world.json               ← 归并后的世界观
│   └── index.json               ← 最终索引
│
├── wave-manifest.json           ← 批处理进度记录
├── merge-report.json            ← 合并报告（冲突/去重统计）
└── merge-report.md              ← 人工可读的合并报告
```

---

## 三、三阶段执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   阶段一：批量提取（并行）                          │
│                                                                  │
│  Wave 1                 Wave 2                 Wave N            │
│  ┌────┬────┬────┬────┐  ┌────┬────┬────┬────┐  ┌────┬────┐     │
│  │v01 │v02 │v03 │v04 │  │v05 │v06 │v07 │v08 │  │... │vNN │     │
│  │ A  │ A  │ A  │ A  │  │ A  │ A  │ A  │ A  │  │ A  │ A  │     │
│  └──┬─┴──┬─┴──┬─┴──┬─┘  └──┬─┴──┬─┴──┬─┴──┬─┘  └──┬─┴──┬─┘     │
│     │    │    │    │       │    │    │    │       │    │        │
│  ┌──▼┐ ┌▼──┐┌▼──┐┌▼──┐  ┌──▼┐ ┌▼──┐┌▼──┐┌▼──┐  ┌──▼┐┌──▼┐    │
│  │B  │ │B  ││B  ││B  │  │B  │ │B  ││B  ││B  │  │B  ││B  │    │
│  └──┬┘ └┬──┘└┬──┘└┬──┘  └──┬┘ └┬──┘└┬──┘└┬──┘  └──┬┘└──┬┘    │
│     │     │    │    │       │    │    │    │       │    │        │
│  ┌──▼┐ ┌▼──┐┌▼──┐┌▼──┐       (修复 cycle 同左)                 │
│  │C  │ │C  ││C  ││C  │                                           │
│  └───┘ └───┘└───┘└───┘                                           │
│       ↓ all passed                                                │
│  ┌────────────────┐                                               │
│  │ 批内合并验证     │ ← 批内角色不跨卷merge，仅验证格式              │
│  └────────────────┘                                               │
│       ↓ wave complete                                             │
├─────────────────────────────────────────────────────────────────┤
│                   阶段二：串行合并（脚本）                          │
│                                                                  │
│  卷1角色片段 ─┐                                                   │
│  卷2角色片段 ─┤                                                   │
│  卷3角色片段 ─┤──→ merge-characters.js → merged/characters/      │
│  ...          │                                                   │
│  卷N角色片段 ─┘                                                   │
│                                                                  │
│  能力/物品/事件/地点/体系/势力/情报 ──→ dedup-by-id.js           │
│                                                                  │
│  world.json 各卷片段 ──→ merge-world.js                          │
│                                                                  │
│  index.json 各卷片段 ──→ rebuild-index.js                        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                   阶段三：全量校验（脚本）                          │
│                                                                  │
│  ├─ 角色完整性校验（每个角色 period 数 == 有出场的卷数）            │
│  ├─ 去重校验（无重复 id）                                         │
│  ├─ sourceRef 存在性校验                                          │
│  ├─ 跨索引引用完整性校验                                           │
│  └─ 全量 JSON 合法性校验                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、阶段一：批量提取（并行）

### 4.1 分 Wave 策略

```
卷总数 N → 按 WAVE_SIZE 拆成 M 批

Wave 1: vol-01 ~ vol-{WAVE_SIZE}
Wave 2: vol-{WAVE_SIZE+1} ~ vol-{WAVE_SIZE*2}
...
Wave M: 剩余卷
```

Wave 内的所有卷同时启动提取。

### 4.2 每卷提取内容（写隔离）

每卷写到独立目录 `waves/wave-NNN/vol-XX/`，包含：

```
waves/wave-NNN/vol-XX/
├── characters/              ← 本卷出现的角色（每人一个 period 片段）
│   ├── aria.json
│   ├── kinji.json
│   └── ...
├── abilities/               ← 本卷首次出现的能力
├── items/                   ← 本卷首次出现的物品
├── events/                  ← 本卷发生的事件
├── locations/               ← 本卷首次出现的地点
├── systems/                 ← 本卷首次出现的体系
├── factions/                ← 本卷首次出现的势力
├── knowledge/               ← 本卷揭示的情报/秘密
├── world.json               ← 本卷的世界观追加（timeline 条目等）
└── index.json               ← 本卷文件索引
```

**核心设计**：角色文件 `characters/{id}.json` 在卷隔离阶段**只包含一个 period**（当前卷的），不是完整的跨卷合并版。格式与模板完全一致，只是 `periods[]` 数组只含一项。

### 4.3 三 agent 审核闭环（并行版，与串行相同）

每卷内部仍然是 A→B→C→cycle 审核闭环：

```
per volume:
  Agent A（工人）  →  写 waves/wave-NNN/vol-XX/ 下的所有文件
  Agent B（审核）  →  审核，输出 issues[]
  Agent C（修复）  →  按 issues 修复
  → 重复 B 直到 issues = 0
```

唯一变化：路径改为 `waves/wave-NNN/vol-XX/`。

### 4.4 Wave 内的并发控制

```
每个 Wave 内：
├── Step 1: 启动 N 个 Agent A（并行）
│   → N = min(WAVE_SIZE, MAX_CONCURRENCY)
│   → 每个 A 处理一卷，写自己 vol-XX 目录
│   └── 全部完成
│
├── Step 2: 启动 N 个 Agent B（并行）
│   → 每个 B 审核一卷
│   └── 全部完成
│
├── Step 3: 收集 issues
│   ├─ 全部空 → wave 通过，进入下一个 wave
│   └─ 有 issues → Step 4
│
├── Step 4: 启动 N 个 Agent C（并行，只修正有 issues 的卷）
│   └── 全部完成 → 回到 Step 2
│
└── Step 5: Wave 完成
    ├─ 记录到 wave-manifest.json
    ├─ 更新 WORLD-p1-output/merged/ 暂存区（可选，用于中间可查询）
    └─ 进入下一个 wave
```

### 4.5 跨卷角色处理（Volatile Appending + 标签）

虽然原则上角色在合并阶段才拼接，但在进行后续 Wave 时，**后续 Wave 的 agent 需要知道角色是否已在前面的 Wave 中出现过**（以便追加 period 而非新建）。

解决方案：**只读暂存区 + 无锁追加**

```
┌─────────────────────────────────────────────────────────┐
│  merged/characters/ ← 只读暂存区                          │
│  每次 Wave 完成后，合并脚本运行一次                          │
│  将前面的 Wave 角色 periods 合并到 merged/characters/     │
│                                                          │
│  后续 Wave 的 Agent A 启动时：                             │
│  ├─ 先 read merged/characters/{id}.json（如果存在）       │
│  │   → 表示该角色已在前面 Wave 出现过                      │
│  │   → 本卷的 period 追加到 periods[]（写回 vol-XX）       │
│  ├─ 如果不存在 → 新角色，新建 period                      │
│  └─ 注意：Agent A 只写 vol-XX，不写 merged               │
└─────────────────────────────────────────────────────────┘
```

这样合并脚本每次运行只做"读取已有 + 追加新 period"的确定性操作，没有写冲突。

---

## 五、阶段二：串行合并（脚本 / 无 agent）

合并用本地 Node.js 脚本完成，**不给 agent**（agent 做不好 JSON 合并）。

### 5.1 角色合并 `merge-characters.js`

```
输入：waves/*/vol-*/characters/*.json
输出：merged/characters/*.json

流程：
for 每个 roleId:
  1. 找到该角色在所有 vol-XX 目录中的 period 文件
  2. 按卷号排序（vol-01 < vol-02 < ...）
  3. 提取每个文件的 periods[0]
  4. 按卷序归并到 periods[]
  5. 补充字段：_schema, character_id, name, aliases 等基础信息
  6. 计算 sum(periods[*].key_events.length) → key_event_count
  7. 写 merged/characters/{id}.json
```

冲突处理：
- 同一时期在不同卷中描述了同一角色的不同方面 → 保留两条 period，标注 `overlap: true`
- 同一角色的 `name` 在不同卷中写法不一致 → 以首次出现为准，后续别名追加到 `aliases`

### 5.2 能力/物品/事件/地点/体系/势力/情报去重 `dedup-by-id.js`

```
输入：waves/*/vol-*/abilities/*.json (以及同类)
输出：merged/abilities/*.json

流程：
for 每个类型目录:
  1. 遍历所有 vol-XX 文件
  2. 用 id 去重（首次出现为主）
  3. 同 id 的后继文件：
     - 追加 known_feats（能力） / history（物品） / related_events（事件）
     - 追加 _revisions
     - 追加 source_refs
  4. 写 merged/{type}/{id}.json
```

### 5.3 世界观合并 `merge-world.js`

```
输入：waves/*/vol-*/world.json
输出：merged/world.json

流程：
  1. 基础字段取首次出现版本
  2. timeline[] 按时间序归并
  3. rules[] 去重归并
  4. history_eras[] 按时间序归并
```

### 5.4 索引重建 `rebuild-index.js`

```
输入：merged/ 下所有文件
输出：merged/index.json

流程：
  1. 遍历 merged/characters/ → characters[]
  2. 遍历 merged/abilities/ → abilities[]
  3. 遍历 merged/items/ → items[]
  4. ...（每个类型）
  5. 计算 stats（总数、每卷覆盖数、角色 period 分布）
```

---

## 六、阶段三：全量校验（脚本）

```javascript
// validate-merged.js

// 检查项
const checks = [
  // 角色完整性：每个角色的 periods 数 >= 该角色出场卷数
  { name: "character-period-count", script: "char_period >= char_volume_count" },
  
  // 去重：所有 id 唯一
  { name: "unique-id", script: "no_duplicate_ids(merged/*/)" },
  
  // sourceRef 存在性：所有 sourceRef 路径可访问
  { name: "source-ref-exists", script: "check_source_refs(merged/*/)" },
  
  // 跨索引引用：abilities_owned 中的 id 必须在 abilities/ 中存在
  { name: "cross-ref-abilities", script: "check_cross_ref(character.abilities_owned, merged/abilities/)" },
  
  // 物品与角色同步：items/ 的 id 在角色的 possessions_owned 中可反向查找
  { name: "item-character-sync", script: "check_item_character_sync(merged/)" },
  
  // JSON 合法性：全部文件可 parse
  { name: "json-valid", script: "try_parse_all(merged/*.json, merged/*/*.json)" },
  
  // 全量统计
  { name: "stats", script: "count_all(merged/)" }
];
```

校验报告输出到 `merge-report.json` 和 `merge-report.md`。

---

## 七、Wave 进度管理

### 7.1 `wave-manifest.json`

```json
{
  "_schema": "rp-wave-manifest-v1",
  "world": "{WORLD}",
  "totalVolumes": {VOLUME_TOTAL},
  "waveSize": {WAVE_SIZE},
  "waves": [
    {
      "waveIndex": 1,
      "volumes": ["vol-01","vol-02","vol-03","vol-04","vol-05"],
      "status": "completed",
      "completedAt": "2026-07-06T12:00:00Z",
      "auditPassed": true,
      "totalIssues": 3,
      "issuesResolved": 3
    },
    {
      "waveIndex": 2,
      "volumes": ["vol-06","vol-07","vol-08","vol-09","vol-10"],
      "status": "running",
      "startedAt": "2026-07-06T13:00:00Z"
    }
  ],
  "merged": false,
  "mergeCompletedAt": null
}
```

### 7.2 断点续跑

每个 Wave 完成后更新 `wave-manifest.json`。如果中途中断，从最后一个未完成的 Wave 重新开始：

```
├─ 检查 wave-manifest.json
├─ 找 status != "completed" 的第一个 wave
├─ 该 wave 内：
│   ├─ 检查每个 vol-XX/output-exists
│   ├─ 已完成的 vol 跳过
│   └─ 未完成的 vol 重新提取
└─ 从中断处继续
```

---

## 八、并行 vs 串行 对比

| 维度 | 串行版 | ✅ 并行版 |
|:-----|:-------|:---------|
| 每卷提取 | A→B→C 串行，一次一卷 | A→B→C 串行，**N 卷同时** |
| 角色合并 | 实时增量追加（有锁） | **分卷隔离 → 脚本合并** |
| 审核闭环 | 同左 | 同左（每卷独立） |
| 精细度 | 高（逐卷审核） | **相同**（审核粒度不变） |
| 写冲突风险 | 无 | **无**（分卷隔离） |
| 核验基准 | phase0 全量 + 审核 | 同左 |
| 总时间（26卷，WAVE=5） | ~26 × (A+B+C) 循环时间 | **~ceil(26/5) × (A+B+C) ≈ 5 轮循环** |
| 断点续跑 | 逐卷 | 逐 Wave（效率更高） |

### 8.1 预估加速比

假设每卷提取时间 = T（A+B+审循环），最大并发 = 5：

| 卷数 | 串行时间 | 并行时间（WAVE=5） | 加速比 |
|:----|:---------|:------------------|:-------|
| 5 | 5T | 1T | 5× |
| 10 | 10T | 2T | 5× |
| 26（campione） | 26T | 6T | 4.3× |
| 49（hidan） | 49T | 10T | 4.9× |
| 55（danmachi） | 55T | 11T | 5× |

> 实际加速比受 agent_team 并发上限（MAX_CONCURRENCY ≤ 5）和审核迭代次数影响，约 3-5×。

---

## 九、agent_team 图模板

### 9.1 Wave 启动图模板

```json
{
  "objective": "提取 {WORLD} 第 wave-{N} 批（vol-{START}~vol-{END}）",
  "authority": {
    "allowFilesystemRead": true,
    "allowShellTools": false,
    "allowMutationTools": true,
    "allowProjectCode": true
  },
  "limits": {
    "concurrency": {MAX_CONCURRENCY},
    "timeoutSecondsPerStep": 900
  },
  "steps": [
    // ──────── Step 1: 工程师，每卷一个 ────────
    {
      "id": "extract-{WORLD}-vol-{XX}",
      "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/waves/wave-{N}/vol-{XX}/",
      "agent": {
        "system": "ACK-FIRST...（同串行版 Agent A system prompt，路径改为 waves/wave-{N}/vol-{XX}/）",
        "tools": ["read", "write"]
      },
      "task": "Start with ACK...\n\n读 {WORLD} vol-{XX}，写 waves/wave-{N}/vol-{XX}/...\n\n先读 {SOURCE_BASE}/{series}/vol-{XX}/原文\n参考 templates/（如果角色已在 merged/characters/ 存在则追加 period，否则新建）"
    },

    // ──────── Step 2: 审核员，每卷一个（依赖对应工程师）───────
    {
      "id": "audit-{WORLD}-vol-{XX}",
      "authority": { "allowFilesystemRead": true },
      "needs": ["extract-{WORLD}-vol-{XX}"],
      "agent": {
        "system": "ACK-FIRST...（同串行版 Agent B system prompt）",
        "tools": ["read"]
      },
      "task": "Start with ACK...\n\n审核 vol-{XX}。\n输出目录：waves/wave-{N}/vol-{XX}/"
    },

    // ──────── Step 3: 修复员，每卷一个（仅在 B 报 issues 时启动）───────
    // （由 parent 决定是否启动；如启动走 needs: ["audit-{WORLD}-vol-{XX}"]）
  ]
}
```

### 9.2 合并图模板

```json
{
  "objective": "合并 {WORLD} 所有 Wave 产出",
  "authority": { "allowProjectCode": true, "allowShellTools": true },
  "limits": { "concurrency": 1 },
  "steps": [{
    "id": "merge-{WORLD}",
    "mutationScope": "campaigns/world-library/manual-curation/{WORLD}-p1-output/merged/",
    "agent": {
      "system": "运行本地合并脚本。\n\nnode tools/p1-merge/merge-characters.js\nnode tools/p1-merge/dedup-by-id.js\nnode tools/p1-merge/merge-world.js\nnode tools/p1-merge/rebuild-index.js\nnode tools/p1-merge/validate-merged.js",
      "tools": ["bash"]
    },
    "task": "合并 {WORLD} 所有 waves/ 下的卷级产出到 merged/。\n输出合并报告到 waves/merge-report.md"
  }]
}
```

---

## 十、断点续跑规则

```
1. 读取 wave-manifest.json
2. 找到第一个 status != "completed" 的 wave
3. 检查该 wave 内的 vol-XX 目录：
   ├─ 如果 vol-XX 存在且完整 → 跳过
   └─ 如果 vol-XX 缺失或不完整 → 重新提取
4. 从中断的 wave 开始，重新启动 agent_team
5. 每个 Wave 完成后更新 wave-manifest.json：
   ├─ status: "completed"
   ├─ completedAt: 当前时间
   └─ auditPassed: true/false
6. 所有 Wave 完成后：
   ├─ status: "all-waves-complete"
   └→ 进入阶段二：合并
```

---

## 附录 A：模板定义

与串行版完全一致，见 `p1-scan-plan-GENERIC.md` 附录 A。

---

## 附录 B：快速启动清单

```
[ ] 1. 确认 raw-text 完整
[ ] 2. 创建 {OUTPUT_DIR} 及 _templates/
[ ] 3. 确定 WAVE_SIZE 和 MAX_CONCURRENCY
     ├─ WAVE_SIZE = min(SERIES_VOLUMES, 5) 推荐
     └─ MAX_CONCURRENCY = WAVE_SIZE（不要 > 5，会引发 API timeout）
[ ] 4. 创建 wave-manifest.json
[ ] 5. 启动 Wave 1（agent_team start）
[ ] 6. 每个 Wave 完成后检查审核结果
[ ] 7. 全部 Wave 完成后启动合并脚本
[ ] 8. 检查合并后的全量校验报告
[ ] 9. 将 merged/ 内容作为后续 Phase 的输入
```

---

## 附录 C：合并脚本接口规范

为了使合并脚本与具体世界解耦，脚本的输入输出必须遵循以下约定：

### `merge-characters.js`

```
输入：node merge-characters.js --world {WORLD} --waves ./waves/ --output ./merged/
行为：
  - 扫描 waves/wave-*/vol-*/characters/*.json
  - 按 character_id 分组
  - 按卷号排序 periods
  - 写入 merged/characters/{id}.json
输出：merged/characters/ (N 文件)
```

### `dedup-by-id.js`

```
输入：node dedup-by-id.js --world {WORLD} --waves ./waves/ --output ./merged/ --type abilities
行为：
  - 扫描 waves/wave-*/vol-*/{type}/*.json
  - 按 id 去重，首次出现为主
  - 后继文件合并 known_feats/history/related_events
  - 写入 merged/{type}/{id}.json
输出：merged/{type}/ (N 文件)
```

### `rebuild-index.js`

```
输入：node rebuild-index.js --world {WORLD} --merged ./merged/
行为：
  - 遍历 merged/ 下所有子目录
  - 统计各类型文件数
  - 生成 index.json
输出：merged/index.json
```
