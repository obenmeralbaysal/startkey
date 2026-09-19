import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto(`${base}/akademi/egitimler/`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2000);
const filterVisible = await page.locator("form.lp-form-course-filter").isVisible();
const categoryTitle = (await page.locator(".lp-form-course-filter__title").first().innerText()).trim();
await page.locator('input[name="term_id"][value="222"]').check({ force: true });
await page.locator("button.course-filter-submit").click();
await page.waitForTimeout(2000);
const afterFilter = page.url();

await page.goto(`${base}/akademi/egitimler/empatik-iletisim/`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2000);
await page.locator(".tab-item", { hasText: "Yorumlar" }).first().click();
await page.waitForTimeout(500);
const ratingVisible = await page.locator(".course-rate__summary-value").first().isVisible();
const rating = (await page.locator(".course-rate__summary-value").first().innerText()).trim();

console.log(JSON.stringify({ filterVisible, categoryTitle, afterFilter, ratingVisible, rating }, null, 2));
if (!filterVisible || categoryTitle !== "Kategoriler" || !afterFilter.includes("term_id=222") || !ratingVisible) {
  process.exit(1);
}
await browser.close();
