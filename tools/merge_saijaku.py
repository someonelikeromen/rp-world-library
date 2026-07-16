# -*- coding: utf-8 -*-
"""Merge saijaku timeline artifacts into timeline.json"""
import json, os, re

DIRS = {'s1':'Bli9ms','s2':'AByHh1','s3':'4Z2VQO','s4':'H0LMnC','s5':'eptkO4'}
TMP = r'C:\Users\22134\AppData\Local\Temp'
all_nodes = []
seen = set()

def extract_events(obj):
    """Recursively find event-like objects in JSON"""
    results = []
    if isinstance(obj, list):
        for item in obj:
            results.extend(extract_events(item))
    elif isinstance(obj, dict):
        eid = obj.get('event_id') or obj.get('id')
        if eid and ('name' in obj or 'summary' in obj or 'type' in obj):
            results.append(obj)
        for v in obj.values():
            if isinstance(v, (dict, list)):
                results.extend(extract_events(v))
    return results

for label, d in DIRS.items():
    path = os.path.join(TMP, 'pi-multiagent-run-' + d, label + '-final.md')
    if not os.path.exists(path):
        print('MISS:', label)
        continue
    c = open(path, 'rb').read().decode('utf-8')
    blocks = re.findall(r'```json\n(.*?)```', c, re.DOTALL)
    for b in blocks:
        try:
            data = json.loads(b.strip())
        except:
            continue
        events = extract_events(data)
        count = 0
        for e in events:
            eid = e.get('event_id') or e.get('id', '')
            if eid and eid not in seen:
                seen.add(eid)
                all_nodes.append(e)
                count += 1
        if count: print('%s: +%d events (total %d unique)' % (label, count, len(all_nodes)))

merged = {
    '_schema': 'rp-timeline-v1',
    'world': 'saijaku-muhai-bahamut',
    'calendar': {'system': 'fantasy', 'anchor': 'vol-01 day 0'},
    '_meta': {'total_events': len(all_nodes)},
    'events': all_nodes
}
out = r'E:\pi-st\campaigns\world-library\worlds\saijaku-muhai-bahamut\extracted\timeline.json'
open(out, 'wb').write(json.dumps(merged, indent=2, ensure_ascii=False).encode('utf-8'))
print('saved: %d events -> %s' % (len(all_nodes), out))
