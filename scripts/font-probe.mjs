// Lists the web fonts a page actually loaded, and measures a sample string, so font
// differences against the reference website become visible.
import { chromium } from "playwright";

const [url, sample = "Bültene Kayıt Ol"] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);

const report = await page.evaluate(async (sample) => {
  await document.fonts.ready;
  const faces = [...document.fonts]
    .map((face) => `${face.family} ${face.style} ${face.weight} ${face.status}`)
    .sort();

  const canvas = document.createElement("canvas").getContext("2d");
  const measurements = ['16px "Nunito Sans"', '17px "Nunito Sans"', '16px Poppins'].map(
    (font) => {
      canvas.font = font;
      return `${font}: ${canvas.measureText(sample).width.toFixed(2)}px`;
    },
  );

  return [`faces (${faces.length}):`, ...faces.map((face) => `  ${face}`), ...measurements].join(
    "\n",
  );
}, sample);

console.log(report);
await browser.close();
