"""Clean the public office crawl before it is imported into Reonix."""

from __future__ import annotations

import hashlib
import html as htmlmod
import re

STRIP_WORDS = {"gayrimenkul", "emlak", "ofis", "startkey"}


def fold(value: str) -> str:
    value = (value or "").replace("İ", "i").replace("I", "ı").lower()
    value = value.translate(str.maketrans("çğıöşüâîû", "cgiosuaiu"))
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def brand(value: str) -> str:
    return " ".join(word for word in fold(value).split() if word not in STRIP_WORDS)


def digits(value: str) -> str:
    number = re.sub(r"\D", "", value or "")
    if number.startswith("90") and len(number) > 10:
        number = number[2:]
    if number.startswith("0") and len(number) == 11:
        number = number[1:]
    return number


def email_of(value: str) -> str:
    return (value or "").strip().lower()


def text_of(fragment: str) -> str:
    value = re.sub(r"<[^>]+>", " ", fragment or "")
    value = htmlmod.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def parse_comments(page: str) -> list[dict]:
    pane = re.search(r'id="tab_3"[^>]*>([\s\S]*?)<form\b', page, re.I)
    if not pane:
        return []
    comments = []
    for item in re.finditer(r'class="comment-item"([\s\S]*?)(?=class="comment-item"|$)', pane.group(1)):
        chunk = item.group(1)
        name = re.search(r"<h5[^>]*>([\s\S]*?)</h5>", chunk)
        date = re.search(r'class="comment-date"[^>]*>([\s\S]*?)</span>', chunk)
        body = re.search(r'class="comment-text"[\s\S]*?<p[^>]*>([\s\S]*?)</p>', chunk)
        stars = re.search(r'class="ratings[\s\S]*?</ul>', chunk)
        rating = len(re.findall(r"ri-star(?:-s)?-fill", stars.group(0))) if stars else 0
        author = text_of(name.group(1)) if name else ""
        message = text_of(body.group(1)) if body else ""
        if author == "" or message == "":
            continue
        parts = author.split()
        comments.append(
            {
                "firstName": parts[0] if parts else author,
                "lastName": " ".join(parts[1:]) if len(parts) > 1 else "",
                "date": text_of(date.group(1)) if date else "",
                "text": message,
                "rating": rating if 1 <= rating <= 5 else None,
            }
        )
    return comments


_ORDINAL_UNITS = (
    (1, "birinci"),
    (2, "ikinci"),
    (3, "ucuncu"),
    (4, "dorduncu"),
    (5, "besinci"),
    (6, "altinci"),
    (7, "yedinci"),
    (8, "sekizinci"),
    (9, "dokuzuncu"),
)
_ORDINAL_TENS = ((10, "on"), (20, "yirmi"), (30, "otuz"), (40, "kirk"), (50, "elli"))


def _ordinal_stems() -> list[tuple[str, int]]:
    stems = [(stem, rank) for rank, stem in _ORDINAL_UNITS]
    stems.append(("onuncu", 10))
    stems.append(("yirminci", 20))
    stems.append(("otuzuncu", 30))
    stems.append(("kirkinci", 40))
    stems.append(("ellinci", 50))
    for ten, ten_stem in _ORDINAL_TENS:
        if ten == 10:
            continue
        for unit, unit_stem in _ORDINAL_UNITS:
            stems.append((ten_stem + unit_stem, ten + unit))
    for unit, unit_stem in _ORDINAL_UNITS:
        stems.append(("on" + unit_stem, 10 + unit))
    stems.sort(key=lambda item: len(item[0]), reverse=True)
    return stems


_ORDINALS = _ordinal_stems()


def _year(value: str) -> int | None:
    match = re.search(r"(19|20)\d{2}", value or "")
    return int(match.group(0)) if match else None


