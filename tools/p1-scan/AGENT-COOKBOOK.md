# json-tool.cjs — 子 agent 使用指南

> 此工具供子 agent 通过 `bash` 调用，用于所有 JSON 读写操作。
> **禁止直接手写 JSON 字符串到文件**，必须通过此工具。

---

## 一、为什么需要这个工具

| 问题 | agent 手写 JSON | ✅ 用 json-tool |
|:-----|:----------------|:----------------|
| 中文引号 `"` 未转义 | ❌ 18% 的文件损坏 | ✅ 工具处理转义 |
| 逗号位置错误 | ❌ 常见 | ✅ 确定性操作 |
| periods 追加时破坏已有结构 | ❌ 常见 | ✅ `append` 保证正确 |
| id selector 定位错误 period | ❌ 手动遍历易错 | ✅ `periods[period_id=vol-06]` 精确匹配 |
| 合并时字段名不一致 | ❌ 不同 agent 写不同名字 | ✅ 模板驱动 + 确定性操作 |

---

## 二、基础命令

### 2.1 读 JSON

```bash
# 读取完整文件
node tools/p1-scan/json-tool.cjs read characters/aria.json

# 读取子路径
node tools/p1-scan/json-tool.cjs read characters/aria.json periods
node tools/p1-scan/json-tool.cjs read characters/aria.json 'periods[period_id=vol-29]'
node tools/p1-scan/json-tool.cjs read characters/aria.json 'name.zh'

# 统计数组长度
node tools/p1-scan/json-tool.cjs count characters/aria.json periods
```

### 2.2 新建文件（从模板）

```bash
# 从模板文件创建
node tools/p1-scan/json-tool.cjs create characters/kinji.json @_templates/character.json

# 从内联 JSON 创建
node tools/p1-scan/json-tool.cjs create characters/kinji.json '{"_schema":"rp-character-v3","character_id":"kinji","periods":[]}'
```

### 2.3 追加到数组

```bash
# 追加一个 period 到角色文件
node tools/p1-scan/json-tool.cjs append characters/aria.json periods @new-period.json

# 注意：复杂 JSON 值用 @file 引用，避免命令行转义问题
# 先用 write 写一个临时文件，再用 @file 引用
```

### 2.4 设置字段

```bash
# 设置简单值
node tools/p1-scan/json-tool.cjs set characters/aria.json status '{"occupation":"侦探科","location":"东京"}'

# 更新特定 period 内的字段
node tools/p1-scan/json-tool.cjs set characters/aria.json 'periods[period_id=vol-06].status' '{"rank":"A"}'
```

### 2.5 深度合并

```bash
# 合并新数据到已存在的对象
node tools/p1-scan/json-tool.cjs merge characters/aria.json 'periods[period_id=vol-29]' @new-data.json
```

### 2.6 删除

```bash
# 删除字段
node tools/p1-scan/json-tool.cjs remove characters/aria.json 'periods[period_id=vol-06].possessions_new'

# 删除数组项
node tools/p1-scan/json-tool.cjs remove characters/aria.json 'periods[period_id=vol-06]'
```

### 2.7 批量操作（原子性）

```bash
# 一次完成：追加 period + 更新修订记录 + 更新索引
node tools/p1-scan/json-tool.cjs batch characters/aria.json @batch-ops.json
```

`batch-ops.json` 内容：
```json
[
  {"action": "append", "path": "periods", "value": {"period_id": "vol-06", "label": "第六卷"}},
  {"action": "append", "path": "_revisions", "value": {"date": "2026-07-06", "note": "add vol-06 period"}},
  {"action": "set", "path": "status", "value": "updated"}
]
```

### 2.8 目录操作

```bash
# 列出所有 JSON 文件
node tools/p1-scan/json-tool.cjs list waves/wave-001/vol-01/characters/

# 列出对象键名
node tools/p1-scan/json-tool.cjs keys characters/aria.json
node tools/p1-scan/json-tool.cjs keys characters/aria.json 'periods[0]'

# 验证 JSON 合法性
node tools/p1-scan/json-tool.cjs validate merged/characters/
```

---

## 三、路径语法（最重要）

路径用于定位 JSON 中的特定位置：

```text
periods                        → 对象键
periods[0]                     → 数组下标 0
periods[period_id=vol-06]      → id 选择器（按字段值匹配）
periods[period_id=vol-06].status  → 链式访问
periods[0].abilities_owned     → 数组下标 + 键
name.zh                        → 嵌套键
```

**id 选择器是最常用的** — 按 `period_id` 定位特定卷的 period：

```bash
# 读取 vol-29 的 period
node tools/p1-scan/json-tool.cjs read characters/aria.json 'periods[period_id=vol-29]'

# 更新 vol-29 的 status
node tools/p1-scan/json-tool.cjs set characters/aria.json 'periods[period_id=vol-29].status.rank' '"A"'
```

---

## 四、JSON 值输入方式

```bash
# 方式 1：文件引用（推荐）
@characters/aria.json           # 读另一个 JSON 文件
@_templates/character.json      # 读模板
@new-period.json                # 读临时数据文件

# 方式 2：标准输入
echo '{...}' | node json-tool.cjs append file path -

# 方式 3：内联（短 JSON 可用，注意转义）
'{"key":"value"}'
```

**规则**：复杂嵌套 JSON 始终用 `@file`。简短 JSON（< 50 字符）可内联。

---

## 五、Agent A（工人）的典型工作流

