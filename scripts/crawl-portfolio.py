#!/usr/bin/env python3
"""
Crawls every public listing from StartKey.com.tr for the Portföylerimiz templates.

TR list order is the source of list_rank. Each listing is fetched in tr / en / de.
Already-complete rows in portfolio-seed.json are skipped so the run can resume.
Assets are stored under web/public/media.
"""
from __future__ import annotations

import html as htmlmod
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP = ROOT / "reference" / "snapshots" / "portfolio"
OUT = ROOT / "api" / "database" / "data" / "portfolio-seed.json"
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

LIST_PATHS = {
    "tr": "/tr/portfoy",
    "en": "/en/property",
    "de": "/de/immobilien",
}
LIST_ALIASES = {
    "tr": ["/tr/portfoy", "/tr/property"],
    "en": ["/en/property", "/en/portfoy"],
    "de": ["/de/immobilien", "/de/portfoy"],
}
FORM_ACTION = {
    "tr": "/tr/portfoy",
    "en": "/en/portfoy",
    "de": "/de/portfoy",
}
DETAIL_PREFIX = {
    "tr": "/tr/portfoy",
    "en": "/en/property",
    "de": "/de/immobilien",
}
AD_TYPE_IDS = {"1", "2", "4", "6"}
HOME_PATHS = {"", "/", "/tr", "/en", "/de"}

ALL_HTML: list[str] = []


def fetch(path: str) -> str:
    url = path if path.startswith("http") else urllib.parse.urljoin(BASE, path)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/json"})
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                html = response.read().decode("utf-8", "replace")
                ALL_HTML.append(html)
                return html
        except (urllib.error.URLError, TimeoutError, urllib.error.HTTPError) as error:
            last_error = error
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"GET {path} failed: {last_error}")


def fetch_final(path: str) -> tuple[str, str]:
    url = path if path.startswith("http") else urllib.parse.urljoin(BASE, path)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                html = response.read().decode("utf-8", "replace")
                ALL_HTML.append(html)
                return response.geturl(), html
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

    fragment = re.sub(rf'(src|srcset|href|data-src)="({MEDIA_HOST}[^"]+)"', repl, fragment)
    fragment = ORIGIN.sub("", fragment)
    return SCOPE.sub("", fragment)


def text_of(fragment: str) -> str:
    fragment = re.sub(r"<sup[^>]*>\s*2\s*</sup>", "²", fragment)
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


def listing_cards(page: str) -> list[dict]:
    cards = []
    seen: set[int] = set()
    for m in re.finditer(r'<div[^>]*class="property-card style3">([\s\S]*?)</ul>\s*</div>\s*</div>', page):
        chunk = m.group(0)
        href_m = re.search(r'<a href="(/[^"]+/\d+/[^"]+)"', chunk)
        if not href_m:
            continue
        href = href_m.group(1)
        id_m = re.search(r"/(\d+)/", href)
        if not id_m:
            continue
        ext = int(id_m.group(1))
        if ext in seen:
            continue
        seen.add(ext)
        img = re.search(r'<img src="([^"]+)"', chunk)
        webp = re.search(r'<source srcset="([^"]+)"', chunk)
        estate = re.search(r'class="property-estatestatus">(.*?)</span>', chunk, re.S)
        overlay = re.search(r'class="property-img"[\s\S]*?class="property-status">(.*?)</span>', chunk, re.S)
        ad_type_m = re.search(
            r'class="property-status-wrap"[\s\S]*?<span[^>]*class="property-status"[^>]*>\s*(<i[^>]*class="([^"]+)"></i>)?\s*([^<]+)',
            chunk,
        )
        badge = re.search(r'class="property-status-wrap"[\s\S]*?<img[^>]*src="([^"]+)"', chunk)
        price = re.search(r'class="property-price">(.*?)</p>', chunk, re.S)
        title = re.search(r'class="prop-title"[\s\S]*?<a href="[^"]+">(.*?)</a>', chunk, re.S)
        loc = re.search(r'flaticon-location"></i>\s*([^<]+)', chunk)
        update = re.search(r"<p[^>]*>\s*([^<]*Güncelleme[^<]*|[^<]*Update[^<]*|[^<]*Aktual[^<]*|[^<]*Tarih[^<]*)</p>", chunk, re.I)
        if not update:
            update = re.search(r"<p[^>]*>\s*([^<]*:\s*\d{2}\.\d{2}\.\d{4}[^<]*)</p>", chunk)
        features = []
        for li in re.finditer(r'<li[^>]*class="feature-li">([\s\S]*?)</li>', chunk):
            inner = li.group(1)
            if "btn style2" in inner:
                continue
            icon = re.search(r'class="([^"]+)"', inner)
            features.append({"icon": icon.group(1) if icon else "", "text": text_of(inner)})
        detail = re.search(r'class="btn style2"[^>]*>(.*?)<i', chunk, re.S)
        cards.append(
            {
                "externalId": ext,
                "urlPath": href.split("?")[0],
                "image": localise(img.group(1)) if img else "",
                "imageWebp": localise(webp.group(1)) if webp else "",
                "processType": text_of(estate.group(1)) if estate else "",
                "adSubType": text_of(overlay.group(1)) if overlay else "",
                "adTypeIcon": ad_type_m.group(2) if ad_type_m and ad_type_m.group(2) else "",
                "adType": decode(ad_type_m.group(3)) if ad_type_m else "",
                "badgeImage": localise(badge.group(1)) if badge else "",
                "price": text_of(price.group(1)) if price else "",
                "title": text_of(title.group(1)) if title else "",
                "location": decode(loc.group(1)) if loc else "",
                "updatedLabel": text_of(update.group(1)) if update else "",
                "features": features,
                "detailLabel": text_of(detail.group(1)) if detail else "",
            }
        )
    return cards


