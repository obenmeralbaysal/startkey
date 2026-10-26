import assert from "node:assert/strict";
import test from "node:test";

import { PORTAL_EMAIL_PATTERN } from "./portal-login.ts";

test("portal login email accepts any domain.tld", () => {
  assert.equal(PORTAL_EMAIL_PATTERN.test("ada@example.com"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("franchise.admin@example.com"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("a.b@example.com"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("owner-a@test.invalid"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("ada@test.invalid"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("a@b"), false);
  assert.equal(PORTAL_EMAIL_PATTERN.test("no-at"), false);
  assert.equal(PORTAL_EMAIL_PATTERN.test("not-an-email"), false);
});
