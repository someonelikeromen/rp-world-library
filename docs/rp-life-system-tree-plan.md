# 生命系统树 · 完整架构与实施计划

> 状态：设计计划文档。本文用于后续实现 `rp-life-system-tree` / `life_tree_edit`，不是运行时日志。
>
> 核心目标：构建一个主角专属、科技 UI 风格、基于多世界评价框架的网状能力成长外挂。节点使用奖励点点亮或通过剧情学习/修行自然达成；所有节点必须标注来源世界观，禁止原创无来源节点。

---

## 1. 名称与定位

### 1.1 正式名称

```text
生命系统树
Life System Tree
```

建议项目内部命名：

```text
rp-life-system-tree
```

建议工具名：

```text
life_tree_edit
```

建议 skill 名：

```text
rp-life-system-tree
```

### 1.2 系统定位

生命系统树是一个主角专属外挂层，和成就系统、兑换系统并列，但理论上与兑换系统不同时启动。

它的职责是：

- 用科技 UI 展示主角已经显现、可点亮、已点亮的能力节点。
- 用网状图记录主角身体、灵魂、技能、体质、抗性、资源、能力等成长。
- 使用 `1级奖励点`、`2级奖励点`、`3级奖励点` 作为货币，后续允许扩展到 `4级奖励点`、`5级奖励点` 等。
- 支持节点通过货币点亮，也支持部分节点通过剧情学习、训练、修行、实战自然达成。
- 将每个节点按多世界评价方式评估，并按 N0–N24 体系定级。
- 将点亮/达成结果同步到角色卡模块和 `memory/world-history.md`。

### 1.3 非目标

生命系统树不是：

- 原创能力生成器。
- 系统代练器。
- 自动战斗/防御/治疗插件。
- 世界适配网。
- 任意展示未来能力的全知面板。
- 与兑换系统同时消耗同一余额的第二商城。

---

## 2. 总体原则

### 2.1 主角专属

```text
owner: protagonist-only
```

生命系统树只给主角，不给 NPC。

### 2.2 默认关闭

```json
{
  "enabled": false
}
```

只有用户明确启用时才初始化和使用。

### 2.3 科技 UI 风格

面板风格是科技 UI，可使用：

- 青蓝色光屏。
- 网格线。
- 数据流。
- 节点脉冲。
- 层级环。
- 扫描、同步、搜索等术语。

### 2.4 不主动干预剧情

生命系统树本体不主动：

- 战斗。
- 防御。
- 治疗。
- 传送。
- 预警。
- 替主角选择节点。
- 替主角规避剧情风险。

只有已经点亮并落盘的节点本身具备相关效果时，才可在剧情中生效。

### 2.5 基于多世界评价框架

任何节点定级必须先读：

```text
.pi/skills/rp-combat/framework/02-rating/02-evaluation-method.md
```

再读：

```text
.pi/skills/rp-combat/framework/02-rating/03-rating-system.md
```

禁止只读 N0–N24 表后直接定级。

### 2.6 每个节点必须标注来源世界观

每个节点都必须有 `sourceWorld` 字段。即使是“人类身体”“人类灵魂”“基础格斗”这种基础节点，也必须标注来源世界观或基线世界。

### 2.7 禁止原创能力节点

生命系统树可以标准化、分层表达、索引、记录，但不能创造原著或剧情中不存在的实际能力节点。

---

## 3. 与现有系统的关系

### 3.1 与兑换系统

生命系统树与兑换系统默认互斥启用。

原因：

- 两者都使用奖励点。
- 两者都涉及外部能力/成长机制。
- 同时启动会造成平衡和账本混乱。

建议规则：

```text
若 progression/exchange.json.enabled === true，启用生命系统树前必须提示用户确认关闭/不使用兑换系统。
若 progression/life-system-tree.json.enabled === true，启用兑换系统前必须提示用户确认关闭/不使用生命系统树。
```

不是底层技术绝对禁止共存，而是默认规则上互斥。

### 3.2 与成就系统

成就系统可独立运行，也可联动生命系统树。

可选联动模式：

```text
成就达成 → 直接发放 1/2/3级奖励点 → 写入 progression/life-system-tree.json → 主角用于点亮生命系统树
```

如果生命系统树启用并选择成就联动，则成就系统不再随机发原著奖励，而是转为奖励点。

### 3.3 与多世界经历链

生命系统树的节点可能改变：

- 主角能力。
- 体质。
- 灵魂性质。
- 技能。
- 抗性。
- 资源池。
- 战斗评级。
- 跨世界长期后果。

因此必须遵守经历链双写规则：

```text
progression/life-system-tree.json
+ 具体角色卡模块
+ memory/world-history.md
```

不可只写面板账本，也不可只写剧情记忆。

---

## 4. 双图架构

生命系统树有两张图：

1. 共享图 / 通用图。
2. 当前故事解锁图。

### 4.1 共享图 / 通用图

