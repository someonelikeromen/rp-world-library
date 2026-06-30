import json
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PENDING = ROOT / "worldbooks-pending"
RAW_SOURCES = ROOT.parents[2] / "imports" / "raw" / "world-sources"
OUT = ROOT / "worldviews"
REPORT = ROOT / "reports" / "worldview-grouping-report.json"
CUTOFF_DATE = datetime(2026, 6, 20)
OUT.mkdir(parents=True, exist_ok=True)
REPORT.parent.mkdir(parents=True, exist_ok=True)

GROUPS = {
    "type-moon-nasuverse": {
        "name": "型月 / Fate / FGO / 魔法少女伊莉雅",
        "patterns": ["Fate stay night", "FateStayNight", "fatezero", "FGO", "型月", "魔法少女伊莉雅", "妖精国历"],
    },
    "infinite-stratos": {
        "name": "IS / Infinite Stratos / 无限斯特拉托斯",
        "patterns": ["IS.worldbook", "IS_card", "Infinite_StratosIS", "无限斯特托拉斯"],
    },
    "honkai-impact-3rd": {
        "name": "崩坏 / 崩坏三",
        "patterns": ["崩坏", "bh3_card", "d4d7a89359ee3f54_card"],
    },
    "danmachi": {
        "name": "地错 / 在地下城寻求邂逅是否搞错了什么",
        "patterns": ["在地下城寻求邂逅", "地错", "地下城.worldbook", "dxcxh_card", "ac9c870ec7b12a40_card"],
    },
    "high-school-dxd": {
        "name": "恶魔高校 DxD",
        "patterns": ["恶魔高校", "dxd_card"],
    },
    "tokyo-ghoul": {
        "name": "东京喰种",
        "patterns": ["东京喰种"],
    },
    "naruto": {
        "name": "火影忍者",
        "patterns": ["火影", "hy_card"],
    },
    "evangelion": {
        "name": "新世纪福音战士 / EVA",
        "patterns": ["新世纪福音战士", "eva_card"],
    },
    "dungeon-fighter-online": {
        "name": "地下城与勇士 / 阿拉德",
        "patterns": ["地下城与勇士", "阿拉德"],
    },
    "sora-no-otoshimono": {
        "name": "天降之物",
        "patterns": ["天降之物", "tjzw_card"],
    },
    "kill-la-kill": {
        "name": "斩服少女 / Kill la Kill",
        "patterns": ["斩服少女"],
    },
    "akame-ga-kill": {
        "name": "斩！赤红之瞳",
        "patterns": ["斩！赤红之瞳"],
    },
    "monster-hunter": {
        "name": "怪物猎人",
        "patterns": ["怪物猎人"],
    },
    "taimanin": {
        "name": "对魔忍",
        "patterns": ["对魔忍"],
    },
    "chunibyo": {
        "name": "中二病也想谈恋爱",
        "patterns": ["中二病也想谈恋爱"],
    },
    "overlord": {
        "name": "OVERLORD",
        "patterns": ["OVERLORD"],
    },
    "gundam-seed": {
        "name": "高达 SEED",
        "patterns": ["SEED"],
    },
    "jojo": {
        "name": "JOJO",
        "patterns": ["JOJO"],
    },
    "bocchi-the-rock": {
        "name": "孤独摇滚",
        "patterns": ["孤独摇滚"],
    },
    "majo-no-tabitabi": {
        "name": "魔女之旅",
        "patterns": ["魔女之旅"],
    },
    "sword-art-online": {
        "name": "刀剑神域 SAO",
        "patterns": ["刀剑神域", "SAO"],
    },
    "xianjian-1": {
        "name": "仙剑奇侠传Ⅰ",
        "patterns": ["仙剑奇侠传"],
    },
    "heavens-lost-property": {
        "name": "天降之物",
        "patterns": ["天降之物2"],
    },
    "cheng-long-adventures": {
        "name": "成龙历险记",
        "patterns": ["成龙历险记"],
    },
    "haganai": {
        "name": "我的朋友很少",
        "patterns": ["我的朋友很少"],
    },
    "hidan-no-aria": {
        "name": "绯弹的亚里亚",
        "patterns": ["緋彈的婭莉婭"],
    },
    "zero-no-tsukaima": {
        "name": "零之使魔",
        "patterns": ["零之使魔"],
    },
    "kimetsu-no-yaiba": {
        "name": "鬼灭之刃",
        "patterns": ["鬼灭之刃", "gmzr_card"],
    },
    "toaru": {
        "name": "魔法禁书目录 / 超炮相关",
        "patterns": ["魔法禁书目录"],
    },
    "blue-archive": {
        "name": "蔚蓝档案 / 基沃托斯",
        "patterns": ["鸡窝托斯"],
    },
    "pokemon": {
        "name": "宝可梦 / Pokémon",
        "patterns": ["--MVU_2_card"],
    },
    "armored-core": {
        "name": "装甲核心 / Armored Core",
        "patterns": ["--v1.5_card"],
    },
    "persona-5": {
        "name": "女神异闻录5 / Persona 5",
        "patterns": ["--女神5"],
    },
    "honkai-star-rail": {
        "name": "崩坏：星穹铁道",
        "patterns": ["7d138d4266f9cbbf_card"],
    },
    "to-love-ru": {
        "name": "出包王女 / To Love-Ru",
        "patterns": ["cbwn_card"],
    },
    "claymore": {
        "name": "大剑 / Claymore",
        "patterns": ["dj_card"],
    },
    "dantalian-no-shoka": {
        "name": "丹特丽安的书架",
        "patterns": ["dtla_card"],
    },
    "gate-jsdf": {
        "name": "GATE 奇幻自卫队",
        "patterns": ["gate_card"],
    },
    "kaguya-sama": {
        "name": "辉夜大小姐想让我告白",
        "patterns": ["hydxj_card"],
    },
    "absolute-duo": {
        "name": "绝对双刃 / Absolute Duo",
        "patterns": ["jdsr_card"],
    },
    "kekkaishi": {
        "name": "结界师",
        "patterns": ["jjs_card"],
    },
    "rakudai-kishi": {
        "name": "落第骑士英雄谭",
        "patterns": ["ldqs_card"],
    },
    "spice-and-wolf": {
        "name": "狼与辛香料",
        "patterns": ["lyxxl_card"],
    },
    "dragon-ball": {
        "name": "龙珠",
        "patterns": ["lz_card"],
    },
    "negima-uq-holder": {
        "name": "魔法老师 / UQ HOLDER",
        "patterns": ["mdls_card"],
    },
    "madan-no-ou": {
        "name": "魔弹之王与战姬",
        "patterns": ["mdzwyzj_card"],
    },
    "omamori-himari": {
        "name": "守护猫娘绯鞠",
        "patterns": ["mnfj_card"],
    },
    "toriko": {
        "name": "美食的俘虏 / Toriko",
        "patterns": ["msfl_card"],
    },
    "crossover-mecha-multiverse": {
        "name": "交错宙域 / 多作品机战融合世界",
        "patterns": ["MVU1.7.2_card"],
    },
    "sekirei": {
        "name": "鹡鸰女神 / Sekirei",
        "patterns": ["ns_card"],
    },
    "black-bullet": {
        "name": "黑色子弹",
        "patterns": ["qhzd_card"],
    },
    "d-gray-man": {
        "name": "驱魔少年 / D.Gray-man",
        "patterns": ["qmsn_card"],
    },
    "rozen-maiden": {
        "name": "蔷薇少女",
        "patterns": ["qwsn_card"],
    },
    "kenichi": {
        "name": "史上最强弟子兼一",
        "patterns": ["shzqdz_card"],
    },
    "senran-kagura": {
        "name": "闪乱神乐",
        "patterns": ["slsy_card"],
    },
    "campione": {
        "name": "弑神者 / Campione",
        "patterns": ["ssg_card"],
    },
    "strike-the-blood": {
        "name": "噬血狂袭",
        "patterns": ["sxkx_card"],
    },
    "cross-ange": {
        "name": "天使与龙的轮舞 / CROSS ANGE",
        "patterns": ["tsyldlw_card"],
    },
    "record-of-ragnarok": {
        "name": "终末的女武神",
        "patterns": ["vs_card"],
    },
    "elemental-gelade": {
        "name": "武器种族传说",
        "patterns": ["wqzjcs_card"],
    },
    "seikoku-no-dragonar": {
        "name": "星刻龙骑士",
        "patterns": ["xklqs_card"],
    },
    "testament-sister-new-devil": {
        "name": "新妹魔王的契约者",
        "patterns": ["xmmw_card"],
    },
    "date-a-live": {
        "name": "约会大作战 / DATE A LIVE",
        "patterns": ["yhdzz_card"],
    },
    "ikki-tousen": {
        "name": "一骑当千",
        "patterns": ["yqdq_card"],
    },
    "saijaku-muhai-bahamut": {
        "name": "最弱无败神装机龙",
        "patterns": ["zrwb_card"],
    },
    "world-god-only-knows": {
        "name": "只有神知道的世界",
        "patterns": ["zyszddsj_card"],
    },
    "original-adult-fairy-tale": {
        "name": "原创/改编成人童话世界观",
        "patterns": ["1 (1)_card"],
    },
    "original-adult-market": {
        "name": "原创成人市场世界观",
        "patterns": ["1 (2)_card"],
    },
    "original-ghost-world": {
        "name": "原创鬼怪世界观",
        "patterns": ["1 (3)_card"],
    },
    "original-authority-isekai": {
        "name": "原创常识篡改/言出法随异世界",
        "patterns": ["27edd5e67329c15e_card"],
    },
    "original-modern-order-site": {
        "name": "原创现代点单网站世界观",
        "patterns": ["d92eb61e1e01b1cc_card"],
    },
    "original-mod-framework": {
        "name": "MOD 框架/多原作改造集合",
        "patterns": ["MOD__card"],
    },
    "original-monster-girl-world": {
        "name": "原创魔物娘世界",
        "patterns": ["v0.4_card"],
    },
    "single-character-or-nonworld": {
        "name": "单角色/非世界书内容待处理",
        "patterns": ["1_card"],
    },
    "marvel-cinematic-universe": {
        "name": "漫威电影宇宙",
        "patterns": ["漫威电影宇宙"],
    },
    "fairy-britain": {
        "name": "妖精国历",
        "patterns": ["妖精国历"],
    },
    "acg-character-database": {
        "name": "ACG 角色心理/类脑数据库",
        "patterns": ["SSSR-类脑", "acg角色心理模型"],
    },
}

