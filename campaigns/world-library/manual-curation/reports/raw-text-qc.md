# Raw Text 入库质检报告

更新日期：2026-06-30

## 汇总

| world | series | 卷 | TOC条目 | 正文OK | 版权/空正文 | 插图跳过 | 失败 | 未记录 | 大小 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| danmachi | danmachi-main | 29 | 397 | 375 | 0 | 22 | 0 | 0 | 11.69MB |
| danmachi | sword-oratoria | 18 | 203 | 186 | 0 | 16 | 1 | 0 | 6.83MB |
| danmachi | familia-chronicle | 3 | 35 | 32 | 0 | 3 | 0 | 0 | 1.13MB |
| danmachi | argonaut | 2 | 32 | 30 | 0 | 2 | 0 | 0 | 0.84MB |
| danmachi | astraea-record | 3 | 61 | 58 | 0 | 3 | 0 | 0 | 1.43MB |
| campione | campione-main | 23 | 226 | 204 | 0 | 22 | 0 | 0 | 7.92MB |
| campione | campione-shiniki | 3 | 32 | 29 | 0 | 3 | 0 | 0 | 1.01MB |
| rakudai-kishi | rakudai-kishi-main | 21 | 150 | 130 | 0 | 20 | 0 | 0 | 5.71MB |
| saijaku-muhai-bahamut | saijaku-muhai-bahamut-main | 21 | 193 | 173 | 0 | 20 | 0 | 0 | 6.62MB |
| hidan-no-aria | hidan-no-aria-aa | 4 | 54 | 50 | 0 | 4 | 0 | 0 | 1.01MB |
| hidan-no-aria | hidan-no-aria-main | 46 | 361 | 0 | 21 | 44 | 33 | 263 | 0.00MB |

## 第一轮结论

- 地下城系列、弑神者系列、落第骑士、最弱无败、绯弹AA均已完成 raw-text 入库。
- `hidan-no-aria-main` 本篇章节页返回版权屏蔽/空正文，已清理误入库占位文本，只保留 `BLOCKED.md` 与失败 manifest。
- 剩余失败主要是正文过短的后记；插图页按无正文处理。

## 需人工关注

### danmachi/sword-oratoria

- 失败：1
- 未记录：0
- 版权/空正文：0
- 失败样例：第十五卷/后记:too short

### hidan-no-aria/hidan-no-aria-main

- 失败：33
- 未记录：263
- 版权/空正文：21
- 失败样例：第一卷/序:short；第一卷/2弹 神崎.H.亚莉亚:short；第一卷/3弹 强袭科:short；第一卷/4弹 刘海之下:short；第一卷/5弹 欧尔梅斯:short；第一卷/后记:short；第二卷 燃烧的钻石冰尘/1弹 武装巫女:short；第二卷 燃烧的钻石冰尘/2弹 空手夺白刃:short
- 未记录样例：第八卷 螺旋的天空树/3弹 白银的ICBM；第八卷 螺旋的天空树/4弹 高度350公尺的螺旋；第八卷 螺旋的天空树/Go For The NEXT!螺旋的天空树；第八卷 螺旋的天空树/后记；第九卷 苍蓝闪光/1弹 紫电魔女；第九卷 苍蓝闪光/2弹 美哉，理子；第九卷 苍蓝闪光/3弹 秘密的复健训练；第九卷 苍蓝闪光/4弹 文化祭第一天

