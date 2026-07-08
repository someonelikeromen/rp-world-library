# 卷级数据提取 Plan v3（最终版）

> 核心设计：
> - **Phase 1**：每卷独立提取，角色文件含本卷内的时间段 periods
> - **Phase 2**：树状递进合并 → 最终每角色一个文件（跨卷 periods）
> - **隔离原则**：Worker 只写 `waves/`，只读 `merged/`（永不写 merged/）

---

## 零、数据模型

### 文件粒度

```
Phase 1 产出（提取阶段）：
  waves/wave-001/vol-01/characters/kinji.json
    └── periods[]  ← 本卷内的时间段（通常 1~3 条，不是 45 条）
         ├── { period_id: "vol-01-pre-battle",   label: "战前",   ... }
         └── { period_id: "vol-01-post-battle",  label: "战后",   ... }

Phase 2 产出（合并阶段）：
  merged/characters/kinji.json
    └── periods[]  ← 跨卷合并（所有卷的 periods 按时间序排列）
         ├── { period_id: "vol-01-pre-battle",   label: "战前",   ... }  ← 从 vol-01 来
         ├── { period_id: "vol-01-post-battle",  label: "战后",   ... }  ← 从 vol-01 来
         ├── { period_id: "vol-02",              label: "第二卷", ... }  ← 从 vol-02 来
         └── ...
```

### 角色边界

| 角色 | 权限 | 责任 |
|:-----|:-----|:-----|
| **主模型（Parent）** | 启动 agent_team、检查状态、读 issues | **只能做编排协调。不读原文、不写数据、不修复 issues、不做任何数据处理。** |
| **Worker A** | 读原文 + 写数据 | 提取本卷数据 |
| **Auditor B** | 只读 | 审核数据，输出 issues[] |
| **Fixer C** | 读 + 写 | 按 issues 修复 |
| **Merge** | 读 + 写 | 合并左右子节点 |
| **Merge Audit** | 只读 | 审核合并结果 |
| **Merge Fix** | 读 + 写 | 修复合并问题 |

**主模型禁止行为**：
- ⛔ 不得自己读取原文或数据文件
- ⛔ 不得自己写任何数据文件
- ⛔ 不得自己修改 JSON
- ⛔ 不得自己修复 issues
- ✅ 只做：`agent_team start` → `run_status wait` → 检查 issues → 决定重试/跳过

每条数据的可信度标注，用于 RP 引擎判断是否可用：

| 等级 | 含义 | 示例 |
|:-----|:-----|:------|
| **S** | 原文明确说明（直接引用） | `"rank": "E"` + sourceRef 行号 |
| **A** | 原文强暗示（跨段落归纳确认） | 外貌描写跨段落拼接 |
| **B** | 跨章归纳（多个章节共同证明） | 角色性格通过多次行为归纳 |
| **C** | 推测/待验证（无法直接命中原文） | 标注 `unverified` 说明原因 |
| **D** | 需删除（凭感觉/百科补全，无原文支持） | 不应出现在正式数据中 |

规则：
- SourceRef 精确到行号的 → 自动为 S 级
- 所有 C 级数据必须在 `curation-notes.md` 中说明不确定原因
- 提取 agent 如果无法确认 → 标 C 级，不能编造Merge（Phase 2 agent）：
  ── 读 → waves/wave-N/vol-XX/    ← 读所有卷的孤立文件
  ── 读 → intermediate/group-N/   ← 读中间产物
  ── 写 → intermediate/ 或 merged/  ← 只合并阶段写
