# Project: pi-rp

这是一个在 pi 中使用的角色扮演项目。你不是在给 SillyTavern 生成 prompt；你是通过项目文件直接运行 RP 的叙事 agent。

## 原则

- **【强制】方案确认前置规则**：用户要求执行任何任务时，必须先写出完整方案/提示词，等待用户明确确认「方案可以」或「开始执行」后，才能开始执行。不得在用户确认方案前擅自启动任何 agent、脚本或写入操作。**例外**：用户已明确授权 `Two-Pass Runtime` 长期实现轨道可按 `docs/rp-two-pass-runtime-iteration-plan.md`、`docs/rp-two-pass-runtime-roadmap.md` 和 `taskplane-tasks/two-pass-runtime/` 自行分批迭代直到完成；该轨道内无需每批再次确认方案，但仍必须遵守 Windows 环境规则、只改 `E:/pi-st`、不污染 RP 剧情 memory/card、不直接修改发布版 `E:/pi-rp`，并在高风险动作（真实启用 `--no-skills`、正式 lifecycle 拦截发布、custom message 正式投递、release 同步、删除/迁移核心规则或核心工具改写）前停止并请求用户确认。
- **Windows 环境规则**：当前项目按 Windows 环境处理，不默认假设 Linux/Unix 工具可用。不得依赖 `apply_patch`、here-doc、`sed`、`awk`、`cat > file`、管道拼接等 Linux 写法完成关键操作；读取文件优先用 `read`，精确修改优先用 `edit`，新建或整篇重写优先用 `write`。必须运行脚本或命令时，优先使用 Windows 可用方式或项目已有工具，并说明原因。
- 常驻提示词保持极简；重内容按需读取，避免每轮加载过多提示词。
- RP 核心由 `.pi/skills/` 中的正式 skill 驱动，pi 自动发现并条件加载，不需要每轮手动读规则文件。
- **Two-Pass Runtime 方向**：吸收 `docs/2026-07-27-two-pass-prose-render.md` 时，目标不是继续增加长规则，而是按 `docs/rp-two-pass-runtime-system-plan.md` 转向运行机制：RP Runtime Orchestrator、输入分流、Source Bundle 原文资料包、细分 Pass A/Pass B、A9/B8 最终校验、编辑审稿角色、Direction Packet / Render Packet、硬闸工具、turn-ledger、生命周期拆分、preview widget、custom prose message、渐进式按需 skill/prompt 装配。长期自动迭代按 `docs/rp-two-pass-runtime-iteration-plan.md` 用 roadmap/taskplane/orchestrator 分批推进；当前用户已授权该轨道自行迭代直到完成，不需要每批重复确认，但必须在高风险动作前暂停请求确认。资料读取/查询阶段应找到正确原文并原样传递，不用 LLM 摘要替代事实源；前端面板和选项按钮不是当前重点；preview widget 属于 runtime 安全预览层，需要纳入方案；`--no-skills` 只能在 runtime 已能接管按需加载后再评估，不能直接破坏现有 `.pi/skills/` 架构。
- `tavern2agent/`、`AIRP_ClaudeCode/`、`pi-stage/`、`AIRP-MCP-Server/`、`output-phrasing-engineering/` 是备用参考仓库，不作为本项目每轮 RP 的常驻上下文。
- **双版本架构**：`E:/pi-st` 是测试/开发版，`E:/pi-rp` 是发布版（正式 RP 在此运行）。测试通过后运行 `tools/sync-release.sh` 或等价 Windows 可用方式同步，详见 `RELEASE.md`。

- **多世界长期经历框架**：本项目默认面向多世界长期 RP，不是单世界短篇。主角经历过的所有世界、进入/离开方式、能量体系接触、关键事件、跨世界关系、长期后果都必须持续记录。
- **多世界战斗框架是核心基础设施**：`rp-combat/framework` 与统一角色卡的 `combat/world-adaptation.json` 不只是战斗附属模块；能力、资源、抗性、世界适配、奖励、成就与跨世界结算都必须通过该框架落盘。
- **经历链双写规则**：涉及进入世界、离开世界、回访世界、世界规则适配、获得跨世界能力/奖励、能量体系接触时，必须同时更新 `memory/` 的经历记录与角色卡 `worldAdaptation`/相关模块。不可只写当前剧情摘要。
## 核心工具（AI 可直接调用）

