#!/usr/bin/env python3
"""
Snapshot startkeyakademi.net and mirror public pages + assets under /akademi.

The academy site is a separate WordPress (Eduma / Elementor / LearnPress) public
site. It is mounted at startkey.com.tr/akademi and will later leave this repo.
Runtime pages must not hotlink startkeyakademi.net.

Re-runnable. Set FORCE=1 to replace files even when the bytes match.
Set PAGES=sss,iletisim to fetch only those slugs (default: all known pages).
"""
from __future__ import annotations

import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from posixpath import normpath

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_DIR = ROOT / "reference" / "snapshots" / "akademi-net"
PUBLIC = ROOT / "web" / "public" / "akademi"
PROCESSED = PUBLIC / "homepage.html"
ORIGIN = "https://startkeyakademi.net"
# LiteSpeed UCSS drops Elementor page CSS (gaps, grids, typography). The
# unoptimized document has elementor-frontend-inline-css and the real stylesheets.
SNAPSHOT_URL = ORIGIN + "/?LSCWP_CTRL=before_optm"
PREFIX = "/akademi"
UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
FORCE = os.environ.get("FORCE", "0") == "1"

SKIP_HOST_PARTS = (
    "googletagmanager.com",
    "google-analytics.com",
    "google.com/recaptcha",
    "gstatic.com/recaptcha",
    "challenges.cloudflare.com",
    "cookiedatabase.org",
    "facebook.com",
    "cdn-cgi/",
)
SKIP_PATH_PREFIXES = (
    "/wp-json",
    "/wp-admin",
    "/imunify-bot-check",
    "/xmlrpc.php",
    "/lp-ajax-handle",
)
ASSET_EXT = re.compile(
    r"\.(?:css|js|mjs|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|otf)(?:$|[?#])",
    re.I,
)

URL_ATTR = re.compile(
    r"""(?P<attr>href|src|data-src|data-lazy-src|data-bg|poster)=(?P<q>['"])(?P<url>[^'"]+)(?P=q)""",
    re.I,
)
SRCSET_ATTR = re.compile(
    r"""(?P<attr>srcset|data-srcset)=(?P<q>['"])(?P<value>[^'"]+)(?P=q)""",
    re.I,
)
CSS_URL = re.compile(r"""url\(\s*['"]?(?!data:)([^)'"]+?)['"]?\s*\)""", re.I)
JS_WP_URL = re.compile(
    r"""https?://startkeyakademi\.net(/[^"'\\\s]*)|\\?/wp-(?:content|includes)/[^"'\\\s]+""",
    re.I,
)
CF_EMAIL = re.compile(
    r"""<a[^>]+href=(?P<q>['"])/cdn-cgi/l/email-protection#(?P<hex>[0-9a-fA-F]+)(?P=q)[^>]*>(?P<inner>.*?)</a>""",
    re.I | re.S,
)
CF_EMAIL_SPAN = re.compile(
    r"""<span class="__cf_email__"[^>]*>.*?</span>""",
    re.I | re.S,
)

