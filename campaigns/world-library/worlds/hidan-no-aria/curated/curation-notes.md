# Curation Notes — hidan-no-aria

## 输入来源

读取并使用了：

- `campaigns/world-library/imports/worldviews/hidan-no-aria/README.md`
  - 记录 slug: `hidan-no-aria`
  - 记录 worldbook files: 1
  - 记录 `緋彈的婭莉婭.worldbook.json` entries: 192
- `campaigns/world-library/imports/worldviews/hidan-no-aria/worldbooks/緋彈的婭莉婭.worldbook.json`
  - schema: `rp-imported-worldbook-v1`
  - title: `緋彈的婭莉婭`
  - sourceKind: `worldbook-top-level-object-entries`

## 整理范围

本次为 baseline，不做 exhaustive canon。优先保留可直接用于 RP 的结构：

1. 东京武侦高中与武侦制度。
2. 科别、等级、战徒/战姊妹制度。
3. HSS、远山流、色金、超侦、魔法/异能等核心力量系统。
4. 伊·幽、师团、眷属、N、公安0课、蓝帮等组织。
5. 巴斯克维尔及主要角色关系。
6. 适合 GM 使用的地点、规则与时间线节点。

## 证据等级使用

- `A`：源条目直接支持，例如 `wb:0` 世界观总览、`wb:4` 武侦制度、`wb:70` 亚里亚角色档案。
- `B`：源条目提供方向，但本文件为 RP 可用性进行了压缩、合并或常识性归纳，例如 AA 后辈组的简要 hook。
- `C`：本次尽量避免写入核心 JSON；若后续加入未核验细节，应标 `C` 并写明 notes。

## 已覆盖的关键条目

- 系统/世界：`wb:0` 至 `wb:8` 中的世界观、HSS、色金、组织、武侦职级、远山流、装备、血脉与术语。
- 主角团：远山金次 `wb:68`、神崎·H·亚里亚 `wb:70`、星伽白雪 `wb:71`、峰理子 `wb:72`、蕾姬 `wb:73`。
- 关键配角/敌转友：平贺文 `wb:75`、不知火亮 `wb:77`、武藤刚气 `wb:78`、风魔阳菜 `wb:79`、贞德 `wb:122`。
- 血脉/高阶线：远山金一 `wb:120`、远山金三/GIII `wb:123`、远山金女/GIV `wb:124`、夏洛克·福尔摩斯 `wb:145`。
- AA 后辈线：间宫明里 `wb:84`、佐佐木志乃 `wb:86`、火野莱卡 `wb:87`、高千穗丽 `wb:88`、岛麒麟 `wb:90`。

## 取舍与压缩

- 原始角色条目包含大量外貌、台词、暧昧/后宫喜剧和后期卷数细节；baseline 中压缩为角色定位、能力、组织、关系和 RP hook。
- 高阶设定（莱克忒亚、N、第三次接轨、色金神化、时空观测）保留为可选战役模块，不默认要求所有 RP 开局启用。
- 源中个别条目有明显 JSON-like 正文错误或语句不稳定（例如某些角色档案内部缺逗号、附加句混入数组）；curated 文件未逐字复制，而是抽取可用事实。
- 不尝试修正原始 worldbook，不在 mutation scope 外写入。

## 风险

- 原 worldbook 汇集了本篇、AA、魔剑的爱丽丝贝尔及后期卷内容，存在时间线跨度大、强度膨胀与跨作设定混合风险。
- 个别角色 sourceEntryIndex 经过 grep/read 核验，但若上游 worldbook 重排，`wb:<index>` 应重新生成。
- 当前工具集没有命令执行或 JSON 解析器，未进行机器语法校验。建议上游校验：
  - `world.json`
  - `source-registry.json`
  - `characters-index.json`
  - `knowledge-graph.json`
  - `relationship-graph.json`

## 后续建议

1. 运行 JSON parser 校验全部 `.json`。
2. 若需要更详细角色卡，可从 `characters-index.json` 拆分 `characters/*.json`，但应保持 baseline 简洁。
3. 为 campaign 启用时，建议 GM 先选择时代层级：
   - 校园/武侦任务层。
   - 伊·幽后极东战役层。
   - 色金神话与 N/莱克忒亚高阶层。
4. 对成人化或过度后宫化内容设 table safety rule，避免干扰侦探/动作主线。