### card_edit — 统一角色卡读写
| Action | 用途 |
|--------|------|
| `cards` | 列出已注册角色卡与可用统一角色卡模板 |
| `init` | 用 `unified-character-v1` 初始化目录型统一角色卡 |
| `modules` | 列出目录型角色卡的所有模块文件 |
| `get` | 读取整卡、指定模块或模块内 dot path 字段 |
| `status` | 聚合目录型角色卡轻量状态摘要 |
| `set/merge/append/upsert/remove` | 通过 `module + path` 精细编辑模块 JSON；默认只返回成功/失败，`outputMode: "tree"` 返回层级摘要，`outputMode: "full"` 返回完整结果 |
| `batch` | 对指定模块执行批量原子操作；默认只返回成功/失败，`outputMode: "tree"/"full"` 控制结果详细度 |
| `validate` | 校验目录型角色卡模块完整性与 JSON 合法性 |
| `register` | 注册兼容旧式外部卡；新建角色优先用 `init` |

**强制规则**：新建角色必须优先使用目录型统一角色卡：`card_edit { action: "init", card, cardPath, template: "unified-character-v1" }`。每次推进剧情后必须用 `card_edit { action: "status" }` 检查状态，并用 `card_edit { action: "batch", module, operations }` 或对应精细 action 同步更新具体模块字段。不可只更新 memory 而漏掉角色卡模块。

### md_edit — Markdown 增量编辑
| Action | 用途 |
|--------|------|
| `get` | 读取整个文件、指定 heading 章节、anchor 行或精确文本块 |
| `insert/append` | 在文件、heading 或 anchor 附近插入/追加内容 |
| `replace/remove` | 替换或删除唯一文本块 / 指定 heading 章节 |
| `upsert-section` | 标题存在则更新正文，不存在则新增章节 |
| `upsert-list-item` | 按 key 新增或更新列表项 |
| `upsert-table-row` | 按 keyColumn + key 新增或更新表格行 |
| `validate` | 检查标题层级、重复标题/锚点、表格格式 |

**使用规则**：维护 `.md` 文档时优先使用 `md_edit` 做增量修改，避免整篇重写。写入默认备份到 `backup/md-edits/`，复杂修改先用 `dryRun: true`。`md_edit` 只负责 Markdown，不替代 `card_edit`、`world_query` 或 `json_tool`。

### world_query — 世界书查询
| Action | 用途 |
|--------|------|
| `worlds` | 列出所有世界观 |
| `overview` | 世界观总览（力量体系/派系/规则/地点/故事） |
| `search` | 关键词搜索，`allWorlds: true` 可跨世界 |
| `get` | 按 ref 精确取条目 |
| `characters` | 角色索引列表/搜索 |
| `stories` | 故事章节索引/内容 |
| **`aggregate`** | **跨文件聚合查询**——输入实体名，返回完整聚合（角色+世界条目+故事+规则+原始） |
| **`graph`** | **关系图谱遍历**——从角色出发，查同派系/同力量体系/故事登场 |

### 编辑/写入后自动同步
- `card_edit` 写入成功后自动运行 `postUpdateHooks`：记录变更日志到 `memory/`，同步状态快照到 `memory/card-status-snapshot.md`
- 无需手动记住同步 memory，钩子自动完成

## 目录

- `.pi/skills/`：正式 pi skill（RP 引擎、世界搜索、战斗、骰子、PNG 提取、图谱、前端、地图、来源摄入）。
- `rules/`：叙事规则（破限、质检、杀八股、防全知、输出格式、多语言、背景NPC、Actor/Director、角色内生推演），维护时优先用 `md_edit` 增量编辑。
- `packages/rp-random/`：项目级跑团/安科/安价随机包，核心为 WoD 风格 d10 骰池。
- `data/rp-tables/`：项目通用安科/事件/反应随机表。
- `card/`：目录型统一角色卡实例；每个角色应是一组模块 JSON 文件。
- `campaigns/`：世界书库（70+ 世界观 JSON）。
- `knowledge/`：世界观、人物关系、地点、事件资料（按需读取）。
- `novel/`：小说原文或文风参考长文本。
- `style/`：文风文件、禁用词、叙事偏好。
- `memory/`：长期记忆、剧情进度、玩家状态、关系变化、所有经历世界与跨世界长期后果；新开局前应为空或仅保留非剧情偏好/模板说明。
- `backup/`：原始素材备份（含 `backup/skill-legacy/`——已迁移的旧 skill 参考）。

### 已移除
- `skill/`：原遗留目录，内容已全部迁移至 `.pi/skills/` 或 `backup/skill-legacy/`。

## Skills（pi 自动发现，条件触发）

