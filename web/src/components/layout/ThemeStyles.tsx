import React from "react";

import { imageSizeCss, SCALE_CSS } from "@/lib/scale";

// Image attribute sizes used by the components and the CMS content. An image whose size
// only comes from its attributes keeps the reference size unless its value is listed.
const IMAGE_WIDTHS = [
  24, 25, 85, 100, 175, 178, 192, 220, 250, 260, 300, 320, 400, 412, 413, 414, 418, 420, 500,
  530, 565, 574, 576, 600, 800, 944, 1500, 1920,
];
const IMAGE_HEIGHTS = [
  24, 69, 70, 75, 78, 85, 86, 88, 92, 100, 108, 110, 121, 137, 138, 154, 156, 169, 194, 220,
  269, 292, 300, 400, 414, 420, 478, 500, 565, 574, 629, 630, 750, 800, 944,
];
const SCALE_STYLE = SCALE_CSS + imageSizeCss(IMAGE_WIDTHS, IMAGE_HEIGHTS);

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
  [
    "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@200;300;400;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap",
    "deferred",
  ],
  ["/themes/fela/css/flaticon.css", "deferred"],
  ["/themes/fela/css/remixicon.css", "deferred"],
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
      <style dangerouslySetInnerHTML={{ __html: SCALE_STYLE }} />

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
