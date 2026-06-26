# RP Curation Taxonomy

> 世界书条目 → curated 产物的分层分类、扩展规则与挖掘指令

---

## Layer 1：通用分类（基线）

每个条目的 `comment` 或 `content[:500]` 匹配以下模式时，归入对应基线产物。

| 匹配信号 | 目标产物 | 目标字段 |
|---------|---------|---------|
| 含"基本信息"/"性别"/"身高"/"体重"/"种族"/"职阶"/"从者"/"御主"/"人物档案" | `characters-index.json` | `characters[]` |
| 含"地点"/"城市"/"市"/"町"/"建筑"/"宅邸"/"学园"/"教会"/"工房" | `world.json` | `locations[]` |
| 含"势力"/"组织"/"协会"/"教会"/"学院"/"院"/"家族"/"派系"/"团体" | `world.json` | `factions[]` |
| 含"力量"/"能量"/"体系"/"魔法"/"魔术"/"回路"/"宝具"/"技能"/"概念" | `world.json` | `powerSystems[]` |
| 含"规则"/"法则"/"机制"/"原理"/"系统"/"召唤"/"圣杯" | `world.json` | `rules[]` |
| 含"历史"/"事件"/"战争"/"特异点"/"时间线"/"世界线"/"危机" | `world.json` | `events[]` / `timelines[]` |
| 明确描述两方关系（主从/师徒/亲属/盟友/敌对/契约） | `relationship-graph.json` | `edges[]` |
| 世界观事实/秘密/概念定义 | `knowledge-graph.json` | `nodes[]` |

## Layer 2：世界自增分类

**触发条件**：条目匹配 Layer 1 信号但无法精确放入现有字段。

**agent 动作**：
1. 阅读该世界书中超过 3 个条目共同引用的概念
2. 在 `world.json.extensions` 中新增字段
3. 在 `curation-notes.md` 记录新增理由、触发条目

## Layer 2.5：世界特定规则 (world-rules/)

每个世界可能有一套独立的世界特定机制。这些不应放在全局 rules/ 中，而应放在该世界的 `curated/world-rules/` 目录。

**常见类别**:
- 经济/货币系统 (money-system.md)
- 好感度/关系系统 (affection-system.md)
- 角色生成规则 (generation-system.md)
- 事件控制/剧情推进 (event-controller.md)
- 世界观过滤/校验层 (world-filter.md)

**生成规则**: 从 raw entries 的 constant/核心规则条目中提取，一文件一规则，原文完整保留。

## Layer 2.6：战斗体系映射 (combat-framework-mapping.md)

如果世界有独立的力量体系/战斗系统，**必须**生成映射文件。

**内容要求**:
1. 本地等级 → 通用 N0-N24 的完整映射表
2. 本地属性 → 通用属性的对照表
3. 至少 3 个典型角色的跨世界评级
4. 框架优化建议（如果发现了通用框架的不足）

**参考**: 型月 `curated/world-rules/combat-framework-mapping.md`

## Layer 2.7：世界特定文风 (style-constraints.md)

如有禁词表/术语规范/禁止叙事模式 → `curated/style-constraints.md`

格式: `禁止使用 → 原因 → 替换为` 三列表。

**型月已知自增类（示例）**：
- `noblePhantasms` — 宝具（Excalibur, Ea, Avalon...）
- `servantClasses` — 从者职阶（Saber, Archer, Lancer... + Extra）
- `commandSeals` — 令咒
- `magicSystem` — 五大魔法/魔术基盘/刻印
- `deadApostles` — 死徒/真祖体系
- `beastEvils` — 人类恶/Beast

## Layer 3：自动拆文件

**触发条件**：某字段的数组元素 > 30。

**agent 动作**：
1. 拆为独立 JSON/md 文件
2. 在 `world.json` 对应字段保留摘要和文件引用指针
3. 在 `INDEX.md` 中标记该世界有额外文件

**型月预计拆分（示例）**：
- 宝具 > 30 → `noble-phantasms-index.json`
- FGO 剧情线 > 30 → `fgo-story-arcs.md`
- 伊莉雅角色 > 30 → `prisma-illya-characters.json`
- 妖精国历 > 15 → `fairy-britain-history.md`

---

## 挖掘规则

每个 writer agent 必须额外输出 `mining-notes.md`。

### 重要：agent 的职责边界
- **agent 不复制原文**。agent 写 200-500 字 structured summary 到 `detail` 字段
- **agent 必须标 sourceRefs**。格式: `文件名:entry N`，精确到 raw worldbook 的哪个条目
- **原文嵌入由脚本完成**。归档完成后运行 `enrich-from-raw.js`，根据 sourceRefs 从 raw JSON 中提取 content 原文注入 `sourceContent` 字段
- **禁止：agent 在 detail 字段中放超过 1000 字的原文**——会消耗上下文导致输出截断

### 1. keys 全集
```
- 所有条目的 keys[] 去重合并
- 标记来源：source（来自原始 worldbook） / inferred（agent 从 content 识别）
- 新增同义词 → 记录推理依据
```

### 2. content 内嵌引用
```
- 正文中出现的角色名/组织名/地点名/概念名
- 即使不是当前条目的comment，也要标记为隐性引用
- 格式: [引用方条目] → [被引用实体] (上下文: "原文片段")
```

### 3. 共现聚类
```
- 两个条目在同一段 content 中被共同提及 > 2 次
- → 记入共现边，供图谱 agent 加权重
```

### 4. 多形态关联
```
- 同一角色不同形态/职阶 → relatedEntries 互链
- 标注关联类型: alternate-form / upgrade / parallel-timeline / class-variant
```

### 5. 缺失标记
```
- content 中提到但当前全库无条目定义的设定/概念
- 格式: [缺失] 概念名 (出现位置: 条目ID, 上下文)
- → 放入最终 missing-list.md
```

---

## 引擎规则评审分层

对 constant 条目中识别为"SillyTavern 引擎规则"的条目，分三层处理：

| 层级 | 标准 | 处理 |
|------|------|------|
| **Tier A** | 是通用 RP 架构模式（MVU 状态管理、事件控制器、变量体系、分布式思维链） | → 写入 `engine-review-analysis.md`，建议迁移到框架 |
| **Tier B** | 仅型月世界有参考价值（世界特有输出格式、状态栏模板、文风推荐） | → 写入 `engine-review-analysis.md`，保留为策划参考 |
| **Tier C** | 纯粹 ST 机械规则（sex 协议、好感度数值公式等） | → 在 curation-notes.md 记录后丢弃 |

---

## 重复/冲突条目处理

```
- 同一实体在多个 worldbook 中出现
  → characters-index 中合并为一个条目
  → sourceRefs 记录所有来源
  → notes 标注"多源合并，以 X 版本为主"
- 内容冲突
  → 不以任何一方静默覆盖另一方
  → 记入 curation-notes.md 的 conflicts 区
  → 标注多版本的差异和可能的解释（平行世界/重制/同人扩展）
```
