"""把 EN + ZH 两份 SRT 合并成现有 seed.mjs 期待的两个 JSON 文件：
  - {prefix}.transcribe.json: [{index, start_ms, end_ms, en_text}, ...]
  - {prefix}.translations.json: {"0": "中文...", "1": "中文...", ...}

时间戳必须完全一致（同 SRT 翻译来源），按 EN SRT 的时间戳为准。
跳过 OpenSubtitles 广告条（首条），且过滤含明显广告关键字的句子。

用法：
  python3 scripts/srt_to_baba.py \\
    data/harry-potter/hp1-en.srt \\
    data/harry-potter/hp1-zh-CN.srt \\
    data/harry-potter/hp1
"""
import json
import re
import sys
from pathlib import Path

TIME_RE = re.compile(r"(\d+):(\d+):(\d+)[,\.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,\.](\d+)")
AD_KEYWORDS = ["opensubtitles", "subscene", "uploaded by", "字幕组", "synced and corrected", "subtitle by"]


def parse_srt(path: Path):
    """返回 list of (start_ms, end_ms, text)。"""
    text = path.read_text(encoding="utf-8")
    blocks = re.split(r"\r?\n\r?\n+", text.strip())
    out = []
    for blk in blocks:
        lines = [l for l in blk.strip().splitlines() if l.strip()]
        if len(lines) < 3:
            continue
        # 第一行是序号；第二行是时间戳；剩下是文本
        m = TIME_RE.search(lines[1])
        if not m:
            continue
        h1, m1, s1, ms1, h2, m2, s2, ms2 = map(int, m.groups())
        start_ms = ((h1 * 60 + m1) * 60 + s1) * 1000 + ms1
        end_ms = ((h2 * 60 + m2) * 60 + s2) * 1000 + ms2
        body = "\n".join(lines[2:]).strip()
        out.append((start_ms, end_ms, body))
    return out


def is_ad(text: str) -> bool:
    low = text.lower()
    return any(k in low for k in AD_KEYWORDS)


def merge(en_subs, zh_subs):
    """按时间戳对齐合并。EN 为主，ZH 按 (start_ms, end_ms) 精确匹配。"""
    zh_by_key = {(s, e): t for (s, e, t) in zh_subs}
    merged = []
    for s, e, en in en_subs:
        if is_ad(en):
            continue
        zh = zh_by_key.get((s, e))
        # 中文广告也跳
        if zh and is_ad(zh):
            zh = None
        merged.append({"start_ms": s, "end_ms": e, "en_text": en.replace("\n", " "), "zh_text": (zh.replace("\n", " ") if zh else None)})
    # 重新编 index
    for i, d in enumerate(merged):
        d["index"] = i
    return merged


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    en_path = Path(sys.argv[1])
    zh_path = Path(sys.argv[2])
    out_prefix = sys.argv[3]

    en = parse_srt(en_path)
    zh = parse_srt(zh_path)
    print(f"[srt] EN parsed: {len(en)}", file=sys.stderr)
    print(f"[srt] ZH parsed: {len(zh)}", file=sys.stderr)

    merged = merge(en, zh)
    matched = sum(1 for d in merged if d["zh_text"])
    print(f"[srt] merged: {len(merged)} (after filtering ads)", file=sys.stderr)
    print(f"[srt] zh matched: {matched} / {len(merged)} ({100*matched//max(len(merged),1)}%)", file=sys.stderr)

    transcribe = [{"index": d["index"], "start_ms": d["start_ms"], "end_ms": d["end_ms"], "en_text": d["en_text"]} for d in merged]
    translations = {str(d["index"]): d["zh_text"] for d in merged if d["zh_text"]}

    Path(f"{out_prefix}.transcribe.json").write_text(json.dumps(transcribe, ensure_ascii=False, indent=2))
    Path(f"{out_prefix}.translations.json").write_text(json.dumps(translations, ensure_ascii=False, indent=2))

    print(f"[srt] wrote {out_prefix}.transcribe.json ({len(transcribe)} entries)", file=sys.stderr)
    print(f"[srt] wrote {out_prefix}.translations.json ({len(translations)} entries)", file=sys.stderr)


if __name__ == "__main__":
    main()
