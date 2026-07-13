# Type-Moon P1-Hybrid Archive

## 触发条件

当用户要求以下任务时使用本 skill：

- 整理型月世界
- 重构型月归档
- 型月 p1-hybrid
- FSN/FZ pilot
- 型月时间轴
- 型月图谱修复
- 型月世界书二次归档
- 将型月 worldbook 转为 p1 风格归档
- 修复型月渐进式加载、图谱搜索、原文拆解问题

## 强制规则

1. 执行前必须先给出本轮具体方案，等待用户明确确认。
2. 默认只读，不自动写入。
3. 不覆盖现有 `campaigns/world-library/worlds/type-moon-nasuverse/curated/`。
4. 所有试点输出必须落在 `campaigns/world-library/manual-curation/type-moon-p1-hybrid/`。
5. 只有用户明确要求发布/替换时，才考虑 `curated-v2` 或同步正式目录。
6. 不把 worldbook 内容伪称 canon 正文。
7. 所有正式事实必须带 `sourceRef`、`sourceType`、`credibility`、`canonStatus`。
8. 图谱候选不得直接进入正式 graph。
9. 每个 wave 必须执行 Generator → Auditor → Fixer → Auditor rerun，直到 `passed`。
10. 不限制迭代轮数；未通过就继续迭代当前 wave。
11. `known-issues.json` 只能记录阻塞项，不能作为跳过审核的出口。
12. 所有事件必须有起止时间；长事件必须有 start / middle / end timeline nodes。
13. 核心人物必须按 timeline/route/status 拆为 `periods[]`。
14. 所有 subagent 必须显式指定模型 `lt-yuyu/gpt-5.5`。
15. 如果 `lt-yuyu/gpt-5.5` 不可用，不得自动降级，必须返回 blocked 并请求用户确认替代模型。
16. 所有 subagent 禁止使用 bash / shell / python / node / deno / powershell / cmd 等命令执行能力。
17. subagent 只能使用结构化读写与受控编辑工具。
18. Auditor 类 agent 必须只读，只能输出 audit report。
19. FGO script p1 执行时，角色外貌、服装/装备视觉、宝具/技能发动效果、战斗演出效果是强制抽取面。
20. 如果 source 没有明确外貌/宝具/技能/演出描述，必须写入 `not-found-in-source` 记录；不得静默缺失。
21. 外貌、宝具/技能、战斗演出不得从游戏常识、wiki 印象或模型记忆补写。

## Subagent 模型与工具权限

### 模型

所有执行型 subagent 默认模型：

```text
lt-yuyu/gpt-5.5
```

每个 `agent_team` step 必须显式写：

```json
{
  "agent": {
    "model": "lt-yuyu/gpt-5.5"
  }
}
```

### 禁止工具

```text
bash
shell
python
node
deno
powershell
cmd
任意可执行脚本调用
```

### 允许工具

Generator / Worker / Fixer / Merger / Graph-Builder / Timeline-Builder 可用：

```text
read
json_tool
json_struct_read
json_struct_edit
write
edit
```

Auditor / Merge-Auditor / Graph-Auditor / Timeline-Auditor 只可用：

```text
read
json_tool
json_struct_read
```

### agent_team authority

推荐：

```json
{
  "authority": {
    "allowFilesystemRead": true,
    "allowMutationTools": true,
    "allowShellTools": false,
    "allowProjectCode": true
  }
}
```

如果 subagent 认为必须用 bash，必须返回 `blocked`，不得自行调用 bash。

## 推荐执行路线

### Phase 0: 读取与筛选

- 读取型月 `source-registry.json`。
- 读取 raw worldbooks README。
- 筛选 FSN/FZ 相关 entries。
- 生成 wave manifest 草案。
- 不写入、不启动 agent，直到用户确认。

### Phase 1: Source Text 构建

- 将 worldbook entry 拆成可行号引用的 txt。
- 将 `curated/stories/fate/*.md` 拆成 story text。
- 生成 `source-manifest.json`。
- source text 必须带 metadata block。

### Phase 2: FSN/FZ Pilot Waves

推荐 wave：

```text
wave-001 source inventory + duplicate/hash scan
wave-002 canonical ID manifest
wave-003 圣杯战争基础规则
wave-004 御主与人类角色
wave-005 从者与英灵
wave-006 组织/家族/势力
wave-007 地点
wave-008 能力/魔术/宝具/发动演出
wave-009 Fate 线事件
wave-010 UBW 线事件
wave-011 HF 线事件
wave-012 FZ / 第四次圣杯战争
wave-013 沙盒规则与引擎规则
wave-014 关系候选与正式关系审核
wave-015 时间轴骨架
wave-016 事件时间复核
wave-017 人物 periods 版本化
wave-018 时间化关系图谱
```

### Phase 3: 三 Agent 无限闭环

每个 wave 必须持续执行：

```text
Generator → Auditor → Fixer → Auditor rerun
```

直到：

```text
final-status.status == passed
openIssues == 0
blockedIssues == 0
canAdvance == true
```

