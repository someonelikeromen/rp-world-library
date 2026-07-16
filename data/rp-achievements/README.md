# RP Achievements Data

成就系统数据目录。

## 核心原则

- 本目录不维护“基础奖励池”。
- 奖励候选在成就触发后即时生成，仍然从全局动漫/游戏/作品范围随机，不按当前/经历世界限制来源。
- `settings.json` 是成就系统自身设定源；`init/status/build-rd100/roll-world/claim/validate` 都必须主动读取它。
- `examples/instant-candidates/` 只放示例，不作为可直接抽取的基础池。
- 奖励内容与成就内容无关：成就只提供一次奖励生成/领取资格与成就等级，不决定奖励题材、作品、能力类型或具体内容。
- 已归档世界不需要联网核实作品存在；未归档世界与随机动漫/游戏世界必须联网核实作品和具体奖励存在。
- 已有、已领取、待领取奖励不能重复。

## 抽奖与能量门

- 抽奖范围保持全局随机。
- 当前世界与经历过的世界只用于判断主角是否接触过能量体系。
- 如果当前与过去经历世界均明确为无能量体系，抽到能量依赖奖励时必须重抽。
- 如果当前或任一经历世界存在能量体系，则能量类奖励允许进入候选，但仍需验证、去重和来源字段完整。
- 未知能量接触状态默认允许但应带警告，不静默当作无能量。

## 奖励来源字段

所有奖励类型都必须附带来源履历，不只限招式传承类：

- `origin.sourceWorld`：来源作品/世界。
- `origin.originalOwner`：原主人、原使用者、原传承者或来源群体。
- `origin.originalOwnerExperience`：原主人使用经验。
- `origin.realmOrStage`：境界、阶段或对应水平。
- `origin.masteryLevel`：熟练度/掌握程度。
- `origin.protagonistCurrentUsability`：主角当前可发挥程度。
- `origin.limitations`：限制、消耗、启动条件或适配要求。

## 光屏显示

`achievement_edit status` 的显示协议由 `settings.json` 驱动，固定为半透明淡蓝色科幻 UI，输出：

- 成就列表。
- 对应奖励。
- 是否已领取/待领取。
- 人物状态。
- 当前/经历世界能量判定摘要。
