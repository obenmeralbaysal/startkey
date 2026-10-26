import assert from "node:assert/strict";
import test from "node:test";

import { ApiLoadError, apiErrorMessage, errorText, fieldErrors, loadFailure, networkFailureView, officeAccessDenied } from "./api-error.ts";
import { NETWORK_OFFICE_DENIED } from "../../../lib/portal-network.ts";

test("a 422 message is shown, and a generic message yields to field text", () => {
  assert.equal(errorText({ message: "Bu ofis adı kullanılıyor." }), "Bu ofis adı kullanılıyor.");
  assert.equal(
    errorText({
      message: "The given data was invalid.",
      errors: { name: ["Ad zorunlu."], city: ["İl seçin."] },
    }),
    "Ad zorunlu. İl seçin.",
  );
  assert.equal(errorText({ message: "Doğrulama hatası", errors: { email: "E-posta geçersiz." } }), "E-posta geçersiz.");
  assert.equal(errorText({ errors: ["Ad zorunlu.", "İl seçin."] }), "Ad zorunlu. İl seçin.");
  assert.equal(errorText({ error: "Kayıt kapalı." }), "Kayıt kapalı.");
  assert.equal(errorText({}), "İşlem tamamlanamadı.");
  assert.equal(errorText({ message: "Eksik" }, ["Belge"]), "Eksik Belge");
});

test("a laravel 422 shows the message, or the field text when the message is generic", () => {
  const fallback = "Liste alınamadı.";
  assert.equal(apiErrorMessage({ message: "Arama çok uzun." }, fallback), "Arama çok uzun.");
  assert.equal(
    apiErrorMessage({
      message: "The given data was invalid.",
      errors: { q: ["En fazla 80 karakter."] },
    }, fallback),
    "En fazla 80 karakter.",
  );
  assert.equal(apiErrorMessage({ message: "Doğrulama hatası", errors: { q: ["Sorgu zorunlu."] } }, fallback), "Sorgu zorunlu.");
  assert.equal(apiErrorMessage({}, fallback), fallback);
  assert.equal(apiErrorMessage(null, fallback), fallback);
  assert.equal(apiErrorMessage({ error: "unavailable" }, fallback), fallback);
  assert.equal(apiErrorMessage({ message: "İşlem tamamlanamadı." }, fallback), "İşlem tamamlanamadı.");
});

test("office_id on 422, 403, or 404 is the office access state", () => {
  const payload = {
    message: "The given data was invalid.",
    errors: { office_id: ["Seçilen ofis ağda yok."] },
  };
  for (const status of [422, 403, 404]) {
    assert.equal(officeAccessDenied(status, payload), true);
    assert.deepEqual(loadFailure(status, payload, "Liste alınamadı."), { kind: "denied" });
    const view = networkFailureView(new ApiLoadError(loadFailure(status, payload, "Liste alınamadı.")), "Liste alınamadı.", NETWORK_OFFICE_DENIED);
    assert.deepEqual(view, { view: "denied", title: "Ofis bulunamadı / erişim yok" });
  }
  assert.equal(officeAccessDenied(422, { errors: { "filter.office_id": ["Ofis yok."] } }), true);
  assert.equal(officeAccessDenied(500, payload), false);
  assert.equal(officeAccessDenied(422, { message: "Arama çok uzun.", errors: { q: ["En fazla 80 karakter."] } }), false);
  assert.deepEqual(
    networkFailureView(new ApiLoadError(loadFailure(422, { message: "Arama çok uzun." }, "Liste alınamadı.")), "Liste alınamadı.", NETWORK_OFFICE_DENIED),
    { view: "error", message: "Arama çok uzun." },
  );
  assert.deepEqual(
    networkFailureView(new Error(""), "Liste alınamadı.", NETWORK_OFFICE_DENIED),
    { view: "error", message: "Liste alınamadı." },
  );
});

test("validation keeps the first error on each field", () => {
  assert.deepEqual(
    fieldErrors({
      errors: {
        name: ["Ad zorunlu.", "Ad kısa."],
        city: "İl seçin.",
        address: { line: ["Adres zorunlu."] },
      },
    }),
    { name: "Ad zorunlu.", city: "İl seçin.", "address.line": "Adres zorunlu." },
  );
});
