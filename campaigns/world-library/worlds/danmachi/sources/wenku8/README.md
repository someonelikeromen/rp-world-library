# DanMachi Wenku8 目录源索引

更新日期：2026-06-30

> 仅保存目录/卷章标题/链接/元数据，不保存章节正文。

## 全局爬取规则（2026-06-30）

- 串行，每次请求间隔 ≥ 3 秒。
- 不并发；每组不超过 30 页，批次间等 ≥ 60 秒。
- 优先爬取章节正文到 `sources/raw-text/`；用户下载 TXT 为备选。
- 被限速（Cloudflare 1015/1020）后停止该域名 ≥ 30 分钟。

## 汇总

- 系列数：5
- 卷/分组数：55
- 章节/条目数：728

## 系列清单

| sourceSlug | 标题 | 作者 | 卷/分组 | 章节/条目 | URL |
|---|---|---|---:|---:|---|
| `danmachi-main` | 在地下城寻求邂逅是否搞错了什么(期待在地下城邂逅有错吗) | 大森藤野 | 29 | 397 | https://www.wenku8.net/novel/1/1508/index.htm |
| `sword-oratoria` | 剑姬神圣谭 在地下城寻求邂逅是否搞错了什么外传 | 大森藤野 | 18 | 203 | https://www.wenku8.net/novel/4/4078/index.htm |
| `familia-chronicle` | 眷族编年史 在地下城寻求邂逅是否搞错了什么外传 | 大森藤野 | 3 | 35 | https://www.wenku8.net/novel/4/4079/index.htm |
| `argonaut` | 阿尔戈 在地下城寻求邂逅是否搞错了什么 英雄谭 | 大森藤野 | 2 | 32 | https://www.wenku8.net/novel/4/4011/index.htm |
| `astraea-record` | 阿斯特莉亚回忆录 在地下城寻求邂逅是否搞错了什么 英雄谭 | 大森藤野 | 3 | 61 | https://www.wenku8.net/novel/3/3408/index.htm |

## 文件

- `danmachi-main.toc.json`：在地下城寻求邂逅是否搞错了什么(期待在地下城邂逅有错吗)
- `sword-oratoria.toc.json`：剑姬神圣谭 在地下城寻求邂逅是否搞错了什么外传
- `familia-chronicle.toc.json`：眷族编年史 在地下城寻求邂逅是否搞错了什么外传
- `argonaut.toc.json`：阿尔戈 在地下城寻求邂逅是否搞错了什么 英雄谭
- `astraea-record.toc.json`：阿斯特莉亚回忆录 在地下城寻求邂逅是否搞错了什么 英雄谭

## 使用规则

- 本目录只作为“外部目录索引”和归档对照依据。
- 如需导入正文，请由用户提供其合法持有的本地文本文件；导入后另建来源登记，不覆盖本目录。
- 正式 RP 检索仍优先读取 `curated/` 下的世界设定、人物索引、图谱和经整理的故事摘要。
