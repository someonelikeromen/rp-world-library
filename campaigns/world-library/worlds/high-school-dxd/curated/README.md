# 恶魔高校 DxD (High School DxD) — Curated

## 归档状态

- **归档日期**: 2026-06-27
- **方式**: 直接手工整理（agent_team 并行因模型 timeout 不适用）
- **源数据**: 2 raw worldbook JSON，442 条目，~4.5MB
- **基线完整度**: ✅ 7/7 基线

## 产物清单

| 文件 | 说明 |
|------|------|
| `world.json` | 世界框架（rp-world-v1），含 powerSystems(5)/factions(12+)/rules(5)/locations(8)/events/timelines |
| `characters-index.json` | 40角色清单，含别名、阵营、能力、关系、来源 |
| `source-registry.json` | 2源文件索引 |
| `relationship-graph.json` | 角色/势力关系节点和边 |
| `knowledge-graph.json` | 世界观概念节点和知识边 |
| `curation-notes.md` | 归档笔记/冲突/未解决 |
| `engine-review-analysis.md` | 引擎规则评审（Tier A/B/C），10个系统条目分析 |
| `style-constraints.md` | DxD文风约束：后宫喜剧基调、角色语气、术语保留 |
| `world-rules/combat-framework-mapping.md` | DxD本地战力→N0-N24通用框架完整映射 |
| `stories/` | 35卷剧情章节 + index.json，渐进式加载 |
| `style-constraints.md` | DxD文风约束：后宫喜剧基调、角色语气、术语保留 |
| `stories/` | 35卷剧情章节 + index.json，渐进式加载 |

## 世界观概要

现代日本×超自然战斗×后宫喜剧。舞台以驹王镇（Kuoh Town）为中心，延伸至冥界（Underworld）、天界（Heaven）、次元间隙（Dimensional Gap）及北欧/希腊/日本诸神界。

核心设定：神已死于三大势力战争，天使、堕天使、恶魔三方停战维持脆弱和平。恶魔通过"恶魔棋子（Evil Pieces）"系统将其他种族转生为眷属，参加"排名游戏（Rating Game）"争夺地位。人类中极少数拥有"神器（Sacred Gear）"——由圣经之神创造、寄宿于灵魂中的特殊能力，其中13种"神灭具（Longinus）"拥有弑神之力。

## 来源范围

- `dxd_card.worldbook.json`（379条目）：SillyTavern 角色卡世界书，含角色档案、剧情卷章、地点、系统、物品
- `恶魔高校.worldbook.json`（63条目）：独立世界书，含角色档案、玩法系统、地点、物品、文风

## 未解决问题

1. **源数据冲突**: 两本世界书有少量角色信息重叠但细节不同，以 dxd_card 为主
2. **{{user}}槽位**: 恶魔高校.worldbook.json 含 RP 模板占位符，整理时已去槽化
3. **33条空条目**: dxd_card 含33条无comment/content的空条目，已跳过
4. **后期卷章覆盖不足**: 源数据剧情覆盖至22卷+DX短篇，23卷以后的世界扩展（EXE、Evie等）未包含
5. **多神话体系交叉**: 希腊/北欧/印度/日本/凯尔特/波斯等多神系交汇，层级化战力体系映射为初步估算

## 世界特色

- **恶魔棋子系统**: 独特的转生/阶级体系，Queen/Rook/Knight/Bishop/Pawn各有定位
- **神器/神灭具**: 13种Longinus各具弑神级能力，是战力核心
- **排名游戏**: 恶魔社会的核心竞技/政治制度
- **多神系共存**: 圣经三势力+北欧+希腊+印度+日本+凯尔特+波斯等多个神话体系和平共处
- **乳龙帝**: 系列标志性搞笑元素，主角兵藤一诚通过「乳语」翻译等能力成为独特英雄
- **NSFW态度**: DxD原文含后宫/擦边/性喜剧内容，属于世界观核心特征，归档不做剥离。RP使用时按 rp-nsfw.md 规则管理。
