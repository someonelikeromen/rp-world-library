# 角色卡关系 / 知识图谱设计

本文记录多世界 RP 框架中，角色卡本身的关系图谱、知识图谱、秘密信息、世界知识索引如何实现，以及如何与当前已拉取/搭载的参考项目结合。

## 1. 核心原则

角色卡不要承载所有图谱细节。建议拆分：

```text
Card              角色核心设定
RelationshipGraph 人物、势力、契约、敌友、情感、债务、承诺
KnowledgeGraph    世界知识、秘密、事件、地点、物品、力量体系、线索
SessionState      当前会话中已发生的变化
FrontendProjection 前端只读投影数据
```

这样可以避免角色卡膨胀，也方便多会话、多路线分别维护。

## 2. 数据层级

推荐层级：

```text
Campaign
  ├── Card
  ├── RelationshipGraph
  ├── KnowledgeGraph
  └── Session
      ├── SessionRelationshipDelta
      ├── SessionKnowledgeDelta
      ├── State
      └── Turns
```

含义：

- Campaign 图谱：世界初始关系与知识。
- Card 图谱：角色卡自带关系与专属秘密。
- Session Delta：当前会话造成的关系变化、知识揭露、秘密失效。
- Frontend Projection：把当前会话可见/GM 信息聚合成只读展示。

## 3. 关系图谱

关系图谱记录“谁和谁是什么关系”，但不仅是好感度。

### 3.1 节点类型

```text
character      人物
faction        势力
organization   组织
family         家族
party          队伍
contract       契约关系实体
location       地点势力节点
item           关键物品关联节点
```

### 3.2 边类型

```text
ally            同盟
enemy           敌对
family          亲属
mentor          师徒
rival           竞争
contract        契约
loyalty         忠诚
debt            债务
guilt           愧疚
fear            恐惧
trust           信任
affection       好感/亲密
suspicion       怀疑
ownership       持有/支配
command         上下级/命令链
secret-link     隐藏关联
```

### 3.3 关系字段

每条关系建议记录：

- 双方节点。
- 关系类型。
- 强度等级。
- 公开性。
- 玩家是否知道。
- GM 真相。
- 证据来源。
- 当前会话变化。

关系不是单值，而是多维。

例如一个角色可以同时对玩家：

```text
trust B
suspicion C
affection D
fear E
debt A
```

## 4. 知识图谱

知识图谱记录“世界中有哪些事实、概念、秘密、线索，以及它们如何连接”。

### 4.1 节点类型

```text
fact            事实
secret          秘密
rumor           传闻
event           事件
location        地点
faction         势力
character       人物
item            物品
vehicle         载具
construct       机械/构装体
power-system    力量体系
ability         能力
rule            规则/准则
clue            线索
quest           任务
memory          记忆
```

### 4.2 知识边类型

```text
causes          导致
reveals         揭示
contradicts     矛盾
requires        需要
located-in      位于
owned-by        拥有
belongs-to      隶属
teaches         传授
counters        克制
supports        支持
hides           隐藏
points-to       指向
```

### 4.3 可见性

每个知识节点都必须有可见性：

```text
public          玩家已知
private         角色知道但玩家不知道
gm-only         只有 GM/agent 知道
locked          条件满足后揭露
false-rumor     错误信息/谣言
```

这对前端很重要：

- 玩家面板只显示 `public`。
- GM 面板显示全部，但默认折叠。
- `locked` 显示为隐藏条目或不显示，取决于前端策略。

## 5. 与现有项目/skills 的结合

### 5.1 当前轻量 pi 方案

当前主方案仍是裸 pi 项目：

- `AGENTS.md` 只保留轻量索引。
- 重数据按需读取。
- 图谱以 JSON 文件持久化。
- 前端读取投影文件，只展示不编辑。

建议先从 JSON 图谱开始，不急着引入数据库。

### 5.2 tavern2agent

适合处理复杂 SillyTavern 卡：

