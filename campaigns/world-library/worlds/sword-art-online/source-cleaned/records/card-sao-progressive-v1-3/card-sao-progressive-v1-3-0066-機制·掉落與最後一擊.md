# 机制·掉落与最后一击

怪物掉落由固定掉落表、生态、稀有度、任务与首杀决定。最后一击只授予实际完成终结条件的角色。所有经验、Col、物品、熟练度与耐久结果以`战斗`或`物品取得`UnifiedAction交给唯一调度器；单个行动ID只处理一次。脚本负责物品模板识别与同物堆叠。

---

- **源文件**: `card-sao-progressive-v1-3` — `local-ingest/SAO_Progressive_v1.3.json`
- **条目索引**: `data.character_book.entries.66` (display_index: 67, id: 201)
- **分类**: systems, engine-rules, runtime-prompts, items, monsters
- **位置**: before_char
- **状态**: enabled=false, constant=false, selective=false
