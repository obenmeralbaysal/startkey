import assert from "node:assert/strict";
import { test } from "node:test";

import { mapPinPosition } from "./map-coordinates.ts";
import {
  officeCardHref,
  officeCardLine,
  officeForCard,
} from "./office-map-card.ts";

const offices = [
  {
    id: 1,
    name: "Lider",
    urlPath: "/tr/ofisler/lider",
    latitude: 38.46,
    longitude: 27.17,
  },
  {
    id: 2,
    name: "Ankara",
    urlPath: "/tr/ofisler/ankara",
    latitude: 39.93,
    longitude: 32.85,
  },
  {
    id: 3,
    name: "Bozuk",
    urlPath: "javascript:alert(1)",
    latitude: 0,
    longitude: 0,
  },
];

test("selected office wins", () => {
  assert.equal(
    officeForCard(
      offices,
      2,
      { latitude: 38.4, longitude: 27.1 },
      mapPinPosition,
    )?.id,
    2,
  );
});

test("nearest office to the centre when nothing is selected", () => {
  assert.equal(
    officeForCard(
      offices,
      null,
      { latitude: 38.4, longitude: 27.1 },
      mapPinPosition,
    )?.id,
    1,
  );
  assert.equal(
    officeForCard(offices, 99, { latitude: 40, longitude: 33 }, mapPinPosition)
      ?.id,
    2,
  );
});

test("no offices means no card", () => {
  assert.equal(officeForCard([], null, null, mapPinPosition), null);
});

test("href keeps only site-relative paths", () => {
  assert.equal(officeCardHref(offices[0]), "/tr/ofisler/lider");
  assert.equal(officeCardHref(offices[2]), "/");
});

test("card line follows the slide and hides missing parts", () => {
  const base = offices[0];
  assert.equal(
    officeCardLine(
      { ...base, city: "İzmir", district: "Bayraklı", consultantCount: 12 },
      "tr",
    ),
    "Bayraklı, İzmir · 12 danışman",
  );
  assert.equal(
    officeCardLine(
      { ...base, city: "İzmir", district: "", consultantCount: 1 },
      "en",
    ),
    "İzmir · 1 consultant",
  );
  assert.equal(
    officeCardLine(
      { ...base, city: "İzmir", district: "Bayraklı", consultantCount: null },
      "de",
    ),
    "Bayraklı, İzmir",
  );
  assert.equal(
    officeCardLine({ ...base, consultantCount: 3 }, "de"),
    "3 Berater",
  );
  assert.equal(
    officeCardLine({ ...base, city: " ", consultantCount: 0 }, "tr"),
    null,
  );
  assert.equal(officeCardLine(base, "tr"), null);
});
