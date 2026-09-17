/**
 * Exercises the Kurumsal templates the way a visitor would: list pages, a detail,
 * management cards, champions, language switch from an inner page.
 *
 *   node scripts/verify-corporate.mjs http://localhost:3000
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

const about = await open("/tr/sayfa/hakkimizda");
assert(about?.ok(), `GET /tr/sayfa/hakkimizda returns ${about?.status()}`);
assert(await page.locator("h2", { hasText: "Hakkımızda" }).count(), "about breadcrumb heading");
assert(await page.locator(".about-wrap").count(), "about-wrap template");
assert(await page.locator(".content-wrapper").count(), "inner pages use content-wrapper under the header");
assert(!(await page.content()).includes("ReOS"), "ReOS is rewritten on about");
const headerBg = await page.locator("header.header-wrap").evaluate((el) => {
  const style = getComputedStyle(el);
  return { bg: style.backgroundColor, top: el.getBoundingClientRect().top };
});
assert(headerBg.top < 80, `header sits at the top of the viewport (top=${headerBg.top})`);

const news = await open("/tr/haberler");
assert(news?.ok(), `GET /tr/haberler returns ${news?.status()}`);
const newsCards = await page.locator(".blog-card.style1").count();
assert(newsCards === 9, `news page 1 has 9 cards (got ${newsCards})`);

const firstNews = page.locator(".blog-card.style1 a").first();
const firstHref = await firstNews.getAttribute("href");
assert(firstHref && firstHref.includes("/tr/haberler/"), `news card href is a detail (${firstHref})`);
await page.goto(`${base}${firstHref}`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(1500);
assert(await page.locator(".blog-details-wrap").count(), "news detail uses blog-details-wrap");
assert(await page.locator(".post-para").count(), "news detail has body");

const announcements = await open("/tr/duyurular");
assert(announcements?.ok(), `GET /tr/duyurular returns ${announcements?.status()}`);
const firstAnnouncement = await page.locator(".blog-card.style1 h3 a").first().getAttribute("href");
assert(
  firstAnnouncement && firstAnnouncement.includes("/1523/"),
  `announcement page 1 starts with 1523 (got ${firstAnnouncement})`,
);

const lastAnnouncementsPage = await open("/tr/duyurular?pageIndex=9");
assert(lastAnnouncementsPage?.ok(), `GET /tr/duyurular?pageIndex=9 returns ${lastAnnouncementsPage?.status()}`);
const lastAnnouncementHrefs = await page.locator(".blog-card.style1 h3 a").evaluateAll((nodes) =>
  nodes.map((node) => node.getAttribute("href") || ""),
);
assert(
  lastAnnouncementHrefs.some((href) => href.includes("/1268/")),
  `announcement last page includes Melis 1268 (got ${lastAnnouncementHrefs.join(", ")})`,
);

const blogs = await open("/tr/bloglar");
assert(blogs?.ok(), `GET /tr/bloglar returns ${blogs?.status()}`);
assert(await page.locator(".sidebar").count(), "blog list has sidebar");
const blogCards = await page.locator(".blog-card.style1").count();
assert(blogCards === 10, `blog page 1 has 10 cards (got ${blogCards})`);
const firstBlog = await page.locator(".blog-card.style1 h3 a").first().getAttribute("href");
assert(
  firstBlog && firstBlog.includes("/1245/"),
  `blog page 1 starts with 38. Sayı / 1245 (got ${firstBlog})`,
);

const people = await open("/tr/yonetim-kadrosu");
assert(people?.ok(), `GET /tr/yonetim-kadrosu returns ${people?.status()}`);
const peopleCards = await page.locator(".agent-card.style1").count();
assert(peopleCards === 13, `management has 13 cards (got ${peopleCards})`);

const champions = await open("/tr/sampiyonlar");
assert(champions?.ok(), `GET /tr/sampiyonlar returns ${champions?.status()}`);
assert(await page.locator(".photo").count(), "champions photos render");
assert(await page.locator("h3", { hasText: "Şampiyonları" }).count(), "champion group titles render");
const championKickers = await page.locator(".section-title.style2 span").allTextContents();
assert(
  championKickers.some((text) => text.includes("Startkey Türkiye")),
  `champions render Startkey Türkiye kicker (got ${championKickers.join(" | ")})`,
);

await open("/tr/haberler");
await page.locator("#languageMenuDesktop").click();
await page
  .locator(".dropdown-menu a[href*='langCode=en']")
  .first()
  .click({ force: true });
await page.waitForURL(/\/en\/(news|haberler)/, { timeout: 15000 });
assert(/\/en\/(news|haberler)/.test(new URL(page.url()).pathname), "language switch from news stays on news");

const englishNews = await page.locator(".blog-card.style1").count();
assert(englishNews === 9, `english news page 1 has 9 cards (got ${englishNews})`);

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}

console.log("\ncorporate checks passed");
