import { createElement } from "react";

import type { ApiStat } from "@/lib/api";

/**
 * Counter strip. The `odometer` span is filled in by the theme runtime once the
 * element scrolls into view, matching the reference website's animation.
 *
 * Theme icons are plain images while CRM-supplied icons come from the media library
 * and are served as a `<picture>` with a WebP source, as on the reference website.
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
    <div className="counter-area  bg-seashell pt-100 pb-75">
      <div className="container">
        <div className="counter-card-wrap style1">
          {stats.map((stat) => (
            <div className="counter-card" key={stat.label}>
              <span className="counter-icon">
                <CounterIcon icon={stat.icon} />
              </span>
              <div className="counter-text">
                <h2 className="counter-num">
                  <span className="odometer" data-count={stat.value} />
                  <span className="target">{stat.suffix}</span>
                </h2>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // The reference website ships this section wrapped in an unprocessed `<vc:cache>`
  // tag helper. The browser keeps it as an unknown inline element, which adds 5px to
  // the section's height, so it is reproduced here. JSX cannot express a tag name
  // containing a colon, hence `createElement`.
  return createElement(
    "vc:cache",
    { "expires-after": "24:00:00", "vary-by-culture": "true" },
    area,
  );
}