```

---

## 一、目录结构

```
manual-curation/{WORLD}-p1-output/
│
├── _templates/                    ← 从 tools/p1-scan/_templates/ 拷贝
│
├── waves/                         ← Phase 1：卷级独立提取
│   ├── wave-001/
│   │   ├── vol-01/
│   │   │   ├── characters/
│   │   │   │   ├── kinji.json     ← 含 vol-01 内的 periods（1~3条）
│   │   │   │   ├── aria.json
│   │   │   │   └── ...
│   │   │   ├── abilities/
│   │   │   ├── items/
│   │   │   ├── events/
│   │   │   ├── locations/
│   │   │   ├── systems/
│   │   │   ├── factions/
│   │   │   ├── knowledge/
│   │   │   ├── world.json
│   │   │   └── index.json
│   │   ├── vol-02/
│   │   └── ...
│   ├── wave-002/
│   └── ...
│
├── intermediate/                  ← Phase 2：树状合并中间
│   ├── wave-001-merged/           ← Level 1: 5卷合并
│   │   ├── characters/kinji.json  ← periods[1..N] 跨卷
│   │   └── ...
│   ├── wave-002-merged/
│   ├── group-001/                 ← Level 2: 两组合并
│   └── ...
│
├── merged/                        ← Phase 2：最终产物
│   ├── characters/kinji.json      ← 全部跨卷 periods
│   ├── characters/index.json      ← 角色索引
│   ├── abilities/hss.json         ← 跨卷合并的能力
│   ├── events/battle-01.json      ← 跨卷合并的事件
│   ├── world.json
│   └── index.json                 ← 全局索引
│
├── wave-manifest.json
├── merge-state.json
└── merge-tree.json
```

---

## 二、Phase 1：并行提取

### 2.1 角色文件格式

**顶层只含元数据**——`_schema`, `world`, `character_id`, `volume`
**角色所有属性都在 `periods[]` 内**——name, gender, species, status, 全部。

因为即使 gender 和 species 也可能随剧情变化（转生、变身等）。

```json
{
  "_schema": "rp-character-volume-v1",
  "world": "hidan-no-aria",
  "character_id": "kinji",
  "volume": "vol-01",

  "time_range": {
    "start": "2010年4月",
    "end": "2010年4月"
  },
  "sub_arcs": ["相遇篇"],

  "periods": [
    {
      "period_id": "vol-01-pre-battle",
      "volume": "vol-01",
      "time": "2010年4月初",
      "label": "天台相遇",

      "name": { "zh": "远山金次" },
      "aliases": ["金次"],
      "titles": [],
      "gender": "男",
      "species": "人类",
      "nationality": "日本",
      "occupation": "武侦高中侦探科",
      "affiliation": "巴斯克维尔",
      "status": { "rank": "E" },
      "appearance": { "height": "172cm", "hair": "黑短" },
      "personality": { "summary": "渴望平凡生活" },
      "voice": { "tone": "冷静" },
      "habits": { "mannerisms": ["紧张时会摸后颈"] },
      "background": { "birth": { "place": "东京" } },
      "abilities_owned": ["hss"],
      "possessions_owned": [],
      "relationships": {
        "aria": { "type": "初遇", "status": "陌生" }
      },
      "knowledge": [],
      "secrets": [],
      "summary": "金次在天台遇到从天而降的亚莉亚...",
      "key_events": [
        { "event_id": "aria-first-meeting", "summary": "...", "sourceRef": "..." }
      ],
      "evidence_level": "S",
      "source_refs": ["main/vol-01/full.txt:271-500"]
    },
    {
      "period_id": "vol-01-post-battle",
      "volume": "vol-01",
      "time": "2010年4月中",
      "label": "首次合作",

      "name": "same_as_vol-01-pre-battle",
      "gender": "same_as_vol-01-pre-battle",
      "species": "same_as_vol-01-pre-battle",
      "nationality": "same_as_vol-01-pre-battle",
      "occupation": "same_as_vol-01-pre-battle",
      "affiliation": "same_as_vol-01-pre-battle",
      "status": "same_as_vol-01-pre-battle",
      "appearance": "same_as_vol-01-pre-battle",
      "personality": "same_as_vol-01-pre-battle",
      "voice": "same_as_vol-01-pre-battle",
      "habits": "same_as_vol-01-pre-battle",
      "background": "same_as_vol-01-pre-battle",
      "abilities_owned": "same_as_vol-01-pre-battle",
      "possessions_owned": "same_as_vol-01-pre-battle",
      "relationships": {
        "aria": { "type": "搭档", "status": "被迫合作" }
      },
      "knowledge": "same_as_vol-01-pre-battle",
      "secrets": "same_as_vol-01-pre-battle",
      "summary": "与亚莉亚合作对抗伊·U...",
      "key_events": [
        { "event_id": "iu-first-battle", "summary": "...", "sourceRef": "..." }
      ],
      "evidence_level": "S",
      "source_refs": ["main/vol-01/full.txt:800-1200"]
    }
  ],

  "source_refs": ["main/vol-01/full.txt"]
}
```

**原则**：
- 顶层：纯元数据 —— `_schema`, `world`, `character_id`, `volume`, `time_range`, `sub_arcs`
- `periods[]` 内：**角色所有属性**——name, gender, species, status, appearance 等全部在内
- 包括 gender, species, nationality ——没有哪个属性是

### 2.4 全部数据类型统一模型

不只是角色。**所有 10 类数据都遵循相同结构**：顶层纯元数据，全部变化在 `periods[]` 内。

```text
角色   characters/{id}.json：  periods[] 内包含 name/gender/species/status/abilities/relationships 等全部
能力   abilities/{id}.json：  periods[] 内包含 description/details/known_feats 等
物品   items/{id}.json：     periods[] 内包含 owner/status/description 等
事件   events/{id}.json：    periods[] 内包含 summary/participants/casualties 等
地点   locations/{id}.json： periods[] 内包含 description/residents/affiliation 等
体系   systems/{id}.json：   periods[] 内包含 principles/levels/practitioners 等
势力   factions/{id}.json：  periods[] 内包含 members/allies/enemies 等
情报   knowledge/{id}.json： periods[] 内包含 details/revealed_by/verification 等
世界观 world.json：          periods[] 内包含 timeline/events/eras 等
索引   index.json：          不适用（纯元数据）
```

#### 能力示例

```json
{
  "_schema": "rp-ability-v1",
  "world": "hidan-no-aria",
  "ability_id": "hss",
  "volume": "vol-01",

  "periods": [
    {
      "period_id": "vol-01",
      "volume": "vol-01",
      "name": { "zh": "爆发模式", "en": "HSS" },
      "type": "innate",
      "description": "远山家男性遗传的特殊体质...",
      "details": { "condition": "性兴奋触发", "倍率": "5x" },
      "known_feats": [
        { "feat": "反射神经5倍提升", "sourceRef": "vol-01/full.txt:450" }
      ],
      "shared_by": ["kinji", "kinsa"],
      "evidence_level": "S"
    }
  ]
}
```

#### 事件示例

```json
{
  "_schema": "rp-event-v1",
  "world": "hidan-no-aria",
  "event_id": "aria-first-meeting",
  "volume": "vol-01",

  "periods": [
    {
      "period_id": "vol-01",
      "volume": "vol-01",
      "summary": "金次在天台遇到从天而降的亚莉亚...",
      "participants": [
        { "character_id": "kinji", "role": "protagonist" },
        { "character_id": "aria", "role": "initiator" }
      ],
      "cause": "亚莉亚在追踪伊·U成员",
      "outcome": "金次被迫与亚莉亚组队",
      "significance": "全系列开端",
      "sourceRefs": ["vol-01/full.txt:271-500"]
    }
  ]
}
```

#### 物品示例

```json
{
  "_schema": "rp-item-v1",
  "world": "hidan-no-aria",
  "item_id": "beretta-m92f",
  "volume": "vol-01",

  "periods": [
    {
      "period_id": "vol-01",
      "volume": "vol-01",
      "name": { "zh": "贝瑞塔M92F" },
      "type": "weapon",
      "description": "亚莉亚使用的双枪之一",
      "owner": "aria",
      "status": "active",
      "features": ["双动", "15发弹匣"],
      "sourceRefs": ["vol-01/full.txt:300"]
    }
  ]
}
```

#### 合并的统一逻辑

所有数据类型合并时都做同一件事：

```
1. 读左右子节点的文件
2. 串联 periods[]（left + right），按 volume/time 排序
3. 检查相邻 period 的重复字段 → "same_as_vol-XX"
4. 合并顶层元数据（time_range, source_refs 等）
5. 写 output/{type}/{id}.json
```

区别只在 periods 内部的字段名不同，但结构完全一致。

---

## 三、Phase 2：树状合并

### 3.1 树拓扑

```
Level 0（waves/ 卷提取）
  vol-01  vol-02  vol-03  vol-04  vol-05
     ↘       ↘       ↘       ↘       ↘
Level 1（Wave 合并：拼接 + 排序 + 引用优化）
     →  wave-001-merged/characters/kinji.json
        periods = [vol-01-p1, vol-01-p2, vol-02-p1, vol-02-p2, ...]

Level 2（组内合并）
     →  group-001/characters/kinji.json
        periods = [wave-001's periods + wave-002's periods]

Level N（最终合并）
     →  merged/characters/kinji.json
        periods = [全部卷的 periods，按时间序排列]
