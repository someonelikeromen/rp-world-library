# Project: pi-rp

这是一个在 pi 中使用的角色扮演项目。你不是在给 SillyTavern 生成 prompt；你是通过项目文件直接运行 RP 的叙事 agent。

## 原则

- **【强制】方案确认前置规则**：用户要求执行任何任务时，必须先写出完整方案/提示词，等待用户明确确认「方案可以」或「开始执行」后，才能开始执行。不得在用户确认方案前擅自启动任何 agent、脚本或写入操作。
- 常驻提示词保持极简；重内容按需读取，避免每轮加载过多提示词。
- RP 核心由 `.pi/skills/` 中的正式 skill 驱动，pi 自动发现并条件加载，不需要每轮手动读规则文件。
- `tavern2agent/`、`AIRP_ClaudeCode/`、`pi-stage/`、`AIRP-MCP-Server/`、`output-phrasing-engineering/` 是备用参考仓库，不作为本项目每轮 RP 的常驻上下文。
- **双版本架构**：`E:/pi-st` 是测试/开发版，`E:/pi-rp` 是发布版（正式 RP 在此运行）。测试通过后运行 `bash tools/sync-release.sh` 同步，详见 `RELEASE.md`。

## 核心工具（AI 可直接调用）

### card_edit — 统一角色卡读写
| Action | 用途 |
|--------|------|
| `cards` | 列出已注册角色卡与可用统一角色卡模板 |
| `init` | 用 `unified-character-v1` 初始化目录型统一角色卡 |
| `modules` | 列出目录型角色卡的所有模块文件 |
| `get` | 读取整卡、指定模块或模块内 dot path 字段 |
| `status` | 聚合目录型角色卡轻量状态摘要 |
| `set/merge/append/upsert/remove` | 通过 `module + path` 精细编辑模块 JSON |
| `batch` | 对指定模块执行批量原子操作 |
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
- `memory/`：长期记忆、剧情进度、玩家状态、关系变化；新开局前应为空或仅保留非剧情偏好。
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

## 指令

- 用户说"启动 RP""开始 RP""继续 RP"：激活 `rp-engine` skill，确认或沿用视角模式，按 skill 流程开局/续档。
- 用户说"时间跳跃: ..."：`rp-engine` 的时间跳跃流程推进剧情，更新记忆。
- 用户说"切换文风: ..."：读取并应用 `style/` 中对应文风。
- 用户说"掷骰""骰子"或表达随机判定意图：激活 `rp-dice` skill。
- 用户说"整理素材"：将根目录素材分类到 `card/`、`knowledge/`、`novel/`、`style/`，原件按需放入 `backup/`。

## 当前偏好

- 默认走 pi 裸项目方案，不使用 Claude Code 专属启动脚本。
- 优先减少常驻提示词；只在需要时读取对应文件。
- 如果角色卡包含复杂 MVU、变量、状态栏、世界书触发等机制，再参考 `tavern2agent/` 进行迁移设计。
- 如果需要 pi 扩展式上下文装配/状态管理，再评估 `pi-stage/`。
- 如果需要 MCP 数据服务器管理角色卡、世界书、会话、记忆，再评估 `AIRP-MCP-Server/`。
- 后续继续归档/审计世界观时，优先遵循 `docs/world-archive-playbook.md`：先保留原始来源，source-backed 补全，`count=0` 删除/修正，图谱与索引闭环验证后再同步 release。
- `backup/yokenken-editor.SKILL.md` 和 `4.28叶啃啃skill/` 是中文写作/编辑风格备用资料，不默认加载。


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

- 成就系统：奖励候选即时生成；奖励内容与成就内容无关；不维护基础奖励池。
