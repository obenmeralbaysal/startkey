#!/usr/bin/env python3
"""
Crawls Akademi (seminars/trainings) and İletişim from StartKey.com.tr.

Çevrimiçi Eğitimler is an external site (startkeyakademi.net) and is not crawled.
Counts and list order come from the live pages, not from a briefing.
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
SNAP = ROOT / "reference" / "snapshots" / "academy"
OUT = ROOT / "api" / "database" / "data" / "academy-seed.json"
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
    "tr": "/tr/egitimlerimiz",
    "en": "/en/our-educations",
    "de": "/de/our-educations",
}
LIST_ALIASES = {
    "tr": ["/tr/egitimlerimiz"],
    "en": ["/en/our-educations", "/en/egitimlerimiz"],
    "de": ["/de/our-educations", "/de/egitimlerimiz"],
}
CONTACT = {
    "tr": "/tr/iletisim",
    "en": "/en/contact",
    "de": "/de/kontakt",
}
CONTACT_ALIASES = {
    "tr": ["/tr/iletisim"],
    "en": ["/en/contact", "/en/iletisim"],
    "de": ["/de/kontakt", "/de/iletisim"],
}
DETAIL_PREFIX = {
    "tr": "/tr/egitim-detay",
    "en": "/en/egitim-detay",
    "de": "/de/egitim-detay",
}
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
        except (urllib.error.URLError, TimeoutError, urllib.error.HTTPError) as error:
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


def text_of(fragment: str) -> str:
    return decode(re.sub(r"<[^>]+>", " ", fragment))


def save_snapshot(name: str, page: str) -> None:
    SNAP.mkdir(parents=True, exist_ok=True)
    (SNAP / name).write_text(page, encoding="utf-8")


def meta(page: str) -> dict:
    def tag(attr: str, value: str) -> str | None:
        m = re.search(rf'<meta[^>]+{attr}="{re.escape(value)}"[^>]+content="([^"]*)"', page, re.I)
        if not m:
            m = re.search(rf'<meta[^>]+content="([^"]*)"[^>]+{attr}="{re.escape(value)}"', page, re.I)
        return decode(m.group(1)) if m else None

    title = re.search(r"<title>(.*?)</title>", page, re.I | re.S)
    return {
        "title": decode(title.group(1)) if title else "",
        "description": tag("name", "description"),
        "ogTitle": tag("property", "og:title"),
        "ogImage": localise(tag("property", "og:image") or ""),
    }


def breadcrumb(page: str) -> dict:
    heading = ""
    h = re.search(r'class="breadcrumb-title"[\s\S]*?<h2[^>]*>(.*?)</h2>', page, re.S | re.I)
    if h:
        heading = text_of(h.group(1))
    trail = []
    menu = re.search(r'class="breadcrumb-menu[^"]*"(.*?)</ul>', page, re.S | re.I)
    if menu:
        for item in re.finditer(r"<li[^>]*>(.*?)</li>", menu.group(1), re.S | re.I):
            a = re.search(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', item.group(1), re.S | re.I)
            if a:
                trail.append({"href": localise(a.group(1)) or "/", "label": text_of(a.group(2))})
            else:
                a2 = re.search(r"<a[^>]*>(.*?)</a>", item.group(1), re.S | re.I)
                trail.append({"href": None, "label": text_of(a2.group(1) if a2 else item.group(1))})
    return {"heading": heading, "trail": trail}


def attr_style(tag: str | None) -> str:
    if not tag:
        return ""
    m = re.search(r'style="([^"]*)"', tag)
    return decode(m.group(1)) if m else ""


def parse_card(chunk: str, group: str) -> dict | None:
    href = re.search(r'<a class="property-img" href="([^"]+)"', chunk)
    title = re.search(r"<h3[^>]*>\s*<a[^>]*>(.*?)</a>", chunk, re.S)
    img = re.search(r'<img src="([^"]+)"', chunk)
    button = re.search(r'class="btn style2"[^>]*>(.*?)<i', chunk, re.S)
    path = href.group(1) if href else ""
    id_m = re.search(r"/(\d+)/", path)
    ext = int(id_m.group(1)) if id_m else None
    if ext is None:
        return None
    slug_m = re.search(r"/\d+/([^/?#]+)", path)
    lines = []
    for para in re.finditer(r"<p[^>]*>\s*<i class=\"(flaticon-[^\"]+)\"></i>\s*([\s\S]*?)</p>", chunk):
        lines.append({"icon": para.group(1), "text": decode(re.sub(r"<[^>]+>", " ", para.group(2)))})
    return {
        "externalId": ext,
        "group": group,
        "cardUrlPath": localise(path),
        "slug": slug_m.group(1) if slug_m else "",
        "title": text_of(title.group(1)) if title else "",
        "image": localise(img.group(1)) if img else "",
        "infoLines": lines,
        "detailLabel": text_of(button.group(1)) if button else "",
    }


def list_sections(page: str) -> list[dict]:
    sections = []
    for m in re.finditer(r'<section class="listing-wrap ptb-100"([^>]*)>([\s\S]*?)</section>', page):
        attrs, body = m.group(1), m.group(2)
        h2 = re.search(r"<h2([^>]*)>(.*?)</h2>", body, re.S)
        group = "completed" if "padding-top:0" in attrs else "ongoing"
        cards = []
        seen = set()
        for card_m in re.finditer(
            r'<div class="col-lg-4 col-md-6">\s*<div class="property-card style2">([\s\S]*?)</div>\s*</div>\s*</div>',
            body,
        ):
            parsed = parse_card(card_m.group(0), group)
            if parsed is None or parsed["externalId"] in seen:
                continue
            seen.add(parsed["externalId"])
            cards.append(parsed)
        sections.append(
            {
                "group": group,
                "heading": text_of(h2.group(2)) if h2 else "",
                "headingStyle": attr_style(h2.group(1)) if h2 else "",
                "sectionStyle": attr_style(attrs),
                "cards": cards,
            }
        )
    return sections


def captcha_error(page: str) -> str:
    m = re.search(r"errorSpan\.innerText\s*=\s*'([^']+)'", page)
    if m:
        return decode(m.group(1))
    m = re.search(r'errorSpan\.innerText\s*=\s*"([^"]+)"', page)
    return decode(m.group(1)) if m else ""


def required_messages(page: str) -> dict[str, str]:
    messages = {}
    for m in re.finditer(r'data-val-required="([^"]+)"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*data-val-required="([^"]+)"', page):
        if m.group(2):
            messages[m.group(2)] = decode(m.group(1))
        else:
            messages[m.group(3)] = decode(m.group(4))
    return messages


def related_trainings(page: str) -> tuple[str, list[dict]]:
    heading_m = re.search(r"<h4>([^<]*)</h4>\s*<div class=\"property-thumb-item\">", page)
    heading = text_of(heading_m.group(1)) if heading_m else ""
    items = []
    for item in re.finditer(
        r'<div class="property-thumb-item">\s*<div class="property-thumb-img">([\s\S]*?)</div>\s*<div class="property-thumb-info">([\s\S]*?)</div>\s*</div>',
        page,
    ):
        chunk = item.group(0)
        href = re.search(r'<a class="overlay-link" href="([^"]+)"', chunk)
        title = re.search(r"<h6>\s*<a[^>]*>([\s\S]*?)</a>", chunk)
        img = re.search(r'<img src="([^"]+)"', chunk)
        path = href.group(1) if href else ""
        id_m = re.search(r"/(\d+)/", path)
        items.append(
            {
                "externalId": int(id_m.group(1)) if id_m else None,
                "urlPath": localise(path),
                "title": text_of(title.group(1)) if title else "",
                "image": localise(img.group(1)) if img else "",
            }
        )
    return heading, items


def training_detail(page: str) -> dict:
    title = ""
    h2 = re.search(r'class="property-title"[\s\S]*?<h2[^>]*>(.*?)</h2>', page, re.S)
    if h2:
        title = text_of(h2.group(1))
    date_prefix = date_value = time_prefix = time_value = price_prefix = price_value = ""
    cal = re.search(r'flaticon-calendar">\s*([^<]*)</i>\s*([^<]*)', page)
    if cal:
        date_prefix, date_value = decode(cal.group(1)), decode(cal.group(2))
    tm = re.search(r'flaticon-time">\s*([^<]*)</i>\s*([^<]*)', page)
    if tm:
        time_prefix, time_value = decode(tm.group(1)), decode(tm.group(2))
    pr = re.search(r'flaticon-price-tag">\s*([^<]*)</i>\s*([^<]*)', page, re.S)
    if pr:
        price_prefix, price_value = decode(pr.group(1)), decode(pr.group(2))
    img = re.search(r'class="property-img">\s*<img src="([^"]+)"', page)
    loc_h = loc_v = desc_h = desc_html = ""
    blocks = list(
        re.finditer(
            r'<div class="property-desc">\s*<h4>(.*?)</h4>\s*([\s\S]*?)</div>\s*(?=<div class="property-desc">|</div>\s*</div>\s*<div class="col-xl-4">)',
            page,
        )
    )
    if blocks:
        loc_h = text_of(blocks[0].group(1))
        loc_m = re.search(r"flaticon-location[^<]*></i>([^<]+)", blocks[0].group(2))
        loc_v = decode(loc_m.group(1)) if loc_m else ""
        if len(blocks) >= 2:
            desc_h = text_of(blocks[1].group(1))
            desc_html = localise_html(blocks[1].group(2).strip())
    form_heading = ""
    if re.search(r'class="filter-widget form"', page):
        fh = re.search(r'class="sidebar-widget">\s*<h4>(.*?)</h4>\s*<form', page, re.S)
        if fh:
            form_heading = text_of(fh.group(1))
    placeholders = {"firstName": "", "lastName": "", "email": ""}
    fn = re.search(r'name="FirstName"[^>]*placeholder="([^"]*)"|placeholder="([^"]*)"[^>]*name="FirstName"', page)
    if fn:
        placeholders["firstName"] = decode(fn.group(1) or fn.group(2))
    ln = re.search(r'name="LastName"[^>]*placeholder="([^"]*)"|placeholder="([^"]*)"[^>]*name="LastName"', page)
    if ln:
        placeholders["lastName"] = decode(ln.group(1) or ln.group(2))
    em = re.search(r'name="Email"[^>]*placeholder="([^"]*)"|placeholder="([^"]*)"[^>]*name="Email"', page)
    if em:
        placeholders["email"] = decode(em.group(1) or em.group(2))
    genders = []
    for opt in re.finditer(r'<select[^>]*name="GenderId"[^>]*>(.*?)</select>', page, re.S):
        for o in re.finditer(r'<option value="(\d+)">(.*?)</option>', opt.group(1), re.S):
            genders.append({"value": int(o.group(1)), "label": decode(o.group(2))})
    submit = re.search(r'<button[^>]*type="submit"[^>]*>(.*?)</button>', page, re.S)
    crumb_h = re.search(r'class="breadcrumb-title"[\s\S]*?<h2[^>]*>(.*?)</h2>', page, re.S)
    related_heading, related = related_trainings(page)
    return {
        "title": title,
        "pageHeading": text_of(crumb_h.group(1)) if crumb_h else "",
        "datePrefix": date_prefix,
        "dateValue": date_value,
        "timePrefix": time_prefix,
        "timeValue": time_value,
        "pricePrefix": price_prefix,
        "priceValue": price_value,
        "image": localise(img.group(1)) if img else "",
        "locationHeading": loc_h,
        "locationValue": loc_v,
        "descriptionHeading": desc_h,
        "descriptionHtml": desc_html,
        "formHeading": form_heading,
        "placeholders": placeholders,
        "required": required_messages(page),
        "genders": genders,
        "submitLabel": text_of(submit.group(1)) if submit else "",
        "captchaError": captcha_error(page),
        "relatedHeading": related_heading,
        "related": related,
        "meta": meta(page),
        "breadcrumb": breadcrumb(page),
    }


def contact_page(page: str) -> dict:
    items = []
    for m in re.finditer(r'class="contact-item"[^>]*>([\s\S]*?)</div>\s*</div>\s*</div>', page):
        chunk = m.group(0)
        icon = re.search(r'class="(flaticon-[^"]+)"', chunk)
        heading = re.search(r"<h3[^>]*>(.*?)</h3>", chunk, re.S)
        info = re.search(r'class="contact-info"[^>]*>([\s\S]*?)</div>', chunk)
        style = re.search(r'class="contact-item"([^>]*)>', chunk)
        info_style = re.search(r'class="contact-info"([^>]*)>', chunk)
        html = ""
        if info:
            html = re.sub(r"<h3[^>]*>[\s\S]*?</h3>", "", info.group(1), count=1).strip()
            html = localise_html(html)
        items.append(
            {
                "icon": icon.group(1) if icon else "",
                "heading": text_of(heading.group(1)) if heading else "",
                "html": html,
                "itemStyle": attr_style(style.group(1)) if style else "",
                "infoStyle": attr_style(info_style.group(1)) if info_style else "",
            }
        )
    kicker = re.search(r'class="content-title style1"[\s\S]*?<span[^>]*>(.*?)</span>', page, re.S)
    heading = re.search(r'class="content-title style1"[\s\S]*?<h2[^>]*>(.*?)</h2>', page, re.S)
    intro = re.search(r'class="content-title style1"[\s\S]*?<p[^>]*>(.*?)</p>', page, re.S)
    hours_heading = re.search(r'<h4[^>]*class="work-time-text"[^>]*>(.*?)</h4>', page, re.S)
    hours = []
    hours_block = re.search(
        r'class="container work-time[^"]*"[^>]*>([\s\S]*?)</div>\s*<ul[^>]*class="social-profile',
        page,
    )
    if hours_block:
        rows = re.findall(
            r'<div[^>]*class="row">\s*<div[^>]*class="col-md-8">\s*<p[^>]*>(.*?)</p>\s*</div>\s*<div[^>]*class="col-md-4">\s*<p[^>]*>(.*?)</p>',
            hours_block.group(1),
            re.S,
        )
        for left, right in rows:
            hours.append({"labelHtml": localise_html(left.strip()), "value": text_of(right)})
    social = []
    social_block = re.search(r'class="social-profile list-style style1"(.*?)</ul>', page, re.S)
    if social_block:
        for a in re.finditer(r"<a href='([^']+)'[^>]*>\s*<i[^>]*class=\"([^\"]+)\"", social_block.group(1)):
            social.append({"href": a.group(1), "icon": a.group(2)})
        for a in re.finditer(r'<a href="([^"]+)"[^>]*>\s*<i[^>]*class="([^"]+)"', social_block.group(1)):
            social.append({"href": a.group(1), "icon": a.group(2)})
    placeholders = {}
    for field in ("Name", "Surname", "Email", "Phone", "Subject", "Message"):
        m = re.search(rf'name="{field}"[^>]*placeholder="([^"]*)"', page)
        if not m:
            m = re.search(rf'placeholder="([^"]*)"[^>]*name="{field}"', page)
        placeholders[field] = decode(m.group(1)) if m else ""
    form_title = re.search(r'class="form-title"[^>]*>(.*?)</h3>', page, re.S)
    submit = re.search(r'<button[^>]*type="submit"[^>]*>(.*?)</button>', page, re.S)
    iframe = re.search(r'<iframe[^>]+src="([^"]+)"', page)
    map_title = re.search(r'<iframe[^>]+title="([^"]*)"', page)
    map_href = re.search(r'class="contact-map">\s*<a[^>]*href="([^"]+)"', page)
    return {
        "urlPath": "",
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
        "items": items,
        "kicker": text_of(kicker.group(1)) if kicker else "",
        "heading": text_of(heading.group(1)) if heading else "",
        "intro": text_of(intro.group(1)) if intro else "",
        "hoursHeading": text_of(hours_heading.group(1)) if hours_heading else "",
        "hours": hours,
        "social": social,
        "formTitle": text_of(form_title.group(1)) if form_title else "",
        "placeholders": placeholders,
        "required": required_messages(page),
        "submitLabel": text_of(submit.group(1)) if submit else "",
        "captchaError": captcha_error(page),
        "mapHref": decode(map_href.group(1)) if map_href else "",
        "mapSrc": decode(iframe.group(1)) if iframe else "",
        "mapTitle": decode(map_title.group(1)) if map_title else "",
    }


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
    if fail:
        raise SystemExit(1)


def main() -> int:
    SNAP.mkdir(parents=True, exist_ok=True)
    print("== training lists")
    cards_by_lang: dict[str, list[dict]] = {}
    list_ui: dict[str, dict] = {}
    for lang, path in LISTS.items():
        print(f"  {lang} {path}")
        page = fetch(path)
        save_snapshot(f"trainings-{lang}.html", page)
        sections = list_sections(page)
        cards = [card for section in sections for card in section["cards"]]
        cards_by_lang[lang] = cards
        list_ui[lang] = {
            "listPath": path,
            "aliases": LIST_ALIASES[lang],
            "breadcrumb": breadcrumb(page),
            "meta": meta(page),
            "detailLabel": next((c["detailLabel"] for c in cards if c["detailLabel"]), ""),
            "sections": [
                {
                    "group": section["group"],
                    "heading": section["heading"],
                    "headingStyle": section["headingStyle"],
                    "sectionStyle": section["sectionStyle"],
                }
                for section in sections
            ],
        }
        print(
            f"    {len(cards)} cards "
            + ", ".join(f"{s['group']}={len(s['cards'])}" for s in sections)
        )

    order = [c["externalId"] for c in cards_by_lang["tr"]]
    print("== training details")
    jobs = []
    for lang in LANGS:
        for card in cards_by_lang[lang]:
            slug = card["slug"]
            path = f"{DETAIL_PREFIX[lang]}/{card['externalId']}/{slug}"
            jobs.append((card["externalId"], lang, path, card))

    details: dict[int, dict] = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(fetch, path): (ext, lang, path, card) for ext, lang, path, card in jobs}
        done = 0
        for future in as_completed(futures):
            ext, lang, path, card = futures[future]
            done += 1
            if done % 25 == 0:
                print(f"  details {done}/{len(jobs)}", flush=True)
            try:
                page = future.result()
            except Exception as error:
                print(f"FAIL detail {path}: {error}", file=sys.stderr)
                continue
            parsed = training_detail(page)
            parsed["urlPath"] = path
            parsed["cardUrlPath"] = card["cardUrlPath"]
            parsed["listTitle"] = card["title"]
            parsed["listImage"] = card["image"]
            parsed["infoLines"] = card["infoLines"]
            parsed["detailLabel"] = card["detailLabel"]
            details.setdefault(ext, {"externalId": ext, "group": card["group"], "translations": {}})
            details[ext]["group"] = card["group"]
            details[ext]["translations"][lang] = parsed
            if ext == order[0] and lang == "tr":
                save_snapshot("training-detail-tr-385.html", page)

    print("== contact")
    contact = {}
    for lang, path in CONTACT.items():
        print(f"  {lang} {path}")
        page = fetch(path)
        save_snapshot(f"contact-{lang}.html", page)
        record = contact_page(page)
        record["urlPath"] = path
        record["aliases"] = CONTACT_ALIASES[lang]
        contact[lang] = record

    print("== media")
    download_media(collect_media(ALL_HTML))

    seed = {
        "trainings": [details[ext] for ext in order if ext in details]
        + [details[ext] for ext in details if ext not in set(order)],
        "listUi": list_ui,
        "contact": contact,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    langs = {lang: sum(1 for row in seed["trainings"] if lang in row["translations"]) for lang in LANGS}
    print("counts trainings", len(seed["trainings"]), "langs", langs)
    print("contact", list(contact))
    print("wrote", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
