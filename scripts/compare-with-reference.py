#!/usr/bin/env python3
"""
Compares the rendered local homepage with the reference snapshot.

Both documents are normalised into a line-per-node outline (tag, class, a few
behaviour-carrying attributes and the text) and then diffed, so structural or textual
differences show up as plain diff hunks.

Normalisation removes the differences that are expected and irrelevant:

* the reference's Blazor CSS-isolation attributes (`b-xxxxxxxxxx`)
* the reference's duplicate `class` attributes (browsers apply the first one only)
* React's hydration markers and Next.js' own scripts
* asset hosts: reference CDN/ImageKit URLs become the local paths they were saved to
* cache-busting `?v=` query strings

Usage: compare-with-reference.py <local-url-or-file> <reference-file> [--section NAME]
"""
import argparse
import difflib
import html
import re
import sys
import urllib.request
from html.parser import HTMLParser

SCOPE_ATTR = re.compile(r"^b-[a-z0-9]{10}$")
CDN = re.compile(r"https?://cdnc\.re-os\.com")
IMAGEKIT = re.compile(r"https?://ik\.imagekit\.io/reoscom/*(?:tr:[^/]*/)?")
REFERENCE_ORIGIN = re.compile(r"https?://(?:www\.)?startkey\.com\.tr")
CACHE_BUST = re.compile(r"\?v=[^\s\"']+")
WHITESPACE = re.compile(r"\s+")

# Attributes that carry layout or behaviour and are therefore compared.
KEPT_ATTRS = (
    "id",
    "src",
    "srcset",
    "href",
    "action",
    "method",
    "type",
    "name",
    "placeholder",
    "style",
    "role",
    "data-bs-toggle",
    "data-bs-target",
    "data-bs-parent",
    "data-count",
    "data-aos",
    "data-aos-delay",
    "data-aos-duration",
    "data-fancybox",
    "bind-url",
    "bind-id",
    "bind-query",
    "width",
    "height",
    "loading",
    "alt",
    "media",
    "aria-expanded",
    "aria-controls",
    "aria-labelledby",
    "target",
)

SKIP_TAGS = {"script", "noscript", "template", "svg", "path", "meta", "title"}
VOID_TAGS = {"img", "source", "input", "br", "hr", "link", "meta", "i"}


def normalise_url(value: str) -> str:
    value = IMAGEKIT.sub("/media/", value)
    value = CDN.sub("/media/", value)
    value = REFERENCE_ORIGIN.sub("", value)
    value = CACHE_BUST.sub("", value)
    value = value.replace("/media//", "/media/")
    # Media assets: the reference asks its image service for a transformed variant while
    # the reproduction serves the saved file, so the query string and the file extension
    # (.png/.jpg versus the .webp companion) are compared as one and the same asset.
    if "/media/" in value:
        value = re.sub(r"\?[^\s]*", "", value)
        value = re.sub(r"\.(?:png|jpe?g|webp)\b", "", value)
    return value


class Outline(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lines: list[str] = []
        self.depth = 0
        self.stack: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if self.skip_depth:
            if tag not in VOID_TAGS:
                self.skip_depth += 1
            return
        if tag in SKIP_TAGS:
            if tag not in VOID_TAGS:
                self.skip_depth = 1
            return

        seen: dict[str, str] = {}
        classes = None
        for name, value in attrs:
            value = "" if value is None else value
            if SCOPE_ATTR.match(name):
                continue
            if name == "class":
                # Duplicate class attributes: only the first one applies in a browser.
                if classes is None:
                    classes = WHITESPACE.sub(" ", value).strip()
                continue
            if name in KEPT_ATTRS and name not in seen:
                value = normalise_url(WHITESPACE.sub(" ", value).strip())
                if name == "style":
                    # React prints declarations without spaces and without a trailing
                    # semicolon; compare the declarations themselves.
                    value = ";".join(
                        WHITESPACE.sub("", part) for part in value.split(";") if part.strip()
                    )
                seen[name] = value

        parts = [f"<{tag}"]
        if classes:
            parts.append(f'class="{classes}"')
        for name in KEPT_ATTRS:
            if name in seen and seen[name] != "":
                parts.append(f'{name}="{seen[name]}"')
        parts.append(">")

        # Browsers close an open <li> when the next one starts; the reference relies on
        # that, so the outline follows the same rule to describe the resulting DOM.
        if tag == "li" and self.stack and self.stack[-1] == "li":
            self.stack.pop()
            self.depth -= 1

        self.lines.append(" ".join(parts))
        if tag not in VOID_TAGS:
            self.depth += 1
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if self.skip_depth:
            self.skip_depth -= 1
            return
        if tag in VOID_TAGS or tag in SKIP_TAGS:
            return
        while self.stack:
            open_tag = self.stack.pop()
            self.depth -= 1
            if open_tag == tag:
                break

    def handle_data(self, data):
        if self.skip_depth:
            return
        text = WHITESPACE.sub(" ", html.unescape(data)).strip()
        # React hydration comments/markers and empty text nodes carry no meaning.
        if text and text not in {"<!-- -->", "$", "/$"}:
            self.lines.append(f"#text {normalise_url(text)}")


def outline(markup: str) -> list[str]:
    parser = Outline()
    parser.feed(markup)
    return parser.lines


def load(source: str) -> str:
    if source.startswith("http://") or source.startswith("https://"):
        request = urllib.request.Request(source, headers={"User-Agent": "startkey-compare"})
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read().decode("utf-8")
    with open(source, encoding="utf-8") as handle:
        return handle.read()


def slice_section(lines: list[str], marker: str, until: str | None) -> list[str]:
    start = next((i for i, line in enumerate(lines) if marker in line), None)
    if start is None:
        return []
    if until is None:
        return lines[start:]
    end = next((i for i, line in enumerate(lines[start + 1:], start + 1) if until in line), len(lines))
    return lines[start:end]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("local")
    parser.add_argument("reference")
    parser.add_argument("--section", help="start comparing at the first node containing this text")
    parser.add_argument("--until", help="stop comparing at the first node containing this text")
    parser.add_argument("--context", type=int, default=2)
    args = parser.parse_args()

    local = outline(load(args.local))
    reference = outline(load(args.reference))

    if args.section:
        local = slice_section(local, args.section, args.until)
        reference = slice_section(reference, args.section, args.until)
        if not local or not reference:
            print(f"section {args.section!r} not found in "
                  f"{'local' if not local else 'reference'} document")
            return 2

    diff = list(difflib.unified_diff(
        reference, local, fromfile="reference", tofile="local",
        n=args.context, lineterm="",
    ))

    if not diff:
        print(f"identical ({len(local)} nodes)")
        return 0

    print("\n".join(diff))
    added = sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
    removed = sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))
    print(f"\nreference nodes: {len(reference)}  local nodes: {len(local)}  +{added} -{removed}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
