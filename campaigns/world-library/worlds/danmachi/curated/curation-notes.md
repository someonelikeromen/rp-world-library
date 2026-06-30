# DanMachi curated 归档说明

## 整理范围

- 目标世界：`danmachi` / 地错 / 在地下城寻求邂逅是否搞错了什么。
- 输出目录：`campaigns/world-library/worlds/danmachi/curated/`。
- 读取来源：`campaigns/world-library/imports/worldviews/danmachi/README.md` 与 `worldbooks/*.json`。
- 产物：7 个 baseline 文件，全部在 mutation scope 内。

## 证据等级

- **A**：本地源文件中有直接条目或明确表述。
- **B**：由多个源条目、同一条目上下文或常识性作品知识归纳，未逐字展开。
- **C**：源内不完整、版本/时间点冲突，或仅为 RP 使用提示；在 notes 中标明。

## 主要取舍

1. **保持紧凑**：未尝试复写 874 条 entries，只抽取可供 RP 调用的核心世界设定、角色、组织、关系和时间线高亮。
2. **不继承强制流程**：`dxcxh_card.worldbook.json` 中含大量 COT、状态栏、变量和面板输出规则；这些属于旧 RP 运行提示，不作为世界设定写入。
3. **时间点不强锁**：世界书混合主线、外传和不同卷数，角色等级/称号可能随剧情进展变化。`characters-index.json` 使用 `levelRange` 或 notes 处理差异。
4. **译名合并**：保留常见中文译名变体，避免 RP 检索失败，例如赫斯缇雅/赫斯提亚、韦尔夫·克罗佐/克洛佐、格瑞斯/加雷斯、芬恩·迪姆那/蒂姆那。
5. **时间线只做高亮**：`地错时间轴RE (至5.1)` 有 273 entries；本次只纳入古代/暗派阀/贝尔成长/异端儿/芙蕾雅与神历1016年3月25日洛基远征危机等 RP 价值高的节点。

## 覆盖检查

- 欧拉丽：`world.json.locations.orario`、`knowledge-graph.json`。
- 地下城：`world.json.locations.dungeon`，含上/中/下/深层与特殊怪物。
- 神之恩惠：`world.json.falnaAndGrowth`。
- 眷族制度：`world.json.divinityAndFamiliaSystem`、`majorFamilias`。
- 等级与能力值：`world.json.falnaAndGrowth.basicAbilities` 与 `abilityRanks`。
- 魔法技能：`world.json.falnaAndGrowth.skills/magic`，角色索引中也保留关键能力。
- 经济与公会：`world.json.economyAndGuild`。
- 时间线事件：`world.json.timelineHighlights`。
- 主要角色：`characters-index.json` 覆盖 20+ 人；含用户明确点名的贝尔、赫斯缇雅、艾丝、莉莉、韦尔夫、命、春姬、琉、芙蕾雅、洛基、芬恩等。
- 来源登记：`source-registry.json` 指向 4 个原始文件并记录 entry 数：447、98、56、273，总计 874。

## 风险与待复核

- **等级冲突**：源中同一角色可能出现不同等级，如艾丝 Lv.5/Lv.6、芬恩 Lv.6/Lv.7、贝尔 Lv.4/Lv.5，需根据 RP 时间点选择。
- **剧透风险**：希儿/芙蕾雅/海伦身份线、异端儿、暗派阀、芙蕾雅篇均可破坏早期剧情悬念；早期 RP 应将其设为 GM-only。
- **外传混入**：时间轴和人物条目混入《剑姬神圣谭》等外传事件；不是错误，但应在剧情定位中说明。
- **部分细节为常识性归纳**：例如某些角色关系的简化描述为 B 级证据，完整细节需回查源条目或原作。

## 验证状态

- 已创建/覆盖 7 个要求文件。
- JSON 文件按手工检查保持合法语法结构；本环境未提供命令执行工具，未运行 JSON parser 验证。
- 所有写入均位于 `campaigns/world-library/worlds/danmachi/curated/`。
