#!/usr/bin/env python3
"""
Crawls the Kurumsal section of StartKey.com.tr (tr/en/de), writes HTML snapshots
and a structured seed file the Laravel API loads.

Re-run after the reference content changes. Existing media files are kept unless
FORCE=1. The crawler is the source of the article/person counts — it does not
trust the sprint briefing.
"""
from __future__ import annotations

import html as htmlmod
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
SNAP = ROOT / "reference" / "snapshots" / "corporate"
OUT = ROOT / "api" / "database" / "data" / "corporate-seed.json"
PUBLIC = ROOT / "web" / "public" / "media"
BASE = "https://startkey.com.tr"
LANGS = ("tr", "en", "de")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
SCOPE = re.compile(r"\s+b-[a-z0-9]{10}(?=[\s>/])")
CDN = re.compile(r"https?://cdnc\.re-os\.com")
IMAGEKIT = re.compile(r"https?://ik\.imagekit\.io/reoscom/*(?:tr:[^/]*/)?")
ORIGIN = re.compile(r"https?://(?:www\.)?startkey\.com\.tr")
MEDIA_HOST = r"https://(?:cdnc\.re-os\.com|ik\.imagekit\.io/reoscom)"
MEDIA_URL = re.compile(
    rf'(?:(?:src|srcset|href)="\s*({MEDIA_HOST}[^"\s]+)|url\(\s*({MEDIA_HOST}[^)\s]+)\s*\))'
)

LISTS = {
    "news": {
        "tr": "/tr/haberler",
        "en": "/en/news",
        "de": "/de/nachricht",
        "page_bases": {"tr": "/tr/haberler", "en": "/en/haberler", "de": "/de/haberler"},
        "per_page": 9,
    },
    "announcement": {
        "tr": "/tr/duyurular",
        "en": "/en/announcements",
        "de": "/de/ankundigungen",
        "page_bases": {"tr": "/tr/duyurular", "en": "/en/duyurular", "de": "/de/duyurular"},
        "per_page": 9,
    },
    "blog": {
        "tr": "/tr/bloglar",
        "en": "/en/blogs",
        "de": "/de/blogs",
        "page_bases": {"tr": "/tr/bloglar", "en": "/en/bloglar", "de": "/de/bloglar"},
        "per_page": 10,
    },
}

STATIC_PAGES = {
    "about": {"tr": "/tr/sayfa/hakkimizda", "en": "/en/page/about-us", "de": "/de/page/uber-uns"},
    "vision": {"tr": "/tr/sayfa/vizyon-misyon", "en": "/en/page/our-vision-mission", "de": "/de/page/unsere-vision-mission"},
}

PEOPLE_LIST = {"tr": "/tr/yonetim-kadrosu", "en": "/en/people", "de": "/de/people"}
CHAMPIONS = {"tr": "/tr/sampiyonlar", "en": "/en/champions", "de": "/de/champions"}
ALL_HTML: list[str] = []


def fetch(path: str) -> str:
    url = urljoin(BASE, path)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                html = response.read().decode("utf-8", "replace")
                ALL_HTML.append(html)
                return html
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"GET {path} failed: {last_error}")


def decode(value: str | None) -> str:
    if not value:
        return ""
    value = SCOPE.sub("", value)
    value = htmlmod.unescape(value)
    return re.sub(r"[ \t]+", " ", value).strip()


def localise(value: str | None) -> str:
    if not value:
        return ""
    width = re.search(r"[?&]width=(\d+)", value)
    height = re.search(r"[?&]height=(\d+)", value)
    is_webp = "tr:format" in value or value.lower().rstrip("/").endswith(".webp")
    value = IMAGEKIT.sub("/media/", CDN.sub("/media/", value))
    value = ORIGIN.sub("", value)
    path = value.split("?", 1)[0].replace("/media//", "/media/")
    stem, sep, ext = path.rpartition(".")
    if not sep:
        return path
    suffix = ""
    if width and height:
        suffix = f"-{width.group(1)}x{height.group(1)}"
    elif width:
        suffix = f"-{width.group(1)}"
    if is_webp:
        ext = "webp"
    return f"{stem}{suffix}.{ext}"


