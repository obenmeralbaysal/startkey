#!/usr/bin/env python3
"""Push the cleaned office crawl into Reonix. Does not print secrets."""

from __future__ import annotations

import argparse
import json
import mimetypes
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from office_catalogue import catalogue_rows

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "api" / "database" / "data" / "offices-seed.json"
ENV_FILES = (ROOT / ".env", ROOT / "api" / ".env")
PUBLIC = ROOT / "web" / "public"
USER_AGENT = "StartKey-Import/1.0 (+https://startkey.sinapp.com.tr)"


def env_value(name: str) -> str:
    found = ""
    for path in ENV_FILES:
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith(name + "="):
                found = line.split("=", 1)[1].strip().strip('"').strip("'")
    return found


def request(method: str, url: str, key: str, payload: dict | None = None, file: tuple[str, bytes, str] | None = None) -> dict:
    if file is None:
        data = json.dumps(payload or {}).encode()
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Portal-Key": key,
            "User-Agent": USER_AGENT,
        }
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
    else:
        boundary = "----catalogueimport"
        filename, body, mime = file
        import_key = (payload or {}).get("importKey", "")
        kind = (payload or {}).get("kind", "")
        chunks = [
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"importKey\"\r\n\r\n{import_key}\r\n".encode(),
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"kind\"\r\n\r\n{kind}\r\n".encode(),
            (
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\n"
                f"Content-Type: {mime}\r\n\r\n"
            ).encode()
            + body
            + f"\r\n--{boundary}--\r\n".encode(),
        ]
        data = b"".join(chunks)
        headers = {
            "Accept": "application/json",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-Portal-Key": key,
            "User-Agent": USER_AGENT,
        }
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            return json.loads(response.read().decode() or "{}")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(f"{method} {url} -> {error.code} {detail}") from error


def chunks(rows: list[dict], size: int) -> list[list[dict]]:
    return [rows[index : index + size] for index in range(0, len(rows), size)]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Push the cleaned office crawl into Reonix.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Load the seed, print catalogue counts, and exit without REONIX env or HTTP.",
    )
    parser.add_argument(
        "--allow-empty-offices",
        action="store_true",
        help="Import even when the catalogue has consultants but zero offices.",
    )
    args = parser.parse_args(argv)

    if not SEED.is_file():
        print(f"missing {SEED}", file=sys.stderr)
        return 1

    data = json.loads(SEED.read_text(encoding="utf-8"))
    offices, consultants, skipped = catalogue_rows(data.get("offices") or [], data.get("consultants") or [])
    print(f"offices={len(offices)} consultants={len(consultants)} skipped={len(skipped)}")
    if args.dry_run:
        return 0
    if len(offices) == 0 and len(consultants) > 0 and not args.allow_empty_offices:
        print(
            f"refusing import: offices=0 consultants={len(consultants)}; "
            "pass --allow-empty-offices to continue",
            file=sys.stderr,
        )
        return 1

    base = env_value("REONIX_BASE_URL").rstrip("/")
    key = env_value("REONIX_PORTAL_KEY")
    if base == "" or key == "":
        print("REONIX_BASE_URL or REONIX_PORTAL_KEY is empty", file=sys.stderr)
        return 1

    endpoint = base + "/api/v1/integrations/portal/catalogue/import"
    created = {"offices": 0, "consultants": 0, "reviews": 0, "skipped": len(skipped)}
    for batch in chunks(offices, 20):
        body = request("POST", endpoint, key, {"offices": [{k: v for k, v in row.items() if k != "image"} for row in batch]})
        created["offices"] += int((body.get("data") or {}).get("offices") or 0)
    for batch in chunks(consultants, 15):
        slim = []
        for row in batch:
            item = dict(row)
            item.pop("image", None)
            slim.append(item)
        body = request("POST", endpoint, key, {"consultants": slim})
        result = body.get("data") or {}
        created["consultants"] += int(result.get("consultants") or 0)
        created["reviews"] += int(result.get("reviews") or 0)
        created["skipped"] += len(result.get("skipped") or [])

    media = base + "/api/v1/integrations/portal/catalogue/import/media"
    uploaded = skipped_media = 0
    for kind, rows in (("office", offices), ("consultant", consultants)):
        for row in rows:
            image = row.get("image") or ""
            if not image.startswith("/media/"):
                continue
            path = PUBLIC / image.lstrip("/")
            if not path.is_file():
                skipped_media += 1
                continue
            mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            request(
                "POST",
                media,
                key,
                {"importKey": row["importKey"], "kind": kind},
                (path.name, path.read_bytes(), mime),
            )
            uploaded += 1
            if uploaded % 50 == 0:
                print(f"media {uploaded}", flush=True)

    print(f"imported {created} media={uploaded} missing_files={skipped_media}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
