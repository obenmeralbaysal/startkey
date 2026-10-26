import assert from "node:assert/strict";
import test from "node:test";

import { rankBadgesForCard, rankBadgesOf } from "./rank-badges.ts";

const ciro = {
  year: 2025,
  category: "ciro" as const,
  label: "Ciro 13",
  rank: 13,
  imageUrl: "https://cdnc.re-os.com/club/office-ciro.png",
};
const islem = {
  year: 2024,
  category: "islem" as const,
  label: "İşlem Birincisi",
  rank: 1,
  imageUrl: "https://cdnc.re-os.com/club/office-islem.png",
};

test("office card badges keep ciro first and drop an empty label", () => {
  const shown = rankBadgesForCard([
    islem,
    { ...ciro, label: "", imageUrl: "https://cdnc.re-os.com/club/empty.png" },
    ciro,
  ]);
  assert.deepEqual(
    shown.map((badge) => badge.label),
    ["Ciro 13", "İşlem Birincisi"],
  );
});

test("an empty office badge list renders nothing on the card", () => {
  assert.deepEqual(rankBadgesForCard([]), []);
});

test("a consultant list item keeps rankBadges and an empty list stays empty", () => {
  const shown = rankBadgesOf({
    variant: "consultant",
    name: "Ada Yılmaz",
    rankBadges: [
      { year: 2024, category: "islem", label: "İşlem Birincisi", rank: 1, imageUrl: "https://cdnc.re-os.com/club/islem.png" },
      { year: 2025, category: "club", label: "Ticari Kulüp", rank: 4, imageUrl: "https://cdnc.re-os.com/club/club.png" },
      { year: 2025, category: "ciro", label: "Ciro Yedincisi", rank: 7, imageUrl: "https://cdnc.re-os.com/club/ciro.png" },
    ],
  });
  assert.deepEqual(
    shown.map((badge) => [badge.year, badge.category, badge.label, badge.rank, badge.imageUrl]),
    [
      [2025, "ciro", "Ciro Yedincisi", 7, "https://cdnc.re-os.com/club/ciro.png"],
      [2025, "club", "Ticari Kulüp", null, "https://cdnc.re-os.com/club/club.png"],
      [2024, "islem", "İşlem Birincisi", 1, "https://cdnc.re-os.com/club/islem.png"],
    ],
  );
  assert.deepEqual(rankBadgesOf({ variant: "consultant", name: "Cevdet Kömürcüoğlu", rankBadges: [] }), []);
});

test("office_rank_badges with image_url reach the card when rankBadges is empty", () => {
  const shown = rankBadgesOf({
    rankBadges: [],
    office_rank_badges: [
      { year: 2024, category: "islem", label: "İşlem Birincisi", rank: 1, image_url: "https://cdnc.re-os.com/club/office-islem.png" },
      { year: 2025, category: "ciro", label: "Ciro 13", rank: 13, image_url: "https://cdnc.re-os.com/club/office-ciro.png" },
      { year: 2025, category: "ciro", label: "", rank: 1, image_url: "https://cdnc.re-os.com/club/empty.png" },
    ],
  });
  assert.deepEqual(
    shown.map((badge) => [badge.label, badge.imageUrl, badge.category, badge.year, badge.rank]),
    [
      ["Ciro 13", "https://cdnc.re-os.com/club/office-ciro.png", "ciro", 2025, 13],
      ["İşlem Birincisi", "https://cdnc.re-os.com/club/office-islem.png", "islem", 2024, 1],
    ],
  );
});
