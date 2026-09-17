// Measures the rendered text of an element, its child boxes and its pseudo-elements,
// to explain a width difference against the reference website.
import { chromium } from "playwright";

const [url, selector] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);

const report = await page.evaluate((selector) => {
  const element = document.querySelector(selector);
  const lines = [`box: ${element.getBoundingClientRect().width.toFixed(2)}`];

  for (const node of element.childNodes) {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].map((rect) => rect.width.toFixed(2)).join(", ");
    lines.push(
      `child ${node.nodeName} ${JSON.stringify(node.textContent?.slice(0, 40))} rects: [${rects}]`,
    );
  }

  for (const pseudo of ["::before", "::after"]) {
    const style = getComputedStyle(element, pseudo);
    lines.push(
      `${pseudo}: content=${style.content} width=${style.width} padding=${style.paddingLeft}/${style.paddingRight} margin=${style.marginLeft}/${style.marginRight}`,
    );
  }

  const own = getComputedStyle(element);
  lines.push(
    `own: font=${own.font} text-indent=${own.textIndent} word-spacing=${own.wordSpacing} text-transform=${own.textTransform}`,
  );
  return lines.join("\n");
}, selector);

console.log(report);
await browser.close();
