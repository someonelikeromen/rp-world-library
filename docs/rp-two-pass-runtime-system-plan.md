# pi-rp Two-Pass Runtime 系统方案

> 本文是对 `docs/2026-07-27-two-pass-prose-render.md` 的本项目适配方案。目标不是继续增加长规则，而是把“先检索原文、再结算、再渲染、再审稿、再发布”做成运行机制、结构化数据、生命周期编排和硬闸工具，减少主对话一次性承载的规则压力。
>
> 长期自动迭代、Taskplane/orchestrator 批次推进、验收与暂停机制见 `docs/rp-two-pass-runtime-iteration-plan.md`。

## 1. 核心问题

当前 `pi-rp` 已经有大量规则、技能、世界库、角色卡和长期记忆：

- `.pi/skills/`：RP 引擎、世界查询、战斗、骰子、成就、兑换、生命系统树、归档等能力。
- `rules/`：叙事质量、Actor/Director、限知、防 OOC、输出格式、多语言、事件概率等规则。
- `card/`：目录型统一角色卡与多世界战斗框架状态。
- `memory/`：长期经历、世界历史、角色关系、剧情进度。
- `campaigns/world-library/`：世界资料与图谱。

问题不在于规则不足，而在于规则过多时，LLM 容易出现：

1. 先写正文，再事后补结算。
2. 战斗、奖励、兑换、生命树、世界适配、记忆更新遗漏。
3. 角色内生推演、限知、防泄密、防 OOC 执行不稳定。
4. 文风渲染和事实结算混在一起，导致正文新增未结算事实。
5. 重写上一段文风时，误改既定事实。
6. 项目维护、规则迭代、RP 叙事混入同一上下文，污染当前剧情。
7. 资料读取阶段把原文过早摘要，导致后续推演基于二手概括而不是可审计来源。
8. 正文初稿缺少独立编辑/审稿角色，模型容易把“能写”误当成“合格”。

因此，本方案不把 Two-Pass 做成又一篇长规则，而是改造成运行层：

```text
输入分流
  -> Source Bundle：检索正确原文并原样传递
  -> Pass A：事实结算流水线
  -> A9 Settlement Final Gate：结算最终校验
  -> Direction Packet：结构化事实包
  -> 代码硬闸校验与净化
  -> Pass B：正文渲染流水线
  -> Editorial Review：编辑审稿
  -> Preview Widget：草稿/检查/确认层
  -> B8 Render Final Gate：渲染最终校验
  -> rp-prose：正式正文消息
  -> turn-ledger：事实、来源、正文关联记录
```

核心原则：**LLM 负责定位来源、语义判断、角色推演、文学表达和编辑评估；代码负责流程、隔离、校验、存储、消息投递和外键关系。**

## 2. 总体目标

### 2.1 必须实现

1. 把每个叙事回合拆成细分的 Source Retrieval、Pass A 结算流水线、Pass B 渲染流水线。
2. 资料读取阶段不做 LLM 摘要，必须找到正确原文并原样传递为 Source Bundle。
3. 用 `rp_submit_direction_packet` 硬闸工具强制 Pass A 提交结构化 Direction Packet。
4. 在 Pass A 结束前加入 A9 Settlement Final Gate，确认事实、来源、状态写入、packet 一致性。
5. 由代码从 Direction Packet 派生 Render Packet，确保 hidden 信息不进入渲染阶段。
6. 使用 pi 生命周期事件拆分阶段，避免 Pass A 直接投递玩家正文。
7. Pass B 增加 Editorial Review 编辑审稿角色，对正文结合上下文、文风、角色资料和来源原文进行评价，决定 approve、rewrite 或 return-to-pass-a。
8. 使用 preview widget 作为正式投递前的草稿、lint、编辑意见、重渲染候选和人工确认层。
9. 在正式发布前加入 B8 Render Final Gate，确认正文合格后才投递。
10. 使用 custom message，例如 `rp-prose`，把正式正文与结算过程分离。
11. 使用 `turn-ledger` 保存 source bundle、packet、render packet、正文消息之间的外键关系。
12. 支持 rerender：只重写正文，不重新结算、不改状态。
13. 支持系统维护、规则更新、工具迭代、迁移、debug 等非 RP 输入分流。
14. 逐步从自动 skill 全量暴露转向按阶段、按任务、按需加载。

### 2.2 不作为当前重点

1. 不做完整前端面板。
2. 不做 choice widget / 选项按钮。
3. 不把原外来项目的命名如 `fsn-prose` 原样照搬。
4. 不在 runtime 接管前直接启用 `--no-skills`。

### 2.3 需要实现但不等同于前端

**preview widget 是必须项。**

它不是玩家用的前端面板，也不是剧情选项按钮，而是 runtime 安全预览层：

1. 暂存 Pass B 初稿，防止草稿直接污染正式会话。
2. 展示 lint 错误、泄密风险、packet 外事实风险。
3. 展示 Editorial Review 的审稿 verdict 和 rewriteDirectives。
4. 保存自动重渲染候选。
5. 在需要时允许人工确认、退回 Pass A 或重跑 Pass B。
6. 正式通过 B8 后再投递为 `rp-prose`。

## 3. 术语中文解释

