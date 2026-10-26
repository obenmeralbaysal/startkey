#!/usr/bin/env python3
import importlib.util
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from office_catalogue import catalogue_rows, dedupe_catalogue, parse_rank_badges

ROOT = Path(__file__).resolve().parent
FIXTURE = ROOT / "fixtures" / "rank-badges.html"
OFFICE_FIXTURE = ROOT / "fixtures" / "office-rank-badges.html"
spec = importlib.util.spec_from_file_location("crawl_offices", ROOT / "crawl-offices.py")
crawl_offices = importlib.util.module_from_spec(spec)
spec.loader.exec_module(crawl_offices)
parse_office_detail = crawl_offices.parse_office_detail


def test_parse_rank_badges_fixture():
    badges = parse_rank_badges(FIXTURE.read_text(encoding="utf-8"))
    assert [item["category"] for item in badges] == ["ciro", "ciro", "islem", "club"]
    assert badges[0]["year"] == 2025
    assert badges[0]["label"] == "Ciro Yedincisi"
    assert badges[0]["rank"] == 7
    assert badges[0]["imageUrl"].startswith("https://cdnc.re-os.com/club/")
    assert badges[1]["label"] == "Ciro Onüçüncüsü"
    assert badges[1]["rank"] == 13
    assert badges[2]["label"] == "İşlem Altıncısı"
    assert badges[2]["rank"] == 6
    assert badges[3]["year"] is None
    assert badges[3]["category"] == "club"
    assert badges[3]["rank"] is None
    assert badges[3]["label"] == "Ticari Kulüp"
    assert parse_rank_badges("<div>no badges</div>") == []
    assert parse_rank_badges("")[0:1] == []


def test_catalogue_rows_passes_rank_badges():
    offices = [{
        "externalId": 16559,
        "shortSlug": "aplus",
        "translations": {"tr": {"name": "A Plus", "email": "aplus@example.com", "phoneHref": "tel:902325033500"}},
    }]
    consultants = [{
        "externalId": 90001,
        "officeId": "16559",
        "rankBadges": parse_rank_badges(FIXTURE.read_text(encoding="utf-8")),
        "translations": {"tr": {
            "name": "Ada Yılmaz",
            "role": "Gayrimenkul Danışmanı",
            "email": "ada@example.com",
            "phoneHref": "tel:905550000001",
            "image": "",
            "comments": [],
        }},
    }]
    _offices, rows, skipped = catalogue_rows(offices, consultants)
    assert skipped == []
    assert rows[0]["importKey"] == "consultant:90001"
    assert rows[0]["rankBadges"][0]["rank"] == 7
    assert rows[0]["rankBadges"][3]["category"] == "club"
    assert "rankBadges" in _offices[0]
    assert _offices[0]["rankBadges"] == []


def test_office_page_rank_is_imported_and_empty_lists_are_sent():
    page = OFFICE_FIXTURE.read_text(encoding="utf-8")
    badges = parse_rank_badges(page)
    assert badges[0]["label"] == "Ciro 13"
    assert badges[0]["rank"] == 13
    assert badges[0]["year"] == 2025
    assert badges[0]["category"] == "ciro"
    parsed = parse_office_detail(page, "tr", "/aplus", {"shortSlug": "aplus", "name": "A Plus"})
    assert parsed["rankBadges"][0]["rank"] == 13
    assert parsed["officeId"] == "16559"

    offices = [{
        "externalId": 16559,
        "shortSlug": "aplus",
        "translations": {"tr": parsed},
    }, {
        "externalId": 2,
        "shortSlug": "bos",
        "translations": {"tr": {"name": "Bos Ofis", "email": "bos@example.com"}},
    }]
    consultants = [{
        "externalId": 90001,
        "officeId": "16559",
        "translations": {"tr": {
            "name": "Ada Yılmaz",
            "role": "Gayrimenkul Danışmanı",
            "email": "ada@example.com",
            "phoneHref": "tel:905550000001",
        }},
    }]
    office_rows, rows, skipped = catalogue_rows(offices, consultants)
    assert skipped == []
    by_office = {row["importKey"]: row for row in office_rows}
    assert by_office["office:16559"]["rankBadges"][0]["rank"] == 13
    assert by_office["office:2"]["rankBadges"] == []
    assert rows[0]["rankBadges"] == []


def test_same_email_dedupe_keeps_one_broker_and_its_badges():
    offices = [{
        "externalId": 10,
        "shortSlug": "aplus",
        "rankBadges": [{"year": 2025, "category": "ciro", "label": "Ciro 13", "rank": 13, "imageUrl": "https://cdnc.re-os.com/club/o.png"}],
        "translations": {"tr": {"name": "A Plus", "email": "aplus@example.com", "phoneHref": "tel:902325033500", "teamGroups": []}},
    }]
    kept = {
        "externalId": 4,
        "officeId": "11",
        "rankBadges": [],
        "translations": {"tr": {
            "name": "Ali Hökenek",
            "role": "Broker/Owner",
            "email": "ali.hokenek@startkey.com.tr",
            "phoneHref": "tel:905062606414",
            "image": "/media/ali.jpg",
            "comments": [],
        }},
    }
    dropped = {
        "externalId": 3,
        "officeId": "10",
        "rankBadges": [{"year": 2025, "category": "ciro", "label": "Ciro Yedincisi", "rank": 7, "imageUrl": "https://cdnc.re-os.com/club/a.png"}],
        "translations": {"tr": {
            "name": "Ali Hökenek",
            "role": "Broker/Owner",
            "email": "ali.hokenek@startkey.com.tr",
            "phoneHref": "tel:905062606414",
            "comments": [],
        }},
    }
    offices, consultants, report = dedupe_catalogue(offices, [dropped, kept])
    assert report["mergedBrokers"][0]["keptId"] == 4
    assert report["mergedBrokers"][0]["droppedIds"] == [3]
    assert len(consultants) == 1
    office_rows, rows, skipped = catalogue_rows(offices, consultants)
    assert skipped == []
    assert office_rows[0]["rankBadges"][0]["rank"] == 13
    assert rows[0]["importKey"] == "consultant:4"
    assert rows[0]["email"] == "ali.hokenek@startkey.com.tr"
    assert rows[0]["rankBadges"][0]["rank"] == 7


if __name__ == "__main__":
    test_parse_rank_badges_fixture()
    test_catalogue_rows_passes_rank_badges()
    test_office_page_rank_is_imported_and_empty_lists_are_sent()
    test_same_email_dedupe_keeps_one_broker_and_its_badges()
    print("ok")
