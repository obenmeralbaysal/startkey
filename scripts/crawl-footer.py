#!/usr/bin/env python3
"""
Crawls footer public pages from StartKey.com.tr: Franchise application (tr/en/de),
KVKK (Turkish only — EN/DE URLs redirect home on the live site) and Hizmet
Sözleşmesi / Terms Of Service / Dienstleistungs (tr/en/de).

Portföylerimiz and Ofislerimiz are out of scope. Re-run after the reference
content changes. Existing media files are kept unless FORCE=1.
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
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
SNAP = ROOT / "reference" / "snapshots" / "footer"
OUT = ROOT / "api" / "database" / "data" / "footer-seed.json"
PUBLIC = ROOT / "web" / "public" / "media"
BASE = "https://startkey.com.tr"
LANGS = ("tr", "en", "de")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
SCOPE = re.compile(r"\s+b-[a-z0-9]{10}(?=[\s>/])")
CDN = re.compile(r"https?://cdnc\.re-os\.com")
IMAGEKIT = re.compile(r"https?://ik\.imagekit\.io/[A-Za-z0-9_-]+/*(?:tr:[^/]*/)?")
ORIGIN = re.compile(r"https?://(?:www\.)?startkey\.com\.tr")
S3 = re.compile(r"https?://reos-cdn-files\.s3-eu-west-1\.amazonaws\.com")
MEDIA_HOST = r"https://(?:cdnc\.re-os\.com|ik\.imagekit\.io/[A-Za-z0-9_-]+|reos-cdn-files\.s3-eu-west-1\.amazonaws\.com)"
MEDIA_URL = re.compile(
    rf'(?:(?:src|srcset|href)="\s*({MEDIA_HOST}[^"\s]+)|url\(\s*({MEDIA_HOST}[^)\s]+)\s*\))'
)

FRANCHISE = {
    "tr": "/tr/franchise-basvuru",
    "en": "/en/franchise-form",
    "de": "/de/franchise-form",
}
KVKK = {"tr": "/tr/sayfa/kvkk"}
TERMS = {
    "tr": "/tr/sayfa/hizmet-sozlesmesi",
    "en": "/en/page/hizmet-sozlesmesi",
    "de": "/de/page/hizmet-sozlesmesi",
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
    value = S3.sub("/media", value)
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


def main_html(page: str) -> str:
    start = page.find("<!-- Breadcrumb End -->")
    end = page.find("<footer")
    if start < 0:
        start = page.find("<section")
    if start < 0 or end < 0 or end <= start:
        return ""
    chunk = page[start:end]
    chunk = re.sub(r"<!--.*?-->", "", chunk, flags=re.S)
    return localise_html(chunk.strip())


def captcha_error(page: str) -> str:
    m = re.search(r"errorSpan\.innerText\s*=\s*'([^']+)'", page)
    if m:
        return decode(m.group(1))
    m = re.search(r'errorSpan\.innerText\s*=\s*"([^"]+)"', page)
    return decode(m.group(1)) if m else ""


def required_messages(page: str) -> dict[str, str]:
    messages = {}
    for m in re.finditer(
        r'data-val-required="([^"]+)"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*data-val-required="([^"]+)"',
        page,
    ):
        if m.group(2):
            messages[m.group(2)] = decode(m.group(1))
        else:
            messages[m.group(3)] = decode(m.group(4))
    return messages


def widget_css(page: str) -> str:
    m = re.search(r"<style>\s*(\.widget-item[\s\S]*?)</style>", page)
    return m.group(1).strip() if m else ""


def input_placeholder(page: str, field_id: str) -> str:
    tag = re.search(rf"<input[^>]*id=\"{re.escape(field_id)}\"[^>]*>", page)
    if not tag:
        tag = re.search(rf"<textarea[^>]*id=\"{re.escape(field_id)}\"[^>]*>", page)
    if not tag:
        return ""
    m = re.search(r'placeholder="([^"]*)"', tag.group(0))
    return decode(m.group(1)) if m else ""


def city_options(page: str) -> list[dict]:
    select = re.search(r'<select[^>]*id="OpenOfficeCityId"[^>]*>(.*?)</select>', page, re.S)
    if not select:
        return []
    options = []
    for opt in re.finditer(r'<option([^>]*)>(.*?)</option>', select.group(1), re.S):
        value_m = re.search(r'value="([^"]*)"', opt.group(1))
        options.append(
            {
                "value": decode(value_m.group(1)) if value_m else "",
                "label": text_of(opt.group(2)),
            }
        )
    return options


def county_bind_url(page: str) -> str:
    m = re.search(r'<select[^>]*id="OpenOfficeCountyId"[^>]*>', page)
    if not m:
        return ""
    url = re.search(r'bind-url="([^"]+)"', m.group(0))
    return localise(url.group(1)) if url else ""


def franchise_body(page: str) -> str:
    start = page.find('<section class="hw-wrap')
    if start < 0:
        return ""
    script = page.find("<script>", start)
    footer = page.find("<footer", start)
    end = script if script >= 0 else footer
    if end < 0:
        return ""
    chunk = page[start:end].strip()
    chunk = re.sub(r"</div>\s*$", "", chunk)
    return localise_html(chunk.strip())


def parse_franchise(page: str, path: str) -> dict:
    heading = re.search(
        r'<div class="section-title style2 text-center mb-40 mt-40">\s*<h2>(.*?)</h2>',
        page,
        re.S,
    )
    submit = re.search(r'<button[^>]*type="submit"[^>]*>(.*?)</button>', page, re.S)
    pdf = re.search(r'href="(https://reos-cdn-files[^"]+\.pdf)"', page)
    return {
        "urlPath": path,
        "formHeading": text_of(heading.group(1)) if heading else "",
        "placeholders": {
            "FirstName": input_placeholder(page, "FirstName"),
            "LastName": input_placeholder(page, "LastName"),
            "Email": input_placeholder(page, "Email"),
            "Notes": input_placeholder(page, "Notes"),
        },
        "required": required_messages(page),
        "cities": city_options(page),
        "countyBindUrl": county_bind_url(page),
        "submitLabel": text_of(submit.group(1)) if submit else "",
        "captchaError": captcha_error(page),
        "widgetCss": widget_css(page),
        "pdfHref": localise(pdf.group(1)) if pdf else "",
        "bodyHtml": franchise_body(page),
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
    }


def parse_static(page: str, path: str) -> dict:
    return {
        "urlPath": path,
        "bodyHtml": main_html(page),
        "breadcrumb": breadcrumb(page),
        "meta": meta(page),
    }


def collect_media(pages: list[str]) -> dict[str, str]:
    urls = set()
    for page in pages:
        for match in MEDIA_URL.finditer(page):
            urls.add(match.group(1) or match.group(2))
        for match in re.finditer(r'href="(https://reos-cdn-files[^"]+\.pdf)"', page):
            urls.add(match.group(1))
    targets = {}
    for url in urls:
        dest = localise(url).lstrip("/")
        if dest.startswith("media/"):
            dest = dest[len("media/") :]
        if not dest:
            continue
        source = url
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
            accept = "image/webp,*/*" if dest.endswith(".webp") else "*/*"
            headers = {"User-Agent": UA, "Accept": accept}
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
    snapshot_html: list[str] = []

    print("== franchise")
    franchise = {"key": "franchise", "translations": {}}
    for lang, path in FRANCHISE.items():
        print(f"  {lang} {path}")
        page = fetch(path)
        save_snapshot(f"franchise-{lang}.html", page)
        snapshot_html.append(page)
        franchise["translations"][lang] = parse_franchise(page, path)

    print("== kvkk")
    kvkk = {"key": "kvkk", "translations": {}}
    for lang, path in KVKK.items():
        print(f"  {lang} {path}")
        page = fetch(path)
        save_snapshot(f"kvkk-{lang}.html", page)
        snapshot_html.append(page)
        kvkk["translations"][lang] = parse_static(page, path)

    print("== terms")
    terms = {"key": "terms", "translations": {}}
    for lang, path in TERMS.items():
        print(f"  {lang} {path}")
        page = fetch(path)
        save_snapshot(f"hizmet-{lang}.html", page)
        snapshot_html.append(page)
        terms["translations"][lang] = parse_static(page, path)

    print("== media")
    download_media(collect_media(snapshot_html + ALL_HTML))

    seed = {"pages": [franchise, kvkk, terms]}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(seed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")
    print(
        "franchise langs",
        list(franchise["translations"]),
        "kvkk langs",
        list(kvkk["translations"]),
        "terms langs",
        list(terms["translations"]),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
