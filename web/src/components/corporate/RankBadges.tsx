import { rankBadgeCopy, rankBadgesForCard } from "@/content/rank-badges";
import type { RankBadge } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

export function RankBadges({
  badges,
  locale,
  variant,
}: {
  badges?: RankBadge[];
  locale: Locale;
  variant: "card" | "detail";
}) {
  const rows = (badges ?? []).filter((badge) => badge.imageUrl && badge.label);
  if (rows.length === 0) {
    return null;
  }
  const labels = rankBadgeCopy(locale);
  if (variant === "card") {
    return (
      <div className="sk-rank-badges">
        {rankBadgesForCard(rows).map((badge) => (
          <img key={`${badge.category}-${badge.year}-${badge.imageUrl}`} src={badge.imageUrl} alt={badge.label} title={badge.label} width={36} height={36} />
        ))}
      </div>
    );
  }

  const years = [...new Set(rows.filter((badge) => badge.category !== "club").map((badge) => badge.year))].sort(
    (a, b) => (b ?? -1) - (a ?? -1),
  );
  const clubs = rows.filter((badge) => badge.category === "club");

  return (
    <div className="sk-rank-detail">
      {years.map((year) => {
        const inYear = rows.filter((badge) => badge.category !== "club" && badge.year === year);
        const columns = (["ciro", "islem"] as const).filter((category) => inYear.some((badge) => badge.category === category));
        if (columns.length === 0) {
          return null;
        }
        return (
          <section key={year ?? "none"}>
            {year ? <h3 className="sk-rank-year">{labels.year(year)}</h3> : null}
            <div className="sk-rank-cols">
              {columns.map((category) => (
                <div key={category}>
                  <span className="sk-rank-col-title">{labels[category]}</span>
                  <div className="sk-rank-badges">
                    {inYear
                      .filter((badge) => badge.category === category)
                      .map((badge) => (
                        <img key={badge.imageUrl} src={badge.imageUrl} alt={badge.label} title={badge.label} width={64} height={64} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {clubs.length > 0 ? (
        <section>
          <span className="sk-rank-col-title">{labels.club}</span>
          <div className="sk-rank-badges">
            {clubs.map((badge) => (
              <img key={badge.imageUrl} src={badge.imageUrl} alt={badge.label} title={badge.label} width={64} height={64} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
