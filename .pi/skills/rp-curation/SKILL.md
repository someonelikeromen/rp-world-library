# RP Curation

自动化世界书归档 skill。将一个世界的 raw worldbook JSON 整理为 curated 结构化产物。

## 触发条件

- 用户说"归档 XX 世界"/"整理 XX 世界"/"curate XX"
- 执行 PLAN.md 中的 batch 归档任务
- 新增世界书后需要生成 curated 产物

## 原则

- **原始世界书只读不写**。所有输出落在 `curated/` 目录
- **严禁改写原文**。agent 写摘要/分类/关系，**原文嵌入由脚本完成**，不依赖 agent 复制
- **不丢弃可进化内容**。引擎规则评审分三层，Tier A 建议迁移框架
- **多源合并标注**。同实体多版本不静默覆盖
- **自迭代**。每次归档后更新模板/taxonomy/提示词
- **分批写 + 枚举后脚本注入**。agent 产出结构化框架（角色列表+sourceRefs），脚本批量嵌入原文

## 流程

8 步流水线。前 6 步由 agent_team 并发执行，后 2 步由脚本自动完成：

### 关键分工
- **agent 做的事**：读条目的 metadata（不用读全文）、分类、写角色的 structured summary、标 sourceRefs、建关系、写 mining-notes
- **脚本做的事**：根据 agent 标的 sourceRefs，直接从 raw worldbook JSON 中提取 content 原文，嵌入 detail 和 sourceContent 字段
- **严禁 agent 复制原文**：agent 只写 200-500 字的 structured summary，不写原文。原文由脚本保证 100% 保真。

### Step 1 — 分类师 (1 agent)

```
输入: 该世界所有 worldbook JSON 路径
动作:
  1. 读全部 entry 的 comment + keys + content[:300]（不读全文）
  2. 按 rp-curation-taxonomy.md 的 Layer 1 分类
  3. 识别 Layer 2 自增概念（>=3 条目共引）
  4. 识别需丢弃的纯引擎规则（Tier C）
  5. 将条目精确分配到 5 个领域 writer（角色1/角色2/角色3/机制/地点势力）
  6. 为每个 writer 生成专属提示词（含精确条目索引列表）
  7. 为引擎评审 agent 生成专属提示词
输出: assignment.json + 6 个 agent prompt
```

### Step 2 — 领域 writer (6 agents, 并行, needs step 1)

```
每个 agent 的通用规则:
  - 读完所有分配的条目全文
  - 按 rp-curation-taxonomy.md 分类写入对应文件
  - 原文整段保留，仅做格式标准化
  - 同角色多形态标注 relatedEntries，不合并

输出:
  - 对应 curated JSON/md 文件
  - mining-notes.md（keys 全集/内嵌引用/共现/多形态/缺失标记）
```

### Step 3 — 图谱构建 (1 agent, needs step 2 的 1-5 完成)

```
输入: 5 份 mining-notes.md + 5 份角色/势力列表
动作:
  - 从内容内嵌引用自动建关系边
  - 从共现聚类加权
  - 从多形态关联建 relatedEntries
  - 从 keys 全集建倒排索引
输出: knowledge-graph.json + relationship-graph.json
```

### Step 4 — 整合 (1 agent, after step 2 + step 3)

```
动作:
  - 汇总所有 writer 输出到统一的 curated/ 目录
  - 处理 Layer 3 自动拆文件
  - 写入 source-registry.json / README.md / curated-list.md

  ★ 世界特定规则提取:
    从 raw entries 中识别世界特有机制（金钱/好感/生成/战斗/事件控制等）
    → 写入 curated/world-rules/ 目录，一文件一规则，原文保留

  ★ 战斗体系映射:
    如果世界有独立力量体系 → 生成 combat-framework-mapping.md
    内容: 本地等级→通用N0-N24映射 + 属性对照 + 典型角色评级
    参考模板: 型月 curated/world-rules/combat-framework-mapping.md

  ★ 世界特定文风:
    如有禁词表/术语规范 → 写入 curated/style-constraints.md
输出: curated/ 目录完整产物
```

### Step 5 — 校验师 (1 agent, needs step 4)

```
全量检查:
  1. 漏检  — 1038 条是否全部入库或标记丢弃
  2. 去重检 — 重复/冲突条目是否标注
  3. 链接检 — 交叉引用是否可解析
  4. 保真检 — content 原文是否被不当改写
  5. 质量检 — 低置信推测是否正确标注
  6. 格式检 — JSON 是否合法
  7. 挖掘检 — mining-notes 的四项挖掘是否覆盖
输出: review-report.md（逐项通过/问题/修复建议）
```

### Step 6 — 修复迭代 (1 agent, needs step 5)

```
如果 review-report 问题 > 阈值:
  - 逐项修复标注的问题
  - 修复后重新触发 step 5
  - 最多 3 轮
  - 3 轮后未通过 → known-issues.md
```

### Step 7 — 自迭代 + 缺失清单 (1 agent, after step 5 + step 6)

```
输入: 本次所有产物 + review-report + mining-notes

动作:
  1. 总结模板需要改什么（字段不够/多余）
  2. 总结 taxonomy 需要加什么（自增类应升级为通用）
  3. 总结提示词哪里弱（某 agent 反复出错）
  4. 总结流程哪里慢/卡/重复
  5. 总结引擎规则中哪些可迁移为框架
  6. 汇总所有 mining-notes 中的 missing-entry → missing-list.md
  7. 更新对应文件:
     - templates/rp-framework/*.json
     - rules/rp-curation-taxonomy.md
     - 本 skill（SKILL.md）的提示词模板

输出:
  - iteration-notes.md
  - missing-list.md
  - 更新后的 templates/ / rules/ / skills/
```

## 相关

- `rules/rp-curation-taxonomy.md` — 分类与挖掘规则
- `templates/rp-framework/` — JSON 模板
- `docs/world-combat-framework.md` — 世界框架 prose 规范
- `campaigns/world-library/manual-curation/PLAN.md` — 分批计划
- `campaigns/world-library/worlds/type-moon-nasuverse/curated/iteration-notes.md` — 型月首轮问题归纳与改进清单
- `tools/curation/` — enrich-curated.js / normalize-format.js / replace.js