| 名词 | 中文说明 | 在本项目中的意义 |
|---|---|---|
| Source Bundle | 原文资料包 | 查询阶段找到的世界、角色卡、记忆、规则、文风原文片段，原样传递，不由 LLM 摘要替代。 |
| Pass A / Settlement | 结算阶段 | 细分为输入分类、上下文装配、原文检索、角色推演、系统结算、状态落盘、packet 生成、最终校验。 |
| A9 Settlement Final Gate | 结算最终门 | 进入 Pass B 前的最后校验，确认来源、事实、状态写入和 Direction Packet 一致。 |
| Pass B / Render | 渲染阶段 | 细分为 render packet 接收、文风装配、初稿、编辑审稿、preview、lint、重渲染、最终校验、正式投递。 |
| Editorial Review | 编辑审稿 | 独立评价正文是否符合上下文、文风、角色资料、来源原文和 Render Packet。 |
| B8 Render Final Gate | 渲染最终门 | 正文发布前的最后校验，不通过不能投递 `rp-prose`。 |
| Direction Packet | 方向包 / 结算包 | Pass A 提交的结构化事实包，是本轮事实源。 |
| Render Packet | 渲染包 | 由代码净化 Direction Packet 后生成，只包含玩家可见事实。 |
| Packet Firewall | 包防火墙 | 代码层，负责 schema 校验、hidden 隔离、状态同步检查。 |
| Preview Widget | 预览组件 | runtime 中的草稿检查层，不是前端剧情面板。 |
| agent_end | 主 agent 结束事件 | 捕获 Pass A 完成，阻止未净化正文直接投递。 |
| agent_settled | agent 稳定事件 | 确认工具调用和重试结束后，启动或投递 Pass B。 |
| custom message | 自定义消息 | 用 `rp-prose` 保存正式玩家正文，与普通 assistant 结算消息分离。 |
| --no-skills | 禁用自动 skill 发现 | 成熟阶段用于防止技能全量注入，由 runtime 按需加载模块。 |

## 4. 总体架构

推荐目标名：**RP Runtime Orchestrator**。

```text
用户输入
  |
  v
Input Router
  |
  +-- narrative：RP 叙事回合
  +-- panel：状态/成就/兑换/生命树面板
  +-- rerender：重渲染上一轮正文
  +-- direct：规则问答/解释/普通对话
  +-- maintenance：项目维护/文档修改/规则更新/工具实现
  +-- migration：架构迁移/数据升级/release 同步
  +-- debug：运行时错误/状态不一致/工具失败修复
  +-- iteration：runtime、skill、世界库、文风、规则的迭代
  |
  v
Source Retrieval -> Source Bundle
  |
  v
Pass A Settlement Pipeline
  |
  v
A9 Settlement Final Gate
  |
  v
rp_submit_direction_packet
  |
  v
Packet Firewall -> Render Packet
  |
  v
Pass B Render Pipeline
  |
  v
Editorial Review
  |
  v
Preview Widget -> Lint / Rerender / Confirm
  |
  v
B8 Render Final Gate
  |
  v
rp-prose custom message
  |
  v
turn-ledger / chronology
```

核心不变量：

```text
资料检索阶段只找原文并原样传递，不做 LLM 摘要替代。
事实只在 Pass A 产生。
状态只在 Pass A 落盘。
A9 通过前不能进入 Pass B。
Render Packet 由代码派生，不由 LLM 手工复制。
Pass B 不能调用状态写入工具。
Pass B 不能新增 packet 外事实。
Pass B 不能看到 hidden 字段。
正文必须经过 Editorial Review。
Preview 通过前不投递正式正文。
B8 通过前不投递 rp-prose。
重渲染只能改正文表面，不能改事实和状态。
```

## 5. 输入分流

输入分流由代码优先判断，LLM 可辅助分类但不能最终绕过 router。

| 类型 | 说明 | 是否进入 RP Two-Pass | 输出方式 |
|---|---|---|---|
| `narrative` | 用户进行剧情行动、继续 RP、时间跳跃 | 是 | Source Bundle -> Pass A -> Pass B -> `rp-prose` |
| `panel` | 查看角色卡、状态、成就、兑换、生命树、地图 | 否 | 工具面板 / 普通 assistant 回复 |
| `rerender` | 保留事实重写上一轮正文 | 只跑 Pass B | preview -> B8 -> `rp-prose` 或替换候选 |
| `direct` | 规则解释、项目说明、普通问答 | 否 | 普通 assistant 回复 |
| `maintenance` | 修改文档、规则、工具、prompt、方案 | 否 | 编码/文档工作流 |
| `migration` | 数据结构迁移、release 同步、路径调整 | 否 | 维护工作流 + 审计 |
| `debug` | 工具失败、状态不一致、ledger 损坏 | 否 | debug 工作流 |
| `iteration` | runtime、skill、世界库、文风、规则迭代 | 否 | 方案确认 -> 修改 -> 验证 |

维护类输入必须与 RP 剧情上下文隔离：

1. 不触发正文渲染。
2. 不更新剧情 memory，除非用户明确要求记录项目决策。
3. 不写角色卡。
4. 遵守方案确认前置规则。
5. 在 Windows 环境下优先使用 `read`、`edit`、`write`。

