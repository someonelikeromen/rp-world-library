# Manual Curation Status

更新日期：2026-06-22

本文件仅做归档完成度检查与索引汇总；未修改任何 `campaigns/world-library/worlds/*/curated/` 正文。

## 检查范围与标准产物

检查范围：`campaigns/world-library/worlds/*/curated/`

标准产物共 7 个：

1. `README.md`
2. `world.json`
3. `source-registry.json`
4. `characters-index.json`
5. `knowledge-graph.json`
6. `relationship-graph.json`
7. `curation-notes.md`

验收口径：

- “完整”：以上 7 个文件均存在。
- “部分”：`curated/` 目录存在，但 7 个标准产物未全部存在。
- “缺失”：未发现 `curated/` 目录或 7 个标准产物全部缺失。
- “人物清单建立”：`characters-index.json` 存在。
- “图谱建立”：`knowledge-graph.json` 与 `relationship-graph.json` 均存在。

检查方式：逐项列出世界目录并读取/列出对应 `curated/` 目录文件名；本轮只检查标准产物存在性，未运行 JSON 解析、schema 校验、交叉引用校验，也未复核正文质量。

## 总体结论

- 世界目录总数：63
- 完整：63
- 部分：0
- 缺失：0
- 人物清单建立：63
- 图谱建立：63

本轮刷新后，先前待补的 4 个世界均已达到标准产物存在性完整：

- `campaigns/world-library/worlds/dantalian-no-shoka/curated/`
- `campaigns/world-library/worlds/date-a-live/curated/`
- `campaigns/world-library/worlds/toriko/curated/`
- `campaigns/world-library/worlds/madan-no-ou/curated/`

## 未解决项与风险

- 未执行 JSON 解析/格式校验；所有 `.json` 文件仍需后续统一解析验证。
- 未执行 schema/字段完整性校验；存在性完整不等同于结构完全合规。
- 未执行跨文件交叉引用检查；人物、关系、知识节点、来源编号之间可能仍有未发现的不一致。
- 未复核正文质量、译名统一、剧透可见性、NSFW/控制文本剥离质量。
- 特殊或高风险世界建议后续优先抽样复核：`acg-character-database`、`blue-archive`、`monster-hunter`、`infinite-stratos`、`taimanin`、`testament-sister-new-devil`、`toaru`、`jojo`、`date-a-live`、`dantalian-no-shoka`、`madan-no-ou`、`toriko`。

## 每世界完成度表

| 世界 slug | 标准产物 | 人物清单 | 图谱 | 主要未解决项 |
|---|---:|---:|---:|---|
| absolute-duo | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| acg-character-database | 完整 | 是 | 是 | 特殊库非单一世界；需后续复核跨作品条目边界与非露骨化处理。 |
| akame-ga-kill | 完整 | 是 | 是 | 需后续 JSON/schema 校验与译名/帝具关系抽样复核。 |
| black-bullet | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| blue-archive | 完整 | 是 | 是 | 源人物条目不足，部分为岗位/RP 常用身份；需后续补证。 |
| bocchi-the-rock | 完整 | 是 | 是 | 人物曾分散在多类目；需后续抽样复核归并准确性。 |
| campione | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| cheng-long-adventures | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| chunibyo | 完整 | 是 | 是 | 需确认幻想身份均未误作真实超自然体系。 |
| claymore | 完整 | 是 | 是 | 需后续复核时间线跨度与 RP 槽位处理。 |
| cross-ange | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| d-gray-man | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| danmachi | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| dantalian-no-shoka | 完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查；需后续 JSON/schema 与低置信人物复核。 |
| date-a-live | 完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查；需后续 JSON/schema 与 IF/支线边界复核。 |
| dragon-ball | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| dungeon-fighter-online | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| elemental-gelade | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| evangelion | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| gate-jsdf | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| gundam-seed | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| haganai | 完整 | 是 | 是 | 源内非人物/成人化条目较多；需后续抽样复核剥离质量。 |
| hidan-no-aria | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| high-school-dxd | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| honkai-impact-3rd | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| ikki-tousen | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| infinite-stratos | 完整 | 是 | 是 | 源内写卡/状态栏/成人偏好模板较多；需后续抽样复核剥离质量。 |
| jojo | 完整 | 是 | 是 | 本地源覆盖偏 1-3 部；需后续标注覆盖范围与后续部补证。 |
| kaguya-sama | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| kekkaishi | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| kenichi | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| kill-la-kill | 完整 | 是 | 是 | 源内成人化/状态栏内容已剥离；需后续抽样复核。 |
| kimetsu-no-yaiba | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| madan-no-ou | 完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查；需后续复核本篇/IF 线边界与 JSON/schema。 |
| majo-no-tabitabi | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| marvel-cinematic-universe | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| monster-hunter | 完整 | 是 | 是 | 固定姓名角色不足，人物索引含岗位/生态角色；需后续补证。 |
| naruto | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| negima-uq-holder | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| omamori-himari | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| overlord | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| persona-5 | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| rakudai-kishi | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| record-of-ragnarok | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| rozen-maiden | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| saijaku-muhai-bahamut | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| seikoku-no-dragonar | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| sekirei | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| senran-kagura | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| sora-no-otoshimono | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| spice-and-wolf | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| strike-the-blood | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| sword-art-online | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| taimanin | 完整 | 是 | 是 | 源内玩家寄生魔/状态栏等已排除；需后续抽样复核。 |
| testament-sister-new-devil | 完整 | 是 | 是 | 成人化契约描写已剥离；需后续抽样复核。 |
| to-love-ru | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| toaru | 完整 | 是 | 是 | 卷号剧情/变量文本较多；需后续复核未把控制文本写入正文。 |
| tokyo-ghoul | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| toriko | 完整 | 是 | 是 | 本轮新增补齐后仅做存在性检查；需后续复核终局/隐藏设定可见性与 JSON/schema。 |
| type-moon-nasuverse | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| world-god-only-knows | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| xianjian-1 | 完整 | 是 | 是 | 需后续 JSON/schema 校验与抽样复核。 |
| zero-no-tsukaima | 完整 | 是 | 是 | `{{user}}` 槽位需后续复核未固化为原作人物。 |

## 后续建议

1. 对 63 个完整世界执行 JSON 解析、schema 字段校验、交叉引用检查。
2. 对本轮新增补齐的 4 个世界优先做一次人工抽样复核：`dantalian-no-shoka`、`date-a-live`、`toriko`、`madan-no-ou`。
3. 对特殊/高风险世界继续做质量复核：`acg-character-database`、`blue-archive`、`monster-hunter`、`infinite-stratos`、`taimanin`、`testament-sister-new-devil`、`toaru`、`jojo`。
