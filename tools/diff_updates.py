"""
差异检测脚本 - 比较云端更新日志与本地缓存，识别增量变更。

用法:
    py -3.11 tools/diff_updates.py <表名> [--apply]

参数:
    <表名>    曙光表 或 无限口述规则
    --apply   自动将变更标记为待处理
"""

import json
import os
import sys
from datetime import datetime

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')
UPDATES_DIR = os.path.join(os.path.dirname(__file__), 'updates')

def load_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_local_log(sheet_name):
    """加载本地缓存的更新日志"""
    safe_name = sheet_name.replace(' ', '_')
    path = os.path.join(UPDATES_DIR, f'{safe_name}_更新日志.json')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_local_log(sheet_name, log_data):
    """保存更新日志到本地缓存"""
    os.makedirs(UPDATES_DIR, exist_ok=True)
    safe_name = sheet_name.replace(' ', '_')
    path = os.path.join(UPDATES_DIR, f'{safe_name}_更新日志.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, ensure_ascii=False, indent=2)

def diff_logs(old_log, new_log, config):
    """
    比较新旧更新日志，返回差异。

    old_log: 本地缓存的更新日志列表
    new_log: 云端获取的更新日志列表
    config: 表格配置

    返回: {
        'added': [...],     # 新增条目
        'modified': [...],  # 修改条目
        'removed': [...],   # 删除条目
        'unchanged': n      # 未变更数量
    }
    """
    cols = config['updateLogColumns']
    name_col = str(cols.get('name', 64))

    # 以名称为 key 建立索引
    old_index = {}
    for entry in old_log:
        name = entry.get(name_col, '')
        if name:
            old_index[name] = entry

    new_index = {}
    for entry in new_log:
        name = entry.get(name_col, '')
        if name:
            new_index[name] = entry

    old_names = set(old_index.keys())
    new_names = set(new_index.keys())

    added = [new_index[n] for n in new_names - old_names]
    removed = [old_index[n] for n in old_names - new_names]
    modified = []

    for n in old_names & new_names:
        if old_index[n] != new_index[n]:
            modified.append({
                'name': n,
                'old': old_index[n],
                'new': new_index[n]
            })

    return {
        'added': added,
        'modified': modified,
        'removed': removed,
        'unchanged': len(old_names & new_names) - len(modified),
        'stats': {
            'old_count': len(old_log),
            'new_count': len(new_log),
            'added': len(added),
            'modified': len(modified),
            'removed': len(removed)
        }
    }

def format_entry(entry, config, max_len=80):
    """格式化一条日志条目"""
    cols = config['updateLogColumns']
    name = str(entry.get(str(cols.get('name', 64)), ''))[:max_len]
    cat = str(entry.get(str(cols.get('category', 65)), ''))[:20]
    rank = str(entry.get(str(cols.get('rank', 66)), ''))[:10]
    change = str(entry.get(str(cols.get('changeType', 68)), ''))[:10]
    date = str(entry.get(str(cols.get('date', 70)), ''))[:12]
    return f"  [{date}] {change:6s} | {rank:6s} | {cat:12s} | {name}"

def main():
    if len(sys.argv) < 2:
        print("Usage: py -3.11 tools/diff_updates.py <表名> [--apply]")
        print("  表名: 曙光表 或 无限口述规则")
        return

    sheet_name = sys.argv[1]
    do_apply = '--apply' in sys.argv

    config = load_config()
    if sheet_name not in config['sheets']:
        print(f"未知表格: {sheet_name}")
        print(f"可用: {list(config['sheets'].keys())}")
        return

    sheet_config = config['sheets'][sheet_name]
    new_log_path = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else None

    if new_log_path and os.path.exists(new_log_path):
        with open(new_log_path, 'r', encoding='utf-8') as f:
            new_log = json.load(f)
    else:
        print("需要提供云端更新的日志 JSON 文件路径")
        print("请先用爬取工具获取最新的更新日志数据")
        return

    old_log = load_local_log(sheet_name)

    diff = diff_logs(old_log, new_log, sheet_config)
    stats = diff['stats']

    print(f"\n{'='*60}")
    print(f"更新差异报告: {sheet_name}")
    print(f"{'='*60}")
    print(f"本地条目: {stats['old_count']}")
    print(f"云端条目: {stats['new_count']}")
    print(f"新增: {stats['added']}  修改: {stats['modified']}  删除: {stats['removed']}  未变: {diff['unchanged']}")
    print()

    if diff['added']:
        print(f"--- 新增 ({len(diff['added'])}) ---")
        for entry in diff['added'][:20]:
            print(format_entry(entry, sheet_config))
        if len(diff['added']) > 20:
            print(f"  ... 还有 {len(diff['added']) - 20} 条")

    if diff['modified']:
        print(f"\n--- 修改 ({len(diff['modified'])}) ---")
        for entry in diff['modified'][:10]:
            print(f"  {entry['name']}")
            print(f"    旧: {format_entry(entry['old'], sheet_config)}")
            print(f"    新: {format_entry(entry['new'], sheet_config)}")

    if diff['removed']:
        print(f"\n--- 删除 ({len(diff['removed'])}) ---")
        for entry in diff['removed'][:10]:
            print(format_entry(entry, sheet_config))

    if do_apply:
        save_local_log(sheet_name, new_log)
        print(f"\n✓ 本地缓存已更新")
        print(f"  新增条目将标记为待处理")

        # Save the diff for apply_updates.py
        diff_path = os.path.join(UPDATES_DIR, f'{sheet_name}_pending_diff.json')
        with open(diff_path, 'w', encoding='utf-8') as f:
            json.dump({
                'sheet_name': sheet_name,
                'diff': {
                    'added': diff['added'],
                    'modified': diff['modified'],
                    'removed': diff['removed']
                },
                'timestamp': datetime.now().isoformat()
            }, f, ensure_ascii=False, indent=2)
        print(f"  待处理差异已保存到: {diff_path}")

if __name__ == '__main__':
    main()