def localise_html(fragment: str) -> str:
    def repl(match: re.Match[str]) -> str:
        return f'{match.group(1)}="{localise(match.group(2))}"'

    fragment = re.sub(rf'(src|srcset|href)="({MEDIA_HOST}[^"]+)"', repl, fragment)
    fragment = ORIGIN.sub("", fragment)
    return SCOPE.sub("", fragment)


def inner_by_class(page: str, class_name: str) -> str | None:
    needle = f'class="{class_name}"'
    i = page.find(needle)
    if i < 0:
        needle = f"class='{class_name}'"
        i = page.find(needle)
    if i < 0:
        return None
    start = page.rfind("<", 0, i)
    return match_tag(page, start)


def match_tag(page: str, start: int) -> str | None:
    if start < 0 or start >= len(page) or page[start] != "<":
        return None
    gt = page.find(">", start)
    if gt < 0:
        return None
    name_m = re.match(r"<([a-zA-Z0-9:-]+)", page[start:gt + 1])
    if not name_m:
        return None
    name = name_m.group(1).lower()
    if page[gt - 1] == "/":
        return page[start : gt + 1]
    pos = gt + 1
    depth = 1
    pattern = re.compile(rf"</?{re.escape(name)}\b", re.I)
    while depth:
        m = pattern.search(page, pos)
        if not m:
            return page[start:]
        token = page[m.start() : page.find(">", m.start()) + 1]
        if token.startswith("</"):
            depth -= 1
            if depth == 0:
                return page[start : m.end() + (page.find(">", m.start()) - m.end() + 1)]
        elif not token.rstrip().endswith("/>"):
            depth += 1
        pos = page.find(">", m.start()) + 1
    return None


def text_of(fragment: str) -> str:
    return decode(re.sub(r"<[^>]+>", " ", fragment))


def meta(page: str) -> dict:
    def tag(attr: str, value: str) -> str | None:
        m = re.search(
            rf'<meta[^>]+{attr}="{re.escape(value)}"[^>]+content="([^"]*)"',
            page,
            re.I,
        )
        if not m:
            m = re.search(
                rf'<meta[^>]+content="([^"]*)"[^>]+{attr}="{re.escape(value)}"',
                page,
                re.I,
            )
        return decode(m.group(1)) if m else None

    title = re.search(r"<title>(.*?)</title>", page, re.I | re.S)
    return {
        "title": decode(title.group(1)) if title else "",
        "description": tag("name", "description"),
        "ogTitle": tag("property", "og:title"),
        "ogImage": localise(tag("property", "og:image") or ""),
    }


