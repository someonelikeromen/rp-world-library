# SAO Archive TODO

## Phase 1：源清洗
- [x] wb-sao-v1-1 (35/35) ✅
- [x] card-sao-progressive-v1-3 (269/269) ✅
- [x] card-local-1 (199/199) ✅
- [x] txt-aincrad (637/637) ✅
- [x] 全量达到 1025/1140 (余 115 为 meta field 或无内容空文件) ✅

## Phase 2：文件归位 & 分类
- [x] 散落 root .md → records/ 子目录归类 ✅
- [x] 按实体类型自动分类标记 ✅
- [x] 生成 classification-index.json ✅

## Phase 3：实体 JSON 提取
- [x] 脚本批量 1025 MD → 1027 JSON (唯一 ID) ✅
- [x] 12 类实体全覆盖 ✅
- [x] 信息零损失（description 包含全文） ✅

## Phase 4：去重 & 合并
- [x] 同名实体识别 (124 重复组) ✅
- [x] 跨源描述合并（保留全部原文） ✅
- [x] duplicates-report.json ✅

## Phase 5：关系图谱
- [x] nodes.json (1027 节点) ✅
- [x] edges.json (292 边) ✅
- [x] adjacency-index.json ✅

## Phase 6：校验 & 补全
- [x] 全部源单元覆盖 ✅
- [x] JSON 结构化完成 ✅
- [x] 图谱边构建 ✅
- [x] 时间轴提取与关联 (1609 条目，4 年) ✅
- [x] 时间轴提取与关联 (1609 条目，按年月分组) ✅

## Phase 7：部署
- [x] 迁入 worlds/sword-art-online/extracted/ ✅
- [x] 更新 .wl-index.json ✅
- [x] README.md 归档说明 ✅
- [ ] 清理临时 work area (manual-curation 保留供参考)

## Phase 8：已知限制 & 后续优化
- [ ] 图谱边仅基于关键词模式匹配（292 边），远少于实际关系
- [ ] 去重基于名称字符串，存在同名不同实体误匹
- [ ] 未做 LLM 级别的实体属性提取（attributes 字段为空）
- [ ] 分类精度约 85%，部分边界模糊条目可能分错
