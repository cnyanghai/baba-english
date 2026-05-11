"""subtitlecat.com 抓双语 SRT
Usage: python3 scripts/subtitlecat_fetch.py <slug> <search_query>
输出：data/movies/<slug>/{en.srt, zh-CN.srt}

策略：
1. 搜索页 https://www.subtitlecat.com/index.php?search=<query>
2. 取首条结果（通常是 yify-english 版）
3. 详情页正则找 "Chinese (Simplified)" 对应的 zh-CN 下载链接 + "english-en.srt" 下载链接
4. 直接 wget 两个 SRT
"""

import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0 (Linux x86_64) Gecko/20100101 Firefox/121.0"}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="ignore")


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def search_first_detail_page(query: str) -> str:
    """优先级：含 'yify-english' 关键字 > 含 'yify' > 含 'english' > 第一条结果

    优先选 yify 版本是因为它们通常有现成的 zh-CN 翻译；其他版本可能只有 Translate 按钮，需要触发即时翻译。
    """
    url = f"https://www.subtitlecat.com/index.php?search={urllib.parse.quote_plus(query)}"
    html = fetch(url)
    candidates = re.findall(r'href="(subs/\d+/[^"]*\.html)"', html)
    if not candidates:
        raise SystemExit(f"[scrape] 无搜索结果: {query}")

    def pick(matcher) -> str | None:
        for c in candidates:
            if matcher(c.lower()):
                return c
        return None

    chosen = (
        pick(lambda s: "yify-english" in s)
        or pick(lambda s: "yify" in s)
        or pick(lambda s: "english" in s)
        or candidates[0]
    )
    return "https://www.subtitlecat.com/" + chosen


def find_srt_links(detail_html: str) -> dict:
    """返回 {'en': url, 'zh-CN': url} 的下载链接（绝对 URL）。

    各电影 slug 不同，所以放宽匹配：任意以 -en.srt 结尾的就是英文原版。
    HTML 里语种段顺序：英文（en）通常靠前。
    """
    out = {}
    # English: 任意 -en.srt 结尾（不再要求 english 在 slug 里，部分电影源自 YIFY/BrRip 等）
    m = re.search(r'href="(/subs/\d+/[^"]*-en\.srt)"', detail_html)
    if m:
        out["en"] = "https://www.subtitlecat.com" + urllib.parse.quote(m.group(1), safe="/:")
    # zh-CN: 在 "Chinese (Simplified)" 下方第一个 download href
    m = re.search(
        r'Chinese \(Simplified\).*?href="(/subs/\d+/[^"]*zh-CN\.srt)"',
        detail_html, re.DOTALL,
    )
    if m:
        out["zh-CN"] = "https://www.subtitlecat.com" + urllib.parse.quote(m.group(1), safe="/:")
    return out


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 subtitlecat_fetch.py <slug> <search_query>")
        sys.exit(2)
    slug, query = sys.argv[1], sys.argv[2]
    out_dir = Path("data/movies") / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[scrape] search '{query}'")
    detail_url = search_first_detail_page(query)
    print(f"[scrape] detail = {detail_url}")
    detail_html = fetch(detail_url)
    links = find_srt_links(detail_html)

    if "en" not in links or "zh-CN" not in links:
        # 把 detail_html 存下来便于人工 fallback
        (out_dir / "_debug_detail.html").write_text(detail_html, encoding="utf-8")
        raise SystemExit(f"[scrape] missing links: {links} (debug saved)")

    for tag, url in links.items():
        path = out_dir / f"{tag}.srt"
        print(f"[scrape] DL {tag} <- {url}")
        path.write_bytes(fetch_bytes(url))
        size = path.stat().st_size
        print(f"[scrape]    saved {size} bytes")
    print(f"[scrape] done {slug}")


if __name__ == "__main__":
    main()
