# md_edit — Markdown 增量编辑工具

项目扩展工具，AI 可直接调用。用于安全地局部维护 Markdown 文件，避免整篇重写。

## Actions

| Action | 用途 |
|--------|------|
| `get` | 读取整个文件、指定 heading 章节、anchor 行或精确文本块 |
| `insert` | 在 heading / anchor / 文件开头或结尾插入内容 |
| `replace` | 替换指定 heading 章节正文，或替换唯一精确文本块 |
| `append` | 向指定 heading 章节末尾或文件末尾追加内容 |
| `remove` | 删除指定 heading 章节或唯一精确文本块 |
| `upsert-section` | heading 存在则更新正文，不存在则追加新章节 |
| `upsert-list-item` | 在指定章节内按 key 新增或更新列表项 |
| `upsert-table-row` | 在指定章节内按 keyColumn + key 新增或更新表格行 |
| `validate` | 检查标题层级跳跃、重复标题/锚点、表格分隔行等 |

## 定位方式

| 参数 | 示例 | 说明 |
|------|------|------|
| `heading` | `## 统一角色卡与状态原则` | 精确匹配标题行，并定位整个章节 |
| `anchor` | `<!-- md-edit:core -->` | 精确匹配唯一锚点所在行 |
| `text` / `oldText` | 一段完整文本 | 必须唯一匹配，避免误替换 |
| `key` | `md_edit` | 用于列表项或表格行增量更新 |
| `keyColumn` | `Action` 或 `0` | 表格 key 所在列名或列索引 |

## 安全规则

- 只允许编辑 `.md` 文件。
- 禁止绝对路径和 `..` 路径。
- mutation 默认写入备份到 `backup/md-edits/`。
- 所有 mutation 支持 `dryRun: true`。
- 精确文本替换要求唯一匹配。
- heading 定位要求标题唯一匹配。

## 示例

读取指定章节：

```json
{ "action": "get", "file": "rules/rp-core-rules.md", "heading": "## 统一角色卡与状态原则" }
```

更新或新增章节：

```json
{ "action": "upsert-section", "file": "rules/rp-core-rules.md", "heading": "## 新规则", "content": "- 新规则内容。" }
```

更新列表项：

```json
{ "action": "upsert-list-item", "file": "AGENTS.md", "heading": "## 核心工具（AI 可直接调用）", "key": "`md_edit`", "content": "- `md_edit`：Markdown 增量编辑工具。" }
```

更新表格行：

```json
{
  "action": "upsert-table-row",
  "file": "docs/md-edit-tool.md",
  "heading": "## Actions",
  "keyColumn": "Action",
  "key": "`validate`",
  "row": ["`validate`", "检查标题层级、重复标题/锚点、表格格式"]
}
```
