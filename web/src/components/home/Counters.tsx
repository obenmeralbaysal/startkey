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
    <div className="relative z-[1] bg-seashell [padding-top:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] [padding-bottom:calc(75px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(25px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(45px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="flex flex-wrap">
          {stats.map((stat) => (
            <div className="flex flex-wrap items-center [width:25%] relative [margin-bottom:calc(25px_*_var(--sk-scale,_1))] after:absolute after:[top:50%] after:[right:0] after:content-[''] after:[width:1px] after:[height:calc(100px_*_var(--sk-scale,_1))] after:[background-color:rgba(0,_0,_0,_0.1)] after:[transform:translateY(-50%)] after:[transition:0.4s] after:last:hidden z-[1] text-center after:hidden max-sm:[width:50%] max-sm:[padding-left:calc(10px_*_var(--sk-scale,_1))] sm:max-md:[width:50%] sm:max-md:[padding-left:0] max-md:[padding-left:0] md:max-lg:[width:25%] md:max-lg:[padding-left:0] max-lg:after:hidden lg:max-xl:after:[right:calc(20px_*_var(--sk-scale,_1))] lg:max-xl:after:[height:calc(58px_*_var(--sk-scale,_1))] xl:max-2xl:after:[right:calc(25px_*_var(--sk-scale,_1))]" key={stat.label}>
              <span className="flex flex-wrap flex-col justify-center absolute [top:50%] text-center [width:auto] [transition:0.4s] [left:50%] [transform:translate(-50%,_-50%)] max-sm:[width:calc(40px_*_var(--sk-scale,_1))] max-sm:[height:calc(45px_*_var(--sk-scale,_1))] max-sm:[margin:0_0_calc(20px_*_var(--sk-scale,_1))] max-sm:[line-height:1] sm:max-md:[width:calc(40px_*_var(--sk-scale,_1))] max-md:[width:calc(40px_*_var(--sk-scale,_1))] md:max-lg:[width:calc(40px_*_var(--sk-scale,_1))] lg:max-xl:[width:calc(40px_*_var(--sk-scale,_1))]">
                <CounterIcon icon={stat.icon} />
              </span>
              <div className="w-full [margin-left:calc(20px_*_var(--sk-scale,_1))] [margin:0] text-center max-sm:w-full max-sm:[margin:0] sm:max-md:[width:calc(100%_-_calc(60px_*_var(--sk-scale,_1)))] md:max-lg:[width:calc(100%_-_calc(60px_*_var(--sk-scale,_1)))] lg:max-xl:[width:calc(100%_-_calc(60px_*_var(--sk-scale,_1)))]">
                <h2 className="counter-num">
                  <span className="" data-count={stat.value} />
                  <span className="[font-size:calc(54px_*_var(--sk-scale,_1))] [line-height:0.8] relative [top:calc(4px_*_var(--sk-scale,_1))] [left:0] max-sm:[font-size:calc(24px_*_var(--sk-scale,_1))] sm:max-md:[font-size:calc(28px_*_var(--sk-scale,_1))] max-md:[font-size:calc(28px_*_var(--sk-scale,_1))] max-md:[top:calc(2px_*_var(--sk-scale,_1))] md:max-lg:[font-size:calc(28px_*_var(--sk-scale,_1))] lg:max-xl:[font-size:calc(32px_*_var(--sk-scale,_1))]">{stat.suffix}</span>
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