def parse_options(select_html: str) -> list[dict]:
    options = []
    for m in re.finditer(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', select_html, re.S):
        options.append({"value": decode(m.group(1)), "label": text_of(m.group(2))})
    return options


def list_ui(page: str, lang: str) -> dict:
    heading = re.search(r'id="filter-widget">\s*<h4[^>]*>(.*?)</h4>', page, re.S)
    mobile = re.search(r'id="mobile-filter-btn">([^<]+)', page)
    keyword = re.search(
        r'<input[^>]*(?:placeholder="([^"]*)"[^>]*id="FilterDTO_Keyword"|id="FilterDTO_Keyword"[^>]*placeholder="([^"]*)")',
        page,
    )
    submit = re.search(r'class="btn style2 d-block w-100">([^<]+)', page)
    found = re.search(r'ri-building-2-fill"></i>\s*([^<]+)', page)
    found_template = ""
    if found:
        found_template = re.sub(r"\d[\d.\s]*", "{count} ", text_of(found.group(1)), count=1).strip()
        found_template = re.sub(r"\s+", " ", found_template)
    labels = {}
    for block in re.finditer(
        r'<label[^>]*id="search-text-1[^"]*"[^>]*>(.*?)</label>\s*(?:<select[^>]*id="([^"]+)"|<input[^>]*id="([^"]+)")',
        page,
        re.S,
    ):
        key = block.group(2) or block.group(3) or ""
        labels[key] = text_of(block.group(1))
    ad_select = re.search(r'id="FilterDTO_AdTypeId"[\s\S]*?</select>', page)
    sort_select = re.search(r'id="sorting-type-select"[\s\S]*?</select>', page)
    placeholders = {
        "keyword": decode(keyword.group(1) or keyword.group(2)) if keyword else "",
        "minPrice": "Min",
        "maxPrice": "Max",
        "minArea": "Min m²" if lang == "tr" else ("Min m²" if lang == "en" else "Min m²"),
        "maxArea": "Max m²" if lang == "tr" else ("Max m²" if lang == "en" else "Max m²"),
    }
    min_ph = re.search(r'id="FilterDTO_MinPrice"[^>]*placeholder="([^"]+)"', page)
    max_ph = re.search(r'id="FilterDTO_MaxPrice"[^>]*placeholder="([^"]+)"', page)
    min_area = re.search(r'id="FilterDTO_MinCleanArea"[^>]*placeholder="([^"]+)"', page)
    max_area = re.search(r'id="FilterDTO_MaxCleanArea"[^>]*placeholder="([^"]+)"', page)
    if min_ph:
        placeholders["minPrice"] = decode(min_ph.group(1))
    if max_ph:
        placeholders["maxPrice"] = decode(max_ph.group(1))
    if min_area:
        placeholders["minArea"] = decode(min_area.group(1))
    if max_area:
        placeholders["maxArea"] = decode(max_area.group(1))
    return {
        "listPath": LIST_PATHS[lang],
        "aliases": LIST_ALIASES[lang],
        "formAction": FORM_ACTION[lang],
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
        "filterHeading": text_of(heading.group(1)) if heading else "",
        "mobileFilterOpen": decode(mobile.group(1)) if mobile else "",
        "submitLabel": text_of(submit.group(1)) if submit else "",
        "foundTemplate": found_template or "{count}",
        "labels": labels,
        "placeholders": placeholders,
        "adTypes": parse_options(ad_select.group(0)) if ad_select else [],
        "sortOptions": parse_options(sort_select.group(0)) if sort_select else [],
        "bindUrls": {
            "processTypes": f"/{lang}/lookup/ProcessTypes",
            "currencies": f"/{lang}/lookup/Currencies",
            "countries": f"/{lang}/Lookup/EnteredCountries",
            "cities": f"/{lang}/Lookup/EnteredCitiesByCountryId",
            "counties": f"/{lang}/Lookup/Counties",
            "districts": f"/{lang}/Lookup/Districts",
            "offices": f"/{lang}/Lookup/GetAllOffices",
            "users": f"/{lang}/Lookup/Users",
        },
    }


def parse_price_amount(price: str) -> int:
    digits = re.sub(r"[^\d]", "", price)
    return int(digits) if digits else 0


def parse_date(label: str) -> str:
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", label)
    if not m:
        return ""
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"


def parse_area(text: str) -> int:
    m = re.search(r"(\d[\d.]*)", text.replace(".", "").replace(",", ""))
    if not m:
        m = re.search(r"(\d+)", text)
    return int(re.sub(r"\D", "", m.group(1))) if m else 0


def currency_id_from_price(price: str) -> str:
    if "€" in price or "EUR" in price.upper():
        return "3"
    if "$" in price or "USD" in price.upper():
        return "2"
    if "£" in price or "GBP" in price.upper() or "Sterlin" in price:
        return "4"
    return "1"


def parse_related(page: str) -> tuple[str, list[dict]]:
    heading = ""
    h = re.search(r'class="blog-title"[^>]*>([^<]*Danışman[^<]*|[^<]*Consultant[^<]*|[^<]*Berater[^<]*|[^<]*Other Portfolios[^<]*|[^<]*Diğer Portföy[^<]*)</h2>', page, re.I)
    if h:
        heading = text_of(h.group(1))
    else:
        h = re.search(r'<h2 class="blog-title" style="text-align:center">([^<]+)</h2>', page)
        heading = text_of(h.group(1)) if h else ""
    items = []
    seen: set[int] = set()
    carousel = re.search(r'id="propcarousel">([\s\S]*?)</div>\s*</div>\s*</section>', page)
    body = carousel.group(1) if carousel else ""
    for m in re.finditer(r'<div[^>]*class="property-card style6">([\s\S]*?)</ul>\s*</div>\s*</div>', body):
        chunk = m.group(0)
        href = re.search(r'<a href="(/[^"]+/\d+/[^"]+)"', chunk)
        if not href:
            continue
        path = href.group(1)
        id_m = re.search(r"/(\d+)/", path)
        if not id_m:
            continue
        ext = int(id_m.group(1))
        if ext in seen:
            continue
        seen.add(ext)
        items.append({"externalId": ext, "urlPath": path.split("?")[0]})
    return heading, items


def parse_gallery(page: str) -> list[dict]:
    slides = []
    main = re.search(r'id="mainCarousel"[\s\S]*?</div>\s*<div id="thumbCarousel"', page)
    body = main.group(0) if main else ""
    for m in re.finditer(r'<div class="carousel__slide"([^>]*)>([\s\S]*?)</div>', body):
        attrs, inner = m.group(1), m.group(2)
        src = re.search(r'data-src="([^"]+)"', attrs)
        caption = re.search(r'data-caption="([^"]*)"', attrs)
        img = re.search(r'<img src="([^"]+)"', inner)
        webp = re.search(r'<source srcset="([^"]+)"', inner)
        if not src and not img:
            continue
        original = src.group(1) if src else (img.group(1).split("?")[0] if img else "")
        slides.append(
            {
                "original": localise(original),
                "image": localise(img.group(1)) if img else localise(original),
                "imageWebp": localise(webp.group(1)) if webp else "",
                "caption": decode(caption.group(1)) if caption else "",
            }
        )
    thumbs = []
    thumb = re.search(r'id="thumbCarousel"[\s\S]*?</div>\s*</div>\s*</div>', page)
    if thumb:
        for m in re.finditer(r'<img src="([^"]+)"', thumb.group(0)):
            thumbs.append(localise(m.group(1)))
    for i, slide in enumerate(slides):
        slide["thumb"] = thumbs[i] if i < len(thumbs) else slide["image"]
    return slides


def parse_specs(page: str) -> list[dict]:
    specs = []
    block = re.search(r'class="dw-proprty-info"[^>]*>([\s\S]*?)</ul>', page)
    if not block:
        return specs
    for li in re.finditer(r"<li[^>]*>([\s\S]*?)</li>", block.group(1)):
        strong = re.search(r"<strong[^>]*>([\s\S]*?)</strong>", li.group(1))
        label = text_of(strong.group(1)) if strong else ""
        value = text_of(li.group(1)[strong.end() :] if strong else li.group(1))
        specs.append({"label": label.rstrip(":").strip(), "value": value})
    return specs


def parse_features(page: str) -> list[dict]:
    groups = []
    for heading_html, body in iter_detail_sections(page):
        heading = text_of(heading_html)
        if heading not in {"Özellikler", "Features", "Merkmale"}:
            continue
        for m in re.finditer(r"<h6>([^<]+)</h6>\s*<ul class=\"avl-features third\">([\s\S]*?)</ul>", body):
            items = [text_of(x) for x in re.findall(r"<li>([\s\S]*?)</li>", m.group(2))]
            groups.append({"heading": text_of(m.group(1)), "items": [i for i in items if i]})
        break
    return groups


def iter_detail_sections(page: str) -> list[tuple[str, str]]:
    sections = []
    for m in re.finditer(r'<h2 class="blog-title"[^>]*>([\s\S]*?)</h2>\s*<hr\s*/?>\s*([\s\S]*?)(?=<h2 class="blog-title"|$)', page):
        sections.append((m.group(1), m.group(2)))
    return sections


def parse_eids(page: str) -> dict | None:
    card = re.search(r'class="eids-card">([\s\S]*?)</div>', page)
    if not card:
        return None
    img = re.search(r'<img src="([^"]+)"', card.group(1))
    text = re.search(r'class="eids-text">(.*?)</p>', card.group(1), re.S)
    heading = ""
    for heading_html, _body in iter_detail_sections(page):
        label = text_of(heading_html)
        if "EİDS" in label or "EIDS" in label.upper():
            heading = label
            break
    return {
        "heading": heading,
        "image": localise(img.group(1)) if img else "",
        "text": text_of(text.group(1)) if text else "",
    }


def parse_agent(page: str) -> dict:
    card = re.search(r'class="sidebar-widget agent-card-modern">([\s\S]*?)</ul>\s*</div>\s*</div>', page)
    if not card:
        return {}
    chunk = card.group(0)
    name_a = re.search(r'class="acm-name"[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', chunk)
    office_a = re.search(r'ri-building-4-line"></i>\s*([^<]+)', chunk)
    office_href = re.search(r'href="(/[^"]*(?:ofisler|offices|anbieteren)/[^"]+)"', chunk)
    img = re.search(r'<img src="([^"]+)"', chunk)
    webp = re.search(r'<source srcset="([^"]+)"', chunk)
    consultant_href = name_a.group(1) if name_a else ""
    consultant_id = ""
    consultant_slug = ""
    cm = re.search(r"/(?:danismanlar|agents|immobilienmakleren)/(\d+)/([^/?#]+)", consultant_href)
    if cm:
        consultant_id, consultant_slug = cm.group(1), cm.group(2)
    office_id = office_slug = ""
    om = re.search(r"/(?:ofisler|offices|anbieteren)/(\d+)/([^/?#]+)", office_href.group(1) if office_href else "")
    if om:
        office_id, office_slug = om.group(1), om.group(2)
    phones = []
    for a in re.finditer(r'<a href="(tel:[^"]+)"[^>]*>([\s\S]*?)</a>', chunk):
        phones.append({"href": decode(a.group(1)), "label": text_of(a.group(2)), "icon": "ri-phone-line"})
    email = re.search(r'class="agent-mail"[^>]*href="(mailto:[^"]+)"[^>]*>([\s\S]*?)</a>', chunk)
    return {
        "name": text_of(name_a.group(2)) if name_a else "",
        "href": consultant_href,
        "consultantId": consultant_id,
        "consultantSlug": consultant_slug,
        "image": localise(img.group(1)) if img else "",
        "imageWebp": localise(webp.group(1)) if webp else "",
        "officeName": decode(office_a.group(1)) if office_a else "",
        "officeHref": office_href.group(1) if office_href else "",
        "officeId": office_id,
        "officeSlug": office_slug,
        "phones": phones,
        "emailHref": decode(email.group(1)) if email else "",
        "emailLabel": text_of(email.group(2)) if email else "",
    }


def parse_form(page: str) -> dict:
    form = re.search(r'<form method="post" id="form"[\s\S]*?</form>', page)
    if not form:
        return {}
    body = form.group(0)
    heading = re.search(r"<h4[^>]*>(.*?)</h4>", body, re.S)
    submit = re.search(r'<button[^>]*type="submit"[^>]*>(.*?)</button>', body, re.S)
    placeholders = {}
    for inp in re.finditer(r'<input[^>]*id="(Subject|FullName|Email|Phone)"[^>]*>', body):
        tag = inp.group(0)
        ph = re.search(r'placeholder="([^"]*)"', tag)
        placeholders[inp.group(1)] = decode(ph.group(1)) if ph else ""
    ta = re.search(r'<textarea([^>]*)>', body)
    if ta:
        ph = re.search(r'placeholder="([^"]*)"', ta.group(1))
        placeholders["Message"] = decode(ph.group(1)) if ph else ""
    else:
        placeholders["Message"] = ""
    captcha = re.search(r"errorSpan\.innerText\s*=\s*'([^']+)'", body)
    return {
        "heading": text_of(heading.group(1)) if heading else "",
        "placeholders": placeholders,
        "submitLabel": text_of(submit.group(1)) if submit else "",
        "captchaError": decode(captcha.group(1)) if captcha else "",
    }


def parse_map(page: str) -> dict:
    lat = re.search(r'var latitude = "([^"]+)"', page)
    lng = re.search(r'var longitude = "([^"]+)"', page)
    iframe = re.search(r'<iframe src="(https://maps\.google\.com/maps\?q=[^"]+)"', page)
    dir_btn = re.search(r'onclick="showDirectionsProp\(\)"[^>]*>\s*(?:<i[^>]*></i>)?([^<]+)', page)
    street_btn = re.search(r'onclick="showStreetViewProp\(\)"[^>]*>\s*(?:<i[^>]*></i>\s*)?([^<]+)', page)
    heading = re.search(r'<h2 class="blog-title">(Konum|Location|Lage)</h2>', page)
    return {
        "heading": text_of(heading.group(1)) if heading else "",
        "latitude": lat.group(1) if lat else "",
        "longitude": lng.group(1) if lng else "",
        "iframeSrc": decode(iframe.group(1)) if iframe else "",
        "directionsLabel": text_of(dir_btn.group(1)) if dir_btn else "",
        "streetViewLabel": text_of(street_btn.group(1)) if street_btn else "",
    }


def parse_description(page: str) -> tuple[str, str]:
    wanted = {"açıklama", "explanation", "beschreibung", "erläuterung"}
    for heading_html, body in iter_detail_sections(page):
        heading = text_of(heading_html)
        if heading.casefold() not in wanted:
            continue
        inner = re.sub(r"</div>\s*</div>\s*$", "", body.strip())
        return heading, localise_html(inner.strip())
    return "", ""


def parse_location_ids(page: str) -> dict:
    city = re.search(r'FilterDTO\.CityId=(\d+)"[^>]*>([^<]+)', page)
    county = re.search(r'FilterDTO\.CountyIds=(\d+)"[^>]*>([^<]+)', page)
    district = re.search(r'FilterDTO\.DistrictIds=(\d+)"[^>]*>([^<]+)', page)
    return {
        "cityId": city.group(1) if city else "",
        "cityLabel": text_of(city.group(2)).rstrip("/").strip() if city else "",
        "countyId": county.group(1) if county else "",
        "countyLabel": text_of(county.group(2)).rstrip("/").strip() if county else "",
        "districtId": district.group(1) if district else "",
        "districtLabel": text_of(district.group(2)).rstrip("/").strip() if district else "",
        "cityHref": f"?FilterDTO.CityId={city.group(1)}" if city else "",
        "countyHref": f"?FilterDTO.CountyIds={county.group(1)}" if county else "",
        "districtHref": f"?FilterDTO.DistrictIds={district.group(1)}" if district else "",
    }


def ad_type_id_from_label(label: str, mapping: dict[str, str]) -> str:
    key = label.strip().casefold()
    return mapping.get(key, "")


def process_type_id(ad_type_id: str, process_label: str, process_map: dict[str, dict[str, str]]) -> str:
    by_ad = process_map.get(ad_type_id, {})
    return by_ad.get(process_label.strip().casefold(), "")


def parse_detail(page: str, lang: str, url_path: str, card: dict | None) -> dict:
    title = ""
    h2 = re.search(r'class="property-title"[\s\S]*?<h2[^>]*>(.*?)</h2>', page, re.S)
    if h2:
        title = text_of(h2.group(1))
    price = ""
    pm = re.search(r'class="prop-price">(.*?)</p>', page, re.S)
    if pm:
        price = text_of(pm.group(1))
    desc_heading, desc_html = parse_description(page)
    related_heading, related = parse_related(page)
    loc_ids = parse_location_ids(page)
    agent = parse_agent(page)
    specs = parse_specs(page)
    updated = ""
    brut = 0
    for spec in specs:
        if "Güncelleme" in spec["label"] or "Update" in spec["label"] or "Aktual" in spec["label"]:
            updated = spec["value"]
        if spec["label"].lower().startswith("brüt") or spec["label"].lower().startswith("gross") or "Brutto" in spec["label"]:
            brut = parse_area(spec["value"])
    if not updated and card:
        updated = card.get("updatedLabel", "")
    if not brut and card:
        for feat in card.get("features", []):
            if "Brüt" in feat["text"] or "Gross" in feat["text"] or "Brutto" in feat["text"]:
                brut = parse_area(feat["text"])
    return {
        "urlPath": url_path,
        "title": title or (card or {}).get("title", ""),
        "price": price or (card or {}).get("price", ""),
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
        "gallery": parse_gallery(page),
        "locationIds": loc_ids,
        "specs": specs,
        "descriptionHeading": desc_heading,
        "descriptionHtml": desc_html,
        "eids": parse_eids(page),
        "featureGroups": parse_features(page),
        "map": parse_map(page),
        "agent": agent,
        "form": parse_form(page),
        "relatedHeading": related_heading,
        "relatedIds": [item["externalId"] for item in related],
        "card": card or {},
        "updatedLabel": (card or {}).get("updatedLabel", "") or updated,
        "cleanArea": brut,
        "priceAmount": parse_price_amount(price or (card or {}).get("price", "")),
        "currencyId": currency_id_from_price(price or (card or {}).get("price", "")),
        "updatedOn": parse_date(updated or (card or {}).get("updatedLabel", "")),
    }


def lookup_json(path: str) -> list[dict]:
    raw = fetch(path)
    data = json.loads(raw)
    return [item for item in data.get("items", []) if str(item.get("id", "")) != ""]


def collect_media(pages: list[str]) -> dict[str, str]:
    urls: set[str] = set()
    for page in pages:
        for match in MEDIA_URL.finditer(page):
            urls.add(match.group(1) or match.group(2))
    targets: dict[str, str] = {}
    for url in urls:
        path = url
        path = re.sub(r"^https://ik\.imagekit\.io/[A-Za-z0-9_-]+/*(?:tr:[^/]*/)?", "", path)
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


def page_url(lang: str, page_index: int) -> str:
    path = LIST_PATHS[lang]
    if page_index <= 1:
        return path
    return f"{path}?pageIndex={page_index}"


def collect_all_cards(lang: str, max_hint: int = 80) -> tuple[list[dict], dict, int]:
    first = fetch(page_url(lang, 1))
    if lang == "tr":
        save_snapshot("list-tr-p1.html", first)
    else:
        save_snapshot(f"list-{lang}-p1.html", first)
    ui = list_ui(first, lang)
    live_total = 0
    found = re.search(r'ri-building-2-fill"></i>\s*([^<]+)', first)
    if found:
        digits = re.sub(r"\D", "", text_of(found.group(1)))
        live_total = int(digits) if digits else 0
    pages = [int(p) for p in re.findall(r"pageIndex=(\d+)", first)]
    last_page = max(pages) if pages else 1
    collected: list[dict] = []
    seen: set[int] = set()
    for page_index in range(1, max(last_page, max_hint) + 1):
        html = first if page_index == 1 else fetch(page_url(lang, page_index))
        cards = listing_cards(html)
        if not cards:
            break
        added = 0
        for card in cards:
            ext = card["externalId"]
            if ext in seen:
                continue
            seen.add(ext)
            card["sourcePage"] = page_index
            card["listRank"] = len(collected)
            collected.append(card)
            added += 1
        print(f"  {lang} p{page_index} +{added} total {len(collected)}", flush=True)
        if page_index >= last_page and len(cards) < 12:
            break
    return collected, ui, live_total


def load_existing_listings() -> dict[int, dict]:
    if not OUT.is_file():
        return {}
    try:
        data = json.loads(OUT.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    rows = {}
    for row in data.get("listings", []):
        ext = int(row.get("externalId") or 0)
        if ext:
            rows[ext] = row
    print(f"resume listings {len(rows)}")
    return rows


def listing_complete(row: dict) -> bool:
    trans = row.get("translations") or {}
    if set(trans) != set(LANGS):
        return False
    for lang in LANGS:
        path = (trans[lang] or {}).get("urlPath") or ""
        if path in HOME_PATHS:
            continue
        if not (trans[lang] or {}).get("title") and not (trans[lang] or {}).get("card"):
            return False
    return True


def write_listings_payload(ui: dict, listings: dict[int, dict], live_total: int) -> None:
    ordered = sorted(listings.values(), key=lambda row: (row.get("listRank", 10**9), row.get("externalId", 0)))
    payload = {
        "sample": {
            "size": len(ordered),
            "liveTotal": live_total,
            "livePages": None,
            "perPage": 12,
            "selection": "all public listings from the live list, tr/en/de",
        },
        "listUi": ui,
        "listings": ordered,
        "lookups": {},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"checkpoint listings={len(ordered)} -> {OUT}", flush=True)


def culture_path(tr_path: str, listing_id: int, lang: str) -> str:
    parts = tr_path.strip("/").split("/")
    # /tr/portfoy/{id}/{status}/{type}/{city}/{county}/{slug}
    status = parts[3] if len(parts) > 3 else ""
    ptype = parts[4] if len(parts) > 4 else ""
    city = parts[5] if len(parts) > 5 else ""
    county = parts[6] if len(parts) > 6 else ""
    slug = parts[7] if len(parts) > 7 else ""
    query = urllib.parse.urlencode(
        {
            "langCode": lang,
            "routeName": "PropertyDetail_tr",
            "propertyStatus": status,
            "propertyType": ptype,
            "city": city,
            "county": county,
            "seoUrl": slug,
        }
    )
    return f"/tr/Settings/ChangeCulture/{listing_id}?{query}"


def apply_listing_translation(row: dict, ext: int, lang: str, parsed: dict, tr_card: dict, process_map: dict, ad_map: dict) -> None:
    if lang == "tr":
        loc = parsed["locationIds"]
        row["cityId"] = loc.get("cityId") or row["cityId"]
        row["countyId"] = loc.get("countyId") or row["countyId"]
        row["districtId"] = loc.get("districtId") or row["districtId"]
        row["adTypeId"] = row.get("adTypeId") or ad_type_id_from_label(tr_card.get("adType", ""), ad_map)
        row["processTypeId"] = process_type_id(row["adTypeId"], tr_card.get("processType", ""), process_map) or row.get("processTypeId") or ""
        row["priceAmount"] = parsed["priceAmount"] or row["priceAmount"]
        row["cleanArea"] = parsed["cleanArea"] or row["cleanArea"]
        row["updatedOn"] = parsed["updatedOn"] or row["updatedOn"]
        row["currencyId"] = parsed["currencyId"] or row.get("currencyId") or ""
        row["latitude"] = parsed["map"]["latitude"] or row["latitude"]
        row["longitude"] = parsed["map"]["longitude"] or row["longitude"]
    agent = parsed.get("agent") or {}
    if agent.get("officeId"):
        row["officeId"] = agent["officeId"]
        row["officeSlug"] = agent.get("officeSlug") or row["officeSlug"]
    if agent.get("consultantId"):
        row["consultantId"] = agent["consultantId"]
        row["consultantSlug"] = agent.get("consultantSlug") or row["consultantSlug"]
    if lang != "tr" and not parsed.get("card"):
        parsed["card"] = {
            "externalId": ext,
            "urlPath": parsed.get("urlPath") or "",
            "image": (tr_card.get("image") or ""),
            "imageWebp": (tr_card.get("imageWebp") or ""),
            "processType": "",
            "adSubType": "",
            "adTypeIcon": tr_card.get("adTypeIcon") or "",
            "adType": tr_card.get("adType") or "",
            "badgeImage": tr_card.get("badgeImage") or "",
            "price": parsed.get("price") or tr_card.get("price") or "",
            "title": parsed.get("title") or tr_card.get("title") or "",
            "location": " , ".join(
                part
                for part in [
                    parsed["locationIds"].get("cityLabel"),
                    parsed["locationIds"].get("countyLabel"),
                ]
                if part
            ),
            "updatedLabel": parsed.get("updatedLabel") or "",
            "features": tr_card.get("features") or [],
            "detailLabel": tr_card.get("detailLabel") or "",
        }
    row["translations"][lang] = parsed


def main() -> int:
    SNAP.mkdir(parents=True, exist_ok=True)
    print("== list pages")
    tr_cards_list, ui_tr, live_total = collect_all_cards("tr")
    tr_cards = {c["externalId"]: c for c in tr_cards_list}
    ui: dict[str, dict] = {"tr": ui_tr}
    cards_by_lang: dict[str, dict[int, dict]] = {"tr": tr_cards, "en": {}, "de": {}}
    for lang in ("en", "de"):
        cards, ui[lang], _ = collect_all_cards(lang)
        cards_by_lang[lang] = {c["externalId"]: c for c in cards}

    print("== process type map")
    process_map: dict[str, dict[str, str]] = {}
    for ad_id in AD_TYPE_IDS:
        items = lookup_json(f"/tr/lookup/ProcessTypes?adType={ad_id}")
        process_map[ad_id] = {item["text"].strip().casefold(): str(item["id"]) for item in items}

    ad_map = {opt["label"].strip().casefold(): opt["value"] for opt in ui["tr"]["adTypes"] if opt["value"]}

    listings = load_existing_listings()
    for card in tr_cards_list:
        ext = card["externalId"]
        row = listings.setdefault(
            ext,
            {
                "externalId": ext,
                "listRank": card["listRank"],
                "adTypeId": ad_type_id_from_label(card.get("adType", ""), ad_map),
                "processTypeId": "",
                "currencyId": "",
                "countryId": "212",
                "cityId": "",
                "countyId": "",
                "districtId": "",
                "officeId": "",
                "consultantId": "",
                "officeSlug": "",
                "consultantSlug": "",
                "priceAmount": 0,
                "cleanArea": 0,
                "updatedOn": "",
                "latitude": "",
                "longitude": "",
                "translations": {},
            },
        )
        row["listRank"] = card["listRank"]

    print("== details")
    jobs = []
    for card in tr_cards_list:
        ext = card["externalId"]
        existing = listings.get(ext, {})
        trans = existing.get("translations") or {}
        if "tr" not in trans:
            jobs.append((ext, "tr", card["urlPath"]))
        if "en" not in trans:
            jobs.append((ext, "en", culture_path(card["urlPath"], ext, "en")))
        if "de" not in trans:
            jobs.append((ext, "de", culture_path(card["urlPath"], ext, "de")))
    print(f"detail jobs {len(jobs)} (skip complete {sum(1 for ext in tr_cards if listing_complete(listings.get(ext, {})))})")

    done = 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_final, path): (ext, lang, path) for ext, lang, path in jobs}
        for future in as_completed(futures):
            ext, lang, path = futures[future]
            done += 1
            if done % 20 == 0 or done == len(jobs):
                print(f"  details {done}/{len(jobs)}", flush=True)
            try:
                final_url, page = future.result()
            except Exception as error:
                print(f"FAIL detail {path}: {error}", file=sys.stderr)
                continue
            local_path = urllib.parse.urlparse(final_url).path
            card = cards_by_lang[lang].get(ext) or (tr_cards[ext] if lang == "tr" else None)
            if local_path in HOME_PATHS:
                fallback = (card or tr_cards[ext])["urlPath"]
                if lang != "tr":
                    fallback = culture_path(tr_cards[ext]["urlPath"], ext, lang)
                    # keep a locale-prefixed detail path even when live redirects home
                    parts = tr_cards[ext]["urlPath"].strip("/").split("/")
                    slug_tail = "/".join(parts[2:]) if len(parts) > 2 else str(ext)
                    fallback = f"{DETAIL_PREFIX[lang]}/{slug_tail}"
                parsed = parse_detail(page, lang, fallback, card or tr_cards[ext])
            else:
                parsed = parse_detail(page, lang, local_path, card or (tr_cards[ext] if lang == "tr" else None))
            apply_listing_translation(listings[ext], ext, lang, parsed, tr_cards[ext], process_map, ad_map)
            if done % 60 == 0:
                write_listings_payload(ui, listings, live_total)

    print("== extra lookups")
    extra_lookups: dict[str, list] = {"currencies": [], "offices": [], "consultants": [], "districts": []}
    office_ids = sorted({row["officeId"] for row in listings.values() if row.get("officeId")})
    county_ids = sorted({row["countyId"] for row in listings.values() if row.get("countyId")})
    for group, path_tpl in (
        ("currencies", "/{lang}/lookup/Currencies"),
        ("offices", "/{lang}/Lookup/GetAllOffices"),
    ):
        items_by_id: dict[str, dict] = {}
        for lang in LANGS:
            for position, item in enumerate(lookup_json(path_tpl.format(lang=lang))):
                rec = items_by_id.setdefault(
                    str(item["id"]),
                    {"externalId": str(item["id"]), "parentExternalId": None, "position": position, "translations": {}},
                )
                rec["translations"][lang] = item["text"]
        extra_lookups[group] = list(items_by_id.values())

    consultants_by_id: dict[str, dict] = {}
    for office_id in office_ids:
        for lang in LANGS:
            for position, item in enumerate(lookup_json(f"/{lang}/Lookup/Users?officeId={office_id}")):
                rec = consultants_by_id.setdefault(
                    str(item["id"]),
                    {
                        "externalId": str(item["id"]),
                        "parentExternalId": office_id,
                        "position": position,
                        "translations": {},
                    },
                )
                rec["translations"][lang] = item["text"]
    extra_lookups["consultants"] = list(consultants_by_id.values())

    districts_by_id: dict[str, dict] = {}
    for county_id in county_ids:
        for lang in LANGS:
            for position, item in enumerate(lookup_json(f"/{lang}/Lookup/Districts?countyIds={county_id}")):
                rec = districts_by_id.setdefault(
                    str(item["id"]),
                    {
                        "externalId": str(item["id"]),
                        "parentExternalId": county_id,
                        "position": position,
                        "translations": {},
                    },
                )
                rec["translations"][lang] = item["text"]
    extra_lookups["districts"] = list(districts_by_id.values())

    listings = {ext: row for ext, row in listings.items() if ext in tr_cards}

    missing = [ext for ext, row in listings.items() if set(row.get("translations", {})) != set(LANGS)]
    if missing:
        print(f"WARN missing langs for {missing[:12]}... ({len(missing)})", file=sys.stderr)

    payload = {
        "sample": {
            "size": len(listings),
            "liveTotal": live_total or len(listings),
            "livePages": None,
            "perPage": 12,
            "selection": "all public listings from the live list, tr/en/de",
        },
        "listUi": ui,
        "listings": [listings[ext] for ext in sorted(listings, key=lambda e: listings[e]["listRank"])],
        "lookups": extra_lookups,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"WROTE {OUT} listings={len(payload['listings'])}")

    print("== media")
    targets = collect_media(ALL_HTML)
    download_media(targets)
    print("DONE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