def breadcrumb(page: str) -> dict:
    block = inner_by_class(page, "breadcrumb-wrap bg-f br-1") or inner_by_class(page, "breadcrumb-wrap")
    heading = ""
    if block:
        h = re.search(r"<h2[^>]*>(.*?)</h2>", block, re.S | re.I)
        heading = text_of(h.group(1)) if h else ""
    trail = []
    menu = re.search(r'class="breadcrumb-menu[^"]*"(.*?)</ul>', page, re.S | re.I)
    if menu:
        for item in re.finditer(r"<li[^>]*>(.*?)</li>", menu.group(1), re.S | re.I):
            a = re.search(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', item.group(1), re.S | re.I)
            if a:
                trail.append({"href": localise(a.group(1)) or "/", "label": text_of(a.group(2))})
            else:
                trail.append({"href": None, "label": text_of(item.group(1))})
    return {"heading": heading, "trail": trail}


def list_cards(page: str) -> list[dict]:
    cards = []
    for m in re.finditer(r'<div class="blog-card style1">(.*?)</div>\s*</div>\s*</div>', page, re.S):
        chunk = m.group(0)
        href = re.search(r'<a href="([^"]+)"', chunk)
        title = re.search(r"<h3[^>]*>\s*<a[^>]*>(.*?)</a>", chunk, re.S)
        date = re.search(r"flaticon-calendar" + r".*?</i>([^<]+)", chunk, re.S)
        cat = re.search(r"flaticon-price-tag" + r".*?</i>([^<]+)", chunk, re.S)
        img = re.search(r'<img src="([^"]+)"', chunk)
        srcset = re.search(r'<source srcset="([^"]+)"', chunk)
        width = re.search(r'width="(\d+)"', chunk)
        height = re.search(r'height="(\d+)"', chunk)
        cont = re.search(r'class="bl-continue"[^>]*>(.*?)<i', chunk, re.S)
        ext = None
        path = href.group(1) if href else ""
        id_m = re.search(r"/(\d+)/", path)
        if id_m:
            ext = int(id_m.group(1))
        cards.append(
            {
                "externalId": ext,
                "urlPath": localise(path),
                "title": text_of(title.group(1)) if title else "",
                "dateLabel": decode(date.group(1)) if date else "",
                "category": decode(cat.group(1)) if cat else "",
                "image": localise(img.group(1)) if img else "",
                "imageWebp": localise(srcset.group(1)) if srcset else "",
                "width": int(width.group(1)) if width else None,
                "height": int(height.group(1)) if height else None,
                "continueLabel": text_of(cont.group(1)) if cont else "",
            }
        )
    return cards


def article_detail(page: str) -> dict:
    title = ""
    h2 = re.search(r"<article[\s\S]*?<h2[^>]*>(.*?)</h2>", page, re.I)
    if h2:
        title = text_of(h2.group(1))
    date = re.search(r"flaticon-calendar" + r".*?</i>([^<]+)", page, re.S)
    cat = re.search(r"flaticon-price-tag" + r".*?</i>([^<]+)", page, re.S)
    para = inner_by_class(page, "post-para") or ""
    # keep inner HTML only
    inner = re.sub(r'^<div[^>]*class="post-para"[^>]*>', "", para, count=1, flags=re.I)
    inner = re.sub(r"</div>\s*$", "", inner, count=1)
    img = re.search(r'<div class="post-img"[^>]*>[\s\S]*?<img src="([^"]+)"', page)
    srcset = re.search(r'<div class="post-img"[^>]*>[\s\S]*?<source srcset="([^"]+)"', page)
    share = re.search(r'<span>([^<]*)</span>\s*<ul class="social-profile', page)
    return {
        "title": title,
        "dateLabel": decode(date.group(1)) if date else "",
        "category": decode(cat.group(1)) if cat else "",
        "bodyHtml": localise_html(inner.strip()),
        "image": localise(img.group(1)) if img else "",
        "imageWebp": localise(srcset.group(1)) if srcset else "",
        "shareLabel": decode(share.group(1)) if share else "",
        "meta": meta(page),
        "breadcrumb": breadcrumb(page),
    }


def main_html(page: str) -> str:
    start = page.find("<!-- Breadcrumb End -->")
    end = page.find('<footer')
    if start < 0:
        start = page.find("<section")
    if start < 0 or end < 0 or end <= start:
        return ""
    chunk = page[start:end]
    chunk = re.sub(r"<!--.*?-->", "", chunk, flags=re.S)
    return localise_html(chunk.strip())


def people_cards(page: str) -> list[dict]:
    items = []
    for m in re.finditer(r'<div[^>]*class="agent-card style1"(.*?)</div>\s*</div>\s*</div>', page, re.S):
        chunk = m.group(0)
        href = re.search(r'<a href="([^"]+)"', chunk)
        name = re.search(r"<h3[^>]*>\s*<a[^>]*>(.*?)</a>", chunk, re.S)
        role = re.search(r"<span[^>]*>(.*?)</span>", chunk, re.S)
        tel = re.search(r'href="(tel:[^"]+)"[^>]*>(.*?)</a>', chunk, re.S)
        email = re.search(r'href="mailto:([^"]+)"[^>]*>(.*?)</a>', chunk, re.S)
        img = re.search(r'<img src="([^"]+)"', chunk)
        srcset = re.search(r'<source srcset="([^"]+)"', chunk)
        path = href.group(1) if href else ""
        id_m = re.search(r"/(\d+)/", path)
        items.append(
            {
                "externalId": int(id_m.group(1)) if id_m else None,
                "urlPath": localise(path),
                "name": text_of(name.group(1)) if name else "",
                "role": text_of(role.group(1)) if role else "",
                "phoneHref": tel.group(1) if tel else "",
                "phoneLabel": decode(tel.group(2)) if tel else "",
                "email": decode(email.group(1)) if email else "",
                "listImage": localise(img.group(1)) if img else "",
                "listImageWebp": localise(srcset.group(1)) if srcset else "",
                "image": localise(img.group(1)) if img else "",
                "imageWebp": localise(srcset.group(1)) if srcset else "",
            }
        )
    return items


def person_detail(page: str) -> dict:
    name = re.search(r'<div class="agent-name">\s*<h2>(.*?)</h2>', page, re.S)
    role = re.search(r'<div class="agent-name">[\s\S]*?<span>(.*?)</span>', page)
    email = re.search(r'href="mailto:([^"]+)"', page)
    tel = re.search(r'href="(tel:[^"]+)"[^>]*>(.*?)</a>', page, re.S)
    img = re.search(r'<div class="agent-img">[\s\S]*?<img src="([^"]+)"', page)
    srcset = re.search(r'<div class="agent-img">[\s\S]*?<source srcset="([^"]+)"', page)
    social = []
    for a in re.finditer(r"<li>\s*<a href='([^']+)'[^>]*class='([^']+)'", page):
        social.append({"href": a.group(1), "network": a.group(2)})
    bio = inner_by_class(page, "agent-bio") or inner_by_class(page, "agent-desc") or ""
    if bio:
        bio = re.sub(r"^<div[^>]*>", "", bio, count=1)
        bio = re.sub(r"</div>\s*$", "", bio, count=1)
    return {
        "name": text_of(name.group(1)) if name else "",
        "role": text_of(role.group(1)) if role else "",
        "email": email.group(1) if email else "",
        "phoneHref": tel.group(1) if tel else "",
        "phoneLabel": decode(tel.group(2)) if tel else "",
        "image": localise(img.group(1)) if img else "",
        "imageWebp": localise(srcset.group(1)) if srcset else "",
        "social": social,
        "bioHtml": localise_html(bio.strip()),
        "meta": meta(page),
        "breadcrumb": breadcrumb(page),
        "bodyHtml": main_html(page),
    }


def champions(page: str) -> list[dict]:
    body = main_html(page)
    groups = []
    parts = re.split(r'<div class="section-title style2 text-center mb-40">', body)
    for part in parts[1:]:
        kicker = re.search(r"<span>(.*?)</span>", part, re.S)
        heading = re.search(r"<h3>(.*?)</h3>", part, re.S)
        photos = []
        for img in re.finditer(r'<div[^>]*class="photo"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"', part):
            photos.append(localise(img.group(1)))
        if not kicker and not heading and not photos:
            continue
        groups.append(
            {
                "kicker": text_of(kicker.group(1)) if kicker else "",
                "title": text_of(heading.group(1)) if heading else "",
                "photos": photos,
            }
        )
    return groups


def sidebar(page: str) -> dict | None:
    block = inner_by_class(page, "sidebar")
    if not block:
        return None
    placeholder = re.search(r'placeholder="([^"]+)"', block)
    action = re.search(r'action="([^"]+)"', block)
    heading = re.search(r"<h4>(.*?)</h4>", block, re.S)
    popular = []
    for item in re.finditer(r'<div class="pp-post-item">(.*?)</div>\s*</div>', block, re.S):
        chunk = item.group(1)
        href = re.search(r'href="([^"]+)"', chunk)
        title = re.search(r"<h6[^>]*>\s*<a[^>]*>(.*?)</a>", chunk, re.S)
        date = re.search(r"<span>[\s\S]*?</i>([^<]+)", chunk)
        img = re.search(r'<img src="([^"]+)"', chunk)
        srcset = re.search(r'<source srcset="([^"]+)"', chunk)
        popular.append(
            {
                "urlPath": localise(href.group(1)) if href else "",
                "title": text_of(title.group(1)) if title else "",
                "dateLabel": decode(date.group(1)) if date else "",
                "image": localise(img.group(1)) if img else "",
                "imageWebp": localise(srcset.group(1)) if srcset else "",
            }
        )
    return {
        "searchPlaceholder": decode(placeholder.group(1)) if placeholder else "",
        "searchAction": localise(action.group(1)) if action else "",
        "popularHeading": text_of(heading.group(1)) if heading else "",
        "popular": popular,
    }


def save_snapshot(name: str, page: str) -> None:
    SNAP.mkdir(parents=True, exist_ok=True)
    (SNAP / name).write_text(page, encoding="utf-8")


def crawl_list(kind: str, lang: str) -> tuple[list[dict], dict | None, dict]:
    spec = LISTS[kind]
    first_path = spec[lang]
    first = fetch(first_path)
    save_snapshot(f"{kind}-{lang}-p1.html", first)
    items = list_cards(first)
    seen = {item["externalId"] for item in items if item["externalId"]}
    page_ui = {
        "breadcrumb": breadcrumb(first),
        "meta": meta(first),
        "continueLabel": next((c["continueLabel"] for c in items if c["continueLabel"]), ""),
        "sidebar": sidebar(first) if kind == "blog" else None,
        "listPath": spec[lang],
        "pagerBase": spec["page_bases"][lang],
        "perPage": spec["per_page"],
    }
    for index in range(2, 40):
        path = f"{spec['page_bases'][lang]}?pageIndex={index}"
        page = fetch(path)
        cards = list_cards(page)
        fresh = [c for c in cards if c["externalId"] and c["externalId"] not in seen]
        if not fresh:
            break
        for card in fresh:
            seen.add(card["externalId"])
            items.append(card)
    return items, page_ui["sidebar"], page_ui


def crawl_details(kind: str, entries_by_lang: dict[str, list[dict]]) -> dict[int, dict]:
    """Fetch every detail URL; keyed by externalId with per-locale translations."""
    jobs = []
    for lang, items in entries_by_lang.items():
        for item in items:
            if not item.get("urlPath"):
                continue
            jobs.append((item["externalId"], lang, item["urlPath"]))

    details: dict[int, dict] = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(fetch, path): (ext, lang, path) for ext, lang, path in jobs}
        done = 0
        for future in as_completed(futures):
            ext, lang, path = futures[future]
            done += 1
            if done % 25 == 0:
                print(f"  details {kind} {done}/{len(jobs)}", flush=True)
            try:
                page = future.result()
            except Exception as error:
                print(f"FAIL detail {path}: {error}", file=sys.stderr)
                continue
            parsed = article_detail(page)
            parsed["urlPath"] = path if path.startswith("/") else localise(path)
            details.setdefault(ext, {"externalId": ext, "type": kind, "translations": {}})
            details[ext]["translations"][lang] = parsed
            # list image from the matching card
            for card in entries_by_lang[lang]:
                if card["externalId"] == ext:
                    details[ext]["translations"][lang]["listImage"] = card["image"]
                    details[ext]["translations"][lang]["listImageWebp"] = card["imageWebp"]
                    details[ext]["translations"][lang]["listWidth"] = card["width"]
                    details[ext]["translations"][lang]["listHeight"] = card["height"]
                    details[ext]["translations"][lang]["urlPath"] = card["urlPath"]
                    details[ext]["translations"][lang]["dateLabel"] = parsed["dateLabel"] or card["dateLabel"]
                    details[ext]["translations"][lang]["category"] = parsed["category"] or card["category"]
                    details[ext]["translations"][lang]["title"] = parsed["title"] or card["title"]
                    break
    return details


