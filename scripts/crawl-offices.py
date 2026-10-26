#!/usr/bin/env python3
"""
Crawls every public office and consultant from StartKey.com.tr.

Offices: every card on the live list, detail in tr/en/de.
Consultants: every list page, then every detail in tr/en/de.
Already-complete rows in offices-seed.json are skipped so the run can resume.
"""
from __future__ import annotations

import html as htmlmod
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from office_catalogue import dedupe_catalogue, office_id_from_href, parse_comments, parse_rank_badges, stamp_team_offices

ROOT = Path(__file__).resolve().parents[1]
SNAP = ROOT / "reference" / "snapshots" / "offices"
OUT = ROOT / "api" / "database" / "data" / "offices-seed.json"
PORTFOLIO = ROOT / "api" / "database" / "data" / "portfolio-seed.json"
PUBLIC = ROOT / "web" / "public" / "media"
BASE = "https://startkey.com.tr"
LANGS = ("tr", "en", "de")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
SCOPE = re.compile(r"\s+b-[a-z0-9]{10}(?=[\s>/])")
CDN = re.compile(r"https?://cdnc\.re-os\.com")
IMAGEKIT = re.compile(r"https?://ik\.imagekit\.io/[A-Za-z0-9_-]+/*(?:tr:[^/]*/)?")
ORIGIN = re.compile(r"https?://(?:www\.)?startkey\.com\.tr")
MEDIA_HOST = r"https://(?:cdnc\.re-os\.com|ik\.imagekit\.io/[A-Za-z0-9_-]+)"
MEDIA_URL = re.compile(
    rf'(?:(?:src|srcset|href|data-src)="\s*({MEDIA_HOST}[^"\s]+)|url\(\s*({MEDIA_HOST}[^)\s]+)\s*\))'
)

OFFICE_LIST = {"tr": "/tr/ofisler", "en": "/en/offices", "de": "/de/anbieteren"}
OFFICE_PAGER = {"tr": "/tr/ofislerimiz", "en": "/en/ofislerimiz", "de": "/de/ofislerimiz"}
AGENT_LIST = {"tr": "/tr/danismanlar", "en": "/en/agents", "de": "/de/immobilienmakleren"}
AGENT_PAGER = {"tr": "/tr/danisman-liste", "en": "/en/danisman-liste", "de": "/de/danisman-liste"}
AGENT_PREFIX = {"tr": "/tr/danismanlar", "en": "/en/agents", "de": "/de/immobilienmakleren"}
OFFICE_PREFIX = {"tr": "/tr/ofisler", "en": "/en/offices", "de": "/de/anbieteren"}

ALL_HTML: list[str] = []
_RATE_LOCK = threading.Lock()
_RATE_NEXT = 0.0
RATE_SECONDS = 3.0


def _read_limited(req: urllib.request.Request) -> tuple[str, str]:
    """One live request at a time, with at least 3s after the previous one finishes."""
    global _RATE_NEXT
    with _RATE_LOCK:
        wait = _RATE_NEXT - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                html = response.read().decode("utf-8", "replace")
                final = response.geturl()
        finally:
            _RATE_NEXT = time.monotonic() + RATE_SECONDS
    return final, html


def fetch(path: str) -> str:
    url = path if path.startswith("http") else urllib.parse.urljoin(BASE, path)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/json"})
    last_error = None
    for attempt in range(4):
        try:
            _final, html = _read_limited(req)
            ALL_HTML.append(html)
            return html
        except (urllib.error.URLError, TimeoutError, urllib.error.HTTPError) as error:
            last_error = error
    raise RuntimeError(f"GET {path} failed: {last_error}")


def fetch_final(path: str) -> tuple[str, str]:
    url = path if path.startswith("http") else urllib.parse.urljoin(BASE, path)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    last_error = None
    for attempt in range(4):
        try:
            final, html = _read_limited(req)
            ALL_HTML.append(html)
            return final, html
        except (urllib.error.URLError, TimeoutError, urllib.error.HTTPError) as error:
            last_error = error
    raise RuntimeError(f"GET {path} failed: {last_error}")


def lookup_json(path: str) -> list:
    raw = fetch(path)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return []
    items = payload.get("items") if isinstance(payload, dict) else payload
    return items if isinstance(items, list) else []


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


def text_of(fragment: str) -> str:
    return decode(re.sub(r"<[^>]+>", " ", fragment))


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
                trail.append({"href": a.group(1) or "/", "label": text_of(a.group(2))})
            else:
                a2 = re.search(r"<a[^>]*>(.*?)</a>", item.group(1), re.S | re.I)
                trail.append({"href": None, "label": text_of(a2.group(1) if a2 else item.group(1))})
    return {"heading": heading, "trail": trail}


