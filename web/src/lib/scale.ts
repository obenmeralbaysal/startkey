/**
 * Every CSS length of the site is multiplied by `--sk-scale` (see scripts/scale-css.py):
 * desktop and tablet render at 80% of the reference size, phones at the reference size.
 * The factor and the breakpoint are only set here.
 */
export const SCALE_CSS = ":root{--sk-scale:1}@media (min-width:768px){:root{--sk-scale:0.8}}";

/** Scales the pixel lengths of an inline style value like the stylesheet lengths. */
export function scaled(value: number | string): string {
  const css = typeof value === "number" ? `${value}px` : value;
  return css.replace(/(-?(?:\d+\.\d+|\d+|\.\d+))px\b/g, (length, number: string) =>
    Math.abs(Number(number)) <= 1 ? length : `calc(${length} * var(--sk-scale, 1))`,
  );
}

/**
 * Image `width`/`height` attributes scale like stylesheet lengths. The rules have no
 * specificity, so a size set by any stylesheet still wins, as it does over the attribute.
 */
export function imageSizeCss(widths: Iterable<number>, heights: Iterable<number>): string {
  const rules = (attribute: "width" | "height", values: Iterable<number>) =>
    [...new Set(values)]
      .filter((value) => value > 1)
      .map((value) => `:where(img[${attribute}="${value}"]){${attribute}:${scaled(value)}}`)
      .join("");
  return rules("width", widths) + rules("height", heights);
}
