/**
 * Captures screenshots of a page at the project's reference viewports.
 *
 * Meant to be run inside the Playwright container, see scripts/visual-compare.sh:
 *   node screenshot.mjs <url> <output-prefix> [--wait <ms>]
 *
 * Produces <output-prefix>-<viewport>.png for every viewport plus a full page shot.
 */
import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const [url, prefix] = process.argv.slice(2);
const waitIndex = process.argv.indexOf("--wait");
const settle = waitIndex > -1 ? Number(process.argv[waitIndex + 1]) : 6000;

if (!url || !prefix) {
  console.error("usage: node screenshot.mjs <url> <output-prefix> [--wait <ms>]");
  process.exit(2);
}

const browser = await chromium.launch();

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    // The reference website's own analytics and captcha must not be contacted.
    extraHTTPHeaders: { "Accept-Language": "tr,en;q=0.9" },
  });
  const page = await context.newPage();

  await page.route("**://www.googletagmanager.com/**", (route) => route.abort());
  await page.goto(url, { waitUntil: "load", timeout: 60000 });

  // Scroll through the page so the scroll-triggered animations and lazy images run,
  // then return to the top before capturing.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(settle);

  await page.screenshot({ path: `${prefix}-${viewport.name}.png` });
  await page.screenshot({ path: `${prefix}-${viewport.name}-full.png`, fullPage: true });
  console.log(`captured ${viewport.name} (${viewport.width}x${viewport.height})`);

  await context.close();
}

await browser.close();