PAGES = (
    ("homepage", "/", "homepage.html"),
    ("akademi", "/akademi/", "pages/akademi.html"),
    ("egitimler", "/egitimler/", "pages/egitimler.html"),
    ("egitimler-2", "/egitimler/page/2/", "pages/egitimler-page-2.html"),
    ("egitimler-3", "/egitimler/page/3/", "pages/egitimler-page-3.html"),
    ("sss", "/sss/", "pages/sss.html"),
    ("iletisim", "/iletisim/", "pages/iletisim.html"),
    ("kvkk", "/kvkk/", "pages/kvkk.html"),
    ("kullanim-kosullari", "/kullanim-kosullari/", "pages/kullanim-kosullari.html"),
    ("gizlilik-bilgilendirmesi", "/gizlilik-bilgilendirmesi/", "pages/gizlilik-bilgilendirmesi.html"),
    ("geri-odeme-bilgilendirmesi", "/geri-odeme-bilgilendirmesi/", "pages/geri-odeme-bilgilendirmesi.html"),
    ("cerez-bilgilendirmesi", "/cerez-bilgilendirmesi/", "pages/cerez-bilgilendirmesi.html"),
    ("giris", "/giris/", "pages/giris.html"),
    ("kayit", "/kayit/", "pages/kayit.html"),
    ("egitmenler", "/egitmenler/", "pages/egitmenler.html"),
    ("sepet", "/sepet/", "pages/sepet.html"),
    ("odeme", "/odeme/", "pages/odeme.html"),
    ("kontrol-paneli", "/kontrol-paneli/", "pages/kontrol-paneli.html"),
    ("category-egitim-makaleleri", "/category/egitim-makaleleri/", "pages/category/egitim-makaleleri.html"),
    ("blog-esnek", "/esnek-egitim-modeliyle-gelecegi-sekillendirin/", "pages/esnek-egitim-modeliyle-gelecegi-sekillendirin.html"),
    ("blog-farkli", "/farkli-egitimler-ile-kariyerinizde-fark-yaratin/", "pages/farkli-egitimler-ile-kariyerinizde-fark-yaratin.html"),
    ("blog-butuncul", "/butuncul-egitimler-ile-bilgiyi-deneyime-donusturun/", "pages/butuncul-egitimler-ile-bilgiyi-deneyime-donusturun.html"),
    ("cat-gayrimenkul", "/egitim-kategorisi/gayrimenkul/", "pages/egitim-kategorisi/gayrimenkul.html"),
    ("cat-ileri-duzey-iletisim", "/egitim-kategorisi/ileri-duzey-iletisim/", "pages/egitim-kategorisi/ileri-duzey-iletisim.html"),
    ("cat-temel-duzey-iletisim", "/egitim-kategorisi/temel-duzey-iletisim/", "pages/egitim-kategorisi/temel-duzey-iletisim.html"),
    ("cat-kariyer", "/egitim-kategorisi/kariyer/", "pages/egitim-kategorisi/kariyer.html"),
    ("cat-kisisel-gelisim", "/egitim-kategorisi/kisisel-gelisim/", "pages/egitim-kategorisi/kisisel-gelisim.html"),
    ("cat-motivasyon", "/egitim-kategorisi/motivasyon/", "pages/egitim-kategorisi/motivasyon.html"),
    ("cat-ozel-konu-basliklari", "/egitim-kategorisi/ozel-konu-basliklari/", "pages/egitim-kategorisi/ozel-konu-basliklari.html"),
    ("term-222", "/egitimler/?paged=1&term_id=222", "pages/egitimler-term-222.html"),
    ("term-223", "/egitimler/?paged=1&term_id=223", "pages/egitimler-term-223.html"),
    ("term-348", "/egitimler/?paged=1&term_id=348", "pages/egitimler-term-348.html"),
    ("term-349", "/egitimler/?paged=1&term_id=349", "pages/egitimler-term-349.html"),
    ("term-428", "/egitimler/?paged=1&term_id=428", "pages/egitimler-term-428.html"),
    ("term-463", "/egitimler/?paged=1&term_id=463", "pages/egitimler-term-463.html"),
    ("term-222-223", "/egitimler/?paged=1&term_id=222%2C223", "pages/egitimler-term-222-223.html"),
    ("term-diger", "/egitimler/?paged=1&term_id=224%2C348%2C349%2C428%2C463", "pages/egitimler-term-224-348-349-428-463.html"),
)
CF_EMAIL_DATA = re.compile(
    r"""data-cfemail=(?P<q>['"])(?P<hex>[0-9a-fA-F]+)(?P=q)""",
    re.I,
)


def fetch(url: str) -> bytes:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except (urllib.error.URLError, OSError) as error:
            last_error = error
    assert last_error is not None
    raise last_error


def looks_like_html(payload: bytes, path: str) -> bool:
    if path.lower().endswith((".html", ".htm")):
        return False
    head = payload.lstrip()[:200].lower()
    return head.startswith(b"<!doctype") or head.startswith(b"<html")


def decode_cf_email(hex_str: str) -> str:
    key = int(hex_str[:2], 16)
    return "".join(chr(int(hex_str[i : i + 2], 16) ^ key) for i in range(2, len(hex_str), 2))


def should_skip(url: str) -> bool:
    lowered = url.lower()
    return any(part in lowered for part in SKIP_HOST_PARTS)


def origin_path(url: str) -> str | None:
    """Return the site path for an academy-origin URL, or None if not ours."""
    url = html_unescape_amp(url).strip()
    if not url or url.startswith(("data:", "mailto:", "tel:", "javascript:", "#")):
        return None
    if should_skip(url):
        return None

    if url.startswith("//"):
        url = "https:" + url

    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme in ("http", "https"):
        host = (parsed.hostname or "").lower()
        if host and host != "startkeyakademi.net":
            return None
        path = parsed.path or "/"
    elif url.startswith("/"):
        path = urllib.parse.urlsplit(url).path or "/"
    else:
        return None

    if path.startswith(PREFIX + "/") or path == PREFIX:
        path = path[len(PREFIX) :] or "/"
    return path or "/"


def html_unescape_amp(value: str) -> str:
    return (
        value.replace("&#038;", "&")
        .replace("&amp;", "&")
        .replace("&#038", "&")
    )


