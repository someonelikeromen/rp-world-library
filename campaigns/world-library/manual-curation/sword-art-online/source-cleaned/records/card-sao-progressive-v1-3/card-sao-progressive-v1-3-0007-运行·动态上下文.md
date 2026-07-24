# 运行·动态上下文

**Unit ID:** `card-sao-progressive-v1-3-0007-运行·动态上下文`

**来源:** `card-sao-progressive-v1-3` (SAO Progressive v1.3 character card)

**来源索引:** data.character_book.entries[7]

**元数据：**
- 启用 (enabled): true
- 常量 (constant): true
- 选择性 (selective): false
- 位置 (position): after_char（角色定义之后插入）
- 匹配键 (keys): 无
- 次级匹配键 (secondaryKeys): 无

**分类 (categories):** factions, events, systems, engine-rules, runtime-prompts, abilities, mixed

---

## 预处理逻辑

该条目包含一段预处理脚本，在每次运行时根据 `stat_data` 消息变量动态构建上下文。预处理步骤为：

1. 从 `stat_data` 提取原始数据（世界、玩家、角色、任務、系統）
2. 构建 `safeGet` 安全访问工具函数
3. 收集当前场景角色ID、队伍成员ID
4. 过滤出活跃任务（状态为：候选、可接取、進行中），并提取参与者ID
5. 合并所有相关角色（场景角色 + 队伍成员 + 活跃任务参与者/发起者）
6. 构建背包摘要（模板ID、顯示名稱、類別、子類、品質、數量、耐久、可交易、鑑定狀態）
7. 提取装备数据
8. 尝试调用 `SAOP_V5_API.derivedStats` 计算衍生显示值
9. 提取待確認行動和最近8条行動日誌

---

## 运行时上下文模板（默认值展示）

**时间地点：** 2022-11-06 13:25 ｜ 第1层 ｜ 起始之镇 ｜ 中央广场 ｜ 圈内

**场景：** 日常 ｜ **天气：** 晴

**玩家：** 主角 ｜ LV.1 ｜ EXP 0/100 ｜ HP 250/250 ｜ STR 5 ｜ AGI 5 ｜ 可分配 0 ｜ 500 Col

**衍生显示值（只读、由脚本即时计算）：** 调用 SAOP_V5_API.derivedStats() 实时生成

**装备：** 从 stat_data.玩家.裝備 动态提取

**背包摘要：** 从 stat_data.玩家.背包 动态提取，包含以下字段：
- 模板ID、顯示名稱、類別、子類、品質、數量、耐久、可交易、鑑定狀態

**技能：** 从 stat_data.玩家.技能 动态提取

**队伍：** 从 stat_data.玩家.隊伍 动态提取

**当前遭遇：** 从 stat_data.世界.當前遭遇 动态提取

**当前楼层档案：** 从 stat_data.世界.當前樓層檔案 动态提取

**当前相关角色：** 由场景角色ID、队伍成员ID、活跃任务参与者/发起者ID合并过滤

**活动任务：** 状态为「候选」「可接取」「進行中」的任务

**当前事件：** 从 stat_data.世界.事件 动态提取

**当前组织：** 从 stat_data.世界.組織 动态提取

**待确认行动：** 从 stat_data.系統.待確認行動 动态提取

**最近确定性日志：** 最后8条 stat_data.系統.行動日誌

---

## AUTHORITY（权威规则）

1. **正文只叙事**，不输出变量标签；额外变量模型负责直接变量更新或建立 UnifiedAction。
2. **Col、HP、经验、属性、背包、装备、技能、队伍、好感数值、耐久、状态、时间、跨楼层移动与所有结算结果**，只能由 v5 唯一调度器更新。
3. **钓鱼与采集**可由文字行动建立「生活技能」行动。玩家自己的锻造、裁缝、料理、鉴定可由面板建立行动。
4. **NPC 可提供固定价格、固定材料、固定产出的简化服务**，包括修理、鉴定、旅店、固定料理、交通、锻造委托、裁缝委托、料理委托与鉴定委托；不模拟 NPC 熟练度、成功率、工作台或代工队列。
5. **确定性结果**只采用 MVU 最终值与「系統.行動日誌」。没有完成日志前，只能描写提案、尝试、等待确认或服务受理。
6. **未列入当前相关角色的离场人物**不得逐回合更新。再次接触时再依时间与已发生事件一次补算。

---

## 扩展配置（rawEntry.extensions）

- **display_index:** 7
- **probability:** 100（始终插入）
- **position:** 4 (after_char)
- **depth:** 5
- **role:** 0
- **sticky:** 0
- **selectiveLogic:** 0
- **exclude_recursion:** true
- **prevent_recursion:** true
- **useProbability:** true
- **use_group_scoring:** false
- **group_weight:** 100
- **group:** 空
- **group_override:** false
- **vectorized:** false
- **ignore_budget:** false
- **delay:** 0
- **cooldown:** 0
- **match_whole_words:** null
- **case_sensitive:** null
- **scan_depth:** null
- **triggers:** 无
- **outlet_name:** 空
- **automation_id:** 空
- **match_character_description:** false
- **match_character_personality:** false
- **match_character_depth_prompt:** false
- **match_persona_description:** false
- **match_scenario:** false
- **match_creator_notes:** false
- **delay_until_recursion:** false

---

## 条目摘要

此条目是 SAO Progressive v1.3 角色卡的核心**动态上下文**条目，属于引擎/运行时基础设施层，不是一个叙事条目。它在每个回合的「角色定义之后」插入，通过预处理脚本动态计算并展示当前游戏状态的全部关键数据：时间地点、玩家状态、装备、背包、技能、队伍、活跃任务、相关角色、待确认行动及最近日志，同时附带权威规则（AUTHORITY）约束叙事模型的行为边界。该条目是 SAO V5 规则引擎的枢纽，桥接统计数据和叙事模型，确保两者保持一致性。
