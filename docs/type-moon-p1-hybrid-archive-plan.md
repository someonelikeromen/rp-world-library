# Type-Moon P1-Hybrid Archive Plan

## 目标

以 FSN/FZ 为 pilot，验证能否用 p1-plan / p1-scan 风格的闭环方式重整型月世界书归档。

本方案不覆盖现有 `campaigns/world-library/worlds/type-moon-nasuverse/curated/`。所有试点输出先落在独立工作目录，验证通过后再决定是否扩展或迁移。

## 核心判断

型月当前来源主要是 SillyTavern worldbook JSON 与已整理 `curated/stories/`，不是官方小说正文或游戏脚本文本。因此本方案不能把产物称作 canon source-backed p1-scan，而应标记为 p1-hybrid。

目标是建立清晰分层：

```text
source text 层
→ wave 提取层
→ merged 正式实体/事件/关系层
→ graph/timeline 派生层
→ audit/comparison 报告层
```

## 当前问题定义

本方案要解决当前型月归档中的结构性问题，而不是简单追加条目。

### P0: 原文概念不清

当前 `original-full-*` 层来自 existing curated stories 派生，不是官方正文或游戏脚本。后续 agent 容易误把派生摘要当最高可信来源。

解决方向：建立 `source text` 层，明确 `sourceType`、`credibility`、`canonStatus`，所有正式事实都能回到具体 source text 行号。

### P1: 渐进式加载层级重叠

现有结构同时存在 `stories/`、`chapter-archives-curated/`、`curated-unit-archives/`、`curated-unit-refined/`、`original-full-*`。职责边界不清时，查询会读到候选层或摘要层。

解决方向：pilot 中只承认 `source/`、`waves/`、`merged/`、`graph/`、`timeline/`、`candidates/`、`audit/`、`comparison/` 七层。

### P2: 图谱污染

旧 plot/relationship 派生层可能把“从者”“特异点”“圣杯战争”等概念误当角色，或把低置信共现信号当关系边。

解决方向：强制节点类型枚举，正式 graph 只接收 audited edge，co-occurrence 只能进入 candidates。

### P3: 时间结构缺失

旧结构多为静态角色与章节级摘要，无法回答“某路线某阶段某角色知道什么、关系如何变化”。

解决方向：所有事件必须带起止时间和中间节点，核心人物必须按 timeline/route/status 拆为 `periods[]`。

### P4: 审核修复不是硬门禁

旧流程有事后脚本补救和 partial 成果沉积。新流程必须把 Generator → Auditor → Fixer → Auditor rerun 作为每个 wave、merge、graph、timeline 节点的硬门禁。

## 完整执行总览

端到端流程如下：

```text
Step 0 只读准备
  ↓
Step 1 Source entry 筛选与 wave manifest 草案
  ↓ 用户确认
Step 2 Source text 构建
  ↓ Source-Audit/Fix 闭环
Step 3 wave-001..wave-018 并行/分批提取
  ↓ 每个 wave 无限迭代到 passed
Step 4 wave merge / group merge / final merge
  ↓ Merge-Audit/Fix 闭环
Step 5 graph + timeline 派生构建
  ↓ Graph/Timeline Audit/Fix 闭环
Step 6 与旧 curated 对比
  ↓
Step 7 输出 migration recommendation
  ↓ 用户确认后才考虑 curated-v2 预览或正式迁移
```

每一步都必须满足：

```text
不覆盖旧 curated
candidate 与 formal 分离
sourceRef 非空
审核未 passed 不前进
```

## 执行边界

