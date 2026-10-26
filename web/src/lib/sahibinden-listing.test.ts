import assert from "node:assert/strict";
import test from "node:test";

import {
  classifySahibindenImportFailure,
  parseSahibindenListing,
  portfolioDraftFromImport,
  SAHIBINDEN_IMPORT_ERROR_TEXT,
} from "./sahibinden-listing.ts";

test("a sahibinden listing URL or number is accepted", () => {
  assert.deepEqual(parseSahibindenListing(" 1234567890 "), { ok: true, url: "1234567890" });
  assert.deepEqual(
    parseSahibindenListing("https://www.sahibinden.com/ilan/emlak-konut-1234567890/detay"),
    { ok: true, url: "https://www.sahibinden.com/ilan/emlak-konut-1234567890/detay" },
  );
  assert.deepEqual(
    parseSahibindenListing("sahibinden.com/ilan/emlak-konut-1234567890/detay"),
    { ok: true, url: "https://sahibinden.com/ilan/emlak-konut-1234567890/detay" },
  );
  assert.equal(parseSahibindenListing("").ok, false);
  assert.equal(parseSahibindenListing("12345").ok, false);
  assert.equal(parseSahibindenListing("https://example.com/ilan/1234567890/detay").ok, false);
  assert.equal(parseSahibindenListing("https://sahibinden.com.evil.com/ilan/1").ok, false);
  assert.equal(parseSahibindenListing("https://www.sahibinden.com/").ok, false);
  assert.equal(SAHIBINDEN_IMPORT_ERROR_TEXT.invalid.length > 0, true);
});

test("import failures map to a visible error", () => {
  assert.equal(classifySahibindenImportFailure(404, ""), "not-found");
  assert.equal(classifySahibindenImportFailure(422, "İlan bulunamadı"), "not-found");
  assert.equal(classifySahibindenImportFailure(403, ""), "forbidden");
  assert.equal(classifySahibindenImportFailure(429, ""), "rate-limit");
  assert.equal(classifySahibindenImportFailure(422, "Çok fazla deneme"), "rate-limit");
  assert.equal(classifySahibindenImportFailure(504, ""), "upstream");
  assert.equal(classifySahibindenImportFailure(0, "Failed to fetch"), "upstream");
  assert.equal(classifySahibindenImportFailure(422, "Servis yanıt vermedi"), "upstream");
});

test("import payload fills the manual portfolio fields", () => {
  assert.deepEqual(portfolioDraftFromImport({
    data: {
      title: "Kadıköy daire",
      type: "rent",
      price: "1.250.000 TL",
      contact_id: 9,
      category: { id: 4 },
      city_id: "34",
      district_id: 12,
      neighborhood_id: 80,
    },
  }), {
    title: "Kadıköy daire",
    contactId: "9",
    categoryId: "4",
    type: "rent",
    price: "1250000",
    cityId: "34",
    districtId: "12",
    neighborhoodId: "80",
  });
});
