# 世界归档资料优先级与使用策略

更新日期：2026-07-19

本文件用于说明 RP 与世界归档维护时，`extracted/`、`curated/`、`manual-curation/*-pilot`、`imports/worldviews/` 等资料的优先级。它不替代具体世界 README，只定义跨世界通用口径。

## 1. 资料层级

### 1.1 P1 source-backed extracted：最高优先级

路径：`campaigns/world-library/worlds/<world>/extracted/`

含义：从小说原文或章节文本经 P1 / world-archive-extraction 管线抽取，通常带有 `sourceRef`、章节路径、实体分层和图谱。

用途：

- 角色事实、能力细节、事件因果、地点性质、物品来源等剧情事实优先采用此层。
- 战斗框架、能力定级、跨世界适配引用时，若 extracted 与其它来源冲突，以 extracted 为准。
- 若 extracted README 标注“部分抽取”或“schema 待校验”，使用时应保留不确定性。

### 1.2 Curated worldbook：第二优先级 / 正式 RP 主线

路径：`campaigns/world-library/worlds/<world>/curated/`

含义：由 SillyTavern worldbook / 角色卡世界书等来源整理出的结构化产物，可能包含角色索引、世界规则、关系图谱、故事索引、风格约束、战斗框架映射等。

用途：

- 当该世界没有 extracted 时，curated 是正式 RP 可用主资料。
- 当同一世界同时有 extracted 与 curated 时：
  - 剧情事实、能力细节、原作事件优先 extracted。
  - RP 玩法规则、文风约束、世界书特有机制、战斗框架映射可由 curated 补充。
- 若 curated 来自 ST worldbook 而未做正文验证，不能把未验证扩写当作 source-backed 事实。

### 1.3 Manual-curation pilot / P1 hybrid：候选补充层

常见路径：`campaigns/world-library/manual-curation/<world-or-series>-*/`

含义：未正式发布到 `worlds/<world>/extracted/` 或 `worlds/<world>/curated/` 的并行试点、补证层、候选层或迁移前中间产物。

用途：

- 可作为后续迁移、curated-v2、source-backed 补证与人工审计的候选资料。
- 不自动替代正式 `curated/` 或 `extracted/` 主线。
- 若 STATUS/README 标注 `passed-with-nonblocking-risks`、`accepted-with-nonblocking-risks`、`prep only`、`stage-1 prep` 等，应按其状态限制使用。
- 例如型月 `type-moon-p1-hybrid/` 下的 FGO 试点已形成多个可用候选层，但尚未统一部署到 `worlds/type-moon-nasuverse/extracted/`，也未批准覆盖现有 curated。

### 1.4 Raw worldbook imports：最低优先级 / 待验证素材

路径：`campaigns/world-library/imports/worldviews/<world>/worldbooks/`

含义：已按世界分组保存的原始 worldbook JSON。当前可被索引与搜索，但不等于正式归档完成。

用途：

- 可作为即席检索、线索发现、后续 rp-curation 的输入。
- 不应直接宣称为“已归档+已校验”。
- 高风险内容（RP 模板、状态栏、成人化改写、{{user}} 槽位、控制文本）必须在 curated 阶段剥离或标注。

## 2. 同一世界多来源共存规则

1. **剧情事实优先级**：正式 `extracted/` > 正式 `curated/` > 已审计 pilot / P1 hybrid 候选层 > `imports/worldviews/` raw。
2. **玩法/文风补充**：如果 extracted 不包含 RP 风格或玩法规则，可从 curated 的 `world-rules/`、`style-constraints.md`、`engine-review-analysis.md` 补充。
3. **冲突处理**：
   - extracted 与 curated 冲突：默认 extracted 为准；curated 保留为“世界书/玩法改编来源”。
   - curated 与 raw 冲突：默认 curated 为准；raw 仅作为原始证据保留。
   - raw 内部冲突：不得静默合并，应在 source-registry 或 curation-notes 中标注。
4. **sourceRef 规则**：有章节 sourceRef 的事实优先于无 sourceRef 的概括。
5. **graph 是派生产物**：图谱不直接覆盖实体源文件；修复必须落在 characters/events/abilities/items 等源实体层，再重建 graph。

## 3. 后续归档决策树

1. **有 `sources/raw-text/` 小说原文或可保存正文**  
   → 走 `.pi/skills/world-archive-extraction/` 的 P1 管线：Worker → Audit → Fix → Merge → Graph → Deploy。

2. **只有 ST worldbook JSON，无小说正文**  
   → 走 `.pi/skills/rp-curation/`：分类 → 领域 writer → 图谱 → 整合 → 校验 → 修复。

3. **临时补充单一来源、网页或用户修正**  
   → 走 `rp-source-ingestion`：记录来源、可信度、冲突，不直接覆盖 source-backed 数据。

## 4. 当前状态口径

截至 2026-07-19，当前索引重建结果为：

- 世界源总数：63
- 正式世界库 / 当前索引 curated：8
- raw worldbook 待归档：55

特别口径：型月 / Fate / FGO / 魔法少女伊莉雅当前是 `curated` 正式主线 + `manual-curation/type-moon-p1-hybrid/` 部分提取试点并存；这些试点是 side-by-side 候选层，尚未统一部署为正式 `worlds/type-moon-nasuverse/extracted/`。

当前不再采用旧 `manual-curation/STATUS.md` 中“63 个世界均为 curated 基线完整”的历史口径；该口径与现文件系统不一致。
