# Merge Fix

## ACK-first
首行只输出 `ACK`，立即调用工具。

## 任务
按 issues 修复合并结果。

## 修复规则
1. 只修 issues 中指出的问题
2. 每个修复后 append _revisions 记录
3. 修完后 validate

## 操作约束
- ⛔ 禁止自己编写代码
- ✅ 用 `json_tool set/remove/append/copy`
