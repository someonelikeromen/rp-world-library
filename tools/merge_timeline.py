# -*- coding: utf-8 -*-
import json, os
BASE = r'E:\pi-st\campaigns\world-library\worlds\hidan-no-aria\extracted'
TMP = r'C:\Users\22134\AppData\Local\Temp'
events = []; seen = set()
for fn in ['timeline-pilot.json','timeline-v3.json','timeline-v4.json','timeline-v5.json','timeline-v6.json']:
    p = os.path.join(BASE, fn)
    if os.path.exists(p):
        with open(p, 'rb') as f: data = json.loads(f.read().decode('utf-8'))
        for e in data.get('events',[]):
            eid = e.get('event_id','')
            if eid and eid not in seen: seen.add(eid); events.append(e)
for p,label in [
    (os.path.join(TMP,'pi-multiagent-run-NQRK3Z','v7-final.md'),'v7'),
    (os.path.join(TMP,'pi-multiagent-run-qbKKDZ','v8-final.md'),'v8'),
    (os.path.join(TMP,'pi-multiagent-run-xjD9sl','v9-final.md'),'v9')]:
    if os.path.exists(p):
        with open(p,'rb') as f: c = f.read().decode('utf-8')
        s = c.index('```json\n'); e_pos = c.index('\n```', s)
        data = json.loads(c[s+8:e_pos].strip())
        for e in data.get('events',[]):
            eid = e.get('event_id','')
            if eid and eid not in seen: seen.add(eid); events.append(e)
events.sort(key=lambda e: e['time_span']['start'])
out = {'_schema':'rp-timeline-v1','world':'hidan-no-aria','calendar':{'system': '\u516c\u5386','anchor':'2009-04 ~ 2010-12','confidence':'high'},'events':events,'_meta':{'total_events':len(events)}}
with open(os.path.join(BASE,'timeline.json'),'wb') as f:
    f.write(json.dumps(out,indent=2,ensure_ascii=False).encode('utf-8'))
print('%d events saved' % len(events))