def office_cards(page: str) -> list[dict]:
    cards = []
    for m in re.finditer(r'<div[^>]*class="agent-card style1">([\s\S]*?)</ul>\s*</div>\s*</div>\s*</div>', page):
        chunk = m.group(0)
        href = re.search(r'<a[^>]*href="([^"]+)"', chunk)
        if not href:
            continue
        path = href.group(1).split("?")[0]
        if "/danismanlar/" in path or "/agents/" in path or "/immobilienmakleren/" in path:
            continue
        name = re.search(r"<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)</a>", chunk)
        img = re.search(r'<img src="([^"]+)"', chunk)
        webp = re.search(r'<source srcset="([^"]+)"', chunk)
        phone = re.search(r'href="(tel:[^"]+)"[^>]*>([\s\S]*?)</a>', chunk)
        email = re.search(r'href="mailto:([^"]+)"', chunk)
        loc = re.search(r'flaticon-pin"></i>\s*([^<]+)', chunk)
        instagram = re.search(r'href="(https://www\.instagram\.com/[^"]+)"', chunk)
        slug = path.strip("/").split("/")[-1]
        cards.append(
            {
                "shortSlug": slug,
                "urlPath": path,
                "name": text_of(name.group(1)) if name else slug,
                "image": localise(img.group(1)) if img else "",
                "imageWebp": localise(webp.group(1)) if webp else "",
                "phoneHref": phone.group(1) if phone else "",
                "phoneLabel": text_of(phone.group(2)) if phone else "",
                "email": decode(email.group(1)) if email else "",
                "location": decode(loc.group(1)) if loc else "",
                "instagram": decode(instagram.group(1)) if instagram else "",
            }
        )
    return cards


def consultant_cards(page: str) -> list[dict]:
    cards = []
    seen: set[int] = set()
    for m in re.finditer(r'<div[^>]*class="agent-card style1">([\s\S]*?)</div>\s*</div>\s*</div>\s*</div>', page):
        chunk = m.group(0)
        href = re.search(r'href="((?:/tr/danismanlar|/en/agents|/de/immobilienmakleren)/\d+/[^"]+)"', chunk)
        if not href:
            continue
        path = href.group(1).split("?")[0]
        id_m = re.search(r"/(\d+)/", path)
        if not id_m:
            continue
        ext = int(id_m.group(1))
        if ext in seen:
            continue
        seen.add(ext)
        slug = path.rstrip("/").split("/")[-1]
        name = re.search(r"<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)</a>", chunk)
        role = re.search(r"<h3[^>]*>[\s\S]*?</h3>\s*<span[^>]*>([\s\S]*?)</span>", chunk)
        img = re.search(r'<img src="([^"]+)"', chunk)
        webp = re.search(r'<source srcset="([^"]+)"', chunk)
        phone = re.search(r'href="(tel:[^"]+)"[^>]*>([\s\S]*?)</a>', chunk)
        email = re.search(r'href="mailto:([^"]+)"', chunk)
        cards.append(
            {
                "externalId": ext,
                "slug": slug,
                "urlPath": path,
                "name": text_of(name.group(1)) if name else "",
                "role": text_of(role.group(1)) if role else "",
                "image": localise(img.group(1)) if img else "",
                "imageWebp": localise(webp.group(1)) if webp else "",
                "phoneHref": phone.group(1) if phone else "",
                "phoneLabel": text_of(phone.group(2)) if phone else "",
                "email": decode(email.group(1)) if email else "",
            }
        )
    return cards


def parse_style6_ids(page: str) -> list[int]:
    ids = []
    seen: set[int] = set()
    for href in re.findall(r'href="/(?:tr/portfoy|en/property|de/immobilien)/(\d+)/', page):
        ext = int(href)
        if ext not in seen:
            seen.add(ext)
            ids.append(ext)
    return ids


