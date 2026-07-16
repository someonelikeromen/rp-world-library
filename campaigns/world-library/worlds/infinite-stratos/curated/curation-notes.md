# Curation Notes — Infinite Stratos / 无限斯特拉托斯

## 归档范围

- 只处理 Infinite Stratos：`campaigns/world-library/imports/worldviews/infinite-stratos/README.md` 与 `worldbooks/无限斯特托拉斯.worldbook.json`。
- 已创建 baseline 7 文件，均位于：`campaigns/world-library/worlds/infinite-stratos/curated/`。

## 证据与取舍

- **evidenceLevel A**：作品常识与源文件均支持的核心事实，如 IS 通常仅女性可驾驶、一夏为男性例外、IS学园、主要角色关系、白式/红椿/蓝色眼泪等。
- **evidenceLevel B**：源文件明确出现但可能是RP改写或细节未完全确认的内容，如阿拉斯加条约在本源中的具体用法、银色福音与VT系统阴谋连接、部分初始好感度数值。
- **evidenceLevel C**：明显 AU 或沙盒扩展，如“青羽学园/Aethelgard Academy”“浮空都市艾茵多克”“核心网络”的具体机制、“学园地下束实验室”常驻设定等。

## 主要源内问题

1. 源标题写作“无限斯特托拉斯”，curated 统一为“无限斯特拉托斯”。
2. 世界书含大量写卡模板、模式提示、空白 Part、NSFW/文风流程内容；已剥离，不纳入核心世界规则。
3. 源中“青羽学园”与原作常识的“IS学园”冲突：baseline 默认使用 IS学园；青羽学园作为 AU 别名记录。
4. 源中“端白星AI”适合作为 RP 状态/伙伴机制，但不是 baseline 必开设定。
5. 源中好感度数值可作为开局关系参考，不应硬编码为唯一剧情路线。

## 验证状态

- 已写入文件：`README.md`, `world.json`, `source-registry.json`, `characters-index.json`, `knowledge-graph.json`, `relationship-graph.json`, `curation-notes.md`。
- JSON 文件按标准 JSON 书写，未使用注释或尾逗号；未运行外部 JSON 校验命令。
- mutation scope 遵守：仅在 `campaigns/world-library/worlds/infinite-stratos/curated/` 下创建/覆盖文件。

## 后续可选工作

- 若需要更原作向版本，可关闭/删除端白星AI、青羽学园、地下实验室、好感度数值等 AU 机制。
- 若需要更完整百科化，可补充各机体专页、IS世代/武装清单、亡国机业成员与原作事件年表。
