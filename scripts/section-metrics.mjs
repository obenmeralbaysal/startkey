// Prints the position and size of every top-level page section at a given viewport, so
// layout differences against the reference website can be located section by section.
import { chromium } from "playwright";

const [url, root = "body", width = "1440", height = "900"] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
});
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);
// Scrolling to the bottom lets lazy images and AOS-animated sections settle at their
// final size before measuring.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 300) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  window.scrollTo(0, 0);
  // Lazily loaded images change the height of the sections that contain them, so the
  // measurement waits until every image has finished loading.
  await Promise.all(
    [...document.images]
      .filter((image) => !image.complete)
      .map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
      ),
  );
});
await page.waitForTimeout(2000);

const rows = await page.evaluate((root) => {
  const label = (element) => {
    const classes = (element.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean);
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${
      classes.length ? `.${classes.join(".")}` : ""
    }`;
  };

  return [...(document.querySelector(root)?.children ?? [])]
    .filter((element) => !["SCRIPT", "STYLE", "NOSCRIPT", "NEXT-ROUTE-ANNOUNCER"].includes(element.tagName))
    .map((element) => {
      const box = element.getBoundingClientRect();
      return {
        label: label(element),
        top: Math.round(box.top + window.scrollY),
        height: Math.round(box.height),
        left: Math.round(box.left),
        width: Math.round(box.width),
      };
    });
}, root);

for (const row of rows) {
  const box = `${String(row.top).padStart(6)} ${String(row.height).padStart(5)} ${String(
    row.left,
  ).padStart(5)} ${String(row.width).padStart(5)}`;
  console.log(`${box}  ${row.label}`);
}
console.log(`${"".padStart(6)}  ${String(await page.evaluate(() => document.body.scrollHeight)).padStart(6)}  TOTAL`);

await browser.close();
