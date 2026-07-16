# RP 功能模块规划

本文记录多世界互动框架之外的四个可选功能模块：世界相关设定知识来源、主角生成引导、可选外挂/穿越理由、框架沉淀为 skills/rules。

这些模块不替代 `docs/world-combat-framework.md`，而是为 Campaign / Card / Session 提供额外支撑。

---

## 1. 世界相关设定知识来源

目的：为世界设定、力量体系、势力、地点、事件、人物、道具提供可追溯来源，避免设定凭空漂移。

### 1.1 知识来源类型

```text
canon-source          原作/官方资料/设定集
adapted-source        改编资料/二创整理/条目百科
campaign-source       本 Campaign 自定义设定
session-source        会话中自然生成的新设定
gm-source             GM 隐藏设定
inference-source      根据已知设定推导出的内容
rumor-source          谣言/不可靠情报
web-fetch-source      agent 自主抓取的网页资料
user-file-source      用户提供的本地文件/图片/文档资料
user-correction-source 用户直接修正/指定的设定
agent-summary-source  agent 对多个来源整理后的摘要
```

### 1.2 来源可信度

```text
S：直接原文/明确官方设定/会话已发生事实
A：高可信整理，且与表现不冲突
B：可靠角色叙述或多处间接支持
C：合理推导，需要标注推导链
D：传闻、模糊说法、角色误判
E：明显不可靠或待核验
```

### 1.3 来源用途

知识来源可以绑定到：

- 世界模板。
- 力量体系。
- 评级证据。
- 势力准则。
- 人物关系。
- 知识图谱节点。
- 能力原理。
- 道具/载具/构装体设定。

### 1.4 更新原则

- 世界初始设定写入 `source-registry`。
- agent 自主抓取网页资料时写入 `web-fetch-source`，并记录 URL、抓取时间、摘要与可信度。
- 用户提供本地文件、图片、文档时写入 `user-file-source`，并记录文件路径、解析方式、页码/区域等。
- 用户直接修正设定时写入 `user-correction-source`，优先级高于 agent 推导和摘要。
- 会话中新生成的事实写入 `session-source`。
- 玩家已确认看到/经历的事实优先级高于旧推导。
- 谣言不直接覆盖事实，只作为 `rumor-source` 节点存在。
- 冲突来源必须记录冲突，不要静默覆盖。

---

## 2. 主角生成引导

目的：用问答引导生成主角，而不是直接设计固定角色。

主角生成需要和世界/战斗框架挂钩：初始强度、生命类型、基础属性、资源、能力、知识、关系、外挂、穿越理由都要可追踪。

### 2.1 生成流程

```text
1. 确认 Campaign 类型和开局世界
2. 确认主角出身：本地人 / 外来者 / 穿越者 / 转生者 / 召唤者 / 觉醒者
3. 确认初始强度范围
4. 确认生命类型与基础属性倾向
5. 确认主角核心欲望、底线、弱点
6. 确认知识水平与世界认知
7. 确认可选外挂/穿越理由
8. 确认初始能力、资源、物品、关系
9. 确认成长方向和初始长期目标
10. 生成 Card + Combatant + RelationshipGraph + KnowledgeGraph 初始数据
```

### 2.2 关键问题

主角生成不应只问外貌和性格，还要问：

- 开局是否知道自己穿越/转生？
- 是否知道原世界剧情/设定？知道多少？可信度如何？
- 初始战力是普通人、低超凡、同世界中游，还是强者？
- 能力来自自身、外挂、知识、血统、契约、道具、训练，还是世界体系？
- 是否有无法公开的秘密？
- 主角对力量的态度是什么？
- 主角成长依赖战斗、学习、吞噬、修炼、研究、社交、交易，还是任务奖励？

### 2.3 输出数据

主角生成最终应输出：

```text
card-profile
combatant-profile
initial-abilities
initial-items
initial-relationships
initial-knowledge
plugin/origin-module
```

---

## 3. 可选外挂 / 穿越理由

目的：把“为什么主角能跨世界/有什么外挂”结构化，避免后续随意膨胀。