## 6. Source Bundle：原文检索与传递

资料读取和查询阶段不能让 LLM 把内容直接摘要成事实源。

正确流程：

```text
提出查询需求
  -> 使用 world_query / card_edit / memory / read 等工具
  -> 找到正确原文或结构化条目
  -> 原样摘取必要片段
  -> 写入 Source Bundle
  -> 后续推演引用 Source Bundle
```

错误流程：

```text
查询资料
  -> LLM 自己总结一段
  -> 后续把总结当事实源
```

Source Bundle schema：

```json
{
  "schema": "rp-source-bundle-v1",
  "turnId": "",
  "sources": [
    {
      "sourceId": "src-001",
      "kind": "world | card | memory | rule | style | tool-result",
      "ref": "",
      "path": "",
      "quote": "",
      "usedFor": "",
      "visibility": "player-visible | gm-only | mixed"
    }
  ]
}
```

代码负责：

1. 保存 sourceId。
2. 记录 ref、path、工具结果 ID。
3. 校验 quote 非空。
4. 将 Source Bundle 传给 Pass A 或 Pass B。
5. 在 ledger 中记录 sourceBundleHash。

LLM 负责：

1. 判断需要查什么。
2. 找到正确来源。
3. 选择必要原文片段。
4. 标注 usedFor。
5. 基于原文解释和推演，但不能把未引用的记忆当来源。

Source Bundle 的 quote 应尽量短而精确，但必须是原文，不是改写。

## 7. Pass A 细分：结算流水线

Pass A 由 A0-A9 组成。

### A0 输入分类与权限检查

代码负责：

1. 判断输入类型。
2. 判断是否需要 RP Two-Pass。
3. 判断是否是维护任务，是否需要方案确认。
4. 阻止 narrative 和 maintenance 混流。

LLM 负责：

1. 在模糊输入时辅助解释用户意图。
2. 给出分类理由。

### A1 上下文预算与模块选择

代码负责：

1. 根据输入类型选择候选模块。
2. 控制最多加载哪些 skill/rule/style 摘要。
3. 记录本轮加载了什么。

LLM 负责：

1. 判断需要哪些具体资料。
2. 在缺上下文时提出最小读取请求。

### A2 Source Retrieval / 原文检索

代码负责：

1. 提供 `world_query`、`card_edit get/status`、memory 读取等工具。
2. 记录 refs 和工具结果。
3. 建立 Source Bundle。

LLM 负责：

1. 从工具结果中定位正确原文。
2. 原样摘取必要 quote。
3. 标注每条 quote 用于什么判断。
4. 不在 A2 对内容做自由摘要。

### A3 Source Binding / 来源绑定

代码负责：

1. 校验 Direction Packet 中的关键事实是否引用 sourceId。
2. 标记哪些来源是 player-visible，哪些是 gm-only。

LLM 负责：

1. 把即将推演的事实和 sourceId 绑定。
2. 说明哪些推论来自哪些原文。
3. 不使用没有来源的世界观事实。

### A4 角色内生推演

代码负责：

1. 提供当前角色状态、关系、世界约束和 Source Bundle。
2. 提供必要的历史摘要。

LLM 负责：

1. 基于 Source Bundle 和状态推演 NPC 的知识、动机、情绪、行动。
2. 推演沉默、犹豫、不行动的原因。
3. 区分玩家可见表现与 GM hidden。

### A5 系统结算

代码负责：

1. 开放对应工具：骰子、战斗、成就、兑换、生命树等。
2. 执行结构化校验和账本更新。

LLM 负责：

1. 判断是否需要掷骰或战斗结算。
2. 根据多世界战斗框架做能力评价说明。
3. 决定工具调用参数。
4. 解释工具结果如何影响本轮事实。

### A6 状态落盘计划

代码负责：

1. 要求所有 `stateChanges` 必须有对应写入计划。
2. 检查世界切换、能量体系、跨世界奖励是否需要双写。

LLM 负责：

1. 列出哪些状态必须写入 card。
2. 列出哪些事件必须写入 memory。
3. 区分立即落盘和延迟观察项。

### A7 状态写入与校验

代码负责：

1. 执行 `card_edit`、`achievement_edit`、`exchange_edit`、`life_tree_edit` 等工具。
2. 校验写入结果。
3. 记录写入摘要。

LLM 负责：

1. 提供精确写入内容。
2. 根据工具返回修正结算。
3. 不在写入失败时继续渲染。

### A8 Direction Packet 生成与硬闸

代码负责：

1. 提供 schema。
2. 接收 packet。
3. 校验 schema。
4. 检查 hidden 泄露。
5. 检查 stateChanges 是否有 writes。
6. 检查 endWindow 是否有效。
7. 派生 Render Packet。

LLM 负责：

1. 填写 Direction Packet。
2. 把 visible 和 hidden 分开。
3. 把正文可用素材压缩为结构化字段。
4. 引用 Source Bundle 的 sourceId。
5. 不在 packet 外另写正文。

### A9 Settlement Final Gate / 结算最终校验

A9 是进入 Pass B 前的最终门。

代码负责校验：

