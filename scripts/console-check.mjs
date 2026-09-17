// Loads a page and reports console output plus failed requests, so runtime problems in
// the reproduced front-end runtime can be diagnosed without a browser on the host.
import { chromium } from "playwright";

const url = process.argv[2];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", (message) => console.log(`[${message.type()}] ${message.text()}`));
page.on("pageerror", (error) => console.log(`[pageerror] ${error.message}`));
page.on("requestfailed", (request) =>
  console.log(`[failed] ${request.url()} :: ${request.failure()?.errorText}`),
);
page.on("response", (response) => {
  if (response.status() >= 400) {
    console.log(`[http ${response.status()}] ${response.url()}`);
  }
});

await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);

const state = await page.evaluate(() => ({
  jquery: typeof window.jQuery,
  select2: typeof window.jQuery?.fn?.select2,
  owl: typeof window.jQuery?.fn?.owlCarousel,
  aos: typeof window.AOS,
  odometer: typeof window.Odometer,
  fancybox: typeof window.Fancybox,
  select2Rendered: document.querySelectorAll(".select2-container").length,
  owlInitialised: document.querySelectorAll(".owl-carousel.owl-loaded").length,
  aosAnimated: document.querySelectorAll("[data-aos].aos-init").length,
  bodyHeight: document.body.scrollHeight,
}));
console.log("runtime:", JSON.stringify(state, null, 2));

await browser.close();
