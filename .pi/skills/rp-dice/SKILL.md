# RP Dice

掷骰子系统。用于 RP 中的随机判定、检定、伤害掷骰。

## 触发条件

- 需要随机判定结果
- 战斗伤害掷骰
- 属性检定、技能检定
- 用户输入"掷骰""骰子""d20""1d6"等

## 使用方式

用 Python 一行掷骰，不需要脚本文件。

### 基本掷骰

```bash
# 单次掷骰：XdY 格式
python -c "import random; print(f'1d20 = {random.randint(1,20)}')"
python -c "import random; print(f'2d6 = {random.randint(1,6)+random.randint(1,6)}')"
python -c "import random; print(f'3d8+5 = {sum(random.randint(1,8) for _ in range(3))+5}')"
```

### 多次掷骰

```bash
# 通用掷骰表达式（支持修饰符）
python -c "
import random,re
expr='3d8+2'
m=re.match(r'(\d+)d(\d+)([+-]\d+)?$',expr)
n,sides,mod=int(m[1]),int(m[2]),int(m[3]or 0)
rolls=[random.randint(1,sides) for _ in range(n)]
print(f'{expr}: rolls={rolls} sum={sum(rolls)}{mod:+d}={sum(rolls)+mod}' if m[3] else f'{expr}: rolls={rolls} sum={sum(rolls)}')
"
```

### 优势/劣势

```bash
# 优势（掷两个取大）
python -c "import random; a=[random.randint(1,20) for _ in range(2)]; print(f'优势 d20: {a} → max={max(a)}')"

# 劣势（掷两个取小）
python -c "import random; a=[random.randint(1,20) for _ in range(2)]; print(f'劣势 d20: {a} → min={min(a)}')"
```

### 对抗检定

```bash
# 双方 d20 + 修正
python -c "
import random
a=random.randint(1,20)+3
b=random.randint(1,20)+1
print(f'玩家 d20+3={a} vs NPC d20+1={b} → {\"玩家胜\" if a>b else \"NPC胜\" if b>a else \"平局\"}')"
```

### 常用掷骰模板

| 场景 | 命令模式 |
|------|---------|
| 属性检定 | `python -c "import random; print(f'd20+{修正}={random.randint(1,20)+修正}')"` |
| 伤害掷骰 | `python -c "import random; print(f'{n}d{面}{修正:+}={sum(random.randint(1,{面}) for _ in range({n}))+修正}')"` |
| 优势检定 | `python -c "import random; a=[random.randint(1,20) for _ in range(2)]; print(f'优势: {a} max={max(a)}')"` |
| 劣势检定 | `python -c "import random; a=[random.randint(1,20) for _ in range(2)]; print(f'劣势: {a} min={min(a)}')"` |

## 原则

- 掷骰结果是公开信息，直接展示给用户。
- 不要伪造或重掷不理想的结果。
- 如果用户想自定义难度等级（DC），先确认 DC 再掷。
- 战斗时配合 `rp-combat` skill 使用。
