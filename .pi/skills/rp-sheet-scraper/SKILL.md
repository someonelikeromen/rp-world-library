# RP Sheet Scraper

从腾讯文档在线表格爬取完整数据，保存为结构化 JSON 文件。

## 触发条件

- **"爬取曙光表"** → 爬取 曙光表（docId: `DVXdHdXNzZWdkQ01Z`），全量 7 tab
- **"爬取口述表"** → 爬取 无限口述规则云端版（docId: `DZFZQcGhmdWtXdHlK`），全量 10 tab
- 用户提供其他腾讯文档 URL 时同样触发

## 概述

腾讯文档使用 Canvas 渲染 + Protocol Buffer 内部存储，无法直接从 DOM 提取数据。本 skill 通过浏览器端 `SpreadsheetApp` 内部 API 直接读取 `cellDataGrid` 数据，绕过所有加密/压缩层。

## 已配置表格

| 简称 | 文档ID | Tab 数 | 本地目录 |
|------|--------|--------|---------|
| **曙光表** | `DVXdHdXNzZWdkQ01Z` | 7 | `曙光表数据/` |
| **口述表** | `DZFZQcGhmdWtXdHlK` | 10 | `无限口述规则数据/` |

爬取时按简称匹配，全量爬取所有 tab。

## 流程

### Step 1: 打开目标表格

从 `tools/config.json` 读取配置，按简称匹配：
- "曙光表" → docId=`DVXdHdXNzZWdkQ01Z`
- "口述表" → docId=`DZFZQcGhmdWtXdHlK`

对每个 tab：

### Step 2: 等待 SpreadsheetApp 初始化

```javascript
// 检查是否就绪
window.SpreadsheetApp?.behaviorApi?.sheetApi
```

### Step 3: 提取单个 sheet 数据

```javascript
const wm = window.SpreadsheetApp.behaviorApi.sheetApi.workbook
  .cellExtendedManager.workbookReference.worksheetManager;
const sheet = wm.sheetList[sheetIndex];
const blocks = sheet.cellDataGrid._kK;

const cells = {}; const seen = new Set();
for (const blockArr of blocks) {
  for (const block of blockArr) {
    const startRow = block._An;  // 块起始行
    const startCol = block._AN;  // 块起始列
    const rows = block._Ao;      // 行数据（稀疏数组）
    for (let ri = 0; ri < rows.length; ri++) {
      const rowCells = rows[ri];
      if (!rowCells || !Array.isArray(rowCells)) continue;
      for (let ci = 0; ci < rowCells.length; ci++) {
        const cell = rowCells[ci]; if (!cell) continue;
        let text = '';
        if (typeof cell.value === 'object' && cell.value !== null) {
          // 富文本：从 formattedValue 提取纯文本
          text = cell.formattedValue?.value || '';
        } else {
          text = String(cell.value || '');
        }
        if (text && text !== 'null' && text !== 'undefined') {
          const key = `${startRow + ri},${startCol + ci}`;
          if (!seen.has(key)) { seen.add(key); cells[key] = text; }
        }
      }
    }
  }
}
// 返回结构化数据
{ name: sheet._AnT, id: sheet._KL, cells }
```

### Step 4: 保存到本地

```bash
py -3.11 tools/scrape_sheet.py <表名>
```

或直接写入 JSON 文件到配置的 `localDataDir` 目录。

### Step 5: 循环所有 tab

对每个 tab ID，重复 Step 1-4。URL 切换会自动触发对应 tab 的数据加载。

**重要**：只有当前活动的 tab 才有数据。必须逐个打开。

## 数据结构

### cellDataGrid._kK 块结构

```typescript
interface CellBlock {
  _An: number;   // 起始行偏移
  _AN: number;   // 起始列偏移  
  _Ao: (Cell[] | undefined)[];  // 稀疏行数组
}

interface Cell {
  value: string | RichText;
  style: object;
  formattedValue?: { key: string; value: string };  // 富文本的纯文本版
}
```

### cellDataGrid 元数据

- `blockWidth` / `blockHeight`：块尺寸
- `usedRange`：实际使用的行列范围
- `_kK`：数据块数组

## 输出格式

每个 sheet 保存为一个 JSON 文件：

```json
{
  "name": "科技类",
  "id": "BB08J3", 
  "cells": {
    "32,64": "名称",
    "32,65": "支线剧情",
    "33,64": "ZEX速射发射器",
    "33,65": "D"
  }
}
```

文件命名：`{表名}_{sheet名}.json`

## 注意事项

1. **编码一致性**：使用 `JSON.stringify` 序列化后再用 `json.dump` 写入，避免中文引号导致的 JSON 语法错误
2. **稀疏行**：`_Ao` 中的行可能是 `undefined`（空行），需要检查 `Array.isArray`
3. **富文本**：`cell.value` 为对象时，纯文本在 `cell.formattedValue.value`
4. **URL 导航**：必须在 `open` 时指定 `tab=` 参数加载对应 sheet
5. **性能**：每 tab 约 5-15 秒（页面加载 + 数据提取），10 tab 的表约需 1-2 分钟