建议路径：

```text
data/rp-life-system-tree/global-graph.json
```

共享图是所有对话、所有故事共用的已审核能力节点资料库。

它记录：

- 已审核真实能力节点。
- 节点来源世界观。
- 节点原著/归档/联网来源。
- 节点多世界评价记录。
- 节点价格。
- 节点所在 N 层级。
- 节点之间已确认的真实关系。
- 内部搜索索引。

共享图不要求开局完整。它可以随着用户主动搜索而动态增长。

增长流程：

```text
主动搜索
→ 查共享图
→ 查归档 / 联网
→ 来源审核
→ 多世界评价
→ 标准化为节点
→ 写入共享图
```

### 4.2 当前故事解锁图

建议路径：

```text
card/<protagonist>/progression/life-system-tree.json
```

当前故事图记录当前主角在当前故事中的状态，包括：

- 是否启用。
- 当前余额。
- 当前主角综合评级。
- 当前显示上限。
- 已显现节点。
- 可点亮节点。
- 已点亮节点。
- 已达成自学节点。
- 已点亮能力基点。
- 当前节点等级。
- 当前故事可见边。
- 搜索记录。
- 审核记录。
- 交易记录。

### 4.3 两张图的关系

共享图是资料库；当前故事图是状态层。

当前故事图不应完整复制共享图，只引用共享图节点 ID，并保存当前状态。

---

## 5. 显示规则与科技 UI

### 5.1 显示上限

生命系统树只显示：

```text
主角当前综合评级 +1
```

从角色卡读取：

```text
card/<protagonist>/combat/combat-rating.json
```

取：

```text
combatRating.overall
```

示例：

```text
主角综合评级：N3 房屋级
显示上限：N4 建筑级
可显示层级：N0 ~ N4
```

N5 及以上不显示、不提示、不出现轮廓。

### 5.2 允许显示

允许显示：

- 已点亮节点。
- 已自然达成节点。
- 已点亮能力基点展开出的树。
- 当前可点亮节点。
- 当前可修行节点。
- 当前综合评级 +1 范围内的已显现节点。
- 用户主动搜索后确认存在且不超过显示上限的节点。
- 奖励点余额。
- 交易记录摘要。
- 已点亮效果摘要。

### 5.3 禁止显示

禁止显示：

- 超过综合评级 +1 的节点。
- 隐藏节点轮廓。
- `???` 节点。
- 未搜索到的能力基点。
- 未搜索到的树。
- 导航入口。
- 分类入口。
- 空节点。
- 原创节点。
- 没有来源世界观的节点。
- 原著未来情报。
- NPC 秘密。
- GM-only 信息。

### 5.4 UI 示例

```text
【生命系统树｜科技 UI】
━━━━━━━━━━━━━━━━━━━━
同步状态：ONLINE
主角综合评级：N3 房屋级
显示上限：N4 建筑级

奖励点：
1级奖励点：27
2级奖励点：0
3级奖励点：0

已拥有基础：
● 人类身体 [N0｜现实世界 / 普通人类基线]
● 人类灵魂 [N0｜现实世界 / 普通人类基线]

已点亮能力基点：
● 生命感知 [N0｜来源世界：示例世界]
● 基础枪械 [N0｜绯弹的亚里亚｜剧情训练达成]

已展开能力网：
● 生命感知 I       [N0｜已点亮]
● 生命感知 II      [N1｜已点亮]
○ 生命流动解析     [N3｜价格：20个1级奖励点]
○ 神经反应辅助     [N2｜可训练 / 可点亮]

可主动搜索：
> 输入真实方向，例如：恢复、抗性、感知、肉体强化、当前世界能力、N3能力基点
━━━━━━━━━━━━━━━━━━━━
```

注意：没有隐藏轮廓，没有 `???`，没有导航入口。

---

## 6. 节点体系

### 6.1 节点必须是真实能力或真实状态

节点可以是：

- 人类身体。
- 人类灵魂。
- 普通感官。
- 基础运动能力。
- 基础格斗。
- 基础枪械。
- 基础急救。
- 原著能力。
- 原著体质。
- 原著血统。
- 原著能量基盘。
- 原著技艺。
- 原著生命形态。
- 剧情中学会的技能。
- 剧情中觉醒的特性。

### 6.2 节点分类

建议 `category`：

```text
body
soul
mind
sense
technique
combat_skill
resource
resistance
regeneration
life_profile
energy_foundation
canon_ability
story_skill
```

### 6.3 节点种类

建议 `nodeKind`：

```text
abilityBase
single
multiRank
keystone
```

含义：

| nodeKind | 含义 |
|---|---|
| `abilityBase` | 能力基点，本身有实际效果，可作为子网起点 |
| `single` | 普通单节点 |
| `multiRank` | 多级成长节点 |
| `keystone` | 关键节点，本身也必须是真实能力或真实强化形态 |

