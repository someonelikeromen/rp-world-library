# SAO 世界归档完整计划

## 核心原则
- **信息零损失**：所有源内容必须完整保留，只做结构化，不做摘要/压缩
- **JSON 优先**：最终归档产物以标准化 JSON 为主，Markdown 为辅
- **可追溯**：每条 JSON 记录关联源文件和原始文本
- **图谱完备**：所有实体关系必须可查询

---

## Phase 1：源清洗（进行中 ~90%）
目标：1140 个 source unit → 干净 Markdown
- 当前进度：1012/1140
- 预计完成：~2-3 小时

## Phase 2：文件归位 & 分类
- 散落在 root 的 .md 归入 records/ 对应子目录
- 按实体类型自动分类标记
- 生成 classification-index.json

## Phase 3：实体 JSON 提取
- agent_team 批量将每个实体 Markdown 转为标准化 JSON
- 12 种实体类型模板全覆盖
- 每个 JSON 包含 sourceRef 溯源字段

## Phase 4：去重 & 合并
- 同名实体多源描述合并
- 保留所有源文本不做取舍
- 生成 duplicates-report.md

## Phase 5：关系图谱构建
- nodes.json + edges.json
- adjacency-index.json 双向索引

## Phase 6：校验 & 补全
- 覆盖率校验：1140 条全链路
- JSON schema 校验
- 图谱边有效性

## Phase 7：正式归档部署
- 迁入 worlds/sword-art-online/extracted/
- 更新 .wl-index.json
- 清理临时 work area

---

## 实体类型定义 (12 类)
1. character - 角色/人物
2. location - 地点/区域
3. system - 系统/机制
4. event - 事件/剧情
5. rule - 规则/设定
6. item - 物品/道具
7. faction - 组织/公会
8. ability - 技能/能力
9. timeline - 时间线
10. monster - 怪物/Boss
11. concept - 概念/术语
12. meta - 元规则/输出格式
