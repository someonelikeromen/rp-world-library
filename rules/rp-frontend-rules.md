# RP Frontend Rules

## 面板目标

- 前端是只读 Player + GM 面板，不直接编辑状态。
- 左侧：Campaign / Card / Session / Map 选择器，默认可折叠。
- 中间：正文历史或地图主视图。
- 右侧：玩家信息和 GM 信息，GM 面板默认完全折叠。
- 左侧卡片使用文字，不依赖图片。

## 可见性

- 玩家区只显示 public / player-known 信息。
- GM 区显示 private / gm-only / locked / false-rumor，但默认折叠。
- 地图使用颜色、图标、标签和文字表达状态，不能只靠颜色。

## 数据来源

- 前端读取投影文件。
- 投影文件由 Campaign、Card、Session、Graph、State、Map 数据聚合生成。
- 战斗、图谱、地图变化写入 delta，再投影给前端。