1. Direction Packet 已 accepted。
2. Source Bundle 存在且关键事实有 sourceId。
3. 工具结果与 packet 一致。
4. `stateChanges` 已完成写入或有明确阻断状态。
5. 世界切换、能量体系、跨世界奖励符合双写规则。
6. hidden 没有进入 Render Packet。
7. Render Packet 已生成并有 hash。
8. turn-ledger pending 记录已创建。

LLM 负责校验：

1. 事实链是否自洽。
2. 角色动机是否成立。
3. 结算结果是否与来源原文冲突。
4. 是否有必须退回 A2-A7 的缺口。

A9 输出：

```json
{
  "verdict": "pass | fix-required | blocked",
  "reasons": [],
  "returnTo": "A2 | A4 | A5 | A6 | A7 | A8 | none"
}
```

A9 不通过时，不能进入 Pass B。

## 8. Direction Packet

第一版 schema 保持小而硬。

```json
{
  "schema": "rp-direction-packet-v1",
  "turnType": "narrative",
  "needsRender": true,
  "sourceBundleId": "",
  "playerAction": "",
  "visibleChanges": [],
  "stateChanges": [],
  "npcMoves": [],
  "npcSilences": [],
  "sensoryAnchors": [],
  "hiddenFacts": [],
  "blockedRenderStrings": [],
  "endWindow": "",
  "memoryWrites": [],
  "cardWrites": [],
  "worldRefsUsed": [],
  "toolsUsed": [],
  "renderStyle": []
}
```

字段原则：

1. `visibleChanges` 是玩家正文必须体现的事实。
2. `stateChanges` 必须对应 `memoryWrites` 或 `cardWrites`。
3. `hiddenFacts` 只能留在 Pass A 和 ledger 的安全摘要中。
4. `blockedRenderStrings` 必须进入 Render Packet 的 forbidden list。
5. `endWindow` 必须是具体情境压力点，不是菜单。
6. 关键事实必须能追溯到 `sourceBundleId` 或工具结果。

## 9. Render Packet

Render Packet 由代码派生。

```json
{
  "schema": "rp-render-packet-v1",
  "turnId": "",
  "sourceBundleId": "",
  "playerAction": "",
  "visibleChanges": [],
  "npcMoves": [],
  "npcSilences": [],
  "sensoryAnchors": [],
  "endWindow": "",
  "renderStyle": [],
  "forbiddenStrings": []
}
```

派生规则：

1. 复制玩家可见字段。
2. 将 `blockedRenderStrings` 放入 `forbiddenStrings`。
3. 不复制 `hiddenFacts`。
4. 不复制工具结果原始文本，除非是玩家可见现象。
5. 保留 `sourceBundleId`，供编辑审稿与 final gate 查证。
6. 对字段做 hash，用于 ledger 和 rerender。

## 10. Pass B 细分：渲染流水线

Pass B 由 B0-B8 组成。

### B0 Render Packet 接收

代码负责：

1. 只向渲染器提供 Render Packet。
2. 提供必要的 player-visible Source Bundle quote。
3. 不提供 hiddenFacts。
4. 不提供 Pass A 草稿。

LLM 负责：

1. 确认自己只根据 Render Packet 和可见 Source Bundle 写正文。
2. 不主动索要 hidden 信息。

### B1 文风、视角与上下文装配

代码负责：

1. 根据 renderStyle 选择文风文件或摘要。
2. 提供最近 prose continuity。
3. 控制文风上下文长度。

LLM 负责：

1. 将文风落到具体句法、节奏、感官和对白。
2. 保持当前视角和限知。
3. 不把文风参考中的内容当作剧情事实。

### B2 正文初稿生成

代码负责：

1. 提供渲染 prompt。
2. 禁用状态写入工具。
3. 限制输入为 Render Packet、可见 Source Bundle、文风和必要连续性。

LLM 负责：

1. 写玩家可见正文。
2. 将 visibleChanges 自然化。
3. 将 npcMoves 写成动作、对白、停顿。
4. 使用 sensoryAnchors。
5. 以 endWindow 收束。

### B3 Draft Capture / 初稿捕获

代码负责：

1. 捕获正文初稿。
2. 生成 draftId。
3. 不直接发布。

LLM 负责：

1. 不把初稿当成事实源。
2. 等待审稿与 lint 结果。

### B4 Editorial Review / 编辑审稿

编辑审稿是独立角色，可以是同一 LLM 的独立阶段，也可以是单独 reviewer agent/model。

输入：

1. Render Packet。
2. 可见 Source Bundle quote。
3. 当前文风要求。
4. 最近 prose continuity。
5. 正文 draft。

审稿维度：

1. 是否覆盖所有 `visibleChanges`。
2. 是否新增 Render Packet 外事实。
3. 是否与 Source Bundle 原文冲突。
4. 是否符合角色资料、动机、知识边界。
5. 是否符合当前文风。
6. 是否存在泄密风险。
7. 是否有系统痕迹、标题、列表、菜单结尾。
8. 是否节奏失衡、描写空泛、情绪跳跃。
9. 是否需要退回 Pass A，而不是靠重写硬编。

输出：

```json
{
  "schema": "rp-editorial-review-v1",
  "verdict": "approve | rewrite | return-to-pass-a",
  "reasons": [],
  "rewriteDirectives": [],
  "returnTo": "A2 | A4 | A5 | A6 | A7 | A8 | none"
}
```

