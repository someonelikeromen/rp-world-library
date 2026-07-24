# [mvu_update]当前变量

**来源**: card-sao-progressive-v1-3, data.character_book.entries.2
**类型**: character_card_entry
**定位**: after_char
**常量**: true

---

## 说明

这是一个宏更新条目，用于从游戏状态数据中提取和格式化当前变量，分为可直接更新的变量和唯讀上下文两个部分。模板使用 EJS 语法动态生成 YAML 格式的变量块。

具体包括：
- 从 `stat_data` 消息变量中读取世界、玩家、角色、任务、系统数据
- 合并当前场景角色、队伍成员、活跃任务相关角色，生成可写角色列表（最多30个）
- 对可写角色保留基本属性及对玩家关系摘要
- 对唯讀角色保留战斗、交易、服务、状态效果等详细信息
- 筛选当前楼层活跃事件和组织
- 压缩玩家背包数据

输出两部分：
1. **直接更新变量**：世界状态（天气、区域、场景角色、事件、组织）、可写角色、活跃任务、通讯
2. **唯讀行动上下文**：世界基础信息、玩家完整状态、唯讀角色详情、待确认/失败行动

## 内容

```
<status_current_variables>
const data = cloneDeep(getMessageVar('stat_data', { defaults: {} }));
const world = get(data, '世界', {});
const player = get(data, '玩家', {});
const characters = get(data, '角色', {});
const tasks = get(data, '任務', {});
const system = get(data, '系統', {});

// 获取 SAOP V5 API
let api = globalThis.SAOP_V5_API || globalThis.window?.SAOP_V5_API || globalThis.window?.parent?.SAOP_V5_API || null;

// 有效衍生属性计算
const effectiveStats = id => {
  return api?.derivedStats ? api.derivedStats(data, id) : null;
};

const playerEffective = effectiveStats('player');

// 合并相关角色ID来源：场景、队伍、任务
const sceneIds = get(world, '當前場景角色ID', []);
const partyIds = Object.keys(get(player, '隊伍.成員', {})).filter(id => id !== 'player');
const activeTasks = Object.fromEntries(
  Object.entries(tasks)
    .filter(([,task]) => ['可接取','進行中'].includes(task?.狀態))
    .slice(-20)
);
const taskIds = Object.values(activeTasks)
  .flatMap(task => [task?.發起者ID, ...(task?.參與者ID || [])])
  .filter(Boolean);
const relevantIds = uniq([...sceneIds, ...partyIds, ...taskIds])
  .filter(id => characters[id])
  .slice(-30);

// 可写角色：基本属性 + 对玩家关系摘要
const writableCharacters = Object.fromEntries(
  relevantIds.map(id => {
    const c = characters[id] || {};
    const base = pick(c, [
      'ID','名稱','類型','資料來源','身份','性別','外貌',
      '最後已知位置','近況','當前目標','生活規律','移動規律',
      '光標狀態','公會ID','關聯任務ID','最後更新時間'
    ]);
    base.對玩家關係 = pick(c?.對玩家關係 || {}, ['摘要','標籤','關鍵記憶','邊界']);
    return [id, base];
  })
);

// 唯讀角色：含战斗、交易、服务详情
const readonlyCharacters = Object.fromEntries(
  relevantIds.map(id => {
    const c = characters[id] || {};
    const inParty = partyIds.includes(id);

    const combat = c.戰鬥 ? {
      等級: c.戰鬥.等級,
      HP: c.戰鬥.HP,
      屬性: c.戰鬥.屬性,
      Col: c.戰鬥.Col,
      裝備: c.戰鬥.裝備,
      技能: Object.fromEntries(
        Object.entries(c.戰鬥.技能 || {}).filter(([,skill]) => skill?.公開 !== false)
      ),
      技能資源: c.戰鬥.技能資源,
      狀態效果: c.戰鬥.狀態效果 || c.狀態效果 || {},
      有效衍生屬性: effectiveStats(id),
      ...(inParty ? { 背包: c.戰鬥.背包 } : {})
    } : null;

    const trade = c.交易 ? {
      類型: c.交易.類型,
      Col: c.交易.Col,
      定價策略: c.交易.定價策略,
      價格表: c.交易.價格表,
      庫存: Object.fromEntries(
        Object.entries(c.交易.庫存 || {}).filter(([,item]) => item?.可交易 !== false)
      )
    } : null;

    return [id, {
      ID: c.ID,
      名稱: c.名稱,
      對玩家關係: pick(c?.對玩家關係 || {}, ['好感','階段','最後變化時間']),
      戰鬥: combat,
      狀態效果: c.狀態效果 || c?.戰鬥?.狀態效果 || {},
      交易: trade,
      服務: c.服務 || {},
      正式隊友: inParty
    }];
  })
);

// 筛选当前楼层活跃事件和组织
const activeEvents = Object.fromEntries(
  Object.entries(get(world, '事件', {}))
    .filter(([,event]) =>
      event?.狀態 === '進行中' || Number(event?.樓層) === Number(world?.當前樓層)
    )
    .slice(-20)
);

const activeOrganizations = Object.fromEntries(
  Object.entries(get(world, '組織', {}))
    .filter(([,org]) =>
      (org?.活動樓層 || []).includes(Number(world?.當前樓層)) ||
      org?.當前行動地點 === world?.當前區域
    )
    .slice(-20)
);

// 压缩玩家背包数据
const compactItems = Object.fromEntries(
  Object.entries(get(player, '背包', {}))
    .map(([id, item]) => [id, pick(item, [
      '物品ID','模板ID','實例ID','顯示名稱','類別','子類','品質','數量',
      '綁定狀態','鑑定狀態','耐久','強化','狀態','可交易','可丟棄','基礎資料'
    ])])
);

// 可直接更新的变量
const writable = {
  世界: {
    天氣: world?.天氣,
    當前區域: world?.當前區域,
    詳細地點: world?.詳細地點,
    區域狀態: world?.區域狀態,
    場景狀態: world?.場景狀態,
    當前場景角色ID: sceneIds,
    當前樓層檔案: world?.當前樓層檔案 || {},
    當前遭遇: world?.當前遭遇,
    事件: activeEvents,
    組織: activeOrganizations
  },
  角色: writableCharacters,
  任務: activeTasks,
  通訊: get(data, '通訊', {消息:{},通知:{}})
};

// 唯讀上下文
const readonly = {
  世界: pick(world, ['日期','時間','當前樓層','已解鎖樓層','死亡人數']),
  玩家: {
    ID: player?.ID,
    名稱: player?.名稱,
    等級: player?.等級,
    經驗: player?.經驗,
    HP: player?.HP,
    屬性: player?.屬性,
    Col: player?.Col,
    光標狀態: player?.光標狀態,
    公會ID: player?.公會ID,
    聲望: player?.聲望,
    裝備: player?.裝備,
    技能: player?.技能,
    技能槽: player?.技能槽,
    技能資源: player?.技能資源,
    狀態效果: player?.狀態效果,
    有效衍生屬性: playerEffective,
    背包: compactItems,
    隊伍: player?.隊伍,
    已知配方: player?.已知配方
  },
  相關角色: readonlyCharacters,
  待確認行動: get(system, '待確認行動', {}),
  最近失敗行動: (get(system, '行動日誌', []) || [])
    .filter(x => x?.狀態 === '已失敗')
    .slice(-5)
};

// 输出 YAML 格式
YAML.stringify(writable, { blockQuote: 'literal' })
// → 直接更新变量

YAML.stringify(readonly, { blockQuote: 'literal' })
// → 唯讀行动上下文
</status_current_variables>
```

## 关键数据模型

### 可写变量 (writable)
- **世界**：天气、区域、地点、状态、场景角色、楼层档案、遭遇、事件、组织
- **角色**：相关 NPC 的基本档案与关系摘要
- **任务**：可接取/进行中的活跃任务（最多20个）
- **通讯**：消息与通知

### 唯讀变量 (readonly)
- **世界**：日期、时间、楼层、死亡人数
- **玩家**：完整角色面板（属性、装备、技能、背包、队伍）
- **相關角色**：NPC 战斗面板、交易、服务详情
- **操作反馈**：待确认行动、最近失败行动（最多5条）
