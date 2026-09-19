#!/usr/bin/env python3
"""
Builds api/database/data/reference-seed.json from the extracted reference content.

The homepage sections that will later be fed by Reonix (statistics, featured
portfolio, popular cities and the search lookups) are served by the Laravel API.
Until that integration exists the API is seeded with the values observed on the
reference website; see docs/TECHNICAL_DEBT.md.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "web" / "src" / "content"
LOOKUPS = ROOT / "reference" / "snapshots" / "lookups.json"
OUT = ROOT / "api" / "database" / "data" / "reference-seed.json"
LANGS = ("tr", "en", "de")


def main():
    content = {lang: json.loads((CONTENT_DIR / f"homepage.{lang}.json").read_text(encoding="utf-8")) for lang in LANGS}
    lookups = json.loads(LOOKUPS.read_text(encoding="utf-8"))

    stats = []
    for index, base in enumerate(content["tr"]["counters"]):
        stats.append({
            "key": f"stat-{index + 1}",
            "icon": base["icon"],
            "value": base["count"],
            "suffix": base["suffix"],
            "position": index + 1,
            "translations": {lang: {"label": content[lang]["counters"][index]["label"]} for lang in LANGS},
        })

    properties_by_id = {}
    for lang in LANGS:
        for index, card in enumerate(content[lang]["featured"]["properties"]):
            rec = properties_by_id.setdefault(card["id"], {
                "externalId": card["id"],
                "image": card["image"],
                "rooms": card["rooms"] or "",
                "area": card["area"] or "",
                "position": index + 1,
                "translations": {},
            })
            if lang == "tr":
                rec["image"] = card["image"]
                rec["rooms"] = card["rooms"] or ""
                rec["area"] = card["area"] or ""
                rec["position"] = index + 1
            rec["translations"][lang] = {
                "urlPath": card["href"],
                "processType": card["processType"],
                "adSubType": card["adSubType"],
                "adType": card["adType"],
                "price": card["price"],
                "title": card["title"],
                "location": card["location"],
                "detailLabel": card["detailLabel"],
                "isFeatured": True,
                "featuredPosition": index + 1,
            }
    properties = sorted(properties_by_id.values(), key=lambda row: (row["position"], row["externalId"]))

    cities = []
    for index, base in enumerate(content["tr"]["cities"]["cards"]):
        cities.append({
            "cityCode": base["cityId"],
            "image": base["image"],
            "position": index + 1,
            "translations": {
                lang: {
                    "name": content[lang]["cities"]["cards"][index]["name"],
                    "urlPath": content[lang]["cities"]["cards"][index]["href"],
                }
                for lang in LANGS
            },
        })

    # Lookups are flattened into (group, externalId, parentExternalId) rows with one
    # label per locale so the API can answer every reference lookup endpoint.
    lookup_rows = {}

    def add(group, external_id, parent_id, position, lang, label):
        key = (group, str(external_id), "" if parent_id is None else str(parent_id))
        row = lookup_rows.setdefault(key, {
            "group": group,
            "externalId": str(external_id),
            "parentExternalId": None if parent_id is None else str(parent_id),
            "position": position,
            "translations": {},
        })
        row["translations"][lang] = label

    placeholders = {}
    for lang in LANGS:
        data = lookups[lang]
        placeholders[lang] = data["placeholder"]

        for position, item in enumerate(data["adTypes"], start=1):
            add("ad_types", item["id"], None, position, lang, item["text"])

        for ad_type, entries in data["processTypes"].items():
            for position, item in enumerate(entries, start=1):
                add("process_types", item["id"], ad_type, position, lang, item["text"])

        for group, key in (
            ("property_countries", "propertyCountries"),
            ("office_countries", "officeCountries"),
            ("consultant_countries", "consultantCountries"),
        ):
            for position, item in enumerate(data[key], start=1):
                add(group, item["id"], None, position, lang, item["text"])

        for group, key in (
            ("property_cities", "propertyCities"),
            ("office_cities", "officeCities"),
            ("consultant_cities", "consultantCities"),
            ("counties", "counties"),
        ):
            for parent_id, entries in data[key].items():
                for position, item in enumerate(entries, start=1):
                    add(group, item["id"], parent_id, position, lang, item["text"])

    payload = {
        "locales": list(LANGS),
        "lookupPlaceholders": placeholders,
        "stats": stats,
        "featuredProperties": properties,
        "popularCities": cities,
        "lookups": list(lookup_rows.values()),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)}: stats={len(stats)} properties={len(properties)} "
        f"cities={len(cities)} lookups={len(payload['lookups'])}"
    )


if __name__ == "__main__":
    main()
