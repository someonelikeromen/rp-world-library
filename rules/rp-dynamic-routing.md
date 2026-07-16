# 动态世界书路由 (Dynamic Worldbook Router)

> 来源: 型月引擎评审 A5  
> 用途: 大型世界中按场景变量动态加载对应世界书条目，避免全量加载

## 原则

大型世界有几十个子场景（如 FGO 30 个特异点/LB），不可能全加载到上下文。

需要一个路由器：读当前故事线变量 → 匹配路由规则 → 加载对应世界书条目。

## 路由表格式

每个世界定义一份 `route-table.json`：

```json
{
  "worldId": "type-moon-nasuverse",
  "sourceVariable": "currentArc",
  "routes": [
    {
      "match": "特异点F|冬木",
      "storyId": "fgo",
      "chapter": "特异点F",
      "loadEntries": ["fgo-特异点f-冬木"],
      "loadCharacters": ["库丘林(Caster)", "阿尔托莉雅(Alter)"],
      "loadMechanics": ["圣杯战争", "从者系统"]
    },
    {
      "match": "第六特异点|卡美洛",
      "storyId": "fgo",
      "chapter": "第六特异点",
      "loadEntries": ["fgo-第六特异点-卡美洛"],
      "loadCharacters": ["贝德维尔", "狮子王", "奥斯曼狄斯", "哈桑们"],
      "loadMechanics": ["圆桌骑士", "圣枪", "祝福系统"]
    }
  ],
  "defaultRoute": {
    "loadMechanics": ["魔术体系", "圣杯战争", "英灵系统"]
  }
}
```

## 路由流程

```
1. 读取当前状态变量 (currentArc / currentLocation / currentEvent)
   ↓
2. 遍历 route-table.routes，match 匹配
   ↓
3. 命中 → 加载 routes[].load*
     ├─ storyId + chapter → read stories/<story>/<chapter>.md
     ├─ loadCharacters → wl get <world> <char-id>
     └─ loadMechanics → grep mechanics-supplement.md
   ↓
4. 未命中 → 使用 defaultRoute
   ↓
5. 场景切换时 → 卸载过期条目，加载新路由条目
```

## 渐进式加载策略

| 时机 | 加载内容 | 大小 |
|------|---------|------|
| 进入世界 | world.json 摘要 + defaultRoute mechanics | ~20KB |
| 进入场景 | 匹配的路由: story chapter + characters | 2-8KB |
| 场景切换 | 卸载旧 chapter, 加载新 chapter | 交换 |
| 角色出现 | wl get 获取角色全文 | 按需 |
| 机制触发 | grep mechanics-supplement.md | 按需 |

## 路由表生成

归档时自动生成模板，agent 在整理分类时填充。后续 RP 中动态维护。
