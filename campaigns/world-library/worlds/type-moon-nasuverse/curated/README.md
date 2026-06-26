# 型月世界 (Type-Moon Nasuverse) — Curated

## 归档状态

- **归档日期**: 2026-06-26
- **方式**: agent_team 6领域并行（r1）+ 5小批重试（r2）+ 脚本原文注入 + 格式标准化
- **源数据**: 8 raw worldbook JSON，1038 条目，15.5MB
- **角色**: 318 个去重角色（全量原文内嵌）
- **故事**: 51 个独立章节（FGO 30章 + Fate 4线 + 妖精国历 17条）
- **基线完整度**: ✅ 7/7 基线 + Layer 2 扩展 + Layer 3 拆分

## 产物清单

| 文件 | 大小 | 说明 |
|------|------|------|
| `world.json` | 15KB | 世界框架（对齐 combat framework），含 powerSystems(10)/factions(7)/rules(5)/locations(4)/events(7)/timelines(9) + Layer2扩展 |
| `characters-index.json` | 5.0MB | 318角色，全量原文内嵌（detail + sourceContent + sourceRefs） |
| `source-registry.json` | 3KB | 8源文件索引 |
| `relationship-graph.json` | 11KB | 28节点+29边 |
| `knowledge-graph.json` | 8KB | 22节点+16边 |
| `engine-review-analysis.md` | 18KB | Tier A(5)/B(6)/C，MVU/思维链/事件引擎可迁移模式 |
| `review-report.md` | 28KB | 校验报告 |
| `curation-notes.md` | 2KB | 归档笔记/经验/未解决 |
| `stories/` | 51文件 | FGO(30章)/Fate(4线)/妖精国历(17条)，索引+独立章节 |

## 渐进式加载

```
stories/
├── fgo/index.json    8KB   30章索引导航
├── fate/index.json   1KB   4线索引
└── fairy/index.json  8KB   17条时间线索引
```

进世界→读索引（17KB）。剧情触发→按需加载单章（2-8KB）。

## 工具链

```
tools/curation/
├── enrich-curated.js    原文注入
├── normalize-format.js  格式标准化（20条规则）
└── replace.js           精确行级/模式替换
```
