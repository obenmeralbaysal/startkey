import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const SKIP = new Set([
  "giris",
  "kayit",
  "sepet",
  "odeme",
  "kontrol-paneli",
  "404-hata-2",
]);

function fileToPath(relative: string): string | null {
  if (!relative.endsWith(".html")) {
    return null;
  }
  const slug = relative.replace(/\.html$/, "");
  if (slug.startsWith("egitimler-term-") || slug.includes("/egitim-erisimi/")) {
    return null;
  }
  if (slug === "egitimler-page-2") {
    return "/akademi/egitimler/page/2";
  }
  if (slug === "egitimler-page-3") {
    return "/akademi/egitimler/page/3";
  }
  const top = slug.split("/")[0] ?? slug;
  if (SKIP.has(top)) {
    return null;
  }
  return `/akademi/${slug}`;
}

async function walkHtml(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await walkHtml(join(dir, entry.name), rel)));
      continue;
    }
    const path = fileToPath(rel);
    if (path) {
      out.push(path);
    }
  }
  return out;
}

export async function akademiSitemapGroups(): Promise<{
  pages: string[];
  courses: string[];
  posts: string[];
  categories: string[];
}> {
  const root = join(process.cwd(), "public/akademi/pages");
  const all = (await stat(root).then(
    (info) => (info.isDirectory() ? walkHtml(root) : []),
    () => [] as string[],
  )).sort();

  const isPost = (path: string) =>
    path.includes("egitim-modeliyle")
    || path.includes("fark-yaratin")
    || path.includes("deneyime-donusturun");
  const isCourse = (path: string) => path === "/akademi/egitimler" || path.startsWith("/akademi/egitimler/");
  const isCategory = (path: string) => path.startsWith("/akademi/category/");

  const pages = ["/akademi", ...all.filter((path) => !isCourse(path) && !isPost(path) && !isCategory(path))];
  const courses = all.filter(isCourse);
  const posts = all.filter(isPost);
  const categories = all.filter(isCategory);

  return {
    pages: Array.from(new Set(pages)),
    courses: Array.from(new Set(courses)),
    posts: Array.from(new Set(posts)),
    categories: Array.from(new Set(categories)),
  };
}
