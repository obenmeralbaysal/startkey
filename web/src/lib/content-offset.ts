/**
 * Wrapper of the inner pages.
 *
 * The reference header is fixed and `.content-wrapper` starts 63px (below 992px), 83px
 * (992–1199px) or 85px (1200px and up) below its top. The local header is sticky and
 * 78px / 111px tall, so inner pages move up by the difference.
 *
 * The reference body line-height is Bootstrap's 1.5 (the theme sets 1.8 on `p` only).
 * `sk-inner` carries the reference phone text size (see subpages.css).
 */
export const CONTENT_OFFSET =
  "sk-inner leading-[1.5] mt-[calc(-15px*var(--sk-scale,1))] lg:mt-[calc(-28px*var(--sk-scale,1))] xl:mt-[calc(-26px*var(--sk-scale,1))]";
