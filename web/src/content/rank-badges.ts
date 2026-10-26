import type { RankBadge } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

const copy = {
  tr: { ciro: "Ciro", islem: "İşlem", club: "Kulüpler", year: (year: number) => `${year} Yılı` },
  en: { ciro: "Turnover", islem: "Transactions", club: "Clubs", year: (year: number) => `${year}` },
  de: { ciro: "Umsatz", islem: "Transaktionen", club: "Clubs", year: (year: number) => `Jahr ${year}` },
} as const;

export function rankBadgeCopy(locale: Locale) {
  return copy[locale] ?? copy.tr;
}

const categoryOrder: Record<RankBadge["category"], number> = { ciro: 0, islem: 1, club: 2 };

export function rankBadgesForCard(badges: RankBadge[]): RankBadge[] {
  return [...badges]
    .filter((badge) => badge.imageUrl && badge.label)
    .sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category] || (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 3);
}

const categoryAlias: Record<string, RankBadge["category"]> = {
  ciro: "ciro",
  islem: "islem",
  işlem: "islem",
  club: "club",
};

const sourceKeys = ["office_rank_badges", "officeRankBadges", "rankBadges", "rank_badges"] as const;

function badgeList(value: unknown): unknown[] | null {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return Array.isArray(value) ? value : null;
}

function rawRankBadges(row: Record<string, unknown>): unknown[] {
  let empty: unknown[] = [];
  for (const key of sourceKeys) {
    const list = badgeList(row[key]);
    if (!list) continue;
    if (list.length > 0) return list;
    empty = list;
  }
  return empty;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Math.trunc(Number(value));
  return null;
}

/** Fields the office card and office header render: imageUrl, label, category, year, rank. */
export function rankBadgesOf(row: object | null | undefined): RankBadge[] {
  if (!row) return [];
  const out: RankBadge[] = [];
  for (const item of rawRankBadges(row as Record<string, unknown>)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const badge = item as Record<string, unknown>;
    const category = categoryAlias[String(badge.category ?? "").trim().toLocaleLowerCase("tr")];
    const label = typeof badge.label === "string" ? badge.label.trim() : "";
    const imageUrl = String(badge.imageUrl ?? badge.image_url ?? badge.url ?? badge.src ?? "").trim();
    if (!category || !label || !imageUrl || /^(javascript|data):/i.test(imageUrl)) continue;
    out.push({
      year: numeric(badge.year),
      category,
      label,
      rank: category === "club" ? null : numeric(badge.rank),
      imageUrl,
    });
  }
  const order = { ciro: 0, islem: 1, club: 2 };
  return out.sort((a, b) => (b.year ?? -1) - (a.year ?? -1) || order[a.category] - order[b.category]);
}
