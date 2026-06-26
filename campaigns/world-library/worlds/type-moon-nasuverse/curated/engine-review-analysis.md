## agent_team step final

runId: r1
objective: 归档型月世界（type-moon-nasuverse）：将 8 个 raw worldbook JSON（1038 条目，15.5MB）整理为 curated 结构化产物。流程：分类→6领域并行→图谱→整合→校验→修复→自迭代+缺失清单。所有输出写入 campaigns/world-library/worlds/type-moon-nasuverse/curated/。
stepId: step-2f-engine-review
status: succeeded
stopReason: succeeded
agentRef: inline:step-2f-engine-review
agentSource: inline
cwd: E:\pi-st
needs: step-1-classify
after: none
startedAt: 2026-06-26T14:25:44.511Z
endedAt: 2026-06-26T14:31:10.067Z

## Upstream artifacts
- step-1-classify [succeeded]: artifact="C:\\Users\\22134\\AppData\\Local\\Temp\\pi-multiagent-run-r2rTA7\\step-1-classify-final.md" chars=20133

## Task

评审所有引擎规则条目，按三层分类，输出 engine-review-analysis.md（Tier A 提取可迁移框架模式，Tier B 保留为型月参考，Tier C 记录后丢弃）。

Now I have comprehensive understanding of all 71 engine-review entries. Let me produce the final analysis. Note: I don't have write access as this subagent — I'll produce the complete Markdown output inline as my final response.

---

## 型月引擎规则评审

> Step: step-2f-engine-review | World: type-moon-nasuverse | 71 entries reviewed

---

## Tier A: 可迁移框架模式

### A1. 五步流水线执行协议 (5-Stage Pipeline Protocol)

- **来源条目**: 输出规则:正文输出 (8828 chars, FSN沙盒 index 1), 输出规则:起始/结尾
- **解决的问题**: LLM 在长对话 RP 中容易「跳过推演直接写文」「忘记状态结算」「视角越界」。该协议强制每轮回复必须执行五个有序步骤，用 XML 标签将推演过程显式化。
- **设计模式**:
  ```
  Step1: 全域逻辑推演→〈story_driver〉标签
          ├─ 常规→〈npc_driver〉或〈combat_driver〉
  Step2: 正文生成（限知视角）
  Step3: 剧情归档→〈summary〉
  Step4: 状态结算→〈wlog〉世界运行报告
  ```
  核心特征：
  - **强制执行**：严禁乱序，每步必须顺序完成
  - **XML 标签容器**：各步骤输出封装在语义化标签中（`<story_driver>`, `<combat_driver>`, `<npc_driver>`, `<summary>`, `<wlog>`, `<npc_log>`, `<card>`）
  - **分支路由**：Step1 根据判定结果动态触发子模块
  - **状态归档**：Step3+Step4 形成持久化「记忆锚点」

- **建议迁移方式**:
  1. 抽象为 `rp-engine` skill 的 `PipelineProtocol` 配置项
  2. 允许 RP 场景定义 Step 顺序和标签集合（不硬编码五步）
  3. 标签体系可插入 pi 的 context_tag 系统，作为对话流 checkpoint
  4. 将 `<summary>` 和 `<wlog>` 的归档格式统一为结构化 JSON（而非 XML），便于 memory 系统索引

- **原文摘录**:
  > 每次回复必须严格按照以下五个步骤顺序执行，缺一不可：1.[全域逻辑推演]→读取规则输出`<story_driver>`... 2.[正文生成]... 3.[剧情归档]→`<summary>`... 4.[状态结算]→`<wlog>`...

---

### A2. 分布式思维链架构 (Distributed Chain-of-Thought)

- **来源条目**: 战斗思维链 (1183 chars), NPC思维链 (815 chars), 暗流思维链 (497 chars), 独立思维链提取 (43 chars), 输出规则:正文输出 中的 story_driver/combat_driver/npc_driver
- **解决的问题**: 单条系统提示词难以同时覆盖战斗检定、NPC心理、世界推演、暗线发展。该设计将不同「认知域」拆分为独立的思维链模块，由主引擎按需路由调用。
- **设计模式**:
  ```
  story_driver (主引擎) → 路由判定:
    ├─ 战斗→ combat_driver (参数化对抗演算)
    ├─ 社交→ npc_driver (心理-好感-信任梯度)
    └─ 后台→ subplot/暗流思维链 (离场事件推演)
  ```
  各子链特征：
  - **combat_driver**：4-Step 对抗演算（AGI检定→STRvsCON→魔术/宝具→LUCK），纯数值化
  - **npc_driver**：3级过滤（性格+诉求+底线），反好感度绑架，好感-信任双轴
  - **subplot/暗流**：空间隔离原则，只演出场外之事，严禁「视奸」