```bash
# Step 1: 读模板
node tools/p1-scan/json-tool.cjs read _templates/character.json

# Step 2: 读原文（用 read 工具读 .txt 文件）

# Step 3: 检查角色是否已存在
# 如果角色已存在：
node tools/p1-scan/json-tool.cjs read ../merged/characters/aria.json periods
# → 知道已有能力，了解角色历史

# Step 4a: 新角色 — 按模板创建
# 先用 write 写 period 片段到 temp 文件
# 然后：
node tools/p1-scan/json-tool.cjs create characters/aria.json @aria-base.json

# Step 4b: 已有角色 — 追加 period
mkdir -p {OUTPUT_DIR}/.tmp
node tools/p1-scan/json-tool.cjs create {OUTPUT_DIR}/.tmp/new-period.json '{"period_id":"vol-06",...}'
node tools/p1-scan/json-tool.cjs append characters/aria.json periods @{OUTPUT_DIR}/.tmp/new-period.json

# Step 5: 新能力 — 按模板创建
node tools/p1-scan/json-tool.cjs create abilities/hss-vol06.json @ability-template.json
# 然后编辑字段
node tools/p1-scan/json-tool.cjs set abilities/hss-vol06.json name '{"zh":"HSS爆发（第六卷状态）"}'

# Step 6: 更新本卷索引
node tools/p1-scan/json-tool.cjs read index.json
# → 追加角色/能力/事件条目
```

---

## 六、合并 agent 的典型工作流

```bash
# Step 1: 读取所有 period 片段
# 先用 list 找到所有片段
node tools/p1-scan/json-tool.cjs list waves/wave-*/vol-*/characters/kinji.json

# Step 2: 按卷序读每个片段
node tools/p1-scan/json-tool.cjs read waves/wave-001/vol-01/characters/kinji.json periods
node tools/p1-scan/json-tool.cjs read waves/wave-002/vol-06/characters/kinji.json periods

# Step 3: 语义合并 → 写最终文件
# 先创建 base
node tools/p1-scan/json-tool.cjs create merged/characters/kinji.json @_templates/character.json
# 设置基本信息
node tools/p1-scan/json-tool.cjs set merged/characters/kinji.json character_id '"kinji"'
node tools/p1-scan/json-tool.cjs set merged/characters/kinji.json name '{"zh":"远山金次","en":"Kinji"}'
# 逐个追加 period（按卷序）
node tools/p1-scan/json-tool.cjs append merged/characters/kinji.json periods @vol01-period.json
node tools/p1-scan/json-tool.cjs append merged/characters/kinji.json periods @vol06-period.json

# Step 4: 合并能力文件
# 读所有能力片段
node tools/p1-scan/json-tool.cjs list waves/wave-*/vol-*/abilities/hss-standard.json
# 取第一个为基础，后续追加 known_feats
node tools/p1-scan/json-tool.cjs create merged/abilities/hss-standard.json @base-ability.json
node tools/p1-scan/json-tool.cjs append merged/abilities/hss-standard.json known_feats @new-feat.json
```

---

## 七、审核 agent 的工作流

```bash
# 审核：读 → 检查 → 输出 issues[]
# 只读操作
node tools/p1-scan/json-tool.cjs read waves/wave-001/vol-01/characters/aria.json
node tools/p1-scan/json-tool.cjs read waves/wave-001/vol-01/characters/aria.json periods
node tools/p1-scan/json-tool.cjs count waves/wave-001/vol-01/characters/aria.json periods

# 对照原文检查后，输出 issues 列表
# 格式：每行一个 issue
# severity:file:path:description:sourceRef
```

---

## 八、修复 agent 的工作流

```bash
# 按 issues 清单逐一修复
# Issue 示例：description="abilities_new 缺少 hss", file="characters/aria.json"

# 修复 1：追加缺失的能力
node tools/p1-scan/json-tool.cjs append characters/aria.json 'periods[period_id=vol-01].abilities_new' '"hss"'

# 修复 2：删除重复项
node tools/p1-scan/json-tool.cjs remove characters/aria.json 'periods[period_id=vol-01].abilities_new[1]'

# 修复 3：更新字段
node tools/p1-scan/json-tool.cjs set characters/aria.json 'periods[period_id=vol-01].status.rank' '"S"'

# 修复 4：追加修订记录
node tools/p1-scan/json-tool.cjs append characters/aria.json _revisions '{"date":"2026-07-06","note":"修复 vol-01 abilities_new 遗漏"}'
```

---

## 九、安全规则

1. **写文件前先读** — 任何 `set/append/merge/remove` 操作前，先 `read` 确认当前状态
2. **用 @file 传递复杂 JSON** — 嵌套 JSON 始终写临时文件再引用，避免命令行转义错误
3. **batch 用于原子操作** — 追加 period + 更新索引 应在一次 batch 完成
4. **每次操作后验证** — 重要操作后调用 `validate` 确认 JSON 不损坏
5. **写 `_revisions` 记录** — 任何手动修正都追加一条 `_revisions` 记录

---

## 十、故障排除

```bash
# JSON 损坏 → 尝试修复
node tools/p1-scan/fix-json.cjs broken-file.json

# 修复失败 → 查看上下文：
# 从 fix-json 的 context 输出中找到问题行
# 手动修正该行后重新 validate

# 路径找不到 → 检查路径语法
node tools/p1-scan/json-tool.cjs keys characters/aria.json  # 先看键名
node tools/p1-scan/json-tool.cjs keys characters/aria.json 'periods[0]'  # 再看数组项键名
```
