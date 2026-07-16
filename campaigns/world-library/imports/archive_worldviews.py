#!/usr/bin/env python3
"""Archive imported worldviews into structured RP world-library folders.

This script intentionally preserves full source entry content. Classification is
multi-label and heuristic: entries are copied into every matching category while
retaining source file, source id, entry index, raw keys/comment/content, and the
original entry object.
"""
from __future__ import annotations

import json
import re
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE = Path(__file__).resolve().parent
LIBRARY_ROOT = BASE.parent
PROJECT_ROOT = BASE.parents[2]
REPORT = BASE / "reports" / "worldview-grouping-report.json"
IMPORT_WORLDVIEWS = BASE / "worldviews"
ARCHIVE_ROOT = LIBRARY_ROOT / "worlds"
REPORTS_ROOT = LIBRARY_ROOT / "reports"

SCHEMA = "rp-world-archive-v1"
GENERATED_AT = datetime.now(timezone.utc).isoformat()

CATEGORY_FILES = {
    "rawText": "raw/original-entry-index.json",
    "world": "world/world.json",
    "characters": "characters/characters.json",
    "characterVoice": "characters/character-voice.json",
    "characterNsfw": "characters/character-nsfw.json",
    "factions": "factions/factions.json",
    "locations": "locations/locations.json",
    "powerSystems": "power-systems/power-systems.json",
    "abilities": "power-systems/abilities.json",
    "items": "assets/items.json",
    "species": "species/species.json",
    "canonFullPlot": "canon-reference/full-plot.json",
    "canonPlotSummary": "canon-reference/plot-summary.json",
    "canonTimeline": "canon-reference/timeline.json",
    "canonArcs": "canon-reference/arcs.json",
    "narrativeStyle": "style/narrative-style.json",
    "dialogueStyle": "style/dialogue-style.json",
    "interactionPatterns": "style/interaction-patterns.json",
    "aestheticKeywords": "style/aesthetic-keywords.json",
    "nsfwRules": "style/nsfw-rules.json",
    "scenarioSeeds": "sandbox/scenario-seeds.json",
    "randomEvents": "sandbox/random-events.json",
    "npcBehaviorRules": "sandbox/npc-behavior-rules.json",
    "timelineDivergenceRules": "sandbox/timeline-divergence-rules.json",
    "technical": "technical/technical-and-control-text.json",
    "unclassified": "reports/unclassified-entries.json",
}

