import React from "react";

import { criticalCss } from "@/content/critical-css";

/**
 * The reference website's stylesheets, in its order and with its loading strategy:
 * some are render blocking while the rest are fetched without blocking the first paint
 * and applied as soon as they arrive. Keeping the strategy matters because it decides
 * what is painted before the icon fonts, carousels and animations are styled.
 *
 * The reference defers with two techniques, `rel="preload"` plus a `<noscript>`
 * fallback and `media="print"`. Only the second is used here: React hoists preload
 * links to the top of the head, which would change the cascade order of the theme
 * stylesheets. `deferred` therefore marks the reference's `media="print"` links and
 * `deferred-noscript` the ones it preloads with a `<noscript>` fallback; both are
 * non-blocking and keep their position in the document.
 */
type Strategy = "blocking" | "deferred-noscript" | "deferred";

const STYLESHEETS: [href: string, strategy: Strategy][] = [
  // The reference loads Roboto from Google Fonts with the preload strategy; the font
  // and its stylesheet are served locally here.
  ["/themes/fela/css/roboto.css", "deferred-noscript"],
  ["/themes/fela/css/bootstrap.min.css", "deferred-noscript"],
  ["/themes/fela/css/style.css", "blocking"],
  ["/themes/fela/css/app.css", "blocking"],
  ["/themes/fela/css/responsive.css", "blocking"],
  ["/themes/fela/css/flaticon.css", "deferred"],
  ["/themes/fela/css/remixicon.css", "deferred"],
  ["/themes/fela/css/owl.carousel.min.css", "deferred-noscript"],
  ["/themes/fela/css/jquery-ui-min.css", "blocking"],
  ["/themes/fela/css/odometer.min.css", "deferred"],
  ["/themes/fela/css/aos.css", "deferred"],
  ["/lib/bootstrap-datepicker/css/bootstrap-datepicker3.min.css", "deferred"],
  ["/lib/intl-tel-input/css/intltelinput.css", "deferred"],
  ["/lib/select2/css/select2.min.css", "deferred-noscript"],
  ["/lib/fancybox-4/fancybox.css", "deferred"],
  ["/css/themeless-app.css", "deferred"],
];

/**
 * Does what the reference website's inline `onload` handlers do. React cannot render
 * those attributes, so the same promotion is applied from a single inline script; the
 * `load` event is paired with a `window.load` fallback for stylesheets that finish
 * before this script runs.
 *
 * The script promotes the links before hydration, so the deferred links carry
 * `suppressHydrationWarning`: without it the promoted `media` would count as a
 * hydration mismatch and React would discard and re-render the whole tree.
 */
const PROMOTE_DEFERRED_STYLES = `
(function () {
  var promote = function (link) {
    if (link.media === 'print') { link.media = 'all'; }
  };
  var links = document.querySelectorAll('link[data-deferred]');
  for (var i = 0; i < links.length; i++) {
    (function (link) {
      link.addEventListener('load', function () { promote(link); });
    })(links[i]);
  }
  window.addEventListener('load', function () {
    var deferred = document.querySelectorAll('link[data-deferred]');
    for (var i = 0; i < deferred.length; i++) { promote(deferred[i]); }
  });
})();
`;

export function ThemeStyles() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: criticalCss }} />

      {STYLESHEETS.map(([href, strategy]) => {
        if (strategy === "blocking") {
          return <link key={href} rel="stylesheet" href={href} />;
        }

        if (strategy === "deferred-noscript") {
          return (
            <React.Fragment key={href}>
              <link
                rel="stylesheet"
                href={href}
                media="print"
                data-deferred=""
                suppressHydrationWarning
              />
              <noscript>
                <link rel="stylesheet" href={href} />
              </noscript>
            </React.Fragment>
          );
        }

        return (
          <link
            key={href}
            rel="stylesheet"
            href={href}
            media="print"
            data-deferred=""
            suppressHydrationWarning
          />
        );
      })}

      <script dangerouslySetInnerHTML={{ __html: PROMOTE_DEFERRED_STYLES }} />
    </>
  );
}
