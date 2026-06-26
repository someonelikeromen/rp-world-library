# RP Panel Design

记录当前项目的 RP 展示前端目标。前端作为只读展示面板，不承担状态编辑。

## 定位

三栏式玩家 + GM 面板：

- 左侧：Campaign / Card / Session 选择器，可折叠。
- 中间：正文阅读区，可滚动查看历史。
- 右侧：玩家 + GM 信息面板，可折叠。

所有数据只展示，不编辑。状态变化由 pi / agent / 后端数据文件产生。

## 信息层级

```text
Campaign
  → Card
    → Session
      → Turn
```

- `Campaign`：一个世界、剧本、玩法企划。
- `Card`：企划内角色卡。
- `Session`：同一张卡的不同发展进度、路线或存档。
- `Turn`：一次用户输入 + AI 正文输出。

## 推荐目录结构

```text
campaigns/
└── <campaign-id>/
    ├── campaign.json
    ├── cards/
    │   └── <card-id>.json
    ├── sessions/
    │   └── <session-id>.json
    ├── state/
    │   └── <session-id>.state.json
    ├── turns/
    │   └── <session-id>.turns.json
    └── memory/
        └── <session-id>.project.md
```

前端可使用聚合投影文件：

```text
frontend/rp-panel/data/index.json
frontend/rp-panel/data/sessions/<campaign-id>/<session-id>.json
```

## 左侧栏

左侧栏默认显示文字卡片，不依赖头像或 PNG。

内容：

- Campaign 列表。
- 当前 Campaign 下的 Card 列表。
- 当前 Card 下的 Session 列表。
- 每条 Session 显示名称、状态、回合数、最后更新时间。

折叠后仅保留简短标识。

## 中间正文区

中间为主体验区，支持滚动查看历史。

每轮 Turn 建议展示：

- 回合号。
- 用户输入。
- AI 正文。
- 回合摘要。
- 建议行动 / 下一步钩子。
- 时间戳。

最新回合高亮或自动滚动到底部。

## 右侧面板

右侧包含玩家与 GM 数据。各模块可折叠。

玩家可见模块：

- 当前场景：时间、地点、天气、目标。
- 玩家状态：身份、状态、物品、能力、资源。
- 角色状态：主要 NPC、可见态度、最近行动。
- 关系：信任、好感、敌意、债务、承诺。
- 剧情：任务、线索、时间线、近期记忆。

GM 模块：

- 默认全折叠。
- 折叠时只显示标题，不暴露秘密内容。
- 可包含隐藏真相、后台 NPC、世界书命中、变量树、状态变更日志、agent 本轮摘要。

## 数据模型草案

`index.json` 用于左侧选择器：

```json
{
  "active": {
    "campaignId": "",
    "cardId": "",
    "sessionId": ""
  },
  "campaigns": []
}
```

`session-detail.json` 用于正文和右侧面板：

```json
{
  "campaign": {},
  "card": {},
  "session": {},
  "turns": [],
  "state": {
    "scene": {},
    "player": {},
    "characters": [],
    "relationships": [],
    "quests": [],
    "clues": [],
    "timeline": [],
    "memory": {},
    "gm": {}
  },
  "system": {}
}
```

## 当前决策

- 前端只读，不做状态编辑。
- 左侧卡片使用文字展示。
- 需要 Campaign 层，因为一个卡有多个不同发展进度的 Session 是常态。
- GM 面板默认全折叠。
- 正文历史可滚动查看。
- 前端目标已明确，后续重心转向角色卡设计。