禁止出现：

```text
navigation
categoryEntry
folder
empty
original
```

---

## 7. 基点规则：只允许能力基点

### 7.1 能力基点定义

能力基点必须满足：

1. 是真实能力 / 体质 / 特性 / 技艺 / 能量基盘 / 生命变化 / 基础状态。
2. 点亮或确认后有实际效果。
3. 可以写入角色卡模块。
4. 有来源世界观。
5. 有来源审核或剧情证据。
6. 非原创。
7. 有多世界评价记录。
8. 有定价或获得方式。
9. 可以作为一棵子网的起点。

### 7.2 允许的能力基点示例

```text
人类身体
人类灵魂
普通感官
基础格斗
基础枪械
基础急救
生命感知
微弱再生
疼痛钝化
神经反射强化
生命力储备
血液控制
肌肉纤维强化
细胞活性化
毒素抗性
灵魂稳定
查克拉
魔术回路
念能力
咒力
```

### 7.3 禁止的基点

```text
恢复类入口
N3层入口
生命干涉索引
高阶强化入口
防御类分支入口
能力分类节点
系统导航节点
空节点
文件夹节点
```

### 7.4 内部索引允许但不可展示

系统内部可以维护索引，例如：

```json
{
  "internalIndex": {
    "categories": {
      "regeneration": ["minor-regeneration", "cellular-repair"],
      "sense": ["life-perception", "danger-sense"]
    },
    "layers": {
      "N0": ["human-body", "human-soul"],
      "N1": ["minor-regeneration"]
    }
  }
}
```

但内部索引：

- 不进入 UI。
- 不进入剧情描述。
- 不可点亮。
- 不消耗奖励点。
- 不写入角色卡。
- 不作为能力基点。

---

## 8. 节点来源世界观规则

### 8.1 强制 sourceWorld

每个节点必须包含：

```json
{
  "sourceWorld": {
    "worldId": "",
    "worldName": "",
    "sourceType": "",
    "status": "",
    "refs": [],
    "webSources": [],
    "verificationStatus": "",
    "notes": ""
  }
}
```

### 8.2 sourceType

允许：

```text
protagonist_baseline
canon_source
archived_world_source
verified_external_source
in_story_training
story_event_awakened
hybrid_training_currency
```

禁止：

```text
original
system_original
unclear
unknown
```

### 8.3 基础节点的来源

基础节点也必须标注来源。

例如现代普通人类基线：

```json
{
  "sourceWorld": {
    "worldId": "real-world-baseline",
    "worldName": "现实世界 / 普通人类基线",
    "sourceType": "protagonist_baseline",
    "status": "baseline",
    "refs": [],
    "webSources": [],
    "verificationStatus": "inherent",
    "notes": "主角当前基础身体/灵魂状态。"
  }
}
```

如果主角出身于某作品世界，则写该作品世界。

### 8.4 当前故事学习节点的来源

例如在《绯弹的亚里亚》世界学会基础枪械：

```json
{
  "sourceWorld": {
    "worldId": "hidan-no-aria",
    "worldName": "绯弹的亚里亚",
    "sourceType": "in_story_training",
    "status": "story-confirmed",
    "refs": ["memory/world-history.md#东京武侦高枪械训练"],
    "webSources": [],
    "verificationStatus": "story-confirmed",
    "notes": "该节点来自当前故事中主角在武侦高的枪械训练。"
  }
}
```

### 8.5 原著能力节点的来源

已归档世界优先使用 `world_query` ref。

非归档世界必须双来源验证。

```json
{
  "sourceWorld": {
    "worldId": "naruto",
    "worldName": "火影忍者",
    "sourceType": "canon_source",
    "status": "unarchived",
    "refs": [],
    "webSources": [
      {
        "url": "",
        "title": "",
        "fetchedAt": "",
        "summary": "",
        "supports": ["workExists", "nodeExists", "completeUnit", "notOriginal"]
      }
    ],
    "verificationStatus": "verified"
  }
}
```

### 8.6 剧情事件觉醒节点的来源

```json
{
  "sourceWorld": {
    "worldId": "campione",
    "worldName": "弑神者！",
    "sourceType": "story_event_awakened",
    "status": "story-confirmed",
    "refs": ["memory/world-history.md#杀死赫菲斯托斯事件"],
    "verificationStatus": "story-confirmed"
  }
}
```

### 8.7 校验规则

节点校验必须检查：

1. 必须有 `sourceWorld`。
2. 必须有 `worldId`。
3. 必须有 `worldName`。
4. 必须有 `sourceType`。
5. 必须有 `verificationStatus`。
6. 已归档世界必须有 `refs` 或 memory 证据。
7. 非归档世界必须有至少两个 `webSources`。
8. 主角基础节点必须标记 `baseline` / `inherent`。
9. 自学节点必须有 `memory/world-history.md` 或 `memory/user.md` 证据。
10. 不允许无来源节点。
11. 不允许 `sourceType: original`。