代码负责：

1. 调用或触发审稿阶段。
2. 解析 verdict。
3. `approve` 进入 preview/lint。
4. `rewrite` 回到 B2。
5. `return-to-pass-a` 阻断发布并返回指定 A 阶段。

LLM 负责：

1. 做语义和文学评估。
2. 给出具体 rewriteDirectives。
3. 不在审稿中新增剧情事实。

### B5 Preview Widget 暂存

代码负责：

1. 将通过或待修正 draft 放入 preview widget。
2. 标记 draft、candidate、lint-failed、editorial-rewrite、approved 等状态。
3. 不把 preview 直接写成正式正文。

LLM 负责：

1. 不把 preview 当成新事实源。
2. 根据 preview lint 和 editorial feedback 改写。

### B6 Lint / 安全检查

代码负责：

1. 检查 forbiddenStrings。
2. 检查标题、列表、菜单结尾。
3. 检查 packet 外事实。
4. 检查工具/系统痕迹。
5. 检查正文是否覆盖必要 visibleChanges。

LLM 负责：

1. 对失败项重写正文。
2. 不争辩 lint。
3. 如果发现 packet 本身不足，要求退回 Pass A。

### B7 自动重渲染或人工确认

代码负责：

1. 在低风险 lint/editorial 失败时自动重渲染。
2. 在高风险泄密、状态不一致、来源冲突时退回 Pass A。
3. 在配置需要时等待人工确认。

LLM 负责：

1. 生成新的正文候选。
2. 保持事实不变。

### B8 Render Final Gate / 渲染最终校验

B8 是发布 `rp-prose` 前的最终门。

代码负责校验：

1. draft 已有 editorial review。
2. editorial verdict 为 `approve`。
3. lint 通过。
4. forbiddenStrings 未命中。
5. 没有检测到明显 packet 外事实。
6. preview 状态为 `approved`。
7. proseMessageId 尚未发布或正在创建新版本。

LLM 负责校验：

1. 正文是否忠于 Render Packet。
2. 正文是否与上下文连续。
3. 正文是否符合角色资料和 Source Bundle。
4. 文风是否达标。
5. 是否需要最后一次 rewrite。

B8 输出：

```json
{
  "verdict": "publish | rewrite | return-to-pass-a | block",
  "reasons": [],
  "returnTo": "B2 | B4 | A8 | A9 | none"
}
```

B8 不通过时，不能发布 `rp-prose`。

## 11. LLM 与代码职责边界

### 11.1 总原则

```text
LLM 负责定位来源、语义判断、角色推演、文学表达、编辑审稿。
代码负责流程控制、权限隔离、结构校验、状态存储、消息投递、外键关系。
```

### 11.2 职责矩阵

| 模块 | LLM 负责 | 代码负责 |
|---|---|---|
| 输入分类 | 辅助解释模糊意图 | 最终分类、路由、阻止混流 |
| 上下文装配 | 判断需要哪些资料 | 控制加载范围、注入模块、记录来源 |
| 原文检索 | 找正确来源、摘取必要原文 quote | 执行工具、保存 sourceId、校验 quote |
| 资料处理 | 基于原文解释和推演 | 禁止用无来源摘要替代原文 |
| 世界查询 | 决定查什么、解释结果 | 执行 `world_query`、返回 refs |
| 角色推演 | NPC 动机、知识、行动、沉默 | 提供状态、历史约束、Source Bundle |
| 战斗/骰子 | 判断是否需要、解释影响 | 工具执行、随机结果、结构化记录 |
| 成就/兑换/生命树 | 判断触发和叙事影响 | 账本、价格、校验、写入 |
| 状态写入 | 给出要写的语义内容 | 执行写入、校验成功/失败 |
| A9 最终校验 | 语义自洽、来源冲突判断 | 结构、写入、hash、ledger、权限检查 |
| Direction Packet | 填写事实包并引用 sourceId | schema 校验、拒绝不合格包 |
| Render Packet | 不直接生成 | 从 Direction Packet 净化派生 |
| 正文渲染 | 文学表达、对白、节奏 | 禁用写入工具、限制输入 |
| 编辑审稿 | 评价正文质量、上下文、角色、文风 | 调度审稿、执行 verdict |
| Preview | 根据反馈改写 | 暂存草稿、标状态、不正式投递 |
| Lint | 理解错误并重写 | 自动检测、阻断、重试策略 |
| B8 最终校验 | 最终语义/文风判断 | 发布门禁、消息状态、外键记录 |
| custom message | 不手工伪造 | 投递 `rp-prose` |
| turn-ledger | 不手工维护外键 | 记录 source/packet/prose 关系 |
| rerender | 只改文字 | 提供旧 render packet、禁止改状态 |
| --no-skills | 不决定启动策略 | runtime 成熟后控制 skill 加载 |

### 11.3 负责多少

