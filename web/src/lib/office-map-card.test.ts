import assert from "node:assert/strict";
import { test } from "node:test";

import { mapPinPosition } from "./map-coordinates.ts";
import { officeCardHref, officeForCard } from "./office-map-card.ts";

const offices = [
  { id: 1, name: "Lider", urlPath: "/tr/ofisler/lider", latitude: 38.46, longitude: 27.17 },
  { id: 2, name: "Ankara", urlPath: "/tr/ofisler/ankara", latitude: 39.93, longitude: 32.85 },
  { id: 3, name: "Bozuk", urlPath: "javascript:alert(1)", latitude: 0, longitude: 0 },
];

test("selected office wins", () => {
  assert.equal(officeForCard(offices, 2, { latitude: 38.4, longitude: 27.1 }, mapPinPosition)?.id, 2);
});

test("nearest office to the centre when nothing is selected", () => {
  assert.equal(officeForCard(offices, null, { latitude: 38.4, longitude: 27.1 }, mapPinPosition)?.id, 1);
  assert.equal(officeForCard(offices, 99, { latitude: 40, longitude: 33 }, mapPinPosition)?.id, 2);
});

test("no offices means no card", () => {
  assert.equal(officeForCard([], null, null, mapPinPosition), null);
});

test("href keeps only site-relative paths", () => {
  assert.equal(officeCardHref(offices[0]), "/tr/ofisler/lider");
  assert.equal(officeCardHref(offices[2]), "/");
});