CATEGORY_PATTERNS: dict[str, list[str]] = {
    "characters": [
        "character", "characters", "name:", "gender", "age", "race", "personality", "background",
        "appearance", "角色", "人物", "姓名", "性别", "年龄", "种族", "身份", "外貌", "性格", "背景", "履历",
        "主人公", "主角", "女主", "男主", "英灵", "Servant", "NPC", "profile", "biography",
    ],
    "characterVoice": [
        "speech_style", "speech_examples", "口癖", "语气", "台词", "说话", "称呼", "对话风格", "说话方式", "口吻",
        "dialogue", "voice", "verbal", "catchphrase",
    ],
    "characterNsfw": [
        "sexual_preferences", "性癖", "性爱", "性交", "色情", "成人", "NSFW", "nsfw", "性偏好", "敏感带", "调教", "性爱偏好",
        "erotic", "sex", "fetish", "身体开发", "高潮", "生殖", "乳", "阴", "肉棒", "子宫", "怀孕", "精液",
    ],
    "world": [
        "world", "setting", "overview", "history", "geography", "society", "世界", "世界观", "设定", "历史", "地理", "社会",
        "文明", "时代", "规则", "法则", "制度", "文化", "经济", "科技", "魔术世界", "人类史", "宇宙", "维度",
    ],
    "factions": [
        "faction", "organization", "guild", "army", "school", "family", "clan", "kingdom", "empire", "组织", "势力",
        "阵营", "国家", "王国", "帝国", "学院", "学校", "家族", "军队", "教会", "协会", "公会", "公司", "部门", "派阀",
    ],
    "locations": [
        "location", "place", "city", "region", "map", "地点", "地区", "城市", "国家", "村", "镇", "学院", "学校", "据点",
        "迷宫", "地下城", "地图", "街区", "神殿", "城堡", "战场", "领域", "异空间", "大陆", "岛", "星球",
    ],
    "powerSystems": [
        "power system", "magic system", "力量体系", "能力体系", "魔法", "魔术", "斗气", "查克拉", "灵力", "咒力", "念能力",
        "呼吸法", "圣痕", "崩坏能", "神之恩惠", "等级", "技能树", "资源", "修炼", "血统", "体系", "法术", "术式",
    ],
    "abilities": [
        "ability", "skill", "technique", "spell", "能力", "技能", "招式", "术", "宝具", "魔法", "必杀", "奥义", "固有", "异能",
        "权能", "神权", "咒术", "呼吸", "忍术", "血鬼术", "超能力", "武装", "攻击", "防御", "抗性", "弱点", "限制", "代价",
    ],
    "items": [
        "item", "weapon", "equipment", "artifact", "vehicle", "construct", "道具", "物品", "武器", "装备", "神器", "宝具", "遗物",
        "载具", "机体", "舰", "装甲", "药剂", "材料", "圣遗物", "装置", "终端", "卡片",
    ],
    "species": [
        "species", "race", "monster", "creature", "种族", "物种", "怪物", "魔物", "妖怪", "鬼", "神", "恶魔", "天使", "龙",
        "精灵", "兽人", "吸血鬼", "喰种", "使徒", "魔族", "人偶", "生物", "生态",
    ],
    "canonFullPlot": [
        "full plot", "完整剧情", "剧情全文", "全剧情", "原作剧情", "故事正文", "小说正文", "章节正文", "卷", "章", "episode", "剧情线",
    ],
    "canonPlotSummary": [
        "summary", "synopsis", "概述", "概要", "剧情简介", "剧情概括", "故事梗概", "简介", "大纲", "摘要",
    ],
    "canonTimeline": [
        "timeline", "chronology", "时间线", "时间轴", "年表", "历史年表", "事件顺序", "原作进度", "卷序", "篇章顺序",
    ],
    "canonArcs": [
        "arc", "篇章", "章节", "事件篇", "路线", "主线", "支线", "序章", "终章", "章", "幕间",
    ],
    "narrativeStyle": [
        "writing style", "narrative", "文风", "叙事", "描写", "镜头", "氛围", "节奏", "笔触", "风格", "修辞", "文学",
    ],
    "dialogueStyle": [
        "dialogue style", "dialogue", "对话", "台词", "语气", "口吻", "说话风格", "称呼", "敬语", "语癖",
    ],
    "interactionPatterns": [
        "interaction", "互动", "关系推进", "好感", "反应", "行为模式", "互动模式", "行为准则", "相处", "触发", "回应",
    ],
    "aestheticKeywords": [
        "aesthetic", "关键词", "审美", "意象", "色彩", "服饰", "气质", "画面", "视觉", "主题词", "tag", "tags",
    ],
    "nsfwRules": [
        "NSFW", "nsfw", "R18", "成人", "色情", "性", "性爱", "性交", "调教", "凌辱", "快感", "敏感", "性器", "肉体",
        "乳", "阴", "精液", "高潮", "怀孕", "服从", "SM", "fetish", "sexual", "erotic",
    ],
    "scenarioSeeds": [
        "scenario", "quest", "mission", "事件种子", "剧情种子", "任务", "委托", "遭遇", "冲突", "危机", "事件", "导入", "钩子",
    ],
    "randomEvents": [
        "random", "随机", "随机事件", "遭遇表", "事件表", "roll", "骰", "概率", "触发表",
    ],
    "npcBehaviorRules": [
        "npc", "NPC", "行为", "反应", "行动逻辑", "人物行动", "社会反应", "敌人行动", "AI", "行为规则",
    ],
    "timelineDivergenceRules": [
        "divergence", "if", "偏离", "分歧", "蝴蝶效应", "改写", "改变剧情", "时间线变动", "if线", "路线分歧",
    ],
    "technical": [
        "{{", "}}", "<START>", "<BOT>", "<USER>", "system prompt", "状态栏", "变量", "宏", "SillyTavern", "酒馆", "token", "回复格式",
        "禁止代替用户", "不要替用户", "OOC", "作者注", "正则", "脚本", "format", "prompt", "jailbreak",
    ],
}