def _category(title: str) -> str | None:
    key = fold(title)
    if key.startswith("ciro") or key in {"turnover", "umsatz"}:
        return "ciro"
    if "islem" in key or "transaction" in key or "transaktion" in key:
        return "islem"
    if "kulup" in key or key == "clubs" or key.startswith("club"):
        return "club"
    return None


def _rank(label: str, category: str) -> int | None:
    if category == "club":
        return None
    compact = fold(label).replace(" ", "")
    for stem, rank in _ORDINALS:
        if stem in compact:
            return rank
    return None


def _badge_images(fragment: str) -> list[tuple[str, str]]:
    found = []
    for tag in re.findall(r"<img\b[^>]*>", fragment, re.I):
        if not re.search(r'class="[^"]*\brb-badge\b', tag):
            continue
        src = re.search(r'\bsrc="([^"]+)"', tag)
        alt = re.search(r'\balt="([^"]*)"', tag)
        title = re.search(r'\btitle="([^"]*)"', tag)
        if not src:
            continue
        label = text_of(alt.group(1) if alt else "") or text_of(title.group(1) if title else "")
        label = re.sub(r"\s+-\s+\d{4}$", "", label).strip()
        if label == "":
            continue
        found.append((src.group(1).strip(), label))
    return found


def parse_rank_badges(page: str) -> list[dict]:
    """Read `.rb-wrap` award icons from a consultant (or office) detail page."""
    badges: list[dict] = []
    for wrap in re.finditer(r'class="rb-wrap"', page or ""):
        rest = page[wrap.end() :]
        end = re.search(r'class="(?:agent-name|agent-info|agent-desc)"', rest)
        chunk = rest[: end.start()] if end else rest[:8000]
        blocks = re.findall(r'class="rb-year"[^>]*>([\s\S]*?)(?=class="rb-year"|$)', chunk)
        if not blocks and ("rb-col" in chunk or "rb-clubs" in chunk):
            blocks = [chunk]
        for block in blocks:
            title = re.search(r'class="rb-year-title"[^>]*>([\s\S]*?)</span>', block)
            year = _year(text_of(title.group(1)) if title else "")
            columns = re.findall(
                r'class="rb-col"[^>]*>([\s\S]*?)(?=class="rb-col"|class="rb-clubs"|class="rb-year"|$)',
                block,
            )
            for column in columns:
                heading = re.search(r'class="rb-col-title"[^>]*>([\s\S]*?)</span>', column)
                category = _category(text_of(heading.group(1)) if heading else "")
                if category is None:
                    continue
                for image, label in _badge_images(column):
                    badges.append(
                        {
                            "year": None if category == "club" else year,
                            "category": category,
                            "label": label,
                            "rank": _rank(label, category),
                            "imageUrl": image,
                        }
                    )
            clubs = re.findall(r'class="rb-clubs"[^>]*>([\s\S]*?)(?=class="rb-clubs"|class="rb-year"|$)', block)
            for club in clubs:
                for image, label in _badge_images(club):
                    badges.append(
                        {
                            "year": None,
                            "category": "club",
                            "label": label,
                            "rank": None,
                            "imageUrl": image,
                        }
                    )
    return badges


def office_slug_index(offices: list[dict]) -> dict[str, int]:
    index: dict[str, int] = {}
    for office in offices:
        external_id = int(office.get("externalId") or 0)
        if external_id < 1:
            continue
        slugs = [office.get("shortSlug") or ""]
        for translation in (office.get("translations") or {}).values():
            slugs.append(translation.get("shortSlug") or "")
            slugs.append(translation.get("urlPath") or "")
        for raw in slugs:
            tail = str(raw).strip().strip("/").split("/")[-1].lower()
            if tail and not tail.isdigit():
                index.setdefault(tail, external_id)
    return index