def parse_office_detail(page: str, lang: str, url_path: str, card: dict | None) -> dict:
    name = ""
    hn = re.search(r'class="agent-name"[\s\S]*?<h2[^>]*>([\s\S]*?)</h2>', page)
    if hn:
        name = text_of(hn.group(1))
    phone = re.search(r'class="agent-info list-style"[\s\S]*?href="(tel:[^"]+)"[^>]*>([\s\S]*?)</a>', page)
    email = re.search(r'class="agent-info list-style"[\s\S]*?mailto:([^"]+)"', page)
    address = ""
    pin = re.search(r'flaticon-pin"></i>\s*([^<]+)', page)
    if pin:
        address = decode(pin.group(1))
    office_id = ""
    oid = re.search(r"FilterDTO\.OfficeId=(\d+)", page)
    if oid:
        office_id = oid.group(1)
    portfolios_label = ""
    pl = re.search(r'FilterDTO\.OfficeId=\d+"[^>]*>([\s\S]*?)</a>', page)
    if pl:
        portfolios_label = text_of(pl.group(1))
    tabs = []
    for tm in re.finditer(r'data-bs-target="#(tab_\d+)"[^>]*>([\s\S]*?)</button>', page):
        tabs.append({"id": tm.group(1), "label": text_of(tm.group(2))})
    groups = []
    team_pane = re.search(r'id="tab_1"[\s\S]*?(?=<div[^>]*id="tab_2"|$)', page)
    body = team_pane.group(0) if team_pane else ""
    for block in re.finditer(
        r'<h3[^>]*class="highlighted-heading[^"]*"[^>]*>([\s\S]*?)</h3>([\s\S]*?)(?=<h3[^>]*class="highlighted-heading|$)',
        body,
    ):
        members = consultant_cards(block.group(2))
        groups.append(
            {
                "heading": text_of(block.group(1)),
                "consultantIds": [item["externalId"] for item in members],
                "cards": members,
            }
        )
    iframe = re.search(r'<iframe[^>]+src="([^"]+)"', page)
    lat = lon = ""
    if iframe:
        q = re.search(r"[?&]q=([-\d.]+),([-\d.]+)", urllib.parse.unquote(iframe.group(1)))
        if q:
            lat, lon = q.group(1), q.group(2)
    img = re.search(r'class="agent-img"[\s\S]*?<img src="([^"]+)"', page)
    webp = re.search(r'class="agent-img"[\s\S]*?<source srcset="([^"]+)"', page)
    instagram = re.search(r'href="(https://www\.instagram\.com/[^"]+)"', page)
    loc_parts = [p.strip() for p in address.replace(",", "/").split("/") if p.strip()]
    return {
        "urlPath": url_path,
        "name": name or (card or {}).get("name", ""),
        "shortSlug": (card or {}).get("shortSlug") or url_path.strip("/").split("/")[-1],
        "officeId": office_id,
        "image": localise(img.group(1)) if img else (card or {}).get("image", ""),
        "imageWebp": localise(webp.group(1)) if webp else (card or {}).get("imageWebp", ""),
        "phoneHref": phone.group(1) if phone else (card or {}).get("phoneHref", ""),
        "phoneLabel": text_of(phone.group(2)) if phone else (card or {}).get("phoneLabel", ""),
        "email": decode(email.group(1)) if email else (card or {}).get("email", ""),
        "address": address,
        "cityLabel": loc_parts[0] if loc_parts else "",
        "countyLabel": loc_parts[1] if len(loc_parts) > 1 else "",
        "instagram": decode(instagram.group(1)) if instagram else (card or {}).get("instagram", ""),
        "portfoliosLabel": portfolios_label,
        "tabs": tabs,
        "teamGroups": groups,
        "listingIds": parse_style6_ids(page),
        "map": {
            "latitude": lat,
            "longitude": lon,
            "iframeSrc": urllib.parse.unquote(iframe.group(1)).replace("&amp;", "&") if iframe else "",
        },
        "card": card or {},
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
    }


