# 全世界全量章节归档最终报告

生成时间：2026-07-02T13:21:16.858Z

Taskplane Runtime V2 两个批次均在首轮 worker 阶段失败，因此本轮使用主进程本地执行器完成同一套“全文读取 -> 章级归档 -> 卷级校验 -> 世界级派生层”流程。

| 世界 | 世界名 | raw-text正文源文件数 | curated story源文件数 | 章级归档JSON数 | 卷/单元校验数 | 校验通过数 | 失败/跳过章节数 | 人工核心角色数 | 自动派生角色候选数 | 人工核心关系边数 | 自动关系候选边数 | 原著运行包状态 | 人工复核待办数 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| campione | 弑神者！ | 233 | 0 | 233 | 26 | 26 | 0 | 100 | 26 | 173 | 149 | passed | 149 |
| danmachi | 在地下城寻求邂逅是否搞错了什么 | 681 | 0 | 681 | 55 | 55 | 0 | 31 | 40 | 42 | 433 | passed | 433 |
| hidan-no-aria | 绯弹的亚里亚 | 50 | 0 | 50 | 4 | 4 | 0 | 20 | 16 | 31 | 64 | passed | 64 |
| high-school-dxd | 恶魔高校D×D | 0 | 48 | 48 | 1 | 1 | 0 | 35 | 25 | 41 | 131 | passed | 131 |
| infinite-stratos | IS〈Infinite Stratos〉 | 0 | 72 | 72 | 14 | 14 | 0 | 23 | 19 | 43 | 81 | passed | 81 |
| rakudai-kishi | 落第骑士英雄谭 | 130 | 0 | 130 | 21 | 21 | 0 | 57 | 21 | 211 | 124 | passed | 124 |
| saijaku-muhai-bahamut | 最弱无败神装机龙 | 173 | 0 | 173 | 21 | 21 | 0 | 48 | 19 | 24 | 143 | passed | 143 |
| type-moon-nasuverse | 型月 / Nasuverse | 0 | 51 | 51 | 3 | 3 | 0 | 337 | 24 | 165 | 83 | passed | 83 |

## 保护边界

- 未覆盖 `relationship-graph.json`、`characters-index.json`、`knowledge-graph.json`、`plot-graph.json`。
- 本轮世界级输出采用 `original-full-*` 新派生层。
- 关系仅为候选信号，需人工复核后才能进入正式图谱。
