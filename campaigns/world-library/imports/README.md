# World Library Imports

本目录存放从 `imports/raw/world-sources` 处理出的世界资料导入结果。

## 当前规则

- 原始文件不在此处修改，保留在 `imports/raw/world-sources/`。
- PNG 图片单独放在 `images/`。
- PNG 中嵌入的角色卡 JSON 已提取到工作目录，随后只抽取其中的 `character_book.entries[]`。
- 角色卡本体的人设、开场白、性格等不进入世界书池；当前需求只保留世界相关内容。
- 原始 JSON 如果是顶层 `entries` 世界书，直接转为待审计世界书。
- 所有世界书条目后续需要按 tavern2agent 的 disposition 思路审计：data / mechanic / event-pack / setup / progressive / prompt-style / discarded。

## 目录

- `worldbooks-pending/`：统一世界书候选池，等待后续解析、审计、分类、去重。
- `images/`：原始 PNG 图片/卡图归档。
- `reports/`：提取和结构扫描报告。

## 后续计划

1. 为 `worldbooks-pending/` 建立索引：文件名、标题、条目数、来源类型。
2. 按世界名/作品名分组，但暂不合并正文。
3. 对每条世界书条目做 disposition：稳定资料、机制规则、事件包、开局设置、渐进揭露、文风、丢弃。
4. 写入 `source-registry`，记录原始文件、PNG 来源、用户修正和解析工具。
5. 生成正式 `campaigns/world-library/worlds/<world-id>/` 数据。