def parse_consultant_detail(page: str, lang: str, url_path: str, card: dict | None) -> dict:
    name = ""
    hn = re.search(r'class="agent-name"[\s\S]*?<h2[^>]*>([\s\S]*?)</h2>', page)
    if hn:
        name = text_of(hn.group(1))
    role = ""
    rs = re.search(r'class="agent-name"[\s\S]*?<span[^>]*>([\s\S]*?)</span>', page)
    if rs:
        role = text_of(rs.group(1))
    email = re.search(r'mailto:([^"]+)"', page)
    phone = re.search(r'href="(tel:[^"]+)"[^>]*>([\s\S]*?)</a>', page)
    office_href = ""
    office_name = ""
    office_id = ""
    info = re.search(r'class="agent-info(?:\s|")([\s\S]*?)</ul>', page)
    info_html = info.group(1) if info else page
    om = re.search(
        r'href="((?:/(?:tr|en|de))?/(?:ofisler|offices|anbieteren)/\d+/[^"]+)"[^>]*>([\s\S]*?)</a>',
        info_html,
    )
    if not om:
        om = re.search(r'href="(/(?:(?:tr|en|de)/)?[a-z0-9]+(?:-[a-z0-9]+)*)"[^>]*>([\s\S]*?)</a>', info_html)
    if om:
        office_href = om.group(1).split("?")[0]
        office_name = text_of(om.group(2))
        office_id = office_id_from_href(office_href)
    tabs = []
    for tm in re.finditer(r'data-bs-target="#(tab_\d+)"[^>]*>([\s\S]*?)</button>', page):
        tabs.append({"id": tm.group(1), "label": text_of(tm.group(2))})
    bio = ""
    pane = re.search(r'id="tab_1"[^>]*>([\s\S]*?)</div>\s*<div[^>]*id="tab_2"', page)
    if pane:
        bio = re.sub(r"<div[^>]*>|</div>", "", pane.group(1))
        bio = SCOPE.sub("", bio).strip()
    all_label = ""
    al = re.search(r'FilterDTO\.UserId=\d+"[^>]*>([\s\S]*?)</a>', page)
    if al:
        all_label = text_of(al.group(1))
    comment_heading = ""
    ch = re.search(r'id="tab_3"[\s\S]*?<h4[^>]*>([\s\S]*?)</h4>', page)
    if ch:
        comment_heading = text_of(ch.group(1))
    placeholders = {}
    for field in ("FirstName", "LastName", "Email", "Phone"):
        ph = re.search(rf'placeholder="([^"]*)"[^>]*id="{field}"|id="{field}"[^>]*placeholder="([^"]*)"', page)
        placeholders[field] = decode((ph.group(1) or ph.group(2)) if ph else "")
    msg = re.search(r'id="Comment"[^>]*placeholder="([^"]*)"|placeholder="([^"]*)"[^>]*id="Comment"', page)
    if not msg:
        ta = re.search(r'<textarea[^>]*id="Comment"[^>]*>', page)
        if ta:
            ph = re.search(r'placeholder="([^"]*)"', ta.group(0))
            placeholders["Comment"] = decode(ph.group(1)) if ph else ""
        else:
            placeholders["Comment"] = ""
    else:
        placeholders["Comment"] = decode(msg.group(1) or msg.group(2))
    submit = re.search(r'id="form"[\s\S]*?<button[^>]*>([\s\S]*?)</button>', page)
    captcha = re.search(r"Captcha[^<]{0,40}", page)
    img = re.search(r'class="agent-img"[\s\S]*?<img src="([^"]+)"', page)
    webp = re.search(r'class="agent-img"[\s\S]*?<source srcset="([^"]+)"', page)
    id_m = re.search(r"/(\d+)/", url_path)
    return {
        "urlPath": url_path,
        "name": name or (card or {}).get("name", ""),
        "role": role or (card or {}).get("role", ""),
        "image": localise(img.group(1)) if img else (card or {}).get("image", ""),
        "imageWebp": localise(webp.group(1)) if webp else (card or {}).get("imageWebp", ""),
        "email": decode(email.group(1)) if email else (card or {}).get("email", ""),
        "phoneHref": phone.group(1) if phone else (card or {}).get("phoneHref", ""),
        "phoneLabel": text_of(phone.group(2)) if phone else (card or {}).get("phoneLabel", ""),
        "officeId": office_id,
        "officeHref": office_href,
        "officeName": office_name,
        "tabs": tabs,
        "bioHtml": bio,
        "listingIds": parse_style6_ids(page),
        "allListingsLabel": all_label,
        "commentHeading": comment_heading,
        "comments": parse_comments(page),
        "form": {
            "placeholders": placeholders,
            "submitLabel": text_of(submit.group(1)) if submit else "",
            "captchaError": decode(captcha.group(0)) if captcha else "",
        },
        "card": card or {},
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
        "externalId": int(id_m.group(1)) if id_m else (card or {}).get("externalId"),
        "slug": url_path.rstrip("/").split("/")[-1],
        "rankBadges": parse_rank_badges(page),
    }


