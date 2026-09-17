#!/usr/bin/env python3
"""
Downloads the reference website's own static assets into web/public.

Everything the reference serves from its own origin — stylesheets, script bundles,
theme images, icon fonts — is mirrored so the reproduction is byte-identical and never
requests anything from the reference at runtime. The list is derived from
reference/snapshots/homepage-{tr,en,de}.html and then followed into the stylesheets, so
fonts and background images referenced only from CSS are included too.

Files are re-downloaded on every run and changes are reported: a stale stylesheet is
otherwise impossible to notice and changes how the page renders.
"""
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from posixpath import normpath

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOTS = ROOT / "reference" / "snapshots"
PUBLIC = ROOT / "web" / "public"
BASE = "https://startkey.com.tr"
LANGS = ("tr", "en", "de")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

# Site-relative assets in the markup: stylesheets, scripts and theme images.
ASSET_ATTRIBUTE = re.compile(r'(?:href|src)="(/(?:themes|css|js|lib|img)/[^"?]+)')
CSS_URL = re.compile(r"url\(\s*['\"]?(?!data:|https?:)([^)'\"]+?)['\"]?\s*\)")
# Google Fonts are rewritten by the reference to its own /themes/fela/fonts/google path.
FOLLOWED = (".css",)


def fetch(path):
    request = urllib.request.Request(f"{BASE}{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def resolve(css_path, reference):
    """Absolute site path for a `url()` reference inside a stylesheet."""
    reference = reference.split("?")[0].split("#")[0]
    if reference.startswith("/"):
        return reference
    return normpath(f"{Path(css_path).parent.as_posix()}/{reference}")


def main():
    queue = []
    for lang in LANGS:
        page = (SNAPSHOTS / f"homepage-{lang}.html").read_text(encoding="utf-8")
        queue.extend(ASSET_ATTRIBUTE.findall(page))

    seen = set()
    saved = changed = failed = 0
    missing = []

    while queue:
        path = queue.pop(0)
        if path in seen:
            continue
        seen.add(path)

        try:
            payload = fetch(path)
        except urllib.error.HTTPError as error:
            # Some stylesheets reference images the reference website does not serve
            # either; those requests 404 there as well, so they are not a problem here.
            if error.code == 404:
                missing.append(path)
                continue
            failed += 1
            print(f"FAIL {path}: {error}", file=sys.stderr)
            continue
        except (urllib.error.URLError, OSError) as error:
            failed += 1
            print(f"FAIL {path}: {error}", file=sys.stderr)
            continue

        destination = PUBLIC / path.lstrip("/")
        previous = destination.read_bytes() if destination.exists() else None
        if previous != payload:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(payload)
            changed += 1
            print(f"{'updated' if previous else 'added'} {path} ({len(payload)} bytes)")
        saved += 1

        if path.endswith(FOLLOWED):
            text = payload.decode("utf-8", errors="replace")
            queue.extend(resolve(path, reference) for reference in CSS_URL.findall(text))

    print(
        f"static: files={saved} changed={changed} failed={failed} "
        f"absent-on-reference={len(missing)}"
    )
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