```

#### 合并树生成算法

```javascript
function buildMergeTree(volumeCount, waveSize) {
  // Level 1: 按 wave 分组
  const waveCount = Math.ceil(volumeCount / waveSize);
  const waves = [];
  for (let i = 0; i < waveCount; i++) {
    const start = i * waveSize + 1;
    const end = Math.min((i + 1) * waveSize, volumeCount);
    const vols = [];
    for (let v = start; v <= end; v++) vols.push(`vol-${String(v).padStart(2,'0')}`);
    waves.push({
      id: `wave-${String(i+1).padStart(3,'0')}-merged`,
      level: 1,
      children: vols,
      status: 'pending'
    });
  }

  // Level 2+: 两两合并
  const allNodes = [...waves];
  let current = waves;
  let level = 2;
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        const node = {
          id: `group-${String(level).padStart(2,'0')}-${String(i/2).padStart(3,'0')}`,
          level: level,
          children: [current[i].id, current[i+1].id],
          status: 'pending'
        };
        next.push(node);
        allNodes.push(node);
      } else {
        next.push(current[i]);  // 奇数节点直接提升
      }
    }
    current = next;
    level++;
  }

  return { levels: allNodes, rootId: current[0]?.id };
}
```

执行拓扑：先完成 Level 1 所有节点 → 再 Level 2 → 直到 root。
同一 Level 的节点互不依赖，可以并行。

#### 合并冲突处理

| 冲突类型 | 场景 | 处理方式 |
|:---------|:-----|:---------|
| **period_id 重复** | 左右子节点都有 `vol-05` 的 period | 保留两条，后缀 `_left`/`_right`，在合并报告中标记 conflict |
| **同一角色名不一致** | left 写 `远山金次`，right 写 `Tooyama Kinji` | 以 left（先出现的）为准，right 版本追加到 aliases |
| **abilities_owned 差异** | left 有 hss，right 没有（丢失数据） | 合集去重，不会丢失现有能力 |
| **time_range 矛盾** | left 说 vol-05 是 4月，right 说 5月 | 取并集：start 取最早，end 取最晚 |
| **证据等级冲突** | left 标 S，right 标 A | 取更高等级 S |
| **same_as 链断裂** | right 引用 `same_as_vol-XX` 但 XX 不在本节点中 | 回溯到 XX 所在子节点查找；如果找不到 → 标记 broken_ref 到合并报告 |

所有冲突记录到合并报告的 `conflicts[]` 数组，不静默处理。

合并 agent **不做字段级合并**。每个 period 本身就是完整快照。
对所有 10 类数据都执行同一逻辑：串联 periods → 排序 → same_as 优化。

#### 3.2.1 合并算法（通用）

```
对左右子目录中每个 character_id：

  Step 1: 读 left/characters/{id}.json
  Step 2: 读 right/characters/{id}.json

  Step 3: 串联 periods[]
    merged.periods = left.periods + right.periods
    merged.periods.sort_by(volume, time)
    // 注意：每个 period 已经是完整快照（含 name, status, appearance 等）
    // 不需要合并字段内容

  Step 4: 应用 same_as 引用优化
    for i = 1 to merged.periods.length-1:
      prev = merged.periods[i-1]
      curr = merged.periods[i]
      for 每个 field in [快照字段]:
        if deep_equal(curr[field], prev[field]):
          curr[field] = "same_as_" + prev.period_id
    
    // 永远不引用的字段：
    //   period_id, volume, time, label
    //   summary, key_events
    //   source_refs

  Step 5: 顶层元数据合并
    merged.character_id = left.character_id
    merged.time_range = {
      start: min(left.time_range.start, right.time_range.start),
      end:   max(left.time_range.end, right.time_range.end)
    }
    merged.sub_arcs = dedup(left.sub_arcs + right.sub_arcs)
    merged.volume_range = left.volume + "~" + right.volume
    merged.source_refs = dedup(left.source_refs + right.source_refs)

  Step 6: 写 output/characters/{id}.json
```

#### 3.2.2 为什么不做字段级合并

举个例子说明字段级合并的错误：

```
left（vol-01~05）的 kinji：
  name: { zh: "远山金次" }
  aliases: ["金次"]
  status: { rank: "E", occupation: "武侦高中" }
  relationships: { aria: { type: "搭档" } }

right（vol-06~10）的 kinji：
  name: { zh: "远山金次" }                    ← 名字没变
  aliases: ["金次", "克罗梅德尔"]             ← 多了新别名
  status: { rank: "D", occupation: "武侦高中" }  ← rank 升级
  relationships: { aria: { type: "挚友" } }    ← 关系变了

错误合并（字段级取最新/合集）：
  name: 取最新 → "远山金次"（没变，正确）
  aliases: 合集 → ["金次", "克罗梅德尔"]（正确，但问题在于——）
  status: 取最新 → { rank: "D" }           ← 丢失 vol-01~05 的 rank E
  relationships: 取最新 → { aria: "挚友" }  ← 丢失 vol-01~05 的 "搭档"

  → 读了这个文件的人不知道金次曾经 rank E 过！
  → 丢失了角色成长的历史信息！
```

**正确的做法**：每个 vol 的 state 保留在各自的 period 内，读的人自己看时间线。

```
正确合并结果：
  periods: [
    { period_id: "vol-01", ..., status: { rank: "E" }, relationships: { aria: "搭档" } },
    { period_id: "vol-02", ..., status: "same_as_vol-01", relationships: "same_as_vol-01" },
    ...
    { period_id: "vol-06", ..., status: { rank: "D" }, relationships: { aria: "挚友" } },
  ]

  → 保留了完整的历史轨迹
  → 查询 "vol-03 的金次" → 直接读 periods[2]
  → 查询 "金次的 rank 变化史" → 遍历 periods 取 status
```

#### 3.2.3 使用 json-tool.cjs copy 实现

```bash
# 新建目标文件
node json-tool.cjs create output/characters/kinji.json @_templates/character.json

# 复制顶层基础字段
node json-tool.cjs copy left/characters/kinji.json character_id output/characters/kinji.json character_id replace
node json-tool.cjs copy left/characters/kinji.json gender output/characters/kinji.json gender replace
node json-tool.cjs copy left/characters/kinji.json species output/characters/kinji.json species replace

# 串联 periods（左右各 append 一次）
node json-tool.cjs copy left/characters/kinji.json periods output/characters/kinji.json periods append
node json-tool.cjs copy right/characters/kinji.json periods output/characters/kinji.json periods append

# time_range 并集
node json-tool.cjs copy left/characters/kinji.json time_range output/characters/kinji.json time_range merge
node json-tool.cjs copy right/characters/kinji.json time_range output/characters/kinji.json time_range merge

# sub_arcs / source_refs 合集
node json-tool.cjs copy left/characters/kinji.json sub_arcs output/characters/kinji.json sub_arcs merge
node json-tool.cjs copy right/characters/kinji.json source_refs output/characters/kinji.json source_refs merge
```

#### 3.2.4 same_as 优化

串联完成后，对相邻的 periods 做引用式省略：

```bash
# 由 agent 或脚本依次检查每个 period 的每个字段：
# 如果 curr.field == prev.field → curr.field = "same_as_{prev.period_id}"
#
# 用 json-tool 读取比较：
node json-tool.cjs read output/characters/kinji.json 'periods[period_id=vol-06].status'
node json-tool.cjs read output/characters/kinji.json 'periods[period_id=vol-05].status'
# 如果相同 →
node json-tool.cjs set output/characters/kinji.json \
  'periods[period_id=vol-06].status' '"same_as_vol-05"'