def local_url(path: str, query: str = "") -> str:
    paged = re.search(r"(?:^|&)paged=(\d+)", path + "&" + query)
    clean_path = re.sub(r"&paged=\d+", "", path)
    if clean_path.rstrip("/") == "/egitimler" and paged:
        page_no = paged.group(1)
        if page_no != "1":
            return f"{PREFIX}/egitimler/page/{page_no}/"
        path = "/egitimler/"
        query = re.sub(r"(?:^|&)paged=\d+", "", query).lstrip("&")
    if path == "/":
        return PREFIX + "/"
    return PREFIX + path + (("?" + query) if query else "")


def rewrite_public_url(url: str) -> str:
    raw = html_unescape_amp(url).strip()
    if not raw or raw.startswith(("data:", "mailto:", "tel:", "javascript:")):
        return url
    if raw.startswith("#"):
        return url
    if should_skip(raw):
        return url

    if raw.startswith("//"):
        raw = "https:" + raw

    parsed = urllib.parse.urlsplit(raw)
    if parsed.scheme in ("http", "https"):
        host = (parsed.hostname or "").lower()
        if host == "startkeyakademi.net":
            path = parsed.path or "/"
            return local_url(path, parsed.query)
        if host:
            return url
        path = parsed.path or "/"
        return local_url(path, parsed.query)

    if raw.startswith("/"):
        path = parsed.path or "/"
        if path.startswith(PREFIX + "/") or path == PREFIX:
            return raw
        return local_url(path, parsed.query)

    return url


def rewrite_srcset(value: str) -> str:
    parts = []
    for item in value.split(","):
        piece = item.strip()
        if not piece:
            continue
        bits = piece.split()
        bits[0] = rewrite_public_url(bits[0])
        parts.append(" ".join(bits))
    return ", ".join(parts)


def rewrite_css_text(css: str, css_path: str) -> str:
    def replace(match: re.Match[str]) -> str:
        ref = match.group(1).strip()
        if ref.startswith(("data:", "#")):
            return match.group(0)
        if ref.startswith(("http://", "https://", "//", "/")):
            return f"url({rewrite_public_url(ref)})"
        resolved = normpath(f"{Path(css_path).parent.as_posix()}/{ref.split('?')[0].split('#')[0]}")
        if not resolved.startswith("/"):
            resolved = "/" + resolved
        return f"url({PREFIX}{resolved})"

    return CSS_URL.sub(replace, css)


def collect_html_urls(html: str) -> list[str]:
    found: list[str] = []
    for match in URL_ATTR.finditer(html):
        found.append(match.group("url"))
    for match in SRCSET_ATTR.finditer(html):
        for item in match.group("value").split(","):
            url = item.strip().split(" ")[0]
            if url:
                found.append(url)
    for match in CSS_URL.finditer(html):
        found.append(match.group(1))
    return found


def collect_css_urls(css: str, css_path: str) -> list[str]:
    urls: list[str] = []
    for ref in CSS_URL.findall(css):
        ref = ref.strip()
        if ref.startswith(("data:", "#")):
            continue
        if ref.startswith(("http://", "https://", "//", "/")):
            urls.append(ref)
            continue
        resolved = normpath(f"{Path(css_path).parent.as_posix()}/{ref.split('?')[0].split('#')[0]}")
        if not resolved.startswith("/"):
            resolved = "/" + resolved
        urls.append(ORIGIN + resolved)
    return urls


def collect_js_paths(text: str) -> list[str]:
    paths: list[str] = []
    for match in re.finditer(r"https?://startkeyakademi\.net(/[^\"'\\s)]*)", text, re.I):
        paths.append(match.group(1).split("?")[0])
    for match in re.finditer(r"(?:^|[\"'])(/wp-(?:content|includes)/[^\"'\\s)]+)", text, re.I):
        paths.append(match.group(1).split("?")[0])
    return paths


def save_bytes(path: str, payload: bytes) -> str:
    destination = PUBLIC / path.lstrip("/")
    if destination.exists() and not FORCE and destination.read_bytes() == payload:
        return "skip"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(payload)
    return "updated" if destination.exists() else "added"


def is_asset_path(path: str) -> bool:
    if any(path.startswith(prefix) for prefix in SKIP_PATH_PREFIXES):
        return False
    return bool(ASSET_EXT.search(path))