def office_id_from_href(href: str, slug_index: dict[str, int] | None = None) -> str:
    path = (href or "").split("?", 1)[0].strip()
    numbered = re.search(r"/(?:ofisler|offices|anbieteren)/(\d+)(?:/|$)", path)
    if numbered:
        return numbered.group(1)
    parts = [part for part in path.strip("/").split("/") if part]
    if not parts:
        return ""
    tail = parts[-1].lower()
    if tail in {"tr", "en", "de", "ofisler", "offices", "anbieteren"}:
        return ""
    external_id = (slug_index or {}).get(tail)
    return str(external_id) if external_id else ""


def stamp_team_offices(offices: list[dict], consultants: list[dict] | dict) -> None:
    """Fill a consultant's officeId from a short office slug or from the office team."""
    by_id = consultants if isinstance(consultants, dict) else {int(row["externalId"]): row for row in consultants if row.get("externalId")}
    index = office_slug_index(offices)
    for consultant in by_id.values():
        if str(consultant.get("officeId") or ""):
            continue
        for translation in (consultant.get("translations") or {}).values():
            resolved = office_id_from_href(translation.get("officeHref") or "", index)
            if resolved:
                consultant["officeId"] = resolved
                break
    for office in offices:
        external_id = int(office.get("externalId") or 0)
        if external_id < 1:
            continue
        for translation in (office.get("translations") or {}).values():
            for group in translation.get("teamGroups") or []:
                ids = [int(item) for item in group.get("consultantIds") or []]
                for card in group.get("cards") or []:
                    if card.get("externalId"):
                        ids.append(int(card["externalId"]))
                for consultant_id in ids:
                    row = by_id.get(consultant_id)
                    if row is not None and not str(row.get("officeId") or ""):
                        row["officeId"] = str(external_id)


def _team_cards(offices: list[dict]) -> dict[int, tuple[int, dict, dict]]:
    found: dict[int, tuple[int, dict, dict]] = {}
    for office in offices:
        external_id = int(office.get("externalId") or 0)
        if external_id < 1:
            continue
        for translation in (office.get("translations") or {}).values():
            for group in translation.get("teamGroups") or []:
                for card in group.get("cards") or []:
                    consultant_id = int(card.get("externalId") or 0)
                    if consultant_id < 1 or consultant_id in found:
                        continue
                    found[consultant_id] = (external_id, card, office)
    return found


def _card_as_consultant(card: dict, office_id: int) -> dict:
    row = {
        "externalId": int(card.get("externalId") or 0),
        "officeId": str(office_id),
        "translations": {
            "tr": {
                "name": card.get("name") or "",
                "role": card.get("role") or "",
                "email": card.get("email") or "",
                "phoneHref": card.get("phoneHref") or "",
                "image": card.get("image") or "",
                "comments": [],
            }
        },
    }
    if isinstance(card.get("rankBadges"), list):
        row["rankBadges"] = card["rankBadges"]
    return row


def _tr(row: dict) -> dict:
    return ((row.get("translations") or {}).get("tr")) or {}


def _office_contacts(offices: list[dict]) -> tuple[set[str], set[str]]:
    emails: set[str] = set()
    phones: set[str] = set()
    for office in offices:
        detail = _tr(office)
        mail = email_of(detail.get("email") or "")
        phone = digits(detail.get("phoneHref") or detail.get("phoneLabel") or "")
        if mail:
            emails.add(mail)
        if phone:
            phones.add(phone)
    return emails, phones


def _is_office_alias(consultant: dict, office: dict | None) -> bool:
    if office is None:
        return False
    person = _tr(consultant)
    place = _tr(office)
    if brand(person.get("name") or "") == "" or brand(person.get("name") or "") != brand(place.get("name") or ""):
        return False
    same_mail = email_of(person.get("email") or "") != "" and email_of(person.get("email") or "") == email_of(place.get("email") or "")
    same_phone = digits(person.get("phoneHref") or "") != "" and digits(person.get("phoneHref") or "") == digits(place.get("phoneHref") or "")
    return same_mail or same_phone


def _role(consultant: dict) -> str:
    return fold(_tr(consultant).get("role") or "")


