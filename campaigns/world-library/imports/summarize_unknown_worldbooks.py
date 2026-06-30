import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UNKNOWN = ROOT / "worldviews" / "unknown-review" / "worldbooks"
OUT = ROOT / "reports" / "unknown-worldbook-snippets.md"


def compact(text, limit=180):
    text = str(text or '').replace('\r', ' ').replace('\n', ' ')
    return text[:limit]

lines = ["# Unknown Worldbook Snippets", ""]
for path in sorted(UNKNOWN.glob("*.worldbook.json")):
    obj = json.loads(path.read_text(encoding="utf-8"))
    lines.append(f"## {path.name}")
    lines.append(f"- title: {obj.get('title','')}")
    lines.append(f"- sourceKind: {obj.get('sourceKind','')}")
    lines.append(f"- entries: {len(obj.get('entries', []))}")
    lines.append("")
    for entry in obj.get('entries', [])[:8]:
        keys = entry.get('keys', [])
        if not isinstance(keys, list):
            keys = [keys]
        lines.append(f"- comment: {compact(entry.get('comment',''), 100)}")
        lines.append(f"  keys: {compact(', '.join(map(str, keys[:8])), 100)}")
        lines.append(f"  content: {compact(entry.get('content',''), 220)}")
    lines.append("")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(OUT)