- **建议迁移方式**:
  1. 在 `rp-engine` 中实现 `ThinkingChain` 抽象：`{domain, triggerCondition, evaluationSteps, outputTag}`
  2. 战斗链可复用到任何有数值系统的 RP 世界（只需替换参数名）
  3. NPC 链的「底线>利益>好感」优先级模型是通用 RP 最佳实践
  4. 暗流链的「空间隔离+命运预告」模式适用于任何多线程叙事世界

- **原文摘录** (combat_driver):
  > Step1: 敏捷(AGI)检定 — 攻方AGI - 守方AGI ... Step2: 攻防检定 — (攻方STR x 技能) - (守方CON + 护甲) ... Step3: 魔术/宝具判定 ... Step4: 幸运检定

- **原文摘录** (npc_driver):
  > 4. 反好感度绑架: 好感度仅代表NPC对玩家的私人情感倾向，【绝不等于】行为上的绝对服从。当玩家的要求违背NPC的【行为底线】时，底线具有一票否决权。

---

### A3. MVU 变量状态管理系统 (Model-View-Update)

- **来源条目**: [mvu_update]变量更新规则·世界状态/主角状态/角色社交/开始/结束/输出格式/输出格式强调 (合计~7000 chars), 变量列表, [initvar]变量初始化, mvu (7290 chars, 伊莉雅文件)
- **解决的问题**: 长对话 RP 中「世界状态漂移」——上一轮的伤势、魔力、人际关系在下一轮被 LLM「遗忘」。MVU 系统通过 JSON Patch 协议的变量追踪解决状态持久化问题。
- **设计模式**:
  ```
  初始化: initvar → 定义变量树（世界状态/主角状态/角色社交/...）
  每轮更新: mvu_update → 输出 <UpdateVariable> 块
    ├─ <Analysis> (80字内英文分析)
    └─ <JSONPatch> (RFC 6902 标准操作: replace/delta/insert/remove/move)
  输出格式: 变量输出格式强调 → 校验 JSON Patch 语法
  ```
  变量树结构示例（世界状态域）：
  ```yaml
  /世界状态:
    选择故事线: type | FGO_特异点F_冬木 | ...
    当前事件: check → 读取 timeline
    当前事件进度: '未触发'|'进行中'|'已完成'
    预测下个事件: 基于蝴蝶效应
    在场角色: string[]
  ```

- **建议迁移方式**:
  1. **直接抽象为 pi RP 核心能力**：`rp-engine` skill 应内置 `StateManager` 组件
  2. JSON Patch 协议是成熟的工业标准（RFC 6902），可直接采用
  3. 变量树 schema 可定义为世界模板的 `stateSchema` 字段
  4. `UpdateVariable` 输出块可集成到 pi 的 context_tag 系统作为状态 snapshot
  5. `delta` 操作特别适合数值型状态（HP/魔力/好感度）的增量更新

- **原文摘录** (变量输出格式):
  > the update commands works like the **JSON Patch (RFC 6902)** standard, must be a valid JSON array containing operation objects ... replace/delta/insert/remove/move

---

### A4. 事件概率引擎与排他性锁 (Event Probability Engine)

- **来源条目**: 输出规则:正文输出 中的 story_driver 事件检定部分
- **解决的问题**: 静态事件表（如「今天可能下雨/可能遇到刺客」）需要「涌现性」——即事件概率随剧情动态演化，高概率事件排斥低概率事件干扰。
- **设计模式**:
  ```
  事件池: [危机/奇遇/日常/情感] 四类，基于[当前时间+地点+好感度]动态生成
  独裁阈值: IF 任意事件概率 ≥ 80% → 排他性法则：其余事件概率冻结
  常规判定: IF 无事件≥80% → 对所有事件 Rolling
    ├─ 通过 → 锁定
    └─ 失败 → 概率+10%~20%（累积触发）
  逻辑顺位: 熵增事件(死亡/破坏) > 熵减事件(救援/治愈)
  ```

