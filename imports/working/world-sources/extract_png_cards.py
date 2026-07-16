import base64
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMAGES = ROOT / "images"
OUT = ROOT / "png-extracted-json"
REPORT = ROOT / "reports" / "png-extraction-report.json"
OUT.mkdir(parents=True, exist_ok=True)
REPORT.parent.mkdir(parents=True, exist_ok=True)


def extract_png_card(path: Path):
    data = path.read_bytes()
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return None, "not-png"

    pos = 8
    while pos < len(data):
        if pos + 8 > len(data):
            return None, "truncated"
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk_type = data[pos + 4:pos + 8].decode("ascii", errors="replace")
        chunk_data = data[pos + 8:pos + 8 + length]
        if chunk_type == "tEXt":
            null_pos = chunk_data.find(b"\x00")
            if null_pos >= 0:
                keyword = chunk_data[:null_pos].decode("latin-1", errors="replace")
                text = chunk_data[null_pos + 1:]
                if keyword == "chara":
                    try:
                        return json.loads(base64.b64decode(text)), "ok"
                    except Exception as exc:
                        return None, f"decode-error:{type(exc).__name__}:{exc}"
        if chunk_type == "IEND":
            break
        pos += 12 + length
    return None, "no-chara-chunk"


report = []
for path in sorted(IMAGES.glob("*.png")):
    payload, status = extract_png_card(path)
    item = {
        "image": str(path.relative_to(ROOT)).replace("\\", "/"),
        "status": status,
        "output": None,
    }
    if payload is not None:
        out_path = OUT / f"{path.stem}_card.json"
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        item["output"] = str(out_path.relative_to(ROOT)).replace("\\", "/")
    report.append(item)

REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({
    "total": len(report),
    "extracted": sum(1 for item in report if item["status"] == "ok"),
    "report": str(REPORT.relative_to(ROOT)).replace("\\", "/"),
}, ensure_ascii=False))
