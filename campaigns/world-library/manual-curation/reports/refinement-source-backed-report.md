# Source-Backed Refinement Report

更新日期：2026-07-01T12:51:50.824Z

本轮对所有可用小说 raw-text 执行同一套精修操作：读取正文频次、章节标题和系列术语规则，生成 source-backed 卷级摘要；已有人写正式摘要的 DanMachi 第 1-6 卷被保留。

| world | series | refined | preserved formal | graph total |
|---|---:|---:|---:|---:|
| campione | 2 | 26 | 0 | 26/50 |
| danmachi | 5 | 49 | 6 | 633/2553 |
| hidan-no-aria | 1 | 4 | 0 | 72/165 |
| rakudai-kishi | 1 | 21 | 0 | 21/40 |
| saijaku-muhai-bahamut | 1 | 21 | 0 | 21/40 |

## 判据

- 不复制正文。
- 所有卷必须有 summary 文件、summary index 条目和 plot graph 节点。
- 摘要只写章节标题/本地正文高频命中/规则弧线支持的内容。