- 从角色卡中提取人物、世界书、变量、状态栏、MVU。
- 将世界书条目转为 `KnowledgeGraph` 节点。
- 将角色关系、阵营、变量引用转为 `RelationshipGraph` 边。
- 将复杂状态栏转为 `SessionState`。

使用时机：

- 卡片有复杂世界书。
- 有 MVU / 变量 / 状态栏。
- 有多个角色、阶段、事件库。
- 需要把酒馆卡迁移为可维护的结构化数据。

### 5.3 pi-stage

适合未来做 pi 扩展式上下文装配：

- 将 KnowledgeGraph 的相关节点按当前输入检索。
- 将 RelationshipGraph 中与当前场景有关的边注入上下文。
- 只注入必要图谱子集，避免整图塞 prompt。
- 可把部分世界书/常开设定编译为 skill。

使用时机：

- 图谱数据变大。
- 需要自动上下文调度。
- 需要世界书触发、状态变量和 prompt 快照。
- 需要更接近运行时引擎的架构。

### 5.4 AIRP-MCP-Server

适合未来做 MCP 数据管理后端：

- 角色卡导入。
- 会话消息持久化。
- 世界书关键词扫描。
- 状态与记忆存取。
- 多会话、多角色、多场景数据管理。

结合方式：

- AIRP 负责数据读写和会话持久化。
- 本项目的图谱 JSON 可作为 AIRP 插件数据或 sidecar 数据。
- 前端仍读取投影文件，避免直接依赖 MCP。

使用时机：

- 希望角色卡、会话、状态由 MCP 工具统一管理。
- 需要跨客户端使用同一套 RP 数据。
- 会话和记忆规模变大。

### 5.5 叶啃啃 skill

不适合作为常驻规则。

适合用途：

- 文风修订。
- 正文质量审稿。
- 检查空洞动作、抽象情绪、段末装饰景物。
- 作为特定文风/编辑流程的可选增强。

不建议用于：

- 战斗框架判定。
- 图谱数据维护。
- 每轮默认加载。

## 6. 推荐实现路线

第一阶段：文件式图谱

```text
campaigns/<campaign-id>/graphs/relationship.graph.json
campaigns/<campaign-id>/graphs/knowledge.graph.json
campaigns/<campaign-id>/sessions/<session-id>.relationship-delta.json
campaigns/<campaign-id>/sessions/<session-id>.knowledge-delta.json
```

第二阶段：投影文件

```text
frontend/rp-panel/data/sessions/<campaign-id>/<session-id>.json
```

投影文件聚合：

- 当前角色卡。
- 当前会话正文。
- 玩家可见关系。
- 玩家可见知识。
- GM 隐藏关系。
- GM 隐藏知识。
- 状态、战斗、任务、线索。

第三阶段：按需接入 pi-stage 或 AIRP

- 数据规模小：继续 JSON 文件。
- 需要自动上下文装配：接 pi-stage。
- 需要 MCP 数据管理：接 AIRP-MCP-Server。

## 7. 前端展示建议

左侧：

- Campaign / Card / Session。
- 当前角色简表。

中间：

- 正文历史。
- 回合摘要。

右侧玩家区：

- 已知人物关系。
- 已知势力关系。
- 已知线索。
- 已知世界知识。
- 当前任务。

右侧 GM 折叠区：

- 隐藏关系。
- 隐藏身份。
- 未揭露知识。
- 谣言真假。
- 世界书触发记录。
- 本轮图谱变化。

## 8. 图谱更新原则

每轮结束后，agent 可以根据剧情更新 delta：

- 新认识人物：新增节点。
- 态度变化：新增或修改关系边。
- 获得线索：新增 knowledge 节点，visibility 设为 public。
- 发现谣言错误：将 rumor 标记为 false-rumor 或 contradicted。
- GM 暗线推进：更新 gm-only 节点或边。

不要直接改初始图谱，除非是世界设定被正式修订。会话变化优先写入 delta。

## 9. 最小可用组合

第一版只需要：

```text
relationship-graph-template.json
knowledge-graph-template.json
session-graph-delta-template.json
```

然后由前端投影文件读取并展示。
