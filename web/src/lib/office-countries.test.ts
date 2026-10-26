import assert from "node:assert/strict";
import test from "node:test";

import { countryChipLabel, officeMapHeading } from "../content/office-map.ts";
import { countryFromCoordinates, officeCountrySummary } from "./map-coordinates.ts";

const izmir = { latitude: 38.4377949, longitude: 27.1691515 };
const london = { latitude: 51.435777, longitude: 0.062761 };
const athens = { latitude: 37.9145203, longitude: 23.7482894 };
const girne = { latitude: 35.3302379, longitude: 33.3486544 };
const invalid = { latitude: null, longitude: 27.1 };

test("coordinate boxes match the network's out-of-province offices", () => {
  assert.equal(countryFromCoordinates(izmir.latitude, izmir.longitude), "TR");
  assert.equal(countryFromCoordinates(london.latitude, london.longitude), "GB");
  assert.equal(countryFromCoordinates(athens.latitude, athens.longitude), "GR");
  assert.equal(countryFromCoordinates(girne.latitude, girne.longitude), "CY");
});

test("chips prefer a country field and otherwise use the pin", () => {
  const summary = officeCountrySummary([
    izmir,
    izmir,
    { ...athens, country: "Greece" },
    { ...izmir, countryCode: "GB" },
    { ...girne, il: "Girne (K.K.T.C.)" },
    { ...izmir, il: "İzmir" },
    invalid,
    { latitude: 95, longitude: 10 },
  ]);
  assert.deepEqual(summary, {
    officeCount: 6,
    countries: [
      { code: "TR", count: 3 },
      { code: "CY", count: 1 },
      { code: "GR", count: 1 },
      { code: "GB", count: 1 },
    ],
  });
});

test("no plottable offices hides the heading and the chips", () => {
  assert.equal(officeCountrySummary(null), null);
  assert.equal(officeCountrySummary([]), null);
  assert.equal(officeCountrySummary([invalid]), null);
});

test("headings and chip labels follow the locale", () => {
  assert.equal(officeMapHeading("tr", 54, 4), "54 ofis, 4 ülke");
  assert.equal(officeMapHeading("en", 54, 4), "54 offices, 4 countries");
  assert.equal(officeMapHeading("en", 1, 1), "1 office, 1 country");
  assert.equal(officeMapHeading("de", 54, 4), "54 Büros, 4 Länder");
  assert.equal(officeMapHeading("de", 1, 1), "1 Büro, 1 Land");
  assert.equal(countryChipLabel("tr", "CY"), "KKTC");
  assert.equal(countryChipLabel("tr", "GB"), "Birleşik Krallık");
  assert.equal(countryChipLabel("en", "GR"), "Greece");
  assert.equal(countryChipLabel("de", "TR"), "Türkei");
});
