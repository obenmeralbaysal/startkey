import assert from "node:assert/strict";
import test from "node:test";

import {
  gallerySlots,
  isPlaceholderPhoto,
  lightboxCounter,
  listingPhotoSources,
  morePhotosText,
  photoPlaceholder,
  showListingConsultant,
  wrapIndex,
} from "./listing-gallery.ts";

test("thumbnail slots stay full and the last one carries the remainder", () => {
  assert.deepEqual(gallerySlots(0), { mainIndex: null, thumbs: [] });
  assert.deepEqual(gallerySlots(1), { mainIndex: 0, thumbs: [] });
  assert.deepEqual(gallerySlots(4).thumbs.map((slot) => slot.index), [1, 2, 3]);
  assert.equal(gallerySlots(4).thumbs.some((slot) => slot.kind === "more"), false);

  const five = gallerySlots(5);
  assert.equal(five.thumbs.length, 4);
  assert.deepEqual(five.thumbs[3], { kind: "more", index: 4, remaining: 1 });
  assert.equal(morePhotosText("tr", five.thumbs[3].remaining), "+1 fotoğraf");

  const twelve = gallerySlots(12);
  assert.deepEqual(twelve.thumbs[3], { kind: "more", index: 4, remaining: 8 });
  assert.equal(morePhotosText("en", 8), "+8 photos");
  assert.equal(morePhotosText("de", 8), "+8 Fotos");
});

test("lightbox index wraps at both ends", () => {
  assert.equal(wrapIndex(0, 12, -1), 11);
  assert.equal(wrapIndex(11, 12, 1), 0);
  assert.equal(wrapIndex(2, 12, 1), 3);
  assert.equal(lightboxCounter(2, 12), "3 / 12");
  assert.equal(lightboxCounter(11, 12), "12 / 12");
  assert.equal(wrapIndex(0, 0, 1), 0);
});

test("missing, blank, and catalogue-mark sources are placeholders", () => {
  assert.equal(isPlaceholderPhoto(""), true);
  assert.equal(isPlaceholderPhoto("   "), true);
  assert.equal(isPlaceholderPhoto(null), true);
  assert.equal(isPlaceholderPhoto("/img/catalogue-mark.svg"), true);
  assert.equal(isPlaceholderPhoto("/api/v1/catalogue/media/portfolios/4/0"), false);
  assert.deepEqual(
    listingPhotoSources(["", "/img/catalogue-mark.svg", "/media/property/a.jpg", "/media/property/a.jpg"]),
    ["/media/property/a.jpg"],
  );
  assert.equal(photoPlaceholder("tr"), "Fotoğraf hazırlanıyor");
  assert.equal(photoPlaceholder("en"), "Photos coming soon");
  assert.equal(photoPlaceholder("de"), "Fotos folgen in Kürze");
  assert.equal(showListingConsultant({ name: "Ada", approved: false }), false);
  assert.equal(showListingConsultant({ name: "Ada" }), true);
  assert.equal(showListingConsultant({ name: "  " }), false);
});
