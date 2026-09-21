import { textResponse } from "@/lib/seo-xml";
import { siteOrigin } from "@/lib/site-origin";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = await siteOrigin();
  return textResponse(`User-agent: *
Disallow: /akademi/wp-content/uploads/wc-logs/
Disallow: /akademi/wp-content/uploads/woocommerce_transient_files/
Disallow: /akademi/wp-content/uploads/woocommerce_uploads/
Disallow: /*?add-to-cart=
Disallow: /*?*add-to-cart=
Disallow: /akademi/wp-admin/
Allow: /akademi/wp-admin/admin-ajax.php

Sitemap: ${origin}/akademi/sitemap_index.xml

User-agent: *
Disallow: /imunify-bot-check
`);
}
