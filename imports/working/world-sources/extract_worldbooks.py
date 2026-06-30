import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANDIDATES = ROOT / "worldbook-candidates"
OUT = ROOT / "worldbooks-extracted"
REPORT = ROOT / "reports" / "worldbook-extraction-report.json"
OUT.mkdir(parents=True, exist_ok=True)
REPORT.parent.mkdir(parents=True, exist_ok=True)


def safe_name(name: str) -> str:
    forbidden = '<>:"/\\|?*\n\r\t'
    out = ''.join('_' if c in forbidden else c for c in name).strip()
    return out[:160] or 'unnamed'


def get_card_data(obj):
    return obj.get('data', obj) if isinstance(obj, dict) else {}


def extract_entries(obj):
    if not isinstance(obj, dict):
        return [], 'unknown'
    data = get_card_data(obj)
    if isinstance(data, dict) and isinstance(data.get('character_book'), dict):
        entries = data.get('character_book', {}).get('entries', [])
        if isinstance(entries, list):
            return entries, 'character-card-character_book'
        if isinstance(entries, dict):
            return [entries[key] for key in sorted(entries.keys(), key=lambda k: int(k) if str(k).isdigit() else str(k))], 'character-card-character_book-object-entries'
    if isinstance(obj.get('entries'), list):
        return obj['entries'], 'worldbook-top-level-entries'
    if isinstance(obj.get('entries'), dict):
        entries = obj['entries']
        return [entries[key] for key in sorted(entries.keys(), key=lambda k: int(k) if str(k).isdigit() else str(k))], 'worldbook-top-level-object-entries'
    if isinstance(data, dict) and isinstance(data.get('entries'), list):
        return data['entries'], 'worldbook-data-entries'
    if isinstance(data, dict) and isinstance(data.get('entries'), dict):
        entries = data['entries']
        return [entries[key] for key in sorted(entries.keys(), key=lambda k: int(k) if str(k).isdigit() else str(k))], 'worldbook-data-object-entries'
    return [], 'no-worldbook-entries'


def normalize_entry(entry, index):
    if not isinstance(entry, dict):
        return {
            'index': index,
            'enabled': True,
            'keys': [],
            'secondaryKeys': [],
            'comment': '',
            'content': str(entry),
            'constant': False,
            'selective': False,
            'position': None,
            'extensions': {},
            'raw': entry,
        }
    return {
        'index': index,
        'enabled': entry.get('enabled', True),
        'keys': entry.get('keys', []) or entry.get('key', []) or [],
        'secondaryKeys': entry.get('secondary_keys', []) or entry.get('secondaryKeys', []) or [],
        'comment': entry.get('comment', '') or entry.get('name', '') or '',
        'content': entry.get('content', '') or '',
        'constant': entry.get('constant', False),
        'selective': entry.get('selective', False),
        'position': entry.get('position'),
        'extensions': entry.get('extensions', {}) or {},
        'raw': entry,
    }


report = []
for path in sorted(CANDIDATES.glob('*.json')):
    item = {
        'sourceFile': path.name,
        'status': 'unknown',
        'kind': None,
        'entryCount': 0,
        'output': None,
        'notes': [],
    }
    try:
        obj = json.loads(path.read_text(encoding='utf-8'))
        entries, kind = extract_entries(obj)
        item['kind'] = kind
        item['entryCount'] = len(entries)
        if entries:
            data = get_card_data(obj)
            title = data.get('name') or obj.get('name') or path.stem
            out_obj = {
                'schema': 'rp-imported-worldbook-v1',
                'sourceFile': str(path.relative_to(ROOT)).replace('\\', '/'),
                'sourceKind': kind,
                'title': title,
                'onlyWorldRelatedExtraction': True,
                'notes': '角色卡来源仅抽取 character_book.entries；不保留角色人设正文。',
                'entries': [normalize_entry(entry, idx) for idx, entry in enumerate(entries)],
            }
            out_path = OUT / f"{safe_name(path.stem)}.worldbook.json"
            out_path.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2), encoding='utf-8')
            item['status'] = 'extracted'
            item['output'] = str(out_path.relative_to(ROOT)).replace('\\', '/')
        else:
            item['status'] = 'no-worldbook-entries'
    except Exception as exc:
        item['status'] = 'error'
        item['notes'].append(f'{type(exc).__name__}: {exc}')
    report.append(item)

REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({
    'total': len(report),
    'extractedFiles': sum(1 for item in report if item['status'] == 'extracted'),
    'totalEntries': sum(item['entryCount'] for item in report),
    'report': str(REPORT.relative_to(ROOT)).replace('\\', '/'),
}, ensure_ascii=False))
