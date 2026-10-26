import assert from "node:assert/strict";
import test from "node:test";

import { officeHttpCache, rows } from "./api.ts";

test("category and location reads are not stored by the browser", () => {
  assert.equal(officeHttpCache("categories"), "no-store");
  assert.equal(officeHttpCache("categories/4/attributes?type=sale"), "no-store");
  assert.equal(officeHttpCache("locations/cities"), "no-store");
  assert.equal(officeHttpCache("locations/districts?city_id=35"), "no-store");
  assert.equal(officeHttpCache("locations/neighborhoods?district_id=9"), "no-store");
  assert.equal(officeHttpCache("locations/neighborhoods?district_id=12"), "no-store");
  assert.equal(officeHttpCache("portfolios"), "default");
  assert.equal(officeHttpCache("me"), "default");
  assert.equal(officeHttpCache("contacts/4"), "reload");
  assert.equal(officeHttpCache("categories", "POST"), "reload");
});

test("category arrays and neighborhood lists both become options", () => {
  assert.deepEqual(rows([{ id: 4, name: "Konut" }, { id: 5, name: "Arsa" }]).map((row) => row.name), ["Konut", "Arsa"]);
  assert.equal(rows({ status: "success", data: [{ id: 8, name: "Buca Mah." }] })[0]?.name, "Buca Mah.");
  assert.equal(rows({ data: { "0": { id: 1, name: "Alsancak" }, "1": { id: 2, name: "Güzelyalı" } } }).length, 2);
  assert.deepEqual(rows({ data: [] }), []);
  assert.deepEqual(rows({ secret: "no", activation_errors: [{ code: "x" }] }), []);
});
