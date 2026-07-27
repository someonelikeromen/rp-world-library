# pi-rp Two-Pass Runtime 长期自动迭代计划

> 本文定义 Pi 如何长期、分批、可审计地推进 `RP Runtime Orchestrator` 实现。它不是架构设计本身；架构设计见 `docs/rp-two-pass-runtime-system-plan.md`。

## 1. 目标

Two-Pass Runtime 不是一次性改完的功能，而是一组跨 extension、prompt、skill、ledger、preview、生命周期和测试的工程改造。

本计划的目标是让 Pi 能够长期自动推进，但每一步都保持：

1. 有明确任务边界。
2. 有验收标准。
3. 有 review。
4. 有状态记录。
5. 有用户确认节点。
6. 不污染 RP 剧情状态。
7. 不误改发布版。

核心原则：**自动执行可以分批推进，但不能无限自启动、不能跳过 review、不能绕过用户确认。**

## 2. 适用范围

本计划适用于以下工作：

1. `RP Runtime Orchestrator` extension 实现。
2. Source Bundle、Direction Packet、Render Packet schema。
3. A9/B8 final gate。
4. 生命周期编排。
5. Editorial Review。
6. Preview Widget。
7. `rp-prose` custom message。
8. `turn-ledger`、chronology、rerender。
9. 按需 skill/prompt 装配。
10. 受控 `--no-skills` 评估。
11. 相关文档、验收标准、任务包维护。

不适用于：

1. 正式 RP 剧情推进。
2. 角色卡剧情状态更新。
3. 世界书内容归档。
4. 发布版 `E:/pi-rp` 直接修改。

## 3. 基本规则

1. 所有实现和测试只在 `E:/pi-st` 进行。
2. `E:/pi-rp` 是发布版，不得直接编辑。
3. 每批迭代前必须给出任务计划并等待用户确认。
4. 每批迭代只能覆盖一个小闭环，不允许跨多个高风险阶段乱跳。
5. 维护任务不得写入 RP 剧情 memory，除非用户明确要求记录项目决策。
6. 不得让 Pi 无限自动创建下一批任务并自启动执行。
7. 每批完成后必须 review，再决定继续、修复、暂停或进入下一批。
8. Windows 环境下优先使用 `read`、`edit`、`write`，不依赖 Linux/Unix 工具。

## 4. 长期迭代主循环

```text
读取 roadmap / 当前状态
  -> 选择一个小阶段
  -> 拆成 Taskplane 任务包
  -> 用户确认本批任务
  -> orch_start 执行
  -> orch_status 观察
  -> 失败任务 retry / skip / pause
  -> review 代码、文档、边界和测试
  -> 集成通过任务
  -> 更新 roadmap / ADR / acceptance / STATUS
  -> 等待用户确认下一批
```

这个循环允许 Pi 长期推进，但每批之间必须有人工确认点。

## 5. 必备项目文件

建议长期维护以下文件：

```text
docs/rp-two-pass-runtime-system-plan.md
  - 总体架构方案。

docs/rp-two-pass-runtime-iteration-plan.md
  - 本文，长期自动迭代机制。

docs/rp-two-pass-runtime-roadmap.md
  - 阶段路线图、依赖、优先级、当前状态。

docs/rp-two-pass-runtime-acceptance.md
  - 每阶段验收标准。

docs/rp-two-pass-runtime-adr.md
  - 架构决策记录，例如是否启用 --no-skills、是否使用 custom message。

taskplane-tasks/
  - 每批可执行任务包。

.pi/extensions/rp-runtime-orchestrator/
  - runtime 代码主体。

prompts/rp-runtime/
  - source retrieval、settlement、render、editorial、maintenance 等阶段 prompt。

memory/turn-ledger.jsonl
  - RP 回合 ledger，只用于 RP runtime，不用于项目维护任务。
```

其中 `roadmap`、`acceptance`、`adr` 可以在进入实现阶段时再创建，不必在方案阶段一次性铺满。

## 6. 阶段路线

| 阶段 | 目标 | 风险 | 是否可并行 |
|---|---|---|---|
| P0 | 文档、roadmap、acceptance、ADR 框架 | 低 | 否 |
| P1 | Source Bundle + packet schema | 中 | 部分可并行 |
| P2 | `rp_submit_direction_packet` 硬闸工具 | 中 | 否 |
| P3 | A9 Settlement Final Gate | 中 | 否 |
| P4 | 生命周期编排 | 高 | 部分可并行 |
| P5 | Editorial Review + Preview Widget | 高 | 部分可并行 |
| P6 | B8 Final Gate + `rp-prose` custom message | 高 | 否 |
| P7 | turn-ledger / chronology / rerender | 中 | 部分可并行 |
| P8 | 按需 skill/prompt 装配 | 高 | 部分可并行 |
| P9 | 受控 `--no-skills` 评估 | 高 | 否 |

## 7. 每个任务包必须包含

每个 Taskplane 任务必须写清：