def list_ui_office(page: str, lang: str) -> dict:
    title = re.search(r'id="search-text-title"[\s\S]*?<span[^>]*>([\s\S]*?)</span>', page)
    submit = re.search(r'id="office-submit"[^>]*>([\s\S]*?)<i', page)
    found = re.search(r'flaticon-office-building"></i>\s*([^<]+)', page)
    found_template = ""
    if found:
        found_template = re.sub(r"\d[\d.\s]*", "{count} ", text_of(found.group(1)), count=1).strip()
        found_template = re.sub(r"\s+", " ", found_template)
    ph = re.search(r'id="SearchText"[^>]*placeholder="([^"]*)"|placeholder="([^"]*)"[^>]*id="SearchText"', page)
    return {
        "listPath": OFFICE_LIST[lang],
        "aliases": [OFFICE_LIST[lang], OFFICE_PAGER[lang]],
        "formAction": OFFICE_LIST[lang],
        "pagerBase": OFFICE_PAGER[lang],
        "perPage": 18,
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
        "searchHeading": text_of(title.group(1)) if title else "",
        "searchPlaceholder": decode((ph.group(1) or ph.group(2)) if ph else ""),
        "submitLabel": text_of(submit.group(1)) if submit else "",
        "foundTemplate": found_template or "{count}",
        "bindUrls": {
            "countries": f"/{lang}/Lookup/EnteredOfficeCountries",
            "cities": f"/{lang}/Lookup/EnteredOfficeCitiesByCountryId",
            "counties": f"/{lang}/Lookup/Counties",
        },
    }


def list_ui_consultant(page: str, lang: str) -> dict:
    title = re.search(r'id="search-text-title"[\s\S]*?<span[^>]*>([\s\S]*?)</span>', page)
    submit = re.search(r'id="office-submit"[^>]*>([\s\S]*?)<i', page)
    found = re.search(r'flaticon-user"></i>\s*([^<]+)', page)
    found_template = ""
    if found:
        found_template = re.sub(r"\d[\d.\s]*", "{count} ", text_of(found.group(1)), count=1).strip()
        found_template = re.sub(r"\s+", " ", found_template)
    placeholders = {}
    for field, key in (("FilterDTO_Firstname", "firstName"), ("FilterDTO_Lastname", "lastName")):
        ph = re.search(rf'placeholder="([^"]*)"[^>]*id="{field}"|id="{field}"[^>]*placeholder="([^"]*)"', page)
        placeholders[key] = decode((ph.group(1) or ph.group(2)) if ph else "")
    return {
        "listPath": AGENT_LIST[lang],
        "aliases": [AGENT_LIST[lang], AGENT_PAGER[lang]],
        "formAction": AGENT_LIST[lang],
        "pagerBase": AGENT_PAGER[lang],
        "perPage": 15,
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
        "searchHeading": text_of(title.group(1)) if title else "",
        "submitLabel": text_of(submit.group(1)) if submit else "",
        "foundTemplate": found_template or "{count}",
        "placeholders": placeholders,
        "bindUrls": {
            "offices": f"/{lang}/Lookup/GetAllOffices",
            "cities": f"/{lang}/Lookup/Cities",
        },
    }


def collect_media(pages: list[str]) -> dict[str, str]:
    urls: set[str] = set()
    for page in pages:
        for match in MEDIA_URL.finditer(page):
            urls.add(match.group(1) or match.group(2))
    targets: dict[str, str] = {}
    for url in urls:
        path = re.sub(r"^https://ik\.imagekit\.io/[A-Za-z0-9_-]+/*(?:tr:[^/]*/)?", "", url)
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

    def one(item: tuple[str, str]) -> tuple[str, str]:
        dest, url = item
        path = PUBLIC / dest
        if path.exists() and path.stat().st_size > 0 and not force:
            return ("skip", dest)
        try:
            headers = {"User-Agent": UA, "Accept": "image/webp,*/*" if dest.endswith(".webp") else "*/*"}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=90) as response:
                payload = response.read()
            if not payload:
                raise ValueError("empty")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
            return ("ok", dest)
        except Exception as error:
            return ("fail", f"{url}: {error}")

    with ThreadPoolExecutor(max_workers=8) as pool:
        for status, info in pool.map(one, sorted(targets.items())):
            if status == "ok":
                ok += 1
            elif status == "skip":
                skip += 1
            else:
                fail += 1
                print(f"FAIL media {info}", file=sys.stderr)
    print(f"media: downloaded={ok} skipped={skip} failed={fail}")


def listing_consultant_ids() -> list[int]:
    if not PORTFOLIO.is_file():
        return []
    data = json.loads(PORTFOLIO.read_text(encoding="utf-8"))
    ids = []
    seen: set[int] = set()
    for row in data.get("listings", []):
        raw = row.get("consultantId")
        if raw and str(raw).isdigit():
            ext = int(raw)
            if ext not in seen:
                seen.add(ext)
                ids.append(ext)
    return ids


def short_path(lang: str, slug: str) -> str:
    return f"/{slug}" if lang == "tr" else f"/{lang}/{slug}"


def consultant_fetch_slug(team_slug: str, stored: str, list_slug: str) -> str:
    """Office-page slug wins when it differs from the consultant-list slug."""
    return team_slug or stored or list_slug or ""


