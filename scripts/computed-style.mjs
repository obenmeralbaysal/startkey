// Prints the computed style of an element, limited to the given properties, so a
// styling difference against the reference website can be pinpointed.
import { chromium } from "playwright";

const [url, selector, properties] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);

const values = await page.evaluate(
  ([selector, properties]) => {
    const element = document.querySelector(selector);
    if (!element) {
      return `not found: ${selector}`;
    }
    const computed = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    const lines = properties
      .split(",")
      .map((property) => `${property.trim()}: ${computed.getPropertyValue(property.trim())}`);
    lines.push(`box: ${Math.round(box.width)}x${Math.round(box.height)}`);
    lines.push(`text: ${JSON.stringify(element.textContent?.slice(0, 80))}`);
    lines.push(`html: ${element.innerHTML.slice(0, 240)}`);
    return lines.join("\n");
  },
  [selector, properties],
);

console.log(values);
await browser.close();