| 层面 | LLM 占比 | 代码占比 | 原因 |
|---|---:|---:|---|
| 原文定位与引用选择 | 60% | 40% | LLM 判断相关性，代码保存来源与校验存在。 |
| 原文保存与传递 | 10% | 90% | 必须靠代码保持 provenance。 |
| 角色内生推演 | 80% | 20% | 需要语义判断和人物理解。 |
| 世界事实检索 | 30% | 70% | LLM 负责提问和解释，代码负责查库和来源。 |
| 战斗/随机/兑换/生命树结算 | 40% | 60% | LLM 负责语义适配，代码负责规则、账本和校验。 |
| 状态落盘 | 20% | 80% | LLM 给内容，代码执行和验证。 |
| A9 Settlement Final Gate | 40% | 60% | LLM 查语义缺口，代码查结构与写入。 |
| packet schema | 20% | 80% | LLM 填包，代码校验。 |
| hidden 防泄露 | 10% | 90% | 必须靠代码隔离，不能靠自觉。 |
| 文学正文 | 85% | 15% | LLM 主写，代码只做输入限制和 lint。 |
| 编辑审稿 | 70% | 30% | 语义和文风需要 LLM，verdict 执行由代码控制。 |
| preview/lint/rerender 控制 | 30% | 70% | LLM 重写，代码决定通过、退回或重试。 |
| B8 Render Final Gate | 40% | 60% | LLM 判文风和语义，代码判发布条件。 |
| 生命周期和消息投递 | 0% | 100% | 必须由 extension 控制。 |
| skill/prompt 按需加载 | 20% | 80% | LLM 可申请资料，runtime 决定装配。 |

## 12. 硬闸工具：rp_submit_direction_packet

工具位置建议：

```text
.pi/extensions/rp-runtime-orchestrator/
  index.ts
  packet-schema.ts
  packet-validate.ts
  render-packet.ts
  source-bundle.ts
  final-gates.ts
```

工具职责：

1. 接收 Direction Packet。
2. 校验 schema。
3. 校验 sourceBundleId。
4. 检查 narrative 回合 `visibleChanges` 和 `endWindow`。
5. 检查 `stateChanges` 与写入摘要。
6. 检查 hidden 泄露。
7. 派生 Render Packet。
8. 创建或更新 turn-ledger pending 记录。
9. 返回 render packet 或错误。

LLM 不能绕过该工具直接进入 Pass B。

## 13. 生命周期编排

完整系统必须使用生命周期扩展，而不是只靠模型自觉分段。

| 生命周期事件 | 代码职责 |
|---|---|
| `input` | 输入分流，标记 mode。 |
| `before_agent_start` | 注入当前阶段最小 prompt 和必要模块。 |
| `tool_result` | 捕获 Source Bundle、Direction Packet 和工具写入结果。 |
| `turn_end` | 检查是否存在 accepted packet 和 A9 结果。 |
| `agent_end` | 阻止 Pass A 普通正文直接成为最终输出。 |
| `agent_settled` | 确认工具调用和重试结束，启动渲染或投递 approved prose。 |
| `message_end` | 捕获候选正文，交给 preview/editorial/lint。 |
| `session_before_compact` | 使用 turn-ledger 和 Source Bundle 生成事实摘要。 |

生命周期目标流程：

```text
用户输入 narrative
  -> input 标记 narrative
  -> before_agent_start 注入 settlement prompt
  -> Source Retrieval 生成 Source Bundle
  -> 主 agent 执行 Pass A
  -> tool_result 捕获 accepted Direction Packet
  -> A9 Final Gate 通过
  -> agent_end 阻止 Pass A 正文直接成为最终输出
  -> agent_settled 启动 renderer
  -> renderer 生成 draft
  -> message_end 进入 Editorial Review + preview widget
  -> lint 与 B8 通过
  -> agent_settled 投递 rp-prose
  -> ledger 记录 proseMessageId
```

## 14. Preview Widget

Preview widget 是 runtime 安全层。

状态：

| 状态 | 说明 |
|---|---|
| `draft` | Pass B 初稿，未检查。 |
| `editorial-reviewing` | 编辑审稿中。 |
| `editorial-rewrite` | 编辑要求重写。 |
| `linting` | 正在检查。 |
| `lint-failed` | 发现问题，不能投递。 |
| `rerendering` | 自动或手动重渲染中。 |
| `needs-pass-a` | packet 或来源不足，需要退回结算。 |
| `approved` | 可进入 B8。 |
| `published` | 已投递为 `rp-prose`。 |

Preview widget 显示内容：

1. 当前 draft 正文。
2. 对应 `turnId`。
3. Source Bundle 引用摘要。
4. Editorial Review verdict。
5. lint 结果。
6. 是否发现 packet 外事实。
7. 是否命中 forbiddenStrings。
8. 可选操作：approve、rerender、return-to-pass-a、discard。

代码负责 widget 状态机；LLM 只负责根据反馈重写正文或给审稿意见。

## 15. custom message：rp-prose

正式玩家正文建议投递为 custom message：

```text
customType: rp-prose
```

用途：

1. 区分结算过程和最终正文。
2. 支持 chronology 按消息类型重建历史。
3. 支持 rerender 替换正文表面。
4. 支持 compaction 从 packet 和 Source Bundle 而不是从散文猜事实。
5. 避免 Pass A 的内部分析污染玩家阅读。

## 16. turn-ledger 与 chronology

建议新增：

```text
memory/turn-ledger.jsonl
```

每行一个回合记录：