```text
目标：
  本任务要完成什么。

范围：
  允许修改哪些文件。
  禁止修改哪些文件。

依赖：
  依赖哪个阶段、哪个任务、哪个工具。

实现要求：
  具体行为、schema、接口、边界。

LLM/代码边界：
  哪些由 LLM 判断，哪些由代码校验或执行。

验收标准：
  如何证明完成。

测试方式：
  自动测试、手动场景、dry run 或审计方式。

回滚边界：
  如果失败，哪些改动可撤销，哪些状态不能碰。

输出：
  需要更新哪些 docs / STATUS / ADR / acceptance。
```

## 8. 自动迭代角色分工

| 角色 | 职责 |
|---|---|
| Planner | 从 roadmap 拆任务，生成 Taskplane 任务包。 |
| Worker | 实现单个任务，保持范围收敛。 |
| Reviewer | 检查代码、文档、schema、边界和测试。 |
| Runtime Auditor | 专门检查是否违背 Two-Pass 架构。 |
| Integration Agent | 合并通过 review 的任务，更新状态文件。 |
| Human Operator | 决定是否进入下一阶段、是否启用高风险能力。 |

不同角色可以由不同 agent 执行，也可以由同一 Pi 会话按阶段扮演，但 review 不能省略。

## 9. 推荐执行方式

使用 Taskplane / orchestrator 执行批次：

```text
1. Planner 根据 roadmap 生成下一批任务。
2. 用户确认任务批次。
3. 使用 orch_start 执行。
4. 使用 orch_status 观察进度。
5. 失败任务使用 orch_retry_task、orch_skip_task 或 supervisor_takeover 处理。
6. 完成后进入 review。
7. review 通过后 orch_integrate。
8. 更新 roadmap、ADR、acceptance。
9. 等待用户确认下一批。
```

不得在没有用户确认的情况下自动 `orch_start` 下一批。

## 10. 每轮迭代后的固定检查

每一批完成后必须检查：

1. 是否仍符合 Windows 环境规则。
2. 是否误改发布版 `E:/pi-rp`。
3. 是否误把维护内容写入 RP 剧情 memory。
4. 是否新增了长常驻规则，违背“机制优先”。
5. 是否让 Pass B 看到了 hidden 信息。
6. 是否让 LLM 负责了本该由代码负责的流程控制。
7. 是否把资料检索阶段变成 LLM 摘要，而不是 Source Bundle 原文传递。
8. 是否破坏现有 `.pi/skills/` 自动发现流程。
9. 是否有清晰测试或手动验收记录。
10. 是否更新 roadmap / ADR / acceptance。

## 11. 小闭环推进策略

Pi 每次只推进一个小闭环：

```text
定义接口
  -> 实现最小代码
  -> 写验证
  -> 更新文档
  -> review
  -> 合并
```

禁止在同一批里同时做多个高风险阶段，例如：

```text
Source Bundle
+ lifecycle
+ preview widget
+ --no-skills
```

必须先让前一阶段可运行、可验证，再进入下一阶段。

## 12. 高风险确认点

以下动作必须单独向用户确认，不得作为普通任务顺带执行：

1. 启用或测试 `--no-skills`。
2. 改写 `.pi/skills/rp-engine/SKILL.md` 的主流程。
3. 引入 lifecycle 自动拦截正式回复。
4. 引入 custom message 正式投递。
5. 改写 memory 写入策略。
6. 改写 card_edit / world_query 等核心工具。
7. 修改 release 同步流程。
8. 删除或迁移现有规则文件。

## 13. 暂停条件

出现以下情况必须暂停自动迭代：

1. runtime 影响普通编码任务或项目维护任务。
2. `rp-engine`、`world_query`、`card_edit` 等核心能力不可用。
3. Pass A / Pass B 隔离失败。
4. Source Bundle 无法追溯原文。
5. ledger 与实际消息不一致。
6. preview widget 将草稿误投递为正式正文。
7. review 发现架构方向偏离。
8. 用户要求暂停或改方向。
9. 需要进入高风险确认点。

## 14. 完成定义

长期方案完成不以“文档写完”为准，而以以下能力稳定为准：

1. narrative 输入自动进入 Source Bundle -> Pass A -> A9 -> Pass B -> Editorial Review -> Preview -> B8 -> `rp-prose`。
2. panel/direct/maintenance/debug/rerender 能正确分流。
3. Source Bundle 保留原文 quote 和 sourceId。
4. Direction Packet 和 Render Packet 有代码校验。
5. A9 能阻断不完整结算。
6. Pass B 不接触 hidden。
7. Editorial Review 能决定 approve/rewrite/return-to-pass-a。
8. preview widget 能阻止草稿污染正式正文。
9. B8 能阻断不合格正文发布。
10. turn-ledger 能重建 source/packet/prose 关系。
11. rerender 能只改正文不改事实。
12. 按需 skill/prompt 装配可用。
13. 受控 `--no-skills` 经过验证后可选启用。

## 15. 当前建议

下一步不应直接实现完整 runtime，而应先进入 P0：

1. 创建 roadmap。
2. 创建 acceptance。
3. 创建 ADR 初稿。
4. 生成第一批 Taskplane 任务，范围只覆盖 Source Bundle 和 packet schema。
5. 用户确认后再执行第一批。
