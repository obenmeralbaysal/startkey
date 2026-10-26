#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from office_catalogue import catalogue_rows, parse_rank_badges

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "rank-badges.html"


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


if __name__ == "__main__":
    test_parse_rank_badges_fixture()
    test_catalogue_rows_passes_rank_badges()
    print("ok")
