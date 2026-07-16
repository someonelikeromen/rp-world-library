# 腾讯文档增量更新 - Pi Agent 操作流程

## 功能

从腾讯文档拉取「更新日志」sheet，与本地缓存比对，识别增量变更，并更新本地数据文件。

## 触发条件

用户说：
- "检查 XX表 是否有更新"
- "同步更新 XX表"
- "拉取 XX表 最新数据"

## 流程

### Step 1: 打开更新日志 tab
```
打开 {配置中的 updateLogTab.id} tab 的腾讯文档 URL
```

### Step 2: 提取更新日志数据
使用 agent_browser eval 提取更新日志 sheet 的 cellDataGrid 数据。
将提取的数据保存为 JSON 字符串。

### Step 3: 差异检测
```bash
py -3.11 tools/diff_updates.py <表名> <云端日志JSON路径> --apply
```
这会生成:
- `tools/updates/<表名>_更新日志.json` (更新后的本地缓存)
- `tools/updates/<表名>_pending_diff.json` (待处理的变更)

### Step 4: 生成更新指令
```bash
py -3.11 tools/apply_updates.py <表名> [--dry-run]
```
这会输出需要执行的更新操作，按所属 sheet 分组。

### Step 5: 执行更新
对每个需要更新的 exchange 类 sheet：
1. 打开对应的 tab URL
2. 提取完整 sheet 数据
3. 在数据中匹配待更新的条目名称
4. 合并到本地 JSON 文件

对 meta/reference 类 sheet：
- 提示用户手动审阅

### Step 6: 清理
```bash
py -3.11 tools/diff_updates.py <表名> --apply
```
标记所有变更已处理。

## 浏览器数据提取代码模板

### 提取更新日志
```javascript
// 当前 tab 应该是更新日志
const s = window.SpreadsheetApp.behaviorApi.sheetApi.workbook
  .cellExtendedManager.workbookReference.worksheetManager.sheetList[更新日志索引];
const bl = s.cellDataGrid._kK; 
const entries = [];
const cols = [64,65,66,67,68,69,70,71]; // 根据配置调整

for (const ba of bl) for (const b of ba) {
  const sr=b._An, rs=b._Ao;
  for (let ri=0; ri<rs.length; ri++) {
    const rc=rs[ri];
    if (!rc || !Array.isArray(rc)) continue;
    const entry = {};
    for (let ci=0; ci<rc.length; ci++) {
      const c=rc[ci];
      if (!c) continue;
      let t = typeof c.value==='object' ? c.formattedValue?.value||'' : String(c.value||'');
      if (t && t!=='null' && t!=='undefined') {
        entry[String(sr + ri + ci)] = t;
      }
    }
    if (Object.keys(entry).length > 0) entries.push(entry);
  }
}
JSON.stringify(entries);
```

### 提取完整 sheet 数据
```javascript
const s = window.SpreadsheetApp.behaviorApi.sheetApi.workbook
  .cellExtendedManager.workbookReference.worksheetManager.sheetList[sheet索引];
const cs={}; const sn=new Set();
for(const ba of s.cellDataGrid._kK) for(const b of ba) {
  const sr=b._An, sc=b._AN, rs=b._Ao;
  for(let ri=0;ri<rs.length;ri++) {
    const rc=rs[ri];
    if(!rc||!Array.isArray(rc)) continue;
    for(let ci=0;ci<rc.length;ci++) {
      const c=rc[ci]; if(!c) continue;
      let t=typeof c.value==='object'?c.formattedValue?.value||'':String(c.value||'');
      if(t&&t!=='null'&&t!=='undefined') {
        const k=`${sr+ri},${sc+ci}`;
        if(!sn.has(k)){sn.add(k);cs[k]=t;}
      }
    }
  }
}
JSON.stringify({n:s._AnT,id:s._KL,c:cs});
```

## 支持的表格

| 表名 | 文档ID | 更新日志 Tab |
|------|--------|------------|
| 曙光表 | DVXdHdXNzZWdkQ01Z | gj0akn (规则书更新表) |
| 无限口述规则 | DZFZQcGhmdWtXdHlK | soorea (更新日志) |
