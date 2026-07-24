# 运行·在场人物关系阶段路由

**元数据**

- 单元ID：`card-sao-progressive-v1-3-0012-运行·在场人物关系阶段路由`
- 来源ID：`card-sao-progressive-v1-3`
- 来源路径：`local-ingest/SAO_Progressive_v1.3.json`
- 来源指针：`data.character_book.entries.12`
- 来源索引：12
- 启用：是
- 常量：是
- 选择性：否
- 定位：`after_char`
- 分类：relationships, events, runtime-prompts, abilities, items, mixed
- 名称候选：关系阶段路由

---

**预处理逻辑**

```javascript
const data = getMessageVar('stat_data', { defaults: {} }),
      world = _.get(data, '世界', {}),
      player = _.get(data, '玩家', {}),
      characters = _.get(data, '角色', {});

const ids = [...new Set([
  ...(world.當前場景角色ID || []),
  ...Object.keys(_.get(player, '隊伍.成員', {}) || {})
])].filter(id => id !== 'player' && characters[id]);

const relevant = Object.fromEntries(
  ids.map(id => [id, {
    名稱: characters[id].名稱,
    性別: characters[id].性別,
    身份: characters[id].身份,
    近況: characters[id].近況,
    對玩家關係: characters[id].對玩家關係
  }])
);

const femaleNames = ids
  .filter(id => String(characters[id]?.性別 || '').includes('女'))
  .map(id => characters[id].名稱);

const library = femaleNames.length
  ? await getwi('关系阶段·女性角色资料库')
  : '';
```

---

**当前相关角色**

（运行时由预处理逻辑动态生成，输出 `relevant` 对象中所有在场/队伍角色的名称、性别、身份、近况及对玩家关系。）

---

**关系阶段规则（v5.1.1）**

1. 关系唯一保存于 `/角色/<角色ID>/对玩家关系`，界面只读显示好感、阶段与摘要。
2. AI可直接更新关系摘要、标签、边界与已确认关键记忆；好感数值与阶段只能提交 `关系` UnifiedAction，由脚本限制范围并计算阶段。
3. 角色ID是路径键，名称只作显示。不得以译名、昵称或繁简差异另建同一人物。
4. 离场且未涉及本轮任务或事件的角色不更新。
5. 人物页面没有直接修改、删除、装备、物品或技能按钮；互动按钮只建立行动或讯息。

---

**原始条目扩展配置**

- 自动化ID：（空）
- 冷却时间：0
- 延迟：0
- 深度：2
- 显示索引：12
- 排除递归：是
- 阻止递归：是
- 分组：（空）
- 分组覆盖：否
- 分组权重：100
- 忽略预算：否
- 概率：100
- 使用概率：是
- 定位数值：4
- 角色：0
- 选择性逻辑：0
- 粘性：0
- 触发词：（空）
- 使用正则：是
- 向量化：否
- 原始条目ID：9043
- 插入顺序：951
