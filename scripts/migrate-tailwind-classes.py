#!/usr/bin/env python3
"""Rewrite Bootstrap and Fela class names to Tailwind utilities.

Single-class rules become utilities on that class. Same-element compounds
(`.btn.style1`) become a phrase. Descendant rules fold onto the subject class
unless that class is generic (`btn`, `style1`, columns, display helpers).

Seed HTML that still contains an unmapped Bootstrap or Fela class fails the run.

After a crawl, convert only the fresh seed files and refresh the class source:

    python3 scripts/migrate-tailwind-classes.py --seed api/database/data/corporate-seed.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_FILES = [
    ROOT / "web/public/themes/fela/css/style.css",
    ROOT / "web/public/themes/fela/css/app.css",
    ROOT / "web/public/themes/fela/css/responsive.css",
    ROOT / "web/public/themes/fela/css/bootstrap.min.css",
]
SKIP_CLASS = {
    "active",
    "show",
    "open",
    "hidden",
    "fade",
    "collapse",
    "collapsing",
    "disabled",
    "select2",
    "bind-select2",
    "owl-carousel",
    "owl-theme",
    "odometer",
    "btn",
    "style1",
    "style2",
    "style3",
    "style4",
    "style6",
    "container",
    "row",
    "nav-item",
    "nav-link",
    "dropdown-menu",
    "form-control",
}
ICON_PREFIXES = ("ri-", "flaticon-", "fa-", "fab", "fas", "far", "fal")
ICON_EXACT = {"fa", "fas", "far", "fal", "fab"}

PHRASES: dict[str, str] = {
    # Share bar under CMS pages and articles (.post-share / .social-profile.style2 in style.css).
    "post-share": "inline-block [&_span]:font-medium [&_span]:text-black",
    # Paid training payment block: only .list-style applies outside .agent-info-box.
    "agent-address list-style": "m-0 list-none p-0",
    "social-profile style2 list-style": (
        "relative top-[calc(2px*var(--sk-scale,1))] inline-block m-0 ml-[calc(5px*var(--sk-scale,1))] p-0 "
        "list-none [&_li]:inline-block [&_li]:mx-[calc(4px*var(--sk-scale,1))] [&_li:first-child]:ml-0 "
        "[&_li:last-child]:mr-0 [&_a]:flex [&_a]:flex-col [&_a]:justify-center "
        "[&_a]:w-[calc(35px*var(--sk-scale,1))] [&_a]:h-[calc(35px*var(--sk-scale,1))] [&_a]:text-center "
        "[&_a]:border [&_a]:border-solid [&_a]:border-transparent [&_a]:bg-neutral-50 [&_a]:rounded-full "
        "[&_a]:shadow-[0_calc(5px*var(--sk-scale,1))_calc(8px*var(--sk-scale,1))_rgba(0,0,0,0.01)] "
        "[&_a]:transition-all [&_a]:duration-300 [&_a]:ease-in-out [&_a:hover]:bg-brand "
        "[&_a:hover]:-translate-y-[calc(3px*var(--sk-scale,1))] [&_i]:block "
        "[&_i]:text-[calc(16px*var(--sk-scale,1))] [&_i]:leading-[0.8] [&_i]:text-navy "
        "[&_i]:transition-all [&_a:hover_i]:text-white"
    ),
    "btn style1": (
        "relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent "
        "bg-navy text-center text-white rounded-[calc(5px*var(--sk-scale,1))] "
        "px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] "
        "leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] "
        "before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-brand "
        "before:invisible before:opacity-0 before:transition-all before:duration-[400ms] "
        "after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-brand "
        "after:invisible after:opacity-0 after:transition-all after:duration-[400ms] "
        "hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 "
        "hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100"
    ),
    "btn style2": (
        "relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent "
        "bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] "
        "px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] "
        "leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] "
        "before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy "
        "before:invisible before:opacity-0 before:transition-all before:duration-[400ms] "
        "after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy "
        "after:invisible after:opacity-0 after:transition-all after:duration-[400ms] "
        "hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 "
        "hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100"
    ),
}

# Bootstrap grid and helpers. Widths follow the theme breakpoints in globals.css.
GRID: dict[str, str] = {
    "container": "container",
    "container-fluid": "w-full px-[calc(12px*var(--sk-scale,1))]",
    # Bootstrap gutter: column padding and a negative row margin, 24px unless gx-* says otherwise.
    # Children reset --sk-gx so a nested row starts from the default again.
    "row": (
        "flex flex-wrap [--sk-row-gx:var(--sk-gx,calc(24px*var(--sk-scale,1)))] "
        "mx-[calc(var(--sk-row-gx)*-0.5)] [&>*]:[--sk-gx:initial] [&>*]:box-border [&>*]:shrink-0 "
        "[&>*]:max-w-full [&>*]:px-[calc(var(--sk-row-gx)*0.5)]"
    ),
    "w-100": "w-full",
    "h-100": "h-full",
    "d-none": "hidden",
    "d-block": "block",
    "d-flex": "flex",
    "d-inline": "inline",
    "d-inline-block": "inline-block",
    "d-lg-none": "lg:hidden",
    "d-lg-block": "hidden lg:block",
    "d-md-none": "md:hidden",
    "d-md-block": "hidden md:block",
    "text-center": "text-center",
    "text-start": "text-start",
    "text-end": "text-end",
    "text-uppercase": "uppercase",
    "text-danger": "text-brand",
    "align-items-center": "items-center",
    "align-items-start": "items-start",
    "justify-content-center": "justify-center",
    "justify-content-between": "justify-between",
    "ms-auto": "ml-auto",
    "me-auto": "mr-auto",
    "mx-auto": "mx-auto",
    "img-fluid": "max-w-full h-auto",
    "list-style": "list-none",
    "position-relative": "relative",
    "overflow-hidden": "overflow-hidden",
    "bg-light": "bg-neutral-100",
    "bg-white": "bg-white",
    "bg-seashell": "bg-seashell",
    "navbar-expand-md": "",
    "navbar-expand-lg": "",
    "navbar-light": "",
    "nav-tabs": "flex",
    "tab-content": "w-full",
    "tab-pane": "hidden",
    "fade": "",
    "form-group": "mb-[calc(15px*var(--sk-scale,1))]",
    "page-wrapper": "min-h-screen",
}


def col_width(prefix: str, span: int) -> str:
    width = {
        12: "w-full",
        6: "w-1/2",
        4: "w-1/3",
        3: "w-1/4",
        2: "w-1/6",
        8: "w-2/3",
        5: "w-5/12",
        7: "w-7/12",
        10: "w-10/12",
    }[span]
    if prefix == "":
        return width
    return f"w-full {prefix}:{width}"


for span in (2, 3, 4, 5, 6, 7, 8, 10, 12):
    GRID[f"col-{span}"] = col_width("", span)
    GRID[f"col-sm-{span}"] = col_width("sm", span)
    GRID[f"col-md-{span}"] = col_width("md", span)
    GRID[f"col-lg-{span}"] = col_width("lg", span)
    GRID[f"col-xl-{span}"] = col_width("xl", span)

GRID["col-12"] = "w-full"
GRID["col-sm-12"] = "w-full"
GRID["col-md-12"] = "w-full"
GRID["col-lg-12"] = "w-full"
GRID["col-xl-12"] = "w-full"
GRID["offset-lg-2"] = "lg:ml-1/6"
GRID["offset-xl-3"] = "xl:ml-1/4"
GRID["col-md-offset-2"] = "md:ml-1/6"
GRID["order-1"] = "order-1"
GRID["order-2"] = "order-2"
GRID["order-md-1"] = "md:order-1"
GRID["order-md-2"] = "md:order-2"
GRID["order-lg-1"] = "lg:order-1"
GRID["order-lg-2"] = "lg:order-2"
def gutter_x(px: int) -> str:
    return f"[--sk-gx:calc({px}px*var(--sk-scale,1))]" if px else "[--sk-gx:0px]"


def gutter_y(px: int) -> str:
    return (
        f"[--sk-row-gy:calc({px}px*var(--sk-scale,1))] mt-[calc(var(--sk-row-gy)*-1)] "
        "[&>*]:mt-[var(--sk-row-gy)]"
    )


GRID["gx-0"] = gutter_x(0)
GRID["gx-3"] = gutter_x(16)
GRID["gx-5"] = gutter_x(48)
GRID["gy-2"] = gutter_y(8)
GRID["gy-40"] = "gap-y-[calc(40px*var(--sk-scale,1))]"
GRID["g-4"] = f"{gutter_x(24)} {gutter_y(24)}"
GRID["row-cols-1"] = "[&>*]:w-full"
GRID["row-cols-md-2"] = "md:[&>*]:w-1/2"
GRID["row-cols-lg-3"] = "lg:[&>*]:w-1/3"

OVERLAY = {
    "about-wrap": "relative",
    "add-listing-wrap": "relative",
    "faq-wrap": "relative",
    "video-wrap": "relative",
    "header-btn": "shrink-0",
    "footer-menu": "list-none",
    "footer-top": "relative",
    "breadcrumb-menu": "m-0 flex list-none flex-wrap p-0 text-white",
    "filter-widget": "block",
    "property-details": "block",
    "property-details-wrap": "block",
    "property-features": "list-none",
    "agent-info-wrap": "block",
    "faq-content": "block",
    "page-item": "inline-block",
    "accordion": "block",
    "header-wrap": "fixed top-0 left-0 z-[999] w-full bg-white",
    "content-wrapper": "mt-[calc(85px*var(--sk-scale,1))]",
    "nav-item": "relative list-none",
    "nav-link": "relative block font-medium text-black",
    "dropdown-menu": "absolute z-[99] hidden min-w-[calc(265px*var(--sk-scale,1))] border-l-2 border-brand bg-white py-[calc(10px*var(--sk-scale,1))] shadow-lg group-hover:block",
    "form-control": "w-full rounded-[calc(5px*var(--sk-scale,1))] border border-neutral-300 bg-white px-[calc(12px*var(--sk-scale,1))] py-[calc(10px*var(--sk-scale,1))]",
    "style1": "",
    "style2": "",
    "style3": "",
    "style4": "",
    "style6": "",
    "active": "",
    "show": "",
    "collapse": "",
    "owl-carousel": "",
    "city-slider-one": "",
    "select2": "",
    "bind-select2": "",
    "odometer": "",
    "fade": "",
    "property-slider-one": "",
    "filter-item-cat": "block",
    "fixed": "fixed",
    "property-state": "inline-flex items-center gap-[calc(6px*var(--sk-scale,1))] font-medium text-navy",
}


def strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def media_variant(query: str) -> str | None:
    mins = [int(n) for n in re.findall(r"min-width:\s*(\d+)px", query)]
    maxs = [int(n) for n in re.findall(r"max-width:\s*(\d+)px", query)]
    parts: list[str] = []
    if mins:
        value = max(mins)
        named = {576: "sm", 768: "md", 992: "lg", 1200: "xl", 1400: "2xl"}.get(value)
        parts.append(named if named else f"min-[{value}px]")
    if maxs:
        value = min(maxs)
        named = {575: "max-sm", 767: "max-md", 991: "max-lg", 1199: "max-xl", 1399: "max-2xl"}.get(value)
        parts.append(named if named else f"max-[{value}px]")
    if not parts:
        return None
    return ":".join(parts)


def split_selectors(selector: str) -> list[str]:
    return [part.strip() for part in selector.split(",") if part.strip()]


def subject_classes(selector: str) -> list[str] | None:
    """Classes on the element the selector matches, or None if the subject is an element."""
    chunks = re.split(r"\s*[>+~]\s*|\s+", selector.strip())
    if not chunks:
        return None
    last = chunks[-1]
    last = re.sub(r":{1,2}[a-z-]+(\([^)]*\))?", "", last)
    if "[" in last or last.startswith("#"):
        return None
    classes = re.findall(r"\.([A-Za-z0-9_-]+)", last)
    if not classes:
        return None
    if re.sub(r"\.[A-Za-z0-9_-]+", "", last).strip("*"):
        # A leftover element name means the subject is not class-only.
        if re.search(r"[a-z]+", re.sub(r"\.[A-Za-z0-9_-]+", "", last)):
            return None
    return classes


def pseudo_prefix(selector: str) -> str:
    last = re.split(r"\s*[>+~]\s*|\s+", selector.strip())[-1]
    prefixes: list[str] = []
    if ":hover" in last:
        prefixes.append("hover")
    if ":focus" in last:
        prefixes.append("focus")
    if ":before" in last:
        prefixes.append("before")
    if ":after" in last:
        prefixes.append("after")
    if ":last-child" in last:
        prefixes.append("last")
    if ":first-child" in last:
        prefixes.append("first")
    return ":".join(prefixes)


SHORTCUTS = {
    ("display", "flex"): "flex",
    ("display", "inline-flex"): "inline-flex",
    ("display", "block"): "block",
    ("display", "inline-block"): "inline-block",
    ("display", "inline"): "inline",
    ("display", "none"): "hidden",
    ("display", "grid"): "grid",
    ("position", "relative"): "relative",
    ("position", "absolute"): "absolute",
    ("position", "fixed"): "fixed",
    ("position", "sticky"): "sticky",
    ("text-align", "center"): "text-center",
    ("text-align", "left"): "text-left",
    ("text-align", "right"): "text-right",
    ("font-weight", "400"): "font-normal",
    ("font-weight", "500"): "font-medium",
    ("font-weight", "600"): "font-semibold",
    ("font-weight", "700"): "font-bold",
    ("width", "100%"): "w-full",
    ("height", "100%"): "h-full",
    ("max-width", "100%"): "max-w-full",
    ("overflow", "hidden"): "overflow-hidden",
    ("overflow", "auto"): "overflow-auto",
    ("box-sizing", "border-box"): "",
    ("list-style", "none"): "list-none",
    ("list-style-type", "none"): "list-none",
    ("text-decoration", "none"): "no-underline",
    ("text-transform", "uppercase"): "uppercase",
    ("text-transform", "capitalize"): "capitalize",
    ("vertical-align", "middle"): "align-middle",
    ("cursor", "pointer"): "cursor-pointer",
    ("white-space", "nowrap"): "whitespace-nowrap",
    ("object-fit", "cover"): "object-cover",
    ("flex-wrap", "wrap"): "flex-wrap",
    ("flex-direction", "column"): "flex-col",
    ("flex-direction", "row"): "flex-row",
    ("align-items", "center"): "items-center",
    ("align-items", "flex-start"): "items-start",
    ("align-items", "flex-end"): "items-end",
    ("justify-content", "center"): "justify-center",
    ("justify-content", "space-between"): "justify-between",
    ("justify-content", "flex-end"): "justify-end",
    ("justify-content", "flex-start"): "justify-start",
    ("flex-shrink", "0"): "shrink-0",
    ("flex-grow", "1"): "grow",
    ("pointer-events", "none"): "pointer-events-none",
    ("visibility", "hidden"): "invisible",
    ("visibility", "visible"): "visible",
}

COLORS = {
    "#ec3323": "brand",
    "#002172": "navy",
    "#666666": "muted",
    "#666": "muted",
    "#fff": "white",
    "#ffffff": "white",
    "#000": "black",
    "#000000": "black",
    "#cc0d0d": "seminar",
    "#f9f9f9": "neutral-50",
    "#fff6f4": "seashell",
}


def color_token(value: str) -> str | None:
    return COLORS.get(value.lower().replace(" ", ""))


def arbitrary(prop: str, value: str) -> str:
    cleaned = re.sub(r"\s+", "_", value.strip())
    cleaned = cleaned.replace(",", "\\,")
    return f"[{prop}:{cleaned}]"


def decl_to_util(prop: str, value: str) -> str:
    prop = prop.strip().lower()
    if prop.startswith("-"):
        return ""
    value = re.sub(r"\s+", " ", value.strip().rstrip(";"))
    value = value.replace("!important", "").strip()
    shortcut = SHORTCUTS.get((prop, value.lower()))
    if shortcut is not None:
        return shortcut
    if prop == "color":
        token = color_token(value)
        return f"text-{token}" if token else arbitrary(prop, value)
    if prop in {"background", "background-color"} and "url(" not in value and "gradient" not in value:
        token = color_token(value)
        return f"bg-{token}" if token else arbitrary("background-color" if prop == "background" else prop, value)
    if prop == "border-radius" and value in {"50%", "999px", "9999px"}:
        return "rounded-full"
    if prop == "font-family" and "Poppins" in value:
        return "font-heading"
    if prop == "font-family" and "Nunito" in value:
        return "font-sans"
    if prop == "z-index" and value.isdigit():
        return f"z-[{value}]"
    if prop == "opacity" and re.fullmatch(r"0?\.\d+|0|1", value):
        number = float(value)
        return f"opacity-[{value}]" if number not in {0, 1} else ("opacity-0" if number == 0 else "opacity-100")
    return arbitrary(prop, value)


def parse_css(text: str, variant: str, into: dict[str, dict[tuple[str, str], str]]) -> None:
    text = strip_comments(text)
    index = 0
    length = len(text)
    while index < length:
        while index < length and text[index].isspace():
            index += 1
        if index >= length:
            break
        if text.startswith("@media", index):
            brace = text.find("{", index)
            if brace == -1:
                break
            query = text[index:brace]
            prefix = media_variant(query)
            end = matching_brace(text, brace)
            if prefix is not None:
                inner_variant = f"{variant}:{prefix}" if variant else prefix
                parse_css(text[brace + 1 : end], inner_variant, into)
            index = end + 1
            continue
        if text.startswith("@", index):
            brace = text.find("{", index)
            if brace == -1:
                break
            end = matching_brace(text, brace)
            index = end + 1
            continue
        brace = text.find("{", index)
        if brace == -1:
            break
        selector = text[index:brace].strip()
        end = matching_brace(text, brace)
        body = text[brace + 1 : end]
        index = end + 1
        if not selector or selector.startswith("@"):
            continue
        declarations = []
        for chunk in body.split(";"):
            if ":" not in chunk:
                continue
            prop, value = chunk.split(":", 1)
            util = decl_to_util(prop, value)
            if util:
                declarations.append((prop.strip().lower(), util))
        if not declarations:
            continue
        for one in split_selectors(selector):
            classes = subject_classes(one)
            if not classes:
                continue
            pseudo = pseudo_prefix(one)
            full_variant = ":".join(part for part in (variant, pseudo) if part)
            key = " ".join(classes)
            if len(classes) == 1 and classes[0] in SKIP_CLASS:
                continue
            if len(classes) > 1 and any(item in SKIP_CLASS for item in classes) and key not in PHRASES:
                # Keep compound buttons and titles; skip generic mixes.
                if not (set(classes) & {"btn"} and set(classes) & {"style1", "style2", "style3", "style4", "style6"}):
                    if len(classes) == 1:
                        continue
            bucket = into.setdefault(key, {})
            for prop, util in declarations:
                prefixed = f"{full_variant}:{util}" if full_variant else util
                bucket[(full_variant, prop)] = prefixed


def matching_brace(text: str, open_index: int) -> int:
    depth = 0
    for index in range(open_index, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return index
    return len(text) - 1


def build_map() -> dict[str, str]:
    collected: dict[str, dict[tuple[str, str], str]] = {}
    for path in CSS_FILES:
        parse_css(path.read_text(encoding="utf-8", errors="ignore"), "", collected)
    mapped = dict(PHRASES)
    mapped.update(GRID)
    for key, props in collected.items():
        if key in mapped:
            continue
        utilities = " ".join(dict.fromkeys(props.values()))
        if utilities:
            mapped[key] = utilities
    title = (
        " [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold "
        "[&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] "
        "[&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold "
        "[&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))]"
    )
    for key in ("section-title", "content-title"):
        mapped[key] = (mapped.get(key, "relative") + title).strip()
    mapped.update(OVERLAY)
    return mapped


def used_classes(text: str) -> set[str]:
    found: set[str] = set()
    for match in re.findall(r'class(?:Name)?="([^"]+)"', text):
        found.update(match.split())
    for match in re.findall(r'class=\\"([^\\"]+)\\"', text):
        found.update(match.split())
    return {item for item in found if item}


def is_icon(name: str) -> bool:
    return name in ICON_EXACT or name.startswith(ICON_PREFIXES)


def css_class_index() -> set[str]:
    names: set[str] = set()
    for path in CSS_FILES:
        text = strip_comments(path.read_text(encoding="utf-8", errors="ignore"))
        names.update(re.findall(r"\.([A-Za-z_][A-Za-z0-9_-]*)", text))
    return names


def translate(value: str, mapping: dict[str, str]) -> str:
    tokens = value.split()
    output: list[str] = []
    index = 0
    phrases = sorted((key for key in mapping if " " in key), key=len, reverse=True)
    while index < len(tokens):
        matched = False
        for phrase in phrases:
            parts = phrase.split()
            if tokens[index : index + len(parts)] == parts:
                replacement = mapping[phrase].split()
                output.extend(item for item in replacement if item)
                index += len(parts)
                matched = True
                break
        if matched:
            continue
        token = tokens[index]
        if token in mapping:
            output.extend(item for item in mapping[token].split() if item)
        else:
            output.append(token)
        index += 1
    return " ".join(dict.fromkeys(output))


def rewrite_text(text: str, mapping: dict[str, str]) -> str:
    def replace_attr(match: re.Match[str]) -> str:
        prefix, value, suffix = match.group(1), match.group(2), match.group(3)
        return f"{prefix}{translate(value, mapping)}{suffix}"

    text = re.sub(r'(className=")([^"]+)(")', replace_attr, text)
    text = re.sub(r'(class=")([^"]+)(")', replace_attr, text)
    return re.sub(r'(class=\\")([^\\"]+)(\\")', replace_attr, text)


CMS_CLASS_SOURCE = ROOT / "web/src/styles/cms-classes.txt"


def seed_string(value: str, mapping: dict[str, str]) -> str:
    if "class=" not in value:
        return value
    value = rewrite_text(value, mapping).replace("\\,", ",")
    # A double quote inside class="…" would end the attribute.
    return value.replace(':[content:""]', ":content-['']")


def convert_seed_value(value, mapping: dict[str, str]):
    if isinstance(value, str):
        return seed_string(value, mapping)
    if isinstance(value, list):
        return [convert_seed_value(item, mapping) for item in value]
    if isinstance(value, dict):
        return {key: convert_seed_value(item, mapping) for key, item in value.items()}
    return value


def seed_classes(value, found: set[str]) -> None:
    if isinstance(value, str):
        for match in re.findall(r'class="([^"]+)"', value):
            found.update(match.split())
    elif isinstance(value, list):
        for item in value:
            seed_classes(item, found)
    elif isinstance(value, dict):
        for item in value.values():
            seed_classes(item, found)


def write_cms_class_source() -> None:
    """Tailwind only scans web/; list the classes stored in CMS HTML so their utilities are built."""
    found: set[str] = set()
    for path in sorted((ROOT / "api/database/data").glob("*.json")):
        seed_classes(json.loads(path.read_text(encoding="utf-8")), found)
    # Relative url() would be resolved by the bundler at build time and fail.
    lines = sorted(name for name in found if not re.search(r"url\((?!/|https?:)", name))
    CMS_CLASS_SOURCE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"cms class source {len(lines)} -> {CMS_CLASS_SOURCE.relative_to(ROOT)}")


def convert_seeds(paths: list[Path]) -> int:
    mapping = build_map()
    known = css_class_index()
    unmapped: set[str] = set()
    for path in paths:
        data = convert_seed_value(json.loads(path.read_text(encoding="utf-8")), mapping)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        found: set[str] = set()
        seed_classes(data, found)
        unmapped.update(
            name for name in found
            if name not in mapping and not is_icon(name) and name in known and name not in SKIP_CLASS
        )
        print(f"converted {path.relative_to(ROOT)}")
    write_cms_class_source()
    for name in sorted(unmapped):
        print(f"unmapped {name}")
    return 1 if unmapped else 0


def main() -> int:
    if "--seed" in sys.argv:
        paths = [Path(arg).resolve() for arg in sys.argv[sys.argv.index("--seed") + 1 :]]
        return convert_seeds(paths)
    if "--class-source" in sys.argv:
        write_cms_class_source()
        return 0
    apply = "--apply" in sys.argv
    mapping = build_map()
    known = css_class_index()
    targets = [
        path
        for path in (ROOT / "web/src").rglob("*.tsx")
        if "portal" not in path.parts
    ]
    targets += list((ROOT / "api/database/data").glob("*.json"))
    unmapped: set[str] = set()
    for path in targets:
        original = path.read_text(encoding="utf-8")
        updated = rewrite_text(original, mapping)
        for name in used_classes(updated):
            if name in mapping or is_icon(name) or name not in known:
                continue
            if name in SKIP_CLASS:
                unmapped.add(name)
                continue
            unmapped.add(name)
        if apply and updated != original:
            path.write_text(updated, encoding="utf-8")
    report = ROOT / "web/src/styles/tailwind-class-map.json"
    if apply:
        report.write_text(json.dumps(sorted(mapping), indent=2), encoding="utf-8")
    print(f"mapped {len(mapping)}")
    print(f"unmapped {len(unmapped)}")
    for name in sorted(unmapped):
        print(name)
    if apply and unmapped:
        print("Unmapped Bootstrap or Fela classes remain.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