```

### 3.3 引用式省略规则（合并时）

```
对已拼接排序的 periods 遍历：

for i = 1 to periods.length-1:
  for 每个 field in [status, appearance, personality, voice, habits,
                    abilities_owned, possessions_owned, relationships,
                    background, evidence_level]:
    if periods[i][field] 与 periods[i-1][field] 内容完全相同
      → 将 periods[i][field] 替换为 "same_as_{periods[i-1].period_id}"
```

**永远不省略**：`period_id`, `label`, `time`, `summary`, `key_events`, `source_refs`

### 3.4 合并审核闭环

每个合并节点完成后，走完整的 A→B→C 闭环：

```
Merge Agent（执行合并）
    ↓
Merge Audit Agent（审核合并结果）
    ├─ issues = [] → 父节点解锁
    └─ issues > 0 → Merge Fix Agent
                       ↓
                  重新 Audit（循环到 issues = 0）
```

#### Merge Audit 检查项

| # | 检查项 | 严重度 |
|:--|:-------|:-------|
| 1 | periods 按 volume/time 递增排序 | error |
| 2 | 无重复 period_id | error |
| 3 | 所有 `same_as_vol-XX` 引用的 period_id 在结果中存在 | error |
| 4 | 左右子节点的所有角色都在结果中 | error |
| 5 | `same_as_vol-XX` 可递归解析到实际值（不形成环） | warning |
| 6 | time_range 为左右并集 | warning |
| 7 | source_refs 未丢失 | warning |

#### Merge step 依赖链

```
merge-{NODE} → audit-merge-{NODE} → fix-merge-{NODE}（按需）