# merge accidental duplicate group key intent: keep sora-no-otoshimono and use heavens only if exact 天降之物2 matched first impossible here.
GROUP_ORDER = list(GROUPS.keys())
UNKNOWN = "unknown-review"
GROUPS[UNKNOWN] = {"name": "待人工确认 / 缩写或乱码未识别", "patterns": []}


def choose_group(filename: str) -> str:
    for slug in GROUP_ORDER:
        for pattern in GROUPS[slug]["patterns"]:
            if pattern in filename:
                return slug
    return UNKNOWN


def read_meta(path: Path):
    obj = json.loads(path.read_text(encoding="utf-8"))
    return {
        "file": path.name,
        "title": obj.get("title", ""),
        "sourceFile": obj.get("sourceFile", ""),
        "sourceKind": obj.get("sourceKind", ""),
        "entryCount": len(obj.get("entries", [])),
    }


def find_raw_source(meta: dict) -> Path | None:
    source_name = Path(meta["sourceFile"]).name
    source_stem = Path(source_name).stem
    stems = [source_stem]
    if source_stem.endswith("_card"):
        stems.append(source_stem[:-5])
    for stem in stems:
        for suffix in (".png", ".json"):
            candidate = RAW_SOURCES / f"{stem}{suffix}"
            if candidate.exists():
                return candidate
    return None


