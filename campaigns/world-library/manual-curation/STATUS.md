# 世界归档状态总览

更新日期：2026-07-19

本文件用于记录当前文件系统与 `world_query` / `tools/world-index` 索引口径下的真实世界归档进度。

> 说明：旧版状态曾记录“63 个世界均为 7 项 curated 基线完整”。该历史口径与当前目录结构不一致：当前 `campaigns/world-library/worlds/` 实际只有 8 个正式世界目录，其余世界主要保存在 `campaigns/world-library/imports/worldviews/` 作为 raw worldbook 来源池。因此本文件已改用“正式世界库 + raw 来源池”的当前口径。

## 本轮核对动作

- 已重建世界索引：`node tools/world-index/cli.cjs build`
- 索引文件：`campaigns/world-library/.wl-index.json`
- 索引时间：`2026-07-19T14:24:37.130Z`
- 当前索引结果：63 世界，其中 8 个 `curated`，55 个 `raw`
- 资料优先级与使用规则：见 `campaigns/world-library/manual-curation/ARCHIVE-POLICY.md`

## 当前总量

| 类别 | 数量 | 说明 |
|---|---:|---|
| 世界源总数 | 63 | `imports/worldviews/` 中已按世界分组的来源总量 |
| 正式世界库 / 当前索引 curated | 8 | `worlds/<slug>/` 下已有 curated 或 extracted，可被 `world_query` 作为正式世界检索 |
| raw worldbook 待归档 | 55 | 仅有原始 worldbook JSON，尚未完成正式 curated/extracted 部署 |

## 正式世界库：8 个

| 中文名 | slug | 当前形态 | 成熟度 / 备注 |
|---|---|---|---|
| 型月 / Fate / FGO / 魔法少女伊莉雅 | `type-moon-nasuverse` | curated 主线 + P1 hybrid 部分提取试点 | 高成熟 curated 主线；另有 `manual-curation/type-moon-p1-hybrid/` 下的 FGO/FSN/FZ/月姬补充试点。试点尚未统一部署到 `worlds/type-moon-nasuverse/extracted/`，不替代现有 curated。 |
| 恶魔高校 DxD | `high-school-dxd` | curated | 高成熟。2026-06-27 手工整理，7 基线、故事、文风约束、战斗框架映射完整。 |
| 无限斯特拉托斯 / IS | `infinite-stratos` | curated | 可用 curated。已有大量文件和 source-backed 修正经验，仍建议后续抽样审计。 |
| 绯弹的亚里亚 | `hidan-no-aria` | curated + extracted | P1 extracted 高成熟。49 卷，4,157 实体，图谱与时间轴完整，README 声明已逐卷原文审计。 |
| 弑神者 / Campione | `campione` | curated + extracted | P1 extracted 较完整。26 卷，1,837 实体；README 标注图谱 schema 兼容待完善。 |
| 在地下城寻求邂逅是否搞错了什么 / 地错 | `danmachi` | extracted | 已有 1,010 文件和 graph，但 curated 目录为空；已补 extracted README；仍需 schema/sourceRef 审计。 |
| 最弱无败神装机龙 | `saijaku-muhai-bahamut` | extracted | P1 extracted 较完整。2,038 实体文件，vol-06 为 manual fill；graph 已生成。 |
| 落第骑士英雄谭 | `rakudai-kishi` | extracted 部分成果 | 当前只有 characters + graph；已补 extracted README；不应标为完整 P1 成果。 |

## Type-Moon P1 hybrid / 部分提取试点状态

路径：`campaigns/world-library/manual-curation/type-moon-p1-hybrid/`

这些成果是型月的 side-by-side / manual-curation 试点层，不是正式发布到 `worlds/type-moon-nasuverse/extracted/` 的完整 extracted 世界。当前正式 RP 主线仍以 `worlds/type-moon-nasuverse/curated/` 为准；P1 hybrid 可作为后续迁移、补证与 curated-v2 候选层。

