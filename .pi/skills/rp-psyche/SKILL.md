# RP Psyche — 角色心理模型

NPC角色心理一致性维护。使用 `knowledge/character-psyche/` 中的46个ACG心理模型。

## 触发条件

- 新NPC首次登场（需要建立行为框架）
- 已有NPC行为出现偏差（用户或剧情暗示角色"不对劲"）
- 角色关系发生重大变化（可能触发心理模型演化）
- 用户要求检查角色一致性

## 1. 数据位置

```
knowledge/character-psyche/
├── models-index.json     — 46个模型（name/summary/detail/psyche.essence/forbiddenRules）
├── knowledge-graph.json  — 模型关系（对立/组合/演化路径）
└── world.json            — 模型体系概览
```

## 2. 使用流程

### 新NPC登场

```
1. 查看角色卡或 characters-index 中的 psyche.primary 字段
   → 如果角色已分类，直接使用该模型
   → 如果未分类，按角色描述关键词在 models-index.json 中搜索匹配

2. 读取对应模型的 detail 字段
   → read knowledge/character-psyche/models-index.json
   → 搜索 "name": "模型名" 定位条目
   → 重点读取: psyche.essence, psyche.forbiddenRules

3. 将禁止规则作为 NPC 行为边界
   → 每个禁止规则 = 写这个角色时绝对不能做的事
   → 可以作为负面提示词参考
```

### 已有NPC行为检查

```
当 NPC 行为与以往不一致时：
1. 查 psyche.forbiddenRules — 是否违反了禁止规则？
2. 如果违反：回退到规则允许的行为
3. 如果符合规则但"感觉不对"：可能是角色在演化，查 knowledge-graph 的 evolves-to 路径
```

### 角色演化

```
当角色经历重大事件后：
1. 查 knowledge-graph.json 中该模型的 evolves-to 关系
2. 如果有对应路径，判定是否满足演化条件
3. 更新角色 psyche.primary → 新模型名
4. 例如：傲娇→纯娇（防御放下）、冷酷→温柔（冰融）、社恐→元气（治愈）
```

## 3. 模型组合

一个角色可以有主导模型 + 1-2个次要模型。查 knowledge-graph 的 combines-with 关系判断组合是否合理。

```
例：傲娇 + 大小姐 → 高位社交防御 × 认知真空 → 经典组合 ✅
例：病娇 + 支配 → 占有欲 × 控制欲 → 致命组合 ✅
例：傲娇 + 纯娇 → 对立（opposes）→ 不能同时存在 ❌
```

## 4. 禁止规则速查

| 模型 | 绝对禁止 |
|------|---------|
| 傲娇 | 全程毒舌无缝隙；对方真的受伤时不流露真实柔软 |
| 病娇 | 在未达崩溃阶段前伤害倾慕对象 |
| 理性 | 情绪化感性冲动主导决策 |
| 冷酷 | 轻易流露情感；为小事激动 |
| 热血 | 在绝境中选择放弃 |
| 腹黑 | 暴露真实意图 |
| 忠诚 | 在最终抉择时把自身安全放在效忠对象之前 |
| 社恐 | 主动发起大规模社交 |

## 5. Token 控制

- 不一次性加载全部 46 模型
- 用 grep 定位目标模型 → read offset limit 精读
- 每个模型 detail 约 500-1500 字，单次加载 1-3 个模型
- 同场景同一 NPC 不重复加载同一模型

## 关联 Skills

- `rp-engine`：RP主引擎（NPC生成时引用）
- `rp-world-search`：世界信息搜索（角色数据源）

## 6. OOC 风险分类辅助

心理模型不仅检查“性格标签”，还要协助排查以下 OOC：

- 动机 OOC：行为是否背离核心欲望、恐惧、底线和长期目标。
- 关系 OOC：亲密、敌意、羞耻、依赖、支配、忠诚是否跳级。
- 情绪惯性 OOC：情绪是否有延续和恢复过程。
- 语言 OOC：话语是否符合表达习惯、身份和心理防御方式。
- 风险判断 OOC：角色面对危险、诱惑、羞辱、利益时是否符合其心理模型。
- 成长 OOC：演化是否有事件压力、反复、代价，不瞬间换人格。

若角色行为违反 `psyche.forbiddenRules`，默认回退；除非存在强压力、控制、污染、伪装、长期伏笔或明确演化条件。
