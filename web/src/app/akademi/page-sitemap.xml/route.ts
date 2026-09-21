import { akademiSitemapGroups } from "@/lib/akademi-sitemap";
import { todayStamp, urlsetXml, xmlResponse } from "@/lib/seo-xml";
import { siteOrigin } from "@/lib/site-origin";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = await siteOrigin();
  const { pages } = await akademiSitemapGroups();
  return xmlResponse(urlsetXml(origin, pages, todayStamp()));
}
