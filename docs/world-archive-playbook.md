# 世界观归档与源验证经验手册

> 用途:后续继续归档新世界观、小说正文、世界书、剧情图谱时,按此流程执行,避免"看起来完整但实际无源/错源/漏源"的问题。

## 1. 总原则

1. **先保留原始来源,再做 curated**
   - 原文、目录、世界书、角色卡、爬取结果全部放在 `imports/` 或 `imports/working/`。
   - curated 数据只放整理后的可检索结构,不替代原始证据。

2. **source-backed 优先,不凭常识补全**
   - 角色名、组织名、机体名、事件名必须能在本地来源中命中。
   - 若 `count=0`:删除、降级为待验证、或改成原文实际用词。
   - 不用 wiki/印象/日文官方名替代当前中文文本里的译名,除非明确作为 alias 并标注来源。

3. **先目录覆盖,后正文精读**
   - 目录只能证明"卷/章/短篇存在与标题对应",不能证明正文细节。
   - 正文才能证明角色关系、能力、事件细节、地点性质。

4. **角色/世界/剧情/图谱要闭环**
   - `characters-index.json`:角色实体与别名。
   - `world.json`:系统、派系、地点、规则、事件。
   - `stories/index.json` + chapter files:剧情证据。
   - `relationship-graph.json`:角色关系覆盖。
   - `plot-graph.json`:角色在剧情中的出现证据。
   - `source-registry.json`:来源登记与可信度说明。

5. **RP 可用性比"百科式堆料"更重要**
   - 摘要要能直接支持 RP 决策:角色动机、关系边界、能力限制、地点规则、可触发事件。
   - 对不确定内容写"未验证/仅目录证明/仅世界书来源",不要写成确定事实。

## 2. 推荐目录结构

```text
campaigns/world-library/worlds/<world>/curated/
  characters-index.json
  world.json
  relationship-graph.json
  knowledge-graph.json
  plot-graph.json
  source-registry.json
  stories/
    index.json
    <story-id>/...

imports/worldviews/<world>/worldbooks/
  *.worldbook.json

imports/working/<world>/
  scrape-*.mjs
  *-toc-comparison.md/json
  audit-*.md/json
```

说明:

- `imports/working/` 可以保存脚本、目录核对报告、临时审计结果。
- 如果某个报告被 `source-registry.json` 引用,应提交入库,避免来源引用失效。

## 3. 标准归档流程

### Step 1:来源盘点

记录来源类型:

- 小说正文:可信度最高,可用于角色、事件、机体、地点细节。
- 小说目录/TOC:只证明卷/章/短篇标题与覆盖范围。
- SillyTavern 世界书/角色卡:适合初始抽取,但属于 RP 改编源,需要二次验证。
- wiki/百科:只能作为辅助线索,不能直接覆盖本项目中文文本证据。

在 `source-registry.json` 登记:

```json
{
  "id": "wenku8-xxx-toc-audit",
  "type": "canonical-toc-audit",
  "url": "...",
  "path": "imports/working/<world>/xxx.md",
  "description": "TOC metadata only; no chapter body text.",
  "credibility": "A-for-toc-only",
  "scope": "story-index-coverage",
  "notes": "只能证明目录覆盖,不能证明正文细节。"
}
```

正文源可使用更高范围说明,但仍需写清提取日期、路径、章节数量、编码/清洗方式。

### Step 1.5:文库爬取频率与风控规则

对 Wenku8 或类似文库站点必须采用低频、可恢复策略:

- **禁止全站并发 ID 扫描**:不要用 16 并发或批量扫 `/novel/<bucket>/<id>/index.htm`。本项目在尝试定位《绯弹的亚里亚》时因此触发限速。
- **入口优先**:优先使用已知作品入口、项目内保存过的 URL、已保存 TOC、搜索引擎缓存;不要把站内搜索/全站 ID 探测作为默认入口。
- **请求间隔**:目录页每次请求后等待 8-12 秒;章节正文页每次请求后等待 12-20 秒。
- **失败退避**:遇到 302 登录页、403/429、Cloudflare/验证码、连接异常时,立即暂停 10-30 分钟,不要高频重试。
- **单批上限**:每批最多 1 个 index 页 + 5 个章节页;批次之间至少暂停 5 分钟。
- **断点续爬**:保存 `toc.json`、`chapters.json`、`crawl-state.json`;章节下载后立即写盘并记录 URL、标题、卷、抓取时间、HTTP 状态;已完成章节下次跳过。
- **不绕验证**:出现验证码/登录限制时只记录状态并暂停,不尝试绕过。

### Step 2:目录覆盖核对

对比外部目录和当前 `stories/index.json`:

- direct exact:标题完全对应。
- direct retitled:当前标题为整理/翻译改写,但可明确对应。
- aggregate:多个短篇或 BD 特典被归入一个摘要 story。
- not found:当前无独立 story。
- extra:当前有但该来源目录没有,需寻找其他来源。

经验:

- DxD 主目录只能证明主线和部分 DX/BD;《真恶魔高校》《堕天的狗神/SLASHDOG》需要另找目录源。
- 目录核对报告应明确"只保存目录/章节标题元数据,未保存正文"。