- **建议迁移方式**:
  1. 实现为 `ProbabilityEngine`，输入事件池+check规则，输出锁定事件
  2. 独裁阈值和累积触发机制是通用设计模式
  3. 熵增优先规则适用于任何「残酷世界」基调的 RP

- **原文摘录**:
  > [独裁阈值]: IF (任意事件概率 ≥ 80%) → [排他性法则]: 当高概率事件被锁定，其余事件的概率被绝对冻结

---

### A5. EJS 事件控制器 — 动态世界书路由 (Dynamic Worldbook Router)

- **来源条目**: [ejs]FGO_事件控制器 (7361 chars, FGO 文件)
- **解决的问题**: 大型世界有几十个子场景（如 FGO 的 29 个特异点/Lostbelt），不可能全部加载到上下文。需要一个「路由器」根据当前故事线变量，动态加载对应的世界书条目。
- **设计模式**:
  ```
  EJS 模板引擎表达式:
  <%_ if (storyLineUpper.includes('巴比伦')) { _%>
    <%- await getwi(null, 'FGO_第七特异点_巴比伦尼亚') %>
  <%_ } else if (...) { _%>
    ...
  ```
  关键机制：
  - 读取变量 `stat_data.世界状态.选择故事线`
  - 26 个分支匹配（按 FGO 剧情顺序）
  - `getwi()` API 动态注入世界书条目内容

- **建议迁移方式**:
  1. **可迁移模式**：`DynamicRouter` 抽象 — `{sourceVariable, routes: [{match, entryId}], defaultRoute}`
  2. 适用于任何「分章节/分区域/分时间线」的大型世界
  3. 在 pi 中可实现为 worldbook 加载策略插件
  4. EJS 模板语法可替换为更简单的 YAML route table

