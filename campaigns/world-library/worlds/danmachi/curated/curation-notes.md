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

## 2026-06-30 外部目录源迭代

新增登记 5 个 Wenku8 外部目录源，作为“卷章目录/元数据”对照，不保存小说正文：

- 本篇：`sources/wenku8/danmachi-main.toc.json`，397 条目录项。
- 剑姬神圣谭：`sources/wenku8/sword-oratoria.toc.json`，203 条目录项。
- 眷族编年史：`sources/wenku8/familia-chronicle.toc.json`，35 条目录项。
- 阿尔戈英雄谭：`sources/wenku8/argonaut.toc.json`，32 条目录项。
- 阿斯特莉亚回忆录英雄谭：`sources/wenku8/astraea-record.toc.json`，61 条目录项。

新增产物：

- `stories/original-toc-index.json`：统一原著目录索引。
- `stories/original-toc-summary.md`：目录摘要。
- `danmachi-archive-iteration-report.md`：外部目录源入库、归档对比与后续迭代任务。

对比结论：当前 `curated/stories/` 已有 timeline、战斗体系、事件提醒、黄金城赌场篇等 RP 资料，但并非按本篇/外传/英雄谭完整卷章重建；后续应先做目录标准化与摘要层补齐，再把关键事件、角色、地点挂接到图谱。

## 验证状态

- 已创建/覆盖 7 个要求文件。
- 2026-06-30：新增外部目录源索引、统一目录索引与迭代报告；JSON 结构已通过本地脚本读取/写入。
- 所有正文向世界书归档的写入仍位于 `campaigns/world-library/worlds/danmachi/curated/`；外部目录源索引位于 `campaigns/world-library/worlds/danmachi/sources/wenku8/`。
