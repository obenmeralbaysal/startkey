#!/usr/bin/env python3
"""
Extracts the homepage copy of the StartKey.com.tr reference website, verbatim,
from reference/snapshots/homepage-{tr,en,de}.html into
web/src/content/homepage.{tr,en,de}.json.

The reproduction must never contain AI-authored translations: every string in the
generated files comes from the corresponding language version of the reference
website. Re-run this script after refreshing the snapshots.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOTS = ROOT / "reference" / "snapshots"
OUT_DIR = ROOT / "web" / "src" / "content"
LANGS = ("tr", "en", "de")


# Blazor CSS-isolation markers such as `b-rfdk5kq1gn`. No stylesheet targets them,
# so they carry no visual meaning and are dropped from the extracted markup.
SCOPE_MARKER = re.compile(r"\s+b-[a-z0-9]{10}(?=[\s>])")


def collapse(value):
    if value is None:
        return None
    return re.sub(r"\s+", " ", SCOPE_MARKER.sub("", value)).strip()


def unescape(value):
    return None if value is None else html.unescape(value)


def text_only(fragment):
    if fragment is None:
        return None
    stripped = re.sub(r"<[^>]+>", " ", fragment)
    return collapse(unescape(stripped))


def inner(page, opening, closing, start=0):
    """Inner content between the first `opening` at/after `start` and the next `closing`."""
    i = page.find(opening, start)
    if i < 0:
        return None
    j = page.find(closing, i + len(opening))
    if j < 0:
        return None
    return page[i + len(opening):j]


def find_one(pattern, page, group=1, flags=0):
    m = re.search(pattern, page, flags)
    return m.group(group) if m else None


REFERENCE_ORIGIN = re.compile(r"https?://(?:www\.)?startkey\.com\.tr")
CDN_ORIGIN = re.compile(r"https?://cdnc\.re-os\.com")
IMAGEKIT_ORIGIN = re.compile(r"https?://ik\.imagekit\.io/reoscom/*(?:tr:[^/]*/)?")


def strip_origin(value):
    """Reference URLs become site-relative, so nothing points at the reference host."""
    return None if value is None else REFERENCE_ORIGIN.sub("", value) or "/"


def localise_asset(value):
    """Rewrites a reference CDN/ImageKit asset URL to the local path it was saved to."""
    if value is None:
        return None
    value = IMAGEKIT_ORIGIN.sub("/media/", CDN_ORIGIN.sub("/media/", value))
    value = re.sub(r"\?.*$", "", value).replace("/media//", "/media/")
    return strip_origin(value)


def collapse_json(block):
    """Structured data, with reference URLs made relative and assets made local."""
    data = json.loads(block)

    def walk(node):
        if isinstance(node, str):
            if node.startswith("https://ik.imagekit.io") or node.startswith("https://cdnc.re-os.com"):
                return localise_asset(node)
            return strip_origin(node) if REFERENCE_ORIGIN.match(node) else node
        if isinstance(node, list):
            return [walk(item) for item in node]
        if isinstance(node, dict):
            return {key: walk(value) for key, value in node.items()}
        return node

    return walk(data)


def nav_items(page):
    """Top navigation, preserving the reference order, labels and hrefs."""
    start = page.find('<ul class="navbar-nav ms-auto">')
    region = page[start:page.find('<div b-n6gq01ryuv class="others-options', start)]

    items = []
    for m in re.finditer(r'<a[^>]*?href="([^"]+)"[^>]*?>\s*([^<]*?)\s*(?=<)', region):
        href = html.unescape(m.group(1))
        label = collapse(unescape(m.group(2)))
        if not label:
            continue
        target = "_blank" if href.startswith("http") else None
        items.append({"label": label, "href": href, "target": target})

    # Rebuild the two-level structure: "#" hrefs are dropdown parents whose
    # children are the following links up to the next top-level entry.
    top_level = ["Anasayfa", "Home", "Startseite"]
    tree = []
    i = 0
    while i < len(items):
        item = items[i]
        if item["href"] == "#":
            children = []
            j = i + 1
            while j < len(items) and items[j]["href"] != "#" and not is_top_level_after_dropdown(items, j):
                children.append(items[j])
                j += 1
            tree.append({"label": item["label"], "href": "#", "children": children})
            i = j
        else:
            tree.append({"label": item["label"], "href": item["href"], "children": []})
            i += 1
    return tree


# The reference markup lists dropdown children inline; these labels are known to
# resume the top level after a dropdown block.
RESUME_TOP_LEVEL = {
    "Portföylerimiz", "Our Portfolios", "Unsere Portfolios",
    "Startkey",
    "Akademi", "Academy", "Akademie",
    "İletişim", "Contact", "Kontakt",
}


def is_top_level_after_dropdown(items, index):
    return items[index]["label"] in RESUME_TOP_LEVEL


def footer_links(page, widget_index):
    region = page[page.find("<footer"):]
    widgets = region.split('<h3 class="footer-widget-title">')
    if widget_index + 1 >= len(widgets):
        return []
    block = widgets[widget_index + 1]
    out = []
    # The English and German footers carry links whose page has no translation, which the
    # reference renders as empty list items; they are kept so the column keeps its height.
    for m in re.finditer(r'<a href="([^"]*)">\s*<i class="ri-arrow-right-s-line">\s*</i>\s*([^<]*)', block):
        out.append({"label": collapse(unescape(m.group(2))), "href": html.unescape(m.group(1))})
    return out


def property_cards(page):
    region = page[page.find('id="propcarousel"'):]
    region = region[:region.find('<section class="about-wrap style1')]
    cards = []
    for chunk in re.split(r'<div[^>]*class="property-card style6">', region)[1:]:
        def g(pattern, group=1):
            return find_one(pattern, chunk, group)

        cards.append({
            "id": int(g(r"/(\d+)/")),
            "href": html.unescape(g(r'<a href="([^"]+)"')),
            "image": g(r"cdnc\.re-os\.com/property/([^?\"]+)"),
            "processType": collapse(unescape(g(r'class="property-estatestatus">([^<]+)<'))),
            "adSubType": collapse(unescape(g(r'class="property-status">([^<]+)<'))),
            "adType": collapse(unescape(g(r'class="property-state">\s*<i[^>]*>\s*</i>([^<]+)'))),
            "price": collapse(unescape(g(r'class="property-price">\s*([^<]+)<'))),
            "title": collapse(unescape(g(r'class="prop-title">\s*<a[^>]*>([^<]+)<'))),
            "location": collapse(unescape(g(r'flaticon-location">\s*</i>([^<]*?)</p>'))),
            "rooms": collapse(unescape(g(r'flaticon-double-bed">\s*</i>\s*([^<\s]+)'))) or "",
            "area": collapse(unescape(g(r'flaticon-square">\s*</i>\s*([^<]+)'))) or "",
            "detailLabel": collapse(unescape(g(r'class="btn style2"[^>]*>\s*([^<]+)<'))),
        })
    return cards


def counters(page):
    region = page[page.find('class="counter-area'):]
    region = region[:region.find("<!-- Counter Section End -->")]
    out = []
    for chunk in re.split(r'<div[^>]*class="counter-card">', region)[1:]:
        icon = find_one(r'<img src="/themes/fela/img/(counter-\d\.png)"', chunk)
        if icon:
            icon_path = f"/themes/fela/img/{icon}"
        else:
            remote = find_one(r"cdnc\.re-os\.com/micrositecontent/([^?\"]+)", chunk)
            icon_path = f"/media/micrositecontent/{remote}" if remote else None
        out.append({
            "icon": icon_path,
            "count": int(find_one(r'data-count="(\d+)"', chunk) or 0),
            "suffix": collapse(unescape(find_one(r'class="target">([^<]*)<', chunk))),
            "label": collapse(unescape(find_one(r"<p b-6c8bwhshlo>([^<]+)</p>", chunk))),
        })
    return out


def city_cards(page):
    region = page[page.find('<section class="city-wrap'):]
    region = region[:region.find("</section>")]
    out = []
    for chunk in re.split(r'<div class="city-card style2"', region)[1:]:
        out.append({
            "cityId": find_one(r'data-city-id="([^"]+)"', chunk),
            "image": find_one(r"cdnc\.re-os\.com/micrositecontent/([^?\"]+)", chunk),
            "name": collapse(unescape(find_one(r"<a href=\"[^\"]*\">\s*([^<]+)", chunk))),
            "href": html.unescape(find_one(r'<a href="([^"]+)"', chunk) or ""),
        })
    return out


DIV_TAG = re.compile(r"</?div\b", re.IGNORECASE)


def element_inner(page, start):
    """
    Inner HTML of the `<div>` whose opening tag starts at `start`, found by tracking
    nesting depth. Some answers contain nested `<div>`s, so stopping at the first
    `</div>` would truncate them and leave the markup unbalanced.
    """
    open_end = page.index(">", start) + 1
    depth = 1
    for match in DIV_TAG.finditer(page, open_end):
        depth += -1 if match.group(0).startswith("</") else 1
        if depth == 0:
            return page[open_end:match.start()]
    raise ValueError(f"unbalanced <div> at offset {start}")


def faq_items(page):
    start = page.find('<section class="faq-wrap')
    region = page[start:page.find("</section>", start)]
    out = []
    for m in re.finditer(
        r'<h2 id="([^"]+)" class="accordion-header"><button class="([^"]+)"[^>]*'
        r'data-bs-target="#([^"]+)"[^>]*aria-expanded="([^"]+)"[^>]*>([\s\S]*?)</button>',
        region,
    ):
        heading_id, button_class, collapse_id, expanded, question = m.groups()
        collapse_open = re.search(r'<div id="' + re.escape(collapse_id) + r'" class="([^"]*)"', region)
        body_start = region.index('<div class="accordion-body">', m.end())
        out.append({
            # The reference's own ids and class strings are kept so the accordion markup,
            # and with it Bootstrap's collapse wiring, is identical.
            "headingId": heading_id,
            "collapseId": collapse_id,
            "buttonClass": collapse(button_class),
            "collapseClass": collapse(collapse_open.group(1)) if collapse_open else "accordion-collapse collapse",
            "expanded": expanded == "true",
            "question": collapse(unescape(re.sub(r"<[^>]+>", "", question))),
            "answerHtml": collapse(element_inner(region, body_start)),
        })
    return out


def hero_search(page):
    region = page[page.find('class="search-property style1"'):]
    region = region[:region.find("</section>")]
    tabs = [collapse(unescape(t)) for t in re.findall(r'role="tab">([^<]+)</button>', region)]
    actions = [html.unescape(a) for a in re.findall(r'class="property-search-form row" action="([^"]+)"', region)]
    buttons = [collapse(unescape(b)) for b in re.findall(r'homepage-bar-btn"[^>]*>\s*([^<]+)<', region)]
    placeholders = [collapse(unescape(p)) for p in re.findall(r'placeholder="([^"]+)"', region)]
    return {"tabs": tabs, "formActions": actions, "buttons": buttons, "placeholders": placeholders}


def snapshot(lang):
    return (SNAPSHOTS / f"homepage-{lang}.html").read_text(encoding="utf-8")


def extract(lang):
    page = snapshot(lang)

    seminar_anchor = inner(page, '<a class="seminarText"', "</a>")
    seminar_anchor = seminar_anchor[seminar_anchor.find(">") + 1:] if seminar_anchor else ""
    seminar_parts = [collapse(unescape(p)) for p in re.split(r"<[^>]+>", seminar_anchor) if collapse(p)]

    about_content_start = page.find('<div class="about-content">')
    about1_title = inner(page, '<div class="content-title style1">', "</div>")
    about1_rest = page[about_content_start:page.find("</section>", about_content_start)]
    about1_body = about1_rest[about1_rest.find("</div>", about1_rest.find('<div class="content-title style1">')) + 6:]
    about1_body = about1_body[:about1_body.find("</div>")]

    marker = '<div class="about-content" style="padding: 20px;">'
    a = page.find(marker)
    about2_a = page[a + len(marker):]
    about2_a = about2_a[:about2_a.find("</div>")]
    b = page.find(marker, a + 1)
    about2_b = page[b + len(marker):]
    about2_b = about2_b[:about2_b.find("</div>")]

    hw_start = page.find('<section class="hw-wrap')
    video_start = page.find('<div class="video-content">')
    video_block = page[video_start:page.find("</section>", video_start)]

    newsletter_start = page.find('<section class="newsletter-wrap')
    faq_start = page.find('<section class="faq-wrap')
    listing_start = page.find('<div class="listing-content ptb-100">')

    return {
        "lang": lang,
        "htmlLang": find_one(r'<html lang="([^"]+)"', page),
        "meta": {
            "title": collapse(unescape(inner(page, "<title>", "</title>"))),
            "description": unescape(find_one(r'<meta name="description" content="([\s\S]*?)" />', page)),
            "keywords": unescape(find_one(r'<meta name="keywords" content="([^"]*)"', page)),
            # Only the tags the reference actually publishes for this language; the
            # German version, for example, has no title or description tags at all.
            "siteTitle": unescape(find_one(r'<meta name="title" content="([\s\S]*?)" />', page)),
            "ogTitle": unescape(find_one(r'<meta property="og:title" content="([\s\S]*?)" />', page)),
            "ogDescription": unescape(find_one(r'<meta property="og:description" content="([\s\S]*?)" />', page)),
            "ogImage": localise_asset(find_one(r'<meta property="og:image" content="([^"]*)"', page)),
            "twitterTitle": unescape(find_one(r'<meta name="twitter:title" content="([\s\S]*?)" />', page)),
            "twitterDescription": unescape(find_one(r'<meta name="twitter:description" content="([\s\S]*?)" />', page)),
            "twitterImage": localise_asset(find_one(r'<meta name="twitter:image" content="([^"]*)"', page)),
            "favicon": localise_asset(find_one(r'<link rel="shortcut icon"[^>]*href="([^"]*)"', page)),
            "robots": unescape(find_one(r'<meta name="robots" content="([^"]*)"', page)),
            "alternates": [
                {"hreflang": html.unescape(m.group(1)), "href": strip_origin(html.unescape(m.group(2)))}
                for m in re.finditer(
                    r"<link rel='alternate' hreflang='([^']+)' href='([^']+)'>", page
                )
            ],
        },
        "structuredData": [
            collapse_json(block)
            for block in re.findall(
                r'<script type="application/ld\+json">([\s\S]*?)</script>', page
            )
        ],
        "seminarBar": {
            "prefix": seminar_parts[0] if seminar_parts else None,
            "count": int(seminar_parts[1]) if len(seminar_parts) > 1 and seminar_parts[1].isdigit() else 0,
            "suffix": seminar_parts[2] if len(seminar_parts) > 2 else None,
            "href": html.unescape(find_one(r'<a class="seminarText" href="([^"]+)"', page) or ""),
        },
        "nav": nav_items(page),
        "languageSwitcher": {
            "current": collapse(unescape(find_one(r'<h5 style="font-size: 14px;[\s\S]*?>\s*([^<]+?)\s*</h5>', page))),
            "options": [
                {
                    "code": html.unescape(m.group(1)),
                    "label": collapse(unescape(m.group(2))),
                }
                for m in re.finditer(
                    r'ChangeCulture\?langCode=(\w+)"[\s\S]*?<img[^>]*>\s*([^<]+?)\s*</a>', page
                )
            ][:3],
        },
        "headerButtons": {
            "franchise": {
                "label": collapse(unescape(find_one(r'<a class="btn style1" style="padding: 14px 20px 14px;" href="([^"]*)">\s*([^<]+)', page, group=2))),
                "href": html.unescape(find_one(r'<a class="btn style1" style="padding: 14px 20px 14px;" href="([^"]*)"', page) or ""),
            },
            "crm": {
                "label": collapse(unescape(find_one(r'class="btn style2" target="_blank" style="padding: 14px 20px 14px;">\s*([^<]+)', page))),
                "href": html.unescape(find_one(r'<a b-n6gq01ryuv href="([^"]+)" class="btn style2" target="_blank"', page) or ""),
            },
        },
        "heroSearch": hero_search(page),
        "counters": counters(page),
        "featured": {
            "titleHtml": collapse(inner(page, '<div b-rfdk5kq1gn class="section-title style2 text-center mb-40">', "</div>")),
            "properties": property_cards(page),
        },
        "about1": {
            "titleHtml": collapse(about1_title),
            "bodyHtml": collapse(about1_body),
        },
        "about2": {"contentHtml": collapse(about2_a)},
        "about3": {"contentHtml": collapse(about2_b)},
        "howItWorks": {
            "titleHtml": collapse(inner(page, '<div class="section-title style2 text-center mb-40">', "</div>", hw_start)),
            "cards": [
                {
                    "image": find_one(r"cdnc\.re-os\.com/micrositecontent/([^?\"]+)", chunk),
                    "step": collapse(unescape(find_one(r"<span>(\d+)</span>", chunk))),
                    "infoHtml": collapse(find_one(r'<div class="hw-info">([\s\S]*?)</div>', chunk)),
                }
                for chunk in re.split(r'<div class="hw-card">', page[hw_start:page.find("</section>", hw_start)])[1:]
            ],
            "button": {
                "label": collapse(unescape(find_one(r'<a class="btn style2 homepage-expended-btn" href="[^"]*">\s*([\s\S]*?)\s*</a>', page))),
                "href": html.unescape(find_one(r'<a class="btn style2 homepage-expended-btn" href="([^"]*)"', page) or ""),
            },
        },
        "addListing": {
            "background": find_one(r"cdnc\.re-os\.com/micrositecontent/([^?\"]+)", page[listing_start - 900:listing_start]),
            "contentHtml": collapse(inner(page, '<div class="content-title">', "</div>", listing_start)),
            "button": {
                "label": collapse(unescape(find_one(r'<a class="btn style1" href="([^"]*)">\s*([\s\S]*?)\s*</a>', page[listing_start:listing_start + 2000], group=2))),
                "href": html.unescape(find_one(r'<a class="btn style1" href="([^"]*)"', page[listing_start:listing_start + 2000]) or ""),
            },
        },
        "videoPromo": {
            "videoUrl": html.unescape(find_one(r'data-fancybox="" href="([^"]+)"', video_block) or ""),
            "span": collapse(unescape(find_one(r"<span>([^<]*)</span>", video_block))),
            "heading": collapse(unescape(find_one(r'<h2 style="color:white;">([\s\S]*?)</h2>', video_block))),
        },
        "cities": {
            "titleHtml": collapse(inner(page, '<div class="section-title style1 text-center mb-40">', "</div>", page.find('<section class="city-wrap'))),
            "cards": city_cards(page),
            "button": {
                "label": collapse(unescape(find_one(r'<a class="btn style1 text-center" style="width:400px" href="[^"]*">\s*([\s\S]*?)\s*</a>', page))),
                "href": html.unescape(find_one(r'<a class="btn style1 text-center" style="width:400px" href="([^"]*)"', page) or ""),
            },
        },
        "faq": {
            "titleHtml": collapse(inner(page, '<div class="content-title style1">', "</div>", faq_start)),
            "image": find_one(r"cdnc\.re-os\.com/content/([^?\"]+)", page[faq_start:faq_start + 1500]),
            "items": faq_items(page),
        },
        "newsletter": {
            "titleHtml": collapse(inner(page, '<div class="section-title style2 text-center mb-40">', "</div>", newsletter_start)),
            "placeholders": [collapse(unescape(p)) for p in re.findall(r'placeholder="([^"]+)"', page[newsletter_start:page.find("</section>", newsletter_start)])],
            "submitLabel": collapse(unescape(find_one(r'<button class="btn style2 disabled newslet-btn" type="submit">\s*([^<]+)', page))),
            # The reference keeps the `disabled` class on the enabled submit button.
            "submitClass": collapse(unescape(find_one(r'<button class="([^"]*newslet-btn[^"]*)" type="submit">', page))),
            # Shown by the reference's own inline handler when the captcha is not
            # solved. It is Turkish on all three language versions.
            "captchaError": unescape(find_one(r"errorSpan\.innerText = '([^']*)'", page)),
        },
        "footer": {
            "descriptionHtml": collapse(find_one(r'<p class="comp-desc">([\s\S]*?)</p>', page)),
            "crmButton": {
                "label": collapse(unescape(find_one(r'<a href="[^"]*" class="btn style2" target="_blank" style="padding: 14px 20px 14px;">\s*([^<]+)', page))),
                "href": html.unescape(find_one(r'<a href="([^"]*)" class="btn style2" target="_blank" style="padding: 14px 20px 14px;">', page) or ""),
            },
            "widgets": [
                {
                    "title": collapse(unescape(title)),
                    "links": footer_links(page, index),
                }
                for index, title in enumerate(re.findall(r'<h3 class="footer-widget-title">([^<]*)</h3>', page))
            ],
            "copyrightHtml": collapse(find_one(r'<p class="copyright-text">([\s\S]*?)</p>', page)),
            "mapEmbedUrl": html.unescape(find_one(r'<iframe src="(https://www\.google\.com/maps/embed[^"]+)"', page) or ""),
            "mapLink": html.unescape(find_one(r'<a href="(https://maps\.app\.goo\.gl/[^"]+)"', page) or ""),
            "social": [
                {"icon": m.group(2), "href": html.unescape(m.group(1))}
                for m in re.finditer(r"<a href='([^']+)' target='_blank'>\s*<i class=\"(ri-[\w-]+)\">", page)
            ],
        },
    }


def critical_css():
    """
    The inline stylesheet the reference website ships in <head>. It comes before the
    theme stylesheets, so it is written to a file that is inlined at the same position.
    Identical in all three language versions.
    """
    blocks = {
        lang: find_one(r"<style>([\s\S]*?)</style>", snapshot(lang)[: snapshot(lang).find("</head>")])
        for lang in LANGS
    }
    unique = {value.strip() for value in blocks.values() if value}
    if len(unique) != 1:
        raise SystemExit(f"expected one shared critical stylesheet, found {len(unique)}")
    return unique.pop()


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for lang in LANGS:
        data = extract(lang)
        target = OUT_DIR / f"homepage.{lang}.json"
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {target.relative_to(ROOT)}")

    css = critical_css()
    if "`" in css or "${" in css:
        raise SystemExit("critical stylesheet cannot be embedded as a template literal")
    critical = ROOT / "web" / "src" / "content" / "critical-css.ts"
    critical.write_text(
        "/**\n"
        " * Inline <style> block of the reference website's <head>, copied verbatim.\n"
        " * It is inlined at the same position so the cascade order is preserved.\n"
        " *\n"
        " * Generated by scripts/extract-reference-content.py – do not edit by hand.\n"
        " */\n"
        "export const criticalCss = `" + css.strip() + "`;\n",
        encoding="utf-8",
    )
    print(f"wrote {critical.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