---

## 9. 节点获取方式

节点不只靠货币点亮。

建议字段：

```json
{
  "unlockModes": ["currency", "selfTraining", "storyAchievement", "hybrid"]
}
```

### 9.1 获取模式

| 模式 | 说明 |
|---|---|
| `inherent` | 主角天生/当前状态已经拥有，如人类身体、人类灵魂 |
| `currency` | 纯消耗奖励点点亮 |
| `selfTraining` | 通过学习、训练、修行、实践自然达成 |
| `storyAchievement` | 剧情重大事件自然解锁 |
| `hybrid` | 部分训练达成 + 折扣消耗奖励点补足 |
| `sourceAcquisition` | 从传承、教学、道具、契约等获得 |

### 9.2 自然达成

如果主角通过剧情训练、学习、实战完全达成某节点：

```text
价格 = 0
解锁方式 = selfTraining
```

但仍必须写入：

- `progression/life-system-tree.json`
- `memory/world-history.md`
- `memory/user.md`
- 对应角色卡模块

### 9.3 货币点亮

若节点未通过剧情自然达成，则可以通过奖励点点亮。

### 9.4 混合补足

若主角完成了部分训练，但尚未完全达成，则可折扣点亮。

---

## 10. 学习、修行、自达成与折扣机制

### 10.1 可自学/修行节点

例如：

```text
基础格斗 I
基础剑术 I
魔力控制 I
呼吸节奏 I
灵魂冥想 I
急救术 I
枪械维护 I
```

节点字段：

```json
{
  "selfAchievable": true,
  "trainingRequirements": {
    "teacher": "optional|required",
    "sourceMaterial": "required|optional",
    "practiceTime": "days/weeks/months",
    "risk": "low|medium|high",
    "checkType": "narrative|dice|combat"
  }
}
```

### 10.2 折扣来源

可折扣原因：

- 主角已经完成部分训练。
- 主角已掌握前置技能。
- 主角有老师指导。
- 主角有原著教材 / 传承 / 训练环境。
- 主角在剧情中反复实战使用。
- 主角已拥有同源能力基点。
- 主角通过重大剧情事件自然觉醒了一部分。

### 10.3 折扣字段

```json
{
  "discounts": [
    {
      "type": "selfTrainingProgress",
      "rate": 0.3,
      "reason": "主角已完成两周基础训练，并在实战中成功使用。",
      "evidenceRef": "memory/world-history.md#训练记录"
    }
  ]
}
```

### 10.4 折扣计算

```text
最终价格 = 原价 × (1 - 折扣率)
```

建议最低计价：

```text
折扣后最低价格 = 1个1级奖励点
```

但完全自然达成时：

```text
价格 = 0
```

### 10.5 折扣禁止事项

禁止：

- 没有剧情证据就折扣。
- 为了便宜强行说学过。
- 只凭“应该会”给折扣。
- 没有训练/实践/老师/教材/时间记录。

---

## 11. 货币与奖励点

### 11.1 货币名称

直接使用：

```text
1级奖励点
2级奖励点
3级奖励点
```

未来允许扩展：

```text
4级奖励点
5级奖励点
...
```

### 11.2 进位

默认沿用兑换系统：

```text
1000 个低一级奖励点 = 1 个高一级奖励点
```

### 11.3 获取来源

只允许：

- 战胜强敌。
- 对世界造成影响程度。
- 剧情偏转程度。

建议 sourceType：

```text
defeatStrongEnemy
worldImpact
plotDeviation
```

### 11.4 禁止来源

禁止：

- 金钱购买。
- 出售物品。
- 资源转换。
- 献祭材料。
- 普通任务刷点。
- 日常训练刷点。
- 重复劳动刷点。

### 11.5 发点记录

```json
{
  "id": "grant-xxx",
  "type": "grant-points",
  "sourceType": "defeatStrongEnemy",
  "amount": 3,
  "pointLevel": 1,
  "reason": "击败强敌并改变区域势力格局",
  "eventRef": "memory/world-history.md#事件",
  "evaluation": {
    "evaluationMethod": "multi-world-evaluation-method-v1",
    "impactRating": "N5",
    "basis": "敌人为当前阶段强敌，战斗结果导致原著支线提前偏转。"
  }
}
```

---

## 12. 定价规则

### 12.1 价格表

定价与兑换系统一样，读取：

```text
data/rp-exchange/settings.json
```

或在生命系统树 settings 中引用同一张 `priceByN`。

### 12.2 起点 / 初始解锁

每层起点采用完整价格。

```text
价格 = 节点自身 N 级完整价格
```

示例：

```text
N3 起点 = N3 完整价格 = 30个1级奖励点
N6 起点 = N6 完整价格 = 1个2级奖励点
N12 起点 = N12 完整价格 = 1个3级奖励点
```

### 12.3 升级

升级适用差价。

