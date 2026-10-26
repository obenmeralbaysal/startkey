import assert from "node:assert/strict";
import test from "node:test";

import { proxyCatalogueImage } from "./catalogue-image-cache.ts";

test("catalogue image cache headers and 304 reach the browser", () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const fresh = proxyCatalogueImage({
    status: 200,
    body: bytes,
    contentType: "image/jpeg",
    cacheControl: "public, max-age=3600",
    etag: '"abc"',
  });
  assert.equal(fresh.status, 200);
  assert.equal(fresh.headers["Cache-Control"], "public, max-age=3600");
  assert.equal(fresh.headers.ETag, '"abc"');
  assert.equal(fresh.headers["Content-Type"], "image/jpeg");
  assert.equal(fresh.body, bytes);

  const cached = proxyCatalogueImage({
    status: 304,
    body: bytes,
    contentType: "image/jpeg",
    cacheControl: "public, max-age=3600",
    etag: '"abc"',
  });
  assert.equal(cached.status, 304);
  assert.equal(cached.body, null);
  assert.equal(cached.headers.ETag, '"abc"');
  assert.equal(cached.headers["Cache-Control"], "public, max-age=3600");
  assert.equal(cached.headers["Content-Type"], undefined);
});
