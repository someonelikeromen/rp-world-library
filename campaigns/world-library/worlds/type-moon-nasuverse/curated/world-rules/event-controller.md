# 事件控制器(EJS)

> 来源: raw worldbook entries

## [ejs]FGO_事件控制器 ([沙盒]FGO 0.8.worldbook.json:107)

<%_
if (typeof storyLine === 'undefined') var storyLine = getvar('stat_data.世界状态.选择故事线', { defaults: '???' });
if (typeof storyLineUpper === 'undefined') var storyLineUpper = storyLine.toUpperCase();
_%>

  <%_ if (storyLineUpper.includes('特异点F') || storyLineUpper.includes('冬木') || storyLineUpper.includes('序章') || storyLineUpper.includes('FUYUKI')) { _%>
    <%- await getwi(null, 'FGO_特异点F_冬木') %>

  <%_ } else if (storyLineUpper.includes('巴比伦') || storyLineUpper.includes('第七特异点') || storyLineUpper.includes('绝对魔兽战线') || storyLineUpper.includes('BABYLONIA')) { _%>
    <%- await getwi(null, 'FGO_第七特异点_巴比伦尼亚') %>

  <%_ } else if (storyLineUpper.includes('卡美洛') || storyLineUpper.includes('第六特异点') || storyLineUpper.includes('神圣圆桌') || storyLineUpper.includes('CAMELOT')) { _%>
    <%- await getwi(null, 'FGO_第六特异点_卡美洛') %>

  <%_ } else if (storyLineUpper.includes('合众为一') || storyLineUpper.includes('第五特异点') || storyLineUpper.includes('北美') || storyLineUpper.includes('E PLURIBUS UNUM') || storyLineUpper.includes('PLURIBUS')) { _%>
    <%- await getwi(null, 'FGO_第五特异点_合众为一') %>

<%_ } else if (storyLineUpper.includes('监狱塔') || storyLineUpper.includes('复仇鬼') || storyLineUpper.includes('PRISON TOWER') || storyLineUpper.includes('DANTES')) { _%>
    <%- await getwi(null, 'FGO_活动_监狱塔内复仇鬼的哭泣') %>

  <%_ } else if (storyLineUpper.includes('伦敦') || storyLineUpper.includes('第四特异点') || storyLineUpper.includes('死界魔雾') || storyLineUpper.includes('LONDON')) { _%>
    <%- await getwi(null, 'FGO_第四特异点_伦敦') %>

  <%_ } else if (storyLineUpper.includes('俄刻阿诺斯') || storyLineUpper.includes('第三特异点') || storyLineUpper.includes('封锁终局四海') || storyLineUpper.includes('OKEANOS')) { _%>
    <%- await getwi(null, 'FGO_第三特异点_俄刻阿诺斯') %>

  <%_ } else if (storyLineUpper.includes('七丘') || storyLineUpper.includes('第二特异点') || storyLineUpper.includes('永续疯狂') || storyLineUpper.includes('塞普提姆') || storyLineUpper.includes('SEPTEM')) { _%>
    <%- await getwi(null, 'FGO_第二特异点_七丘之城') %>

  <%_ } else if (storyLineUpper.includes('奥尔良') || storyLineUpper.includes('第一特异点') || storyLineUpper.includes('百年战争') || storyLineUpper.includes('ORLEANS')) { _%>
    <%- await getwi(null, 'FGO_第一特异点_奥尔良') %>

  <%_ } else if (storyLineUpper.includes('终局') || storyLineUpper.includes('所罗门') || storyLineUpper.includes('冠位时间神殿') || storyLineUpper.includes('SOLOMON')) { _%>
    <%- await getwi(null, 'FGO_终局特异点_所罗门') %>

  <%_ } else if (storyLineUpper.includes('塞勒姆') || storyLineUpper.includes('亚种特异点IV') || storyLineUpper.includes('亚种特异点4') || storyLineUpper.includes('异种特异点IV') || storyLineUpper.includes('异种特异点4') || storyLineUpper.includes('禁忌降临') || storyLineUpper.includes('SALEM')) { _%>
    <%- await getwi(null, 'FGO_亚种特异点IV_塞勒姆') %>

  <%_ } else if (storyLineUpper.includes('下总') || storyLineUpper.includes('亚种特异点III') || storyLineUpper.includes('亚种特异点3') || storyLineUpper.includes('异种特异点III') || storyLineUpper.includes('异种特异点3') || storyLineUpper.includes('屍山血河') || storyLineUpper.includes('SHIMOSA')) { _%>
    <%- await getwi(null, 'FGO_亚种特异点III_下总国') %>

  <%_ } else if (storyLineUpper.includes('雅戈泰') || storyLineUpper.includes('亚种特异点II') || storyLineUpper.includes('亚种特异点2') || storyLineUpper.includes('异种特异点II') || storyLineUpper.includes('异种特异点2') || storyLineUpper.includes('传承地底') || storyLineUpper.includes('AGARTHA')) { _%>
    <%- await getwi(null, 'FGO_亚种特异点II_雅戈泰') %>

  <%_ } else if (storyLineUpper.includes('新宿') || storyLineUpper.includes('亚种特异点I') || storyLineUpper.includes('亚种特异点1') || storyLineUpper.includes('异种特异点I') || storyLineUpper.includes('异种特异点1') || storyLineUpper.includes('恶性隔绝') || storyLineUpper.includes('SHINJUKU')) { _%>
    <%- await getwi(null, 'FGO_亚种特异点I_新宿') %>

  <%_ } else if (storyLineUpper.includes('LB1') || storyLineUpper.includes('安娜塔西亚') || storyLineUpper.includes('异闻带1') || storyLineUpper.includes('异闻带NO.1') || storyLineUpper.includes('永久冻土') || storyLineUpper.includes('ANASTASIA')) { _%>
    <%- await getwi(null, 'FGO_LB1_安娜塔西亚') %>

  <%_ } else if (storyLineUpper.includes('LB2') || storyLineUpper.includes('诸神黄昏') || storyLineUpper.includes('异闻带2') || storyLineUpper.includes('异闻带NO.2') || storyLineUpper.includes('无间冰焰') || storyLineUpper.includes('GÖTTERDÄMMERUNG') || storyLineUpper.includes('GOTTERDAMMERUNG')) { _%>
    <%- await getwi(null, 'FGO_LB2_诸神黄昏') %>

  <%_ } else if (storyLineUpper.includes('LB3') || storyLineUpper.includes('人智统合真国') || storyLineUpper.includes('大秦') || storyLineUpper.includes('异闻带3') || storyLineUpper.includes('异闻带NO.3') || storyLineUpper.includes('SIN')) { _%>
    <%- await getwi(null, 'FGO_LB3_人智统合真国') %>

  <%_ } else if (storyLineUpper.includes('LB4') || storyLineUpper.includes('创世灭亡轮回') || storyLineUpper.includes('印度') || storyLineUpper.includes('异闻带4') || storyLineUpper.includes('异闻带NO.4') || storyLineUpper.includes('尤迦') || storyLineUpper.includes('YUGA')) { _%>
    <%- await getwi(null, 'FGO_LB4_创世灭亡轮回') %>

  <%_ } else if (storyLineUpper.includes('LB5_1') || storyLineUpper.includes('亚特兰蒂斯') || storyLineUpper.includes('大西洋') || storyLineUpper.includes('ATLANTIS')) { _%>
    <%- await getwi(null, 'FGO_LB5_1_亚特兰蒂斯') %>

  <%_ } else if (storyLineUpper.includes('LB5_2') || storyLineUpper.includes('奥林波斯') || storyLineUpper.includes('OLYMPUS') || storyLineUpper.includes('星间都市')) { _%>
    <%- await getwi(null, 'FGO_LB5_2_奥林波斯') %>

  <%_ } else if (storyLineUpper.includes('平安京') || storyLineUpper.includes('地狱界曼荼罗') || storyLineUpper.includes('HEIAN')) { _%>
    <%- await getwi(null, 'FGO_断章_平安京') %>

  <%_ } else if (storyLineUpper.includes('LB6_1') || storyLineUpper.includes('阿瓦隆') || storyLineUpper.includes('不列颠') || storyLineUpper.includes('异闻带6') || storyLineUpper.includes('异闻带NO.6') || storyLineUpper.includes('妖精圆桌') || storyLineUpper.includes('AVALON')) { _%>
    <%- await getwi(null, 'FGO_LB6_1_阿瓦隆前篇') %>

  <%_ } else if (storyLineUpper.includes('LB6_2') || storyLineUpper.includes('圆桌后篇')) { _%>
    <%- await getwi(null, 'FGO_LB6_2_圆桌终章') %>

  <%_ } else if (storyLineUpper.includes('通古斯卡') || storyLineUpper.includes('TUNGUSKA')) { _%>
    <%- await getwi(null, 'FGO_断章_通古斯卡') %>

  <%_ } else if (storyLineUpper.includes('TRAUM') || storyLineUpper.includes('死想显现界域') || storyLineUpper.includes('死想显现')) { _%>
    <%- await getwi(null, 'FGO_断章_Traum') %>

  <%_ } else if (storyLineUpper.includes('LB7') || storyLineUpper.includes('纳维') || storyLineUpper.includes('米克特兰') || storyLineUpper.includes('南美') || storyLineUpper.includes('异闻带7') || storyLineUpper.includes('异闻带NO.7') || storyLineUpper.includes('黄金树海') || storyLineUpper.includes('ORT')) { _%>
    <%- await getwi(null, 'FGO_LB7_纳维米克特兰') %>

  <%_ } else if (storyLineUpper.includes('奏章3') || storyLineUpper.includes('奏章III') || storyLineUpper.includes('奏章三') || storyLineUpper.includes('统合') || storyLineUpper.includes('迪拜')) { _%>
    <%- await getwi(null, 'FGO_奏章III_统合') %>

  <%_ } else if (storyLineUpper.includes('奏章2') || storyLineUpper.includes('奏章II') || storyLineUpper.includes('奏章二') || storyLineUpper.includes('伊德') || storyLineUpper.includes('ID')) { _%>
    <%- await getwi(null, 'FGO_奏章II_伊德') %>

  <%_ } else if (storyLineUpper.includes('奏章1') || storyLineUpper.includes('奏章I') || storyLineUpper.includes('奏章一') || storyLineUpper.includes('纸月') || storyLineUpper.includes('PAPER MOON')) { _%>
    <%- await getwi(null, 'FGO_奏章I_纸月') %>

  <%_ } _%>

---