```text
升级费用 = 目标 N 级完整价格 - 当前阶段 N 级完整价格
```

示例：

```text
N2 → N3
N2 = 10个1级奖励点
N3 = 30个1级奖励点
费用 = 20个1级奖励点
```

跨级示例：

```text
N5 → N6
N5 = 300个1级奖励点
N6 = 1个2级奖励点 = 1000个1级奖励点
费用 = 700个1级奖励点
```

### 12.4 自然达成

```text
价格 = 0
mode = selfTraining / storyAchievement / inherent
```

### 12.5 折扣点亮

```text
最终价格 = 原价 × (1 - 折扣率)
```

折扣必须有证据。

---

## 13. 多世界评价方式接入

### 13.1 必读模块

每个节点评价必须先读取：

```text
.pi/skills/rp-combat/framework/02-rating/02-evaluation-method.md
```

再读取：

```text
.pi/skills/rp-combat/framework/02-rating/03-rating-system.md
```

### 13.2 评价记录

节点必须包含：

```json
{
  "evaluation": {
    "framework": "multi-world-combat-rating",
    "evaluationMethod": "multi-world-evaluation-method-v1",
    "ratingSystem": "multi-world-rating-system-n0-n24-v1",
    "baseRating": "N0",
    "peakRating": "N0",
    "conditionalRating": null,
    "pricingRating": "N0",
    "basis": "",
    "evidence": [],
    "limitations": [],
    "disputes": [],
    "excludedInflations": []
  }
}
```

### 13.3 禁止事项

禁止：

- 只填一个 N 级。
- 按角色名、称号、稀有度、作品名气定级。
- 跳过评价方式。
- 把蓄力/仪式/外力计入常态评级。
- 无明确证据升到规则/概念/高维。

---

## 14. 搜索与动态生成规则

### 14.1 主动搜索

用户必须主动搜索未显现能力基点和树。

示例：

```text
搜索恢复类节点
搜索当前世界可学技能
搜索 N3 能力基点
搜索灵魂类能力
搜索绯弹的亚里亚世界中的基础技能节点
```

### 14.2 搜索流程

```text
用户搜索
→ 检查主角综合评级 +1 显示上限
→ 查共享图 global-graph.json
→ 如果共享图有已审核节点，返回可显示结果
→ 如果共享图没有，则查归档或联网
→ 审核真实来源
→ 多世界评价
→ 写入共享图
→ 返回可显示结果
```

### 14.3 搜索结果限制

搜索结果只能是真实能力节点或真实能力基点。

禁止返回：

- 导航入口。
- 分类入口。
- 空节点。
- 隐藏轮廓。
- 超过显示上限的节点。
- 未审核节点。
- 原创节点。

### 14.4 动态生成

若共享图不存在节点，但归档/联网来源证明真实存在，则可以动态生成。

动态生成要求：

1. 确认来源世界观。
2. 已归档世界用 `world_query` ref。
3. 非归档世界用至少双来源验证。
4. 确认不是原创、同人、AI 自创。
5. 确认节点是完整能力/技能/体质/特性。
6. 完成多世界评价。
7. 写入共享图。

---

## 15. 不允许原创节点规则

### 15.1 允许

允许：

- 原著能力标准化。
- 原著体质标准化。
- 原著技能标准化。
- 原著能量基盘标准化。
- 主角已训练技能入树。
- 主角基础身体/灵魂入树。
- 剧情事件觉醒能力入树。

### 15.2 禁止

禁止：

- 原创能力。
- 原创过渡节点。
- 原创升级阶段。
- 为了连线创造节点。
- 把多个无关能力自创融合成新能力。
- 没有来源世界观的节点。
- 无证据的“合理推演能力”。
- 用系统导航节点伪装成基点。

---

## 16. 世界适配边界

世界适配不做网状。

生命系统树 UI 中不设计：

```text
世界适配分支
世界适配节点
世界适配网
```

但如果节点实际改变世界适配，例如：

- 获得新能量基盘。
- 改变生命形态。
- 改变灵魂接口。
- 获得跨世界可迁移能力。
- 改变某世界能力可用性。

仍必须更新：

```text
card/<protagonist>/combat/world-adaptation.json
memory/world-history.md
```

世界适配是状态记录，不是生命系统树网状图的一部分。

---

## 17. 数据结构设计

### 17.1 当前故事状态模板

建议模板路径：

```text
.pi/skills/rp-combat/framework/card-template/unified-character-v1/progression/life-system-tree.json
```

结构：