def _is_broker(consultant: dict) -> bool:
    return "broker" in _role(consultant)


def _member_role(consultant: dict) -> str:
    role = _role(consultant)
    if "broker/owner" in role or "broker owner" in role:
        return "owner"
    if "yonet" in role or "manager" in role or "verwaltung" in role:
        return "office_manager"
    return "agent"


def _comment_key(consultant_id: int, comment: dict) -> str:
    raw = f"{consultant_id}|{comment.get('date', '')}|{fold(comment.get('text') or '')}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def dedupe_catalogue(offices: list[dict], consultants: list[dict]) -> tuple[list[dict], list[dict], dict]:
    offices_by_id = {int(row["externalId"]): row for row in offices if row.get("externalId")}
    dropped_aliases = []
    kept: list[dict] = []
    for consultant in consultants:
        office = offices_by_id.get(int(consultant.get("officeId") or 0))
        if _is_office_alias(consultant, office):
            dropped_aliases.append(int(consultant["externalId"]))
            detail = _tr(office)
            ids = list(detail.get("listingIds") or [])
            for listing_id in _tr(consultant).get("listingIds") or []:
                if listing_id not in ids:
                    ids.append(listing_id)
            detail["listingIds"] = ids
            for translation in (office.get("translations") or {}).values():
                groups = []
                for group in translation.get("teamGroups") or []:
                    group = dict(group)
                    group["consultantIds"] = [item for item in group.get("consultantIds") or [] if int(item) != int(consultant["externalId"])]
                    group["cards"] = [card for card in group.get("cards") or [] if int(card.get("externalId") or 0) != int(consultant["externalId"])]
                    groups.append(group)
                translation["teamGroups"] = groups
            continue
        kept.append(consultant)

    office_emails, office_phones = _office_contacts(offices)
    groups: dict[str, list[dict]] = {}
    order: list[str] = []
    singles: list[dict] = []
    for consultant in kept:
        if not _is_broker(consultant):
            singles.append(consultant)
            continue
        detail = _tr(consultant)
        mail = email_of(detail.get("email") or "")
        phone = digits(detail.get("phoneHref") or "")
        key = ""
        if mail and mail not in office_emails:
            key = "email:" + mail
        elif phone and phone not in office_phones:
            key = "phone:" + phone
        if key == "":
            singles.append(consultant)
            continue
        if key not in groups:
            order.append(key)
            groups[key] = []
        groups[key].append(consultant)

    merged = []
    merged_rows: list[dict] = []
    id_map: dict[int, int] = {}
    for key in order:
        rows = groups[key]
        rows.sort(key=lambda row: (0 if _tr(row).get("image") else 1, int(row["externalId"])))
        primary = rows[0]
        primary_id = int(primary["externalId"])
        dropped = []
        for extra in rows[1:]:
            extra_id = int(extra["externalId"])
            dropped.append(extra_id)
            id_map[extra_id] = primary_id
            primary_detail = _tr(primary)
            extra_detail = _tr(extra)
            ids = list(primary_detail.get("listingIds") or [])
            for listing_id in extra_detail.get("listingIds") or []:
                if listing_id not in ids:
                    ids.append(listing_id)
            primary_detail["listingIds"] = ids
            comments = list(primary_detail.get("comments") or [])
            seen = {fold(item.get("text") or "") + "|" + (item.get("date") or "") for item in comments}
            for comment in extra_detail.get("comments") or []:
                marker = fold(comment.get("text") or "") + "|" + (comment.get("date") or "")
                if marker not in seen:
                    comments.append(comment)
                    seen.add(marker)
            primary_detail["comments"] = comments
        if dropped:
            merged.append({"keptId": primary_id, "droppedIds": dropped, "match": key.split(":", 1)[0]})
        merged_rows.append(primary)

    dropped_set = set(dropped_aliases)
    for office in offices:
        for translation in (office.get("translations") or {}).values():
            groups_out = []
            for group in translation.get("teamGroups") or []:
                group = dict(group)
                mapped = []
                seen_ids: set[int] = set()
                for item in group.get("consultantIds") or []:
                    ext = id_map.get(int(item), int(item))
                    if ext in dropped_set or ext in seen_ids:
                        continue
                    seen_ids.add(ext)
                    mapped.append(ext)
                group["consultantIds"] = mapped
                cards = []
                seen_cards: set[int] = set()
                for card in group.get("cards") or []:
                    ext = id_map.get(int(card.get("externalId") or 0), int(card.get("externalId") or 0))
                    if ext in seen_cards or ext in dropped_set:
                        continue
                    seen_cards.add(ext)
                    card = dict(card)
                    card["externalId"] = ext
                    cards.append(card)
                group["cards"] = cards
                groups_out.append(group)
            translation["teamGroups"] = groups_out

    result = singles + merged_rows
    for consultant in result:
        detail = _tr(consultant)
        comments = []
        for comment in detail.get("comments") or []:
            item = dict(comment)
            item["importKey"] = _comment_key(int(consultant["externalId"]), item)
            comments.append(item)
        detail["comments"] = comments

    return offices, result, {"droppedOfficeAliases": dropped_aliases, "mergedBrokers": merged}