### 纳入来源

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/Fate stay night.worldbook.json
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/FateStayNight - 沙盒's Lorebook.worldbook.json
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/fatezero.worldbook.json
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/*.md
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json 中 FSN/FZ/冬木/圣杯战争/御三家相关条目
```

### 暂不纳入

```text
FGO 主线大规模条目
妖精国历
Prisma Illya
月姬、空境、魔法使之夜扩展
original-full-* 派生候选层，除非作为对比材料
```

## 输出位置

试点工作目录：

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/
```

推荐最终试点产物：

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/merged/
```

可选发布前预览目录：

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated-v2-pilot/fsn-fz/
```

禁止直接覆盖：

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/
```

## 完整目录规划

试点目录应最终形成以下结构：

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/
├── README.md
├── PLAN.locked.md
├── source-entry-selection.md
├── wave-manifest.json
├── execution-log.md
├── sources/
│   ├── worldbook-text/
│   └── story-text/
├── waves/
│   ├── wave-001/
│   ├── wave-002/
│   └── wave-018/
├── intermediate/
│   └── wave-merged/
├── group-merged/
├── merged/
│   ├── characters/
│   ├── abilities/
│   ├── items/
│   ├── factions/
│   ├── locations/
│   ├── systems/
│   ├── events/
│   ├── relationships/
│   ├── knowledge/
│   ├── world-rules/
│   ├── timeline/
│   ├── graph/
│   └── index.json
├── candidates/
│   ├── graph-candidates.json
│   ├── merge-candidates.json
│   └── timeline-candidates.json
├── audit/
│   ├── final-audit-summary.md
│   ├── final-known-issues.json
│   └── final-pass-report.json
└── comparison/
    ├── character-diff.md
    ├── relationship-diff.md
    ├── plot-graph-noise-report.md
    ├── world-rule-diff.md
    └── migration-recommendation.md
```

每个 `waves/wave-XXX/` 内部必须包含：

```text
waves/wave-XXX/
├── README.md
├── wave-index.json
├── output/
├── reports/
├── issues/
└── scratch/
```

`scratch/` 仅用于临时片段，不作为正式产物引用。

## Phase -1: 只读准备

任何写入和 agent 启动前，必须先完成只读准备，并给用户确认。

只读准备输出草案内容：

```text
wave-manifest.draft.json
source-entry-selection.draft.md
execution-plan-for-current-run.md
```

准备阶段任务：

```text
1. 读取 type-moon source-registry。
2. 读取 raw worldbooks README。
3. 读取 FSN/FZ 相关 worldbook 的 entries 摘要。
4. 搜索 型月 (1).worldbook.json 中 FSN/FZ/冬木/圣杯战争相关条目。
5. 统计每个 wave 的候选 source 数量。
6. 列出纳入/排除边界。
7. 给出本轮是否只做 source text、单 wave、还是完整 pilot 的建议。
```

只有用户确认后，才能进入 Phase 0。

## Phase 0: Source Text 构建

将 worldbook entries 与 fate story md 拆成可行号引用的 source text。

目标结构：

```text
sources/
├── worldbook-text/
│   ├── src-fsn-core/
│   ├── src-fsn-sandbox/
│   ├── src-fz-overview/
│   ├── src-type-moon-filtered/
│   └── manifest.json
└── story-text/
    └── fate/
        ├── ch-001-main-tone.txt
        ├── ch-002-fate-route.txt
        ├── ch-003-ubw-route.txt
        └── ch-004-hf-route.txt
```

每个 source text 文件必须包含 metadata block 与原始 content。sourceRef 统一格式：

```text
type-moon-nasuverse/worldbook-text/src-fsn-core/entry-026-illya.txt:42
type-moon-nasuverse/story-text/fate/ch-003-ubw-route.txt:88
```

## Wave 划分

### wave-001: Source Inventory + 去重扫描

输出 `source-inventory.json`、`dedupe-report.md`。统计候选 source entries，识别重复、空条目、引擎边界条目。

### wave-002: Canonical ID Manifest 初版

输出 `canonical-id-manifest.json`、`alias-review.md`。明确同名异体、异名同体、平行世界差异。

重点规则：

```text
illyasviel-fsn != prisma-illya-01
emiya-shirou 与 archer-emiya 关联但不直接合并
saber-artoria 与其他 Artoria 形态用 relatedForms
```

### wave-003: FSN 世界线与圣杯战争基础规则

提取冬木市、第四/第五次圣杯战争、御主、从者、令咒、圣杯污染、三路线基础差异。

### wave-004: 御主与人类角色

提取卫宫士郎、远坂凛、间桐樱、伊莉雅、葛木宗一郎、言峰绮礼、卫宫切嗣、爱丽丝菲尔、远坂时臣、间桐雁夜、肯尼斯、韦伯等。

### wave-005: 从者与英灵

提取 Saber、Archer、Lancer、Rider、Caster、Assassin、True Assassin、Berserker、Gilgamesh、Fate/Zero 主要从者。

### wave-006: 组织、家族、势力

提取御三家、远坂家、间桐家、爱因兹贝伦、圣堂教会、魔术协会、冬木本地关系网。

### wave-007: 地点

提取冬木市、柳洞寺、圆藏山、远坂宅、间桐宅、卫宫宅、穗群原学园、教会、爱因兹贝伦城。

### wave-008: 能力、魔术、宝具

提取投影魔术、无限剑制、固有结界、魔术回路、魔术刻印、令咒、圣杯召唤、Excalibur、Avalon、Gae Bolg、Rule Breaker、Gate of Babylon、Ea。

### wave-009: Fate 线事件拆解

将 `fate-fate线.md` 拆成事件级节点。

### wave-010: UBW 线事件拆解

将 `fate-unlimited_blade_works线.md` 拆成事件级节点。

### wave-011: HF 线事件拆解

将 `fate-heaven-s_feel线.md` 拆成事件级节点。

### wave-012: Fate/Zero 与第四次圣杯战争

提取第四次圣杯战争概览、切嗣、爱丽丝菲尔、言峰、时臣、雁夜、肯尼斯、韦伯、圣杯污染前史、FZ 与 FSN 因果连接。

### wave-013: 沙盒规则与引擎规则分层

将 ST 规则拆成：

```text
canon-like-world-rule
sandbox-rule
rp-engine-rule
discarded-engine-mechanic
style-constraint
```

### wave-014: 关系候选与正式关系审核

汇总主从、亲属、师徒、敌对、盟友、契约、恋爱、理念冲突、因果、同一实体变体、alternate-form 等关系候选。

### wave-015: FSN/FZ 时间轴骨架

建立 FZ 第四次圣杯战争、FSN 共通线、Fate 线、UBW 线、HF 线时间轴。

建议 `orderIndex` 区间：

```text
000-099  Fate/Zero 前史与第四次圣杯战争
100-199  FSN 共通线
200-299  Fate 线
300-399  UBW 线
400-499  HF 线
900-999  后日谈/结局状态
```

### wave-016: 事件时间标注复核

检查 wave-009/010/011/012 的所有事件，补齐 start/end/middle timelineNodes。不确定日期不得编造，只能标 `relative-only`。

### wave-017: 人物 periods 版本化

核心人物必须转为 `periods[]`。优先：卫宫士郎、远坂凛、间桐樱、伊莉雅、Saber、Archer、言峰、Gilgamesh、切嗣、爱丽丝菲尔、雁夜、时臣。

### wave-018: 时间化关系图谱

将静态关系边改造为带 `timelineId` 与 `timeRange` 的关系。不同路线关系拆成不同 edge。

## 风险解决方案

### R1: 来源不是官方正文

所有事实必须标注：

```json
{
  "sourceRefs": [],
  "sourceType": "user-file-worldbook",
  "credibility": "B",
  "evidenceLevel": "A|B|C|D|E",
  "canonStatus": "canon|canon-like|adapted|sandbox|inference|unknown"
}
```

禁止把 `agent-inference` 直接写入正式实体、事件、关系或图谱。推断只能进入 candidates。

### R2: 世界线/版本混淆

所有实体必须支持：

```json
{
  "continuity": "fsn|fz|fgo|prisma|tsukihime|kara-no-kyoukai|mahoyo|mixed|unknown",
  "timelineId": "fsn-main|fz-fourth-war|fgo-part1|fgo-lostbelt6",
  "variantId": "fsn-base|fz-young|hf-corrupted|ubw-route|fate-route",
  "isSameEntityAs": [],
  "relatedForms": [],
  "doNotMergeWith": []
}
```

同名不自动合并。只有 `canonical-id-manifest.json` 明确允许时才能合并。

### R3: 图谱共现污染

节点类型强制枚举：

```text
character
faction
location
concept
system
ability
item
event
timeline-period
world-rule
```

自动共现只能生成 candidate。正式关系边必须 `sourceRefs` 非空、`confidence >= medium`、`reviewStatus = audited`。

### R4: 旧 curated 层级复杂

pilot 严格分层：

```text
source/
waves/
merged/
graph/
candidates/
audit/
comparison/
```

`original-full-*` 默认视为派生候选，不作为正式事实来源。

## Subagent 模型指定

本流程所有执行型 subagent 默认使用 yuyu provider 的 GPT-5.5 模型。

模型标识：

```text
lt-yuyu/gpt-5.5
```

默认分配：

| Agent | Model |
|---|---|
| Generator / Worker | `lt-yuyu/gpt-5.5` |
| Auditor | `lt-yuyu/gpt-5.5` |
| Fixer | `lt-yuyu/gpt-5.5` |
| Merger | `lt-yuyu/gpt-5.5` |
| Merge-Auditor | `lt-yuyu/gpt-5.5` |
| Merge-Fixer | `lt-yuyu/gpt-5.5` |
| Graph-Builder | `lt-yuyu/gpt-5.5` |
| Graph-Auditor | `lt-yuyu/gpt-5.5` |
| Graph-Fixer | `lt-yuyu/gpt-5.5` |
| Timeline-Builder | `lt-yuyu/gpt-5.5` |
| Timeline-Auditor | `lt-yuyu/gpt-5.5` |
| Timeline-Fixer | `lt-yuyu/gpt-5.5` |

规则：

```text
1. 不使用默认模型隐式分配。
2. 每个 agent_team step 必须显式写 agent.model。
3. 如果 lt-yuyu/gpt-5.5 不可用，该 step 不自动降级。
4. 模型不可用时必须返回 blocked，由 Parent 请求用户确认替代模型。
```

agent_team step 示例：

```json
{
  "id": "wave-004-generator",
  "agent": {
    "ref": "project:type-moon-p1-generator",
    "model": "lt-yuyu/gpt-5.5"
  },
  "task": "Generate wave-004 outputs from approved source text."
}
```

## Subagent 工具权限策略

### 总规则

所有 subagent 禁止使用 bash / shell / python / node / deno / powershell / cmd 等命令执行能力。

subagent 只能使用结构化读写与受控编辑工具。

### 禁止工具

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

### 允许工具

| Agent | 允许工具 |
|---|---|
| Generator / Worker | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `write`, `edit` |
| Auditor | `read`, `json_tool`, `json_struct_read` |
| Fixer | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `edit`, `write` |
| Merger | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `edit`, `write` |
| Merge-Auditor | `read`, `json_tool`, `json_struct_read` |
| Merge-Fixer | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `edit`, `write` |
| Graph-Builder | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `edit`, `write` |
| Graph-Auditor | `read`, `json_tool`, `json_struct_read` |
| Graph-Fixer | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `edit`, `write` |
| Timeline-Builder | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `edit`, `write` |
| Timeline-Auditor | `read`, `json_tool`, `json_struct_read` |
| Timeline-Fixer | `read`, `json_tool`, `json_struct_read`, `json_struct_edit`, `edit`, `write` |

### Auditor 只读规则

所有 Auditor 类 agent 必须只读：

```text
Auditor
Merge-Auditor
Graph-Auditor
Timeline-Auditor
Source-Auditor
```

Auditor 禁止写入：

```text
write
edit
json_struct_edit
json_tool set/append/remove/batch
```

Auditor 只能输出 audit report。

### 写入规则

所有写入型 agent 必须遵守：

```text
1. 写入前先读取目标文件。
2. JSON 必须通过结构化工具写入。
3. 禁止手写大段 JSON 字符串直接覆盖。
4. 写后必须 validate。
5. 不得修改 source text，除非当前任务是 Phase 0 source text 构建。
6. 不得修改旧 curated。
7. 不得修改本 wave 范围外文件。
```

### agent_team authority 建议

subagent 禁止 bash，因此 graph authority 不允许 shell：

```json
{
  "authority": {
    "allowFilesystemRead": true,
    "allowMutationTools": true,
    "allowShellTools": false,
    "allowProjectCode": true
  }
}
```

单个 step 不给 `bash`：

```json
{
  "agent": {
    "ref": "project:type-moon-p1-generator",
    "model": "lt-yuyu/gpt-5.5",
    "tools": ["read", "write", "edit"]
  },
  "mutationScope": "Only write files under campaigns/world-library/manual-curation/type-moon-p1-hybrid/fsn-fz-pilot/waves/wave-004/"
}
```

如果某个 subagent 认为必须用 bash 才能完成任务，必须返回 `blocked`，不得自行调用 bash。

## Agent 职责与权限

### Parent

职责：

```text
1. 给出本轮执行方案并等待用户确认。
2. 启动 agent_team 或 orch。
3. 检查每个 wave 的 final-status。
4. 决定 blocked issue 是否需要用户确认。
5. 不直接改实体、事件、关系、图谱数据。
```

Parent 禁止：

```text
绕过 audit 直接宣布 passed。
手动修 graph 派生文件来掩盖源层问题。
在未确认时覆盖旧 curated。
```

### Generator / Worker

输入：

```text
source text
wave-manifest.json 中对应 wave 的 sourceRefs
canonical-id-manifest.json
最小输出模板
```

输出：

```text
waves/wave-XXX/output/**
waves/wave-XXX/reports/generation-report.json
waves/wave-XXX/wave-index.json
```

职责：

```text
1. 从 source text 提取实体、事件、关系、时间信息。
2. 所有正式事实写 sourceRefs。
3. 不确定内容进入 candidates。
4. 按最小模板写 JSON。
5. 不跨 wave 扩大范围。
```

禁止：

```text
编造具体日期。
把 co-occurrence 写成正式关系。
把概念/组织/地点写成 character。
自动合并同名不同世界线角色。
修改 source text。
修改旧 curated。
```

### Auditor

输入：

```text
source text
wave output
reports/generation-report.json
canonical-id-manifest.json
最小模板定义
```

输出：

```text
reports/audit-round-NNN.json
issues/open-issues.json
issues/blocked-issues.json
issues/resolved-issues.json
```

职责：

```text
1. 对照 source text 检查虚构、遗漏、扭曲。
2. 检查 sourceRef 可定位。
3. 检查 schema、ID、引用目标、candidate/formal 分离。
4. 检查 timeline start/end/middle 与人物 periods。
5. 检查 graph 类型污染和关系边条件。
```

Auditor 必须只读，不写数据产物。

### Fixer

输入：

```text
wave output
audit-round-NNN.json
open-issues.json
blocked-issues.json
```

输出：

```text
修复后的 wave output
reports/fix-round-NNN.json
更新后的 issues/open-issues.json
更新后的 issues/resolved-issues.json
```

职责：

```text
1. 只修 audit 指出的 issue。
2. 若事实无 source 支持，删除正式事实或降级到 candidates。
3. 若时间不明，使用 relative-only + orderIndex，不能编造日期。
4. 若重复两轮未解决，说明失败原因并更换策略。
5. 若缺 source 或规则冲突，标记 blocked。
```

禁止：

```text
修改 source text。
修改旧 curated。
为通过审核删除重要候选，除非移入 candidates。
只修派生 graph 而不修源层。
扩大修复范围到未被 audit 标记的文件。
```

## Agent Team DAG 模式

单 wave 推荐 DAG：

```text
wave-XXX-generator
  → wave-XXX-auditor-r001
  → wave-XXX-fixer-r001
  → wave-XXX-auditor-r002
  → wave-XXX-fixer-r002
  → ...
  → wave-XXX-finalizer
```

由于迭代不限制轮数，实际执行可分批启动：

```text
1. 启动 generator + auditor-r001。
2. 若 passed，启动 finalizer。
3. 若 failed，启动 fixer-r001 + auditor-r002。
4. 重复直到 passed。
5. 若 blocked，Parent 处理阻塞后继续同一 wave。
```

Finalizer 只允许在 audit passed 且 openIssues 为 0 时写：

```text
reports/final-status.json
```

## 三 Agent 无限迭代闭环

### 核心规则

每个 wave、merge 节点、graph 节点、timeline 节点都必须持续执行：

```text
Generator → Auditor → Fixer → Auditor rerun
```

直到状态为 `passed`。不设置最大轮数。

### 禁止跳过

以下状态不得进入下一阶段：

```text
failed
partial
blocked
open-issues > 0
audit status != passed
```

`known-issues.json` 只用于记录当前阻塞项，不代表允许跳过。

### 状态定义

```text
passed     所有 blocking issues 已解决，可进入下一阶段
failed     审核发现错误，必须进入 Fixer
blocked    缺少 source、schema 冲突、用户边界不明或工具失败
iterating  当前 wave 正在第 N 轮修复/复审中
```

### Loop Guard

不设置最大轮数，但必须防止无意义重复。如果连续两轮出现同一 issue 未变化，Fixer 必须在下一轮说明前轮未修复原因并更换策略。若是 source 缺失或规则冲突，标记 `blocked`，由 Parent 解决后继续当前 wave。

## Merge / Graph / Timeline 闭环

### Merge 闭环

```text
Merger → Merge-Auditor → Merge-Fixer → Merge-Auditor rerun
```

Merge 输入：

```text
waves/wave-*/output/**
canonical-id-manifest.json
wave final-status.json
```

Merge 输出：

```text
intermediate/wave-merged/**
group-merged/**
merged/**
reports/merge-audit-round-NNN.json
reports/merge-fix-round-NNN.json
reports/merge-final-status.json
```

Merge-Auditor 检查：

```text
同实体 periods 是否按 timeline/orderIndex 排序。
同名实体是否错误合并。
variant / relatedForms / doNotMergeWith 是否保留。
sourceRefs 是否在合并中丢失。
跨路线关系是否被误合并。
events 是否按 timelineId 分组。
候选项是否误入 formal merged。
```

### Graph 闭环

```text
Graph-Builder → Graph-Auditor → Graph-Fixer → Graph-Auditor rerun
```

Graph 输入：

```text
merged/characters/**
merged/events/**
merged/relationships/**
merged/knowledge/**
merged/factions/**
merged/locations/**
merged/systems/**
merged/timeline/**
```

Graph 输出：

```text
merged/graph/relationship-graph.json
merged/graph/plot-graph.json
merged/graph/knowledge-graph.json
merged/graph/power-system-graph.json
merged/graph/faction-graph.json
merged/graph/timeline-graph.json
merged/graph/graph-candidates.json
merged/graph/graph-audit-report.md
reports/graph-final-status.json
```

Graph-Fixer 必须修源层：`characters/`、`events/`、`relationships/`、`knowledge/`、`timeline/`。禁止只修派生图谱。

Graph-Auditor 必查：

```text
edge 两端节点存在。
edge sourceRefs 非空。
edge confidence >= medium。
low confidence 只存在于 candidates。
relationship type 是字符串枚举。
concept/location/faction 不进入 character graph。
relationship edge 有 timelineId/timeRange。
plot graph 能从事件追溯到 sourceRef。
```

### Timeline 闭环

```text
Timeline-Builder → Timeline-Auditor → Timeline-Fixer → Timeline-Auditor rerun
```

Timeline 输入：

```text
merged/events/**
merged/characters/** periods
merged/relationships/** timeRange
source text
```

Timeline 输出：

```text
merged/timeline/timeline-index.json
merged/timeline/fz-fourth-war.json
merged/timeline/fsn-main.json
merged/timeline/fsn-fate-route.json
merged/timeline/fsn-ubw-route.json
merged/timeline/fsn-hf-route.json
merged/timeline/cross-route-alignment.json
reports/timeline-final-status.json
```

Timeline-Auditor 检查：

```text
事件顺序是否与 source 支持一致。
route-derived 时间是否被误写成 exact-day。
每个长事件是否有 start/end/middle。
人物 periods 是否覆盖关键状态变化。
关系边 timeRange 是否与事件顺序冲突。
跨路线 timeline 是否错误串接。
orderIndex 是否单调、可排序、无重复冲突。
```

## 时间轴系统

时间粒度允许：

```text
YYYY
YYYY-MM
YYYY-MM-DD
YYYY-MM-DDTHH:mm
relative-time
route-stage
war-day
unknown-but-ordered
```

禁止编造具体日期。无法确定时必须使用：

```json
{
  "value": null,
  "precision": "relative-only",
  "relative": "Fate route early phase",
  "orderIndex": 120
}
```

时间轴目录：

```text
merged/timeline/
├── timeline-index.json
├── fsn-main.json
├── fz-fourth-war.json
├── fsn-fate-route.json
├── fsn-ubw-route.json
├── fsn-hf-route.json
└── cross-route-alignment.json
```

每个正式 event 必须有 `time.start`、`time.end`，长事件必须有 `timelineNodes` 的 start / middle / end。

## 人物 periods 版本系统

人物不再只有静态条目，而是按时间段、路线、状态分版本。

示例：

```text
卫宫士郎：共通线、Fate 线、UBW 线、HF 线
间桐樱：日常状态、HF 线黑圣杯污染状态
Archer：身份揭露前、身份揭露后
言峰绮礼：FZ 时期、FSN 时期
Saber：FZ 召唤、FSN 召唤、Fate 线结局状态
```

每个 `periods[]` 至少包含：

```text
period_id
timelineId
route
timeRange
status
abilities
relationships
knowledgeState
sourceRefs
```

关系边也必须支持 `timelineId` 与 `timeRange`。

## 最小输出结构模板

所有 JSON 可以扩展，但不得缺少对应最小字段。

### source-manifest.json

```json
{
  "schema": "tm-p1-source-manifest-v1",
  "worldId": "type-moon-nasuverse",
  "scope": "fsn-fz-pilot",
  "generatedAt": "",
  "sources": [
    {
      "sourceId": "src-fsn-core",
      "sourceType": "user-file-worldbook",
      "credibility": "B",
      "sourceFile": "Fate stay night.worldbook.json",
      "entryCount": 0,
      "outputDir": "sources/worldbook-text/src-fsn-core",
      "notes": ""
    }
  ]
}
```

### source text metadata block

```text
---
worldId: type-moon-nasuverse
scope: fsn-fz-pilot
sourceId: src-fsn-core
sourceType: user-file-worldbook
credibility: B
sourceFile: Fate stay night.worldbook.json
entryIndex: 26
comment: 伊莉雅
keys:
  - 伊莉雅
  - Illyasviel
canonStatus: canon-like
---

原始 content...
```

### wave index

```json
{
  "schema": "tm-p1-wave-index-v1",
  "waveId": "wave-004",
  "name": "御主与人类角色",
  "status": "iterating",
  "sourceRefs": [],
  "outputs": {
    "characters": [],
    "events": [],
    "relationships": [],
    "knowledge": []
  },
  "reports": {
    "latestAudit": "",
    "latestFix": "",
    "finalStatus": ""
  }
}
```

### generation-report.json

```json
{
  "schema": "tm-p1-generation-report-v1",
  "waveId": "wave-004",
  "status": "generated",
  "generatedAt": "",
  "sourceRefsRead": [],
  "filesCreated": [],
  "filesUpdated": [],
  "counts": {
    "characters": 0,
    "events": 0,
    "relationships": 0,
    "abilities": 0,
    "locations": 0,
    "factions": 0,
    "knowledge": 0
  },
  "candidateOnlyItems": [],
  "uncertainties": []
}
```

### audit-round-NNN.json

```json
{
  "schema": "tm-p1-audit-report-v1",
  "waveId": "wave-004",
  "round": 1,
  "status": "passed",
  "auditedAt": "",
  "filesChecked": [],
  "sourceRefsVerified": 0,
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
  "issueId": "A-001",
  "severity": "error",
  "category": "fabrication",
  "file": "characters/emiya-shirou.json",
  "path": "periods[0].abilities",
  "detail": "",
  "expected": "",
  "sourceRefs": [],
  "status": "open"
}
```

### fix-round-NNN.json

```json
{
  "schema": "tm-p1-fix-report-v1",
  "waveId": "wave-004",
  "round": 1,
  "status": "fixed",
  "fixedAt": "",
  "issuesHandled": [],
  "filesChanged": [],
  "unresolvedIssues": []
}
```

### final-status.json

```json
{
  "schema": "tm-p1-final-status-v1",
  "waveId": "wave-004",
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

`canAdvance` 只有在 `status == passed`、`openIssues == 0`、`blockedIssues == 0`、`latestAuditReport.status == passed` 时才允许为 true。

## 实体最小模板

### character

```json
{
  "schema": "tm-p1-character-v1",
  "worldId": "type-moon-nasuverse",
  "character_id": "",
  "name": { "zh": "", "ja": "", "en": "" },
  "continuity": "fsn",
  "timelineIds": [],
  "canonStatus": "canon-like",
  "sourceType": "user-file-worldbook",
  "credibility": "B",
  "aliases": [],
  "doNotMergeWith": [],
  "relatedForms": [],
  "periods": [
    {
      "period_id": "",
      "timelineId": "",
      "route": "",
      "timeRange": {
        "start": { "value": null, "precision": "relative-only", "relative": "", "orderIndex": 0 },
        "end": { "value": null, "precision": "relative-only", "relative": "", "orderIndex": 0 }
      },
      "status": {},
      "abilities": [],
      "relationships": [],
      "knowledgeState": [],
      "sourceRefs": []
    }
  ],
  "sourceRefs": []
}
```

### event

```json
{
  "schema": "tm-p1-event-v1",
  "worldId": "type-moon-nasuverse",
  "event_id": "",
  "continuity": "fsn",
  "timelineId": "",
  "route": "",
  "time": {
    "start": { "value": null, "precision": "relative-only", "relative": "", "orderIndex": 0 },
    "end": { "value": null, "precision": "relative-only", "relative": "", "orderIndex": 0 },
    "duration": "unknown",
    "confidence": "medium"
  },
  "timelineNodes": [
    { "nodeId": "start", "label": "", "time": { "relative": "", "orderIndex": 0 }, "summary": "" },
    { "nodeId": "middle-001", "label": "", "time": { "relative": "", "orderIndex": 0 }, "summary": "" },
    { "nodeId": "end", "label": "", "time": { "relative": "", "orderIndex": 0 }, "summary": "" }
  ],
  "participants": [],
  "locationRefs": [],
  "cause": "",
  "process": "",
  "outcome": "",
  "stateChanges": [],
  "relationshipChanges": [],
  "sourceType": "curated-story-derived",
  "credibility": "B",
  "sourceRefs": []
}
```

### relationship edge

```json
{
  "schema": "tm-p1-relationship-v1",
  "edge_id": "",
  "from": "",
  "to": "",
  "type": "",
  "continuity": "fsn",
  "timelineId": "",
  "route": "",
  "timeRange": {
    "start": { "value": null, "precision": "relative-only", "relative": "", "orderIndex": 0 },
    "end": { "value": null, "precision": "relative-only", "relative": "", "orderIndex": 0 }
  },
  "summary": "",
  "confidence": "medium",
  "reviewStatus": "audited",
  "sourceType": "user-file-worldbook",
  "credibility": "B",
  "sourceRefs": []
}
```

### timeline file

```json
{
  "schema": "tm-p1-timeline-v1",
  "worldId": "type-moon-nasuverse",
  "timelineId": "",
  "name": "",
  "continuity": "fsn",
  "timeRange": {
    "start": { "value": null, "precision": "relative-only", "relative": "" },
    "end": { "value": null, "precision": "relative-only", "relative": "" }
  },
  "orderRange": { "start": 0, "end": 0 },
  "events": [],
  "sourceRefs": []
}
```

### graph candidates

```json
{
  "schema": "tm-p1-graph-candidates-v1",
  "worldId": "type-moon-nasuverse",
  "generatedAt": "",
  "candidates": [
    {
      "candidateId": "",
      "kind": "relationship|entity|timeline|merge",
      "from": "",
      "to": "",
      "label": "",
      "reason": "",
      "confidence": "low",
      "status": "candidate",
      "sourceRefs": []
    }
  ]
}
```

## 旧 curated 对比与迁移建议

pilot 完成后必须对比旧型月 `curated/`，但不得自动覆盖。

对比输入：

```text
campaigns/world-library/worlds/type-moon-nasuverse/curated/characters-index.json
campaigns/world-library/worlds/type-moon-nasuverse/curated/world.json
campaigns/world-library/worlds/type-moon-nasuverse/curated/relationship-graph.json
campaigns/world-library/worlds/type-moon-nasuverse/curated/plot-graph.json
campaigns/world-library/worlds/type-moon-nasuverse/curated/stories/fate/**
campaigns/world-library/worlds/type-moon-nasuverse/curated/world-rules/**
```

对比输出：

```text
comparison/character-diff.md
comparison/relationship-diff.md
comparison/plot-graph-noise-report.md
comparison/world-rule-diff.md
comparison/source-coverage-diff.md
comparison/timeline-improvement-report.md
comparison/migration-recommendation.md
```

`migration-recommendation.md` 必须给出以下结论之一：

```text
keep-old-curated
publish-curated-v2-pilot-side-by-side
replace-fate-slice-only
expand-before-migration
blocked-by-source-quality
```

迁移前必须由用户明确确认。没有确认时，pilot 只能停留在 manual-curation 工作目录。

## 完整交付物清单

FSN/FZ pilot 完成时，至少应交付：

```text
PLAN.locked.md
source-entry-selection.md
wave-manifest.json
sources/**
waves/wave-001..wave-018/**
intermediate/wave-merged/**
group-merged/**
merged/characters/**
merged/events/**
merged/relationships/**
merged/timeline/**
merged/graph/**
candidates/**
audit/final-audit-summary.md
audit/final-known-issues.json
audit/final-pass-report.json
comparison/**
execution-log.md
```

每个交付物都必须能回答：

```text
来自哪个 source？
经过哪个 wave？
是否审核通过？
是否候选还是正式？
是否可以进入下一阶段？
```

## 验收标准

FSN/FZ pilot 通过条件：

```text
所有 JSON 合法。
所有 source text 有 metadata block。
所有正式实体至少有 1 个 sourceRef。
所有正式 event 有 time.start、time.end、timelineNodes。
核心人物有 periods[]。
关系边有 timelineId/timeRange/sourceRefs。
relationship graph 无 dangling edge。
plot graph 不混入概念词作为角色。
world-rules 明确区分 canon-like、sandbox、engine。
candidate 与 formal graph 分离。
旧 curated 未被覆盖。
每个 wave final-status.status == passed。
merge-final-status.status == passed。
graph-final-status.status == passed。
timeline-final-status.status == passed。
comparison/migration-recommendation.md 已生成。
```

新增查询验收：

```text
能查询 UBW 线中期卫宫士郎知道什么。
能查询 HF 线后期间桐樱状态变化。
能查询 FZ → FSN 言峰绮礼立场变化。
能查询 Saber 在 FZ 与 FSN 的召唤状态区别。
能查询某事件发生前后角色关系边如何变化。
```

## 扩展路线

若 FSN/FZ pilot 通过，后续扩展顺序：

```text
1. FGO Part 1: 特异点F → 终局特异点
2. FGO Epic of Remnant
3. FGO Part 2: Lostbelt 1-7
4. 妖精国高精度事件拆解
5. Prisma Illya
6. 月姬 / 空境 / 魔法使之夜
7. 全型月 merged-v2
8. 替换或并行发布 curated-v2
```

## 下一步执行前置

实际执行前必须先只读生成：

```text
wave-manifest.draft.json
source-entry-selection.md
execution-plan-for-current-run.md
```

等待用户确认后，才能创建 source text、启动 agent 或写入试点产物。


## 2026-07 当前手工归档状态更新

本节记录 Type-Moon p1-hybrid manual-curation 的当前完成度与后续方向。它不替代上文 FSN/FZ 初始 pilot 设计；上文保留为最早验证方案与通用方法论，本节为后续实际执行后的状态索引。

### 已完成 / 已审计通过的 pilots

以下产物均保持在 side-by-side manual-curation 路径下，未覆盖旧 `curated/`：

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/
```

| Pilot | 当前状态 | 说明 |
|---|---|---|
| `fsn-fz-pilot` | completed / retrospective closed | FSN/FZ 试点完成；retrospective blockers 已通过后续 Fixer/Auditor rerun 关闭；残留 forbidden basename 问题已由只读 Auditor 复核关闭。 |
| `fgo-script-pilot` | accepted-with-nonblocking-risks | FGO Part 1 script pilot 完成；appearance / ability / combat-effect 强制层已补入并通过 audit。 |
| `fgo-eor-pilot` | accepted-with-nonblocking-risks | Epic of Remnant 完成；EoR retrospective blocker 已由 Fixer→Auditor rerun 关闭。 |
| `fgo-lb1-lb2-pilot` | accepted-with-nonblocking-risks | Lostbelt 1–2 完成；retrospective blockers 已关闭。 |
| `fgo-lb3-lb4-pilot` | accepted-with-nonblocking-risks | Lostbelt 3–4 完成；retrospective audit 通过并保留 nonblocking risks。 |
| `fgo-lb5-pilot` | accepted-with-nonblocking-risks | Atlantis / Olympus 完成；retrospective audit 通过。 |
| `fgo-lb6-pilot` | accepted-with-nonblocking-risks | Avalon le Fae 完成；retrospective audit 通过。 |
| `fgo-ordeal-call-pilot` | accepted-with-nonblocking-risks | Ordeal Call I–III 完成；retrospective audit 通过，保留 process nonblocking risks。 |
| `tsukihime-dead-apostle-profile-supplement-pilot` | completed / passed-with-nonblocking-risks | 月姬 / 死徒 profile supplement 已完成 controlled merge；final audit 通过；不发布到 Type-Moon core。 |

共同约束：

```text
- 不覆盖 campaigns/world-library/worlds/type-moon-nasuverse/curated/。
- 不修改 raw imports。
- graph / timeline 只允许 derived index，不作为 primary fact store。
- formal facts 必须保留 sourceRef(s)、sourceType、credibility、canonStatus。
- candidate-only / source-gap 不得提升为正式事实。
- 禁止 formal 聚合文件名：characters.json、events.json、relationships.json。
- profile supplement 阶段额外禁止：facts.json、graph.json、timeline.json。
```

### 当前计划中 / 下一候选 pilot

| Candidate | 当前状态 | 建议 |
|---|---|---|
| `mahoyo-profile-supplement-pilot` | planned / Stage 0 inventory completed | r58 已完成只读 source inventory；建议执行 p1-hybrid / user-file-worldbook-backed profile supplement，不作为 official canon p1-scan。 |
| Type-Moon core / general settings | deferred | 用户明确选择先做具体作品/人物线，型月总设定最后。 |

## 魔法使之夜 / Mahoyo 当前计划摘要

### 当前结论

r58 `mahoyo-source-inventory-audit` 已完成只读 source inventory。结论：可继续建立 Mahoyo profile supplement pilot，但必须降级标注为：

```text
p1-hybrid / user-file-worldbook-backed profile supplement
not official canon p1-scan
not published curated
```

推荐 pilot 路径：

```text
campaigns/world-library/manual-curation/type-moon-p1-hybrid/mahoyo-profile-supplement-pilot/
```

### 主要 source

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/奇妙的世界书DLC_型月篇2026_0126.worldbook.json
```

可支持：苍崎青子、久远寺有珠、静希草十郎、苍崎橙子、三咲町、第五魔法、魔弹、PLOY / 童话怪物、贝奥武夫、主要关系与相对剧情骨架。

辅助 / 候选 source：

```text
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/型月 (1).worldbook.json
campaigns/world-library/imports/worldviews/type-moon-nasuverse/worldbooks/[沙盒]FGO 0.8.worldbook.json
```

`型月 (1)` 仅用于五大魔法 / 第五魔法广义支持；`[沙盒]FGO 0.8` 仅作为橙子卢恩等 cross-source candidate，不直接并入 Mahoyo main。

### Mahoyo 后续完整阶段

```text
Stage 1 Prep / Source Layer
  Generator → read-only Auditor → Fixer if blocking → Auditor rerun

Stage 2 Packet Extraction / Normalization
  每个 packet 独立 Generator → Auditor → Fixer if blocking → Auditor rerun

Stage 3 Gate Evidence / Merge Readiness
  确保项目内 final-status.json 与 audit evidence 均可复核

Stage 4 Controlled Merge
  只从 passed packet 合并 side-by-side supplement 与 derived-only indexes

Stage 5 Final Audit
  独立只读 final Auditor 验证后，状态最多 accepted-with-nonblocking-risks

Stage 6 Future Enhancements
  官方脚本 / 设定集 / scene timeline / combat expansion 等未来增强，不属于当前 worldbook-backed pilot
```

### 推荐 packets

```text
packet-001-source-inventory-and-source-text
packet-002-canonical-id-and-continuity
packet-003-core-characters
packet-004-location-and-institutions
packet-005-mahoyo-plot-skeleton
packet-006-abilities-and-activation
packet-007-appearance-outfit-equipment
packet-008-relationships
packet-009-candidate-only-cross-work-continuity
```

### Mahoyo 专项风险

```text
- worldbook-backed only，不是官方脚本。
- 青子 / 橙子跨作品 continuity 必须分离。
- FGO collab 内容必须 candidate-only 或 cross-work continuity。
- 精确日期、完整对白、逐场景 CG/战斗顺序默认 source-gap。
- informal/slang/mock labels 只能作为 aliasCandidates 或 unsupported-by-current-source。
```

详见专项计划：

```text
docs/type-moon-mahoyo-profile-supplement-plan.md
```
