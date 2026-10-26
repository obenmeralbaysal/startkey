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