```json
{
  "schema": "rp-life-system-tree-state-v1",
  "enabled": false,
  "owner": "protagonist-only",
  "uiStyle": "sci-fi",
  "masterGraphRef": "data/rp-life-system-tree/global-graph.json",
  "masterGraphVersion": "v1",
  "displayPolicy": {
    "maxVisibleRatingOffsetFromProtagonistOverall": 1,
    "showHiddenNodeSilhouettes": false,
    "requiresActiveSearchForUnknownAbilityBases": true,
    "showOnlyUnlockedAbilityBaseTrees": true
  },
  "currency": {
    "conversionRate": 1000,
    "defaultVisibleLevels": [1, 2, 3],
    "balances": {
      "1级奖励点": 0,
      "2级奖励点": 0,
      "3级奖励点": 0
    },
    "lifetimeEarned": {},
    "lifetimeSpent": {}
  },
  "storyGraph": {
    "unlockedAbilityBases": [],
    "revealedNodes": [],
    "availableNodes": [],
    "unlockedNodes": [],
    "selfAchievedNodes": [],
    "nodeRanks": {},
    "visibleEdges": []
  },
  "searchRecords": [],
  "sourceAudits": [],
  "transactions": [],
  "auditLog": []
}
```

### 17.2 共享图结构

```json
{
  "schema": "rp-life-system-tree-global-graph-v1",
  "version": "v1",
  "nodes": [],
  "edges": [],
  "layers": [],
  "internalIndex": {
    "categories": {},
    "layers": {},
    "worlds": {}
  },
  "auditLog": []
}
```

### 17.3 节点结构

```json
{
  "id": "basic-firearms",
  "name": "基础枪械",
  "nodeKind": "abilityBase",
  "originType": "in_story_training",
  "category": "combat_skill",
  "layers": ["N0"],
  "isLayerStart": true,
  "isTreeRoot": true,
  "sourceWorld": {
    "worldId": "hidan-no-aria",
    "worldName": "绯弹的亚里亚",
    "sourceType": "in_story_training",
    "status": "story-confirmed",
    "refs": ["memory/world-history.md#东京武侦高枪械训练"],
    "webSources": [],
    "verificationStatus": "story-confirmed",
    "notes": "该节点来自当前故事中主角在武侦高的枪械训练。"
  },
  "unlockModes": ["selfTraining", "currency", "hybrid"],
  "selfAchievable": true,
  "trainingRequirements": {
    "teacher": "optional",
    "sourceMaterial": "optional",
    "practiceTime": "weeks",
    "risk": "low",
    "checkType": "narrative"
  },
  "evaluation": {
    "framework": "multi-world-combat-rating",
    "evaluationMethod": "multi-world-evaluation-method-v1",
    "ratingSystem": "multi-world-rating-system-n0-n24-v1",
    "baseRating": "N0",
    "peakRating": "N0",
    "conditionalRating": null,
    "pricingRating": "N0",
    "basis": "现实级基础枪械训练，提供武器使用能力，不提升裸身战斗评级。",
    "evidence": ["memory/world-history.md#东京武侦高枪械训练"],
    "limitations": [],
    "disputes": [],
    "excludedInflations": []
  },
  "pricing": {
    "mode": "selfTraining",
    "priceTable": "rp-exchange-priceByN",
    "toRating": "N0",
    "fullCost": {
      "amount": 1,
      "pointLevel": 1,
      "display": "1个1级奖励点"
    },
    "discounts": [],
    "finalCost": {
      "amount": 0,
      "pointLevel": 1,
      "display": "0个1级奖励点"
    }
  },
  "effects": [
    {
      "targetModule": "abilities",
      "operation": "upsert",
      "id": "basic-firearms",
      "payload": {}
    }
  ]
}
```

### 17.4 边结构

```json
{
  "id": "edge-life-perception-to-life-flow-analysis",
  "from": "life-perception",
  "to": "life-flow-analysis",
  "type": "upgrade | prerequisite | synergy | variant | sameSourceLine",
  "affectsUnlock": true,
  "basis": "同一原著能力线的更高应用阶段。",
  "sourceWorld": {
    "worldId": "",
    "worldName": "",
    "verificationStatus": "verified"
  }
}
```

禁止边类型：

```text
navigation
category-entry
folder
```

---

## 18. Package 设计

建议新增：

```text
packages/rp-life-system-tree/
```

结构：

```text
packages/rp-life-system-tree/
  package.json
  src/index.js
  src/settings.js
  src/pricing.js
  src/graph.js
  src/validate.js
  src/search.js
  src/unlock.js
  test/run-tests.js
```

### 18.1 核心 API

```js
loadLifeTreeSettings()
validateNode(node)
validateGraph(graph)
validateState(state)
priceForN(rating)
upgradeDeltaPrice(fromRating, toRating)
applyDiscounts(price, discounts)
visibleRatingCap(protagonistOverall, offset = 1)
visibleGraph(globalGraph, state, protagonistOverall)
searchGraph(globalGraph, query, cap)
canUnlockNode(globalGraph, state, nodeId)
quoteNode(globalGraph, state, nodeId)
unlockNode(globalGraph, state, nodeId)
upgradeNode(globalGraph, state, nodeId)
grantPoints(state, sourceType, amount, pointLevel)
```

