"""
增量更新应用脚本 - 将云端变更合并到本地数据文件。

用法:
    py -3.11 tools/apply_updates.py <表名> [--dry-run]

功能:
    1. 读取待处理的差异文件 (pending_diff.json)
    2. 确定每个变更项所属的 sheet
    3. 对于新增/修改的条目：
       - 从云端获取完整数据（需要 Pi agent_browser 支持）
       - 合并到本地 JSON 数据文件
    4. 对于删除的条目：
       - 从本地 JSON 中移除对应条目
    5. 生成更新报告

依赖:
    - tools/config.json
    - tools/updates/<表名>_pending_diff.json
    - <表名>数据/ 目录下的本地 JSON 文件
"""

import json
import os
import sys
import shutil
from datetime import datetime
from collections import defaultdict

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')
UPDATES_DIR = os.path.join(os.path.dirname(__file__), 'updates')

def load_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_local_data(sheet_name, tab_name):
    """加载本地 sheet 数据"""
    config = load_config()
    data_dir = config['localDataDirs'].get(sheet_name, '')
    if not data_dir:
        return None

    # Match file by tab name
    for f in os.listdir(data_dir):
        if f.endswith('.json'):
            path = os.path.join(data_dir, f)
            try:
                with open(path, 'r', encoding='utf-8') as fh:
                    data = json.load(fh)
                if data.get('name') == tab_name:
                    return data
            except:
                pass
    return None

def save_local_data(sheet_name, data, backup=True):
    """保存本地 sheet 数据"""
    config = load_config()
    data_dir = config['localDataDirs'].get(sheet_name, '')
    if not data_dir:
        return False

    safe_name = data['name']
    path = os.path.join(data_dir, f'{sheet_name}_{safe_name}.json')

    # Backup
    if backup and os.path.exists(path):
        backup_dir = os.path.join(data_dir, '.backups')
        os.makedirs(backup_dir, exist_ok=True)
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join(backup_dir, f'{safe_name}_{ts}.json')
        shutil.copy2(path, backup_path)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return True

def categorize_changes(diff, sheet_config):
    """
    将变更按所属 sheet 分类。

    返回: {tab_name: [{change_type, entry, ...}]}
    """
    categorized = defaultdict(list)
    cols = sheet_config['updateLogColumns']
    cat_col = str(cols.get('category', 65))
    change_col = str(cols.get('changeType', 68))
    name_col = str(cols.get('name', 64))

    tab_name_map = {t['name']: t for t in sheet_config['tabs']}

    for entry in diff.get('added', []):
        cat = entry.get(cat_col, '')
        # Map category names to tab names
        for tab_name in tab_name_map:
            if tab_name in cat or cat in tab_name:
                categorized[tab_name].append({
                    'type': 'added',
                    'name': entry.get(name_col, ''),
                    'entry': entry
                })
                break
        else:
            categorized['__unknown__'].append({
                'type': 'added',
                'name': entry.get(name_col, ''),
                'entry': entry
            })

    for mod in diff.get('modified', []):
        entry = mod['new']
        cat = entry.get(cat_col, '')
        for tab_name in tab_name_map:
            if tab_name in cat or cat in tab_name:
                categorized[tab_name].append({
                    'type': 'modified',
                    'name': mod['name'],
                    'entry': entry,
                    'old': mod['old']
                })
                break

    for entry in diff.get('removed', []):
        cat = entry.get(cat_col, '')
        for tab_name in tab_name_map:
            if tab_name in cat or cat in tab_name:
                categorized[tab_name].append({
                    'type': 'removed',
                    'name': entry.get(name_col, ''),
                    'entry': entry
                })
                break

    return dict(categorized)

def apply_removals(tab_name, removals, sheet_name):
    """从本地数据中删除条目"""
    data = load_local_data(sheet_name, tab_name)
    if not data:
        return {'error': f'No local data for {tab_name}'}

    cells = data['cells']
    removed_count = 0

    for item in removals:
        name = item['name']
        # Find cells containing this name
        keys_to_remove = [k for k, v in cells.items() if name in v]
        for k in keys_to_remove:
            del cells[k]
            removed_count += 1

    if removed_count > 0:
        save_local_data(sheet_name, data)

    return {'removed': removed_count, 'tab': tab_name}