### Step 3:正文/世界书实体抽取

抽取顺序:

1. 角色名与 aliases/sourceKeys。
2. 组织/派系。
3. 能力系统/机体/装备。
4. 地点。
5. 事件。
6. 关系。

每一项至少保存:

- canonical name:项目使用主名。
- aliases:同一文本中出现的译名/简称。
- sourceKeys:用于全文搜索的命中词。
- sourceRefs:来源文件或卷章。
- summary/detail:简洁说明,避免无源扩写。

### Step 4:严格源验证

对新增/修改实体运行全文命中检查:

```bash
node - <<'NODE'
const fs=require('fs'), path=require('path');
let text='';
function scan(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const p=path.join(d,e.name);
    if(e.isDirectory()) scan(p);
    else if(e.name.endsWith('.md')) text+=fs.readFileSync(p,'utf8')+'\n';
  }
}
scan('campaigns/world-library/worlds/<world>/curated/stories');
for(const term of ['待验证词1','待验证词2']){
  console.log(term, text.split(term).length-1);
}
NODE
```

判定规则:

- `count > 0`:可作为当前中文文本证据。
- `count = 0`:不能作为正文事实写入;删除/改名/标注未验证。
- 单字别名要慎用,容易误匹配;用于 plot graph 时必须白名单或禁用。

IS 的经验教训:

- `筱之之重工` count=0 → 删除。
- `马迪亚斯` count=0 → 不作为中文文本主名。
- `迷雾淑女` count=0 → 改为原文实际出现的 `雾缠淑女`。
- `疾风之再诞` count=0 → 改为原文实际出现的 `疾风`。
- `IS学园人工岛` 无正文支持 → 改为"不属于任何国家的土地"。

### Step 5:构建/修复关系图

`relationship-graph.json` 必须覆盖 `characters-index.json` 中所有角色:

- 每个角色至少有一个 `type: "character"` 节点。
- optional/RP 扩展角色可以标注 subtype,但仍可作为 character 节点存在,避免检索遗漏。
- edge 两端必须存在。
- 关系边写 source-backed 描述,不要用泛泛阵营关系替代关键人际关系。

### Step 6:构建 plot graph

推荐字段:

```json
{
  "id": "ch-12",
  "type": "chapter",
  "label": "章节名",
  "volume": "3",
  "characters": ["角色显示名"],
  "characterRefs": ["character-id"],
  "characterMatchTerms": { "character-id": "命中词" },
  "flags": {
    "hasBattle": true,
    "hasRomance": false,
    "hasSchool": true
  },
  "file": "vol-3/xxx.md"
}
```

经验:

- Type-Moon 这类大世界必须过滤泛称:`Saber`、`Caster`、`英灵`、`妖精`、`女神`、`圆桌骑士` 等不能直接当角色命中。
- IS 这类中文正文可以用 alias 匹配,但单字 alias 如"圆""铃""束"容易误判;plot graph 中只允许极少数唯一性强的单字或直接禁用。
- 记录 `characterMatching.method`,让后续知道匹配策略。

### Step 7:重建索引并验证工具

每次 curated 数据变更后运行:

```bash
node tools/world-index/cli.cjs build
```

索引工具必须兼容多 schema:

- `powerSystems` / `divinityAndFamiliaSystem` / `technologyAndEnergyEnvironment` / `buteiSystem`
- `factions` / `factionsAndCrime` / `majorFamilias` / `departments`
- flat `stories/index.json`
- nested `stories/<id>/index.json`

若 build warning 说明工具对 schema 假设过硬,应优先修工具,不要强行改世界数据迁就工具。

### Step 8:最终审计脚本

最小审计项:

- 所有 JSON 可解析。
- `stories/index.json` 引用文件存在。
- `relationship-graph.json`、`knowledge-graph.json`、`plot-graph.json` 的 edge 两端存在。
- relationship graph 覆盖所有角色。
- plot graph 有角色节点和 appears-in 链接。
- 新增实体 sourceKeys 在本地来源中能命中。

示例输出格式:

```text
<world> OK chars=<n> plotCharNodes=<n> plotLinks=<n>
```

### Step 9:提交与发布

1. 测试版 `E:/pi-st` 提交。
2. 确认无未提交改动。
3. 运行:

```bash
bash tools/sync-release.sh
```

注意:

- 正式 RP 在 `E:/pi-rp` 发布版运行。
- 发布版有 `.rp-lock` 时不要强行同步。
- 同步前确保审计结果已通过。

## 4. 常见错误清单

- 把目录来源当正文来源。
- 用 wiki 常见译名覆盖当前中文文本译名。
- 角色 alias 太短导致 plot graph 大量误匹配。
- 只更新 `characters-index.json`,忘记 relationship graph / plot graph。
- 只更新 curated,忘记登记 source-registry。
- 工具报 warning 时修改数据迁就工具,而不是让工具兼容 schema。
- 生成图谱后不检查 dangling edge。
- 写"组织/公司/事件"时没有全文命中,导致编造实体残留。

## 5. 后续归档优先建议

每归档一个新世界,按以下交付物验收:

- [ ] 原始来源保存到 `imports/` 或 `imports/working/`
- [ ] `source-registry.json` 登记来源可信度与范围
- [ ] `characters-index.json` 有 aliases/sourceKeys/sourceRefs
- [ ] `world.json` 有系统/派系/地点/事件/规则
- [ ] `stories/index.json` 路径全存在
- [ ] `relationship-graph.json` 覆盖所有角色
- [ ] `plot-graph.json` 有 source-backed character appears-in
- [ ] `node tools/world-index/cli.cjs build` 无 warning
- [ ] 全量审计 OK
- [ ] 提交并按需同步 release

## 6. 本轮沉淀的关键案例

- IS：必须全文验证，不能凭通用名补全；"count=0 → 删除/修正"。
- Type-Moon：大世界 plot graph 必须做泛称黑名单和歧义短名抑制。
- DxD：主目录、真 DxD、SlashDog 需要分来源登记；TOC 只能证明目录覆盖。
- danmachi/hidan：world.json schema 不统一，工具要做 schema-flexible 读取。
- world_query：搜索应支持多词 AND 匹配和 flexible world section。

## 7. 角色别名提取经验（Hidan-no-Aria 实战沉淀）

### 7.1 笔记提取的常见别名错误

1. **家族姓氏前缀误加** — AI 笔记常给原文只用名的角色加上家族姓氏，如原文"华雪"被记成"星伽华雪"。后续搜索匹配不到原文。
   - 对策：做原文 grep 验证时，必须同时搜全名和去姓氏后的短名。

2. **译名/标点变体** — 同一角色在笔记中可能同时出现多种写法：
   - `·` 与 `・`（全角中点 vs 半角中点）
   - `GⅢ` 与 `GIII` 与 `ＧⅢ`（全角半角罗马数字）
   - `亚莉亚` 与 `亚里亚` 与 `神崎.H.亚莉亚`
   - `帕特拉` 与 `佩特拉`
   - 对策：建立统一的名称规范化规则，所有变体映射到规范键。

3. **A/B 双名格式** — 笔记用 `A/B` 表示人物的双重身份，如：
   - `远山金一/加奈`（男身份/女身份）
   - `乔瓦尼/神父`（本名/教团身份）
   - `火焰骑士（薇薇安）`（英雄名/真名）
   - 对策：以最常见/正式的名称作为规范键，其他列为 aliases。

4. **描述性称呼被当作角色名** — 笔记可能把原文中的描述性称呼提取成单独角色：
   - `半流氓首领`（无姓名，有叙事功能）
   - `蕾姬相貌的狙击手之一/之二`（纯描述，无稳定身份）
   - `金发武侦高中女生`、`眼镜学妹`
   - 对策：区分"可保留作为关系图谱节点"和"应剔除"，前者标注 low-evidence。

### 7.2 隐藏身份/别名发现

1. **事件代号 = 人物身份** — 如"武侦杀手"实为峰理子。原文 vol-03 确认「这位被封为'武侦杀手'的峰·理子·罗苹4世」。
   - 教训：看似事件/称号的独立条目，很可能是已存在角色的另一身份。必须追踪到原文确认。

2. **历史/血统引用 ≠ 独立角色** — 如"源义经""成吉思汗"出现在蕾姬的背景介绍中，不是独立角色。
   - 对策：仅提及祖先/血统的，不应作为独立角色收录。

3. **翻译用字差异** — 如"罗苹"= 罗宾 = Lupin，翻译造成的差异。
   - 对策：需要了解作品中文译本的翻译习惯，建立翻译对照表。

4. **家族亲属关系** — 如"远山金次的大哥"=远山金一/加奈，"远山金叉"=父亲（非大哥）。
   - 教训：家族谱系关系必须在原文验证后才能确认，不能凭印象归类。

### 7.3 推荐的角色提取流程

```text
Phase 0-1: 原始提取
  章节笔记 → 提取 chars[].name → 982条
  ↓
Phase 0-2: 幻觉过滤
  对每条名做原文 grep → 剔除0命中的纯描述/编造名 → 954条
  ↓
Phase 0-3: 别名分析
  按命名模式归类：姓氏前缀 / 标点变体 / A/B双名 / 简称全称
  ↓
Phase 0-4: 原文验证
  逐个阅读上下文确认谁是谁 → 修正错误归类
  ↓
Phase 0-5: 合并
  应用别名映射 → 生成 canonical 角色列表 → 722条
```

### 7.4 验证关键指标

- 原始名 → 原文 grep 命中率：理想 > 80%
- 别名归并率：通常 25-35%（如 982→722 = 26%）
- 剔除率：3-5%（纯幻觉/描述性条目）
- 每个角色平均章节分布：主角 150-280章，配角 5-50章，路人 1-3章

### 7.5 关键文件命名与用途

- `phase0-all-chars.json` — 清洁未合并版，保留全部原始名
- `phase0-merged.json` — 最终合并版，规范名 + 章节引用 + 别名回溯
- `alias-merge-manifest.md` — 全量别名映射清单（供审核）
- `volume-summaries.md` — 每卷剧情摘要（供 Phase 1 参考）
