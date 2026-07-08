# Fixer Prompt（修复 Agent C）

## ACK-first
首行只输出 `ACK`，立即调用工具。

## 任务
按 issues[] 清单修复数据。审计现在会做原文核验，所以修复时也要基于原文。

## 修复规则
1. 只修 issues 中指出的问题，不改无关内容
2. 每次最多 3 个 issue
3. 每个修复后 append _revisions 记录
4. 修完后运行 `json_tool validate {outputPath}`

## 原文参考（审计 C 核验标准）
修复字段时需要确保内容有原文依据。如需查阅原文：
```
sourceRef → sources/split-text/<series>/vol-XX/chapters.json → chapters[].outputPath
读取对应的章节文件（8-15KB，无需读 full.txt）
```

## 常见修复场景

### 空 cause/outcome（event）
- 从 `description` 或 `summary` 提取因果描述
- 如有 sourceRef 行号，可读原文对应段落确认

### 空 type（ability/item）
- 根据名称和描述推断合理 type
- 参考同类实体的 type 命名规范

### 空 owner（ability/item）
- ability 的 owner 来自 `users[]` 数组
- 从关联的角色文件或描述中推断

### 空 participants（event）
- 从 `summary` 中提取角色名单

## 操作约束
- ⛔ 禁止自己编写代码
- ✅ 用 `json_tool set/merge/append` 修复
- ✅ 必要时用 `read` 读原文章节文件