def collect_media(pages: list[str]) -> dict[str, str]:
    urls = set()
    for page in pages:
        for match in MEDIA_URL.finditer(page):
            urls.add(match.group(1) or match.group(2))
    targets = {}
    for url in urls:
        path = url
        path = re.sub(r"^https://ik\.imagekit\.io/reoscom/*(?:tr:[^/]*/)?", "", path)
        path = re.sub(r"^https://cdnc\.re-os.com/", "", path)
        path, _, query = path.partition("?")
        path = path.lstrip("/")
        is_webp = "/tr:format/" in url or "tr:format" in url
        stem, _, ext = path.rpartition(".")
        if not stem:
            continue
        width = re.search(r"width=(\d+)", query)
        height = re.search(r"height=(\d+)", query)
        suffix = f"-{width.group(1)}x{height.group(1)}" if width and height else (f"-{width.group(1)}" if width else "")
        dest = f"{stem}{suffix}.{'webp' if is_webp else ext}"
        source = url.split("?")[0]
        if query:
            source = f"{source}?{query}"
        targets[dest] = source
    return targets


def download_media(targets: dict[str, str]) -> None:
    force = os.environ.get("FORCE") == "1"
    ok = skip = fail = 0
    for dest, url in sorted(targets.items()):
        path = PUBLIC / dest
        if path.exists() and path.stat().st_size > 0 and not force:
            skip += 1
            continue
        try:
            headers = {"User-Agent": UA, "Accept": "image/webp,*/*" if dest.endswith(".webp") else "*/*"}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as response:
                payload = response.read()
            if not payload:
                raise ValueError("empty")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
            ok += 1
        except Exception as error:
            fail += 1
            print(f"FAIL media {url}: {error}", file=sys.stderr)
    print(f"media: downloaded={ok} skipped={skip} failed={fail}")