| 中文范围 | 目录 | 当前状态 | 未完成 / 注意事项 |
|---|---|---|---|
| FGO 第一部 | `fgo-script-pilot` | `passed-with-nonblocking-risks` | 已通过试点验收，但未批准直接覆盖旧 Type-Moon curated；部分 legacy 文件名/路径 slug 仍含 unsupported English labels，仅作 alias/legacy slug。 |
| FGO 1.5 部 / 亚种特异点 | `fgo-eor-pilot` | `merged-eor-final-accepted` / post-fix `passed-with-nonblocking-risks` | 已合并并通过 parent fix；仍为 side-by-side 候选层，未迁移到正式 curated/extracted。 |
| FGO Lostbelt 1-2 | `fgo-lb1-lb2-pilot` | merge accepted / passed；final audit `passed-with-nonblocking-risks` | 已接受为 isolated side-by-side/manual-curation 用途；不替代现有 curated。 |
| FGO Lostbelt 3-4 | `fgo-lb3-lb4-pilot` | accepted；final audit `passed-with-nonblocking-risks` | 已修复先前 merge-layer omission；不替代现有 curated。 |
| FGO Lostbelt 5 | `fgo-lb5-pilot` | passed / accepted；final audit `passed-with-nonblocking-risks` | 已接受为 isolated side-by-side/manual-curation 用途；不替代现有 curated。 |
| FGO Lostbelt 6 | `fgo-lb6-pilot` | merged canonical layers passed；final audit `passed-with-nonblocking-risks` | 已接受为 isolated side-by-side/manual-curation 用途；不替代现有 curated。 |
| FGO Ordeal Call I-III | `fgo-ordeal-call-pilot` | `accepted-with-nonblocking-risks` / `finalized-minimal-scope` | 最小合并状态；缺少 dedicated `merged/appearances/`、`merged/abilities/`、`merged/combat-effects/` canonical 目录，相关覆盖留在 extracted/normalized packet 层与索引中；不发布覆盖旧 curated。 |
| Fate/stay night + Fate/Zero | `fsn-fz-pilot` | preparation scaffold only | 只有准备脚手架；尚未创建 source text、waves、intermediate/group-merged/merged/candidates/audit/comparison 正式输出；未开始提取波次。 |
| 月姬 / 死徒 profile supplement | `tsukihime-dead-apostle-profile-supplement-pilot` | `stage-1-prep-generated` | 只有 prep/source-layer supplement；未创建 formal merged entities、final timelines、relationship graphs 或 canonical records。 |

### Type-Moon 当前未完成项

1. **未部署正式 extracted**：尚无 `campaigns/world-library/worlds/type-moon-nasuverse/extracted/` 统一发布目录；P1 hybrid 成果仍在 `manual-curation/` 试点区。
2. **未迁移 / 未覆盖 curated 主线**：所有 FGO P1 hybrid 试点均明确“不替代现有 Type-Moon curated archive”。若要使用，需要后续确认迁移策略或 curated-v2。
3. **FSN/FZ 未开始正式抽取**：`fsn-fz-pilot` 仍是 prep scaffold，只完成计划、source selection、wave manifest draft 等准备文件。
4. **月姬 / 死徒补充未形成正式实体层**：当前仅 stage-1 prep/source layer，尚无正式 merged entity / timeline / relationship graph / canonical records。
5. **Ordeal Call 是最小合并**：已接受但保留非阻塞风险，尤其是缺少 dedicated merged appearance/ability/combat-effect canonical directories。
6. **来源等级限制**：P1 hybrid 使用 worldbook script / curated story summary 等用户导入资料，状态是 `canon-like` / source-first，不等同于官方原文完整 P1 scan。

## raw worldbook 待归档：55 个

这些世界目前在 `campaigns/world-library/imports/worldviews/<slug>/worldbooks/` 下保存原始 worldbook JSON。可作为检索和后续整理输入，但不应视为已完成正式归档。

