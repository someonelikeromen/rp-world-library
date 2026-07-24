# 运行·EJS生成准则注入控制器

```
@@preprocessing
<%_ {
const data=getMessageVar('stat_data',{defaults:{}}),world=_.get(data,'世界',{}),player=_.get(data,'玩家',{}),system=_.get(data,'系統',{});
const messages=getChatMessages(-8,{include_swipes:false})||[],latestUser=[...messages].reverse().find(m=>m.role==='user'||m.is_user===true)||{};
const userText=String(latestUser.message||latestUser.mes||''),scene=String(_.get(world,'場景狀態','日常')),floor=_.clamp(Number(_.get(world,'當前樓層',1))||1,1,100);
const encounter=_.get(world,'當前遭遇',null),facilities=_.get(world,'當前樓層檔案.設施',{}),tasks=_.get(data,'任務',{}),events=_.get(world,'事件',{}),organizations=_.get(world,'組織',{});
const activeActions=(_.get(system,'行動請求',[])||[]).slice(-5),pending=_.get(system,'待確認行動',{});
const signal=[userText,scene,JSON.stringify(encounter),JSON.stringify(facilities),JSON.stringify(tasks),JSON.stringify(events),JSON.stringify(activeActions),JSON.stringify(pending)].join('\n');
const names=[],add=(condition,...list)=>{if(condition)names.push(...list)},match=pattern=>pattern.test(signal);
add(match(/初次見面|初次见面|陌生玩家|新角色|結識|结识|招募|同行|隊友|队友|對手|对手/),'人物生成准则');
add(match(/NPC|委託人|委托人|店主|鐵匠|铁匠|裁縫|裁缝|廚師|厨师|鑑定師|鉴定师|守衛|守卫|村民|嚮導|向导|商人/),'NPC生成准则');
add(match(/遭遇|怪物|狩獵|狩猎|索敵|索敌|怪群|精英/)||!!encounter,'怪物生成准则');
add(match(/Boss|BOSS|首領|首领|樓層主|楼层主/),'Boss生成准则');
add(match(/獲得|获得|拾取|寶箱|宝箱|獎勵|奖励|道具|藥水|药水|材料|戰利品|战利品/),'物品生成准则');
add(match(/武器|防具|裝備|装备|劍|剑|細劍|细剑|戰斧|战斧|戰錘|战锤|長槍|长枪|盾牌|強化|强化/),'装备生成准则');
add(match(/公會|公会|組織|组织|攻略組|攻略组|派系|軍團|军团|聯盟|联盟/),'组织生成准则');
add(match(/劍技|剑技|戰鬥技能|战斗技能|熟練度|熟练度|訓練|训练|連擊|连击|Switch/),'战斗技能生成准则');
add(match(/輔助技能|辅助技能|索敵|索敌|隱蔽|隐蔽|潛行|潜行|追蹤|追踪|疾走|游泳|開鎖|开锁/),'辅助技能生成准则');
add(match(/鍛造|锻造|裁縫|裁缝|料理|鑑定|鉴定|採集|采集|釣魚|钓鱼|修理|服務|服务/),'生活技能生成准则');
add(match(/掉落|戰利品|战利品|剝取|剥取|素材/),'掉落物生成准则');
add(match(/配方|製作圖|制作图|卷軸|卷轴|食譜|食谱/),'配方生成准则');
add(match(/抵達|抵达|進入|进入|前往|移動|移动|路線|路线|城鎮|城镇|村莊|村庄|迷宮|迷宫|森林|洞窟|街區|街区|第\s*\d+\s*層|层/)||scene==='探索','地点生成准则');
add(match(/購買|购买|出售|交換|交换|交易|價格|价格|庫存|库存|商店|攤位|摊位|拍賣|拍卖|贈送|赠送/),'商店与交易生成准则');
add(match(/等級|等级|經驗|经验|升級|升级|成長|成长|屬性點|属性点|STR|AGI/),'系统·等级、经验与成长');
add(match(/戰鬥|战斗|攻擊|攻击|反擊|反击|格擋|格挡|命中|閃避|闪避|速度|行動順序|行动顺序/)||['戰鬥','Boss戰','战斗','Boss战'].includes(scene),'系统·剑技','系统·战斗');
add(match(/技能槽|熟練度|熟练度|被動|被动|特性|技能資源|技能资源/),'系统·技能');
add(match(/背包|選單|菜单|物品|裝備|装备|卸下|使用|丟棄|丢弃/),'系统·界面、菜单与物品');
add(match(/配方|卷軸|卷轴|食譜|食谱|製作圖|制作图/),'系統·配方');
add(match(/掉落|戰利品|战利品|最後一擊|最后一击|擊敗|击败|斬殺|斩杀/),'系統·掉落与战利品','机制·掉落与最后一击');
add(match(/鍛造|锻造|強化|强化|修理/),'系統·锻造');
add(match(/裁縫|裁缝|縫製|缝制|布料|皮革/),'系統·裁缝');
add(match(/料理|烹飪|烹饪|食材|廚具|厨具/),'系統·料理');
add(match(/鑑定|鉴定|未鑑定|未鉴定/),'系統·鉴定');
add(match(/交易|決鬥|决斗|贈送|赠送|購買|购买|出售|交換|交换|價格|价格|估價|估价|店主|商店|庫存|库存|補貨|补货|還價|还价|議價|议价|收購|收购/),'系统·交易与决斗','系统·经济、交易、生产与耐久','经济·物品价值与柔性估价','经济·商店库存与补货','经济·店主策略与议价');
add(match(/隊伍|队伍|同行|公會|公会|攻略組|攻略组|組織|组织|軍團|军团|聯盟|联盟/)||Object.keys(organizations).length>0,'系统·队伍、公会与攻略集团','组织·原作与原创组织并存规则');
add(match(/中毒|麻痺|麻痹|眩暈|眩晕|衰弱|睡眠|黑暗|混亂|混乱|出血|恐慌|安全區|安全区|仇恨/),'机制·异常状态、仇恨与安全');
add(match(/任務|任务|委託|委托|接取|目標|目标|獎勵|奖励/)||Object.keys(tasks).length>0,'机制·任务与NPC委托');
add(match(/世界事件|公共事件|危機|危机|事故|騷亂|骚乱|傳聞發展|传闻发展/)||Object.keys(events).length>0,'机制·动态事件','事件·共用生成与运行规则');
add(match(/PK|紅名|红名|黃名|黄名|犯罪|MPK|橙名|殺人|杀人/),'机制·PK、光标与犯罪社会');
add(match(/情報|情报|傳聞|传闻|攻略知識|攻略知识|地圖情報|地图情报|情報商|情报商/),'机制·情报、传闻与攻略知识');
add(match(/危險|危险|風險|风险|前線|前线/),'机制·风险等级与遭遇带宽');
add(match(/品質|品质|稀有|史詩|史诗|傳說|传说|唯一|裝備強度|装备强度/),'机制·装备品质与楼层带宽');
add(match(/決鬥|决斗|玩家衝突|玩家冲突|挑戰|挑战|勝負模式|胜负模式/),'机制·决斗与玩家冲突');
add(match(/房屋|旅店|店鋪|店铺|住宅|據點|据点|玩家店/),'机制·房屋、旅店与玩家店铺');
const selected=[...new Set(names)],parts=[];
for(const name of selected){const content=await getwi(name);if(content)parts.push(content);}
_%>
<%= parts.join('\n\n') %>
<%_ } _%>
```
