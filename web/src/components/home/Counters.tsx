import { createElement } from "react";

import type { ApiStat } from "@/lib/api";

/**
 * Counter strip matching the reference `counter-card-wrap style1`: icon on the
 * left, red number and plus beside it, label underneath, divider except the last.
 * The empty `[data-count]` span is filled by SiteBehaviors when it scrolls into view.
 */
function CounterIcon({ icon }: { icon: string }) {
  if (!icon.startsWith("/media/")) {
    return <img src={icon} alt="counter" />;
  }

  return (
    <picture>
      <source srcSet={icon.replace(/\.[^.]+$/, ".webp")} type="image/webp" />
      <img src={icon} alt="MicroSiteContent-photo" width={320} height={0} />
    </picture>
  );
}

export function Counters({ stats }: { stats: ApiStat[] }) {
  const area = (
    <div className="sk-counters relative z-[1] bg-seashell">
      <div className="container">
        <div className="sk-counter-row">
          {stats.map((stat) => (
            <div className="sk-counter" key={stat.label}>
              <span className="sk-counter-icon">
                <CounterIcon icon={stat.icon} />
              </span>
              <div className="sk-counter-text">
                <h2>
                  <span data-count={stat.value} />
                  <span className="sk-counter-plus">{stat.suffix}</span>
                </h2>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return createElement(
    "vc:cache",
    { "expires-after": "24:00:00", "vary-by-culture": "true" },
    area,
  );
}