def should_include(meta: dict) -> tuple[bool, dict | None]:
    raw_source = find_raw_source(meta)
    if raw_source is None:
        return True, None
    modified_at = datetime.fromtimestamp(raw_source.stat().st_mtime)
    meta["rawSourceFile"] = str(raw_source.relative_to(RAW_SOURCES)).replace("\\", "/")
    meta["rawModifiedAt"] = modified_at.isoformat(sep=" ", timespec="seconds")
    if modified_at < CUTOFF_DATE:
        return False, meta
    return True, None

# clean generated grouping only
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True, exist_ok=True)

report = {
    "cutoffDateInclusive": CUTOFF_DATE.date().isoformat(),
    "totalFiles": 0,
    "excludedBeforeCutoffCount": 0,
    "worldviewCountIncludingUnknown": 0,
    "worldviewCountConfirmed": 0,
    "excludedBeforeCutoff": [],
    "groups": [],
}

grouped = {slug: [] for slug in GROUPS}
for path in sorted(PENDING.glob("*.worldbook.json")):
    slug = choose_group(path.name)
    meta = read_meta(path)
    include, excluded_meta = should_include(meta)
    if not include:
        report["excludedBeforeCutoff"].append(excluded_meta)
        continue
    grouped[slug].append(meta)
    dest = OUT / slug / "worldbooks"
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dest / path.name)

for slug, files in grouped.items():
    if not files:
        continue
    group_dir = OUT / slug
    (group_dir / "README.md").write_text(
        f"# {GROUPS[slug]['name']}\n\n"
        f"Slug: `{slug}`\n\n"
        f"Worldbook files: {len(files)}\n\n"
        + "\n".join(f"- `{item['file']}` — entries: {item['entryCount']}, source: {item['sourceKind']}" for item in files)
        + "\n",
        encoding="utf-8",
    )
    report["groups"].append({
        "slug": slug,
        "name": GROUPS[slug]["name"],
        "fileCount": len(files),
        "entryCount": sum(item["entryCount"] for item in files),
        "files": files,
        "needsReview": slug == UNKNOWN,
    })

report["totalFiles"] = sum(group["fileCount"] for group in report["groups"])
report["excludedBeforeCutoffCount"] = len(report["excludedBeforeCutoff"])
report["worldviewCountIncludingUnknown"] = len(report["groups"])
report["worldviewCountConfirmed"] = sum(1 for group in report["groups"] if group["slug"] != UNKNOWN)
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({
    "totalFiles": report["totalFiles"],
    "worldviewCountConfirmed": report["worldviewCountConfirmed"],
    "worldviewCountIncludingUnknown": report["worldviewCountIncludingUnknown"],
    "excludedBeforeCutoffCount": report["excludedBeforeCutoffCount"],
    "unknownFiles": next((g["fileCount"] for g in report["groups"] if g["slug"] == UNKNOWN), 0),
    "report": str(REPORT.relative_to(ROOT)).replace("\\", "/"),
}, ensure_ascii=False))