def get_update_instructions(diff, sheet_config, sheet_name):
    """
    生成需要从云端获取完整数据的操作指令。

    由于完整数据获取需要浏览器交互（Pi agent_browser），
    此函数生成指令列表，供 Pi 执行。
    """
    categorized = categorize_changes(diff, sheet_config)
    instructions = []

    for tab_name, changes in categorized.items():
        if tab_name == '__unknown__':
            continue

        tab_config = None
        for t in sheet_config['tabs']:
            if t['name'] == tab_name:
                tab_config = t
                break
        if not tab_config:
            continue

        # Skip non-exchange tabs for data updates
        if tab_config.get('category') not in ('exchange',):
            instructions.append({
                'tab': tab_name,
                'tabId': tab_config['id'],
                'type': 'meta',
                'note': f'元数据/参考表，需手动审阅 {len(changes)} 条变更',
                'changes': len(changes)
            })
            continue

        # For exchange tabs, need full cell data
        items_to_fetch = []
        for ch in changes:
            if ch['type'] != 'removed':
                items_to_fetch.append(ch['name'])

        if items_to_fetch:
            instructions.append({
                'tab': tab_name,
                'tabId': tab_config['id'],
                'type': 'fetch_and_merge',
                'items': items_to_fetch,
                'changes': len(changes)
            })

    return instructions

def main():
    if len(sys.argv) < 2:
        print("Usage: py -3.11 tools/apply_updates.py <表名> [--dry-run]")
        return

    sheet_name = sys.argv[1]
    dry_run = '--dry-run' in sys.argv

    config = load_config()
    if sheet_name not in config['sheets']:
        print(f"未知表格: {sheet_name}")
        return

    sheet_config = config['sheets'][sheet_name]

    # Load pending diff
    safe_name = sheet_name.replace(' ', '_')
    diff_path = os.path.join(UPDATES_DIR, f'{sheet_name}_pending_diff.json')
    if not os.path.exists(diff_path):
        print(f"没有待处理的差异文件: {diff_path}")
        print("请先运行 diff_updates.py --apply")
        return

    with open(diff_path, 'r', encoding='utf-8') as f:
        pending = json.load(f)

    diff = pending['diff']
    instructions = get_update_instructions(diff, sheet_config, sheet_name)

    print(f"\n{'='*60}")
    print(f"增量更新操作指令: {sheet_name}")
    print(f"时间: {pending.get('timestamp', 'unknown')}")
    print(f"{'='*60}\n")

    if dry_run:
        print("[DRY RUN] 不会实际修改文件\n")

    total_changes = 0
    for inst in instructions:
        tab = inst['tab']
        count = inst['changes']
        total_changes += count

        if inst['type'] == 'fetch_and_merge':
            items_str = ', '.join(inst['items'][:5])
            if len(inst['items']) > 5:
                items_str += f' ... 等{len(inst["items"])}项'
            print(f"📋 {tab} ({count} 条变更)")
            print(f"   需要获取完整数据: {items_str}")
            print(f"   操作: 打开 tab={inst['tabId']}，提取匹配条目，合并到本地文件")
        elif inst['type'] == 'meta':
            print(f"📝 {tab} ({count} 条变更) - {inst['note']}")
        print()

    # Handle removals
    removals = diff.get('removed', [])
    if removals:
        categorized = categorize_changes({'removed': removals}, sheet_config)
        for tab_name, changes in categorized.items():
            if tab_name != '__unknown__':
                if not dry_run:
                    result = apply_removals(tab_name, changes, sheet_name)
                    print(f"🗑 {tab_name}: 已删除 {result.get('removed', 0)} 个条目")
                else:
                    print(f"🗑 [DRY RUN] {tab_name}: 将删除 {len(changes)} 个条目")

    print(f"\n总计: {total_changes} 条变更需要处理")
    print(f"新增: {len(diff.get('added', []))}  修改: {len(diff.get('modified', []))}  删除: {len(diff.get('removed', []))}")
    print(f"\n请在 Pi 中执行上述操作指令完成数据同步。")

if __name__ == '__main__':
    main()
