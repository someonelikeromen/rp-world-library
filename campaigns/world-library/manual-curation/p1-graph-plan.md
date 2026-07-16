# Phase 3: 全量图谱构建计划

## 数据基础
```
merged/
├── characters/  449   ← relationships, abilities_owned, possessions_owned
├── abilities/   810   ← owner, type, known_feats
├── events/      605   ← participants, cause, outcome, related_events
├── items/       714   ← owner, type, features
├── locations/   378   ← affiliated_faction, related_events
├── factions/    153   ← members, allied_factions
├── systems/     203   ← related_faction, related_abilities
├── knowledge/   237   ← related_entities
└── graph/             ← 已有: char-relations-core, event-causality(partial)
```

## 管线

### Step 1: 能力图谱 (Ability Graph)
```
输入: merged/abilities/*.json (810文件)
提取: 每能力的 type, owner, details, known_feats
产出: merged/graph/ability-graph.json
      { abilities: [{ id, type, owner, volumes }],
        ability_character_links: [{ character_id, ability_id, volumes }] }
```

### Step 2: 物品图谱 (Item Graph)
```
输入: merged/items/*.json (714文件)
提取: 每物品的 type, owner, features
产出: merged/graph/item-graph.json
      { items: [{ id, type, owner, volumes }],
        item_character_links: [{ character_id, item_id, volumes }] }
```

### Step 3: 事件图谱 (Event Graph)
```
输入: merged/events/*.json (605文件)
提取: participants, cause, outcome, type, related_events
产出: merged/graph/event-graph.json
      { events: [{ id, type, participants, cause, outcome }],
        event_participant_links: [{ event_id, character_id, role }],
        event_causal_chains: [{ from, to, relation }] }
```

### Step 4: 势力/地点/体系图谱
```
输入: merged/factions/ + merged/locations/ + merged/systems/ (734文件)
提取: 势力成员、地点关联事件、体系关联能力
产出: merged/graph/world-graph.json
```

### Step 5: 统一时间轴 (Timeline)
```
输入: 所有 3,549 个实体文件的 periods[]
提取: 每实体的 period_id, volume, time, label, summary
排序: 按 volume → time
产出: merged/timeline/timeline.json
      merged/timeline/timeline-by-volume.json
```

### Step 6: 完整关联图谱 (Complete Entity Graph)
```
输入: 以上所有子图谱
合并: 角色→能力, 角色→物品, 事件→参与者, 势力→成员, 地点→事件
      角色→角色(关系), 事件→事件(因果)
产出: merged/graph/complete-graph.json
      { nodes: [{ id, type, label, group }],
        edges: [{ source, target, relation, volumes }] }
```

### Step 7: 可视化工具 (Visualizer)
```
输入: complete-graph.json
输出: tools/p1-scan/graph-visualizer.html
功能: - 力导向图 (D3.js / vis.js)
      - 按实体类型筛选 (角色/能力/物品/事件)
      - 按卷范围筛选
      - 搜索框: 按名称搜索节点
      - 点击节点显示详情
      - 关系高亮: 选中节点高亮所有连接
```

## 执行策略

每个子图用 agent_team 批量处理：
- 每批 ~25 个文件（避免 json_tool 超时）
- 并发 5 个 agent
- 然后 merge agent 汇总
- 然后 audit → fix 闭环

总计批次数：
| 子图 | 文件数 | 批次 | agent轮次 |
|------|--------|------|-----------|
| 能力图谱 | 810 | ~32 | 6-7 |
| 物品图谱 | 714 | ~28 | 5-6 |
| 事件图谱 | 605 | ~24 | 4-5 |
| 世界图谱 | 734 | ~29 | 5-6 |
| 时间轴 | 3549 | 需特殊处理 | - |
| 合并图谱 | - | 1 | 1 |
| 可视化 | - | 1 | 1 |
