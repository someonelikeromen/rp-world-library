# 时间轴重建方案

## 核心思路

利用 `extracted/` 已有实体之间的关联，逐层递进检索，由 LLM 理解并合成完整时间轴。**全程 AI agent，不使用任何脚本。**

---

## 检索驱动流程

```
起点: extracted/events/*.json（~400 个事件/世界）

第一层: 事件自身
  - volume → 叙事顺序参考
  - participants → 涉及角色
  - cause / outcome / aftermath → 因果链文本
  - related_events → 直接关联事件

第二层: 沿关联展开
  - 角色的 key_events → 该角色参与了哪些事件
  - 事件的 related_events → 因果相邻事件
  - 双向追溯: 哪些事件引用了当前事件

第三层: 再沿关联外推
  - 从关联事件继续检索它们的关联事件
  - 从关联角色继续检索它们参与的其他事件
  - 直到关联链闭合或到叙事边界

第四层: 时间线索提取与溯源
  - 从已知关联确定事件间的先后/并发关系
  - 不确定的时间 → source_refs → 读原文上下文
  - 状态描述中的时间词（"三日后恢复"）
  - 知识条目中的时间锚（"公元前460年"）
```

---

## Agent 任务

```
输入:
  - 指定世界的所有 extracted entity JSON
  - 需要时可读取原文章节段落（通过 source_refs 定位）

任务:
  1. 以 events 为入口，沿关联逐层检索
  2. 理解所有事件之间的因果、先后、并发、包含关系
  3. 识别作品的日历体系（公历/架空历）
  4. 确定每个事件在日历上的起止时间 + 关键节点
  5. 回忆/古代/闪回事件放在实际时间位置
  6. 短篇/番外事件插入主线正确位置
  7. 输出该世界的完整统一时间轴

产出:
  extracted/timeline.json

推理过程:
  - 因果链 → 时间先后
  - 角色 key_events 的 volume 推进 → 时间跨度
  - 同一事件多个角色的 period → 交叉验证
  - 无因果关联的事件 → 综合 volume、参与角色、场景推定位
```

---

## 关联检索路径示意

```
                     events/
                    ┌───┴───┐
                    │ event_A│
                    └───┬───┘
        participants│     │related_events
        ┌───────────┘     └───────────┐
        ▼                              ▼
  characters/                     events/
  ┌──────────┐                    ┌──────────┐
  │ char_X   │                    │ event_B  │
  │ key_events: [A, C, D]        │          │
  │ periods:  [vol-01, vol-04]   └────┬─────┘
  └──────────┘                   participants│
        │                                    ▼
        │ 沿 key_events 外推           characters/
        ▼                             ┌──────────┐
  events/                             │ char_Y   │
  ┌──────────┐                        └──────────┘
  │ event_C  │                              │
  └──────────┘                    沿 key_events 外推
        │                                    │
        │                                    ▼
        └──── 关联链继续展开 ───────────── events/
                                           ┌──────────┐
                                           │  event_D │
                                           └──────────┘
```

Agent 沿这个网逐层检索，理解全部关联后输出时间轴。

---

## 事件结构

```
{
  "event_id": "shiba-tower-duel",
  "label": "芝田塔决战",
  "time_span": {
    "start": "2008-04-05T14:00:00",
    "end":   "2008-04-05T14:30:00",
    "precision": "estimated",
    "duration_display": "约30分钟"
  },
  "nodes": [
    {
      "node_id": "shiba-tower-duel.warrior-sword",
      "label": "战士化身切断阿波罗狼权能",
      "timestamp": "2008-04-05T14:05:00",
      "participants": ["godou", "voban"]
    }
  ],
  "event_type": "main"
}
```

事件详情（cause/outcome/participants 全文）在 `extracted/events/*.json` 中已有，timeline 只存时间坐标。

---

## 日历体系

- 公历 → ISO 8601
- 架空历 → 作品内日历（"星球历 3400年7月"）
- 同一世界统一
- 古代事件同历追溯

---

## 角色状态映射（已有，不需新建）

```
RP 时间点
  → timeline 中该时间点之前的 event_id 集合
  → characters/*.periods[].key_events 匹配
  → 匹配到的 period = 该角色当前状态
```

---

## 产出

```
worlds/<slug>/extracted/
├── timeline.json
└── （已有 entity JSON 不变）
```

---

## 实施步骤

| 步骤 | 内容 |
|------|------|
| S1 | 探查：各世界事件/角色的关联密度，确认检索可行 |
| S2 | 写 Agent prompt：逐层检索 → 理解关联 → 合成时间轴 |
| S3 | 试点：campione |
| S4 | hidan-no-aria、saijaku-muhai-bahamut |
| S5 | rp-engine 集成 |
