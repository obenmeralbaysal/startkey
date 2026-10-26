#!/usr/bin/env python3
"""Media step of scripts/import-catalogue.py. No network and no env files."""

import contextlib
import hashlib
import importlib.util
import io
import json
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("import_catalogue", ROOT / "import-catalogue.py")
import_catalogue = importlib.util.module_from_spec(spec)
spec.loader.exec_module(import_catalogue)


def office(external_id: int, image: str) -> dict:
    return {
        "externalId": external_id,
        "translations": {
            "tr": {
                "name": f"Office {external_id}",
                "email": f"office{external_id}@example.com",
                "phoneHref": "tel:905551110011",
                "address": "Addr",
                "image": image,
            }
        },
    }


def consultant(external_id: int, office_id: int, image: str, email: str) -> dict:
    return {
        "externalId": external_id,
        "officeId": office_id,
        "translations": {
            "tr": {
                "name": f"Ada {external_id}",
                "email": email,
                "phoneHref": "tel:905551110022",
                "image": image,
            }
        },
    }


class FakeResponse:
    def __init__(self, body: bytes):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self.body


class ImportMediaTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.public = self.root / "public"
        self.public.mkdir()
        self.seed = self.root / "seed.json"
        self.state = self.root / "media-state.json"

    def tearDown(self):
        self.tmp.cleanup()

    def fake_env(self, name: str) -> str:
        if name == "REONIX_BASE_URL":
            return "https://example.invalid"
        if name == "REONIX_PORTAL_KEY":
            return "test-key"
        raise AssertionError(name)

    def write_seed(self, offices: list, consultants: list) -> None:
        self.seed.write_text(json.dumps({"offices": offices, "consultants": consultants}), encoding="utf-8")

    def add_image(self, image: str, content: bytes) -> None:
        path = self.public / image.lstrip("/")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    def invoke(self, extra: list[str], request=None, env="default", urlopen=None):
        stdout, stderr = io.StringIO(), io.StringIO()
        argv = [*extra, "--media-state", str(self.state)]
        with contextlib.ExitStack() as stack:
            stack.enter_context(patch.object(import_catalogue, "SEED", self.seed))
            stack.enter_context(patch.object(import_catalogue, "PUBLIC", self.public))
            if env == "default":
                stack.enter_context(patch.object(import_catalogue, "env_value", self.fake_env))
            elif env is not None:
                stack.enter_context(patch.object(import_catalogue, "env_value", env))
            if request is not None:
                stack.enter_context(patch.object(import_catalogue, "request", request))
            if urlopen is not None:
                stack.enter_context(patch.object(import_catalogue.urllib.request, "urlopen", urlopen))
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                code = import_catalogue.main(argv)
        return code, stdout.getvalue(), stderr.getvalue()

    def test_media_404_continues_and_is_counted(self):
        self.write_seed(
            [office(1, "/media/o.jpg")],
            [
                consultant(2, 1, "/media/c.jpg", "ada2@example.com"),
                consultant(4, 1, "/media/gone.jpg", "ada4@example.com"),
            ],
        )
        self.add_image("/media/o.jpg", b"office-bytes")
        self.add_image("/media/c.jpg", b"consultant-bytes")
        media_calls = []

        def urlopen(req, timeout=90):
            self.assertEqual(req.get_header("User-agent"), import_catalogue.USER_AGENT)
            self.assertEqual(req.get_header("X-portal-key"), "test-key")
            raw = req.data or b""
            if (req.get_header("Content-type") or "").startswith("multipart/"):
                media_calls.append(raw)
                if b"consultant:2" in raw:
                    raise urllib.error.HTTPError(
                        req.full_url,
                        404,
                        "Not Found",
                        {},
                        io.BytesIO(b'{"error":"not_found"}'),
                    )
                return FakeResponse(b"{}")
            payload = json.loads(raw.decode())
            if "offices" in payload:
                return FakeResponse(b'{"data":{"offices":1,"skipped":[]}}')
            return FakeResponse(b'{"data":{"consultants":2,"reviews":0,"skipped":[]}}')

        code, stdout, _stderr = self.invoke([], urlopen=urlopen)
        self.assertEqual(code, 0)
        self.assertIn("media 404 kind=consultant key=consultant:2", stdout)
        self.assertIn("media_404=1", stdout)
        self.assertIn("media_failed=0", stdout)
        self.assertIn("missing_files=1", stdout)
        self.assertIn("media=1", stdout)
        self.assertEqual(sum(1 for raw in media_calls if b"consultant:2" in raw), 1)
        state = json.loads(self.state.read_text(encoding="utf-8"))
        self.assertEqual(state["office:office:1"], hashlib.sha256(b"office-bytes").hexdigest())
        self.assertNotIn("consultant:consultant:2", state)
        self.assertFalse(self.state.with_name(self.state.name + ".tmp").exists())

    def test_reonix_skipped_keys_are_not_uploaded(self):
        self.write_seed(
            [office(1, "/media/o.jpg")],
            [
                consultant(3, 1, "/media/c3.jpg", "ada3@example.com"),
                consultant(8, 1, "/media/c8.jpg", "ada8@example.com"),
                consultant(9, 1, "/media/c9.jpg", "ada9@example.com"),
            ],
        )
        for name in ("/media/o.jpg", "/media/c3.jpg", "/media/c8.jpg", "/media/c9.jpg"):
            self.add_image(name, name.encode())
        uploaded = []

        def request(method, url, key, payload=None, file=None):
            self.assertEqual(key, "test-key")
            if file is not None:
                uploaded.append(payload["importKey"])
                return {}
            if "offices" in (payload or {}):
                return {
                    "data": {
                        "offices": 0,
                        "skipped": [{"importKey": "office:1", "reason": "office-card:name", "name": "ZZ-PRIVATE-NAME"}],
                    }
                }
            return {
                "data": {
                    "consultants": 1,
                    "reviews": 0,
                    "skipped": [
                        {"importKey": "consultant:9", "reason": "missing-email", "email": "zz-private@example.com"},
                        {"importKey": "consultant:8", "reason": "email-taken"},
                    ],
                }
            }

        code, stdout, _stderr = self.invoke([], request=request)
        self.assertEqual(code, 0)
        self.assertEqual(uploaded, ["consultant:3"])
        self.assertIn(
            "skipped_by_reonix {'email-taken': 1, 'missing-email': 1, 'office-card:name': 1}",
            stdout,
        )
        self.assertNotIn("ZZ-PRIVATE-NAME", stdout)
        self.assertNotIn("zz-private@example.com", stdout)
        self.assertIn("media_skipped_server=3", stdout)
        self.assertIn("media=1", stdout)

    def test_state_file_skips_identical_second_run(self):
        self.write_seed([office(1, "/media/o.jpg")], [])
        self.add_image("/media/o.jpg", b"same-bytes")
        uploads = []
        replaced = []

        def request(method, url, key, payload=None, file=None):
            if file is None:
                return {"data": {"offices": 1, "skipped": []}}
            uploads.append(payload["importKey"])
            return {}

        real_replace = import_catalogue.os.replace

        def spy_replace(src, dst):
            replaced.append((Path(src).read_text(encoding="utf-8"), str(dst)))
            real_replace(src, dst)

        with patch.object(import_catalogue.os, "replace", spy_replace):
            code, stdout, _stderr = self.invoke([], request=request)
        self.assertEqual(code, 0)
        self.assertEqual(uploads, ["office:1"])
        self.assertIn("media=1", stdout)
        self.assertEqual(len(replaced), 1)
        saved = json.loads(replaced[0][0])
        digest = hashlib.sha256(b"same-bytes").hexdigest()
        self.assertEqual(saved, {"office:office:1": digest})
        self.assertTrue(replaced[0][1].endswith(".json"))

        code, stdout, _stderr = self.invoke([], request=request)
        self.assertEqual(code, 0)
        self.assertEqual(uploads, ["office:1"])
        self.assertIn("media_already=1", stdout)
        self.assertIn("media=0", stdout)

        self.add_image("/media/o.jpg", b"changed-bytes")
        code, stdout, _stderr = self.invoke([], request=request)
        self.assertEqual(code, 0)
        self.assertEqual(uploads, ["office:1", "office:1"])
        self.assertIn("media=1", stdout)
        state = json.loads(self.state.read_text(encoding="utf-8"))
        self.assertEqual(state["office:office:1"], hashlib.sha256(b"changed-bytes").hexdigest())

    def test_media_only_performs_no_json_import(self):
        self.write_seed(
            [office(1, "/media/o.jpg")],
            [consultant(2, 1, "/media/c.jpg", "ada2@example.com")],
        )
        self.add_image("/media/o.jpg", b"office-bytes")
        self.add_image("/media/c.jpg", b"consultant-bytes")
        urls = []

        def request(method, url, key, payload=None, file=None):
            urls.append(url)
            self.assertIsNotNone(file)
            self.assertTrue(url.endswith("/catalogue/import/media"))
            if payload["importKey"] == "consultant:2":
                raise import_catalogue.ImportHttpError("POST", url, 404, '{"error":"not_found"}')
            return {}

        code, stdout, _stderr = self.invoke(["--media-only"], request=request)
        self.assertEqual(code, 0)
        self.assertEqual(len(urls), 2)
        self.assertNotIn("skipped_by_reonix", stdout)
        self.assertIn("media 404 kind=consultant key=consultant:2", stdout)
        self.assertIn("media_404=1", stdout)
        self.assertIn("media_skipped_server=0", stdout)

    def test_dry_run_counts_media_without_env_or_http(self):
        self.write_seed(
            [office(1, "/media/o.jpg")],
            [consultant(2, 1, "/media/c.jpg", "ada2@example.com"), consultant(4, 1, "/media/gone.jpg", "ada4@example.com")],
        )
        self.add_image("/media/o.jpg", b"same-bytes")
        self.add_image("/media/c.jpg", b"new-bytes")
        digest = hashlib.sha256(b"same-bytes").hexdigest()
        self.state.write_text(json.dumps({"office:office:1": digest}), encoding="utf-8")

        def env_value(name):
            raise AssertionError(name)

        def request(*args, **kwargs):
            raise AssertionError("http")

        code, stdout, _stderr = self.invoke(["--dry-run"], request=request, env=env_value)
        self.assertEqual(code, 0)
        self.assertIn("media_would_upload=1", stdout)
        self.assertIn("media_already=1", stdout)
        self.assertNotIn("imported ", stdout)

    def test_other_http_error_retries_once_then_exits_2(self):
        self.write_seed([office(1, "/media/o.jpg")], [])
        self.add_image("/media/o.jpg", b"office-bytes")
        attempts = []

        def request(method, url, key, payload=None, file=None):
            if file is None:
                return {"data": {"offices": 1, "skipped": []}}
            attempts.append(payload["importKey"])
            raise import_catalogue.ImportHttpError("POST", url, 500, "boom")

        code, stdout, _stderr = self.invoke([], request=request)
        self.assertEqual(attempts, ["office:1", "office:1"])
        self.assertEqual(code, 2)
        self.assertIn("media fail kind=office key=office:1 code=500", stdout)
        self.assertIn("media_failed=1", stdout)
        self.assertFalse(self.state.exists())

    def test_no_media_skips_uploads(self):
        self.write_seed([office(1, "/media/o.jpg")], [])
        self.add_image("/media/o.jpg", b"office-bytes")
        files = []

        def request(method, url, key, payload=None, file=None):
            files.append(file)
            return {"data": {"offices": 1, "skipped": []}}

        code, stdout, _stderr = self.invoke(["--no-media"], request=request)
        self.assertEqual(code, 0)
        self.assertEqual(files, [None])
        self.assertIn("media=0", stdout)
        self.assertIn("skipped_by_reonix {}", stdout)

    def test_zero_offices_guard_still_refuses_media_only(self):
        self.write_seed([], [consultant(2, 1, "/media/c.jpg", "ada2@example.com")])

        def env_value(name):
            raise AssertionError(name)

        code, _stdout, stderr = self.invoke([], env=env_value)
        self.assertEqual(code, 1)
        self.assertIn("refusing import: offices=0 consultants=1", stderr)
        code, _stdout, stderr = self.invoke(["--media-only"], env=env_value)
        self.assertEqual(code, 1)
        self.assertIn("--allow-empty-offices", stderr)


if __name__ == "__main__":
    unittest.main()