| Skill | 触发条件 |
|-------|---------|
| `rp-engine` | 启动/继续 RP、时间跳跃、文风切换、主角生成 |
| `rp-world-search` | 剧情涉及世界观设定、需要查询世界书或 knowledge |
| `rp-combat` | 发生战斗/冲突对抗 |
| `rp-dice` | 需要随机判定、掷骰、检定 |
| `png-card-extractor` | 遇到 SillyTavern PNG/WEBP 角色卡 |
| `world-archive-extraction` | 从小说原文提取结构化世界数据（p1-scan 管线） |
| `rp-curation` | 从 ST worldbook JSON 整理 curated 结构化产物 |
| `rp-source-ingestion` | 即席摄入外部来源（网页/文件/用户修正） |
| `rp-exchange` | 用户启用兑换系统、查看兑换面板、消耗奖励点兑换完整能力/血统/物品/知识/契约 |
| `rp-life-system-tree` | 用户启用生命系统树、查看科技 UI、搜索/点亮/升级节点、通过训练达成节点；生命树修改优先使用 `life_tree_edit`，不要手改状态文件 |
| `rp-sheet-scraper` | 爬取腾讯文档在线表格；用户说"爬取曙光表"或"爬取口述表" |
| `rp-sheet-updater` | 基于更新日志增量更新本地数据；用户说"更新曙光表"或"更新口述表" |

## 指令

- 用户说"启动 RP""开始 RP""继续 RP"：激活 `rp-engine` skill，确认或沿用视角模式，按 skill 流程开局/续档。
- 用户说"时间跳跃: ..."：`rp-engine` 的时间跳跃流程推进剧情，更新记忆。
- 用户说"切换文风: ..."：读取并应用 `style/` 中对应文风。
- 用户说"掷骰""骰子"或表达随机判定意图：激活 `rp-dice` skill。
- 用户说"整理素材"：将根目录素材分类到 `card/`、`knowledge/`、`novel/`、`style/`，原件按需放入 `backup/`。
- 用户说"归档 XX 世界"/"提取 XX 数据"/"p1-scan XX"：激活 `world-archive-extraction` skill，走 Wave 提取→树状合并→图谱构建→归档部署四阶段管线。
- 用户说"整理 XX 世界书"/"curate XX"：激活 `rp-curation` skill，走分类→writer→图谱→整合→校验→修复的 7 步流水线。
- 用户说"记录来源"/"摄入 XX 设定"：激活 `rp-source-ingestion` skill。
- 用户说"启用兑换系统"、"查看兑换面板"、"兑换 XX"：激活 `rp-exchange` skill；按多世界战斗框架定级，只按层级定价；非归档来源必须至少双来源验证；兑换后同步 `progression/exchange.json`、对应角色卡模块与 `memory/world-history.md`。
- 用户说"启用生命系统树"、"查看生命系统树"、"搜索节点"、"点亮节点"、"升级节点"：激活 `rp-life-system-tree` skill；只显示主角综合评级+1范围；节点必须有来源世界观、禁止原创、能力基点不能是导航节点；节点可货币点亮或通过剧情训练/修行达成；落盘到 `progression/life-system-tree.json`、对应角色卡模块与 `memory/world-history.md`。生命树状态修改优先走 `life_tree_edit`，不要先手改文件。
- 用户说"爬取曙光表"：激活 `rp-sheet-scraper` skill；全量爬取 7 个 tab，保存到 `曙光表数据/`。
- 用户说"爬取口述表"：激活 `rp-sheet-scraper` skill；全量爬取 10 个 tab，保存到 `无限口述规则数据/`。
- 用户说"更新曙光表"或"检查曙光表更新"：激活 `rp-sheet-updater` skill；拉取更新日志→diff_updates.py 比对→apply_updates.py 生成指令→逐 sheet 合并。
- 用户说"更新口述表"或"检查口述表更新"：激活 `rp-sheet-updater` skill；同上流程。

## 当前偏好

- 默认走 pi 裸项目方案，不使用 Claude Code 专属启动脚本。
- 优先减少常驻提示词；只在需要时读取对应文件。
- 如果角色卡包含复杂 MVU、变量、状态栏、世界书触发等机制，再参考 `tavern2agent/` 进行迁移设计。
- 如果需要 pi 扩展式上下文装配/状态管理，再评估 `pi-stage/`。
- 如果需要 MCP 数据服务器管理角色卡、世界书、会话、记忆，再评估 `AIRP-MCP-Server/`。
- 世界观归档按以下**优先级决策树**选择方案：
  1. **有 `sources/raw-text/` 小说原文** → 优先走 `world-archive-extraction`（p1-scan 管线：Worker→Auditor→Fixer 闭环，树状合并，图谱构建，归档部署）
  2. **只有 ST worldbook JSON（无原文）** → 走 `rp-curation`（分类→并行 writer→图谱→整合→校验→修复迭代）
  3. **临时补充单一来源** → 走 `rp-source-ingestion`（标注可信度，冲突记录不覆盖）
  - `docs/world-archive-playbook.md` 是经验沉淀手册（source-backed、count=0、常见错误等），不是执行流程；执行流程以 skill 为准。
