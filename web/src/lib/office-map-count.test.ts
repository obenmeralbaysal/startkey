import assert from "node:assert/strict";
import test from "node:test";

import { officeCountUnit } from "../content/office-map.ts";
import { officeMapCountText } from "./map-coordinates.ts";

const pin = { latitude: 38.4, longitude: 27.1 };
const invalid = { latitude: null, longitude: 27.1 };

test("the map count uses the marker offices and the locale unit", () => {
  const offices = [pin, pin, invalid];
  assert.equal(officeMapCountText(officeCountUnit.tr, offices), "2 ofis");
  assert.equal(officeMapCountText(officeCountUnit.en, offices), "2 offices");
  assert.equal(officeMapCountText(officeCountUnit.de, offices), "2 Büros");
});

test("a missing, empty, or unplottable office list hides the count", () => {
  assert.equal(officeMapCountText(officeCountUnit.tr, null), null);
  assert.equal(officeMapCountText(officeCountUnit.en, undefined), null);
  assert.equal(officeMapCountText(officeCountUnit.de, []), null);
  assert.equal(officeMapCountText(officeCountUnit.tr, [invalid, { latitude: 95, longitude: 27 }]), null);
});
