# RP Frontend

生成只读前端面板投影数据。需要输出状态面板/角色信息/地图视图时使用。

## 触发条件

- 用户要求查看状态或面板
- 战斗/探索后状态变化需投影
- 地图视图更新

## 输入

- Campaign / Card / Session
- Combatant / State / CombatLog
- RelationshipGraph / KnowledgeGraph
- Map / MapDelta

## 输出

- 玩家可见角色状态
- 玩家可见关系和知识
- 正文历史
- 地图视图
- GM 折叠信息

## 原则

- 前端只读，不直接改状态
- GM 面板默认完全折叠
- 玩家只看到 public/player-known 信息
- 投影文件可重建，非唯一真相来源