- **原文摘录**:
  > <%_ if (storyLineUpper.includes('特异点F')) { _%> <%- await getwi(null, 'FGO_特异点F_冬木') %> ... 26 个条件分支

---

## Tier B: 型月特有参考

### B1. FGO 状态栏模板

- **来源条目**: 状态栏 (1058 chars, FSN文件), 状态栏:默认 (1553 chars), 状态栏:角色好感度 (850 chars), 状态栏 (2493 chars, 型月(1))
- **为什么有用但不通用**: 状态栏展示格式（令咒剩余/魔力存量/从者参数表）高度绑定 FGO/Fate 力量体系。但「输出末尾显示结构化状态栏」这个 UI 模式是通用的。
- **保留价值**: 作为型月 RP 世界的 UX 参考；状态栏的字段布局可作为其他 RP 世界的模板参考。

### B2. 型月文风推荐与禁词表

- **来源条目**: 核心规则:<体系与文风> (1025 chars), 文风推荐 (2766 chars, 型月(1))
- **为什么有用但不通用**: 详细定义了「严禁修仙/泛式西方奇幻/唯心爆种」等约束，以及「内力→魔力」「杀气→杀意」的禁词替换表。这些约束高度绑定型月独有的神秘度体系。
- **保留价值**: 禁词替换表的「规则→替代方案」格式可作为文风机审的参考模板；残酷美学/感官描写的写作指南有通用启发意义。

### B3. Fate 参数化战斗系统

- **来源条目**: 战斗思维链, 输出规则:正文输出 中的 combat_driver, 核心规则:<体系与文风>
- **为什么有用但不通用**: E/D/C/B/A/EX 六阶参数化、对魔力法则、宝具等级/类型判定等都是 Fate 独有的力量体系。但「STRvsCON→破防判定」「AGI差≥2级强制受击」的检定框架可迁移。
- **保留价值**: 作为 `rp-combat` skill 的 Fate 适配插件参考。

### B4. 从者生成规则

- **来源条目**: 从者生成 (2197 chars, FSN文件)
- **为什么有用但不通用**: 定义了基于「英灵殿」的从者随机生成规则（职阶/参数/宝具/真名），是 Fate 独有的角色创建机制。
- **保留价值**: 随机角色生成的字段 schema 设计模式可参考。

### B5. FGO 世界线/特异点体系

- **来源条目**: FGO_总纲领 (2035 chars), FGO_事件控制器, 世界状态变量
- **为什么有用但不通用**: 29 条特异点/Lostbelt 的线性推进结构和 `选择故事线` 变量是 FGO 特有的叙事结构。
- **保留价值**: 作为「分章节多路线叙事」的世界书组织参考。

### B6. 型月核心设定包裹

- **来源条目**: 核心设定:补魔/御主/宝具/职阶/根源/魔术/魔法/令咒/从者/英灵/圣杯/圣杯战争 (12条，每条 111-259 chars), 世界观校验/过滤 (1358 chars)
- **为什么有用但不通用**: 这些是型月世界特有的「强制注入」设定摘要，确保 LLM 在任何对话中都能接触到基础世界观。
- **保留价值**: 「世界观过滤层」的注入策略可作为 pi worldbook 加载策略参考。

---

## Tier C: 已丢弃

| 条目 | 来源文件 | 丢弃原因 |
|------|----------|----------|
| **【sex:起始/结尾】** (8-9 chars) | FSN沙盒 | 空壳标记，无实质内容 |
| **sex:性转_男娘协议** (523 chars) | FSN沙盒 | ST 专用性转规则，非通用 RP |
| **sex:性转_扶他协议** (907 chars) | FSN沙盒 | ST 专用性转规则，非通用 RP |
| **sex:NTL_基础设定** (395 chars) | FSN沙盒 | NTL 框架规则，ST 特有 |
| **sex:NTR_情侣协议** (629 chars) | FSN沙盒 | NTR 框架规则，ST 特有 |
| **sex:NTR_隐奸设定** (933 chars) | FSN沙盒 | NTR 框架规则，ST 特有 |
| **sex:NTR_基础设定** (783 chars) | FSN沙盒 | NTR 框架规则，ST 特有 |
| **sex:小马_体型差逻辑协议** (1592 chars) | FSN沙盒 | 异种体型规则，极度 ST 特定 |
| **sex:足控_足交体位** (606 chars) | FSN沙盒 | ST 特化规则 |
| **sex:足控_气味世界** (411 chars) | FSN沙盒 | ST 特化规则 |
| **好感度规则** (FSN文件, 362 chars) | FSN | 简单数值公式「每次+1~5，超80只增不减」，过于机械；NPC 思维链中的好感-信任双轴模型已覆盖并超越此规则 |
| **好感度规则 (FGO版, NPC思维链内)** | FGO | 更复杂的区间映射已内化在 NPC 思维链中，独立规则条目冗余 |
| **【输出规则:起始/结尾】** (0 chars) | FSN沙盒 | 空壳标记 |
| **【核心规则:起始/结尾】** (13-14 chars) | FSN沙盒 | 空壳标记 |
| **【角色:起始/结尾】** (17-18 chars) | FSN沙盒 | 章节分隔标记，无规则内容 |
| **【英灵:起始/结尾】** (18-19 chars) | FSN沙盒 | 章节分隔标记，无规则内容 |
| **【核心设定:起始/结尾】** (14-15 chars) | FSN沙盒 | 章节分隔标记，无规则内容 |
| **【地点:起始/结尾】** (8 chars) | FSN沙盒 | 章节分隔标记，无规则内容 |
| **【人物志:起始/结尾】** (0 chars) | FGO | 空壳标记 |
| **【世界观设定:起始/结尾】** (0 chars) | FGO | 空壳标记 |
| **【MVU变量:起始/结束】** (0 chars) | FSN沙盒 | 空壳标记 |
| **【记忆相关:起始/结尾】** (0 chars) | FSN沙盒 | 空壳标记 |
| **dreammini 数值思考** (66 chars) | FSN沙盒 | 特定 COT 工具指令，非通用 |
| **世界书排列规则** (0 chars, blank) | FSN沙盒 | 无内容 |
| **独立思维链提取** (43 chars) | FGO | 仅一行标记 "<cot_extract>"，无实质规则 |
| **核心规则:<系统核心说明书>** (36 chars) | FSN沙盒 | 仅一行引用，无规则内容 |
| **{{user}} 条目** | 伊莉雅文件 | ST 模板占位符，空规则 |
| **立绘** (91 chars) | 伊莉雅文件 | UI 配置，非引擎规则 |
| **补充设定<1>/<2>** (249/202 chars) | FSN文件 | 零散配置片段，已被主规则覆盖 |
| **核心规则:<金钱>** (252 chars) | FSN沙盒 | 日元经济规则，世界特定 |
| **核心规则:<交流符号说明>** (92 chars) | FSN沙盒 | 提示词格式符号，ST 特定 |
| **地点及人物** (828 chars) | 伊莉雅文件 | 内容为角色引用格式，非引擎规则 |
| **实力** (3291 chars) | 伊莉雅文件 | 角色战力排名表，属世界 lore 非引擎规则 |
| **战斗规则** (492 chars) | 伊莉雅文件 | 魔法少女伊莉雅特定战斗规则，已被 FSN 战斗系统覆盖 |
| **魔性的跳高** (920 chars) | 伊莉雅文件 | 角色梗，非引擎规则 |
| **命运/零时间轴** (fatezero.worldbook.json) | FZ | 纯叙事性时间线，属 plot 域 |
| **FateStayNight 世界线条目组** (6条×多次重复) | 型月(1) | 平行世界线介绍，属 lore 非引擎 |

---

## 建议

### 对 rp-engine skill 的改进建议

1. **实现流水线协议抽象** (`PipelineProtocol`)
   - 基于 A1 的五步流水线模式，允许世界模板定义步骤顺序、标签容器名、分支触发条件
   - 默认提供「StoryDriver→CombatDriver/NPCDriver→BodyText→Summary→WLog」的标准流水线
   - 与 pi 的 context_tag 系统集成，每步输出自动 tag 为 checkpoint

2. **实现分布式思维链框架** (`ThinkingChain`)
   - 基于 A2 的多域思维链架构，每个 `ThinkingChain` 定义：{domain, triggerCondition, steps, outputTag}
   - 内置标准链：`combat`（对抗演算）、`social`（NPC 心理）、`subplot`（暗线推演）
   - 世界模板可注册自定义链

3. **实现 MVU 状态管理器** (`StateManager`)
   - 基于 A3 的 JSON Patch 变量系统
   - 支持 schema 定义 → 初始化 → 每轮 diff → PATCH 应用 的完整生命周期
   - 与 memory 系统集成：每轮 `<wlog>` 归档为结构化状态 snapshot

4. **实现概率事件引擎** (`ProbabilityEngine`)
   - 基于 A4 的累积概率+独裁阈值机制
   - 支持事件池动态生成、多因素概率计算、熵增优先

### 对 rp-combat skill 的改进建议

1. **参数化检定框架** — 基于 combat_driver 的 4-Step 对抗演算：AGI→STRvsCON→Magic/NP→LUCK
2. **等级差阈值** — 2级差强制受击的机制可作为「绝望差距」的通用制式
3. **对魔/对神秘法则** — 可泛化为 `magicResistance` 属性，适用于任何魔法 RP 世界

### 对主 agent 状态管理的改进建议

1. **动态世界书路由** — 将 A5 的 EJS 控制器模式改造为 pi 的 worldbook 加载策略：`{watchVariable, routeTable}`
2. **世界观校验层** — 将 B6 的 12 条核心设定注入模式抽象为 `WorldSanityCheck` — 始终在上下文中注入「世界基则摘要」，防止 LLM 漂移
3. **文风禁词表** — 将 B2 的「禁词→替代」格式作为 world template 的可选 `styleGuard` 字段

---

## 统计

| 层级 | 数量 | 说明 |
|------|------|------|
| Tier A (可迁移) | 5 个模式 | 流水线协议、分布式思维链、MVU状态管理、概率事件引擎、动态路由 |
| Tier B (型月参考) | 6 组 | 状态栏模板、文风禁词、Fate战斗系统、从者生成、特异点体系、核心设定包裹 |
| Tier C (已丢弃) | 34 个条目 | 空壳标记、sex协议、冗余规则、UI配置、世界特定碎片 |
| **合计** | **45** (含条目组) | 原始 71 条目中 34 个被判定为 Tier C |

---

**评审完成时间**: 2026-06-26 | **评审人**: step-2f-engine-review agent