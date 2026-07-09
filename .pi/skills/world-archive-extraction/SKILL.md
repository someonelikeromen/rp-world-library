# World Archive Extraction: 从原文到结构化世界的完整管线

## 触发条件
用户要求从原著小说原文中提取结构化数据并构建知识世界，
或执行 "p1-scan"、"world-archive"、"卷级提取" 等指令。

## 管线总览
```
Phase 1: Wave 提取     ← Worker → Audit → Fix（闭环）
Phase 2: 树状合并       ← Merger → Merge-Audit → Merge-Fix（闭环）
Phase 3: 图谱构建       ← build-graph.cjs → Graph-Audit → Fix
Phase 4: 归档部署       ← 移动到 worlds/{series}/extracted/
```

## 目录结构
```
tools/p1-scan/
├── json-tool.cjs          JSON 编辑工具（13 命令）
├── fix-json.cjs           JSON 损坏修复工具
├── merge-wave.cjs         卷/组串联合并工具
├── build-graph.cjs        全量图谱聚合工具
├── convert-sourceref.cjs  sourceRef 行号→章节文件映射
├── _templates/            9 个 period-based 数据模板
└── agents/
    ├── worker.md          提取 Agent A
    ├── auditor.md         审核 Agent B（含原文核验）
    ├── fixer.md           修复 Agent C
    ├── merger.md          合并 Merger
    ├── merge-auditor.md   合并审核
    └── merge-fixer.md     合并修复
```

Agent 注册：`.pi/agents/p1-*.md`（project library agent，ref: `project:p1-{role}`）

## 角色边界

| 角色 | 模型 | 责任 |
|:-----|:-----|:------|
| 主模型 (Parent) | 当前对话模型 | **只做编排（agent_team start/status），不碰数据** |
| Worker | lt-yuyu/gpt-5.5 | 从原文章节提取实体数据 |
| Auditor | lt-yuyu/gpt-5.4-mini | 对照原文核验（虚构/遗漏/扭曲）+ 结构合规 |
| Fixer | lt-yuyu/gpt-5.5 | 按 issues 修复数据 |
| Merger | lt-yuyu/gpt-5.5 | 串联合并左右子节点 periods |
| Merge-Auditor | lt-yuyu/gpt-5.4-mini | 审核合并结果 |
| Merge-Fixer | lt-yuyu/gpt-5.5 | 修复合并问题 |

## 数据模型
所有实体统一采用 periods[] 结构——顶层只有元数据，全部内容在 periods 数组内：
```json
{
  "_schema": "rp-{type}-volume-v1",
  "world": "hidan-no-aria",
  "{type}_id": "kinji",
  "volume": "vol-01",
  "periods": [{
    "period_id": "vol-01-main",
    "volume": "vol-01",
    "name": {"zh": "远山金次"},
    ...
    "sourceRef": "hidan-no-aria-main/vol-01/chapters/ch-003-xxx.txt:333"
  }]
}
```

sourceRef 格式：`<series>/vol-XX/chapters/ch-XXX-标题.txt:行号`

## 数据定位体系
```
原文全文:     sources/raw-text/<series>/vol-XX/full.txt
章节拆分:     sources/split-text/<series>/vol-XX/chapters/ch-XXX-标题.txt
章节索引:     sources/split-text/<series>/vol-XX/chapters.json → chapters[].{startLine,endLine,outputPath}
Wave 产出:    manual-curation/waves/wave-N/vol-XX/{type}/
合并中间:     manual-curation/{intermediate,group-merged}/
最终数据:     manual-curation/merged/{type}/
世界归档:     worlds/{series}/extracted/{type}/
```

## 核心流程

### Phase 1：Wave 提取
```
对每卷原文：
  1. Worker → 从章节文件提取实体（characters/abilities/events/items等）
  2. Auditor → 对照原文核验（虚构？遗漏？扭曲？）
  3. 有 issues → Fixer → GOTO 2
  4. 无 issues → 闭环通过
```

审计必须读原文章节文件核对，不能只做空字段检查。
审计检查项：虚构（原文无）、遗漏（原文有）、扭曲（描述不准）、sourceRef 精确度。

### Phase 2：树状合并
```
Level 1: waves/{wave}/vol-XX/  →  intermediate/wave-merged/{wave}/
Level 2: wave-merged ×2        →  group-merged/group-N/
Level 3-4: 大组 ×2             →  group-merged/group-N/
Level 5: 最终合并              →  merged/（全部实体）
每节点：Merger → Merge-Auditor → Merge-Fixer（闭环）
```

用 `merge-wave.cjs` 加速串联合并。

### Phase 3：图谱构建
```
工具: build-graph.cjs → 从 merged/ 构建所有图谱
审核: Agent 抽样核验图谱质量（节点完整性、边关系准确性）
修复: Agent 修正发现问题
产出: merged/graph/ 下的 7 个图谱 + 时间轴
```

### Phase 4：归档部署
```
merged/  →  worlds/{series}/extracted/
graph-viewer.html  →  extracted/（双击即用）
```

## 闭环契约

### 标准闭环序列（每节点必须完整执行）
```
Loop:
  1. agent_team start（提取/合并）
  2. run_status wait 等待完成
  3. agent_team start（Audit 审核）
  4. run_status wait → 检查审计结果
  5. 全部 "passed" → ✅ 进入下一步
  6. 有 "failed"  → Fixer → GOTO 3
```

