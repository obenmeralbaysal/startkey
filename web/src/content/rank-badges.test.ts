import assert from "node:assert/strict";
import test from "node:test";

import { rankBadgesForCard } from "./rank-badges.ts";

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
