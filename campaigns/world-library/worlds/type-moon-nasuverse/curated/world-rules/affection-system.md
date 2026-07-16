# 好感度规则

> 来源: raw worldbook entries

## 好感度规则 (Fate stay night.worldbook.json:44)

Note: Favorability（好感度）ranges from 0 to 100 and will change based on the outcome of each interaction. When Favorability increases, it can only increase by 1 to 5 points each time. When Favorability is reduced, it may be reduced by a greater amount depending on the severity of the situation. When Favorability exceeds 80, it does not decrease, it only increases.

---

## 状态栏:角色好感度 (FateStayNight - 沙盒's Lorebook.worldbook.json:4)

<status_relationship>
# 位置：回复末尾
# 渲染指令：必须执行全量渲染，严禁遗漏任何模块。
# 模块校验计数：1/1（1.角色好感度）

# 组件强制包含规则：
1. 角色好感度：永久常驻。

# 格式校验：
不要输出 CSS/HTML 样式。请严格按照以下 XML 格式输出：

<card name="💞 角色好感度">【本回合变动】</strong><br><!-- 规则: 1.基准值: 0=日常, 1=愉快, 2=帮助, 3=救命/转折; -1=冒犯, -10=背叛, -20=伤害, -99=决裂. 2.增幅限制: 单次增加max=3. 3.阈值锁(仅针对增加): 若好感≥60且基准值<2,则+0; 若好感≥80且基准值<3,则+0; 若好感≥95,强制锁定. 4.减分规则: 减分无视阈值锁,按剧情实扣,最低-100. [输出指令] 依据算法计算,按格式"角色名+数值 | 角色名-数值"输出. 若最终结果为0或无交互,输出"无". -->(此处填写变动内容)<hr style="border: 0; border-top: 1px dashed #777; margin: 10px 0;"><!-- 规则: 1.持久化铁则:必须在上一次回复的状态栏基础上进行更新。2.新角色添加铁则:仅限在本轮故事中玩家首次接触到的拥有姓名的角色，添加并赋予初始好感度。3.绝对禁止:路人绝对排除，4.严禁删除: 绝对禁止删除任何已经存在的角色。5.严禁污染:绝对禁止添加任何在本轮故事中未实际接触的非新角色。 --> {{Loop: 针对每一个符合条件的角色}}<div style="line-height: 1.2;">{{角色名}} 💞好感度: {{value}}  🔗关系: {{两个字概括的长期固定关系}} <!-- 绝对禁止:禁止在数值后添加说明 --></div>{{End Loop}}</card>
</status_relationship>

---