### 原文核验方法
```
1. 取 source_refs[0] 或 periods[0].sourceRef
   格式: <series>/vol-XX/full.txt[:行号]
2. 构建章节索引路径:
   sources/split-text/<series>/vol-XX/chapters.json
3. 如有行号，在 chapters[].startLine~endLine 中定位章节
4. 用 read 读取章节文件（8-15KB）
5. 对比原文 vs 提取的 cause/outcome/participants/type/summary
6. 标记：虚构 / 遗漏 / 扭曲
```

### 全局规范
1. **ID 命名** — 跨卷统一，以中文译名为准（remielia 非 remi-ellia）
2. **sourceRef** — 转换为 chapters/ch-XXX.txt:行号 格式
3. **index schema** — 统一 entities+files 结构
4. **双人关系** — 双向验证：A→B 需 B→A 也存在

## 快速启动
```
1. catalog library.sources=["project"] projectAgents="allow"
2. 创建输出目录结构
3. 定义 wave-manifest（卷→wave 映射）
4. 启动 Wave 1 → 闭环
5. 全部 Wave 完成 → 树状合并 → 闭环
6. build-graph 构建图谱
7. 审计图谱 → 修复 → 归档
```

## 参考
- Agent 提示词：`tools/p1-scan/agents/*.md`
- 模板：`tools/p1-scan/_templates/*.json`
- json-tool 用法：`tools/p1-scan/AGENT-COOKBOOK.md`
- 审计标准：`tools/p1-scan/agents/auditor.md`（含原文核验清单）
- 已完成的归档：`campaigns/world-library/worlds/hidan-no-aria/extracted/`

## 坑与经验（Lessons Learned）

### 1. JSON 中文引号未转义
**现象**：提取 agent 生成的 JSON 中包含 `称"有借钱给你"` 这类结构，内部 " 未转义导致解析失败。
**影响**：61 个文件损坏，合并管线卡住。
**对策**：用 `fix-json.cjs` 修复。
**教训**：Worker 提示词必须要求所有 JSON 字符串中的双引号用 \" 转义。

### 2. sourceRef 格式不匹配审计路径
**现象**：提取时写入 `full.txt:行号`，但审计在 `split-text/` 下找不到该文件。
**真相**：`full.txt` 存在于 `raw-text/`，审计只被给了 `split-text/`。
**对策**：编写 `convert-sourceref.cjs`，通过 chapters.json 的 startLine/endLine 映射行号到章节文件。

### 3. 审计 agent 上下文溢出
**现象**：complete-graph.json（1.4MB）导致 agent context-overflow-unrecovered。
**对策**：每个 agent 只审计单个文件，拆为并行 step。
**教训**：给 agent 的数据量限制在 50KB 以内。

### 4. Fixer 修了中间产物被聚合覆盖
**现象**：Fixer 修了 `event-graph.json`，被 `build-graph.cjs all` 覆盖。
**对策**：Fixer 必须改源文件（`merged/events/*.json`），不是聚合产物。
**教训**：修复永远落在数据来源层，不是派生层。

### 5. 同一字段在不同 schema 中路径不同
**现象**：新 schema ability 的 owner 在 `periods[].users[]`，旧 schema 在 `periods[].snapshot.users[]`。
**对策**：build-graph.cjs 同时检查 `p.users`、`p.snapshot.users`、`p.snapshot.owner`。

### 6. relationship type 变成 `[object Object]`
**现象**：relationships 是嵌套对象 `{"reiki": {"type": "master"}}`，`String(type)` 输出 `[object Object]`。
**影响**：2,993 条关系中有 1,850 条 type 无效。
**教训**：提取模板应规范 relationships 为字符串格式。

### 7. ID 命名跨卷散裂
**现象**：`remielia` vs `remi-ellia`、`g3` vs `giii`。
**对策**：建立规范映射表，批量替换（73 文件内容 + 59 文件重命名）。
**教训**：提取前建立 canonical ID 映射表。

### 8. index schema 不统一
**现象**：vol-44/45 用顶层分类列表，vol-41~43 用 `entities+files`。
**对策**：Fixer 重写为标准结构。

### 9. 双向关系断裂
**现象**：A→B 有，B→A 无。
**对策**：审计 agent 做双向验证。

### 10. Agent 超时
**经验**：timeout 固定 900s，每批 25-30 文件，waitSeconds 上限 900s。

### 11. file:// 协议限制
**经验**：graph-viewer.html 用 `<script>` 加载 JS 数据文件，不用 fetch。

### 12. 合并前必须全量 JSON 校验
**经验**：merge-wave.cjs 碰到损坏文件崩溃。合并前 scan + 修复。

### 13. 事件最小粒度
**经验**：提取模板明确 single conflict 级别，过宽事件降级为 knowledge。

### 14. 引用字段校验目标存在
**经验**：counters/countered_by/related_events 必须校验目标实体存在。

### 15. JSON 引号修复
**经验**：状态机不可靠，用 `prevIsChinese && nextIsChinese` 上下文判断。

### 16. 聚合工具 schema 兼容
**经验**：同时检查 `periods[].*` 和 `periods[].snapshot.*`。

### 17. 审计核心是原文核验
**经验**：早期只查非空，漏了虚构。审计应先验证内容真实性，再查字段完整性。

### 18. 工具不做闭环
**经验**：build-graph.cjs 等工具只做机械聚合，产出必须经过 agent 审计闭环验证。

### 19. 合并后重建图谱
**经验**：Wave 级修复必须 re-merge → re-build-graph，graph 是派生品。
