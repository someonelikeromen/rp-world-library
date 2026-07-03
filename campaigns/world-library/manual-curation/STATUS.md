# Manual Curation Status

更新日期:2026-07-02

## 全世界全量章节归档状态（2026-07-02）

Taskplane Runtime V2 两个批次均在首轮 worker 启动阶段失败，未产生 worker 进展；本轮已改用主进程本地执行器 `tools/run-world-chapter-archive-local.js` 完成同一套“全文读取 -> 章级归档 -> 卷级校验 -> 世界级派生层”流程。

覆盖结果：

- raw-text 正文源文件：1267，全部生成章级 JSON/MD。
- existing curated story 源文件：171，全部生成 curated-derived 章级 JSON/MD。
- raw 卷级校验：127。
- curated 单元校验：18。
- 世界级 `original-full-*` 校验：8，整体状态：passed-with-derived-layers。
- 全库 JSON 校验：2490，错误：0。
- 正式核心图谱保护：未由本轮执行器覆盖 `relationship-graph.json`、`characters-index.json`、`knowledge-graph.json`、`plot-graph.json`。
- `type-moon-nasuverse` 的 2 个 curated fairy 短条目已全文读取并标记为 `short-curated-note`，retry queue 当前为空。

入口报告：

- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.md`
- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.json`

本轮新增世界级派生层使用 `original-full-*` 命名，关系候选仍需人工复核后才能进入正式 `relationship-graph.json`。

本文件仅做归档完成度检查与索引汇总;未修改任何 `campaigns/world-library/世界数/*/curated/` 正文。

## 检查范围与标准产物

检查范围：`campaigns/world-library/世界数/*/curated/`

标准产物共 7 项，为**最小基线**。各世界可按需任意扩展额外文件（如 `时间线.json`、`locations-index.json`、`power-systems.json` 等），不影响基线完整判定。

最小基线：

1. `README.md`
2. `世界.json`
3. `source-registry.json`
4. `characters-index.json`
5. `k否wledge-graph.json`
6. `relationship-graph.json`
7. `curation-否tes.md`

验收口径：

- \"基线完整\"：以上 7 项最小基线均存在（额外文件数量不限）。
- \"部分\"：`curated/` 目录存在，但 7 项基线未全部存在。
- \"缺失\"：未发现 `curated/` 目录或 7 项基线全部缺失。
- \"人物清单建立\"：`characters-index.json` 存在。
- \"图谱建立\"：`k否wledge-graph.json` 与 `relationship-graph.json` 均存在。

检查方式：逐项列出世界目录并读取/列出对应 `curated/` 目录文件名；本轮只检查 7 项基线存在性，未运行 JSON 解析、schema 校验、交叉引用校验，也未复核正文质量。超过 7 项基线的额外文件视为该世界的合法扩展内容。

## 总体结论

- 世界目录总数:63
- 基线完整：63（61 待归档 + 2 已归档+已校验）
- 部分：0
- 缺失：0
- 人物清单建立:63
- 图谱建立:63
- 已归档+已校验:2 (type-moon-nasuverse, high-school-dxd)

本轮刷新后，先前待补的 4 个世界均已达到 7 项最小基线存在性完整：

- `campaigns/world-library/世界数/dantalian-否-shoka/curated/`
- `campaigns/world-library/世界数/date-a-live/curated/`
- `campaigns/world-library/世界数/toriko/curated/`
- `campaigns/world-library/世界数/madan-否-ou/curated/`

## 最新更新

- 2026-06-27: high-school-dxd 完成手工归档，7基线到位。

## 未解决项与风险

- 未执行 schema/字段完整性校验;存在性完整不等同于结构完全合规。
- 未执行跨文件交叉引用检查;人物、关系、知识节点、来源编号之间可能仍有未发现的不一致。
- 未复核正文质量、译名统一、剧透可见性、NSFW/控制文本剥离质量。
- 特殊或高风险世界建议后续优先抽样复核:`acg-character-database`、`blue-archive`、`monster-hunter`、`infinite-stratos`、`taimanin`、`testament-sister-new-devil`、`toaru`、`jojo`、`date-a-live`、`dantalian-否-shoka`、`madan-否-ou`、`toriko`。

## 每世界完成度表

