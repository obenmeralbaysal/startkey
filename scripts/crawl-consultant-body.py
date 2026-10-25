#!/usr/bin/env python3
"""
Copies the introduction body of the consultant application page (tr/en/de) from
StartKey.com.tr into api/database/data/consultant-bodies/{lang}.html.

The body is everything between the application form and the footer: the
`hw-wrap` section, the form/presentation buttons and the partner sliders. Media
is stored under web/public/media like the other crawlers. The inline
`onclick="scrollToForm()"` becomes `data-scroll-to-form`; the page binds it.
"""
from __future__ import annotations

import importlib.util
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "api" / "database" / "data" / "consultant-bodies"
SNAP = ROOT / "reference" / "snapshots" / "consultant-form"
PAGES = {
    "tr": "/tr/danisman-basvuru",
    "en": "/en/consultant-form",
    "de": "/de/consultant-form",
}
S3 = re.compile(r'https://reos-cdn-files\.s3-eu-west-1\.amazonaws\.com/([^"\s?]+)')

spec = importlib.util.spec_from_file_location("corporate", ROOT / "scripts" / "crawl-corporate.py")
corporate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(corporate)


def body(page: str) -> str:
    start = page.find('<section class="hw-wrap')
    if start < 0:
        raise ValueError("hw-wrap section not found")
    end = page.find("<script", start)
    footer = page.find("<footer", start)
    if end < 0 or (0 <= footer < end):
        end = footer
    fragment = page[start:end].rstrip()
    # The fragment closes the reference .content-wrapper; drop the unmatched tail.
    opened = len(re.findall(r"<div\b", fragment))
    closed = len(re.findall(r"</div>", fragment))
    for _ in range(max(0, closed - opened)):
        fragment = fragment[: fragment.rstrip().rfind("</div>")].rstrip()
    return fragment


def download_s3(fragment: str) -> None:
    for path in sorted(set(S3.findall(fragment))):
        dest = corporate.PUBLIC / path
        if dest.exists() and dest.stat().st_size > 0:
            continue
        req = urllib.request.Request(
            f"https://reos-cdn-files.s3-eu-west-1.amazonaws.com/{path}", headers={"User-Agent": corporate.UA}
        )
        with urllib.request.urlopen(req, timeout=60) as response:
            payload = response.read()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(payload)
        print(f"  downloaded {path}")


def main() -> int:
    SNAP.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    fragments = {}
    for lang, path in PAGES.items():
        print(f"  {lang} {path}")
        page = corporate.fetch(path)
        (SNAP / f"{lang}.html").write_text(page, encoding="utf-8")
        fragments[lang] = body(page)

    corporate.download_media(corporate.collect_media(list(fragments.values())))
    for lang, fragment in fragments.items():
        download_s3(fragment)
        html = corporate.localise_html(fragment)
        html = S3.sub(lambda match: f"/media/{match.group(1)}", html)
        html = html.replace('onclick="scrollToForm()"', "data-scroll-to-form")
        (OUT / f"{lang}.html").write_text(html + "\n", encoding="utf-8")
        print(f"wrote {OUT / f'{lang}.html'} ({len(html)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
