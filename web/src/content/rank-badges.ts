import type { Locale } from "@/lib/locales";
import type { RankBadge } from "@/lib/corporate";

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