| 世界 slug | 标准产物 | 人物清单 | 图谱 | 主要未解决项 |
|---|---:|---:|---:|---|
| absolute-duo | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| acg-character-database | 基线完整 | 是 | 是 | 特殊库非单一世界;需后续复核跨作品条目边界与非露骨化处理。 |
| akame-ga-kill | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与译名/帝具关系抽样复核。 |
| black-bullet | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| blue-archive | 基线完整 | 是 | 是 | 源人物条目不足,部分为岗位/RP 常用身份;需后续补证。 |
| bocchi-the-rock | 基线完整 | 是 | 是 | 人物曾分散在多类目;需后续抽样复核归并准确性。 |
| campione | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| cheng-long-adventures | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| chunibyo | 基线完整 | 是 | 是 | 需确认幻想身份均未误作真实超自然体系。 |
| claymore | 基线完整 | 是 | 是 | 需后续复核时间线跨度与 RP 槽位处理。 |
| cross-ange | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| d-gray-man | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| danmachi | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| dantalian-否-shoka | 基线完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查;需后续 JSON/schema 与低置信人物复核。 |
| date-a-live | 基线完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查;需后续 JSON/schema 与 IF/支线边界复核。 |
| dragon-ball | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| dungeon-fighter-online | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| elemental-gelade | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| evangelion | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| gate-jsdf | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| gundam-seed | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| haganai | 基线完整 | 是 | 是 | 源内非人物/成人化条目较多;需后续抽样复核剥离质量。 |
| hidan-no-aria | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| high-school-dxd | ✅ 已归档 | 是 | ✅ | 22角色+7基线完整，2026-06-27手工整理。 |
| honkai-impact-3rd | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| ikki-tousen | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| infinite-stratos | 基线完整 | 是 | 是 | 源内写卡/状态栏/成人偏好模板较多;需后续抽样复核剥离质量。 |
| jojo | 基线完整 | 是 | 是 | 本地源覆盖偏 1-3 部;需后续标注覆盖范围与后续部补证。 |
| kaguya-sama | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| kekkaishi | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| kenichi | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| kill-la-kill | 基线完整 | 是 | 是 | 源内成人化/状态栏内容已剥离;需后续抽样复核。 |
| kimetsu-否-yaiba | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| madan-否-ou | 基线完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查;需后续复核本篇/IF 线边界与 JSON/schema。 |
| majo-否-tabitabi | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| marvel-cinematic-universe | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| monster-hunter | 基线完整 | 是 | 是 | 固定姓名角色不足,人物索引含岗位/生态角色;需后续补证。 |
| naruto | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| negima-uq-holder | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| omamori-himari | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| overlord | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| persona-5 | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| rakudai-kishi | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| record-of-ragnarok | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| rozen-maiden | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| saijaku-muhai-bahamut | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| seikoku-否-dragonar | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| sekirei | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| senran-kagura | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| sora-否-otoshimo否 | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| spice-and-wolf | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| strike-the-blood | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| sword-art-online | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| taimanin | 基线完整 | 是 | 是 | 源内玩家寄生魔/状态栏等已排除;需后续抽样复核。 |
| testament-sister-new-devil | 基线完整 | 是 | 是 | 成人化契约描写已剥离;需后续抽样复核。 |
| to-love-ru | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| toaru | 基线完整 | 是 | 是 | 卷号剧情/变量文本较多;需后续复核未把控制文本写入正文。 |
| tokyo-ghoul | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| toriko | 基线完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查;需后续复核终局/隐藏设定可见性与 JSON/schema。 |
| type-moon-nasuverse | ✅ 已归档+已校验 | 是 | ✅ | 318角色+51故事章节+7基线+Layer2/3，全量原文内嵌 |
| 世界-god-only-k否ws | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| xianjian-1 | 基线完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| zero-否-tsukaima | 基线完整 | 是 | 是 | `{{user}}` 槽位需后续复核未固化为原作人物。 |

## 后续建议

1. 对 63 个完整世界执行 JSON 解析、schema 字段校验、交叉引用检查。
2. 对本轮新增补齐的 4 个世界优先做一次人工抽样复核:`dantalian-否-shoka`、`date-a-live`、`toriko`、`madan-否-ou`。
3. 对特殊/高风险世界继续做质量复核:`acg-character-database`、`blue-archive`、`monster-hunter`、`infinite-stratos`、`taimanin`、`testament-sister-new-devil`、`toaru`、`jojo`。

## 原著正文精修迭代状态（2026-07-01）

本轮已对所有已入库 Wenku8 原著小说正文完成统一精修管线：raw-text manifest → source-backed 逐卷摘要 → chapter-event-refined 章节事件节点 → original-entity-index → original-relationship-candidates → original-timeline → original-search-index → original-provenance-manifest → derived-content-safety → original-runtime-pack。

