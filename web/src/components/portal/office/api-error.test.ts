import assert from "node:assert/strict";
import test from "node:test";

import { errorText, fieldErrors } from "./api-error.ts";

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
