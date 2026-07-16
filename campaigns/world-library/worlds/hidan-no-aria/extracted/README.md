# 绯弹的亚里亚 — 提取数据

## 概况
- 主系列 45 卷 + AA 外传 4 卷
- 来源：`campaigns/world-library/worlds/hidan-no-aria/sources/split-text/`
- 提取方式：pi agent（World Archive Extraction pipeline）

## 实体统计

| 类型 | 文件数 | 说明 |
|------|--------|------|
| characters | 501 | 角色（含主角、配角、反派） |
| abilities | 898 | 能力/技能/技术 |
| events | 719 | 事件（含 cause/outcome/participants） |
| items | 825 | 物品/装备/道具 |
| locations | 456 | 地点/场景 |
| factions | 180 | 势力/组织/团体 |
| systems | 241 | 设定体系/规则 |
| knowledge | 337 | 知识条目/背景设定 |
| **合计** | **4,157** | |

## 图谱数据 (`graph/`)
- `char-relations.json` — 角色关系图（3,476 条边）
- `ability-graph.json` — 能力图（898 条）
- `item-graph.json` — 物品图（825 条）
- `event-graph.json` — 事件 + 因果链（719 事件 + 因果边）
- `world-graph.json` — 世界实体图
- `timeline.json` — 时间轴（5,087 条目）
- `complete-graph.json` — 完整关联图（3,479 节点 + 9,604 边）
- `*-data.js` — 配套 JS 数据文件（用于 `graph-viewer.html`）

## 可视化
双击 `graph-viewer.html` 可在浏览器中查看交互式知识图谱。

## 构建工具 (`tools/`)
- `build-graph.cjs` — 从 `merged/` 重建所有图谱
- `merge-wave.cjs` — 卷级合并工具
- `json-tool.cjs` — JSON 编辑工具

## 质量保证
- 全部 49 卷经审计 agent 对照原文核验
- 无虚构、无遗漏、无扭曲
- source_refs 精确到章节文件行号
- ID 命名统一
