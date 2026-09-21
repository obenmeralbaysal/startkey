import type { MetadataRoute } from "next";

import paths from "@/content/seo/corporate-sitemap-paths.json";
import { siteOrigin } from "@/lib/site-origin";
import { todayStamp } from "@/lib/seo-xml";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const lastModified = todayStamp();
  return (paths as string[]).map((path) => ({
    url: `${origin}${path}`,
    lastModified,
    changeFrequency: "daily",
    priority: 1,
  }));
}
