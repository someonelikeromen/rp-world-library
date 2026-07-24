# 刀剑神域 (Sword Art Online) - 世界归档

## 概述
- **世界观**：SAO/ALO/GGO 系列
- **归档日期**：2026-07-23
- **状态**：完整归档

## 数据来源 (4 源，1140 原始单元)
| 来源 | 类型 | 单元数 |
|------|------|--------|
| card-local-1 | 本地角色卡 JSON | 199 |
| card-sao-progressive-v1-3 | Progressive 角色卡 JSON | 269 |
| wb-sao-v1-1 | 世界书 JSON | 35 |
| txt-aincrad-trpg-floor-module | 楼层模块 TXT | 637 |

## 归档产物
| 产物 | 数量 | 路径 |
|------|------|------|
| 清洗后 Markdown | 1025 | `source-cleaned/records/` |
| 分类索引 | 1 | `source-cleaned/classification-index.json` |
| 提取实体 JSON | 1027 | `extracted/{characters,locations,...}/` |
| 去重报告 | 1 | `curated/duplicates-report.json` |
| 图谱节点 | 1027 | `extracted/graph/nodes.json` |
| 图谱边 | 292 | `extracted/graph/edges.json` |
| 邻接索引 | 1 | `extracted/graph/adjacency-index.json` |
| 归档清单 | 1 | `manifest.json` |

## 实体分类
| 类别 | 数量 |
|------|------|
| 角色 (characters) | 300+ |
| 地点 (locations) | 438 |
| 系统 (systems) | 130 |
| 事件 (events) | 41 |
| 怪物 (monsters) | 36 |
| 物品 (items) | 30 |
| 组织 (factions) | 17 |
| 规则 (rules) | 9 |
| 技能 (abilities) | 8 |
| 概念 (concepts) | 6 |
| 元数据 (meta) | 8 |

## 处理管线
1. **源拆分** → 1140 source unit (JSON + TXT)
2. **AI 清洗** → 1025 干净 Markdown (去除 ST 语法，宏→自然语言，XML 剥离)
3. **文件归位** → 按源分类到 records/ 子目录
4. **自动分类** → 12 类实体识别
5. **JSON 提取** → Markdown → 结构化 JSON（信息零损失）
6. **去重** → 124 重复组识别，跨源合并
7. **图谱构建** → 1027 节点，292 关系边
8. **正式部署** → 迁入 worlds/sword-art-online/
