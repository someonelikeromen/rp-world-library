# memory

本目录保存 RP 长期记忆。新开局前可以保留本 README 作为结构说明，但具体剧情档案应为空或按用户要求清理。

## 文件职责

| 文件 | 职责 |
|---|---|
| `project.md` | 当前剧情、时间、地点、场景目标、伏笔、NPC 状态、当前世界局势 |
| `user.md` | 主角长期状态、能力/物品/关系摘要、关键选择 |
| `feedback.md` | 用户偏好、雷点、文风、节奏、尺度、纠正记录 |
| `world-history.md` | 多世界经历账本：所有经历世界、能量体系接触、跨世界关系、长期后果 |
| `card-status-snapshot.md` | `card_edit` 自动生成的角色卡状态摘要 |

## 多世界经历账本规则

`world-history.md` 是多世界长期 RP 的核心记忆文件。以下情况必须更新：

1. 进入新世界、离开世界、回访世界或世界线发生重大改变。
2. 首次接触某世界的能量体系、力量规则、语言/身体/灵魂/概念接口。
3. 获得跨世界能力、道具、知识、契约、奖励或可迁移关系。
4. 战斗评级、抗性、资源、适配限制因世界规则变化而改变。
5. 成就系统需要判断当前/历史世界是否存在能量体系或是否已接触能量体系。

每次更新 `world-history.md` 时，也要同步角色卡：

- `combat/world-adaptation.json`：世界适配、能量暴露、跨世界兼容。
- `combat/abilities.json`、`resources.json`、`resistances.json`：能力/资源/抗性变化。
- `knowledge/knowledge.json`：主角已知世界知识、秘密、误信。
- `combat/combat-log.json`：重大冲突和评级变化。

兑换系统启用时，以下内容也必须写入 `world-history.md`：

- 奖励点来源事件：重大事件、强敌、原著剧情改变、世界级长期影响。
- 每次兑换的来源世界、兑换项完整性说明、归档 ref 或双来源验证摘要。
- 体质/血统、能量基盘、能力、物品、知识或契约带来的跨世界长期影响。
- 队友契约绑定对象是否具备随主角穿越世界资格及其关系后果。
## `world-history.md` 推荐模板

```md
# World History

## Current World
- World ID:
- World Name:
- Status: current
- Current Location:
- Entry Method:
- Entered At:
- Has Energy System: true / false / unknown
- Energy Systems Encountered:
- Protagonist Exposure Level: none / observed / touched / usable / adapted / unknown
- Active Consequences:

## Experienced Worlds

### <world-id>
- Name:
- Status: current / visited / left / returned / altered / locked / destroyed
- First Entered At:
- Last Seen At:
- Exit Method:
- Has Energy System:
- Energy Systems Encountered:
- Protagonist Exposure Level:
- Key Events:
- Important Relationships:
- Acquired Abilities / Items / Knowledge:
- Open Consequences:
- Card Sync Notes:
```
