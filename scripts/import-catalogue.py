#!/usr/bin/env python3
"""Push the cleaned office crawl into Reonix. Does not print secrets.

Skip summaries are reason counts only. The media state file stores
kind, import key, and sha256 — not names, emails, or file bytes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
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
DEFAULT_MEDIA_STATE = ROOT / "api" / "database" / "data" / ".media-uploaded.json"


class ImportHttpError(RuntimeError):
    def __init__(self, method: str, url: str, code: int, detail: str) -> None:
        self.method = method
        self.url = url
        self.code = code
        self.detail = detail
        super().__init__(f"{method} {url} -> {code} {detail}")


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
        raise ImportHttpError(method, url, error.code, detail) from error


def chunks(rows: list[dict], size: int) -> list[list[dict]]:
    return [rows[index : index + size] for index in range(0, len(rows), size)]


def each_media(offices: list[dict], consultants: list[dict]):
    for kind, rows in (("office", offices), ("consultant", consultants)):
        for row in rows:
            image = row.get("image") or ""
            import_key = row.get("importKey") or ""
            if not isinstance(image, str) or not image.startswith("/media/"):
                continue
            if not isinstance(import_key, str) or import_key == "":
                continue
            yield kind, import_key, image


def load_media_state(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise RuntimeError(f"media state is not valid JSON: {path}") from error
    if not isinstance(data, dict):
        raise RuntimeError(f"media state is not an object: {path}")
    return {key: value for key, value in data.items() if isinstance(key, str) and isinstance(value, str)}


def save_media_state(path: Path, state: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(state, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def media_plan(offices: list[dict], consultants: list[dict], public: Path, state: dict[str, str]) -> tuple[int, int]:
    would = already = 0
    for kind, import_key, image in each_media(offices, consultants):
        path = public / image.lstrip("/")
        if not path.is_file():
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if state.get(f"{kind}:{import_key}") == digest:
            already += 1
        else:
            would += 1
    return would, already


def note_skipped(body: dict, keys: set[str], reasons: dict[str, int]) -> dict:
    result = body.get("data") or {}
    for item in result.get("skipped") or []:
        if not isinstance(item, dict):
            continue
        import_key = item.get("importKey")
        if isinstance(import_key, str) and import_key != "":
            keys.add(import_key)
        reason = item.get("reason")
        label = reason if isinstance(reason, str) else ""
        reasons[label] = reasons.get(label, 0) + 1
    return result


def post_media(url: str, key: str, kind: str, import_key: str, path: Path, body: bytes, mime: str) -> str:
    payload = {"importKey": import_key, "kind": kind}
    file = (path.name, body, mime)

    def once() -> None:
        request("POST", url, key, payload, file)

    try:
        once()
        return "ok"
    except ImportHttpError as error:
        if error.code == 404:
            print(f"media 404 kind={kind} key={import_key}", flush=True)
            return "404"
        try:
            once()
            return "ok"
        except ImportHttpError as retry_error:
            if retry_error.code == 404:
                print(f"media 404 kind={kind} key={import_key}", flush=True)
                return "404"
            print(f"media fail kind={kind} key={import_key} code={retry_error.code}", flush=True)
            return "fail"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Push the cleaned office crawl into Reonix.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Load the seed, print catalogue and media counts, and exit without REONIX env or HTTP.",
    )
    parser.add_argument(
        "--allow-empty-offices",
        action="store_true",
        help="Import even when the catalogue has consultants but zero offices.",
    )
    parser.add_argument(
        "--media-state",
        default=str(DEFAULT_MEDIA_STATE),
        help="JSON map of kind:importKey to sha256 for media already uploaded.",
    )
    parser.add_argument(
        "--media-only",
        action="store_true",
        help="Skip office and consultant JSON import and upload media only.",
    )
    parser.add_argument(
        "--no-media",
        action="store_true",
        help="Skip the media upload step.",
    )
    args = parser.parse_args(argv)
    if args.media_only and args.no_media:
        print("--media-only and --no-media cannot be combined", file=sys.stderr)
        return 1
    state_path = Path(args.media_state)

    if not SEED.is_file():
        print(f"missing {SEED}", file=sys.stderr)
        return 1

    data = json.loads(SEED.read_text(encoding="utf-8"))
    offices, consultants, skipped = catalogue_rows(data.get("offices") or [], data.get("consultants") or [])
    print(f"offices={len(offices)} consultants={len(consultants)} skipped={len(skipped)}")
    if args.dry_run:
        try:
            state = load_media_state(state_path)
        except RuntimeError as error:
            print(str(error), file=sys.stderr)
            return 1
        would, already = media_plan(offices, consultants, PUBLIC, state)
        print(f"media_would_upload={would} media_already={already}")
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
    created = {"offices": 0, "consultants": 0, "reviews": 0, "skipped": 0}
    skipped_keys: set[str] = set()
    reasons: dict[str, int] = {}
    if not args.media_only:
        created["skipped"] = len(skipped)
        for batch in chunks(offices, 20):
            body = request("POST", endpoint, key, {"offices": [{k: v for k, v in row.items() if k != "image"} for row in batch]})
            result = note_skipped(body, skipped_keys, reasons)
            created["offices"] += int(result.get("offices") or 0)
            created["skipped"] += len(result.get("skipped") or [])
        for batch in chunks(consultants, 15):
            slim = []
            for row in batch:
                item = dict(row)
                item.pop("image", None)
                slim.append(item)
            body = request("POST", endpoint, key, {"consultants": slim})
            result = note_skipped(body, skipped_keys, reasons)
            created["consultants"] += int(result.get("consultants") or 0)
            created["reviews"] += int(result.get("reviews") or 0)
            created["skipped"] += len(result.get("skipped") or [])
        print("skipped_by_reonix " + repr({label: reasons[label] for label in sorted(reasons)}))

    uploaded = missing_files = media_skipped_server = media_404 = media_failed = media_already = 0
    if not args.no_media:
        try:
            state = load_media_state(state_path)
        except RuntimeError as error:
            print(str(error), file=sys.stderr)
            return 1
        media = base + "/api/v1/integrations/portal/catalogue/import/media"
        for kind, import_key, image in each_media(offices, consultants):
            if import_key in skipped_keys:
                media_skipped_server += 1
                continue
            path = PUBLIC / image.lstrip("/")
            if not path.is_file():
                missing_files += 1
                continue
            body_bytes = path.read_bytes()
            digest = hashlib.sha256(body_bytes).hexdigest()
            state_key = f"{kind}:{import_key}"
            if state.get(state_key) == digest:
                media_already += 1
                continue
            mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            outcome = post_media(media, key, kind, import_key, path, body_bytes, mime)
            if outcome == "ok":
                state[state_key] = digest
                save_media_state(state_path, state)
                uploaded += 1
                if uploaded % 50 == 0:
                    print(f"media {uploaded}", flush=True)
            elif outcome == "404":
                media_404 += 1
            else:
                media_failed += 1

    print(
        f"imported {created} media={uploaded} missing_files={missing_files} "
        f"media_skipped_server={media_skipped_server} media_404={media_404} "
        f"media_failed={media_failed} media_already={media_already}"
    )
    return 2 if media_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
