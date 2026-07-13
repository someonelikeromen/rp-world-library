# Child Agent 模型访问诊断报告

> 检查日期: 2026-07-11
> 检查目标: `lt-yuyu/gpt-5.5` 配置可访问性

---

## 1. 配置文件: `C:/Users/22134/.pi/agent/models.json`

**状态**: ✅ 可读取，JSON 格式正确

**Provider 列表** (共 4 个):

| Provider ID | baseUrl | 说明 |
|---|---|---|
| `yuyu` | `https://sub.anzhiyu.com/v1` | 旧条目（无 reasoning 字段） |
| `mgtv` | `https://aigc-llm.mgtv.com/v1` | 芒果 TV DeepSeek/Qwen/GLM 等模型 |
| **`lt-yuyu`** | `https://sub.anzhiyu.com/v1` | ✅ **目标 provider**，带 reasoning 支持 |
| `lt-ccswitch` | `http://127.0.0.1:15721/v1` | 本地 ccswitch 代理（apiKey=dummy） |

### `lt-yuyu` 完整配置

```json
{
  "baseUrl": "https://sub.anzhiyu.com/v1",
  "apiKey": "sk-0d9758816c67b7a6a81fead582f9be12e7351e805c73d755aaeb557a1f6d08b9",
  "api": "openai-completions",
  "models": [
    { "id": "gpt-5.5",           "name": "GPT-5.5 (yuyu)",        "reasoning": true, "contextWindow": 258000, "maxTokens": 258000 },
    { "id": "gpt-5.4-mini",      "name": "GPT-5.4 Mini (yuyu)",   "reasoning": true },
    { "id": "gpt-5.3-codex",     "name": "GPT-5.3 Codex (yuyu)",  "reasoning": true },
    { "id": "codex-mini-latest",  "name": "Codex Mini Latest (yuyu)", "reasoning": true },
    { "id": "gpt-5.6-luna",      "name": "GPT-5.6 Luna (yuyu)",   "reasoning": true, "contextWindow": 1050000, "maxTokens": 128000 },
    { "id": "gpt-5.6-sol",       "name": "GPT-5.6 Sol (yuyu)",    "reasoning": true, "contextWindow": 1050000, "maxTokens": 128000 },
    { "id": "gpt-5.6-terra",     "name": "GPT-5.6 Terra (yuyu)",  "reasoning": true, "contextWindow": 1050000, "maxTokens": 128000 }
  ]
}
```

---

## 2. 配置: `C:/Users/22134/.pi/agent/settings.json`

**状态**: ✅ 可读取

关键字段：
- `defaultProvider`: `"deepseek"`（**非 lt-yuyu**，默认使用 deepseek）
- `defaultModel`: `"deepseek-v4-flash"`
- `defaultThinkingLevel`: `"high"`

结论：lt-yuyu 不是默认 provider，需要 child agent **显式指定** provider 为 `lt-yuyu`，模型为 `gpt-5.5`。

---

## 3. 环境变量

**状态**: ⚠️ 未发现 `PI_MODEL` 或 `PI_PROVIDER` 相关环境变量

- `C:/Users/22134/.env` — 不存在
- 全局 `.env` 文件 — 未找到与 pi model 相关的配置
- `process.env.PI_MODEL` — 未设置

---

## 4. 配置: `E:/pi-st/.pi/settings.json`

**状态**: ✅ 可读取，内容为空

```json
{
  "packages": [{
    "source": "git:github.com/obra/superpowers",
    "extensions": [],
    "skills": [],
    "prompts": [],
    "themes": []
  }]
}
```

此文件仅包含 superpowers 包引用，**不包含任何 provider 或 model 配置**。

---

## 5. 总结与结论

### `lt-yuyu` provider 是否存在？
✅ **是**。在 `C:/Users/22134/.pi/agent/models.json` 中已定义，ID 为 `"lt-yuyu"`。

### `apiKey` 是否可读？
✅ **是**。apiKey 为 `sk-0d9758816c67b7a6a81fead582f9be12e7351e805c73d755aaeb557a1f6d08b9`，以明文存储在 models.json 中，child agent 通过 `readPiModelsConfig()` 或直接读取文件均可获取。

### `baseUrl` 是什么？
`https://sub.anzhiyu.com/v1`

API 协议为 `openai-completions`（兼容 OpenAI 格式）。

### 关键注意事项

| 项目 | 状态 | 说明 |
|---|---|---|
| `lt-yuyu` provider 定义 | ✅ | 完整存在 |
| `gpt-5.5` 模型定义 | ✅ | contextWindow 258K, maxTokens 258K |
| apiKey 可读性 | ✅ | 明文存储，文件可读 |
| 默认 provider | ⚠️ | 是 `deepseek`，非 lt-yuyu |
| 环境变量 | ❌ | 未设置 PI_MODEL/PI_PROVIDER |
| 跨文件一致性 | ✅ | `yuyu` 和 `lt-yuyu` 共享相同 baseUrl 和 apiKey |

### 风险提示

1. **apiKey 明文存储** — 任何有权读取 `models.json` 的进程均可获取该 key
2. **child agent 须显式指定** — 因为 defaultProvider 是 deepseek，child agent 必须通过 provider ID `"lt-yuyu"` 和 model ID `"gpt-5.5"` 来调用，不能依赖默认选择
3. **baseUrl 为外部端点** — `sub.anzhiyu.com/v1` 为第三方代理，可用性和延迟不受本地控制
4. **`yuyu` vs `lt-yuyu` 重复** — 两个 provider ID 指向同一后端，注意区分使用
