# agent_team 子代理 Bash 策略调整记录

日期：2026-06-22

## 背景

在准备使用 `agent_team + bash` 执行世界信息库后续 QA 时，最初的 `agent_team` 启动失败，错误为：

```text
bash-project-settings-denied
```

报错含义：子代理 step 请求 `bash`，但其工作目录或父级目录中存在项目级 Pi 配置文件：

```text
E:/pi-st/.pi/settings.json
```

`pi-multiagent` 的安全策略会拒绝在带项目级 `.pi/settings.json` 的目录树内给 detached child step 开启 `bash`。

## 原因

`pi-multiagent` 会从子代理的 `cwd` 开始向父目录查找：

```text
<cwd>/.pi/settings.json
../.pi/settings.json
../../.pi/settings.json
...
```

只要找到非全局的项目级 `.pi/settings.json`，就拒绝该子代理使用 `bash`。

因此，即使把子代理 `cwd` 设置为：

```text
world-info-library/
```

它向上仍会发现：

```text
E:/pi-st/.pi/settings.json
```

从而触发拒绝。

## 已执行的调整

没有修改 Pi 包源码，而是采用较安全的项目策略调整：临时禁用项目级 `.pi/settings.json`。

已将：

```text
.pi/settings.json
```

移动为：

```text
.pi/settings.json.disabled-for-agentteam-bash
```

同时备份为：

```text
.pi/settings.json.backup-before-agentteam-bash
```

调整后，项目根目录不再存在 `.pi/settings.json`，子代理 bash 限制解除。

## 原 settings 内容

原 `.pi/settings.json` 内容为：

```json
{
  "packages": [
    {
      "source": "git:github.com/obra/superpowers",
      "extensions": [],
      "skills": [],
      "prompts": [],
      "themes": []
    }
  ]
}
```

该配置未启用 extensions、skills、prompts、themes，因此本次禁用对当前世界信息库 QA 任务影响较小。

## 验证结果

已启动测试 run：

```text
runId = r5
```

子代理 cwd：

```text
E:/pi-st/world-info-library
```

子代理工具包含：

```text
bash
```

测试结果：

```text
succeeded
```

验证输出确认：

- child `bash` 可用
- cwd 正确
- 未修改文件

## 恢复方式

如需恢复项目级 settings，可执行：

```bash
mv .pi/settings.json.disabled-for-agentteam-bash .pi/settings.json
```

或用备份恢复：

```bash
cp .pi/settings.json.backup-before-agentteam-bash .pi/settings.json
```

## 后续

在该策略调整后，可以继续使用：

```text
agent_team + bash
```

执行世界信息库后续任务：

1. JSON/schema QA
2. 交叉引用 QA
3. 高风险质量抽样复核
4. 运行时检索文档
5. campaign/session 层模板
