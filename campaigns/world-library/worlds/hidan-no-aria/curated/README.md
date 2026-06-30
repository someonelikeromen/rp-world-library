# 绯弹的亚里亚 / Hidan no Aria — Curated World Baseline

本目录是从原始 SillyTavern/worldbook 导入资料整理出的 pi-rp 世界资料 baseline。目标是便于 RP 快速启用，而不是穷尽全卷设定。

## 文件

- `world.json` — 世界观、武侦制度、东京武侦高中、等级/科别、组织、色金与超侦、地点、规则、时间线。
- `source-registry.json` — 原始文件登记、条目数、常用条目引用索引。
- `characters-index.json` — 主要角色索引（20 人），含所属、能力、RP hook、sourceRefs。
- `knowledge-graph.json` — 制度、组织、力量系统、地点与关键概念图谱。
- `relationship-graph.json` — 主要角色、队伍、组织与血脉关系图谱。
- `curation-notes.md` — 整理原则、证据等级、风险与后续建议。

## 快速使用建议

推荐默认舞台：东京武侦高中及东京湾都市圈。默认时间点可设为巴斯克维尔小队已成形、伊·幽后秩序动荡已显现，但 `N`、莱克忒亚、第三次接轨等高阶危机尚未全面爆发。

RP 重点：

1. 武侦执照与武侦法限制角色行为：优先逮捕、保护平民、相信伙伴。
2. 科别分工驱动组队：强袭、侦探、狙击、谍报、装备、车辆等互补。
3. 能力必须有代价：HSS 有身体/脑神经风险；色金有心智侵蚀；超侦能力受媒介、环境或体力制约。
4. 校园喜剧可以与跨国阴谋并存，但世界级设定建议由 GM 明确开启。

## Source refs

引用格式如 `wb:4`，指向：

`campaigns/world-library/imports/worldviews/hidan-no-aria/worldbooks/緋彈的婭莉婭.worldbook.json` 中 `entries[].index == 4` 的条目。

原始导入 README 记录 worldbook entries: **192**。

## 证据等级

- `A`：原始 README 或 worldbook 条目直接支持。
- `B`：原始条目支持，并结合常识性作品知识做了压缩归纳。
- `C`：源内表述不稳定、过度细节化或需要 GM 进一步确认。

## 验证状态

已创建 baseline 7 文件。当前工具集没有 JSON 解析/命令执行工具，未运行语法校验；JSON 文件按严格 JSON 手写，建议上游使用 `jq`、Node/Python JSON parser 或项目校验器复验。
