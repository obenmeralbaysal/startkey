#!/usr/bin/env python3
"""A Plus is one card on the consultant list. The team lives on /aplus."""
import importlib.util
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from office_catalogue import catalogue_rows, dedupe_catalogue, office_id_from_href, stamp_team_offices

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("crawl_offices", ROOT / "crawl-offices.py")
crawl_offices = importlib.util.module_from_spec(spec)
spec.loader.exec_module(crawl_offices)
consultant_fetch_slug = crawl_offices.consultant_fetch_slug
parse_office_detail = crawl_offices.parse_office_detail


def card(external_id, slug, name, role, email, phone):
    return f"""
    <div class="col">
      <div class="agent-card style1">
        <div class="agent-img"><a href="/tr/danismanlar/{external_id}/{slug}"><img src="https://cdnc.re-os.com/user/x.jpg"></a></div>
        <div class="agent-info-wrap"><div class="agent-info">
          <h3><a href="/tr/danismanlar/{external_id}/{slug}">{name}</a></h3>
          <span>{role}</span>
          <a href="{phone}">phone</a>
          <a href="mailto:{email}">{email}</a>
        </div></div>
      </div>
    </div>
    """


def test_office_slug_resolves_without_a_numeric_path():
    index = {"aplus": 16559, "aplus2": 20008}
    assert office_id_from_href("/aplus", index) == "16559"
    assert office_id_from_href("/tr/aplus", index) == "16559"
    assert office_id_from_href("/en/aplus2", index) == "20008"
    assert office_id_from_href("/tr/ofisler/16559/aplus", index) == "16559"
    assert consultant_fetch_slug("ada-yilmaz", "adayilmaz", "adayilmaz") == "ada-yilmaz"


def test_aplus_team_imports_with_the_office_after_the_alias_is_dropped():
    page = """
    <div class="agent-name"><h2>A Plus</h2></div>
    <ul class="agent-info list-style">
      <li><a href="tel:902325033500">+90 (232) 503-3500</a></li>
      <li><a href="mailto:aplus@example.com">aplus@example.com</a></li>
    </ul>
    <a href="/tr/portfoy?FilterDTO.OfficeId=16559">Portföyler</a>
    <div id="tab_1">
      <h3 class="highlighted-heading">PROFESYONELLER</h3>
      {alias}
      {member}
      {second}
    </div>
    <div id="tab_2"></div>
    """.format(
        alias=card(33137, "a-plus-gayrimenkul", "A Plus Gayrimenkul", "Gayrimenkul Danışmanı", "aplus@example.com", "tel:902325033500"),
        member=card(90001, "ada-yilmaz", "Ada Yılmaz", "Gayrimenkul Danışmanı", "ada@example.com", "tel:905550000001"),
        second=card(90002, "bora-kaya", "Bora Kaya", "Broker/Owner", "bora@example.com", "tel:905550000002"),
    )
    parsed = parse_office_detail(page, "tr", "/aplus", {"shortSlug": "aplus", "name": "A Plus"})
    assert parsed["officeId"] == "16559"
    assert parsed["rankBadges"] == []
    ids = [item for group in parsed["teamGroups"] for item in group["consultantIds"]]
    assert ids == [33137, 90001, 90002]
    assert parsed["teamGroups"][0]["cards"][1]["slug"] == "ada-yilmaz"

    office = {
        "externalId": 16559,
        "shortSlug": "aplus",
        "translations": {"tr": parsed},
    }
    # The consultant list only has the office, as one card. The team is not in that list.
    alias = {
        "externalId": 33137,
        "officeId": "",
        "slug": "a-plus-gayrimenkul",
        "translations": {"tr": {
            "name": "A Plus Gayrimenkul",
            "role": "Gayrimenkul Danışmanı",
            "email": "aplus@example.com",
            "phoneHref": "tel:902325033500",
            "officeHref": "/aplus",
            "image": "",
            "comments": [],
        }},
    }
    member = {
        "externalId": 90001,
        "officeId": "",
        "slug": "adayilmaz",
        "rankBadges": [{"year": 2025, "category": "ciro", "label": "Ciro Yedincisi", "rank": 7, "imageUrl": "https://cdnc.re-os.com/club/a.png"}],
        "translations": {"tr": {
            "name": "Ada Yılmaz",
            "role": "Gayrimenkul Danışmanı",
            "email": "ada@example.com",
            "phoneHref": "tel:905550000001",
            "officeHref": "/aplus",
            "image": "",
            "comments": [],
        }},
    }
    stamp_team_offices([office], [alias, member])
    assert alias["officeId"] == "16559"
    assert member["officeId"] == "16559"
    assert member["slug"] == "adayilmaz"

    offices, consultants, report = dedupe_catalogue([office], [alias, member])
    assert 33137 in report["droppedOfficeAliases"]
    assert 90001 in {row["externalId"] for row in consultants}
    office_rows, rows, skipped = catalogue_rows(offices, consultants)
    assert skipped == []
    assert office_rows[0]["rankBadges"] == []
    imported = {row["importKey"]: row for row in rows}
    assert "consultant:33137" not in imported
    assert imported["consultant:90001"]["officeImportKey"] == "office:16559"
    assert imported["consultant:90001"]["rankBadges"][0]["rank"] == 7
    # 90002 is only on the office team, not in the consultant list.
    assert imported["consultant:90002"]["officeImportKey"] == "office:16559"
    assert imported["consultant:90002"]["role"] == "owner"
    assert imported["consultant:90002"]["email"] == "bora@example.com"
    assert imported["consultant:90002"]["rankBadges"] == []


if __name__ == "__main__":
    test_office_slug_resolves_without_a_numeric_path()
    test_aplus_team_imports_with_the_office_after_the_alias_is_dropped()
    print("ok")
