import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  WATERMARK_BANNER,
  WatermarkBadge,
  WatermarkBanner,
  hasWatermarkedMedia,
  isWatermarkedImage,
  portfolioMedia,
  watermarkActivationMessage,
} from "./watermark.ts";

test("the image badge is Filigranlı görsel only when the photo is watermarked", () => {
  const marked = renderToStaticMarkup(createElement(WatermarkBadge, { flagged: true }));
  assert.match(marked, /Filigranlı görsel/);
  assert.match(marked, /data-watermark="image"/);
  assert.match(marked, /sk-watermark-badge/);
  assert.doesNotMatch(marked, /glass-pill/);
  assert.equal(renderToStaticMarkup(createElement(WatermarkBadge, { flagged: false })), "");
  const list = renderToStaticMarkup(createElement(WatermarkBadge, { flagged: true, compact: true }));
  assert.match(list, /data-watermark="list"/);
  assert.match(renderToStaticMarkup(createElement(WatermarkBanner, { show: true })), /Sahibinden filigranı taşıyor/);
  assert.equal(renderToStaticMarkup(createElement(WatermarkBanner, { show: false })), "");
  assert.equal(isWatermarkedImage({ is_watermarked: true }), true);
  assert.equal(isWatermarkedImage({ is_watermarked: false }), false);
  assert.equal(isWatermarkedImage({}), false);
});

test("a portfolio list badge follows has_watermarked_media and defaults off", () => {
  assert.equal(hasWatermarkedMedia({ has_watermarked_media: true }), true);
  assert.equal(hasWatermarkedMedia({ has_watermarked_media: false }), false);
  assert.equal(hasWatermarkedMedia({ title: "Ev" }), false);
  assert.equal(hasWatermarkedMedia(null), false);
});

test("gallery items prefer media, then images", () => {
  const row = {
    images: [{ id: 1, is_watermarked: true }],
    media: [{ id: 2, thumb: "/api/v1/portal/media/storage/a.jpg", is_watermarked: true }],
  };
  assert.equal(portfolioMedia(row)[0]?.id, 2);
  assert.equal(portfolioMedia({ photos: [{ id: 3 }] })[0]?.id, 3);
  assert.deepEqual(portfolioMedia({ title: "Ev" }), []);
});

test("activation 422 watermarked_media is the office error text", () => {
  assert.equal(watermarkActivationMessage({ error: "watermarked_media" }), WATERMARK_BANNER);
  assert.equal(
    watermarkActivationMessage({ errors: { watermarked_media: ["Sahibinden filigranı var."] } }),
    "Sahibinden filigranı var.",
  );
  assert.equal(
    watermarkActivationMessage({ message: "Doğrulama hatası", errors: { watermarked_media: ["watermarked_media"] } }),
    "Doğrulama hatası",
  );
  assert.equal(watermarkActivationMessage({ message: "Başka hata" }), null);
});
