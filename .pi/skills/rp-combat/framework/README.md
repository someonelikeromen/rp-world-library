# 多世界战斗框架 — 渐进式加载索引

> 本目录是多世界战斗框架的 skill 内部渐进式加载资产。正文从 `docs/world-combat-framework.md` 无损切分而来；模块正文保留对应原文，不摘要、不精简、不改写。

## 母版

- `docs/world-combat-framework.md`：完整原文母版，保留不动。

## 加载规则

1. 先读取本索引。
2. 只读取当前任务需要的模块。
3. 涉及任何 N 级评估时，必须先读取 `02-rating/02-evaluation-method.md`，再读取 `02-rating/03-rating-system.md`；不得只读取 N0–N24 等级表后直接定级。
4. 需要完整框架时，读取母版，或按下表顺序读取所有模块。
5. 修改框架正文时，应同步维护母版与对应模块，避免分叉。

## 模块映射

| 原章节 | 原章节标题 | 模块路径 |
|---|---|---|
| 开头 | 原始标题与核心定位 | `00-core-positioning.md` |
| 1 | 世界数据框架 | `01-world-data/01-world-data-framework.md` |
| 2 | 通用战力评级体系（旧路径兼容入口） | `02-rating/02-universal-rating-system.md` |
| 2A | 多世界评价方式 / 评估方法 | `02-rating/02-evaluation-method.md` |
| 2B | 通用评级体系 / N0–N24 等级表 | `02-rating/03-rating-system.md` |
| 3 | 基础属性框架 | `03-combatant/03-attributes-framework.md` |
| 4 | 能力框架 | `04-abilities/04-ability-framework.md` |
| 5 | 跨世界能力适配规划 | `04-abilities/05-cross-world-adaptation.md` |
| 6 | 固定最小战斗判定流程 | `05-resolution/06-combat-resolution-flow.md` |
| 7 | 状态持久化框架 | `05-resolution/07-persistence-framework.md` |
| 8 | 速度体系 | `03-combatant/08-speed-system.md` |
| 9 | 资源与续航系统 | `03-combatant/09-resource-endurance.md` |
| 10 | 生命等级与死亡机制 | `03-combatant/10-life-death-system.md` |
| 11 | 能力与抗性碰撞规则 | `04-abilities/11-ability-resistance-collision.md` |
| 12 | 环境与场地优势 | `05-resolution/12-environment-field-advantage.md` |
| 13 | 证据等级 | `02-rating/13-evidence-levels.md` |
| 14 | 状态记录标准 | `03-combatant/14-state-recording-standard.md` |
| 15 | 待继续细化 | `99-todo/15-todo-refinement.md` |