PRIMARY_FACT_CATEGORIES = {
    "world", "characters", "factions", "locations", "powerSystems", "abilities", "items", "species",
    "canonFullPlot", "canonPlotSummary", "canonTimeline", "canonArcs",
}


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, data: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_md(path: Path, text: str) -> None:
    ensure_parent(path)
    path.write_text(text, encoding="utf-8")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def slug_source_id(world_slug: str, source_number: int) -> str:
    return f"src-{world_slug}-{source_number:03d}"


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)


def entry_text(entry: dict[str, Any]) -> str:
    parts = []
    for key in ("comment", "content", "keys", "secondaryKeys"):
        if key in entry:
            parts.append(normalize_text(entry.get(key)))
    return "\n".join(parts)


def match_categories(text: str) -> list[str]:
    lowered = text.lower()
    matched = []
    for category, patterns in CATEGORY_PATTERNS.items():
        for pattern in patterns:
            if pattern.lower() in lowered:
                matched.append(category)
                break
    if not matched:
        matched.append("unclassified")
    return matched


def classify_reliability(categories: list[str], source_kind: str) -> str:
    if "technical" in categories and len(categories) == 1:
        return "E"
    if source_kind == "worldbook":
        return "B"
    if source_kind.startswith("character-card"):
        return "B"
    return "C"


def source_type(source_kind: str) -> str:
    if source_kind == "worldbook":
        return "user-file-source"
    if source_kind.startswith("character-card"):
        return "user-file-source"
    return "user-file-source"


def make_entry_record(world_slug: str, source_id: str, source_file: str, worldbook_file: str, source_kind: str, entry: dict[str, Any], categories: list[str]) -> dict[str, Any]:
    idx = entry.get("index")
    text = entry_text(entry)
    return {
        "worldSlug": world_slug,
        "sourceId": source_id,
        "sourceKind": source_kind,
        "sourceFile": source_file,
        "worldbookFile": worldbook_file,
        "entryIndex": idx,
        "enabled": entry.get("enabled"),
        "keys": entry.get("keys", []),
        "secondaryKeys": entry.get("secondaryKeys", []),
        "comment": entry.get("comment", ""),
        "content": entry.get("content", ""),
        "categories": categories,
        "confidence": classify_reliability(categories, source_kind),
        "preservation": "full-entry-content-preserved",
        "raw": entry,
    }


def category_document(world_slug: str, display_name: str, category: str, records: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schema": SCHEMA,
        "worldSlug": world_slug,
        "displayName": display_name,
        "category": category,
        "generatedAt": GENERATED_AT,
        "entryCount": len(records),
        "preservationPolicy": "No summarization or compression: each item preserves full original entry content plus source metadata.",
        "items": records,
    }


def source_registry(world_slug: str, display_name: str, files: list[dict[str, Any]], source_id_by_file: dict[str, str]) -> dict[str, Any]:
    sources = []
    for file_meta in files:
        file_name = file_meta["file"]
        source_id = source_id_by_file[file_name]
        raw_source = file_meta.get("rawSourceFile", "")
        sources.append({
            "sourceId": source_id,
            "type": source_type(file_meta.get("sourceKind", "")),
            "title": file_meta.get("title") or file_name.replace(".worldbook.json", ""),
            "origin": "用户提供世界书/角色卡世界书导入",
            "location": f"imports/raw/world-sources/{raw_source}" if raw_source else file_meta.get("sourceFile", ""),
            "reliability": "B",
            "visibility": "public",
            "summary": "Imported source preserved in full; classification files keep complete entry content and source entry indexes.",
            "quotedOrExtractedText": "See raw/original-entry-index.json and category files for full preserved entries.",
            "capture": {
                "method": "manual / extraction-script",
                "capturedAt": GENERATED_AT,
                "url": "",
                "filePath": f"imports/raw/world-sources/{raw_source}" if raw_source else "",
                "pageRange": "",
                "imageRegion": "",
                "parserOrTool": "imports/working/world-sources/extract_worldbooks.py + campaigns/world-library/imports/archive_worldviews.py",
                "artifactPath": f"campaigns/world-library/imports/worldviews/{world_slug}/worldbooks/{file_name}",
            },
            "userCorrection": {
                "isCorrection": False,
                "correctedBy": "user",
                "replacesSourceIds": [],
                "correctionText": "",
                "priority": "high",
            },
            "appliesTo": [{
                "targetType": "world",
                "targetId": world_slug,
                "field": "world-source",
            }],
            "conflictsWith": [],
            "notes": f"Belongs to {display_name}. Raw source modified at {file_meta.get('rawModifiedAt', '')}.",
        })
    return {
        "schema": "rp-source-registry-v1",
        "campaignId": "world-library",
        "worldSlug": world_slug,
        "displayName": display_name,
        "sources": sources,
        "conflictLog": [],
    }


