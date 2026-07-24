# 运行·EJS当前楼层注入控制器

categories: locations, systems, engine-rules, runtime-prompts, monsters
enabled: true
constant: true
selective: false
position: after_char

当前楼层注入控制器（EJS 预处理脚本）。

## 脚本逻辑（自然语言描述）

1. 从消息变量 `stat_data` 中读取数据（默认值 `{}`）。
2. 提取 `世界.當前樓層` 字段，夹钳到 1–100 范围，默认为 1。
3. 拼接世界信息条目键名 `楼层资料·第{楼层}层`。
4. 异步获取共用怪物运行规则世界信息条目 `楼层资料·怪物共用运行规则`。
5. 异步获取当前楼层对应的世界信息条目。
6. 将共用规则与楼层资料一并注入当前上下文，以 `CURRENT_FLOOR_INJECTION` 包裹，附带当前楼层号和来源条目名作为属性。

## 注入内容结构

——共用怪物运行规则世界信息条目内容——
——当前楼层世界信息条目内容——

## 原始 EJS 代码

```
@@preprocessing
<%_ {
const __data=getMessageVar('stat_data',{defaults:{}});
const __floor=_.clamp(Number(_.get(__data,'世界.當前樓層',1))||1,1,100);
const __entry='楼层资料·第'+__floor+'层';
const __shared=await getwi('楼层资料·怪物共用运行规则');
const __floorContent=await getwi(__entry);
_%>
<CURRENT_FLOOR_INJECTION floor="<%- __floor %>" source="<%- __entry %>">
<%- __shared %>

<%- __floorContent %>
</CURRENT_FLOOR_INJECTION>
<%_ } _%>
```

---

## 元数据

- **unitId**：`card-sao-progressive-v1-3-0008-运行·EJS当前楼层注入控制器`
- **角色卡**：`card-sao-progressive-v1-3`
- **源指针**：`data.character_book.entries.8`
- **插入位置**：`after_char`（角色定义之后）
- **常量条目**：是
- **启用**：是
- **选择性**：否
- **分类**：locations, systems, engine-rules, runtime-prompts, monsters
