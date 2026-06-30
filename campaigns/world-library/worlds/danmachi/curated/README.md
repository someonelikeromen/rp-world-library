# DanMachi / 地错 curated 世界资料

本目录由 `archive-danmachi` 归档生成，面向 pi-rp 使用。内容从本地 SillyTavern/worldbook 导入源整理，不追求穷尽正史，优先保留 RP 可用的核心设定、角色、系统与关系。

## 文件

- `world.json`：世界基准设定；覆盖欧拉丽、地下城、神之恩惠、眷族制度、等级与能力值、魔法技能、经济与公会、时间线事件。
- `source-registry.json`：4 个原始世界书来源登记与 entry 数。
- `characters-index.json`：主要角色索引，含贝尔、赫斯缇雅、艾丝、莉莉、韦尔夫、命、春姬、琉、芙蕾雅、洛基、芬恩等 20+ 人。
- `knowledge-graph.json`：核心系统、地点、组织和威胁的知识图谱。
- `relationship-graph.json`：主要人物/组织关系图谱。
- `curation-notes.md`：整理原则、证据等级、风险和验证状态。
- `stories/original-toc-index.json`：地下城系列外部目录源的统一卷章索引；只含目录/链接/元数据，不含正文。
- `stories/original-toc-summary.md`：原著目录索引摘要，便于快速查看系列、卷/分组和章节数量。
- `danmachi-archive-iteration-report.md`：本轮外部目录源入库、归档对比与后续迭代任务。
- `../sources/wenku8/`：Wenku8 目录源结构化索引工作区，保存 5 个系列目录 JSON 与总索引。

## 来源概览

总计 4 个 worldbook，874 条 entries：

1. `campaigns/world-library/imports/worldviews/danmachi/worldbooks/dxcxh_card.worldbook.json` — 447 entries。
2. `campaigns/world-library/imports/worldviews/danmachi/worldbooks/在地下城寻求邂逅是否搞错了什么V1.03.worldbook.json` — 98 entries。
3. `campaigns/world-library/imports/worldviews/danmachi/worldbooks/地下城.worldbook.json` — 56 entries。
4. `campaigns/world-library/imports/worldviews/danmachi/worldbooks/地错时间轴RE (至5.1).worldbook.json` — 273 entries。

外部目录源（仅目录/元数据，未保存正文）5 个，728 个章节/条目：

1. `campaigns/world-library/worlds/danmachi/sources/wenku8/danmachi-main.toc.json` — 本篇目录，397 条。
2. `campaigns/world-library/worlds/danmachi/sources/wenku8/sword-oratoria.toc.json` — 《剑姬神圣谭》目录，203 条。
3. `campaigns/world-library/worlds/danmachi/sources/wenku8/familia-chronicle.toc.json` — 《眷族编年史》目录，35 条。
4. `campaigns/world-library/worlds/danmachi/sources/wenku8/argonaut.toc.json` — 《阿尔戈 英雄谭》目录，32 条。
5. `campaigns/world-library/worlds/danmachi/sources/wenku8/astraea-record.toc.json` — 《阿斯特莉亚回忆录 英雄谭》目录，61 条。

## RP 快速入口

- **新人冒险**：公会登记 → 埃伊娜提示 → 上层地下城 → 魔石兑换 → 恩惠更新。
- **眷族日常**：灶火之馆、债务、装备维修、远征准备、队伍分工。
- **都市政治**：洛基眷族与芙蕾雅眷族制衡，赫斯缇雅眷族快速崛起，公会调停。
- **地下城危机**：异常种、楼层主、毁灭者、深层远征、新种腐蚀怪、撤退路线。
- **秘密线**：异端儿、暗派阀残影、希儿/芙蕾雅身份、独眼黑龙宿命。

## 使用注意

- 译名已合并：赫斯缇雅/赫斯提亚、韦尔夫·克罗佐/克洛佐、格瑞斯/加雷斯、芬恩·迪姆那/蒂姆那等。
- 原始条目跨时间点，角色等级会变化；开局前应锁定时间线。
- `dxcxh_card` 混有系统提示和RP流程，本次只取世界事实，不继承强制输出格式。