def catalogue_rows(offices: list[dict], consultants: list[dict]) -> tuple[list[dict], list[dict], list[dict]]:
    office_rows = []
    skipped = []
    office_keys = {}
    for office in offices:
        external_id = int(office.get("externalId") or 0)
        if external_id < 1:
            continue
        detail = _tr(office)
        key = f"office:{external_id}"
        office_keys[external_id] = key
        office_rows.append(
            {
                "importKey": key,
                "name": detail.get("name") or office.get("shortSlug") or str(external_id),
                "email": email_of(detail.get("email") or ""),
                "phone": digits(detail.get("phoneHref") or detail.get("phoneLabel") or ""),
                "address": detail.get("address") or "",
                "image": detail.get("image") or "",
            }
        )

    team = _team_cards(offices)
    consultant_rows = []
    seen: set[int] = set()

    def append_consultant(consultant: dict, source_office_id: int = 0) -> None:
        external_id = int(consultant.get("externalId") or 0)
        detail = _tr(consultant)
        mail = email_of(detail.get("email") or "")
        if external_id < 1 or external_id in seen:
            return
        if mail == "":
            skipped.append({"externalId": external_id, "reason": "missing-email", "name": detail.get("name") or ""})
            seen.add(external_id)
            return
        parts = (detail.get("name") or "").split()
        office_id = int(consultant.get("officeId") or 0) or source_office_id
        if office_id < 1 and external_id in team:
            office_id = team[external_id][0]
        row = {
            "importKey": f"consultant:{external_id}",
            "officeImportKey": office_keys.get(office_id, ""),
            "firstName": parts[0] if parts else mail,
            "lastName": " ".join(parts[1:]) if len(parts) > 1 else "-",
            "email": mail,
            "phone": digits(detail.get("phoneHref") or ""),
            "role": _member_role(consultant),
            "image": detail.get("image") or "",
            "comments": detail.get("comments") or [],
        }
        badges = consultant.get("rankBadges")
        if not isinstance(badges, list):
            badges = detail.get("rankBadges")
        if isinstance(badges, list):
            row["rankBadges"] = badges
        consultant_rows.append(row)
        seen.add(external_id)

    for consultant in consultants:
        append_consultant(consultant)

    # The public consultant list shows an office as one card. Dedupe drops that
    # alias, so the people who only appear on the office team must still import.
    for consultant_id, (office_id, card, office) in team.items():
        if consultant_id in seen:
            continue
        person = _card_as_consultant(card, office_id)
        if _is_office_alias(person, office):
            continue
        append_consultant(person, office_id)
    return office_rows, consultant_rows, skipped