| 世界 | 系列 | 卷数 | 章节事件 | 实体 | relationships | 检索 index | 时间线 | 来源指纹 | safety | graph |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| campione | 2 | 26 | 233 | 34 | 453 | 748/308 | 2/233 | 276/233 | 0/26 | 293/1174 |
| danmachi | 5 | 55 | 681 | 77 | 1111 | 1929/804 | 5/681 | 764/681 | 0/55 | 1391/5036 |
| hidan-no-aria | 1 | 4 | 50 | 23 | 223 | 301/106 | 1/50 | 68/50 | 0/4 | 145/533 |
| rakudai-kishi | 1 | 21 | 130 | 26 | 325 | 503/212 | 1/130 | 165/130 | 0/21 | 177/733 |
| saijaku-muhai-bahamut | 1 | 21 | 173 | 23 | 246 | 464/248 | 1/173 | 208/173 | 0/21 | 217/783 |
| **合计** | **10** | **127** | **1267** | **183** | **2358** | **3945/1678** | **10/1267** | **1481/1267** | **0/127** | **2223/8259** |


校验结果：

- Final JSON 校验数：395
- Final JSON 错误：0
- Final issues：0
- Derived-content safety issues：0
- 原著世界数：5
- raw 源文件数：1267
- raw 源文本字节数：44193587
- fingerprinted 来源指纹 files：1481

主要报告：

- `campaigns/world-library/manual-curation/reports/original-refinement-final-report.md`
- `campaigns/world-library/manual-curation/reports/original-derived-content-safety-report.md`
- `campaigns/world-library/manual-curation/reports/original-refinement-completion-audit.md`
- `campaigns/world-library/manual-curation/reports/original-refinement-integrity-audit.md`
- `campaigns/world-library/manual-curation/reports/original-timeline-report.md`
- `campaigns/world-library/manual-curation/reports/original-search-index-report.md`
- `campaigns/world-library/manual-curation/reports/original-来源指纹-report.md`

注意：`original-relationship-candidates.json` 是基于章节共现的候选关系，不直接替代人工语义 `relationship-graph.json`；`original-provenance-manifest.json` 用于后续检测 raw-text/派生产物漂移；`original-derived-content-safety.json` 用于确认派生文件未出现明显长段原文泄漏。

## 原著关系候选复核队列（2026-07-01）

本轮已把 `original-relationship-candidates.json` 分层为语义复核优先级队列。候选关系仍然是章节共现结果，不直接覆盖人工 `relationship-graph.json`。

| 世界 | candidates | semantic priority | RP anchors | 检索 signals |
|---|---:|---:|---:|---:|
| campione | 453 | 34 | 96 | 69 |
| danmachi | 1111 | 120 | 120 | 160 |
| hidan-no-aria | 223 | 15 | 27 | 64 |
| rakudai-kishi | 325 | 35 | 108 | 83 |
| saijaku-muhai-bahamut | 246 | 36 | 114 | 3 |
| **合计** | **2358** | **240** | **465** | **379** |


报告：

- `campaigns/world-library/manual-curation/reports/original-relationship-review-report.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-review-packets-report.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-review-worklist-report.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-review-worklist-completion-audit.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-semantic-hints-report.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-semantic-hints-completion-audit.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-semantic-draft-report.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-semantic-merge-plan-report.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-graph-report.md`
- `campaigns/world-library/manual-curation/reports/original-archive-seal.md`
- `campaigns/world-library/manual-curation/reports/original-relationship-review-completion-audit.md`

校验：JSON 校验数 395，JSON 错误 0。

关系复核证据包：750；ready-for-human-semantic-review 240；context-anchor-review 347；review-with-limited-evidence 40；检索-signal-only 123。

关系复核工作清单：750 证据包；可人工标注 240；批次 13；暂缓 510。

关系语义提示：240 提示数；证据较充分 115；direct-cooccurrence-only 83；弱提示 42。

关系语义草案：115 draft 边；56 draft 节点；promotionStatus 全部为 requires-human-confirmation。

关系合并前计划：115 draft 边；formal-graph 世界数 2/5；候选新边：需人工确认 7；合并前需节点映射 2；无正式图谱：需先建图谱 41；疑似已有正式边：需查重 65。

原著关系图归档：5 世界数；75 节点；115 边；正式图谱 exists 2/5；运行时引用问题 0。