这里不用固定叫“系统”。外挂可以是系统，也可以是天赋、道具、契约、血脉、知识、任务机制、观测者身份、世界漏洞等。

### 3.1 类型

```text
none                 无外挂
system               系统/面板/任务机制
talent               天赋/体质/悟性/适配性
knowledge            原作知识/未来知识/专业知识
relic-item           特殊物品/遗物/设备
contract             契约/神明交易/恶魔交易
bloodline            血统/种族/传承
world-error          世界漏洞/异常身份
summoned-role        被召唤身份/勇者/候选者
observer             观测者/记录者/玩家视角
reincarnation-bonus  转生补偿
random-mutation      随机异变
```

### 3.2 穿越理由

穿越理由与外挂分开记录：

```text
accident        意外穿越
summon          被召唤
reincarnation   死后转生
migration       主动迁移
mission         任务派遣
escape          逃亡/避难
experiment      实验事故
selection       被选中
anomaly         异常卷入
unknown         未知
```

### 3.3 限制原则

外挂必须记录：

- 能做什么。
- 不能做什么。
- 消耗什么。
- 是否有意识。
- 是否能撒谎或隐瞒。
- 是否会成长。
- 是否会被侦测、封印、夺取、污染。
- 是否跨世界保留。
- 是否改变主角评级。

外挂不是免费万能解释。每个能力都仍需落入能力模板、状态模板或知识图谱。

---

## 4. 框架沉淀为 skills / rules

目的：把当前多世界 RP 架构、战斗评级、图谱、模板、前端展示原则等沉淀为可复用的 `skills` 和 `rules`，让之后开新 Campaign 或新会话时可以按需加载，而不是每次重新解释。

这里的“沉淀”不是角色能力成长，而是项目工作流和规则资产化。

### 4.1 沉淀对象

```text
rp-framework-rules       多世界 RP 基础规则
combat-rating-rules      汪吧风格评级、扒皮、分项评级规则
world-source-rules       世界知识来源、可信度、冲突处理规则
card-generation-skill    主角/角色卡生成引导 skill
graph-management-skill   关系/知识图谱维护 skill
combat-resolution-skill  战斗判定与日志维护 skill
frontend-projection-rule 前端只读投影规则
```

### 4.2 skills 与 rules 分工

`rules` 适合写稳定、短、必须遵守的项目规则：

- 不默认世界压制外来能力。
- 基础属性只记录裸值。
- 战斗对象必须有综合评级和分项评级。
- 评级必须记录证据来源。
- 玩家可见和 GM 隐藏信息必须分层。

`skills` 适合写可按需加载的长流程：

- 如何生成主角。
- 如何导入世界资料。
- 如何创建世界力量体系。
- 如何做战斗扒皮和评级。
- 如何更新关系/知识图谱。
- 如何生成前端投影文件。

### 4.3 推荐沉淀方式

当前项目采用轻量 pi 方案，建议：

```text
rules/
  rp-core-rules.md
  rp-combat-rating-rules.md
  rp-frontend-rules.md

skill/
  RP-GUIDE.md
  world-source-ingestion.md
  protagonist-generation.md
  combat-resolution.md
  graph-management.md
  frontend-projection.md
```

`AGENTS.md` 只保留极简入口，不默认加载全部 skill。需要某个流程时再读取对应 skill。

### 4.4 沉淀更新原则

- 用户明确修正优先写入 rules 或对应 skill。
- 大段设计文档不直接塞进 AGENTS.md。
- 稳定原则写入 rules。
- 操作流程写入 skills。
- 模板字段变更后，同步更新对应 skill。
- 备份/参考项目只作为资料来源，不常驻加载。

---

## 5. 推荐文件结构

```text
campaigns/<campaign-id>/sources/source-registry.json
campaigns/<campaign-id>/cards/<card-id>/protagonist-generation.json
campaigns/<campaign-id>/cards/<card-id>/origin-plugin.json
campaigns/<campaign-id>/cards/<card-id>/ability-deposition.json
```

如果还没有正式 Campaign 目录，可以先使用 `templates/rp-framework/` 中的模板。
