import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANDIDATES = ROOT / "worldbook-candidates"
REPORT = ROOT / "reports" / "json-shape-report.json"

shape_counts = Counter()
files = []
keys_counter = Counter()
worldbook_like = []
card_like = []

for path in sorted(CANDIDATES.glob("*.json")):
    item = {"file": path.name, "valid": False, "topLevelType": None, "topLevelKeys": [], "detected": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        item["valid"] = True
        item["topLevelType"] = type(data).__name__
        if isinstance(data, dict):
            keys = sorted(data.keys())
            item["topLevelKeys"] = keys
            for key in keys:
                keys_counter[key] += 1
            if "character_book" in data or "data" in data and isinstance(data.get("data"), dict) and "character_book" in data["data"]:
                item["detected"].append("character-card-with-character-book")
                card_like.append(path.name)
            if "entries" in data or "entries" in data.get("data", {}) if isinstance(data.get("data"), dict) else False:
                item["detected"].append("worldbook-like-entries")
                worldbook_like.append(path.name)
            if "name" in data and any(k in data for k in ["description", "personality", "scenario", "first_mes"]):
                item["detected"].append("character-card-like")
                card_like.append(path.name)
        elif isinstance(data, list):
            item["detected"].append("list-json")
        shape_counts[item["topLevelType"]] += 1
    except Exception as exc:
        item["error"] = f"{type(exc).__name__}: {exc}"
    files.append(item)

REPORT.write_text(json.dumps({
    "total": len(files),
    "valid": sum(1 for f in files if f["valid"]),
    "shapeCounts": dict(shape_counts),
    "topKeysMostCommon": keys_counter.most_common(80),
    "worldbookLikeCount": len(set(worldbook_like)),
    "cardLikeCount": len(set(card_like)),
    "files": files,
}, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({
    "total": len(files),
    "valid": sum(1 for f in files if f["valid"]),
    "worldbookLikeCount": len(set(worldbook_like)),
    "cardLikeCount": len(set(card_like)),
    "report": str(REPORT.relative_to(ROOT)).replace("\\", "/"),
}, ensure_ascii=False))
