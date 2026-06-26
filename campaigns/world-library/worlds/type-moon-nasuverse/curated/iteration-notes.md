# 型月归档 — 问题归纳与迭代沉淀

> 2026-06-26 · r1+r2 两轮 agent_team 归档的完整问题清单  
> 用途：后续 62 个世界归档时避免重复踩坑

---

## P0 · 致命问题

### 1. agent 上下文溢出导致原文丢失

**现象**: 3/6 writer agent 在输出阶段被 terminate，只写出了 summary 而非原文。  
**根因**: 角色条目平均 3KB，×150 条 = 450KB 输入。加上输出 JSON 结构化文本，轻易超过上下文上限。  
**后果**: detail 字段从几十到几百字不等，原始 20KB 的原文被压缩成摘要。

**修正**: 
- **agent 不复制原文**。只写 200-500 字摘要 + 精确 sourceRefs。
- **脚本做原文注入**。`enrich-curated.js` 读 sourceRefs 从 raw JSON 提取 content 嵌入。
- **禁止 detail > 1000 字**。超过即为 agent 违规。

### 2. 流程未完整执行

**现象**: 7 步流程中 step 5 (校验) / 6 (修复) / 7 (迭代) 从未执行。  
**根因**: agent_team 的 `needs` 依赖被失败步骤阻塞，`after` 依赖虽然不受阻但 merge agent 也超时。两轮均被迫 cancel。  
**后果**: 校验报告是事后脚本补的，手动修复了大量问题。

**修正**:
- 校验/修复/迭代不依赖全流程成功，改为独立可触发步骤
- agent_team DAG 设计：关键路径用 `after` 而非 `needs`
- 校验脚本化（已有 `_validate.js` 模板可复用）

---

## P1 · 结构问题

### 3. 角色 ID 不统一

**现象**: agent 自编 ID（`prisma-illya-01`、`fgo-early-012`），合并后 indices 引用虽正确但不直观。  
**修正**: ID 统一格式 `{domain}-{name-slug}`，由分类师 step-1 预分配。

### 4. 剧情被写成摘要而非原文

**现象**: FGO 故事章节、妖精国历被 agent 改写为摘要。  
**根因**: 与问题 1 同理——agent 读完全文后输出阶段只能写简短版。  
**修正**: 故事内容直接从 raw worldbook 提取 → 写入独立 .md 文件，agent 只负责分类和建索引。

### 5. raw 内容格式不统一

**现象**: 1038 条目中 500 条 markdown、387 条 XML 标签、66 条 key-value。  
**修正**: `normalize-format.js` 批量标准化（剥离 XML/统一标题/整理分段）。规则集可扩展。

---

## P2 · 方法问题

### 6. agent 域拆分阈值不明确

**实测数据**:

| 域 | 条目数 | 结果 |
|---|--------|------|
| chars-late-others | 203 | ✅ 成功（条目偏短） |
| chars-fsn-fz | 155 | ❌ terminated（FSN角色 detail 超大） |
| chars-fgo-early | 180 | ❌ terminated |
| mechanics | 102 | ❌ 两次都 terminated（单条 3-15KB） |
| locations-factions | 80 | ✅ 成功 |
| engine-review | 70 | ✅ 成功 |

**修正**: 
- 角色域上限 **75 条/agent**
- 机制/规则域上限 **35 条/agent**（单条更长）
- 超出自动拆分

### 7. 跨文件重复条目大量存在

**现象**: 329 条"未覆盖"中 ~150 条是同一内容在多个 worldbook 中重复（如型月(1).json 中有 3 套完全相同的世界观条目）。  
**修正**: 分类师 step-1 增加去重扫描——hash content[:200] 检测重复。

### 8. 分批写入指令效果有限

**现象**: "每 10 条 write 一次"的指令未能阻止 agent 在最后攒一起写。2b2 产出 125KB 后仍被 terminate。  
**修正**: 改为更激进的分片——每个 agent 只负责 35-75 条，**一次性输入量可控**，不需要分批写指令。

---

## P3 · 流程设计改进

### 9. agent_team 不适合单步超大数据量

**发现**: agent_team 每个 step 有 2 小时超时，但上下文在 15-30 分钟就用满。大文件处理应拆分为 agent_team 做分类 + 脚本做数据搬运。

**新流程**:
```
agent_team: 分类 + 摘要 + sourceRefs + 关系 + mining-notes
     ↓ (agent 不碰原文)
脚本: enrich-curated.js（原文注入）+ normalize-format.js（格式统一）
     ↓
主 agent: 校验 + 补缺 + 迭代
```

### 10. 故事/剧情应有独立处理管线

**发现**: 故事原文不适合放 characters-index 也不适合放 world.json。  
**修正**: `stories/<story-id>/index.json` + `stories/<story-id>/<chapter>.md` 分层结构。agent 只建索引，原文由脚本从 raw 提取。

### 11. 每个世界应有独立的世界特定规则层 ★新增★

**发现**: 金钱系统/好感度/生成规则/战斗体系等不能放全局 rules/，也不能混入 world.json。  
**修正**: `curated/world-rules/` 目录，一文件一规则。型月已沉淀 10 个文件为模板。

### 12. 每个有独立战斗体系的世界必须做映射 ★新增★

**发现**: Fate 六阶参数 → N0-N24 的映射暴露了通用框架的 4 个缺口（缺 Fortune 属性/先手规则/无效化阈值/levelMapping 强制）。  
**修正**: `curated/world-rules/combat-framework-mapping.md` 为必须生成文件。映射过程也会反哺通用框架优化。

---

## 已沉淀为能力的改进

| # | 改进 | 沉淀位置 |
|---|------|---------|
| 1 | agent 不复制原文 | `rp-curation/SKILL.md` 原则 |
| 2 | sourceRefs 精确标注 | `rp-curation-taxonomy.md` 挖掘规则 |
| 3 | enrich-curated.js | `tools/curation/` |
| 4 | normalize-format.js (20规则) | `tools/curation/` |
| 5 | replace.js (行级/模式替换) | `tools/curation/` |
| 6 | 域拆分阈值 75/35 | `rp-curation/SKILL.md` |
| 7 | stories/ 分级结构 | 型月 curated 实际结构 |
| 8 | 渐进式加载策略 | `rp-world-search/SKILL.md` |

---

## 下一次归档（第 2 个世界）执行清单

- [ ] step-1 分类师：先 hash-dedup 去重，再分配 ≤75 条/域
- [ ] step-2 writer：只写 summary + sourceRefs，不写原文
- [ ] step-2 writer：mechanics 域 ≤35 条
- [ ] 全部 agent 完成后 → 运行 enrich-curated.js
- [ ] → 运行 normalize-format.js
- [ ] step-4 整合：提取世界特定规则 → curated/world-rules/
- [ ] step-4 整合：如有独立战斗体系 → 生成 combat-framework-mapping.md
- [ ] step-4 整合：如有禁词表 → curated/style-constraints.md
- [ ] → 运行 validate.js 校验
- [ ] → 用 replace.js 修复校验问题
- [ ] → wl build 重建搜索索引
- [ ] → 更新 STATUS.md + INDEX.md
- [ ] 故事内容 → stories/ 分级结构
- [ ] step-7 自迭代 → 更新本文档