def main() -> int:
    SNAP.mkdir(parents=True, exist_ok=True)
    snapshot_html: list[str] = []

    print("== static pages")
    pages_out = []
    for key, paths in STATIC_PAGES.items():
        record = {"key": key, "translations": {}}
        for lang, path in paths.items():
            print(f"  {key} {lang} {path}")
            page = fetch(path)
            save_snapshot(f"{key}-{lang}.html", page)
            snapshot_html.append(page)
            record["translations"][lang] = {
                "urlPath": path,
                "bodyHtml": main_html(page),
                "meta": meta(page),
                "breadcrumb": breadcrumb(page),
            }
        pages_out.append(record)

    print("== people")
    people_map: dict[int, dict] = {}
    people_ui = {}
    for lang, path in PEOPLE_LIST.items():
        print(f"  list {lang}")
        page = fetch(path)
        save_snapshot(f"people-{lang}.html", page)
        snapshot_html.append(page)
        people_ui[lang] = {"breadcrumb": breadcrumb(page), "meta": meta(page), "listPath": path}
        cards = people_cards(page)
        for card in cards:
            people_map.setdefault(
                card["externalId"],
                {"externalId": card["externalId"], "translations": {}},
            )
            people_map[card["externalId"]]["translations"][lang] = {**card}

    person_jobs = []
    for ext, rec in people_map.items():
        for lang, trans in rec["translations"].items():
            person_jobs.append((ext, lang, trans["urlPath"]))
    with ThreadPoolExecutor(max_workers=6) as pool:
        futs = {pool.submit(fetch, path): (ext, lang) for ext, lang, path in person_jobs}
        for future in as_completed(futs):
            ext, lang = futs[future]
            page = future.result()
            snapshot_html.append(page)
            parsed = person_detail(page)
            current = people_map[ext]["translations"][lang]
            list_image = current.get("listImage") or current.get("image")
            list_webp = current.get("listImageWebp") or current.get("imageWebp")
            current.update(parsed)
            current["listImage"] = list_image
            current["listImageWebp"] = list_webp

    print("== champions")
    champ_ui = {}
    champ_groups_by_lang = {}
    for lang, path in CHAMPIONS.items():
        print(f"  {lang}")
        page = fetch(path)
        save_snapshot(f"champions-{lang}.html", page)
        snapshot_html.append(page)
        champ_ui[lang] = {"breadcrumb": breadcrumb(page), "meta": meta(page), "listPath": path}
        champ_groups_by_lang[lang] = champions(page)

    print("== article lists")
    articles: dict[str, dict[int, dict]] = {"news": {}, "announcement": {}, "blog": {}}
    list_ui: dict[str, dict] = {}
    for kind in LISTS:
        list_ui[kind] = {}
        by_lang_cards = {}
        for lang in LANGS:
            print(f"  {kind} {lang} list")
            items, _, ui = crawl_list(kind, lang)
            by_lang_cards[lang] = items
            list_ui[kind][lang] = ui
            print(f"    {len(items)} items")
        print(f"  {kind} details")
        articles[kind] = crawl_details(kind, by_lang_cards)

    print("== media")
    download_media(collect_media(ALL_HTML))

    seed = {
        "pages": pages_out,
        "people": [people_map[k] for k in sorted(people_map)],
        "peopleUi": people_ui,
        "championGroups": champ_groups_by_lang,
        "championsUi": champ_ui,
        "articles": {
            kind: [articles[kind][k] for k in sorted(articles[kind])]
            for kind in articles
        },
        "listUi": list_ui,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")

    print("counts:")
    print("  people", len(seed["people"]))
    for kind, rows in seed["articles"].items():
        langs = {lang: sum(1 for row in rows if lang in row["translations"]) for lang in LANGS}
        print(f"  {kind} {len(rows)} langs={langs}")
    print("  pages", [p["key"] for p in seed["pages"]])
    print("  champion groups tr", len(seed["championGroups"].get("tr", [])))
    print("wrote", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