以下状态不得进入下一阶段：

```text
failed
partial
blocked
open-issues > 0
audit status != passed
```

### Phase 4: Merge / Graph / Timeline 闭环

Merge：

```text
Merger → Merge-Auditor → Merge-Fixer → Merge-Auditor rerun
```

Graph：

```text
Graph-Builder → Graph-Auditor → Graph-Fixer → Graph-Auditor rerun
```

Timeline：

```text
Timeline-Builder → Timeline-Auditor → Timeline-Fixer → Timeline-Auditor rerun
```

Graph-Fixer 必须修源层：

```text
characters/
events/
relationships/
knowledge/
timeline/
```

禁止只修派生图谱。

### Phase 5: 旧 curated 对比

输出 comparison 报告，不直接覆盖旧数据。

推荐输出：

```text
comparison/character-diff.md
comparison/relationship-diff.md
comparison/plot-graph-noise-report.md
comparison/world-rule-diff.md
comparison/migration-recommendation.md
```

## 时间轴规则

时间粒度允许：

```text
YYYY
YYYY-MM
YYYY-MM-DD
YYYY-MM-DDTHH:mm
relative-time
route-stage
war-day
unknown-but-ordered
```

禁止编造具体日期。无法确定时必须使用：

```json
{
  "value": null,
  "precision": "relative-only",
  "relative": "Fate route early phase",
  "orderIndex": 120
}
```

每个正式 event 必须包含：

```text
time.start
time.end
timelineNodes
participants
locationRefs
cause
process
outcome
stateChanges
relationshipChanges
appearanceRefs
abilityRefs
combatEffectRefs
sourceRefs
```

长事件必须至少有：

```text
start
middle-001
end
```

## 人物 periods 规则

人物不使用单一静态状态。核心人物必须按时间段/路线/状态拆 `periods[]`。

每个 period 至少包含：

```text
period_id
timelineId
route
timeRange
status
appearances
abilities
combatEffects
relationships
knowledgeState
sourceRefs
```

同名不同世界线不得自动合并。必须通过 `canonical-id-manifest.json` 明确同一实体、变体或禁止合并关系。

## 最小输出模板

详细模板见：

```text
docs/type-moon-p1-hybrid-archive-plan.md
```

该文档定义以下最小结构：

```text
source-manifest.json
source text metadata block
wave index
generation-report.json
audit-round-NNN.json
fix-round-NNN.json
final-status.json
character
event
relationship edge
timeline file
graph candidates
appearance shard
ability / noble phantasm shard
combat effect shard
```

## 验收标准

FSN/FZ pilot 通过条件：

```text
所有 JSON 合法。
所有正式实体至少有 1 个 sourceRef。
所有正式 event 有 time.start、time.end、timelineNodes。
核心人物有 periods[]。
关系边有 timelineId/timeRange/sourceRefs。
relationship graph 无 dangling edge。
plot graph 不混入概念词作为角色。
world-rules 明确区分 canon-like、sandbox、engine。
candidate 与 formal graph 分离。
旧 curated 未被覆盖。
每个 wave final-status.status == passed。
FGO script p1 中每章都有 appearance / ability / combat-effect 抽取层。
外貌、服装/装备视觉、宝具/技能发动、战斗演出有 source-backed 记录或 not-found-in-source 记录。
merged/appearances、merged/abilities、merged/combat-effects canonical 层和索引存在。
这些正式视觉/能力/演出文件带 sourceRefs、sourceType、credibility、canonStatus。
```

## FGO script p1 视觉/能力强制层

FGO script p1 不能只抽取事件、人物、关系。以下内容属于必要归档面：

```text
角色外貌
服装/装备视觉
宝具发动场景
技能/魔术/权能发动效果
召唤/变身/牺牲等战斗演出
战斗结果、代价、后遗症
```

推荐局部输出：

```text
normalized/<arc>/<chapter>/appearances/*.json
normalized/<arc>/<chapter>/abilities/*.json
normalized/<arc>/<chapter>/combat-effects/*.json
```

推荐 canonical 输出：

```text
merged/appearances/<arc>/<character>/<chapter-or-period>.json
merged/abilities/<arc>/<character>/<ability>.json
merged/combat-effects/<arc>/<chapter>/<effect>.json
```

最小规则：

```text
1. 有 source 明确描述就必须抽取为 source-backed。
2. 没有 source 明确描述就必须记录 not-found-in-source。
3. 不得用模型记忆、游戏常识或外部 wiki 补写。
4. 每条正式记录必须带 sourceRefs/sourceType/credibility/canonStatus。
5. Auditor 必须检查这些层，缺失即 blocking。
```

## 详细文档

执行细节见：

```text
docs/type-moon-p1-hybrid-archive-plan.md
```

## 下一步执行前置

实际执行前必须先只读生成：

```text
wave-manifest.draft.json
source-entry-selection.md
execution-plan-for-current-run.md
```

等待用户确认后，才能创建 source text、启动 agent 或写入试点产物。
