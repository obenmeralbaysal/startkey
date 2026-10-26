import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { fieldErrorId, matchedFieldErrors, withFieldErrors } from "./field-errors.ts";

test("field errors sit beside controls the form actually has", () => {
  assert.deepEqual(matchedFieldErrors(["name", "city"], { name: "Ad zorunlu.", missing: "Yok", "address.city": "İl seçin." }), {
    name: "Ad zorunlu.",
    city: "İl seçin.",
  });
  const html = renderToStaticMarkup(
    createElement(
      "form",
      null,
      withFieldErrors(
        [
          createElement("input", { key: "name", name: "name" }),
          createElement("input", { key: "city", name: "city" }),
        ],
        { name: "Ad zorunlu.", city: "İl seçin." },
      ),
    ),
  );
  assert.match(html, new RegExp(`id="${fieldErrorId("name")}"`));
  assert.match(html, /data-field-error="name"/);
  assert.match(html, /Ad zorunlu\./);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /İl seçin\./);
  const plain = renderToStaticMarkup(createElement("div", null, withFieldErrors(createElement("input", { name: "name" }), {})));
  assert.equal(plain.includes("data-field-error"), false);
});
