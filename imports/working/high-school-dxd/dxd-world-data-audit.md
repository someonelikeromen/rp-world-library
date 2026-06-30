# 《恶魔高校DxD》当前世界数据核对补充报告

> 基于 Wenku8 目录爬取结果 `wenku8-dxd-toc-comparison.json` 与当前 curated 数据目录：`campaigns/world-library/worlds/high-school-dxd/curated/`。
>
> 注意：本次仅保存目录/章节标题等元数据；未保存小说正文。

## 1. 故事/卷目录覆盖

- Wenku8 源目录：38 个分组，430 个章节链接。
- 当前 `stories/index.json`：35 个 story 条目。
- 主线覆盖：第 1–25 卷与第 12.5 卷基本覆盖。
- 标题异名：
  - Wenku8：`第九卷 教学旅行是万魔殿`
  - 当前：`第九卷 修学旅行是万魔殿`
  - 结论：语义相同，建议记录 `canonicalTitle/sourceTitle`，避免误判。
- 当前存在但本 Wenku8 1034 目录未出现：
  - `真惡魔高校` 第 1–4 卷
  - `堕天的狗神 / 刃狗显现 / 姬岛的火花与奥之院的激战`
  - 结论：这些应来自其他源或系列外传，不能用 1034 目录否定；需要单独登记来源。

## 2. 短篇/特典覆盖状态

Wenku8 中以下内容在当前世界数据里多数只体现为总表或概括行，缺少独立 story 文件：

- `BD特典『妄想杂志 ☆（夜晚的）设定资料』`
- `NEW BD特典『妄想杂志 ☆（夜晚的）设定资料集NEW』`
- `短篇集 DX.1 转生天使也疯狂`
- `EX BD特典 未来篇`
- `短篇集 DX.2 膜拜吧☆龙神少女！`
- `短篇`
- `短篇集 DX.3 十字x危机`
- `短篇集 DX.4 学生会与利维坦`
- `HERO BD特典 恶魔高校D×D 0`
- `短篇集 DX.5 超级英雄的考验`
- `短篇集 DX.6 请问您今天要来点恶魔吗？`
- `短篇集 DX.7 祖先大人是捣蛋鬼？`

建议：如果 RP 需要特典/短篇角色或事件，应为这些分组补独立 story 文件，而不是只依赖 `剧情章节-包含前傳.md` 的一行概括。

## 3. source-registry 状态

当前 `source-registry.json` 已/应包含 Wenku8 目录审计源：

- `wenku8-dxd-toc-audit`
- 类型：`canonical-toc-audit`
- 范围：`story-index-coverage`
- 可信度：`A-for-toc-only`

限制：它只能证明目录/标题覆盖，不能证明正文事实准确性。若之后用正文核事实，应该另建 `web-fetch`/`canon-translation-reference` 类型来源，并逐条标注事实证据。

## 4. 角色数据明显问题

当前 `characters-index.json` 有 41 个角色，但存在若干重复/异名未合并问题：

| 问题 | 条目 |
|---|---|
| 杰诺瓦重复 | `xenovia: 杰诺瓦` 与 `x1305: 洁诺薇亚·夸塔` |
| 罗丝/罗斯维瑟重复 | `rossweisse: 罗丝薇瑟` 与 `x2799: 罗斯维瑟` |
| 苍那重复 | `sona-sitri: 支取苍那` 与 `x5877: 苍那·西迪` |
| 椿姬重复 | `x7451: 椿姬真罗` 与 `x8032: 真罗椿姬` |
| 葛瑞菲雅重复/译名冲突 | `greyfia-lucifuge: 葛瑞菲雅·路基弗格斯` 与 `x2265: 葛瑞菲雅·路西斐特` |
| 占位条目 | `unknown-d0yscl: 未知` |

建议：下一步应合并这些重复条目，将别名加入主条目 `aliases/sourceKeys`，并修正 relationship graph 中对应 ID。

## 5. 对当前世界数据的结论

- **故事主线框架可用**：第 1–25 卷主线基本能支撑 RP。
- **短篇/特典覆盖粗糙**：目前更像“总表知道有这些内容”，不是可检索的剧情资料。
- **角色索引需要清洗**：重复角色会影响 `world_query characters/aggregate/graph` 的检索质量。
- **来源结构需要分层**：世界书来源是 RP 改编资料；Wenku8 目录只能作为目录校验源；正文事实核验需另立证据链。

## 6. 建议执行顺序

1. 先合并角色重复项，避免图谱污染。
2. 给 `stories/index.json` 增加或旁挂 canonical title/source title 映射。
3. 为 DX/BD/EX/HERO/短篇补独立 story 文件。
4. 若需要正文级核验，按卷逐步抓取正文并只保存摘要/事实三元组，不保存原文全文。
