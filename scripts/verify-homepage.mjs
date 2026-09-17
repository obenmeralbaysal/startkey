/**
 * Exercises the local homepage the way a visitor would: open each language,
 * switch language, change search tabs, open a FAQ item and submit an invalid
 * newsletter form. Meant to run inside the Playwright container.
 *
 *   node scripts/verify-homepage.mjs http://localhost:3000
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
    console.error(`FAIL  ${message}`);
  } else {
    console.log(`ok    ${message}`);
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.route("**://www.googletagmanager.com/**", (route) => route.abort());
await page.route("**://www.google.com/recaptcha/**", (route) => route.abort());

async function open(path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  return response;
}

const home = await open("/");
assert(home?.ok(), `GET / returns ${home?.status()}`);
assert((await page.title()).includes("Startkey Türkiye"), "Turkish title on /");
assert(await page.locator("section.hero-wrap").count(), "hero is present");
assert(await page.locator("header.header-wrap").count(), "header is present");
assert(await page.locator("footer.footer-wrap").count(), "footer is present");
assert(await page.locator("section.newsletter-wrap").count(), "newsletter is present");
assert(!(await page.content()).includes("ReOS"), "ReOS brand is rewritten");
assert((await page.content()).includes("Reonix"), "Reonix brand is shown");
assert((await page.content()).includes("Sinap"), "Sinap credit is shown");

const en = await open("/en");
assert(en?.ok(), `GET /en returns ${en?.status()}`);
assert((await page.title()).includes("Home"), "English title on /en");

const de = await open("/de");
assert(de?.ok(), `GET /de returns ${de?.status()}`);
assert((await page.title()).includes("Startseite"), "German title on /de");

await open("/tr");
await page.locator("#languageMenuDesktop").click();
await page
  .locator(".dropdown-menu a[href='/en'], .dropdown-menu a[href*='langCode=en']")
  .first()
  .click({ force: true });
await page.waitForURL(/\/en\/?$/, { timeout: 15000 });
assert(/\/en\/?$/.test(new URL(page.url()).pathname), "language switcher reaches /en");

await open("/tr");
await page.locator('button[data-bs-target="#tab_2"]').click();
await page.waitForTimeout(400);
assert(
  await page.locator("#tab_2").evaluate((el) => el.classList.contains("active") || el.classList.contains("show")),
  "offices tab becomes visible",
);

const faqButtons = page.locator("#accordionExample button[data-bs-toggle='collapse']");
const faqCount = await faqButtons.count();
assert(faqCount >= 5, `FAQ has ${faqCount} items`);
if (faqCount > 1) {
  await faqButtons.nth(1).click();
  await page.waitForTimeout(400);
  const expanded = await faqButtons.nth(1).getAttribute("aria-expanded");
  assert(expanded === "true", "second FAQ item expands");
}

await page.locator("#form").evaluate((form) => form.scrollIntoView());
await page.locator("#FirstName").fill("Ayşe");
await page.locator("#LastName").fill("Yılmaz");
await page.locator("#Email").fill("user@example.com");
await page.locator("#form button[type='submit']").click();
await page.waitForTimeout(1500);
const captchaNode = page.locator("#captchaError");
const captchaError =
  (await captchaNode.count()) > 0 ? ((await captchaNode.textContent())?.trim() ?? "") : "";
const newsletterStatus = await page.locator(".newsletter-wrap [role='status']").count();
const fieldError = await page.locator("#form .text-danger").evaluateAll((nodes) =>
  nodes.some((node) => (node.textContent ?? "").trim().length > 0),
);
assert(
  captchaError.length > 0 || newsletterStatus > 0 || fieldError,
  "newsletter submit shows a captcha, field or status message",
);

await page.setViewportSize({ width: 390, height: 844 });
await open("/tr");
assert(await page.locator(".mobile-menu").isVisible(), "mobile menu is visible on a phone viewport");

await browser.close();

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}

console.log("\nall homepage checks passed");
