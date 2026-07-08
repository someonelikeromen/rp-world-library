import json, glob, os, sys
print('Python version:', sys.version)
base = 'E:/pi-st/campaigns/world-library/manual-curation/hidan-p1-output/characters'
files = sorted(glob.glob(os.path.join(base, '*.json')))
print('Scanning {} character files...\n'.format(len(files)))
has_summary = []
no_summary = []
for f in files:
    name = os.path.basename(f)
    with open(f) as fh:
        try:
            d = json.load(fh)
        except Exception as e:
            print('  SKIP (parse error): {} - {}'.format(name, str(e)[:50]))
            continue
    periods = d.get('periods', [])
    found = False
    for p in periods:
        if p.get('period_id') == 'pre-vol-25-summary':
            label = p.get('label', '')[:80]
            has_summary.append((name, label))
            found = True
            break
    if not found:
        # check if any period covers vol-01
        vol_ids = [p.get('period_id', '') for p in periods]
        vols_str = ', '.join(vol_ids[:8])
        no_summary.append((name, vols_str if vols_str else 'no periods'))

print('=== HAS pre-vol-25-summary ({} files) ==='.format(len(has_summary)))
for name, label in sorted(has_summary):
    print('  {}'.format(name))
    print('    label: {}'.format(label))

print('\n=== NO summary ({} files) ==='.format(len(no_summary)))
for name, note in sorted(no_summary):
    print('  {}: {}'.format(name, note[:120]))
