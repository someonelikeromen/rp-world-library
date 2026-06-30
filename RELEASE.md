# 发布版管理规则（AI 必读）

## 目录结构

```
E:/pi-st/          ← 测试/开发版（当前目录）
E:/pi-rp/          ← 发布版（一直在用，跑正式 RP）
```

两个目录共享同一个 git 仓库，通过 `git worktree` 管理：
- `pi-st` 跟踪 `infra-curation-v1` 分支（开发）
- `pi-rp` 跟踪 `release` 分支（发布）

## 同步流程

### 何时同步

在 `pi-st` 完成一轮修改并通过测试后，AI 必须执行同步：

```bash
bash tools/sync-release.sh
```

### 同步脚本做了什么

1. 检查 `E:/pi-rp/.rp-lock` 锁文件（存在则拒绝同步，除非 `--force`）
2. 自动提交 `pi-st` 中的未提交改动
3. 将 `infra-curation-v1` 合并到 `release` 分支
4. 更新 `E:/pi-rp` 工作区到最新

### AI 在发布版运行 RP 时的规则

**启动 RP 前**：
```
# 创建锁文件，防止同步脚本在 RP 运行时覆盖
echo "RP running from $(date)" > E:/pi-rp/.rp-lock
```

**关闭 RP 后**：
```
# 移除锁文件
rm -f E:/pi-rp/.rp-lock
```

### 禁止事项

- ❌ **禁止在发布版运行 RP 时执行同步**（锁文件保护）
- ❌ **禁止在发布版 `pi-rp` 中直接修改文件**（改动会在下次同步时丢失）
- ❌ **禁止手动编辑 release 分支的历史**（只通过 merge 推进）
- ❌ **禁止删除 `.rp-lock` 后立即同步**（确认 RP 已真正停止）

### 文件隔离

| 类型 | 行为 |
|------|------|
| 角色卡 (`card/`) | 同步 |
| 世界书 (`campaigns/`) | 同步 |
| 知识库 (`knowledge/`) | 同步 |
| 规则 (`rules/`) | 同步 |
| 文风 (`style/`) | 同步 |
| 记忆 (`memory/`) | 同步 |
| Skills (`.pi/skills/`) | 同步 |
| **`.pi/settings.json`** | **不同步**（两边独立配置） |
| **`.pi/taskplane.json`** | **不同步**（任务队列独立） |
| **`.pi/agents/`** | **不同步**（缓存独立） |

### 回滚

如果发布版同步后出现问题：
```bash
cd E:/pi-st
git checkout release
git revert HEAD --no-edit
git push origin release
cd E:/pi-rp && git pull origin release
```

### 状态检查

AI 可随时运行以下命令了解同步状态：
```bash
cd E:/pi-st
echo "=== 开发分支 ===" && git log infra-curation-v1 --oneline -3
echo "=== 发布分支 ===" && git log release --oneline -3
echo "=== 待同步 ===" && git log release..infra-curation-v1 --oneline
```
