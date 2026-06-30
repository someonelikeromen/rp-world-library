# World Query Tool

项目本地 Pi 扩展：`.pi/extensions/world-query.ts`

配置入口：`.pi/rp-data-tools.json`

用途：给 AI 一个专门的世界书查询工具，避免每次手动 `grep/read` 大型 JSON。工具按当前归档结构渐进式加载：

1. 查询 `campaigns/world-library/.wl-index.json`。
2. 若世界为 `curated`，优先查：
   - `world.json`
   - `characters-index.json`
   - `stories/*/index.json` 与章节 `.md`
   - `world-rules/*.md`
   - `source-registry.json`
3. 若世界为 `raw`，fallback 到：
   - `campaigns/world-library/imports/worldviews/<slug>/worldbooks/*.json`
4. 返回稳定 `ref`，后续用 `action: "get"` 精确取全文。
5. 自动截断大输出，并把完整结果保存到临时文件。

## 工具名

`world_query`

## 参数

```ts
{
  action: "worlds" | "overview" | "search" | "get" | "characters" | "stories",
  world?: string,
  query?: string,
  ref?: string,
  category?: "all" | "character" | "world" | "story" | "rule" | "raw" | "source" | "graph",
  storyId?: string,
  chapter?: string,
  status?: "all" | "curated" | "raw",
  limit?: number,
  includeContent?: boolean,
  maxBytes?: number
}
```

## 常用调用

### 列出世界

```json
{ "action": "worlds" }
```

### 搜索世界

```json
{ "action": "search", "world": "type-moon-nasuverse", "query": "远坂凛" }
```

### 取搜索结果全文

```json
{ "action": "get", "ref": "char:type-moon-nasuverse:fsn-rin" }
```

### 查角色列表

```json
{ "action": "characters", "world": "high-school-dxd", "query": "莉雅丝" }
```

### 查故事索引

```json
{ "action": "stories", "world": "type-moon-nasuverse" }
```

### 查某故事章节列表

```json
{ "action": "stories", "world": "type-moon-nasuverse", "storyId": "fgo" }
```

### 读某章节

```json
{ "action": "stories", "world": "type-moon-nasuverse", "storyId": "fgo", "chapter": "冬木" }
```

## 启用方式

扩展位于项目本地 `.pi/extensions/`，保存后在 Pi 中执行 `/reload`，随后工具应出现在 AI 可用工具列表中。

## 自扩展方式

世界书根目录、索引位置、curated/raw 目录和未来扩展槽都在 `.pi/rp-data-tools.json` 的 `worldLibrary` 下配置：

```json
{
  "worldLibrary": {
    "root": "campaigns/world-library",
    "index": ".wl-index.json",
    "curatedDir": "worlds",
    "rawWorldviewsDir": "imports/worldviews",
    "extensionSlots": {
      "customSearchProviders": [],
      "customRefResolvers": [],
      "rankingRules": []
    }
  }
}
```

后续可在扩展槽中加入自定义检索器、ref 解析器、排序规则；当前版本先保留配置位，核心逻辑仍内置于 `.pi/extensions/world-query.ts`。

## 注意

- `characters-index.json` 可能很大，AI 应优先 `search` / `characters`，不要直接 read 全文件。
- `raw` 世界尚未结构化，工具只能按 worldbook entry 搜索并返回原条目。
- 用户修正 > curated > raw worldbook。
