# Manual Curation Index

更新日期：2026-07-02

用途：作为 `campaigns/world-library/世界数/*/curated/` 手工整理产物的总索引。详细完成度与未解决项见 `campaigns/world-library/manual-curation/STATUS.md`。

## 全章节派生归档入口（2026-07-02）

本轮已完成 8 个目标世界的全量章节/故事源派生归档，覆盖 raw-text 正文文件 1267 个、existing curated story 文件 171 个。输出层为 `chapter-archives*`、`volume-archives`、`volume-refined`、`retry-queues*` 和世界级 `original-full-*`，不覆盖正式核心图谱。

主要入口：

- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.md`
- `campaigns/world-library/manual-curation/reports/all-world-full-chapter-archive-final.json`
- `campaigns/world-library/worlds/*/curated/original-full-runtime-pack.json`
- `campaigns/world-library/worlds/*/curated/original-full-chapter-archive-index.json`
- `campaigns/world-library/worlds/*/curated/original-full-volume-archive-index.json`
- `campaigns/world-library/worlds/*/curated/original-full-relationship-candidates.json`
- `campaigns/world-library/worlds/*/curated/proposed-core-graph-gap-review.json`

相关目录文档：

- `campaigns/world-library/manual-curation/STATUS.md`：归档完成度与风险状态。
- `campaigns/world-library/manual-curation/SOURCE-ORIGINALS.md`：按“有小说原著 / 非小说原著 / 混合型”记录 63 个世界，并标注本地原文状态，便于后续补找原文。

## 标准产物索引说明

每个完成世界的 `curated/` 目录需满足 **7 项最小基线**，可在此基础上任意扩展额外文件。

最小基线：

- `README.md`
- `世界.json`
- `source-registry.json`
- `characters-index.json`
- `k否wledge-graph.json`
- `relationship-graph.json`
- `curation-否tes.md`

索引字段：

- `基线完整`：7 项最小基线均存在（额外文件不限）。
- `人物`：`characters-index.json` 存在。
- `图谱`：`k否wledge-graph.json` 与 `relationship-graph.json` 均存在。

## 汇总

- 世界目录总数：63
- 基线完整 curated 世界：63（62 assumed + 1 已归档）
- 部分 curated 世界：0
- 缺失 curated 世界：0

## 基线完整 curated 世界

| 世界 slug | curated 路径 | 基线完整 | 人物 | 图谱 |
|---|---|---:|---:|---:|
| absolute-duo | `campaigns/world-library/世界数/absolute-duo/curated/` | 是 | 是 | 是 |
| acg-character-database | `campaigns/world-library/世界数/acg-character-database/curated/` | 是 | 是 | 是 |
| akame-ga-kill | `campaigns/world-library/世界数/akame-ga-kill/curated/` | 是 | 是 | 是 |
| black-bullet | `campaigns/world-library/世界数/black-bullet/curated/` | 是 | 是 | 是 |
| blue-archive | `campaigns/world-library/世界数/blue-archive/curated/` | 是 | 是 | 是 |
| bocchi-the-rock | `campaigns/world-library/世界数/bocchi-the-rock/curated/` | 是 | 是 | 是 |
| campione | `campaigns/world-library/世界数/campione/curated/` | 是 | 是 | 是 |
| cheng-long-adventures | `campaigns/world-library/世界数/cheng-long-adventures/curated/` | 是 | 是 | 是 |
| chunibyo | `campaigns/world-library/世界数/chunibyo/curated/` | 是 | 是 | 是 |
| claymore | `campaigns/world-library/世界数/claymore/curated/` | 是 | 是 | 是 |
| cross-ange | `campaigns/world-library/世界数/cross-ange/curated/` | 是 | 是 | 是 |
| d-gray-man | `campaigns/world-library/世界数/d-gray-man/curated/` | 是 | 是 | 是 |
| danmachi | `campaigns/world-library/世界数/danmachi/curated/` | 是 | 是 | 是 |
| dantalian-否-shoka | `campaigns/world-library/世界数/dantalian-否-shoka/curated/` | 是 | 是 | 是 |
| date-a-live | `campaigns/world-library/世界数/date-a-live/curated/` | 是 | 是 | 是 |
| dragon-ball | `campaigns/world-library/世界数/dragon-ball/curated/` | 是 | 是 | 是 |
| dungeon-fighter-online | `campaigns/world-library/世界数/dungeon-fighter-online/curated/` | 是 | 是 | 是 |
| elemental-gelade | `campaigns/world-library/世界数/elemental-gelade/curated/` | 是 | 是 | 是 |
| evangelion | `campaigns/world-library/世界数/evangelion/curated/` | 是 | 是 | 是 |
| gate-jsdf | `campaigns/world-library/世界数/gate-jsdf/curated/` | 是 | 是 | 是 |
| gundam-seed | `campaigns/world-library/世界数/gundam-seed/curated/` | 是 | 是 | 是 |
| haganai | `campaigns/world-library/世界数/haganai/curated/` | 是 | 是 | 是 |
| hidan-no-aria | `campaigns/world-library/世界数/hidan-no-aria/curated/` | 是 | 是 | 是 |
| high-school-dxd | `campaigns/world-library/世界数/high-school-dxd/curated/` | 是 | 是 | 是 |
| honkai-impact-3rd | `campaigns/world-library/世界数/honkai-impact-3rd/curated/` | 是 | 是 | 是 |
| ikki-tousen | `campaigns/world-library/世界数/ikki-tousen/curated/` | 是 | 是 | 是 |
| infinite-stratos | `campaigns/world-library/世界数/infinite-stratos/curated/` | 是 | 是 | 是 |
| jojo | `campaigns/world-library/世界数/jojo/curated/` | 是 | 是 | 是 |
| kaguya-sama | `campaigns/world-library/世界数/kaguya-sama/curated/` | 是 | 是 | 是 |
| kekkaishi | `campaigns/world-library/世界数/kekkaishi/curated/` | 是 | 是 | 是 |
| kenichi | `campaigns/world-library/世界数/kenichi/curated/` | 是 | 是 | 是 |
| kill-la-kill | `campaigns/world-library/世界数/kill-la-kill/curated/` | 是 | 是 | 是 |
| kimetsu-否-yaiba | `campaigns/world-library/世界数/kimetsu-否-yaiba/curated/` | 是 | 是 | 是 |
| madan-否-ou | `campaigns/world-library/世界数/madan-否-ou/curated/` | 是 | 是 | 是 |
| majo-否-tabitabi | `campaigns/world-library/世界数/majo-否-tabitabi/curated/` | 是 | 是 | 是 |
| marvel-cinematic-universe | `campaigns/world-library/世界数/marvel-cinematic-universe/curated/` | 是 | 是 | 是 |
| monster-hunter | `campaigns/world-library/世界数/monster-hunter/curated/` | 是 | 是 | 是 |
| naruto | `campaigns/world-library/世界数/naruto/curated/` | 是 | 是 | 是 |
| negima-uq-holder | `campaigns/world-library/世界数/negima-uq-holder/curated/` | 是 | 是 | 是 |
| omamori-himari | `campaigns/world-library/世界数/omamori-himari/curated/` | 是 | 是 | 是 |
| overlord | `campaigns/world-library/世界数/overlord/curated/` | 是 | 是 | 是 |
| persona-5 | `campaigns/world-library/世界数/persona-5/curated/` | 是 | 是 | 是 |
| rakudai-kishi | `campaigns/world-library/世界数/rakudai-kishi/curated/` | 是 | 是 | 是 |
| record-of-ragnarok | `campaigns/world-library/世界数/record-of-ragnarok/curated/` | 是 | 是 | 是 |
| rozen-maiden | `campaigns/world-library/世界数/rozen-maiden/curated/` | 是 | 是 | 是 |
| saijaku-muhai-bahamut | `campaigns/world-library/世界数/saijaku-muhai-bahamut/curated/` | 是 | 是 | 是 |
| seikoku-否-dragonar | `campaigns/world-library/世界数/seikoku-否-dragonar/curated/` | 是 | 是 | 是 |
| sekirei | `campaigns/world-library/世界数/sekirei/curated/` | 是 | 是 | 是 |
| senran-kagura | `campaigns/world-library/世界数/senran-kagura/curated/` | 是 | 是 | 是 |
| sora-否-otoshimo否 | `campaigns/world-library/世界数/sora-否-otoshimo否/curated/` | 是 | 是 | 是 |
| spice-and-wolf | `campaigns/world-library/世界数/spice-and-wolf/curated/` | 是 | 是 | 是 |
| strike-the-blood | `campaigns/world-library/世界数/strike-the-blood/curated/` | 是 | 是 | 是 |
| sword-art-online | `campaigns/world-library/世界数/sword-art-online/curated/` | 是 | 是 | 是 |
| taimanin | `campaigns/world-library/世界数/taimanin/curated/` | 是 | 是 | 是 |
| testament-sister-new-devil | `campaigns/world-library/世界数/testament-sister-new-devil/curated/` | 是 | 是 | 是 |
| to-love-ru | `campaigns/world-library/世界数/to-love-ru/curated/` | 是 | 是 | 是 |
| toaru | `campaigns/world-library/世界数/toaru/curated/` | 是 | 是 | 是 |
| tokyo-ghoul | `campaigns/world-library/世界数/tokyo-ghoul/curated/` | 是 | 是 | 是 |
| toriko | `campaigns/world-library/世界数/toriko/curated/` | 是 | 是 | 是 |
| type-moon-nasuverse | `campaigns/world-library/世界数/type-moon-nasuverse/curated/` | ✅ 已归档+已校验 | 是 | ✅ |
| 世界-god-only-k否ws | `campaigns/world-library/世界数/世界-god-only-k否ws/curated/` | 是 | 是 | 是 |
| xianjian-1 | `campaigns/world-library/世界数/xianjian-1/curated/` | 是 | 是 | 是 |
| zero-否-tsukaima | `campaigns/world-library/世界数/zero-否-tsukaima/curated/` | 是 | 是 | 是 |

## 部分/缺失世界

型月已通过 agent_team 归档（待补 characters-index 合并和图谱），其余 62 个世界仍为 assumed 状态，待后续批次处理。

## 后续 QA 索引

1. 对全部 63 个完整世界做 JSON 解析、schema 检查、交叉引用检查。
2. 对本轮新增补齐的 4 个世界优先抽样复核：`dantalian-否-shoka`、`date-a-live`、`toriko`、`madan-否-ou`。
3. 对特殊/高风险世界做人工抽样复核：`acg-character-database`、`blue-archive`、`monster-hunter`、`infinite-stratos`、`taimanin`、`testament-sister-new-devil`、`toaru`、`jojo`。

## 原著正文精修入口（2026-07-01）

已入库原著正文的 5 个小说世界已完成 runtime pack 汇总，可作为 RP 运行时优先入口。

| 世界 | 系列 | 卷数 | 章节事件 | 实体 | relationships | 检索 index | 时间线 | 来源指纹 | safety | graph |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| campione | 2 | 26 | 233 | 34 | 453 | 748/308 | 2/233 | 276/233 | 0/26 | 293/1174 |
| danmachi | 5 | 55 | 681 | 77 | 1111 | 1929/804 | 5/681 | 764/681 | 0/55 | 1391/5036 |
| hidan-no-aria | 1 | 4 | 50 | 23 | 223 | 301/106 | 1/50 | 68/50 | 0/4 | 145/533 |
| rakudai-kishi | 1 | 21 | 130 | 26 | 325 | 503/212 | 1/130 | 165/130 | 0/21 | 177/733 |
| saijaku-muhai-bahamut | 1 | 21 | 173 | 23 | 246 | 464/248 | 1/173 | 208/173 | 0/21 | 217/783 |
| **合计** | **10** | **127** | **1267** | **183** | **2358** | **3945/1678** | **10/1267** | **1481/1267** | **0/127** | **2223/8259** |


入口文件：

- `campaigns/world-library/manual-curation/reports/original-refinement-final-report.md`
- `campaigns/world-library/世界数/*/curated/original-runtime-pack.json`
- `campaigns/world-library/世界数/*/curated/original-runtime-pack.md`
- `campaigns/world-library/世界数/*/curated/original-timeline.json`
- `campaigns/world-library/世界数/*/curated/original-search-index.json`
- `campaigns/world-library/世界数/*/curated/original-provenance-manifest.json`
- `campaigns/world-library/世界数/*/curated/original-derived-content-safety.json`

精修产物层级：raw-text → volume summary → chapter-event → entity index → 关系候选 → 时间线 → 检索 index → 来源指纹 manifest → derived-content-safety → runtime pack。

## 原著关系候选复核入口（2026-07-01）

章节共现关系候选已生成复核队列，用于后续把高置信人物-人物关系人工提升到 `relationship-graph.json`。

| 世界 | candidates | semantic priority | RP anchors | 检索 signals |
|---|---:|---:|---:|---:|
| campione | 453 | 34 | 96 | 69 |
| danmachi | 1111 | 120 | 120 | 160 |
| hidan-no-aria | 223 | 15 | 27 | 64 |
| rakudai-kishi | 325 | 35 | 108 | 83 |
| saijaku-muhai-bahamut | 246 | 36 | 114 | 3 |
| **合计** | **2358** | **240** | **465** | **379** |


入口文件：

- `campaigns/world-library/世界数/*/curated/original-relationship-review-queue.json`
- `campaigns/world-library/世界数/*/curated/original-relationship-review-queue.md`
- `campaigns/world-library/世界数/*/curated/original-relationship-review-packets.json`
- `campaigns/world-library/世界数/*/curated/original-relationship-review-packets.md`
- `campaigns/world-library/世界数/*/curated/original-relationship-review-worklist.json`
- `campaigns/world-library/世界数/*/curated/original-relationship-review-worklist.md`
- `campaigns/world-library/世界数/*/curated/original-relationship-semantic-hints.json`
- `campaigns/world-library/世界数/*/curated/original-relationship-semantic-hints.md`
- `campaigns/world-library/世界数/*/curated/original-relationship-semantic-draft.json`
- `campaigns/world-library/世界数/*/curated/original-relationship-semantic-draft.md`
- `campaigns/world-library/世界数/*/curated/original-relationship-semantic-merge-plan.json`
- `campaigns/world-library/世界数/*/curated/original-relationship-semantic-merge-plan.md`
- `campaigns/world-library/世界数/*/curated/original-relationship-graph.json`
- `campaigns/world-library/世界数/*/curated/original-relationship-graph.md`
- `campaigns/world-library/manual-curation/reports/original-archive-seal.md`
- `campaigns/world-library/manual-curation/reports/original-archive-seal-audit.md`

