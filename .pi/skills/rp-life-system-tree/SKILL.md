# RP Life System Tree

主角专属“生命系统树”外挂。科技 UI 风格，用奖励点点亮或通过剧情学习/修行自然达成真实能力节点；所有节点必须标注来源世界观并按多世界评价方式评估。

## 触发条件

- 用户启用生命系统树。
- 用户查看生命系统树面板。
- 用户搜索节点、能力基点或某世界能力。
- 用户点亮、升级或通过学习/修行达成节点。
- 剧情因战胜强敌、世界影响、剧情偏转发放奖励点。

## 核心规则

- 只给主角，不给 NPC。
- 默认关闭，必须由用户明确启用。
- 科技 UI；系统本体不主动战斗、防御、治疗、传送、预警或替主角选择。
- 与兑换系统默认互斥启用；理论上两者不会同时启动。
- 使用 `1级奖励点`、`2级奖励点`、`3级奖励点`，后续允许扩展更高等级奖励点。
- 发点来源只允许：战胜强敌、对世界造成影响程度、剧情偏转程度。
- 禁止通过金钱、出售、资源转换、献祭、普通任务、日常训练、重复劳动刷点。

## 双图架构

- 共享图：`data/rp-life-system-tree/global-graph.json`，所有对话/故事共用，只收录已审核真实能力节点。
- 当前故事图：`card/<protagonist>/progression/life-system-tree.json`，记录当前主角显现、可点亮、已点亮、自学达成、余额与交易。

共享图可随主动搜索动态增长：搜索 → 归档/联网审核 → 多世界评价 → 写入共享图。

## 显示规则

- 只显示主角当前综合评级 +1 的内容。
- 不显示隐藏节点轮廓，不显示 `???`，不显示未搜索基点/树。
- 不显示导航入口、分类入口、空节点、GM-only 信息、原著未来情报或 NPC 秘密。
- 除已点亮能力基点展开出的树外，其他能力基点和树都需要用户主动搜索。

## 能力基点规则

- 基点必须是能力基点：真实能力、体质、特性、技艺、能量基盘、生命变化或基础状态。
- 基点必须有实际效果、来源世界观、多世界评价记录和落盘目标。
- 禁止导航基点、分类节点、文件夹节点、空节点。
- 系统内部可以有索引，但不可展示给用户、不可点亮、不可入剧情。

## 来源世界观规则

每个节点必须有 `sourceWorld`：

```json
{
  "worldId": "",
  "worldName": "",
  "sourceType": "protagonist_baseline | canon_source | archived_world_source | verified_external_source | in_story_training | story_event_awakened | hybrid_training_currency",
  "status": "baseline | archived | unarchived | story-confirmed",
  "refs": [],
  "webSources": [],
  "verificationStatus": "verified | pending | blocked | inherent | story-confirmed"
}
```

- 基础节点也必须标注来源世界观或基线世界。
- 自学节点必须标注学习发生的世界，并有 memory 证据。
- 原著能力节点必须标注原作品世界。
- 非归档世界必须至少双来源验证。
- 禁止 `sourceType: original` 或来源不明节点。

## 节点获取方式

支持：

- `inherent`：主角本来就有，如人类身体、人类灵魂。
- `currency`：消耗奖励点点亮。
- `selfTraining`：通过学习、训练、修行、实践自然达成。
- `storyAchievement`：剧情重大事件自然解锁。
- `hybrid`：训练进度 + 奖励点折扣补足。
- `sourceAcquisition`：通过传承、教学、道具、契约等获得。

折扣必须有剧情证据；完全自然达成可 0 成本。

## 定价规则

- 定价沿用兑换系统价格表。
- 起点 / 初始解锁：节点自身 N 级完整价格。
- 升级：目标 N 级完整价格 - 当前阶段 N 级完整价格。
- 折扣：最终价格 = 原价 × (1 - 折扣率)，且折扣必须有 evidenceRef。

## 搜索来源池

`data/rp-life-system-tree/sources/` 包含曙光表&口述表的合并兑换数据(12,632项)，作为搜索时的关联信息来源：

- **不直接作为节点**：不预载入 global-graph.json，不批量转换为节点
- **关联搜索**：用户搜索能力/血统/武器/道具/技能/功法/改造/物品时，自动匹配来源池中的条目
- **候选来源卡**：搜索命中后只返回候选资料，不显示为可点亮节点
- **证据包流程**：用户选定候选后，按 `conversion-convention.md` 整理 Evidence Bundle，再由 LLM 综合审核
- **综合判定要素**：源表定价作为价格先验；描述文本效果提取；战力参考表锚定验证；论战换算表校验；树结构推断；多表冲突处理
- **N级估价**：支线等级/积分只给 `pricingPriorN`，最终 N 级必须由描述、战力参考与多世界评价综合确定
- **前置关系**：条目的 prereq 字段只作为父子边候选证据，不自动建边

## 多世界评价必读

节点评价必须先读取：

- `.pi/skills/rp-combat/framework/02-rating/02-evaluation-method.md`
- `.pi/skills/rp-combat/framework/02-rating/03-rating-system.md`

节点必须包含 `evaluationMethod: "multi-world-evaluation-method-v1"` 和 `ratingSystem: "multi-world-rating-system-n0-n24-v1"`。

## 落盘模块

- `progression/life-system-tree.json`：生命系统树状态、余额、交易、搜索、审核。
- `combat/life-profile.json`：生命基础、体质、生命形态。
- `combat/attributes.json`：属性增强。
- `combat/resources.json`：资源池。
- `combat/abilities.json`：能力和技能。
- `combat/resistances.json`：抗性。
- `combat/combat-rating.json` 与 `combat/combat-log.json`：评级变化。
- `knowledge/knowledge.json`：知识/技术类节点。
- `combat/world-adaptation.json`：必要世界适配状态记录；世界适配不做网状。
- `memory/world-history.md`：来源世界、获得方式、长期后果。

## 读取规则

- 计划文档：`docs/rp-life-system-tree-plan.md`
- 正式规则：`rules/rp-life-system-tree-system.md`
- 使用说明：`docs/rp-life-system-tree-system.md`
- 数据目录：`data/rp-life-system-tree/`
  - `sources/` — 信息来源池。曙光表&口述表合并兑换数据(12,632项)，VB↔曙光↔N级映射。不作为直接节点；按 `conversion-convention.md` 走“搜索→候选来源卡→证据包→LLM审核→节点草案”流程。
- 逻辑包：`packages/rp-life-system-tree/`
