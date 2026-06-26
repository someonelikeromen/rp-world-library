# Project: pi-rp

这是一个在 pi 中使用的角色扮演项目。你不是在给 SillyTavern 生成 prompt；你是通过项目文件直接运行 RP 的叙事 agent。

## 原则

- 常驻提示词保持极简；重内容按需读取，避免每轮加载过多提示词。
- RP 核心由 `.pi/skills/` 中的正式 skill 驱动，pi 自动发现并条件加载，不需要每轮手动读规则文件。
- `tavern2agent/`、`AIRP_ClaudeCode/`、`pi-stage/`、`AIRP-MCP-Server/`、`output-phrasing-engineering/` 是备用参考仓库，不作为本项目每轮 RP 的常驻上下文。

## 目录

- `.pi/skills/`：正式 pi skill（RP 引擎、世界搜索、战斗、骰子、PNG 提取、图谱、前端、地图、来源摄入）。
- `rules/`：叙事规则（破限、质检、杀八股、防全知、输出格式、多语言、背景NPC）。
- `card/`：角色卡、已提取的角色 JSON。
- `campaigns/`：世界书库（70+ 世界观 JSON）。
- `knowledge/`：世界观、人物关系、地点、事件资料（按需读取）。
- `novel/`：小说原文或文风参考长文本。
- `style/`：文风文件、禁用词、叙事偏好。
- `rules/`：叙事规则（破限、质检、杀八股、防全知、输出格式、多语言）。
- `memory/`：长期记忆、剧情进度、玩家状态、关系变化。
- **【强制】每次推进剧情后必须同步更新 `card/linjie.json` 的动态字段**：`age`、`magic.circuits.currentReserve`、`magic.knownSpells[].panelLevel`、`combatRating` 各项 `score`、`resources[].current`、`inventory`、`relationships[].currentRelation`、`currentStatus`。不可只更新 memory 而漏掉 card JSON。
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
- `backup/yokenken-editor.SKILL.md` 和 `4.28叶啃啃skill/` 是中文写作/编辑风格备用资料，不默认加载。