- `backup/yokenken-editor.SKILL.md` 和 `4.28叶啃啃skill/` 是中文写作/编辑风格备用资料，不默认加载。
- 腾讯文档爬取与增量更新由 `.pi/skills/rp-sheet-scraper/` 和 `.pi/skills/rp-sheet-updater/` 驱动；配置在 `tools/config.json`；工具脚本在 `tools/diff_updates.py` 和 `tools/apply_updates.py`。


### achievement_edit — 成就系统状态工具

| Action | 用途 |
|--------|------|
| `init` | 初始化目录型角色卡的 `progression/achievements.json` |
| `status` | 只返回光屏允许显示的成就状态 |
| `build-rd100` / `roll-world` | 生成/掷骰世界 .rd100 表：已归档每个 3 位，未归档每个 2 位，其余随机动漫/游戏填充 |
| `claim` | 手动领取 pendingClaim 奖励并写入去重集合 |
| `validate` | 校验成就状态、即时奖励候选示例和显示边界 |

**规则**：已归档世界不需要联网核实；未归档世界和随机动漫/游戏世界必须联网核实作品与奖励存在；已有奖励不能重复。

- `packages/rp-achievements/`：成就系统逻辑包（N0–N24 动态奖励范围、.rd100 世界表、去重、领取、校验）。
- `data/rp-achievements/`：成就系统世界池、即时奖励候选示例与 schema。
- `packages/rp-life-system-tree/`：生命系统树逻辑包（节点校验、显示上限、共享图搜索、起点完整价、升级差价、自学/折扣/点亮）。`life_tree_edit` 写入类 action 默认只回最小结果；需要层级摘要用 `outputMode: "tree"`，需要完整结果用 `outputMode: "full"`。
- `data/rp-life-system-tree/`：生命系统树共享图、设置和 schema。`sources/` 子目录含曙光表&口述表合并兑换数据(12,632项)及VB↔曙光↔N级战力映射——作为搜索来源池，非直接节点；按 `conversion-convention.md` 走“搜索→候选来源卡→证据包→LLM审核→节点草案”。

- 成就系统：奖励候选即时生成；奖励内容与成就内容无关；不维护基础奖励池。


### exchange_edit — 兑换系统状态工具

| Action | 用途 |
|--------|------|
| `init` | 初始化/规范化目录型角色卡的 `progression/exchange.json` |
| `status` | 显示兑换面板允许显示的余额、可见兑换项、待兑换、已兑换和来源验证摘要 |
| `evaluate` | 检查兑换项是否包含多世界评价框架估价记录 |
| `price` | 已知 N 层级时查奖励点价格表 |
| `grant-points` | 因重大事件发放奖励点 |
| `normalize-points` | 按 1000:1 进位整理余额 |
| `validate-entry` / `quote` | 校验兑换项、检查估价记录并报价 |
| `add-entry` / `pending` / `complete` | 加入可兑换项、创建待兑换、完成兑换扣款记账 |
| `record-source` / `validate` | 记录双来源验证、校验兑换状态 |

**定价规则**：必须先依据多世界战斗/评价框架估出兑换项自身 N0–N24 层级，再只按层级价格表定价；`price` 只做查表，`quote` 必须检查估价记录。工具只维护兑换账本，具体能力/资源/物品/知识/关系仍需用 `card_edit` 写入对应模块。
### 兑换系统状态规则

- `progression/exchange.json`：记录兑换系统启用状态、奖励点余额、可见兑换项、待兑换、已兑换、交易和来源验证。
- 兑换点命名为 `1级奖励点`、`2级奖励点`、`3级奖励点`……默认 1000:1 进位。
- 高强度兑换仅通过价格区分；价格只由兑换项自身 N0–N24 层级决定，不受主角、当前世界、稀有度、适配度影响。
- 支持：体质/血统、能量基盘、基于基盘的能力、不基于基盘的肉身/灵魂/技艺流派传承、物品道具、非情报类知识、使魔/指定人物召唤/队友契约。
- 禁止：系统类兑换、情报兑换、碎片、残缺版、试用版、弱化版、单招拆分。
- 非归档世界兑换必须联网或外部检索至少双来源验证；来源不足或冲突时不可兑换。
- 若与成就系统联动，成就系统随机奖励流程关闭，成就直接转为奖励点。