```json
{
  "turnId": "turn-20260727-001",
  "createdAt": "2026-07-27T00:00:00.000Z",
  "turnType": "narrative",
  "sourceBundleHash": "",
  "directionPacketHash": "",
  "renderPacketHash": "",
  "directionPacketSummary": {
    "playerAction": "...",
    "visibleChanges": [],
    "stateChanges": [],
    "memoryWrites": [],
    "cardWrites": [],
    "worldRefsUsed": []
  },
  "renderPacket": {
    "playerAction": "...",
    "visibleChanges": [],
    "npcMoves": [],
    "npcSilences": [],
    "sensoryAnchors": [],
    "endWindow": "...",
    "renderStyle": []
  },
  "editorial": {
    "verdict": "approve",
    "reviewId": ""
  },
  "prose": {
    "customType": "rp-prose",
    "messageId": "",
    "previewId": "",
    "version": 1
  }
}
```

Chronology 负责从 ledger、messages、tool calls 重建：

1. 最近剧情事实。
2. 最近玩家正文。
3. 哪些正文是哪个 packet 渲染来的。
4. 哪些正文被 rerender 过。
5. 哪些状态已落盘。
6. 哪些事实来自哪个 sourceId。

## 17. Rerender

用户说：

```text
上一轮重写得更细腻
换成轻小说风
保留事实，只改文风
```

流程：

1. 代码读取最近 `turn-ledger` 的 Render Packet。
2. 读取对应 Source Bundle 的 player-visible quote。
3. 不重新运行 Pass A。
4. 不重新骰子。
5. 不重新战斗。
6. 不修改 card。
7. 不修改 memory 事实层。
8. Pass B 根据旧 Render Packet、Source Bundle 和新 style 生成 draft。
9. Editorial Review、preview、lint、B8 通过后发布新 `rp-prose` 版本。

LLM 负责重写语言；代码负责禁止事实变化。

## 18. 渲染 Lint

Lint 分为代码硬检查和 LLM 语义检查。

| 检查 | 代码负责 | LLM 负责 |
|---|---|---|
| forbiddenStrings | 字符串匹配 | 重写避开泄露 |
| no-heading | 正则/Markdown 检查 | 改成正文 |
| no-bullet-list | 正则/格式检查 | 改成自然段 |
| no-menu-ending | 规则检查 | 改成情境停点 |
| no-tool-mention | 关键词检查 | 删除系统痕迹 |
| no-new-facts | 与 Render Packet 对照，部分自动 | 判断语义是否新增事实 |
| source-consistency | 检查 sourceId 存在 | 判断正文是否与原文冲突 |
| coverage | 检查 visibleChanges 是否出现 | 自然补足遗漏 |
| ooc-check | 提供状态约束 | 判断角色行为是否合理 |
| state-sync-check | 检查正文状态变化是否已落盘 | 发现需退回 Pass A |

高风险失败必须退回 Pass A：

1. 正文需要新增事实才能成立。
2. 状态变化未落盘。
3. hidden 信息混入 visible 字段。
4. packet 自身缺少关键结算。
5. Source Bundle 不足或来源冲突。

## 19. 渐进式按需加载与 --no-skills

`--no-skills` 不是“不使用技能”，而是禁用自动发现，让 runtime 自己决定加载什么。

Pi 文档要点：

1. `--no-skills` 禁用自动 skill discovery。
2. 显式 `--skill <path>` 仍可加载。
3. extension 可通过 `resources_discover` 贡献 skill/prompt/theme 路径。

本项目路线：

### 当前阶段

不启用 `--no-skills`，避免绕开现有 `.pi/skills/`。

### 中期阶段

runtime 根据输入类型注入少量模块：

| 场景 | 加载模块 |
|---|---|
| 世界设定 | `rp-world-search` 摘要 + `world_query` |
| 战斗 | `rp-combat` + 评级方法 + 评级体系 |
| 骰子 | `rp-dice` |
| 成就 | `rp-achievement` + `achievement_edit` |
| 兑换 | `rp-exchange` + `exchange_edit` |
| 生命树 | `rp-life-system-tree` + `life_tree_edit` |
| 文风渲染 | render prompt + style 文件 |
| 编辑审稿 | editorial prompt + Render Packet + Source Bundle |
| 项目维护 | coding/maintenance prompt，不加载 RP 正文规则 |

### 成熟阶段

可评估：

```text
pi --no-skills -e ./.pi/extensions/rp-runtime-orchestrator/index.ts
```

并由 runtime 通过 `resources_discover`、显式 prompt assembly 或 `--skill` 精准装配。

## 20. 实施阶段

### 阶段 0：方案文档

产物：

```text
docs/rp-two-pass-runtime-system-plan.md
```

### 阶段 1：Source Bundle 与 Direction Packet 硬闸

新增最小 extension：

```text
.pi/extensions/rp-runtime-orchestrator.ts
```

实现：

1. Source Bundle schema。
2. `rp_submit_direction_packet`。
3. schema 校验。
4. sourceId 校验。
5. hidden/render 防火墙。
6. Render Packet 派生。
7. pending ledger。

### 阶段 2：A9 Settlement Final Gate

实现：

1. 结算最终校验。
2. 来源、工具结果、状态写入、packet 一致性检查。
3. 不通过时返回指定 A 阶段。

