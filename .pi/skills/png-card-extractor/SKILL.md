# PNG Card Extractor

从 SillyTavern PNG/WEBP 角色卡中提取嵌入的 JSON 数据。

## 触发条件

- 用户放入 PNG/WEBP 格式的角色卡到 `card/`
- 需要从图片中提取角色 JSON 数据

## 原理

SillyTavern 角色卡将 JSON 嵌入 PNG 的 `tEXt` chunk：
- keyword: `chara`
- 内容: base64 编码的角色 JSON

## 使用方法

### 1. 直接用 Python 提取

不需要预存脚本，inline 执行：

```bash
python -c "
import base64, json, struct, sys
from pathlib import Path

path = 'card/角色卡.png'
data = Path(path).read_bytes()
if not data.startswith(b'\x89PNG\r\n\x1a\n'):
    sys.exit('not PNG')
pos = 8
while pos < len(data):
    length = struct.unpack('>I', data[pos:pos+4])[0]
    chunk_type = data[pos+4:pos+8].decode('ascii', errors='replace')
    chunk_data = data[pos+8:pos+8+length]
    if chunk_type == 'tEXt':
        null_pos = chunk_data.find(b'\x00')
        if null_pos >= 0:
            keyword = chunk_data[:null_pos].decode('latin-1', errors='replace')
            if keyword == 'chara':
                result = json.loads(base64.b64decode(chunk_data[null_pos+1:]))
                out_path = path.rsplit('.',1)[0] + '_card.json'
                Path(out_path).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
                print(f'提取成功: {out_path}')
                print(f'角色名: {result.get(\"name\", \"未知\")}')
                sys.exit(0)
    if chunk_type == 'IEND':
        break
    pos += 12 + length
print('未找到角色卡数据')
"
```

替换 `card/角色卡.png` 为实际路径。

### 2. 输出命名

- 输入：`card/<文件名>.png`
- 输出：`card/<文件名>_card.json`

### 3. 提取后从 JSON 中读取的关键字段

| 字段 | 说明 |
|------|------|
| `name` | 角色名 |
| `description` | 角色描述 |
| `personality` | 人格设定 |
| `scenario` | 场景/背景 |
| `first_mes` | 开场白 |
| `alternate_greetings` | 替代开场白 |
| `system_prompt` | 系统提示词 |
| `post_history_instructions` | 对话后指令 |
| `character_book.entries[]` | 关联世界书条目 |

### 4. 后续流程

提取完成后交给 `rp-engine` skill 进行角色卡解析和 RP 初始化。

## 原则

- 优先复用已提取的 `*_card.json`，避免重复解析。
- 提取后的 JSON 与原图片放在同一目录。
- 不要让模型直接读取大图片来"理解角色卡"。

## 相关 Skills

- `rp-engine`：RP 主引擎（使用提取的角色 JSON 初始化）
