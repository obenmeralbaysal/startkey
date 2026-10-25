#!/usr/bin/env python3
"""
Downloads every media file the reference homepage renders into web/public/media.

The reference serves its images through a CDN that resizes and crops them from the
query string, for example `?width=420&height=300&quality=60&mode=Crop`, and offers a
WebP rendition through ImageKit. The reproduction serves plain files, so each file is
downloaded in exactly the variant the reference renders: the bytes, dimensions and
therefore the layout match, and nothing is requested from the reference at runtime.

The download list is derived from reference/snapshots/homepage-{tr,en,de}.html so it
cannot drift from the markup. Re-run after refreshing the snapshots; existing files are
kept unless FORCE=1 is set.
"""
import os
import re
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOTS = ROOT / "reference" / "snapshots"
PUBLIC = ROOT / "web" / "public" / "media"
LANGS = ("tr", "en", "de")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

MEDIA_HOST = r"https://(?:cdnc\.re-os\.com|ik\.imagekit\.io/[A-Za-z0-9_-]+)"
# `src`/`srcset` attributes plus CSS `url()` references in inline styles.
MEDIA_URL = re.compile(
    rf'(?:(?:src|srcset)="\s*({MEDIA_HOST}[^"\s]+)|url\(\s*({MEDIA_HOST}[^)\s]+)\s*\))'
)
IMAGEKIT = re.compile(r"^https://ik\.imagekit\.io/[A-Za-z0-9_-]+/*(?P<transform>[^/]*)/(?P<path>.+)$")
CDN = re.compile(r"^https://cdnc\.re-os\.com/(?P<path>.+)$")


def parse(url):
    """(folder/file, query, transform, is_webp) for a reference media URL."""
    match = IMAGEKIT.match(url)
    transform = ""
    if match:
        transform = match.group("transform") if match.group("transform").startswith("tr:") else ""
        path = match.group("path") if transform else f"{match.group('transform')}/{match.group('path')}"
    else:
        match = CDN.match(url)
        if not match:
            raise ValueError(f"unrecognised media url: {url}")
        path = match.group("path")

    path, _, query = path.partition("?")
    is_webp = "format" in transform or "f-webp" in transform
    return path, query, transform, is_webp


def variant_suffix(transform):
    """`-1920x800` for a resizing ImageKit transform, so variants do not collide."""
    width = re.search(r"\bw-(\d+)", transform)
    height = re.search(r"\bh-(\d+)", transform)
    if not width:
        return ""
    return f"-{width.group(1)}x{height.group(1)}" if height else f"-{width.group(1)}"


def collect():
    """{destination path: source url} for every media file the snapshots render."""
    urls = set()
    for lang in LANGS:
        page = (SNAPSHOTS / f"homepage-{lang}.html").read_text(encoding="utf-8")
        urls.update(match.group(1) or match.group(2) for match in MEDIA_URL.finditer(page))

    # A file rendered in more than one size needs a suffix per size; a file rendered in
    # a single size keeps its plain name, which is what the extracted content refers to.
    variants = defaultdict(set)
    for url in urls:
        path, _, transform, _ = parse(url)
        variants[path].add(variant_suffix(transform))

    targets = {}
    for url in sorted(urls):
        path, query, transform, is_webp = parse(url)
        stem, extension = path.rsplit(".", 1)
        suffix = variant_suffix(transform) if len(variants[path] - {""}) > 1 else ""
        destination = f"{stem}{suffix}.{'webp' if is_webp else extension}"
        source = f"{url.split('?')[0]}?{query}" if query else url.split("?")[0]
        targets[destination] = source
    return targets


def download(url, destination, want_webp):
    # ImageKit picks the rendition from `Accept`, exactly as it does for the reference
    # website's visitors, so the WebP sources have to ask for WebP.
    headers = {"User-Agent": UA, "Accept": "image/webp,*/*" if want_webp else "*/*"}
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = response.read()
    if not payload:
        raise ValueError("empty response")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(payload)


def main():
    force = os.environ.get("FORCE") == "1"
    downloaded = skipped = failed = 0

    for relative, url in sorted(collect().items()):
        destination = PUBLIC / relative
        if destination.exists() and destination.stat().st_size > 0 and not force:
            skipped += 1
            continue
        try:
            download(url, destination, want_webp=destination.suffix == ".webp")
            downloaded += 1
        except (urllib.error.URLError, ValueError, OSError) as error:
            failed += 1
            print(f"FAIL {url}: {error}", file=sys.stderr)

    print(f"media: downloaded={downloaded} skipped={skipped} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
