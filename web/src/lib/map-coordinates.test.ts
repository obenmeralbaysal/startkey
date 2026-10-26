import assert from "node:assert/strict";
import test from "node:test";

import { mapPinPosition } from "./map-coordinates.ts";

test("a comma-decimal Cyprus coordinate still produces a pin", () => {
  assert.deepEqual(mapPinPosition("35,3302379", "33,3486544"), {
    latitude: 35.3302379,
    longitude: 33.3486544,
  });
  assert.deepEqual(mapPinPosition(35.3302379, 33.3486544), {
    latitude: 35.3302379,
    longitude: 33.3486544,
  });
});

test("a missing or out-of-range latitude is not a pin", () => {
  assert.equal(mapPinPosition(null, 33.3), null);
  assert.equal(mapPinPosition("95", "27"), null);
  assert.equal(mapPinPosition("", ""), null);
});