---

## 19. Tool 设计：life_tree_edit

建议新增扩展：

```text
.pi/extensions/life-tree-edit.ts
```

工具名：

```text
life_tree_edit
```

### 19.1 Actions

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

### 19.2 显示边界

`status` / `graph` 必须遵守：

- 只显示综合评级 +1。
- 不显示隐藏轮廓。
- 不显示未搜索节点。
- 不显示导航/分类/内部索引。
- 不显示未审核节点。
- 不显示 GM-only 信息。

### 19.3 写入边界

`life_tree_edit` 只维护生命系统树账本和共享图。

具体能力变化仍需用 `card_edit` 写入：

- `abilities`
- `resources`
- `attributes`
- `resistances`
- `lifeProfile`
- `combatRating`
- `combatLog`
- `knowledge`
- `worldAdaptation`（仅状态记录，不做网状）

---

## 20. Skill 设计：rp-life-system-tree

建议新增：

```text
.pi/skills/rp-life-system-tree/SKILL.md
```

### 20.1 触发条件

- 用户启用生命系统树。
- 用户查看生命系统树面板。
- 用户搜索节点。
- 用户点亮节点。
- 用户升级节点。
- 用户通过训练/修行达成节点。
- 剧情触发生命系统树奖励点。
- 跨世界经历导致可搜索节点变化。

### 20.2 Skill 必写规则

- 主角专属。
- 默认关闭。
- 科技 UI。
- 与兑换系统默认互斥。
- 使用奖励点。
- 只显示主角综合评级 +1。
- 不显示隐藏轮廓。
- 能力基点必须是真实能力/状态。
- 禁止导航基点。
- 每个节点必须标注来源世界观。
- 非归档节点必须双来源验证。
- 允许自学/修行/剧情达成节点。
- 折扣必须有证据。
- 节点评价必须先读评价方式，再读评级体系。
- 点亮后必须双写角色卡和 memory。

---

## 21. 角色卡模板接入

新增模板模块：

```text
.pi/skills/rp-combat/framework/card-template/unified-character-v1/progression/life-system-tree.json
```

更新配置：

```text
.pi/rp-data-tools.json
```

加入 module：

```json
{
  "lifeSystemTree": "progression/life-system-tree.json"
}
```

加入 required module：

```text
progression/life-system-tree.json
```

视实现策略，也可以默认不 required，但模板包含。

---

## 22. Memory 双写规则

### 22.1 必写 memory

每次发生以下情况，必须更新 `memory/world-history.md`：

- 启用生命系统树。
- 获得奖励点。
- 搜索并发现来源世界节点。
- 动态生成共享图节点。
- 点亮节点。
- 升级节点。
- 自学/训练达成节点。
- 节点改变能力、体质、灵魂、资源、抗性、战斗评级。
- 节点影响世界适配状态。

### 22.2 角色卡同步

节点效果必须同步到对应模块：

| 节点效果 | 模块 |
|---|---|
| 生命基础 / 体质 | `combat/life-profile.json` |
| 属性增强 | `combat/attributes.json` |
| 资源池 | `combat/resources.json` |
| 能力 | `combat/abilities.json` |
| 抗性 | `combat/resistances.json` |
| 战斗评级变化 | `combat/combat-rating.json`, `combat/combat-log.json` |
| 技能知识 | `knowledge/knowledge.json` |
| 世界适配状态 | `combat/world-adaptation.json` |

---

## 23. 测试计划

### 23.1 package 测试

新增：

```text
npm run test:rp-life-system-tree
```

并加入：

```text
npm run test:rp-all
```

### 23.2 测试项

必须测试：

1. 节点必须有 `sourceWorld`。
2. 节点必须有 `worldId` / `worldName`。
3. 禁止 `sourceType: original`。
4. 基点必须是 `abilityBase` 且有实际效果。
5. 禁止导航基点。
6. 禁止分类入口节点。
7. 显示上限 = 主角综合评级 +1。
8. 隐藏节点不显示轮廓。
9. 未搜索节点不显示。
10. 起点按完整价格。
11. 升级按差价。
12. 自学节点可 0 成本。
13. 混合节点可折扣。
14. 折扣必须有证据。
15. 非归档节点必须双来源。
16. 共享图可动态追加已审核节点。
17. 节点必须有 `evaluationMethod: multi-world-evaluation-method-v1`。
18. 节点必须有 `ratingSystem: multi-world-rating-system-n0-n24-v1`。
19. 与兑换系统互斥检查。
20. 发点来源只能是强敌、世界影响、剧情偏转。

---

## 24. 实施步骤

### Phase 1：文档与规则

- 新增 `docs/rp-life-system-tree-system.md`。
- 新增 `rules/rp-life-system-tree-system.md`。
- 新增 `.pi/skills/rp-life-system-tree/SKILL.md`。
- 更新 `AGENTS.md`。
- 更新 `rp-engine` skill。

