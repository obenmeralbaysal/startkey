// Reports which source an <img> actually loaded and at what intrinsic size, plus the
// CSS rules that size it, to explain a rendering difference against the reference.
import { chromium } from "playwright";

const [url, selector] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);

const info = await page.evaluate((selector) => {
  const image = document.querySelector(selector);
  if (!image) {
    return `not found: ${selector}`;
  }
  const box = image.getBoundingClientRect();
  const rules = [];
  for (const sheet of document.styleSheets) {
    let cssRules;
    try {
      cssRules = sheet.cssRules;
    } catch {
      continue;
    }
    const visit = (list, media) => {
      for (const rule of list) {
        if (rule.cssRules) {
          visit(rule.cssRules, rule.conditionText ?? media);
          continue;
        }
        if (!rule.selectorText || !image.matches(rule.selectorText)) {
          continue;
        }
        const sized = ["width", "height", "max-width", "max-height", "transform", "aspect-ratio"]
          .map((property) => [property, rule.style.getPropertyValue(property)])
          .filter(([, value]) => value);
        if (sized.length) {
          rules.push(
            `${media ? `@media ${media} ` : ""}${rule.selectorText} { ${sized
              .map(([property, value]) => `${property}: ${value}`)
              .join("; ")} }`,
          );
        }
      }
    };
    visit(cssRules, "");
  }

  return [
    `currentSrc: ${image.currentSrc}`,
    `intrinsic: ${image.naturalWidth}x${image.naturalHeight}`,
    `attributes: width=${image.getAttribute("width")} height=${image.getAttribute("height")}`,
    `rendered: ${box.width.toFixed(2)}x${box.height.toFixed(2)}`,
    `rules:`,
    ...rules.map((rule) => `  ${rule}`),
  ].join("\n");
}, selector);

console.log(info);
await browser.close();
