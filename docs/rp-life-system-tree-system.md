# RP Life System Tree · 使用说明

生命系统树是主角专属科技 UI 网状能力成长系统。完整架构见 `docs/rp-life-system-tree-plan.md`，正式规则见 `rules/rp-life-system-tree-system.md`。

## 概要

- 双图：共享图 `data/rp-life-system-tree/global-graph.json` + 当前故事图 `progression/life-system-tree.json`。
- 显示：只显示主角综合评级 +1，不显示隐藏轮廓或 `???`。
- 节点：必须是真实能力/状态，必须标注来源世界观，禁止原创。
- 基点：只能是能力基点，不允许导航基点。
- 货币：使用 `1级奖励点`、`2级奖励点`、`3级奖励点`，允许扩展。
- 定价：沿用兑换系统；起点完整价，升级差价。
- 获取：货币点亮、自学/修行自然达成、剧情事件解锁、混合折扣。

## 科技 UI 显示

允许显示：

- 已拥有基础。
- 已点亮能力基点。
- 已展开能力网。
- 可点亮节点。
- 可修行节点。
- 奖励点余额。

禁止显示：

- 隐藏节点轮廓。
- 未搜索节点。
- 超出综合评级 +1 的节点。
- 导航/分类/文件夹节点。
- 无来源或未审核节点。

## 搜索

用户可主动搜索：

```text
搜索恢复类节点
搜索当前世界可学技能
搜索 N3 能力基点
搜索灵魂类能力
```

若共享图没有结果，可在来源审核后动态写入共享图。非归档世界必须双来源验证。

## `life_tree_edit` 计划 actions

写入类 action 默认只返回成功/失败和最小必要信息；如需层级摘要传 `outputMode: "tree"`，如需完整结果传 `outputMode: "full"`。

| Action | 用途 |
|---|---|
| `init` | 初始化生命系统树状态 |
| `status` | 显示科技 UI 允许内容 |
| `graph` | 返回当前故事可见图 |
| `search` | 主动搜索节点 |
| `generate-node` | 审核后动态写入共享图 |
| `audit-source` | 记录来源审核 |
| `validate-node` | 校验节点 |
| `quote-node` | 计算是否可点亮/升级 |
| `unlock` | 点亮节点 |
| `upgrade` | 升级节点 |
| `self-achieve` | 记录剧情训练/修行自然达成节点 |
| `grant-points` | 发放奖励点 |
| `validate` | 校验状态与共享图 |

## 注意

`life_tree_edit` 只维护生命系统树账本和共享图。具体能力、资源、抗性、属性、生命形态、知识和世界适配状态仍需用 `card_edit` 写入对应角色卡模块，并更新 `memory/world-history.md`。生命树相关状态修改优先使用 `life_tree_edit`，不要先手改状态文件。