| 中文名 | slug | 文件数 | entries |
|---|---|---:|---:|
| 绝对双刃 / Absolute Duo | `absolute-duo` | 1 | 75 |
| ACG 角色心理/类脑数据库 | `acg-character-database` | 3 | 395 |
| 斩！赤红之瞳 | `akame-ga-kill` | 1 | 38 |
| 黑色子弹 | `black-bullet` | 1 | 159 |
| 蔚蓝档案 / 基沃托斯 | `blue-archive` | 1 | 25 |
| 孤独摇滚 | `bocchi-the-rock` | 1 | 9 |
| 成龙历险记 | `cheng-long-adventures` | 1 | 40 |
| 中二病也想谈恋爱 | `chunibyo` | 1 | 12 |
| 大剑 / Claymore | `claymore` | 1 | 11 |
| 天使与龙的轮舞 / CROSS ANGE | `cross-ange` | 1 | 89 |
| 驱魔少年 / D.Gray-man | `d-gray-man` | 1 | 113 |
| 丹特丽安的书架 | `dantalian-no-shoka` | 1 | 59 |
| 约会大作战 / DATE A LIVE | `date-a-live` | 1 | 37 |
| 龙珠 | `dragon-ball` | 1 | 215 |
| 地下城与勇士 / 阿拉德 | `dungeon-fighter-online` | 2 | 629 |
| 武器种族传说 | `elemental-gelade` | 1 | 79 |
| 新世纪福音战士 / EVA | `evangelion` | 2 | 88 |
| GATE 奇幻自卫队 | `gate-jsdf` | 1 | 156 |
| 高达 SEED | `gundam-seed` | 1 | 128 |
| 我的朋友很少 | `haganai` | 1 | 21 |
| 崩坏 / 崩坏三 | `honkai-impact-3rd` | 3 | 683 |
| 一骑当千 | `ikki-tousen` | 1 | 143 |
| JOJO | `jojo` | 1 | 7 |
| 辉夜大小姐想让我告白 | `kaguya-sama` | 1 | 80 |
| 结界师 | `kekkaishi` | 1 | 100 |
| 史上最强弟子兼一 | `kenichi` | 1 | 283 |
| 斩服少女 / Kill la Kill | `kill-la-kill` | 1 | 72 |
| 鬼灭之刃 | `kimetsu-no-yaiba` | 2 | 355 |
| 魔弹之王与战姬 | `madan-no-ou` | 1 | 93 |
| 魔女之旅 | `majo-no-tabitabi` | 1 | 19 |
| 漫威电影宇宙 | `marvel-cinematic-universe` | 1 | 273 |
| 怪物猎人 | `monster-hunter` | 1 | 49 |
| 火影忍者 | `naruto` | 4 | 701 |
| 魔法老师 / UQ HOLDER | `negima-uq-holder` | 1 | 223 |
| 守护猫娘绯鞠 | `omamori-himari` | 1 | 76 |
| OVERLORD | `overlord` | 1 | 173 |
| 女神异闻录5 / Persona 5 | `persona-5` | 1 | 59 |
| 终末的女武神 | `record-of-ragnarok` | 1 | 157 |
| 蔷薇少女 | `rozen-maiden` | 1 | 97 |
| 星刻龙骑士 | `seikoku-no-dragonar` | 1 | 207 |
| 鹡鸰女神 / Sekirei | `sekirei` | 1 | 89 |
| 闪乱神乐 | `senran-kagura` | 1 | 228 |
| 天降之物 | `sora-no-otoshimono` | 2 | 97 |
| 狼与辛香料 | `spice-and-wolf` | 1 | 100 |
| 噬血狂袭 | `strike-the-blood` | 1 | 164 |
| 刀剑神域 SAO | `sword-art-online` | 1 | 35 |
| 对魔忍 | `taimanin` | 1 | 12 |
| 新妹魔王的契约者 | `testament-sister-new-devil` | 1 | 94 |
| 出包王女 / To Love-Ru | `to-love-ru` | 1 | 108 |
| 魔法禁书目录 / 超炮相关 | `toaru` | 1 | 74 |
| 东京喰种 | `tokyo-ghoul` | 2 | 87 |
| 美食的俘虏 / Toriko | `toriko` | 1 | 99 |
| 只有神知道的世界 | `world-god-only-knows` | 1 | 114 |
| 仙剑奇侠传Ⅰ | `xianjian-1` | 1 | 298 |
| 零之使魔 | `zero-no-tsukaima` | 1 | 21 |

## 使用优先级

详见 `ARCHIVE-POLICY.md`。简述如下：

1. `extracted/`：有小说原文或章节 sourceRef 的 P1 source-backed 数据，剧情事实最高优先级。
2. `curated/`：整理后的 worldbook / 角色卡世界书数据，适合 RP 使用与补充文风、机制、战斗映射。
3. `imports/worldviews/`：raw worldbook 来源池，仅作待验证素材和后续整理输入。

## 主要风险与后续事项

- `manual-curation/STATUS.md` 旧口径与当前目录不一致，已在本次重写中修正。
- `reports/world-archive-report.md` 是 2026-06-20 的历史报告，路径和统计口径不再等同当前真实状态。
- `danmachi`、`rakudai-kishi` 曾缺 extracted README，本次已补最小状态说明。
- `campione` README 标注 graph schema 兼容待完善。
- `rakudai-kishi` 只有人物层和 graph，不应当作完整 P1 extracted。
- raw 55 世界仍需按来源类型排队：有小说正文走 P1 extraction；只有 worldbook 走 rp-curation；临时补来源走 source-ingestion。
- 后续仍建议做全量 JSON parse、schema、sourceRef、graph dangling edge 与 character coverage 审计。
