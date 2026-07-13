# RP Exchange

主角专属可选兑换系统。依据多世界战斗框架，将完整的体质/血统、能量基盘、能力、技艺传承、物品、知识和限定契约兑换为可落盘的角色卡状态。

## 触发条件

- 用户明确启用兑换系统。
- 用户要求查看兑换面板、兑换列表、奖励点余额。
- 用户要求兑换某项内容。
- 用户要求将成就系统奖励转为奖励点。

## 核心规则

- 只给主角，不给 NPC。
- 默认关闭；只有用户明确启用才进入。
- 高强度兑换仅通过价格区分，不增加前置、适配期、弱化、拆分或其他限制。
- 价格只由兑换项自身 N0–N24 层级决定；不受主角、当前世界、稀有度、唯一性、适配度影响。
- 兑换项必须完整：禁止碎片、残缺版、试用版、弱化版、单招、拆分原有完整内容。
- 非归档世界兑换必须至少双来源验证；来源冲突或不足时不可兑换。
- 奖励点只能来自重大事件、击败强敌、改变原著剧情、对世界造成大规模或长时间影响等；禁止资源转换、出售、献祭、刷普通任务。
- 不支持系统类兑换。系统自带仅限基本语言、初始身份、状态/兑换面板显示。

## 支持兑换类型

1. `physique_bloodline`：体质、血统、种族、器官、生命形态、灵魂性质。
2. `energy_foundation`：魔力、查克拉、灵力、咒力、念、小宇宙、气/斗气/仙力、神力接口等能量基盘。
3. `foundation_based_ability`：依赖特定能量基盘的能力、术式、权能、技能。
4. `non_foundation_body_soul_technique`：不依赖能量基盘的肉身/灵魂能力与完整技艺流派传承，如格斗术、剑术、暗杀术、武术、完整职业模板。
5. `item`：物品、道具、武器、防具、神器、药物、装备、材料、载具等。
6. `knowledge`：技术、理论、修炼、医疗、锻造、学科、工艺等知识；不包括剧情情报、未来情报、NPC 秘密、攻略。
7. `contract`：仅限使魔契约、召唤指定人物契约、队友契约（绑定后可一起穿越世界）。

## 奖励点

- 货币名：`1级奖励点`、`2级奖励点`、`3级奖励点`……
- 默认进位：1000 个低一级奖励点 = 1 个高一级奖励点。
- 价格表读取 `data/rp-exchange/settings.json`。

## 兑换流程

1. 确认兑换系统已启用。
2. 读取角色卡 `progression/exchange.json`、`combat/world-adaptation.json`、`memory/world-history.md`。
3. 确认兑换项类型属于支持范围。
4. 依据多世界战斗框架判定兑换项自身 N 层级。
5. 按 `settings.priceByN` 计算价格；不得因其他因素改价。
6. 来源验证：
   - 已归档世界：用 `world_query` 查询并记录 sourceRef。
   - 非归档世界：联网或外部来源至少双来源验证。
7. 完整性验证：必须是原著或设定中可独立成立的完整单位。
8. 用户确认兑换后扣除奖励点。
9. 写入 `completedExchanges`/`transactions`，并同步具体角色卡模块。
10. 更新 `memory/world-history.md`，记录来源世界、兑换内容、长期后果与卡模块同步说明。

## 成就系统联动

若启用联动：

- 成就系统不再随机生成原著奖励。
- 成就达成后直接发放奖励点。
- 成就记录仍写入 `progression/achievements.json`。
- 奖励点与交易写入 `progression/exchange.json`。

## 落盘模块

- `progression/exchange.json`：兑换系统状态、余额、交易、来源验证。
- `combat/world-adaptation.json`：能量基盘、跨世界同行契约、适配状态。
- `combat/life-profile.json`、`attributes.json`、`resources.json`、`abilities.json`、`resistances.json`：体质/能力/资源/抗性。
- `inventory/items.json`：物品道具。
- `knowledge/knowledge.json`：非情报类知识。
- `social/relationships.json`：使魔/召唤/队友契约关系。
- `combat/combat-log.json`：重要兑换造成的评级变化。
- `memory/world-history.md`：叙事履历与跨世界长期后果。

## 读取规则

- 正式规则：`rules/rp-exchange-system.md`
- 使用说明：`docs/rp-exchange-system.md`
- 数据目录：`data/rp-exchange/`
- 多世界框架：`.pi/skills/rp-combat/framework/README.md` 与按需模块