def manifest(world: dict[str, Any], category_counts: dict[str, int], source_id_by_file: dict[str, str]) -> dict[str, Any]:
    return {
        "schema": SCHEMA,
        "worldSlug": world["slug"],
        "displayName": world["name"],
        "generatedAt": GENERATED_AT,
        "sourcePolicy": {
            "cutoffDateInclusive": load_json(REPORT).get("cutoffDateInclusive"),
            "preserveFullContent": True,
            "summarizationPolicy": "Do not compress source entry content during archive. Summaries may be added later as separate derived views.",
            "conflictPolicy": "Multi-source consensus becomes primary. Conflicts prefer internal/common canon alignment as primary; alternatives remain as lower-confidence optional variants.",
            "nsfwPolicy": "Preserve NSFW content in style/nsfw-rules.json and related character/sandbox categories with source traceability.",
        },
        "sourceFiles": [
            {
                "sourceId": source_id_by_file[f["file"]],
                "worldbookFile": f["file"],
                "rawSourceFile": f.get("rawSourceFile", ""),
                "sourceKind": f.get("sourceKind", ""),
                "entryCount": f.get("entryCount", 0),
                "title": f.get("title", ""),
            }
            for f in world.get("files", [])
        ],
        "categoryCounts": category_counts,
        "paths": CATEGORY_FILES,
    }


def copy_worldbooks(world_slug: str, files: list[dict[str, Any]], dest: Path) -> None:
    raw_dest = dest / "raw" / "imported-worldbooks"
    raw_dest.mkdir(parents=True, exist_ok=True)
    for file_meta in files:
        src = IMPORT_WORLDVIEWS / world_slug / "worldbooks" / file_meta["file"]
        if src.exists():
            shutil.copy2(src, raw_dest / file_meta["file"])


