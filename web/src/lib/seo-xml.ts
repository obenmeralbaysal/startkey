export function urlsetXml(origin: string, paths: string[], lastmod: string): string {
  const urls = paths
    .map((path) => {
      const loc = `${origin}${path.startsWith("/") ? path : `/${path}`}`;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls ? `\n${urls}\n` : ""}</urlset>
`;
}

export function sitemapIndexXml(origin: string, files: { path: string; lastmod: string }[]): string {
  const items = files
    .map(
      (file) => `	<sitemap>
		<loc>${escapeXml(`${origin}${file.path}`)}</loc>
		<lastmod>${file.lastmod}</lastmod>
	</sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });
}

export function textResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export function absolutizeLlms(origin: string, body: string): string {
  return body.replace(/\]\((\/[^)]+)\)/g, `](${origin}$1)`);
}