### Phase 2：数据与 schema

- 新增 `data/rp-life-system-tree/settings.json`。
- 新增 `data/rp-life-system-tree/global-graph.json`。
- 新增 schemas：
  - `life-tree-state.schema.json`
  - `life-tree-node.schema.json`
  - `life-tree-edge.schema.json`
  - `life-tree-transaction.schema.json`

### Phase 3：角色卡模板

- 新增 `progression/life-system-tree.json` 模板。
- 更新 `.pi/rp-data-tools.json`。

### Phase 4：package

- 新增 `packages/rp-life-system-tree/`。
- 实现 settings/pricing/graph/validate/search/unlock。
- 写测试。
- 更新 `package.json` / `package-lock.json`。

### Phase 5：tool

- 新增 `.pi/extensions/life-tree-edit.ts`。
- 实现 actions。
- 支持 dryRun、backup、validate。
- 返回科技 UI 安全显示内容。

### Phase 6：集成测试

- `npm run test:rp-life-system-tree`
- `npm run test:rp-all`
- JSON parse 校验。
- Markdown 校验。
- `card_edit cards` 确认模板模块识别。

---

## 25. 风险点与防错规则

### 25.1 风险：变成原创技能树

防错：

- 节点必须有 `sourceWorld`。
- 禁止 `sourceType: original`。
- 非归档必须双来源。
- 自学节点必须有剧情训练证据。

### 25.2 风险：显示未来隐藏能力

防错：

- 只显示综合评级 +1。
- 不显示隐藏轮廓。
- 未搜索不显示。
- 超出上限不显示。

### 25.3 风险：导航基点混入 UI

防错：

- `nodeKind` 只允许 `abilityBase/single/multiRank/keystone`。
- 禁止 `navigation/categoryEntry/folder`。
- abilityBase 必须有实际效果。

### 25.4 风险：跳过多世界评价

防错：

- validate-node 检查 `evaluationMethod`。
- quote-node 需要完整评价记录。
- price lookup 不负责评价。

### 25.5 风险：折扣滥用

防错：

- 折扣必须有 `evidenceRef`。
- 无 evidenceRef 折扣无效。
- 完全自学达成必须有 memory 证据。

### 25.6 风险：与兑换系统账本冲突

防错：

- 默认互斥启用。
- init 时检查 exchange enabled。
- status 时提示互斥状态。

---

## 26. 最终确认规则摘要

生命系统树最终规则：

1. 名称：生命系统树。
2. 主角专属。
3. 默认关闭。
4. 科技 UI。
5. 与兑换系统默认互斥。
6. 使用 `1级奖励点`、`2级奖励点`、`3级奖励点`，未来允许扩展。
7. 有共享图和当前故事图。
8. 共享图只收录已审核真实节点。
9. 当前故事图只记录当前主角状态。
10. 默认只显示主角综合评级 +1。
11. 不显示隐藏节点轮廓。
12. 未搜索的能力基点和树不显示。
13. 基点必须是能力基点。
14. 禁止导航基点、分类入口、空节点。
15. 系统内部可以有索引，但不可展示给用户。
16. 每个节点必须标注来源世界观。
17. 基础节点也必须标注来源世界观或基线世界。
18. 自学节点必须标注学习发生的世界。
19. 原著能力节点必须标注原作品世界。
20. 剧情觉醒节点必须标注事件发生世界。
21. 节点不允许原创。
22. 搜索不到时，可基于归档/联网审核动态生成真实节点并写入共享图。
23. 非归档节点必须双来源验证。
24. 节点可以通过货币点亮，也可以通过学习/修行/剧情自然达成。
25. 部分训练达成可折扣点亮。
26. 折扣必须有剧情证据。
27. 起点按完整 N 级价格。
28. 升级按差价。
29. 定价沿用兑换系统价格表。
30. 发点来源只允许强敌、世界影响、剧情偏转。
31. 世界适配不做网状，但必要状态仍写入 `world-adaptation.json`。
32. 节点评价必须先读 `02-evaluation-method.md`，再读 `03-rating-system.md`。
33. 点亮/升级/达成后必须同步角色卡模块和 `memory/world-history.md`。

---

## 27. 审核清单

实现前和实现后都应检查：

- [ ] 是否存在无来源世界观节点？
- [ ] 是否存在原创能力节点？
- [ ] 是否存在导航基点或分类入口？
- [ ] 是否所有节点都有多世界评价记录？
- [ ] 是否所有显示内容都不超过主角综合评级 +1？
- [ ] 是否隐藏节点没有轮廓显示？
- [ ] 是否非归档节点有双来源？
- [ ] 是否自学/折扣节点有剧情证据？
- [ ] 是否起点价格使用完整价格？
- [ ] 是否升级价格使用差价？
- [ ] 是否世界适配没有做成网状？
- [ ] 是否点亮后同步了角色卡与 memory？