def main() -> int:
    SNAP.mkdir(parents=True, exist_ok=True)
    print("== office lists")
    office_ui: dict[str, dict] = {}
    office_cards_by_slug: dict[str, dict[str, dict]] = {lang: {} for lang in LANGS}
    tr_order: list[str] = []
    for lang in LANGS:
        first = fetch(OFFICE_LIST[lang])
        if lang == "tr":
            (SNAP / "list-tr.html").write_text(first, encoding="utf-8")
        office_ui[lang] = list_ui_office(first, lang)
        pages_idx = [int(p) for p in re.findall(r"pageIndex=(\d+)", first)]
        last_page = max(pages_idx) if pages_idx else 1
        pages = [first]
        for page_index in range(2, last_page + 1):
            pages.append(fetch(f"{OFFICE_PAGER[lang]}?pageIndex={page_index}"))
        for page in pages:
            for card in office_cards(page):
                office_cards_by_slug[lang][card["shortSlug"]] = card
                if lang == "tr" and card["shortSlug"] not in tr_order:
                    tr_order.append(card["shortSlug"])
        print(f"  {lang} cards {len(office_cards_by_slug[lang])}")
    print(f"offices {len(tr_order)}")

    existing = {}
    if OUT.is_file():
        try:
            existing = json.loads(OUT.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}
    existing_offices = {row.get("shortSlug"): row for row in existing.get("offices", []) if row.get("shortSlug")}
    existing_consultants = {int(row["externalId"]): row for row in existing.get("consultants", []) if row.get("externalId")}
    print(f"resume offices {len(existing_offices)} consultants {len(existing_consultants)}")

    print("== office details")
    offices: dict[str, dict] = {slug: row for slug, row in existing_offices.items() if slug in set(tr_order)}
    jobs = []
    for index, slug in enumerate(tr_order):
        rec = offices.get(slug) or {}
        have = set((rec.get("translations") or {}).keys())
        for lang in LANGS:
            if lang in have:
                continue
            jobs.append((slug, lang, short_path(lang, slug), index))
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_final, path): (slug, lang, path, index) for slug, lang, path, index in jobs}
        done = 0
        for future in as_completed(futures):
            slug, lang, path, index = futures[future]
            done += 1
            if done % 20 == 0 or done == len(jobs):
                print(f"  office details {done}/{len(jobs)}", flush=True)
            try:
                final_url, page = future.result()
            except Exception as error:
                print(f"FAIL office {path}: {error}", file=sys.stderr)
                continue
            local_path = urllib.parse.urlparse(final_url).path
            parsed = parse_office_detail(page, lang, local_path, office_cards_by_slug[lang].get(slug))
            rec = offices.setdefault(
                slug,
                {
                    "shortSlug": slug,
                    "listRank": index,
                    "externalId": None,
                    "countryId": "212",
                    "cityLabel": parsed.get("cityLabel") or "",
                    "countyLabel": parsed.get("countyLabel") or "",
                    "latitude": parsed.get("map", {}).get("latitude") or "",
                    "longitude": parsed.get("map", {}).get("longitude") or "",
                    "translations": {},
                },
            )
            if parsed.get("officeId"):
                rec["externalId"] = int(parsed["officeId"])
            if parsed.get("cityLabel"):
                rec["cityLabel"] = parsed["cityLabel"]
            if parsed.get("countyLabel"):
                rec["countyLabel"] = parsed["countyLabel"]
            rec["translations"][lang] = parsed

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "sample": {"offices": len(offices), "consultants": 0, "checkpoint": True},
                "officeUi": office_ui,
                "consultantUi": {},
                "offices": [offices[s] for s in tr_order if s in offices],
                "consultants": [],
                "lookups": {},
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"checkpoint offices {len(offices)}", flush=True)

    print("== consultant lists")
    consultant_ui: dict[str, dict] = {}
    cards_by_id: dict[int, dict[str, dict]] = {}
    tr_consultant_order: list[int] = []
    for lang in LANGS:
        first = fetch(AGENT_LIST[lang])
        if lang == "tr":
            (SNAP / "agents-tr.html").write_text(first, encoding="utf-8")
        consultant_ui[lang] = list_ui_consultant(first, lang)
        pages_idx = [int(p) for p in re.findall(r"pageIndex=(\d+)", first)]
        last_page = max(pages_idx) if pages_idx else 1
        pages = [first]
        for page_index in range(2, last_page + 1):
            pages.append(fetch(f"{AGENT_PAGER[lang]}?pageIndex={page_index}"))
            if page_index % 10 == 0:
                print(f"  {lang} list page {page_index}/{last_page}", flush=True)
        for page in pages:
            for card in consultant_cards(page):
                cards_by_id.setdefault(card["externalId"], {})[lang] = card
                if lang == "tr" and card["externalId"] not in tr_consultant_order:
                    tr_consultant_order.append(card["externalId"])
        print(f"  {lang} list cards {sum(1 for v in cards_by_id.values() if lang in v)}")

    team_cards: dict[int, dict[str, dict]] = {}
    team_ids: set[int] = set()
    for rec in offices.values():
        for lang, trans in rec["translations"].items():
            for group in trans.get("teamGroups") or []:
                for card in group.get("cards") or []:
                    ext = card["externalId"]
                    team_ids.add(ext)
                    team_cards.setdefault(ext, {})[lang] = card
                    cards_by_id.setdefault(ext, {}).setdefault(lang, card)
    detail_ids = list(tr_consultant_order)
    for ext in sorted(team_ids | set(listing_consultant_ids()) | set(cards_by_id)):
        if ext not in detail_ids:
            detail_ids.append(ext)
    print(f"consultant details to cover {len(detail_ids)} team-card ids {len(team_ids)}")

    print("== consultant details")
    consultants: dict[int, dict] = dict(existing_consultants)
    cjobs = []
    for index, ext in enumerate(detail_ids):
        rec = consultants.get(ext) or {}
        if rec.get("listRank") is None:
            rec["listRank"] = index
            consultants[ext] = rec
        else:
            rec["listRank"] = index
        have = set((rec.get("translations") or {}).keys())
        full = bool(rec.get("hasFullDetail")) and have == set(LANGS)
        if full:
            continue
        tr_card = cards_by_id.get(ext, {}).get("tr") or (rec.get("translations") or {}).get("tr", {}).get("card")
        team_slug = ((team_cards.get(ext) or {}).get("tr") or {}).get("slug") or ""
        slug = consultant_fetch_slug(team_slug, rec.get("slug") or "", (tr_card or {}).get("slug") or "") or str(ext)
        for lang in LANGS:
            if lang in have and rec.get("hasFullDetail"):
                continue
            cjobs.append((ext, lang, f"{AGENT_PREFIX[lang]}/{ext}/{slug}"))
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_final, path): (ext, lang, path) for ext, lang, path in cjobs}
        done = 0
        for future in as_completed(futures):
            ext, lang, path = futures[future]
            done += 1
            if done % 20 == 0 or done == len(cjobs):
                print(f"  consultant details {done}/{len(cjobs)}", flush=True)
            try:
                final_url, page = future.result()
            except Exception as error:
                print(f"FAIL consultant {path}: {error}", file=sys.stderr)
                continue
            local_path = urllib.parse.urlparse(final_url).path
            if "/danismanlar/" not in local_path and "/agents/" not in local_path and "/immobilienmakleren/" not in local_path:
                continue
            parsed = parse_consultant_detail(page, lang, local_path, cards_by_id.get(ext, {}).get(lang))
            rec = consultants.setdefault(
                ext,
                {
                    "externalId": ext,
                    "slug": parsed.get("slug") or str(ext),
                    "officeId": parsed.get("officeId") or "",
                    "firstName": "",
                    "lastName": "",
                    "hasFullDetail": False,
                    "listRank": detail_ids.index(ext) if ext in detail_ids else 10**9,
                    "translations": {},
                },
            )
            rec["externalId"] = ext
            rec["slug"] = ((team_cards.get(ext) or {}).get("tr") or {}).get("slug") or parsed.get("slug") or rec.get("slug") or str(ext)
            if parsed.get("officeId"):
                rec["officeId"] = parsed["officeId"]
            elif not rec.get("officeId") and parsed.get("officeHref"):
                rec["officeHref"] = parsed["officeHref"]
            incoming = parsed.get("rankBadges") or []
            if lang == "tr":
                rec["rankBadges"] = incoming or rec.get("rankBadges") or []
            elif not rec.get("rankBadges"):
                rec["rankBadges"] = incoming
            rec.setdefault("translations", {})
            rec["translations"][lang] = parsed
            rec["hasFullDetail"] = set(rec["translations"]) == set(LANGS)
            if lang == "tr" and parsed.get("name"):
                parts = parsed["name"].split()
                rec["firstName"] = parts[0] if parts else rec.get("firstName") or ""
                rec["lastName"] = " ".join(parts[1:]) if len(parts) > 1 else rec.get("lastName") or ""
            if done % 80 == 0:
                OUT.write_text(
                    json.dumps(
                        {
                            "sample": {"offices": len(offices), "consultants": len(consultants), "checkpoint": True},
                            "officeUi": office_ui,
                            "consultantUi": consultant_ui,
                            "offices": [offices[s] for s in tr_order if s in offices],
                            "consultants": list(consultants.values()),
                            "lookups": {},
                        },
                        ensure_ascii=False,
                        indent=2,
                    ),
                    encoding="utf-8",
                )
                print(f"  checkpoint consultants={len(consultants)}", flush=True)

    # Card-only fallback if a detail fetch never landed.
    stub_count = 0
    for ext in detail_ids:
        rec = consultants.get(ext)
        if rec and rec.get("hasFullDetail") and set((rec.get("translations") or {})) == set(LANGS):
            continue
        if rec and (rec.get("translations") or {}):
            continue
        tr_card = cards_by_id.get(ext, {}).get("tr")
        if not tr_card:
            continue
        slug = tr_card.get("slug") or str(ext)
        rec = {
            "externalId": ext,
            "slug": slug,
            "officeId": "",
            "firstName": (tr_card.get("name") or "").split()[0] if tr_card.get("name") else "",
            "lastName": " ".join((tr_card.get("name") or "").split()[1:]),
            "hasFullDetail": False,
            "translations": {},
        }
        for lang in LANGS:
            card = cards_by_id.get(ext, {}).get(lang) or tr_card
            rec["translations"][lang] = {
                "urlPath": f"{AGENT_PREFIX[lang]}/{ext}/{slug}",
                "name": card.get("name") or tr_card.get("name") or "",
                "role": card.get("role") or tr_card.get("role") or "",
                "image": card.get("image") or "",
                "imageWebp": card.get("imageWebp") or "",
                "email": card.get("email") or "",
                "phoneHref": card.get("phoneHref") or "",
                "phoneLabel": card.get("phoneLabel") or "",
                "officeId": "",
                "officeHref": "",
                "officeName": "",
                "tabs": [],
                "bioHtml": "",
                "listingIds": [],
                "allListingsLabel": "",
                "commentHeading": "",
                "form": {"placeholders": {}, "submitLabel": "", "captchaError": ""},
                "card": card,
                "breadcrumb": {"heading": card.get("name") or "", "trail": []},
                "meta": {"title": card.get("name") or "", "description": None, "ogTitle": card.get("name") or "", "ogImage": card.get("image") or ""},
                "externalId": ext,
                "slug": slug,
            }
        consultants[ext] = rec
        stub_count += 1
    print(f"consultants stored {len(consultants)} (stubs {stub_count})")

    print("== city lookups")
    cities_lookup: dict[str, dict] = {}
    for lang in LANGS:
        for position, item in enumerate(lookup_json(f"/{lang}/Lookup/Cities")):
            if item.get("id") == "":
                continue
            rec = cities_lookup.setdefault(
                str(item["id"]),
                {"externalId": str(item["id"]), "parentExternalId": None, "position": position, "translations": {}},
            )
            rec["translations"][lang] = item["text"]

    missing_offices = [s for s, row in offices.items() if not row.get("externalId")]
    if missing_offices:
        print(f"WARN offices without id: {missing_offices[:12]} ({len(missing_offices)})", file=sys.stderr)

    office_rows = [offices[s] for s in tr_order if s in offices]
    stamp_team_offices(office_rows, consultants)
    consultant_rows = [consultants[i] for i in detail_ids if i in consultants] + [
        consultants[i] for i in consultants if i not in set(detail_ids)
    ]
    office_rows, consultant_rows, dedupe_report = dedupe_catalogue(office_rows, consultant_rows)
    print(
        f"dedupe aliases={len(dedupe_report['droppedOfficeAliases'])} "
        f"mergedBrokers={len(dedupe_report['mergedBrokers'])} "
        f"consultants={len(consultant_rows)}"
    )

    payload = {
        "sample": {
            "offices": len(office_rows),
            "consultants": len(consultant_rows),
            "consultantFullDetail": sum(1 for row in consultant_rows if row.get("hasFullDetail")),
            "liveConsultants": len(detail_ids),
            "selection": "all public offices and consultants from the live lists, tr/en/de",
            "droppedOfficeAliases": dedupe_report["droppedOfficeAliases"],
            "mergedBrokers": dedupe_report["mergedBrokers"],
        },
        "officeUi": office_ui,
        "consultantUi": consultant_ui,
        "offices": office_rows,
        "consultants": consultant_rows,
        "lookups": {"cities": list(cities_lookup.values())},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"WROTE {OUT} offices={len(payload['offices'])} consultants={len(payload['consultants'])}")

    print("== media")
    download_media(collect_media(ALL_HTML))
    print("DONE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
