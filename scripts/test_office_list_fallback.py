#!/usr/bin/env python3
import importlib.util
import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("crawl_offices", ROOT / "crawl-offices.py")
crawl_offices = importlib.util.module_from_spec(spec)
spec.loader.exec_module(crawl_offices)

import_spec = importlib.util.spec_from_file_location("import_catalogue", ROOT / "import-catalogue.py")
import_catalogue = importlib.util.module_from_spec(import_spec)
import_spec.loader.exec_module(import_catalogue)


def card_html(href: str) -> str:
    return (
        '<div class="agent-card style1">'
        f'<h3><a href="{href}">1872 Gayrimenkul</a></h3>'
        "<ul></ul></div></div></div>"
    )


def cards_by_slug(page: str) -> dict:
    found = {}
    for card in crawl_offices.office_cards(page):
        found.setdefault(card["shortSlug"], card)
    return found


def test_tr_homepage_falls_back_to_en_slugs():
    homepage = "<html><head><title>Anasayfa</title></head><body></body></html>"
    assert crawl_offices.office_cards(homepage) == []
    en_page = card_html("/en/1872") + card_html("/en/2000")
    de_page = card_html("/de/2000") + card_html("/de/3001")
    order, mode = crawl_offices.office_short_slug_order(
        {
            "tr": cards_by_slug(homepage),
            "en": cards_by_slug(en_page),
            "de": cards_by_slug(de_page),
        }
    )
    assert mode == "fallback"
    assert order == ["1872", "2000", "3001"]
    assert crawl_offices.office_short_slug_order({"tr": {}, "en": {}, "de": {}}) == ([], "empty")


def test_office_card_short_slug_ignores_language_prefix():
    tr = crawl_offices.office_cards(card_html("/1872"))
    en = crawl_offices.office_cards(card_html("/en/1872"))
    assert len(tr) == 1 and len(en) == 1
    assert tr[0]["shortSlug"] == "1872"
    assert en[0]["shortSlug"] == "1872"
    assert tr[0]["shortSlug"] == en[0]["shortSlug"]


def test_import_request_sets_user_agent():
    captured = []

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return b"{}"

    def fake_urlopen(req, timeout=90):
        captured.append(req)
        return FakeResponse()

    with patch.object(import_catalogue.urllib.request, "urlopen", fake_urlopen):
        import_catalogue.request("POST", "https://example.invalid/import", "key", {"offices": []})
        import_catalogue.request(
            "POST",
            "https://example.invalid/media",
            "key",
            {"importKey": "office:1872", "kind": "office"},
            ("logo.jpg", b"img", "image/jpeg"),
        )

    assert len(captured) == 2
    for req in captured:
        assert req.get_header("User-agent") == import_catalogue.USER_AGENT
    assert import_catalogue.USER_AGENT == "StartKey-Import/1.0 (+https://startkey.sinapp.com.tr)"


if __name__ == "__main__":
    test_tr_homepage_falls_back_to_en_slugs()
    test_office_card_short_slug_ignores_language_prefix()
    test_import_request_sets_user_agent()
    print("ok")
