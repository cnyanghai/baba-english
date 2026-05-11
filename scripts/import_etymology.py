"""把 etymonline 的 index.json 导入 WordEtymology 表。

输出 CSV → docker COPY，与导入 ECDICT 同模式。
"""
import csv
import json
import sys
from pathlib import Path

SRC = Path("data/etymonline/index.json")
OUT = Path("data/etymonline/etymology.csv")

def main():
    data = json.loads(SRC.read_text())
    print(f"[etym] loaded {len(data)} entries", file=sys.stderr)

    seen = set()
    skipped = 0
    written = 0
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        for r in data:
            word = (r.get("word") or "").strip()
            etym = (r.get("etymology") or "").strip()
            if not word or not etym:
                skipped += 1
                continue
            # 去重（同词条目可能有多个，按 PoS 不同；这里只取首个）
            if word in seen:
                skipped += 1
                continue
            seen.add(word)

            pos = (r.get("pos") or "").strip()
            years = r.get("years") or []
            crossrefs = r.get("crossreferences") or []

            # PostgreSQL array 字面量：{1,2,3} 或 {"a","b"}
            years_pg = "{" + ",".join(str(int(y)) for y in years if isinstance(y, (int, float))) + "}"
            crossrefs_pg = "{" + ",".join('"' + c.replace('"', '\\"') + '"' for c in crossrefs if c) + "}"

            w.writerow([word, pos, etym, years_pg, crossrefs_pg])
            written += 1
            if written % 10000 == 0:
                print(f"[etym] {written} written…", file=sys.stderr)

    print(f"[etym] done: {written} written, {skipped} skipped", file=sys.stderr)

if __name__ == "__main__":
    main()
