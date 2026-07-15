# RP Sheet Updater

基于腾讯文档「更新日志」sheet 的增量更新系统。拉取云端更新日志，与本地基线比对，识别变更，合并到本地数据文件。

## 触发条件

- **"更新曙光表"** / **"检查曙光表更新"** → 增量更新曙光表
- **"更新口述表"** / **"检查口述表更新"** → 增量更新无限口述规则
- "同步更新 XX表"、"拉取 XX表 最新更新" 也触发

## 概述

两个表各有独立的更新日志 sheet，记录所有兑换项的增删改。通过比对云端和本地缓存的更新日志，识别增量变更，再按需从云端获取对应 sheet 的完整数据并合并。

### 支持的表格

| 表名 | 文档ID | 更新日志 Tab | 日志列定义 |
|------|--------|------------|----------|
| 曙光表 | `DVXdHdXNzZWdkQ01Z` | `gj0akn` (规则书更新表) | 编号/名称/支线/分类/更新内容/作者/日期/原因 |
| 无限口述规则 | `DZFZQcGhmdWtXdHlK` | `soorea` (更新日志) | 名称/类别/支线等级/日期/更改内容/负责人/备注 |

## 流程

### Step 1: 打开更新日志 tab

```
agent_browser open "https://docs.qq.com/sheet/{docId}?tab={updateLogTabId}" -i
```

### Step 2: 提取更新日志

```javascript
const wm = window.SpreadsheetApp.behaviorApi.sheetApi.workbook
  .cellExtendedManager.workbookReference.worksheetManager;
const sheet = wm.sheetList[updateLogSheetIndex];
const blocks = sheet.cellDataGrid._kK;

// 提取所有 cell → 按行分组 → 过滤掉表头行
const cells = {}; const seen = new Set();
for (const blockArr of blocks) {
  for (const block of blockArr) {
    const startRow = block._An, startCol = block._AN, rows = block._Ao;
    for (let ri = 0; ri < rows.length; ri++) {
      const rowCells = rows[ri];
      if (!rowCells || !Array.isArray(rowCells)) continue;
      for (let ci = 0; ci < rowCells.length; ci++) {
        const cell = rowCells[ci]; if (!cell) continue;
        let text = typeof cell.value === 'object'
          ? cell.formattedValue?.value || ''
          : String(cell.value || '');
        if (text && text !== 'null' && text !== 'undefined') {
          const key = `${startRow + ri},${startCol + ci}`;
          if (!seen.has(key)) { seen.add(key); cells[key] = text; }
        }
      }
    }
  }
}

// 按行分组为条目数组
const rows = {};
for (const [k, v] of Object.entries(cells)) {
  const [r, c] = k.split(',').map(Number);
  if (!rows[r]) rows[r] = {};
  rows[r][c] = v;
}
const entries = [];
for (const r of Object.keys(rows).map(Number).sort((a, b) => a - b)) {
  if (r < dataStartRow) continue;  // 曙光表: 35, 无限口述: 34
  entries.push(rows[r]);
}

return JSON.stringify(entries);
```

### Step 3: 差异检测

```bash
py -3.11 tools/diff_updates.py <表名> <云端日志JSON文件> --apply
```

输出：
- `tools/updates/<表名>_更新日志.json` — 更新本地缓存
- `tools/updates/<表名>_pending_diff.json` — 待处理变更（新增/修改/删除）

### Step 4: 生成更新指令

```bash
py -3.11 tools/apply_updates.py <表名> [--dry-run]
```

按所属 sheet 分组输出操作指令。对于 exchange 类 sheet（科技/魔法传说/辅助/娱乐），标记需要从云端获取完整数据的条目。对于 meta/reference 类 sheet，标记为手动审阅。

### Step 5: 执行数据同步

对每个有变更的 exchange 类 sheet：

1. **打开对应 tab**：`agent_browser open "https://docs.qq.com/sheet/{docId}?tab={tabId}"`
2. **提取完整 sheet 数据**：使用 `rp-sheet-scraper` 的提取逻辑
3. **匹配待更新条目**：在新数据中按名称查找
4. **合并到本地文件**：
   - **新增**：将云端条目加入本地 cells
   - **修改**：替换对应行/列的 cell 值
   - **删除**：移除对应条目

### Step 6: 标记完成

```bash
py -3.11 tools/diff_updates.py <表名> <云端日志JSON> --apply
```

将当前云端日志更新为新的本地基线。

## 更新日志结构对照

### 曙光表 — 规则书更新表 (`gj0akn`)

| 列 | 字段 | 示例 |
|----|------|------|
| C64 | 编号 | `14648` |
| C65 | 名称 | `上帝之手` |
| C66 | 支线剧情 | `S` |
| C67 | 分类 | `魔法传说类` |
| C68 | 更新内容 | `调整` / `添加` / `删除` |
| C69 | 修改提议者/作者 | `洛小倾` |
| C70 | 更新时间 | `2026.7.12` |
| C71 | 调整/删除原因 | `调整描述与价格` |

数据起始行：35（34 是表头行）

### 无限口述规则 — 更新日志 (`soorea`)

| 列 | 字段 | 示例 |
|----|------|------|
| C64 | 名称 | `强化型GANTZ战甲` |
| C65 | 类别 | `科技类` |
| C66 | 支线等级 | `B` |
| C67 | 日期 | `2026.6.22` |
| C68 | 更改内容 | `添加` / `调整` / `删除` |
| C69 | 负责人 | `金银` |
| C70 | 备注 | `优化天赋相关描述并降价` |

数据起始行：34（33 是表头行）

## 工具链

```
tools/
├── config.json              # 表格配置
├── diff_updates.py          # 差异检测
├── apply_updates.py         # 更新指令生成
├── UPDATE_FLOW.md           # 详细操作流程
└── updates/                 # 本地缓存基线
    ├── 曙光表_更新日志.json
    └── 无限口述规则_更新日志.json
```

## 分类映射规则

更新日志中的「分类/类别」字段映射到 sheet 名称：

| 日志中分类 | 对应 Sheet |
|-----------|-----------|
| 科技类 | 科技类 / 科技类（枪械爆炸物载具） |
| 魔法传说类 | 魔法传说类 / 魔法传说类（超凡器具） |
| 辅助类 | 辅助类 / 辅助类（血统及技能） |
| 娱乐类 | 娱乐类 / 娱乐类（材料及药品） |

当分类名不完全匹配时，按最长公共子串匹配（如"科技类"匹配"科技类（枪械爆炸物载具）"）。

## 注意事项

1. **基线初始化**：首次使用时需将当前更新日志完整保存为基线
2. **双向同步**：本地修改不会自动回传云端；本工具只做云端→本地方向
3. **大变更处理**：如果更新日志条目超过 100 条，建议全量重新爬取而非增量合并
4. **分类歧义**：遇到无法匹配的分类名时，归入 `__unknown__` 并提示手动处理