def download_asset(path: str, stats: dict[str, int], queue: list[str]) -> None:
    if not is_asset_path(path):
        return
    url = ORIGIN + path
    try:
        payload = fetch(url)
        if not payload:
            stats["missing"] += 1
            print(f"absent {path} (empty)", file=sys.stderr)
            return
        if looks_like_html(payload, path):
            stats["missing"] += 1
            print(f"absent {path} (html instead of asset)", file=sys.stderr)
            return
    except urllib.error.HTTPError as error:
        if error.code == 404:
            stats["missing"] += 1
            print(f"absent {path}", file=sys.stderr)
            return
        stats["failed"] += 1
        print(f"FAIL {path}: {error}", file=sys.stderr)
        return
    except (urllib.error.URLError, OSError, ValueError) as error:
        stats["failed"] += 1
        print(f"FAIL {path}: {error}", file=sys.stderr)
        return

    status = save_bytes(path, payload)
    stats[status] += 1
    if status != "skip":
        print(f"{status} {path} ({len(payload)} bytes)")

    lowered = path.lower()
    if lowered.endswith((".css", ".js")):
        text = payload.decode("utf-8", errors="replace")
        rewritten = rewrite_css_text(text, path) if lowered.endswith(".css") else rewrite_text_urls(text)
        if rewritten != text:
            save_bytes(path, rewritten.encode("utf-8"))
        for extra in collect_css_urls(text, path) if lowered.endswith(".css") else []:
            extra_path = origin_path(extra)
            if extra_path and extra_path not in ("/",):
                queue.append(extra_path)
        if lowered.endswith(".js"):
            for extra_path in collect_js_paths(text):
                if extra_path not in ("/",) and is_asset_path(extra_path):
                    queue.append(extra_path)


def rewrite_text_urls(text: str) -> str:
    # JSON-escaped origin first so `https:\/\/startkeyakademi.net\/foo` becomes `/akademi/foo`.
    text = text.replace(r"https:\/\/startkeyakademi.net", PREFIX)
    text = text.replace(r"http:\/\/startkeyakademi.net", PREFIX)
    text = re.sub(r"https://startkeyakademi\.net", PREFIX, text)
    text = re.sub(r"http://startkeyakademi\.net", PREFIX, text)
    text = re.sub(r"(?<!:)//startkeyakademi\.net", PREFIX, text)
    # Root-relative WP / page paths that the attribute rewriter did not see (inline JS).
    text = re.sub(
        rf'(["\'])(?!{PREFIX}/)(/(?:wp-(?:content|includes|admin|json)|egitimler|egitim-kategorisi|giris|iletisim|sss|kvkk|kayit|egitmenler|egitmen|kontrol-paneli|sepet-yedek|sepet|odeme|category|kullanim-kosullari|cerez-bilgilendirmesi|gizlilik-bilgilendirmesi|geri-odeme-bilgilendirmesi)/)',
        rf"\1{PREFIX}\2",
        text,
    )
    return text


