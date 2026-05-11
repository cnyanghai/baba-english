"""把 ECDICT 的 ecdict.csv 转换成可 COPY 的 CSV 格式。

输出列（与 Word 表对齐）：lemma, ipa, definitions(JSON), audioUrl, freq
- definitions 解析 translation 字段中的 "n. xxx\\nv. yyy" 格式
- freq 取 bnc 和 frq 的最小正值（小=高频）
- audioUrl 暂留空（ECDICT audio 字段几乎都空）

用法：python3 scripts/transform_ecdict.py < data/ecdict/ecdict.csv > data/ecdict/word.csv
"""
import csv
import json
import re
import sys

POS_RE = re.compile(r"^([a-zA-Z]+\.)\s+(.+)$")

def parse_translation(s: str):
    if not s:
        return []
    out = []
    # ECDICT 在 translation 字段里把不同词性用字面 \n（两字符）分开
    for raw in s.split("\\n"):
        raw = raw.strip()
        if not raw:
            continue
        m = POS_RE.match(raw)
        if m:
            out.append({"pos": m.group(1), "def": m.group(2).strip()})
        else:
            out.append({"pos": "", "def": raw})
    return out

def pick_freq(bnc: str, frq: str):
    candidates = []
    for v in (bnc, frq):
        try:
            n = int(v)
            if n > 0:
                candidates.append(n)
        except (TypeError, ValueError):
            pass
    return min(candidates) if candidates else None

def main():
    reader = csv.DictReader(sys.stdin)
    writer = csv.writer(sys.stdout, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    n = 0
    skipped = 0
    seen = set()
    for row in reader:
        word = (row.get("word") or "").strip()
        if not word:
            skipped += 1
            continue
        # PG 主键唯一，跳过重复
        if word in seen:
            skipped += 1
            continue
        seen.add(word)

        ipa = (row.get("phonetic") or "").strip() or None
        definitions = parse_translation(row.get("translation") or "")
        if not definitions:
            # 没中文释义就用英文 definition
            en_def = (row.get("definition") or "").strip()
            if en_def:
                definitions = [{"pos": "", "def": en_def}]
        if not definitions:
            skipped += 1
            continue

        audio = (row.get("audio") or "").strip() or None
        freq = pick_freq(row.get("bnc") or "", row.get("frq") or "")

        writer.writerow([
            word,
            ipa if ipa is not None else "",
            json.dumps(definitions, ensure_ascii=False),
            audio if audio is not None else "",
            freq if freq is not None else "",
        ])
        n += 1
        if n % 100000 == 0:
            print(f"[transform] {n} rows…", file=sys.stderr, flush=True)

    print(f"[transform] done: {n} written, {skipped} skipped", file=sys.stderr)

if __name__ == "__main__":
    main()