merge-{NODE} needs: [左子节点 audit, 右子节点 audit]
audit-merge-{NODE} needs: [merge-{NODE}]
fix-merge-{NODE} needs: [audit-merge-{NODE}]
```

Merge Audit / Fix 的完整提示词见 §9.5、§9.6。

---

## 四、索引构建

### 4.1 角色索引

```json
// merged/characters/index.json
{
  "_schema": "rp-character-index-v1",
  "world": "hidan-no-aria",
  "totalCharacters": 144,
  "totalPeriods": 319,
  "characters": {
    "kinji": {
      "name": "远山金次",
      "volumes": ["vol-01","vol-02",...,"vol-45"],
      "periodCount": 52,
      "file": "kinji.json"
    },
    "aria": {
      "name": "神崎.H.亚莉亚",
      "volumes": ["vol-01","vol-03",...,"vol-45"],
      "periodCount": 48,
      "file": "aria.json"
    }
  }
}
```

### 4.2 全局索引

```json
// merged/index.json
{
  "world": "hidan-no-aria",
  "version": "2026-07-06",
  "files": {
    "characters": { "count": 144, "index_file": "characters/index.json" },
    "abilities": { "count": 35 },
    "events": { "count": 150 },
    "items": { "count": 80 },
    "locations": { "count": 40 },
    "systems": { "count": 12 },
    "factions": { "count": 18 },
    "knowledge": { "count": 60 }
  },
  "source_refs": {
    "total_volumes": 45,
    "coverage": "full"
  }
}
```

---

## 五、进度管理

### 5.1 wave-manifest.json

每个 Wave 完成后更新此文件，记录提取进度：

```json
{
  "_schema": "rp-wave-manifest-v1",
  "world": "hidan-no-aria",
  "totalVolumes": 45,
  "waveSize": 5,
  "waves": [
    {
      "waveIndex": 1,
      "volumes": ["vol-01","vol-02","vol-03","vol-04","vol-05"],
      "status": "completed",
      "completedAt": "2026-07-06T12:00:00Z",
      "allAuditsPassed": true,
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
  "mergeTree": { "levels": [], "rootId": null },
  "merged": false
}
```

### 5.2 断点续跑

#### 提取阶段
```
1. 读 wave-manifest.json
2. 找第一个 status != "completed" 的 wave
3. 该 wave 内：
   ├─ 已完成的 vol 跳过
   └─ 未完成的 vol 重新提取
4. 从中断的 wave 继续
```

#### 合并阶段
```
1. 读 merge-tree.json
2. 找第一个 status != "completed" 的节点
3. 检查其所有子节点已完成
4. 启动该节点的合并 + 审核闭环
5. 完成后更新 status: "completed"
```

**重试策略**
| 失败类型 | 重试次数 | 说明 |
|:---------|:---------|:-----|
| RPC timeout（已写盘） | 3 次 | 文件已写，只是确认超时 → 直接标记成功 |
| RPC timeout（未写盘） | 3 次 | 重新启动相同任务 |
| JSON 损坏 | 运行 fix-json.cjs 后 1 次 | 自动修复后重试 |
| 审核不通过 | 依赖 C 修复后 2 次 | C 修复 → B 复审循环 |
| API 错误 | 3 次 | 间隔 15 秒后重试 |

---

## 六、多系列世界处理

适用于 danmachi（5 系列）、campione（2 系列）等多系列世界。

### 6.1 每个系列独立管线

```
每系列走一套独立的 Phase 1 + Phase 2：
  {OUTPUT_DIR}-{series1}/waves/...
  {OUTPUT_DIR}-{series1}/merged/...
  {OUTPUT_DIR}-{series2}/waves/...
  {OUTPUT_DIR}-{series2}/merged/...
```

### 6.2 跨系列合并

所有系列完成各自的 Phase 1 后，启动一次跨系列合并：

```json
{
  "id": "cross-series-merge",
  "needs": ["series1-merge-complete", "series2-merge-complete"],
  "agent": {
    "system": "跨系列合并 agent：\n\n1. 读 series1/merged/characters/\n2. 读 series2/merged/characters/\n3. 对同一 character_id：按时间序拼接 periods\n4. 对系列独有角色：直接保留\n5. 跨系列事件关联：建立 related_events\n6. audit + fix 闭环\n7. 最终写入 {WORLD}-merged/ 全局目录"
  }
}
```

### 6.3 系列间数据引用
- 角色跨系列登场 → 在 `aliases` 中标注系列来源
- 事件跨系列关联 → 在 `related_events` 中标注 `{series}-{event_id}`
- 能力跨系列继承 → 在 `shared_by` 中标注角色全 ID

---

## 七、与之前方案的关键区别

### 5.1 数据模型演进

```
v1（原始方案）：
  characters/kinji.json
    └── periods[] = [全部45卷]          ← 一个文件装所有，写入冲突

v2（卷独立文件）：
  characters/kinji/vol-01.json          ← 每卷一个文件
  characters/kinji/vol-02.json          ← 但无 periods 结构
  （无最终合并版）                         ← 缺少跨卷视图

v3（✅ 当前方案）：
  waves/.../characters/kinji.json       ← 卷级提取，含卷内 periods（1~3条）
    └── periods[] = [vol-01-p1, vol-01-p2]
  
  merged/characters/kinji.json          ← 树状合并最终版
    └── periods[] = [vol-01-p1, vol-01-p2, vol-02-p1, ..., vol-45-pN]
```

### 5.2 硬性约束总结

| 约束 | 违例后果 |
|:-----|:---------|
| Worker 不得写 merged/ | 并发覆盖 |
| Worker 不得包含前卷 periods | pre-XX-summary 数据丢失 |
| 模板驱动，不发明字段 | 字段不一致，合并困难 |
| sourceRef 不得为空/"..." | 数据不可追溯 |
| 合并 agent 保留所有 period_id | 跨卷引用断裂 |

---

## 八、工具链

| 工具 | 用途 | 位置 |
|:-----|:------|:-----|
| `json-tool.cjs` | 所有 JSON 读写 | `tools/p1-scan/json-tool.cjs` |
| `fix-json.cjs` | 修复损坏 JSON | `tools/p1-scan/fix-json.cjs` |
| `_templates/` | 9 个 period 模板 | `tools/p1-scan/_templates/` |
| `AGENT-COOKBOOK.md` | 子 agent json-tool 使用指南 | `tools/p1-scan/AGENT-COOKBOOK.md` |

`copy` 命令的三种 mode：

```bash
# append: 拼接 periods
node json-tool.cjs copy left/characters/kinji.json periods output/characters/kinji.json periods append

# merge: 合并能力数据
node json-tool.cjs copy left/abilities/hss.json '' output/abilities/hss.json '' merge

# replace: 覆盖字段
node json-tool.cjs copy right/characters/kinji.json 'periods[period_id=vol-02]' output/characters/kinji.json 'periods[period_id=vol-02]' replace
```

---

## 九、Agent 提示词模板

### 9.1 Agent A（提取 Worker）

#### 运行参数

| 参数 | 值 | 说明 |
|:-----|:---|:------|
| 推荐模型 | `lt-yuyu/gpt-5.5` | 上下文 258K，需强阅读理解长篇原文 |
| 超时 | 900s | 读一卷原文（~50KB）+ 写 10 类数据文件 |
| 可用工具 | `read`, `write`, `bash` | write 用于写临时 JSON 数据文件 |
| context 上限 | 64000 tokens | 原文 + 已有角色数据 |
| 重试策略 | 最多 3 次自动重试 | ACK-first 后 RPC timeout 不影响已写文件 |
| 并发上限 | `min(WAVE_SIZE, 5)` | 与 Wave 并行度一致 |
| needs | 无 | 每卷独立提取，互不依赖 |
| mutationScope | `{OUTPUT_DIR}/waves/wave-{N}/vol-{XX}/` | 只写本卷目录 |
| authority.allowFilesystemRead | true | 读原文和模板 |
| authority.allowMutationTools | true | 写 JSON 数据文件 |

#### 隔离设计
- 不知道其他 agent 的存在
- 只读 `merged/`，不写 `merged/`
- 只写 `waves/wave-N/vol-XX/`

#### agent_team step 定义
```json
{
  "id": "extract-{WORLD}-vol-{XX}",
  "mutationScope": "{OUTPUT_DIR}/waves/wave-{N}/vol-{XX}/",
  "agent": {
    "system": "【将下方提示词填入此处，替换 {参数} 占位符】",
    "tools": ["read", "write", "bash"]
  },
  "task": "Start with ACK, then immediately use tools; do not stop after ACK.\n\n读 {WORLD} vol-{XX} 原文，写 {OUTPUT_DIR}/waves/wave-{N}/vol-{XX}/"
}
```

#### 提示词

```markdown
# Worker Prompt（提取 Agent A）

## ACK-first
首行只输出 `ACK`，在同一轮内立即调用第一个工具（read 模板或原文）。
禁止首行输出计划、分析或长说明。

## 任务
读 {SOURCE_PATH} 原文，提取本卷数据写到 {OUTPUT_PATH}

## 读取策略（根据 {CHAPTER_PATTERN} 选择）

### 方式 A：合并文件（full.txt）
一卷只有一个 full.txt：`raw-text/{series}/vol-XX/full.txt`
如果有 split-text 的 chapters.json，先读它获取行范围。
sourceRef 格式：`{series}/vol-XX/full.txt:{startLine}-{endLine}`

### 方式 B：分章文件（split）
每章独立 txt 文件，可选 _manifest.json。
sourceRef 格式：`{series}/vol-XX/02-第一章...txt`

## 产出（一卷十产）
```
{OUTPUT_PATH}/
├── characters/{id}.json    ← 本卷角色完整快照（periods[] 只含本卷内时间段）
├── abilities/{id}.json     ← 本卷首次发现的能力
├── items/{id}.json         ← 本卷首次发现的物品
├── events/{id}.json        ← 本卷发生的事件
├── locations/{id}.json     ← 本卷首次出现的地点
├── systems/{id}.json       ← 本卷首次出现的体系
├── factions/{id}.json      ← 本卷首次出现的势力
├── knowledge/{id}.json     ← 本卷揭示的情报
├── world.json              ← 本卷 timeline/events 追加
└── index.json              ← 本卷文件索引
```

## 统一数据模型
所有类型遵循相同结构——顶层纯元数据，全部内容在 periods[] 内：
```json
{
  "_schema": "rp-{type}-volume-v1",
  "world": "...",
  "{type}_id": "...",
  "volume": "vol-XX",
  "periods": [{
    "period_id": "vol-XX-{section}",
    "volume": "vol-XX",
    "time": "...",
    "label": "...",
    // 所有属性在 periods[] 内，没有属性在顶层
  }]
}
```

## 跨 Wave 角色认知（只读 merged/）
如果 {MERGED_PATH}/characters/{id}.json 已存在：
  read → 了解角色已有能力 → 本卷 abilities_new 标注新增
  ⛔ 不得修改 merged/ 下的任何文件

## 硬性约束

### 工具限制
- ⛔ **禁止自己编写代码、创建脚本或新工具**
- ⛔ **禁止使用 node 以外的运行时**（python, deno 等）
- ✅ 只能使用现有工具：`read`, `write`, `bash` + `json-tool.cjs`
- ✅ 所有 JSON 操作必须通过 `json-tool.cjs`，禁止手写 JSON 到文件
- ✅ 所有文件路径必须精确，不得使用通配符或模糊匹配

### 写入约束
- ⛔ 不得包含前几卷数据，periods[] 只含本卷内时间段
- ⛔ 不得创建汇总型 period（如 pre-vol-XX-summary）
- ⛔ 不得修改已有文件或 merged/ 下的任何文件
- ✅ 只用 json-tool.cjs append/batch，不用 write 覆盖

### sourceRef 规则
- ❌ 禁止：空字符串 ""、省略号 "..."、占位符 "[TODO]"
- ✅ 格式：{series}/vol-XX/{filename}:{行号}

### 模板驱动
写每个 JSON 前先 read 对应模板。不自己发明字段名。

### 卷内引用式省略
如果本卷内第二个 period 某字段与第一个相同：→ same_as_{period_id}
永不省略：period_id, volume, time, label, summary, key_events, source_refs

### Agent 隔离
你不知道上一个 agent 是谁。只根据你读到的文件判断。

## 操作工具
- 临时数据文件写入项目目录 `{OUTPUT_DIR}/.tmp/`，不使用系统 /tmp
```bash
mkdir -p {OUTPUT_DIR}/.tmp
node {TOOL_DIR}/json-tool.cjs read {TEMPLATE_DIR}/character.json
# 先写临时数据文件到项目目录
node {TOOL_DIR}/json-tool.cjs create {OUTPUT_DIR}/.tmp/kinji-data.json '{"character_id":"kinji","periods":[]}'
node {TOOL_DIR}/json-tool.cjs create {OUTPUT_PATH}/characters/kinji.json @{OUTPUT_DIR}/.tmp/kinji-data.json
# 追加 period 同样
node {TOOL_DIR}/json-tool.cjs create {OUTPUT_DIR}/.tmp/vol01-period.json '{"period_id":"vol-01",...}'
node {TOOL_DIR}/json-tool.cjs append {OUTPUT_PATH}/characters/kinji.json periods @{OUTPUT_DIR}/.tmp/vol01-period.json
node {TOOL_DIR}/json-tool.cjs validate {OUTPUT_PATH}/
```
```

---

### 9.2 Agent B（审核 Auditor）

#### 运行参数

| 参数 | 值 | 说明 |
|:-----|:---|:------|
| 推荐模型 | `lt-yuyu/gpt-5.4-mini` | 上下文 258K，标准模型足够 |
| 超时 | 900s | 审核文件和原文 |
| 可用工具 | `read`, `bash` | **禁止 write**——审核员只读不写 |
| context 上限 | 258000 tokens | 与 lt-yuyu:gpt-5.4-mini 上下文一致 |
| 重试策略 | 最多 2 次 | 标准重试 |
| 并发上限 | `min(WAVE_SIZE, 5)` | 与 Worker 并行度一致 |
| needs | `extract-{WORLD}-vol-{XX}` | 依赖对应 Worker 完成 |
| mutationScope | 无 | 审核员不写任何文件 |
| authority.allowFilesystemRead | true | 读产出文件和原文 |

#### 隔离设计
- 不知道 Worker 的过程，只看到产出的文件
- 输出 issues[] 清单，不修改任何文件
- 如果 issues 不为空 → parent 启动 Fixer

#### agent_team step 定义
```json
{
  "id": "audit-{WORLD}-vol-{XX}",
  "needs": ["extract-{WORLD}-vol-{XX}"],
  "authority": { "allowFilesystemRead": true },
  "agent": {
    "system": "【将下方提示词填入此处，替换 {参数} 占位符】",
    "tools": ["read", "bash"]
  },
  "task": "Start with ACK.\n\n审核 {WORLD} vol-{XX}。输出目录：{OUTPUT_DIR}/waves/wave-{N}/vol-{XX}/"
}
```

#### 提示词

```markdown## 任务
审核 {OUTPUT_PATH} 的数据质量，输出 issues[] 清单。

## 工具
- ✅ 只能使用 `read` 和 `bash`，**没有 write**
- ⛔ **禁止自己编写代码、创建脚本或新工具**
- ✅ 所有文件读取通过 `json-tool.cjs read`

## 审核检查项

### 1. 【硬性】period 完整性
查找 pre-*-summary / merged / summary 等汇总型 period_id → issue: critical

### 2. 【硬性】sourceRef 有效性
- ❌ 空字符串 "" → error
- ❌ 省略号 "..." → error
- ❌ 占位符 "[TODO]" / "[TBD]" → error
- ✅ 含 {series}/vol-XX/ 和文件名 → pass

### 3. 本卷角色覆盖
原文出场角色是否都在 index.json 的 characters 列表中？遗漏 → warning

### 4. 数据与原文一致性
period 数据、能力数值、事件描述与原文一致？

### 5. 格式合规
遵循 _templates/ 字段结构？period_id 命名规范（vol-XX-{label}）？

### 6. schema 统一性
顶层只有元数据？所有属性在 periods[] 内？

## 输出格式
```json
{ "severity": "critical|error|warning", "file": "characters/kinji.json", "period": "vol-01", "field": "source_refs[0]", "description": "空字符串", "suggestion": "填入 vol-01/full.txt:450" }
```
无问题输出：`{ "status": "passed", "files_checked": 12 }`

## 审核范围
所有 10 类数据 + 对照原文抽查
```

---

### 9.3 Agent C（修复 Fixer）

#### 运行参数

| 参数 | 值 | 说明 |
|:-----|:---|:------|
| 推荐模型 | `lt-yuyu/gpt-5.4-mini` | 上下文 258K |
| 超时 | 900s |
| 可用工具 | `read`, `write`, `bash` |
| context 上限 | 258000 tokens |
| 重试策略 | 最多 2 次 | — |
| 并发上限 | `min(WAVE_SIZE, 5)` | 与 Worker 并行度一致 |
| needs | `audit-{WORLD}-vol-{XX}` | 依赖对应 Auditor 完成 |
| mutationScope | `{OUTPUT_DIR}/waves/wave-{N}/vol-{XX}/` | 只修本卷 |
| authority.allowFilesystemRead | true | 读原文对照 |
| authority.allowMutationTools | true | 修复 JSON |

#### 修复规则
- 每次只修 1 个独立 issue
- 只修 issues[] 中列出的问题，不改无关内容
- 每次修复后 append _revisions 记录
- 修完后运行 validate
- 修复完成后 → parent 启动 Auditor 复审

#### agent_team step 定义
```json
{
  "id": "fix-{WORLD}-vol-{XX}",
  "needs": ["audit-{WORLD}-vol-{XX}"],
  "mutationScope": "{OUTPUT_DIR}/waves/wave-{N}/vol-{XX}/",
  "agent": {
    "system": "【将下方提示词填入此处，替换 {参数} 占位符】",
    "tools": ["read", "write", "bash"]
  },
  "task": "Start with ACK.\n\n修复 {WORLD} vol-{XX} 的问题。\nParent 提供的 issues 清单将在 task 中传递。"
}
```

#### 提示词

```markdown## ACK-first
首行只输出 `ACK`，立即调用工具。

## 任务
按 issues[] 清单修复 {OUTPUT_PATH} 的数据。

## 修复规则
- ⛔ **禁止自己编写代码、创建脚本或新工具**
- ⛔ **禁止使用 node 以外的运行时**
- ✅ 只能用 `json-tool.cjs` 操作 JSON
- 1. 只修 issues 中指出的问题，不改无关内容
- 2. 每次批量修复最多 5 个 issue
- 3. 每个修复后 append _revisions 记录
- 4. 修完后运行 validate 确认 JSON 合法

## 常用修复操作
```bash
# 修复 sourceRef
node {TOOL_DIR}/json-tool.cjs set {OUTPUT_PATH}/characters/kinji.json \
  'periods[period_id=vol-26].key_events[0].sourceRef' '"main/vol-26/full.txt:450"'

# 修复缺失字段
node {TOOL_DIR}/json-tool.cjs set {OUTPUT_PATH}/characters/kinji.json \
  'periods[period_id=vol-01]' @corrected-period.json

# 删除重复项
node {TOOL_DIR}/json-tool.cjs remove {OUTPUT_PATH}/characters/kinji.json \
  'periods[period_id=duplicate]'

# 追加修订记录
node {TOOL_DIR}/json-tool.cjs append {OUTPUT_PATH}/characters/kinji.json \
  _revisions '{"date":"{DATE}","note":"修复 sourceRef"}'

# 修复后用 validate 确认
node {TOOL_DIR}/json-tool.cjs validate {OUTPUT_PATH}/
```

## 修复完成报告
```json
{ "status": "fixed", "issues_fixed": 3, "files_modified": ["characters/kinji.json"] }
```
```

---

### 9.4 Merge Agent（合并）

#### 运行参数

| 参数 | 值 | 说明 |
|:-----|:---|:------|
| 推荐模型 | `lt-yuyu/gpt-5.5` | 上下文 258K，需理解跨卷演化 |
| 超时 | 900s | 合并两个子节点的所有文件 |
| 可用工具 | `read`, `write`, `bash` | 主要用 json-tool.cjs copy |
| context 上限 | 258000 tokens | 左右子节点的所有角色数据 |
| 重试策略 | 最多 3 次 | 大文件可能超时 |
| 并发上限 | `ceil(WAVE_COUNT/2)` | 同层节点间无依赖 |
| needs | 左右子节点的审计通过 | 所有子节点通过审核后才能合并 |
| after | merge-{NODE} → audit-merge-{NODE} → fix-merge-{NODE}（可选） | 合并节点本身也需要审核闭环 |
| mutationScope | `{OUTPUT_DIR}/intermediate/{node}/` | 只写本节点 |
| authority.allowFilesystemRead | true | 读左右子节点 |
| authority.allowMutationTools | true | 写合并结果 |

#### 依赖示例（树状结构）

```
Level 1: merge-wave-001  needs: extract-vol-01, extract-vol-02...
         merge-wave-002  needs: extract-vol-06, extract-vol-07...
Level 2: merge-group-001 needs: merge-wave-001, merge-wave-002
Level 3: merge-final     needs: merge-group-001, merge-group-002
```

#### agent_team step 定义（三个步骤）

**Step 1: 合并**
```json
{
  "id": "merge-{WORLD}-{NODE_ID}",
  "needs": ["audit-{LEFT_NODE}", "audit-{RIGHT_NODE}"],
  "mutationScope": "{OUTPUT_DIR}/intermediate/{NODE_ID}/",
  "agent": {
    "system": "【将下方合并提示词填入】",
    "tools": ["read", "write", "bash"]
  },
  "task": "Start with ACK.\n\n合并 {LEFT_NODE} + {RIGHT_NODE} → {NODE_ID}"
}
```

**Step 2: 审核合并结果**
```json
{
  "id": "audit-merge-{WORLD}-{NODE_ID}",
  "needs": ["merge-{WORLD}-{NODE_ID}"],
  "authority": { "allowFilesystemRead": true },
  "agent": {
    "system": "【将 Merge Audit 提示词填入】",
    "tools": ["read", "bash"]
  },
  "task": "Start with ACK.\n\n审核合并结果：{OUTPUT_DIR}/intermediate/{NODE_ID}/"
}
```

**Step 3: 修复（按需）**
```json
{
  "id": "fix-merge-{WORLD}-{NODE_ID}",
  "needs": ["audit-merge-{WORLD}-{NODE_ID}"],
  "mutationScope": "{OUTPUT_DIR}/intermediate/{NODE_ID}/",
  "agent": {
    "system": "【将 Merge Fix 提示词填入】",
    "tools": ["read", "write", "bash"]
  },
  "task": "Start with ACK.\n\n修复合并节点 {NODE_ID} 的 issues"
}
```

#### 依赖链示例

```
Level 1: extract-vol-01 → audit-vol-01 → fix-vol-01（按需）
Level 2: merge-wave-001 needs: audit-vol-01~05
         → audit-merge-wave-001 → fix-merge-wave-001（按需）
Level 3: merge-group-001 needs: audit-merge-wave-001, audit-merge-wave-002
         → audit-merge-group-001 → fix-merge-group-001（按需）
Level N: merge-final needs: audit-merge-{groups}
         → audit-merge-final → fix-merge-final
```

#### 提示词

```markdown## ACK-first
首行只输出 `ACK`，立即调用工具。

## 任务
合并左右子节点的数据到输出节点。
输入：{LEFT_PATH}/  和  {RIGHT_PATH}/
输出：{OUTPUT_PATH}/

## 合并逻辑（所有类型统一）

- ⛔ **禁止自己编写代码、创建脚本或新工具**
- ✅ 只能用 `json-tool.cjs copy` 和 `json-tool.cjs set` 操作

```
1. 读 left/characters/{id}.json
2. 读 right/characters/{id}.json
3. 串联 periods[]：left.periods + right.periods → 按 volume/time 排序
4. 应用 same_as 优化：
   for i = 1 to len-1:
     for 每个字段:
       if periods[i][field] == periods[i-1][field]:
         periods[i][field] = "same_as_{prev.period_id}"
   永不优化：period_id, volume, time, label, summary, key_events, source_refs
5. 顶层元数据合并：time_range 并集, sub_arcs 合集
6. 写 output/characters/{id}.json
```

**不做字段级合并**——每个 period 已经是完整快照。

## 操作工具
```bash
# 拼接 periods（左右各一次）
node {TOOL_DIR}/json-tool.cjs copy {LEFT_PATH}/characters/kinji.json periods {OUTPUT_PATH}/characters/kinji.json periods append
node {TOOL_DIR}/json-tool.cjs copy {RIGHT_PATH}/characters/kinji.json periods {OUTPUT_PATH}/characters/kinji.json periods append

# time_range 并集
node {TOOL_DIR}/json-tool.cjs copy {LEFT_PATH}/characters/kinji.json time_range {OUTPUT_PATH}/characters/kinji.json time_range merge
node {TOOL_DIR}/json-tool.cjs copy {RIGHT_PATH}/characters/kinji.json time_range {OUTPUT_PATH}/characters/kinji.json time_range merge

# source_refs 合集
node {TOOL_DIR}/json-tool.cjs copy {LEFT_PATH}/characters/kinji.json source_refs {OUTPUT_PATH}/characters/kinji.json source_refs merge

# same_as 优化：读相邻 period 比较
node {TOOL_DIR}/json-tool.cjs read {OUTPUT_PATH}/characters/kinji.json 'periods[period_id=vol-06].status'
# 如果与 vol-05 相同 →
node {TOOL_DIR}/json-tool.cjs set {OUTPUT_PATH}/characters/kinji.json 'periods[period_id=vol-06].status' '"same_as_vol-05"'
```

## 合并报告
输出 merge-report.json：
```json
{ "node": "group-001", "characters": { "kinji": { "periods_in": 5, "periods_out": 5, "same_as_applied": 2 } } }
```

---

### 9.5 Merge Audit Agent（合并审核）

#### 运行参数

| 参数 | 值 |
|:-----|:---|
| 推荐模型 | `lt-yuyu/gpt-5.4-mini` |
| 超时 | 900s |
| 可用工具 | `read`, `bash`（**没有 write**） |
| context 上限 | 258000 tokens |
| 重试策略 | 最多 2 次 |
| 并发上限 | `ceil(WAVE_COUNT/2)` |
| needs | `merge-{NODE_ID}` |
| mutationScope | 无（仅审核，不写文件） |
| authority.allowFilesystemRead | true |

#### agent_team step 定义

```json
{
  "id": "audit-merge-{WORLD}-{NODE_ID}",
  "needs": ["merge-{WORLD}-{NODE_ID}"],
  "authority": { "allowFilesystemRead": true },
  "agent": {
    "system": "【将下方提示词填入】",
    "tools": ["read", "bash"]
  },
  "task": "Start with ACK.\n\n审核合并结果：{OUTPUT_DIR}/intermediate/{NODE_ID}/"
}
```

#### 提示词

```markdown
# Merge Audit Prompt

## ACK-first
首行只输出 `ACK`，立即调用工具。

## 工具限制
- ✅ 只能用 `read` 和 `bash`，**没有 write**
- ⛔ **禁止自己编写代码、创建工具或脚本**

## 审核范围
{OUTPUT_PATH}/

## 审核检查项

### 1. periods 排序
```bash
node {TOOL_DIR}/json-tool.cjs read {OUTPUT_PATH}/characters/kinji.json periods
# 检查 vol 顺序：vol-01 < vol-02 < ...
# 如果乱序 → issue: error
```

### 2. 重复 period_id
```bash
node -e "
const d=require('{OUTPUT_PATH}/characters/kinji.json');
const ids=d.periods.map(p=>p.period_id);
const dup=ids.filter((id,i)=>ids.indexOf(id)!==i);
if(dup.length)console.log('DUPLICATE:',dup.join(','));
"
```

### 3. same_as 引用有效性
```bash
node -e "
const d=require('{OUTPUT_PATH}/characters/kinji.json');
const ids=new Set(d.periods.map(p=>p.period_id));
const refs=d.periods.flatMap(p=>Object.values(p).filter(v=>typeof v==='string'&&v.startsWith('same_as_')));
refs.forEach(ref=>{
  const target=ref.replace('same_as_','');
  if(!ids.has(target))console.log('BROKEN_REF:',ref);
});
"
```

### 4. 角色完整性
```bash
for f in {LEFT_PATH}/characters/*.json; do
  id=$(basename $f .json)
  if [ ! -f "{OUTPUT_PATH}/characters/$id.json" ]; then
    echo "MISSING: $id"
  fi
done
```

### 5. same_as 循环检测
```bash
# 检查 same_as 链是否形成环
# A→B→C→A 为非法
```

## 输出格式
```json
{ "severity": "error", "file": "characters/kinji.json", "period": "vol-06", "field": "status", "description": "same_as_vol-05 但 vol-05 不在合并结果中" }
```
```

---

### 9.6 Merge Fix Agent（合并修复）

#### 运行参数

| 参数 | 值 |
|:-----|:---|
| 推荐模型 | `lt-yuyu/gpt-5.4-mini` |
| 超时 | 900s |
| 可用工具 | `read`, `write`, `bash` |
| context 上限 | 258000 tokens |
| 重试策略 | 最多 2 次 |
| 并发上限 | `ceil(WAVE_COUNT/2)` |
| needs | `audit-merge-{NODE_ID}` |
| mutationScope | `{OUTPUT_DIR}/intermediate/{NODE_ID}/` |
| authority.allowFilesystemRead | true |
| authority.allowMutationTools | true |

#### agent_team step 定义

```json
{
  "id": "fix-merge-{WORLD}-{NODE_ID}",
  "needs": ["audit-merge-{WORLD}-{NODE_ID}"],
  "mutationScope": "{OUTPUT_DIR}/intermediate/{NODE_ID}/",
  "agent": {
    "system": "【将下方提示词填入】",
    "tools": ["read", "write", "bash"]
  },
  "task": "Start with ACK.\n\n修复合并节点 {NODE_ID} 的 issues"
}
```

#### 提示词

```markdown
# Merge Fix Prompt

## ACK-first
首行只输出 `ACK`，立即调用工具。

## 工具限制
- ⛔ **禁止自己编写代码、创建工具或脚本**
- ✅ 只能用 `json-tool.cjs set/remove/append` 修复

## 修复规则
1. 只修 issues 中指出的问题
2. 每个修复后 append _revisions 记录
3. 修完后运行 validate

## 常见操作

### 修复 broken same_as 引用
```bash
node {TOOL_DIR}/json-tool.cjs set {OUTPUT_PATH}/characters/kinji.json \
  'periods[period_id=vol-06].status' '"same_as_vol-04"'
```

### 修复重复 period_id
```bash
node {TOOL_DIR}/json-tool.cjs remove {OUTPUT_PATH}/characters/kinji.json \
  'periods[period_id=vol-05]'
```

### 修复 missing character
```bash
node {TOOL_DIR}/json-tool.cjs copy {LEFT_PATH}/characters/aria.json '' \
  {OUTPUT_PATH}/characters/aria.json '' replace
```
```

---

## 附录：快速启动清单
