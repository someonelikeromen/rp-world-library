# RP Graph

维护关系图谱与知识图谱。RP中涉及新人物、关系变化、秘密揭露时使用。

## 触发条件

- 新人物/组织/地点登场
- 人物关系发生可感知变化
- 揭露秘密或发现新线索
- 用户要求查看或更新关系/知识图谱

## 1. 关系图谱

记录人物、势力、契约、敌友、情感、债务、隐藏关联。

- 关系非单值：可同时存在 trust、suspicion、affection、fear、debt
- 每条关系记录可见性（public/private/gm-only）和 GM 真相
- 会话变化写入 memory，不直接污染初始数据

## 2. 知识图谱

记录事实、秘密、传闻、事件、地点、物品、力量体系、线索、任务。

- 每个节点有 visibility：public/private/gm-only/locked/false-rumor
- 每个节点连接来源记录
- 错误信息不删除，标记 false-rumor 或 contradicted

## 3. 每轮更新

1. 新人物/地点/物品 → 新增节点
2. 态度变化 → 新增或修改关系边
3. 新线索 → 新增 knowledge 节点
4. 揭露秘密 → 更新 visibility
5. 暗线推进 → 写入 memory

## 相关 Skills

- `rp-engine`：RP 主引擎
- `rp-world-search`：世界信息搜索