### 阶段 3：生命周期编排

实现：

1. `input` 分流。
2. `before_agent_start` 注入阶段 prompt。
3. `tool_result` 捕获 packet。
4. `agent_end` 阻断 Pass A 正文。
5. `agent_settled` 启动 Pass B。

### 阶段 4：Editorial Review 与 Preview Widget

实现：

1. editorial reviewer。
2. review verdict。
3. draft 暂存。
4. lint 状态。
5. rerender 状态。
6. approve/publish 状态。

### 阶段 5：B8 Render Final Gate 与 rp-prose

实现：

1. 渲染最终校验。
2. 正式正文投递。
3. message id 返回 ledger。
4. 普通 assistant 消息与 prose 消息隔离。

### 阶段 6：turn-ledger / chronology / rerender

实现：

1. `memory/turn-ledger.jsonl`。
2. chronology reader。
3. rerender 最新 prose。
4. compaction 使用 packet + Source Bundle 摘要。

### 阶段 7：按需 skill/prompt 装配

实现：

1. source retrieval prompt。
2. settlement prompt。
3. render prompt。
4. editorial prompt。
5. maintenance prompt。
6. 模块路由表。
7. 上下文预算器。

### 阶段 8：受控 --no-skills

前提：

1. runtime 已稳定。
2. direct/narrative/panel/rerender/maintenance/debug 均可路由。
3. 所有核心工具仍可用。
4. release 流程验证通过。

## 21. 推荐文件布局

最终形态：

```text
.pi/extensions/rp-runtime-orchestrator/
  index.ts
  input-router.ts
  lifecycle.ts
  source-bundle.ts
  packet-schema.ts
  packet-validate.ts
  final-gates.ts
  render-packet.ts
  preview-widget.ts
  editorial-review.ts
  prose-message.ts
  turn-ledger.ts
  chronology.ts
  renderer.ts
  lint.ts
  rerender.ts
  module-router.ts

prompts/rp-runtime/
  source-retrieval-system.md
  settlement-system.md
  settlement-kernel.md
  render-system.md
  render-contract.md
  editorial-review-system.md
  maintenance-system.md

memory/
  turn-ledger.jsonl

docs/
  rp-two-pass-runtime-system-plan.md
```

第一阶段可先用单文件 `.pi/extensions/rp-runtime-orchestrator.ts`，稳定后拆目录。

## 22. 风险与防护

| 风险 | 说明 | 防护 |
|---|---|---|
| 工程过重 | 一次性搬完整外来方案会拖慢项目 | 分阶段，先 Source Bundle 和硬闸，再生命周期。 |
| 旧 skills 失效 | 直接 `--no-skills` 会绕开当前能力 | 成熟前不启用。 |
| 原文被摘要污染 | 检索阶段 LLM 自行概括成事实源 | Source Bundle 原文 quote + sourceId。 |
| Pass A 仍写正文 | 模型习惯性输出散文 | `agent_end` 阻断 + packet 必填。 |
| A 阶段漏结算 | 工具结果、写入、packet 不一致 | A9 Settlement Final Gate。 |
| Pass B 新增事实 | 渲染器发挥过度 | Render Packet + editorial review + lint + preview。 |
| hidden 泄露 | 隐藏事实进入渲染上下文 | 代码净化，不给 Pass B hidden。 |
| 文风不达标 | 正文可读但不像目标文风 | Editorial Review 决定 rewrite。 |
| 状态未落盘 | 正文写了伤势/能力但 card 没变 | stateChanges 与 writes 强绑定。 |
| B 阶段草稿污染正式会话 | 初稿直接输出 | Preview Widget + B8 Final Gate。 |
| 重渲染改事实 | 用户要求重写时模型重判结果 | rerender 只读取旧 Render Packet 和 Source Bundle。 |
| 维护污染剧情 | 改项目文件时写入剧情 memory | 输入 router 将 maintenance 与 narrative 隔离。 |

## 23. 最终判断

本项目应吸收外来 Two-Pass 方案的大部分工程思想，但必须按当前项目重构为 runtime 机制。

正确方向是：

```text
从规则堆叠
转向 runtime 编排；

从模型自觉遵守
转向 Source Bundle + packet + 工具硬闸；

从二手摘要事实源
转向原文 quote + sourceId；

从单一主对话
转向生命周期分阶段；

从自动 skill 全量暴露
转向阶段化、按需加载；

从散文即事实
转向 packet 是事实、散文是渲染；

从直接正文投递
转向 editorial review -> preview -> final gate -> rp-prose。
```

最终目标：

```text
RP Runtime Orchestrator
+ input router
+ Source Bundle 原文资料包
+ Pass A settlement pipeline
+ A9 Settlement Final Gate
+ rp_submit_direction_packet
+ Direction Packet / Render Packet
+ Packet Firewall
+ lifecycle two-pass render
+ Editorial Review
+ preview widget
+ B8 Render Final Gate
+ rp-prose custom message
+ turn-ledger / chronology / rerender
+ 渐进式按需 skill/prompt 装配
+ 受控 --no-skills
```

这样才能真正解决“规则太多导致模型不遵守”的根本问题，同时保留当前项目的世界库、角色卡、记忆、战斗框架和可选系统。