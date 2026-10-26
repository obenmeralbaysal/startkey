import assert from "node:assert/strict";
import test from "node:test";

import { PORTAL_EMAIL_PATTERN } from "./portal-login.ts";

test("portal login accepts example.com and keeps the reference pattern", () => {
  assert.equal(PORTAL_EMAIL_PATTERN.test("ada@example.com"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("franchise.admin@example.com"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("a.b@example.com"), true);
  assert.equal(PORTAL_EMAIL_PATTERN.test("ada@test.invalid"), false);
  assert.equal(PORTAL_EMAIL_PATTERN.test("not-an-email"), false);
});
