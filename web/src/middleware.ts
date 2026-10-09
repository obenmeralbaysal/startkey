import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale } from "@/lib/locales";

/**
 * The reference website serves the Turkish homepage at `/` as well as at `/tr`
 * (`hreflang="x-default"` points at `/`). The request is rewritten rather than
 * redirected so that `/` keeps its URL and returns 200, as on the reference.
 *
 * Lookup endpoints keep the reference paths (`/{lang}/lookup/...` and
 * `/{lang}/Lookup/...`). They are rewritten here so the Kurumsal catch-all cannot
 * swallow them, and so both casings work without two Next.js route folders.
 */
const RESERVED_SLUGS = new Set([
  "tr",
  "en",
  "de",
  "api",
  "media",
  "themes",
  "js",
  "css",
  "lib",
  "img",
  // Reserved so /akademi is not rewritten as an office slug. The local academy
  // snapshot was removed; a new design will take this path later.
  "akademi",
  "portal",
  "locales",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
]);

function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lookup = pathname.match(/^\/(tr|en|de)\/lookup\/([^/]+)$/i);

  if (lookup) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/v1/lookups/${lookup[2]}`;
    url.searchParams.set("locale", lookup[1]);
    return NextResponse.rewrite(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.rewrite(url);
  }

  const shortOffice = pathname.match(/^\/([^/]+)$/);
  if (shortOffice && !RESERVED_SLUGS.has(shortOffice[1])) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}/${shortOffice[1]}`;
    return NextResponse.rewrite(url);
  }

  return nextWithPathname(request);
}

export const config = {
  matcher: [
    "/",
    "/(tr|en|de)/lookup/:path*",
    "/(tr|en|de)/Lookup/:path*",
    "/(tr|en|de)/:path*",
    "/:slug",
  ],
};
