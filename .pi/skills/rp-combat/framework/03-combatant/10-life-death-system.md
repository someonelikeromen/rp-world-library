## 10. 生命等级与死亡机制

多世界战斗中，“击败身体”和“彻底杀死”必须分开。

### 10.1 生命类型

```text
Biological        生物生命
EnhancedBody      强化肉体生命
Regenerative      再生生命
Spiritual         灵体
Mechanical        机械体
Information       信息生命
Conceptual        概念生命
Divine            神性生命
Undead            不死系
Avatar            化身/分身
Hive              群体意识
```

### 10.2 击败与击杀

```json
{
  "lifeProfile": {
    "lifeType": ["Biological", "Regenerative"],
    "vitalCore": "心脏与大脑，灵魂锚点位于胸口刻印",
    "defeatConditions": ["失去行动能力", "意识中断", "资源耗尽"],
    "killConditions": ["摧毁肉身核心", "破坏灵魂锚点"],
    "recoveryConditions": ["保留 20% 以上身体组织", "有外部生命力补给"],
    "antiRecoveryTags": ["再生抑制", "灵魂破坏", "概念抹除"]
  }
}
```

### 10.3 生命等级与抗性

生命等级影响抗性来源：

- 普通生物主要看肉身、精神、装备。
- 灵体主要看灵魂强度、对灵抗性、锚点。
- 机械体主要看结构、能源核心、信息防护。
- 信息生命主要看信息载体、备份、删除权限。
- 概念生命主要看概念锚点、规则抗性、存在证明。

---

