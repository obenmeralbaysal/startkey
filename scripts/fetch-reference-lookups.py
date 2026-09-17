#!/usr/bin/env python3
"""
Captures the search-bar lookup data of the StartKey.com.tr reference website into
reference/snapshots/lookups.json for all three languages.

The reference populates the homepage search dropdowns over AJAX; this snapshot lets
the Laravel API serve the same options without the application calling the reference
website at runtime.
"""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reference" / "snapshots" / "lookups.json"
BASE = "https://startkey.com.tr"
LANGS = ("tr", "en", "de")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


def get(path):
    request = urllib.request.Request(
        f"{BASE}{path}",
        headers={"User-Agent": UA, "Accept": "application/json", "X-Requested-With": "XMLHttpRequest"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def items(payload):
    """Drop the leading empty placeholder option; the API re-adds it per locale."""
    return [item for item in payload.get("items", []) if item.get("id") not in (None, "")]


def main():
    result = {}
    for lang in LANGS:
        print(f"== {lang}")
        data = {
            "placeholder": None,
            "adTypes": [],
            "processTypes": {},
            "propertyCountries": [],
            "propertyCities": {},
            "officeCountries": [],
            "officeCities": {},
            "counties": {},
            "consultantCountries": [],
            "consultantCities": {},
        }

        ad_types_payload = get(f"/{lang}/lookup/Adtypes")
        data["placeholder"] = next(
            (i["text"] for i in ad_types_payload.get("items", []) if i.get("id") in (None, "")), None
        )
        data["adTypes"] = items(ad_types_payload)

        for ad_type in data["adTypes"]:
            data["processTypes"][ad_type["id"]] = items(
                get(f"/{lang}/lookup/ProcessTypes?adType={ad_type['id']}")
            )

        data["propertyCountries"] = items(get(f"/{lang}/Lookup/EnteredCountries"))
        for country in data["propertyCountries"]:
            data["propertyCities"][country["id"]] = items(
                get(f"/{lang}/Lookup/EnteredCitiesByCountryId?countryId={country['id']}")
            )

        data["officeCountries"] = items(get(f"/{lang}/Lookup/EnteredOfficeCountries"))
        for country in data["officeCountries"]:
            data["officeCities"][country["id"]] = items(
                get(f"/{lang}/Lookup/EnteredOfficeCitiesByCountryId?countryId={country['id']}")
            )

        data["consultantCountries"] = items(get(f"/{lang}/Lookup/EnteredConsultantCountries"))
        for country in data["consultantCountries"]:
            data["consultantCities"][country["id"]] = items(
                get(f"/{lang}/Lookup/EnteredConsultantCitiesByCountryId?countryId={country['id']}")
            )

        seen_cities = {
            city["id"]
            for group in list(data["propertyCities"].values()) + list(data["officeCities"].values())
            for city in group
        }
        for city_id in sorted(seen_cities):
            data["counties"][city_id] = items(get(f"/{lang}/lookup/Counties?cityId={city_id}"))
            time.sleep(0.1)

        result[lang] = data
        print(
            f"   adTypes={len(data['adTypes'])} propertyCities={sum(len(v) for v in data['propertyCities'].values())} "
            f"officeCities={sum(len(v) for v in data['officeCities'].values())} counties={sum(len(v) for v in data['counties'].values())}"
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
