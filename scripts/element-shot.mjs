// Screenshots a single element, for side-by-side comparison of one section with the
// reference website.
import { chromium } from "playwright";

const [url, selector, out, width = "1440", height = "900"] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);

const element = page.locator(selector).first();
await element.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await element.screenshot({ path: out });
console.log(`wrote ${out}`);

await browser.close();