def archive_world(world: dict[str, Any]) -> dict[str, Any]:
    world_slug = world["slug"]
    display_name = world["name"]
    dest = ARCHIVE_ROOT / world_slug
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True, exist_ok=True)

    files = world.get("files", [])
    source_id_by_file = {file_meta["file"]: slug_source_id(world_slug, i + 1) for i, file_meta in enumerate(files)}
    copy_worldbooks(world_slug, files, dest)

    by_category: dict[str, list[dict[str, Any]]] = defaultdict(list)
    all_records: list[dict[str, Any]] = []

    for file_meta in files:
        worldbook_file = file_meta["file"]
        source_id = source_id_by_file[worldbook_file]
        source_path = IMPORT_WORLDVIEWS / world_slug / "worldbooks" / worldbook_file
        data = load_json(source_path)
        entries = data.get("entries", []) if isinstance(data, dict) else data
        source_kind = file_meta.get("sourceKind", data.get("sourceKind", "") if isinstance(data, dict) else "")
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            text = entry_text(entry)
            categories = match_categories(text)
            record = make_entry_record(
                world_slug=world_slug,
                source_id=source_id,
                source_file=file_meta.get("rawSourceFile", file_meta.get("sourceFile", "")),
                worldbook_file=worldbook_file,
                source_kind=source_kind,
                entry=entry,
                categories=categories,
            )
            all_records.append(record)
            by_category["rawText"].append(record)
            for category in categories:
                by_category[category].append(record)

    for category, rel_path in CATEGORY_FILES.items():
        records = by_category.get(category, [])
        write_json(dest / rel_path, category_document(world_slug, display_name, category, records))

    category_counts = {category: len(by_category.get(category, [])) for category in CATEGORY_FILES}
    write_json(dest / "manifest.json", manifest(world, category_counts, source_id_by_file))
    write_json(dest / "source-registry.json", source_registry(world_slug, display_name, files, source_id_by_file))
    write_json(dest / "graphs" / "knowledge-graph.json", {
        "schema": "rp-knowledge-graph-v1",
        "worldSlug": world_slug,
        "displayName": display_name,
        "generatedAt": GENERATED_AT,
        "nodes": [],
        "edges": [],
        "notes": "Placeholder graph shell. Populate from classified category files in a later semantic extraction pass.",
    })
    write_json(dest / "graphs" / "relationship-graph.json", {
        "schema": "rp-relationship-graph-v1",
        "worldSlug": world_slug,
        "displayName": display_name,
        "generatedAt": GENERATED_AT,
        "nodes": [],
        "edges": [],
        "notes": "Placeholder graph shell. Populate from characters/factions/locations in a later semantic extraction pass.",
    })

    lines = [
        f"# {display_name} 分类归档报告",
        "",
        f"- worldSlug: `{world_slug}`",
        f"- source files: `{len(files)}`",
        f"- preserved entries: `{len(all_records)}`",
        "- preservation: full entry content preserved in category JSON files; no summarization/compression performed.",
        "",
        "## Category Counts",
        "",
    ]
    for category in sorted(category_counts):
        lines.append(f"- `{category}`: `{category_counts[category]}`")
    write_md(dest / "reports" / "classification-report.md", "\n".join(lines) + "\n")
    write_md(dest / "reports" / "conflicts.md", f"# {display_name} 冲突记录\n\n当前自动归档阶段不删除冲突项。多源冲突需在后续语义审校中按主设定/可选变体规则处理。\n")
    write_md(dest / "reports" / "low-confidence.md", f"# {display_name} 低置信度记录\n\n详见 `reports/unclassified-entries.json`、`technical/technical-and-control-text.json` 和各分类 item 的 `confidence` 字段。\n")

    return {
        "worldSlug": world_slug,
        "displayName": display_name,
        "sourceFileCount": len(files),
        "entryCount": len(all_records),
        "categoryCounts": category_counts,
        "path": str(dest.relative_to(PROJECT_ROOT)),
    }


def main() -> None:
    report = load_json(REPORT)
    ARCHIVE_ROOT.mkdir(parents=True, exist_ok=True)
    REPORTS_ROOT.mkdir(parents=True, exist_ok=True)

    summaries = []
    for world in report.get("groups", []):
        summaries.append(archive_world(world))

    archive_report = {
        "schema": SCHEMA,
        "generatedAt": GENERATED_AT,
        "sourceReport": str(REPORT.relative_to(PROJECT_ROOT)),
        "worldCount": len(summaries),
        "totalSourceFiles": sum(w["sourceFileCount"] for w in summaries),
        "totalEntriesPreserved": sum(w["entryCount"] for w in summaries),
        "archiveRoot": str(ARCHIVE_ROOT.relative_to(PROJECT_ROOT)),
        "worlds": summaries,
    }
    write_json(REPORTS_ROOT / "world-archive-report.json", archive_report)

    md = [
        "# 世界库结构化归档总报告",
        "",
        f"- 生成时间：`{GENERATED_AT}`",
        f"- 世界数量：`{archive_report['worldCount']}`",
        f"- 源文件数量：`{archive_report['totalSourceFiles']}`",
        f"- 完整保留 entry 数：`{archive_report['totalEntriesPreserved']}`",
        f"- 归档根目录：`{archive_report['archiveRoot']}`",
        "- 策略：不压缩、不摘要替代原文；分类 JSON 内保留完整 entry content/raw。",
        "",
        "## Worlds",
        "",
    ]
    for summary in summaries:
        md.append(f"- `{summary['worldSlug']}`：{summary['displayName']}；sources `{summary['sourceFileCount']}`；entries `{summary['entryCount']}`；path `{summary['path']}`")
    write_md(REPORTS_ROOT / "world-archive-report.md", "\n".join(md) + "\n")

    print(json.dumps({
        "worldCount": archive_report["worldCount"],
        "totalSourceFiles": archive_report["totalSourceFiles"],
        "totalEntriesPreserved": archive_report["totalEntriesPreserved"],
        "archiveRoot": archive_report["archiveRoot"],
        "report": "campaigns/world-library/reports/world-archive-report.json",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
