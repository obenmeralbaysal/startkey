#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from office_catalogue import catalogue_rows, dedupe_catalogue, parse_comments


def office(external_id, slug, name, email, phone):
    return {
        "externalId": external_id,
        "shortSlug": slug,
        "translations": {
            "tr": {
                "name": name,
                "email": email,
                "phoneHref": phone,
                "listingIds": [],
                "teamGroups": [{"heading": "BROKER/OWNER", "consultantIds": [], "cards": []}],
            }
        },
    }


def person(external_id, office_id, name, role, email, phone, image=""):
    return {
        "externalId": external_id,
        "officeId": str(office_id),
        "translations": {
            "tr": {
                "name": name,
                "role": role,
                "email": email,
                "phoneHref": phone,
                "image": image,
                "listingIds": [external_id],
                "comments": [],
            }
        },
    }


def test_alias_and_broker_merge():
    offices = [
        office(18453, "1872", "1872", "1872@startkey.com.tr", "tel:902328121872"),
        office(10, "aplus", "A Plus", "aplus@startkey.com.tr", "tel:902325033500"),
    ]
    consultants = [
        person(32866, 18453, "1872 Gayrimenkul", "Gayrimenkul Danışmanı", "1872@startkey.com.tr", "tel:902328121872"),
        person(33137, 10, "A Plus Gayrimenkul", "Gayrimenkul Danışmanı", "aplus@startkey.com.tr", "tel:902325033500"),
        person(1, 18453, "Müjde Tarhan", "Broker/Owner", "mujde.tarhan@startkey.com.tr", "tel:905336482969", "/media/a.jpg"),
        person(2, 18453, "Ruhşan Tarhan", "Broker/Owner", "ruhsan.tarhan@startkey.com.tr", "tel:905323776510", "/media/b.jpg"),
        person(3, 10, "Ali Hökenek", "Broker/Owner", "ali.hokenek@startkey.com.tr", "tel:905062606414"),
        person(4, 11, "Ali Hökenek", "Broker/Owner", "ali.hokenek@startkey.com.tr", "tel:905062606414", "/media/ali.jpg"),
    ]
    offices[0]["translations"]["tr"]["teamGroups"][0]["consultantIds"] = [1, 2, 32866]
    offices[0]["translations"]["tr"]["teamGroups"][0]["cards"] = [{"externalId": 32866}, {"externalId": 1}]

    offices, consultants, report = dedupe_catalogue(offices, consultants)
    ids = {row["externalId"] for row in consultants}
    assert 32866 not in ids and 33137 not in ids
    assert 1 in ids and 2 in ids
    assert report["droppedOfficeAliases"] == [32866, 33137]
    assert report["mergedBrokers"][0]["keptId"] == 4
    assert report["mergedBrokers"][0]["droppedIds"] == [3]
    team_ids = offices[0]["translations"]["tr"]["teamGroups"][0]["consultantIds"]
    assert 32866 not in team_ids and 1 in team_ids
    office_rows, consultant_rows, skipped = catalogue_rows(offices, consultants)
    assert len(office_rows) == 2
    assert skipped == []
    assert any(row["email"] == "ali.hokenek@startkey.com.tr" and row["role"] == "owner" for row in consultant_rows)
    assert all(row["importKey"] != "consultant:32866" for row in consultant_rows)


def test_parse_comments():
    page = """
    <div id="tab_3" role="tabpanel">
      <div class="comment-item">
        <h5>Hasan &#x15E;ahin</h5>
        <span class="comment-date">14.09.2026</span>
        <ul class="ratings list-style"><li><i class="ri-star-s-fill"></i></li><li><i class="ri-star-s-fill"></i></li></ul>
        <div class="comment-text"><p>Teşekkür ederim.</p></div>
      </div>
      <form id="form"></form>
    </div>
    """
    rows = parse_comments(page)
    assert rows[0]["firstName"] == "Hasan"
    assert rows[0]["lastName"] == "Şahin"
    assert rows[0]["date"] == "14.09.2026"
    assert rows[0]["rating"] == 2
    assert rows[0]["text"] == "Teşekkür ederim."


if __name__ == "__main__":
    test_alias_and_broker_merge()
    test_parse_comments()
    print("ok")
