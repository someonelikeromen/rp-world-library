#!/bin/bash
# sync-release.sh — 将测试版 (pi-st) 的已测试改动同步到发布版 (pi-rp)
# AI 调用：bash tools/sync-release.sh [--force]
# 禁止在 release 运行 RP 时执行

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEV_DIR="$(dirname "$SCRIPT_DIR")"
RELEASE_DIR="$DEV_DIR/../pi-rp"
LOCK_FILE="$RELEASE_DIR/.rp-lock"
FORCE="${1:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[sync]${NC} $*"; }
err()  { echo -e "${RED}[sync]${NC} $*"; }

# --- 0. 检查 release 目录 ---
if [ ! -d "$RELEASE_DIR" ]; then
    err "发布目录不存在: $RELEASE_DIR"
    exit 1
fi

# --- 1. 检查锁文件 ---
if [ -f "$LOCK_FILE" ] && [ "$FORCE" != "--force" ]; then
    LOCK_AGE=$(($(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || stat -f %m "$LOCK_FILE" 2>/dev/null || echo 0)))
    err "发布版正在使用中 (锁文件存在 ${LOCK_AGE}s)"
    err "如果确认安全，使用 --force 强制同步"
    exit 1
fi

# --- 2. 检查 dev 是否有未提交的改动 ---
cd "$DEV_DIR"
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "测试版有未提交的改动，正在自动提交..."
    git add -A
    git commit -m "sync: 自动提交测试版改动 $(date '+%Y-%m-%d %H:%M')" || {
        err "自动提交失败，请手动处理"
        exit 1
    }
    log "已提交测试版改动"
else
    log "测试版无未提交改动"
fi

# --- 3. 获取当前分支和目标 commit ---
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
DEV_COMMIT=$(git rev-parse HEAD)

# --- 4. 合并到 release 分支 ---
log "切换到 release 分支..."
git checkout release
log "合并 $CURRENT_BRANCH → release..."
if git merge "$CURRENT_BRANCH" --no-edit; then
    log "合并成功"
else
    err "合并冲突！请手动解决后重新运行"
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

RELEASE_COMMIT=$(git rev-parse HEAD)
git checkout "$CURRENT_BRANCH"

# --- 5. 更新发布目录 ---
log "更新发布目录 $RELEASE_DIR ..."
cd "$RELEASE_DIR"
git pull origin release 2>/dev/null || git merge release --no-edit 2>/dev/null || {
    # 如果远程不可用，直接 checkout 到最新
    git fetch origin release 2>/dev/null || true
    git reset --hard "origin/release" 2>/dev/null || git checkout release
}

cd "$DEV_DIR"

# --- 6. 输出结果 ---
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  同步完成${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo "  测试版 commit : ${DEV_COMMIT:0:8}"
echo "  发布版 commit : ${RELEASE_COMMIT:0:8}"
echo "  发布目录      : $RELEASE_DIR"
echo ""
