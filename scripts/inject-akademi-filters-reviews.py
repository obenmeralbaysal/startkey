#!/usr/bin/env python3
"""Embed the Eğitimler sidebar filter and course review markup from the reference."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "web" / "public" / "akademi" / "pages"
ORIGIN = "https://startkeyakademi.net"
UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
AUTHOR_HREF = {
    "54": "/akademi/egitmen/bulentseyran/",
    "52": "/akademi/egitmen/erdaldincer/",
    "73": "/akademi/egitmen/isil/",
    "53": "/akademi/egitmen/kubraavansonmez/",
    "56": "/akademi/egitmen/mehmet-nuri-ildiz/",
    "31": "/akademi/egitmen/ruhan/",
    "2": "/akademi/egitmen/veysel-sami-berikan/",
    "33": "/akademi/egitmen/yasemin-sanvar-kiris/",
}

FILTER_SKELETON = re.compile(
    r'<div class="learnpress-widget-wrapper learnpress-widget-wrapper__restapi"[^>]*>'
    r".*?"
    r'<div class="lp-widget-loading-change"></div>\s*</div>',
    re.S,
)
LOCAL_FILTER_SCRIPT = (
    '<script data-startkey-local-filter="1">'
    "(function(){"
    f"const authors={json.dumps(AUTHOR_HREF, ensure_ascii=False)};"
    "function apply(form){"
    "const terms=[].map.call(form.querySelectorAll('input[name=term_id]:checked'),function(i){return i.value});"
    "const picked=[].map.call(form.querySelectorAll('input[name=c_authors]:checked'),function(i){return i.value});"
    "if(terms.length){location.href='/akademi/egitimler/?term_id='+encodeURIComponent(terms.join(','));return;}"
    "if(picked.length===1&&authors[picked[0]]){location.href=authors[picked[0]];return;}"
    "location.href='/akademi/egitimler/';"
    "}"
    "document.addEventListener('click',function(e){"
    "var submit=e.target.closest&&e.target.closest('button.course-filter-submit');"
    "var reset=e.target.closest&&e.target.closest('button.course-filter-reset');"
    "var form=(submit||reset)&& (submit||reset).closest('form.lp-form-course-filter');"
    "if(!form){return;}"
    "e.preventDefault();e.stopImmediatePropagation();"
    "if(reset){location.href='/akademi/egitimler/';return;}"
    "apply(form);"
    "},true);"
    "})();"
    "</script>"
)

REVIEW_SKELETON = re.compile(
    r'<div class="lp-courses-rating-reviews-ajax">'
    r".*?"
    r'<div class="lp-target"[^>]*>\s*</div>'
    r'<div class="loading-after">.*?</div></div></div>',
    re.S,
)


def request_json(url: str, payload: dict, headers: dict | None = None) -> dict:
    extra = {"User-Agent": UA, "Content-Type": "application/json", "Accept": "application/json"}
    if headers:
        extra.update(headers)
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=extra, method="POST")
    with urllib.request.urlopen(req, timeout=40) as response:
        return json.loads(response.read().decode("utf-8"))


def apply_checked(html: str, checked: set[str]) -> str:
    for term in checked:
        html = html.replace(f'value="{term}"  >', f'value="{term}" checked>')
        html = html.replace(f'value="{term}" >', f'value="{term}" checked>')
        html = html.replace(f'value="{term}"  checked>', f'value="{term}" checked>')
    return html


def filter_form(checked: set[str], base_html: str | None = None) -> str:
    if base_html is None:
        data = request_json(
            ORIGIN + "/wp-json/lp/v1/widgets/api",
            {
                "widget": "learnpress_widget_course_filter",
                "instance": json.dumps(
                    {
                        "title": "Filtrele",
                        "number_level_category": 1,
                        "class_list_courses_target": ".lp-list-courses-default",
                        "show_in_rest": 1,
                        "hide_count_zero": 1,
                        "search_suggestion": 1,
                        "fields_order": "search,category,author,price,tag,level,course_review,btn_submit,btn_reset",
                        "fields": ["category", "author", "btn_submit", "btn_reset"],
                    }
                ),
            },
        )
        base_html = data["data"]
    html = apply_checked(base_html, checked)
    html = html.replace(
        '<form class="lp-form-course-filter">',
        '<form class="lp-form-course-filter" action="/akademi/egitimler/" method="get" data-startkey-local-filter="1">',
    )
    html = html.replace(
        '<button type="submit" class="course-filter-submit">',
        '<button type="button" class="course-filter-submit">',
    )
    html += LOCAL_FILTER_SCRIPT
    return (
        '<div class="learnpress-widget-wrapper" data-startkey-local-filter="1">'
        + html
        + "</div>"
    )


def checked_terms_for(path: Path) -> set[str]:
    name = path.name
    if name.startswith("egitimler-term-") and name.endswith(".html"):
        return set(name[len("egitimler-term-") : -len(".html")].split("-"))
    mapping = {
        "gayrimenkul.html": {"428"},
        "ileri-duzey-iletisim.html": {"223"},
        "temel-duzey-iletisim.html": {"222"},
        "kariyer.html": {"348"},
        "kisisel-gelisim.html": {"463"},
        "motivasyon.html": {"349"},
        "ozel-konu-basliklari.html": {"224"},
    }
    return mapping.get(name, set())


def disable_lp_filter_scripts(html: str) -> str:
    html = html.replace(
        'id="lp-course-filter-js" src=',
        'id="lp-course-filter-js" type="text/plain" data-src=',
    )
    html = html.replace(
        'id="thim-scripts-course-filter-js" src=',
        'id="thim-scripts-course-filter-js" type="text/plain" data-src=',
    )
    return html


def inject_filters(base_html: str) -> int:
    changed = 0
    for path in sorted(PUBLIC.rglob("*.html")):
        text = path.read_text(encoding="utf-8")
        if "learnpress-widget-wrapper__restapi" not in text:
            continue
        local = filter_form(checked_terms_for(path), base_html)
        updated, count = FILTER_SKELETON.subn(local, text, count=1)
        if count:
            updated = disable_lp_filter_scripts(updated)
            path.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"filter {path.relative_to(PUBLIC)}")
        else:
            print(f"filter miss {path.relative_to(PUBLIC)}")
    return changed


def course_id(text: str) -> str | None:
    match = re.search(r'name="item-id" value="(\d+)"', text)
    return match.group(1) if match else None


def wp_nonce() -> str:
    req = urllib.request.Request(
        ORIGIN + "/egitimler/empatik-iletisim/?LSCWP_CTRL=before_optm",
        headers={"User-Agent": UA},
    )
    with urllib.request.urlopen(req, timeout=40) as response:
        html = response.read().decode("utf-8", "replace")
    match = re.search(r'"nonce"\s*:\s*"([a-f0-9]+)"', html)
    if not match:
        raise RuntimeError("LearnPress nonce not found")
    return match.group(1)


def review_html(course: str, nonce: str) -> str:
    data = request_json(
        ORIGIN + "/wp-json/lp/v1/load_content_via_ajax/",
        {
            "args": {"id_url": "course-rating-reviews", "course_id": int(course), "paged": 1},
            "callback": {
                "class": "LearnPress\\CourseReview\\TemplateHooks\\CourseRatingTemplate",
                "method": "render_rating_reviews",
            },
        },
        headers={"X-WP-Nonce": nonce},
    )
    html = (data.get("data") or {}).get("content") or ""
    html = html.replace("https://startkeyakademi.net", "/akademi")
    return '<div class="lp-courses-rating-reviews-ajax">' + html + "</div>"


def inject_reviews(nonce: str) -> int:
    changed = 0
    cache: dict[str, str] = {}
    for path in sorted((PUBLIC / "egitimler").glob("*.html")):
        text = path.read_text(encoding="utf-8")
        if "lp-courses-rating-reviews-ajax" not in text:
            continue
        cid = course_id(text)
        if not cid:
            print(f"skip reviews {path.name}: no course id")
            continue
        if cid not in cache:
            cache[cid] = review_html(cid, nonce)
            print(f"reviews fetched course {cid} ({len(cache[cid])} bytes)")
        updated, count = REVIEW_SKELETON.subn(cache[cid], text, count=1)
        if count:
            path.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"reviews {path.name}")
        else:
            print(f"reviews miss {path.name}")
    return changed


def main() -> int:
    data = request_json(
        ORIGIN + "/wp-json/lp/v1/widgets/api",
        {
            "widget": "learnpress_widget_course_filter",
            "instance": json.dumps(
                {
                    "title": "Filtrele",
                    "number_level_category": 1,
                    "class_list_courses_target": ".lp-list-courses-default",
                    "show_in_rest": 1,
                    "hide_count_zero": 1,
                    "search_suggestion": 1,
                    "fields_order": "search,category,author,price,tag,level,course_review,btn_submit,btn_reset",
                    "fields": ["category", "author", "btn_submit", "btn_reset"],
                }
            ),
        },
    )
    filters = inject_filters(data["data"])
    reviews = inject_reviews(wp_nonce())
    print(f"updated filters={filters} reviews={reviews}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