def strip_unwanted_scripts(html: str) -> str:
    # Do not send visitors to the reference site's analytics / bot-challenge.
    html = re.sub(
        r"""<script[^>]+id="google_gtagjs-js"[^>]*>.*?</script>""",
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(
        r"""<script[^>]+id="google_gtagjs-js-after"[^>]*>.*?</script>""",
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(
        r"""<script[^>]+data-service="google-analytics"[^>]*>.*?</script>""",
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(
        r"""<script[^>]+id="google-recaptcha-js"[^>]*></script>""",
        "",
        html,
        flags=re.I,
    )
    html = re.sub(
        r"""<script[^>]+id="cf-turnstile-js"[^>]*></script>""",
        "",
        html,
        flags=re.I,
    )
    html = re.sub(
        r"""<script[^>]+src="/cdn-cgi/scripts/[^"]+"[^>]*>.*?</script>""",
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(
        r"""<script>\s*\(function\(\)\s*\{\s*function c\(\).*?</script>""",
        "",
        html,
        flags=re.I | re.S,
    )
    # Guest-mode vary hits a WordPress plugin path that we do not serve.
    html = re.sub(
        r"""<script data-no-optimize="1">var litespeed_vary=.*?</script>""",
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(
        r"""<script data-no-optimize="1">var litespeed_docref=.*?</script>""",
        "",
        html,
        flags=re.I | re.S,
    )
    html = re.sub(r"""<script[^>]+src="/cdn-cgi/[^"]+"[^>]*>.*?</script>""", "", html, flags=re.I | re.S)
    html = re.sub(r"""<script[^>]+src="https://www.googletagmanager.com[^"]*"[^>]*>.*?</script>""", "", html, flags=re.I | re.S)
    html = re.sub(r"""<script[^>]+src="https://www.google.com/recaptcha[^"]*"[^>]*>.*?</script>""", "", html, flags=re.I | re.S)
    html = re.sub(r"""<script[^>]+src="https://challenges.cloudflare.com[^"]*"[^>]*>.*?</script>""", "", html, flags=re.I | re.S)
    html = re.sub(r"""<script[^>]+src="https://static.cloudflareinsights.com[^"]*"[^>]*>.*?</script>""", "", html, flags=re.I | re.S)
    html = re.sub(r"""["']/?cdn-cgi/[^"']+["']""", '""', html)
    # Optimized LiteSpeed pages delay JS until a gesture. The unoptimized snapshot
    # already has real script tags; only force-load when that helper exists.
    if "litespeed/javascript" in html and "data-startkey-akademi-force-js" not in html:
        html = html.replace(
            "</body>",
            '<script data-startkey-akademi-force-js="1" data-no-optimize="1">'
            'document.addEventListener("DOMContentLoaded",function(){'
            'if(typeof litespeed_load_delayed_js_force==="function"){'
            "litespeed_load_delayed_js_force()"
            "}});"
            "</script></body>",
        )
    return html


CF_EMAIL_NODE = re.compile(
    r"""<(?P<tag>a|span)(?P<attrs>[^>]*class="[^"]*__cf_email__[^"]*"[^>]*)>(?P<inner>.*?)</(?P=tag)>""",
    re.I | re.S,
)
CF_EMAIL_PLACEHOLDER = re.compile(r"\[email(?:&#160;|&nbsp;|\s)protected\]", re.I)


def decode_emails(html: str) -> str:
    def replace_anchor(match: re.Match[str]) -> str:
        email = decode_cf_email(match.group("hex"))
        inner = CF_EMAIL_SPAN.sub(email, match.group("inner"))
        inner = CF_EMAIL_PLACEHOLDER.sub(email, inner)
        if not inner.strip():
            inner = email
        return f'<a href="mailto:{email}">{inner}</a>'

    html = CF_EMAIL.sub(replace_anchor, html)

    def replace_node(match: re.Match[str]) -> str:
        hex_match = re.search(r"""data-cfemail=(['"])(?P<hex>[0-9a-fA-F]+)\1""", match.group("attrs"), re.I)
        if not hex_match:
            return match.group(0)
        email = decode_cf_email(hex_match.group("hex"))
        if match.group("tag").lower() == "a":
            return f'<a href="mailto:{email}">{email}</a>'
        return email

    html = CF_EMAIL_NODE.sub(replace_node, html)

    def replace_data(match: re.Match[str]) -> str:
        email = decode_cf_email(match.group("hex"))
        return f'data-email="{email}"'

    html = CF_EMAIL_DATA.sub(replace_data, html)
    html = re.sub(
        r"""<a([^>]*)>\s*<span[^>]*data-email="([^"]+)"[^>]*>\[email(?:&#160;|&nbsp;|\s)protected\]</span>\s*</a>""",
        r'<a href="mailto:\2">\2</a>',
        html,
        flags=re.I,
    )
    html = re.sub(
        r"""<a([^>]*)data-email="([^"]+)"([^>]*)>\[email(?:&#160;|&nbsp;|\s)protected\]</a>""",
        r'<a href="mailto:\2">\2</a>',
        html,
        flags=re.I,
    )
    html = re.sub(
        r"""<span([^>]*)data-email="([^"]+)"([^>]*)>\[email(?:&#160;|&nbsp;|\s)protected\]</span>""",
        r"\2",
        html,
        flags=re.I,
    )
    html = re.sub(
        r'<a class="">([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})</a>',
        r'<a href="mailto:\1">\1</a>',
        html,
    )
    return html


def promote_lazy_images(html: str) -> str:
    """LiteSpeed leaves real image URLs on data-src and a tiny SVG in src.

    The delayed lazy-load script often never swaps them locally, so category
    photos, logos and blog thumbs stay empty. Promote the real URLs in the
    snapshot so the page matches the post-lazy-load reference.
    """

    def replace_img(match: re.Match[str]) -> str:
        tag = match.group(0)
        data_src = re.search(r"""data-src=(['"])(?P<url>[^'"]+)\1""", tag, re.I)
        if not data_src:
            return tag
        real = data_src.group("url")
        if real.startswith("data:"):
            return tag
        tag = re.sub(r"""\ssrc=(['"])[^'"]*\1""", f" src={data_src.group(1)}{real}{data_src.group(1)}", tag, count=1, flags=re.I)
        data_srcset = re.search(r"""data-srcset=(['"])(?P<value>[^'"]+)\1""", tag, re.I)
        if data_srcset:
            value = data_srcset.group("value")
            quote = data_srcset.group(1)
            if re.search(r"""\ssrcset=['"]""", tag, re.I):
                tag = re.sub(r"""\ssrcset=(['"])[^'"]*\1""", f" srcset={quote}{value}{quote}", tag, count=1, flags=re.I)
            else:
                tag = re.sub(r"/?>\s*$", f" srcset={quote}{value}{quote}>", tag)
        data_sizes = re.search(r"""data-sizes=(['"])(?P<value>[^'"]+)\1""", tag, re.I)
        if data_sizes and not re.search(r"""\ssizes=['"]""", tag, re.I):
            tag = re.sub(
                r"/?>\s*$",
                f" sizes={data_sizes.group(1)}{data_sizes.group('value')}{data_sizes.group(1)}>",
                tag,
            )
        tag = re.sub(r"""\sdata-lazyloaded=(['"])[^'"]*\1""", "", tag, flags=re.I)
        return tag

    return re.sub(r"<img\b[^>]*>", replace_img, html, flags=re.I)


def strip_snapshot_query(html: str) -> str:
    html = html.replace("?LSCWP_CTRL=before_optm", "")
    html = html.replace("&LSCWP_CTRL=before_optm", "")
    html = html.replace('{"LSCWP_CTRL":"before_optm"}', "{}")
    return html


def rewrite_html(html: str) -> str:
    html = decode_emails(html)
    html = strip_unwanted_scripts(html)
    html = promote_lazy_images(html)
    html = strip_snapshot_query(html)

    def replace_attr(match: re.Match[str]) -> str:
        return f'{match.group("attr")}={match.group("q")}{rewrite_public_url(match.group("url"))}{match.group("q")}'

    html = URL_ATTR.sub(replace_attr, html)

    def replace_srcset(match: re.Match[str]) -> str:
        return f'{match.group("attr")}={match.group("q")}{rewrite_srcset(match.group("value"))}{match.group("q")}'

    html = SRCSET_ATTR.sub(replace_srcset, html)
    html = rewrite_text_urls(html)

    # Homepage canonical / og:url become the local mount.
    html = html.replace(f"{PREFIX}/\"", f'{PREFIX}/"')

    # LiteSpeed UCSS drops #elementor-device-mode:after because that span is created
    # by JS. Elementor then reads content:"none" and the theme FOUC CSS keeps
    # desktop/mobile .elementor-element hidden. These three queries are the live
    # frontend.min.css rules (disabled breakpoints use max/min-width:-1).
    html = re.sub(
        r'<style data-startkey-akademi-device-mode="1">.*?</style>',
        "",
        html,
        flags=re.S,
    )
    for href in FULL_CSS_HREFS:
        html = html.replace(f'<link rel="stylesheet" href="{href}">', "")
    extras = (
        '<style data-startkey-akademi-device-mode="1">'
        '@media (min-width:1025px){#elementor-device-mode:after{content:"desktop"}}'
        '@media (max-width:1024px){#elementor-device-mode:after{content:"tablet"}}'
        '@media (max-width:767px){#elementor-device-mode:after{content:"mobile"}}'
        ".e-font-icon-svg{display:inline-block;width:1em;height:1em;fill:currentColor}"
        ".inner-icon .icon svg{width:1em;height:1em;fill:currentColor}"
        "</style>"
    )
    # Unoptimized HTML already has the real Elementor/Eduma stylesheets.
    if "elementor-frontend-inline-css" not in html:
        extras += "".join(f'<link rel="stylesheet" href="{href}">' for href in FULL_CSS_HREFS)
    html = html.replace("</head>", extras + "</head>")
    html = inject_elementor_chunks(html)
    html = re.sub(
        r"/akademi/egitimler/(?:&|\?)paged=(\d+)",
        r"/akademi/egitimler/page/\1/",
        html,
    )
    return html


def inject_elementor_chunks(html: str) -> str:
    """Register webpack chunks that Next will 404 until the next image rebuild.

    Nested tabs (SSS left column) load nested-tabs + keyboard handler only after
    Elementor boots. Hover CSS also waits for data-touch-mode from that handler.
    """
    if 'data-startkey-elementor-chunks="1"' in html:
        return html
    if "elementor-widget-n-tabs" not in html:
        return html
    scripts = []
    for name in (
        "nested-tabs.a2401356d329f179475e.bundle.min.js",
        "nested-title-keyboard-handler.2a67d3cc630e11815acc.bundle.min.js",
    ):
        path = PUBLIC / "wp-content/plugins/elementor/assets/js" / name
        if path.exists():
            scripts.append(path.read_text(encoding="utf-8"))
    if not scripts:
        return html
    block = '<script data-startkey-elementor-chunks="1">' + "\n".join(scripts) + "</script>"
    marker = '<script id="elementor-webpack-runtime-js"'
    start = html.find(marker)
    if start == -1:
        return html.replace("</body>", block + "</body>")
    end = html.find("</script>", start)
    if end == -1:
        return html
    end += len("</script>")
    return html[:end] + block + html[end:]


def extra_known_paths() -> list[str]:
    return [
        "/wp-content/uploads/2025/05/banner-google.webp",
        "/wp-content/uploads/2024/08/favicon-32x32.png",
        "/wp-content/uploads/2024/08/favicon-192x192.png",
        "/wp-content/uploads/2024/08/favicon-180x180.png",
        "/wp-content/uploads/2024/08/favicon-270x270.png",
        "/wp-content/uploads/2025/05/rank-logo.jpg",
        "/wp-content/uploads/complianz/css/banner-1-optin.css",
        "/wp-includes/js/jquery/jquery.min.js",
        "/wp-content/plugins/learnpress/assets/js/global.min.js",
        # Elementor webpack chunks are requested only after LiteSpeed promotes JS.
        "/wp-content/plugins/elementor/assets/js/shared-frontend-handlers.03caa53373b56d3bab67.bundle.min.js",
        "/wp-content/plugins/elementor/assets/js/text-editor.45609661e409413f1cef.bundle.min.js",
        "/wp-content/plugins/elementor/assets/js/image-carousel.6167d20b95b33386757b.bundle.min.js",
        "/wp-content/plugins/elementor/assets/js/nested-accordion.294d40984397351fd0f5.bundle.min.js",
        "/wp-content/plugins/elementor/assets/js/nested-tabs.a2401356d329f179475e.bundle.min.js",
        "/wp-content/plugins/elementor/assets/js/counter.12335f45aaa79d244f24.bundle.min.js",
        "/wp-content/plugins/elementor/assets/js/nested-title-keyboard-handler.2a67d3cc630e11815acc.bundle.min.js",
        "/wp-content/plugins/elementor-pro/assets/js/form.cfd61a9174be80f835c6.bundle.min.js",
        "/wp-content/plugins/elementor-pro/assets/js/popup.61d4fcab8891b2e07802.bundle.min.js",
        "/wp-content/plugins/elementor/assets/lib/swiper/v8/css/swiper.min.css",
        "/wp-content/plugins/elementor/assets/css/frontend.min.css",
        "/wp-content/uploads/elementor/css/custom-frontend.min.css",
        "/wp-content/plugins/thim-elementor-kit/build/frontend.css",
        "/wp-content/themes/eduma/style.css",
    ]

FULL_CSS_HREFS = [
    "/akademi/wp-content/plugins/elementor/assets/lib/swiper/v8/css/swiper.min.css",
    "/akademi/wp-content/plugins/elementor/assets/css/frontend.min.css",
    "/akademi/wp-content/uploads/elementor/css/custom-frontend.min.css",
    "/akademi/wp-content/plugins/thim-elementor-kit/build/frontend.css",
    "/akademi/wp-content/themes/eduma/style.css",
]


def snapshot_url(path: str) -> str:
    if path == "/":
        return SNAPSHOT_URL
    return ORIGIN + path + ("&" if "?" in path else "?") + "LSCWP_CTRL=before_optm"


def discover_course_pages(htmls: list[str]) -> list[tuple[str, str, str]]:
    found: list[tuple[str, str, str]] = []
    seen: set[str] = set()
    for html in htmls:
        for href in re.findall(r"""href=(['"])([^'"]+)\1""", html, re.I):
            path = origin_path(href[1])
            if not path or not path.startswith("/egitimler/"):
                continue
            parts = [part for part in path.strip("/").split("/") if part]
            if len(parts) != 2 or parts[0] != "egitimler":
                continue
            slug = parts[1]
            if slug in {"egitimler", "page", "feed"} or slug.isdigit():
                continue
            if slug in seen:
                continue
            seen.add(slug)
            found.append((f"course-{slug}", f"/egitimler/{slug}/", f"pages/egitimler/{slug}.html"))
    return found


def dest_from_origin_path(path: str) -> str:
    clean = path.split("?")[0].strip("/")
    return f"pages/{clean}.html"


def discover_related_pages(htmls: list[str]) -> list[tuple[str, str, str]]:
    """Instructors, lessons and any leftover public links from already-fetched HTML."""
    found: list[tuple[str, str, str]] = []
    seen: set[str] = set()
    prefixes = (
        "/egitmen/",
        "/egitmenler/",
        "/egitim-kategorisi/",
        "/category/",
        "/giris/",
        "/kayit/",
        "/sepet/",
        "/odeme/",
        "/kontrol-paneli/",
    )
    for html in htmls:
        for href in re.findall(r"""href=(['"])([^'"]+)\1""", html, re.I):
            raw = html_unescape_amp(href[1]).strip()
            path = origin_path(raw)
            if not path:
                continue
            parts = [part for part in path.strip("/").split("/") if part]
            is_lesson = (
                len(parts) >= 4
                and parts[0] == "egitimler"
                and parts[2] == "egitim-erisimi"
            )
            if not is_lesson and not any(path.startswith(prefix) for prefix in prefixes):
                continue
            if "feed" in parts or (not is_lesson and "page" in parts):
                continue
            key = path.rstrip("/")
            if key in seen or key in {"", "/"}:
                continue
            seen.add(key)
            name = "rel-" + key.strip("/").replace("/", "-")
            found.append((name, path if path.endswith("/") else path + "/", dest_from_origin_path(path)))
    return found


def enqueue_page_assets(raw: str, queue: list[str]) -> None:
    for url in collect_html_urls(raw):
        extra = origin_path(url)
        if extra and extra != "/":
            queue.append(extra)
    for match in re.finditer(r"https://startkeyakademi\.net(/wp-content/litespeed/[^\"'?]+)", raw):
        queue.append(match.group(1))


def load_page_html(name: str, path: str) -> str:
    snapshot = SNAPSHOT_DIR / f"{name}-tr.html"
    if snapshot.exists() and snapshot.stat().st_size > 0 and not FORCE:
        print(f"using existing snapshot {snapshot}")
        return snapshot.read_text(encoding="utf-8")
    print(f"fetching {path}…")
    raw = fetch(snapshot_url(path)).decode("utf-8", errors="replace")
    snapshot.parent.mkdir(parents=True, exist_ok=True)
    snapshot.write_text(raw, encoding="utf-8")
    print(f"snapshot {snapshot} ({len(raw)} bytes)")
    return raw


def main() -> int:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)

    stats = {"added": 0, "updated": 0, "skip": 0, "failed": 0, "missing": 0}
    queue: list[str] = []
    seen: set[str] = set()
    pages: list[tuple[str, str, str]] = []

    only = os.environ.get("PAGES", "").strip()
    wanted = {item.strip() for item in only.split(",") if item.strip()} if only else None
    scan_snapshots_for_discovery = wanted is not None and "gaps" in wanted
    if wanted is not None and "egitimler" in wanted:
        wanted.update({"egitimler", "egitimler-2", "egitimler-3"})
    if wanted is not None and "gaps" in wanted:
        already = {
            "homepage",
            "akademi",
            "egitimler",
            "egitimler-2",
            "egitimler-3",
            "sss",
            "iletisim",
            "kvkk",
            "kullanim-kosullari",
            "gizlilik-bilgilendirmesi",
            "geri-odeme-bilgilendirmesi",
            "cerez-bilgilendirmesi",
        }
        wanted.update(name for name, _path, _dest in PAGES if name not in already)
        wanted.discard("gaps")

    for name, path, dest in PAGES:
        if wanted is not None and name not in wanted:
            continue
        raw = load_page_html(name, path)
        pages.append((name, dest, raw))
        enqueue_page_assets(raw, queue)

    listing_htmls = [raw for name, _dest, raw in pages if name.startswith("egitimler")]
    if listing_htmls:
        existing = {name for name, _dest, _raw in pages}
        for name, path, dest in discover_course_pages(listing_htmls):
            if name in existing:
                continue
            raw = load_page_html(name, path)
            pages.append((name, dest, raw))
            enqueue_page_assets(raw, queue)

    discovery_htmls = [raw for _name, _dest, raw in pages]
    if scan_snapshots_for_discovery:
        for snap in SNAPSHOT_DIR.glob("*-tr.html"):
            discovery_htmls.append(snap.read_text(encoding="utf-8"))
    existing_dests = {dest for _name, dest, _raw in pages}
    for name, path, dest in discover_related_pages(discovery_htmls):
        if dest in existing_dests:
            continue
        raw = load_page_html(name, path)
        pages.append((name, dest, raw))
        existing_dests.add(dest)
        enqueue_page_assets(raw, queue)

    queue.extend(extra_known_paths())

    while queue:
        path = queue.pop(0).split("#")[0]
        path = urllib.parse.unquote(path)
        if not path.startswith("/"):
            continue
        if path in seen:
            continue
        seen.add(path)
        if path.endswith(("/", ".php", ".xml")) or not is_asset_path(path):
            continue
        download_asset(path, stats, queue)

    leftover_total = 0
    for name, dest, raw in pages:
        processed = rewrite_html(raw)
        destination = PUBLIC / dest
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(processed, encoding="utf-8")
        leftover = processed.count("startkeyakademi.net")
        leftover_total += leftover
        print(f"processed {destination} ({len(processed)} bytes)")
        if leftover:
            print(f"WARN {name}: {leftover} startkeyakademi.net mentions remain.", file=sys.stderr)

    print(
        "assets: "
        f"added={stats['added']} updated={stats['updated']} skipped={stats['skip']} "
        f"failed={stats['failed']} absent-on-reference={stats['missing']} "
        f"origin-mentions-in-html={leftover_total}"
    )
    return 1 if stats["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
