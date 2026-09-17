// Prints the parsed DOM subtree of a selector, so the reference website's real
// structure can be compared with the reproduction's.
import { chromium } from "playwright";

const [url, selector, depth = "4"] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(2500);

const tree = await page.evaluate(
  ([selector, maxDepth]) => {
    const describe = (element) =>
      `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${
        element.className && typeof element.className === "string"
          ? `.${element.className.trim().split(/\s+/).join(".")}`
          : ""
      }`;

    const walk = (element, depth) => {
      const line = `${"  ".repeat(depth)}${describe(element)}`;
      if (depth >= Number(maxDepth)) {
        return [line];
      }
      return [line, ...[...element.children].flatMap((child) => walk(child, depth + 1))];
    };

    const root = document.querySelector(selector);
    return root ? walk(root, 0).join("\n") : `not found: ${selector}`;
  },
  [selector, depth],
);

console.log(tree);
await browser.close();
