# RP Optional Play Modes · 跑团 / 安科 / 安价使用说明

本项目支持可选玩法层：跑团、安科、安价、骰池。它们可以嵌入 Actor / Director 模式。

## 快速命令

```bash
node packages/rp-random/bin/rp-random.js pool --pool 7 --dc 3
node packages/rp-random/bin/rp-random.js pool --pool 7 --dc 3 --again 8
node packages/rp-random/bin/rp-random.js table data/rp-tables/npc-reactions.json
node packages/rp-random/bin/rp-random.js anka data/rp-tables/encounter-intensity.json
```

## 跑团判定

默认使用 WoD 风格 d10 骰池：

- 8+ 成功。
- 默认 10-again。
- 能力可强化为 9-again / 8-again。
- 成功数达到 DC 即成功。
- 成功数为 0 是大失败。
- 默认公开骰子明细。

## 安科

安科用于随机表。常用表在 `data/rp-tables/`。

骰出结果后必须过角色合理性、感知边界、OOC 和世界规则检查。

## 安价

安价候选不是裁决。候选可被标记为：

- 合格。
- 部分合格。
- 高风险。
- 重大不可逆。
- 不合格。

不合格候选不能硬执行；可以转译成角色更可能采取的行为。
