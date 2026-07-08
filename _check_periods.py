import json
with open('E:/pi-st/campaigns/world-library/manual-curation/hidan-p1-output/characters/kinji.json') as f:
    d = json.load(f)
periods = d.get('periods', [])
print('Total periods:', len(periods))
for p in periods:
    pid = p.get('period_id', '?')
    label = p.get('label', '')[:60]
    print(' ', pid, ':', label)
print()
rev = d.get('_revisions', [])
print('Revisions:', len(rev))
for r in rev:
    print(json.dumps(r, ensure_ascii=False, indent=2)[:500])
