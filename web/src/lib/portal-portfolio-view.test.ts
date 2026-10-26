import assert from "node:assert/strict";
import test from "node:test";

import { portfolioEditChanges, portfolioScreen, portfolioSummary } from "./portal-portfolio-view.ts";

const sample = {
  status: "success",
  data: {
    id: 41,
    title: "Konak daire",
    description: "Deniz manzaralı.",
    type: "sale",
    price: "2500000.00",
    currency: "TRY",
    status: "prospect",
    province: "İzmir",
    district: "Konak",
    neighborhood: "Alsancak",
    created_at: "2026-10-01T09:30:00.000000Z",
    contact: { first_name: "Ayşe", last_name: "Yılmaz" },
    secret_column: "gizli",
    activation_errors: [{ code: "x" }],
    attributes: [
      { value: "3+1", definition: { label: "Oda Sayısı", is_room_count: true } },
      { value: "120", definition: { label: "Brüt m²" } },
      { value: "4", definition: { label: "Bulunduğu Kat" } },
      { value: "var", definition: { label: "Asansör" } },
    ],
    media: [
      { path: "portfolios/41/plan.pdf", type: "document" },
      { path: "portfolios/41/room.jpg", type: "image", is_showcase: false },
      { path: "portfolios/41/cover.jpg", type: "image", is_showcase: true },
    ],
  },
};

test("portfolio detail and edit are different screens", () => {
  assert.equal(portfolioScreen(undefined, undefined), "list");
  assert.equal(portfolioScreen("new", "manual"), "new");
  assert.equal(portfolioScreen("41", undefined), "detail");
  assert.equal(portfolioScreen("41", "edit"), "edit");
  assert.equal(portfolioScreen("41", "media"), "detail");
});

test("portfolio summary uses the wrapped show payload and skips unknown fields", () => {
  const view = portfolioSummary(sample);
  assert.equal(view.title, "Konak daire");
  assert.equal(view.description, "Deniz manzaralı.");
  assert.deepEqual(view.facts.map((fact) => fact.label), ["Durum", "Tür", "Fiyat", "İl", "İlçe", "Mahalle", "Oda", "m²", "Kat", "Kişi", "Kayıt"]);
  assert.equal(view.facts.find((fact) => fact.label === "Durum")?.value, "Potansiyel");
  assert.equal(view.facts.find((fact) => fact.label === "Tür")?.value, "Satılık");
  assert.equal(view.facts.find((fact) => fact.label === "Fiyat")?.value, "2.500.000 TRY");
  assert.equal(view.facts.find((fact) => fact.label === "Kişi")?.value, "Ayşe Yılmaz");
  assert.equal(view.facts.find((fact) => fact.label === "Kayıt")?.value, "2026-10-01 09:30");
  assert.equal(view.facts.some((fact) => fact.value.includes("gizli")), false);
  assert.equal(view.facts.some((fact) => fact.label === "Asansör"), false);
  assert.deepEqual(view.media, [
    "/api/v1/portal/media/storage/portfolios/41/cover.jpg",
    "/api/v1/portal/media/storage/portfolios/41/room.jpg",
  ]);
});

test("status and type labels fall back to the raw value", () => {
  const view = portfolioSummary({
    status: "held",
    portfolio_type: "rent",
    city: { name: "İzmir" },
    district_id: 12,
    is_draft: true,
  });
  assert.equal(view.facts.find((fact) => fact.label === "Durum")?.value, "held");
  assert.equal(view.facts.find((fact) => fact.label === "Tür")?.value, "Kiralık");
  assert.equal(view.facts.find((fact) => fact.label === "İl")?.value, "İzmir");
  assert.equal(view.facts.some((fact) => fact.label === "İlçe"), false);
  assert.equal(portfolioSummary({ status: "draft" }).facts[0]?.value, "Taslak");
  assert.equal(portfolioSummary({ status: "passive" }).facts[0]?.value, "Pasif");
  assert.equal(portfolioSummary({ status: "closed" }).facts[0]?.value, "Kapalı");
  assert.equal(portfolioSummary({ is_draft: true }).facts[0]?.value, "Taslak");
});

test("edit sends only changed fields the update validator accepts", () => {
  const current = sample.data;
  assert.deepEqual(portfolioEditChanges(current, {
    title: "Konak daire",
    description: "Deniz manzaralı.",
    price: "2500000.00",
    currency: "TRY",
  }), {});
  assert.deepEqual(portfolioEditChanges(current, {
    title: "Yeni başlık",
    description: "",
    price: "2600000",
    currency: "USD",
  }), {
    title: "Yeni başlık",
    description: null,
    price: 2600000,
    currency: "USD",
  });
  assert.deepEqual(Object.keys(portfolioEditChanges(current, {
    title: "Konak daire",
    description: "Deniz manzaralı.",
    price: "2500000",
    currency: "EUR",
  })), ["currency"]);
});
