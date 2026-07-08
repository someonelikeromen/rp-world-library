# RP Dice

项目随机判定系统。核心使用项目级独立包 `packages/rp-random/`，默认采用 WoD 风格 d10 骰池。用于跑团判定、安科表、安价候选辅助、NPC 反应、遭遇、调查、战斗变数。

## 触发条件

- 用户要求“掷骰”“骰子”“检定”“跑团”“安科”“安价”。
- 当前行动需要风险裁定、对抗、随机遭遇、NPC 反应或事件强度。
- 战斗、调查、潜入、追踪、交涉、仪式等需要透明判定。

## 默认骰池规则

- 骰子：d10 骰池。
- 成功阈值：固定 `8+`。
- 加骰：默认 `10-again`。
- 能力强化：可改为 `9-again` / `8-again`，最低只到 `8-again`。
- 难度：使用 `DC`，成功数达到 DC 即成功。
- 结果：成功 / 失败 / 大失败。
- 大失败：最终总成功数为 0。
- `1` 默认不抵消成功。
- 骰子明细默认公开。
- seed：即时秒级时间 + 内部随机盐；不接受用户指定，不提供复现。

## CLI 用法

```bash
node packages/rp-random/bin/rp-random.js pool --pool 7 --dc 3
node packages/rp-random/bin/rp-random.js pool --pool 7 --dc 3 --again 8
node packages/rp-random/bin/rp-random.js contest --actor-pool 6 --opponent-pool 4
node packages/rp-random/bin/rp-random.js table data/rp-tables/npc-reactions.json
node packages/rp-random/bin/rp-random.js anka data/rp-tables/encounter-intensity.json
```

## 判定流程

1. 明确行动目标和失败代价。
2. 检查角色知识、能力、资源、感知、心理、动机、关系和世界规则。
3. 构成骰池：属性 + 技能 + 能力/装备/准备/环境修正 - 伤势/压力/干扰。
4. 设定 DC。
5. 掷骰并公开结果。
6. 将成功 / 失败 / 大失败落地到叙事与状态。
7. 重要变化写入角色卡模块或 memory。

## 原则

- 不伪造、不重掷不理想结果。
- 骰子不能突破角色能力、资源、感知和世界规则。
- 大失败不能凭空制造 OOC；后果必须从当前局势自然推出。
- 安科/安价结果仍需通过角色内生推演和 OOC 检查。
