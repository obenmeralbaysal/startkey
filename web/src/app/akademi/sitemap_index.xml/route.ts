import { sitemapIndexXml, todayStamp, xmlResponse } from "@/lib/seo-xml";
import { siteOrigin } from "@/lib/site-origin";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = await siteOrigin();
  const lastmod = `${todayStamp()}T00:00:00+00:00`;
  return xmlResponse(
    sitemapIndexXml(origin, [
      { path: "/akademi/post-sitemap.xml", lastmod },
      { path: "/akademi/page-sitemap.xml", lastmod },
      { path: "/akademi/lp_course-sitemap.xml", lastmod },
      { path: "/akademi/category-sitemap.xml", lastmod },
    ]),
  );
}
