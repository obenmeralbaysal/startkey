import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/locales";

/**
 * Culture switch used by the header's language dropdown, at the same path as on the
 * reference website: it sends the visitor to the homepage of the requested language.
 *
 * The Location is a relative path on purpose. Next listens on 0.0.0.0 inside Docker,
 * so `request.url` is `http://0.0.0.0:3000/...`. An absolute redirect to that host
 * leaves the browser (which opened 127.0.0.1 or localhost) and fails. A relative
 * `/en` stays on whatever origin the visitor is already using — local or production.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("langCode");
  const locale = requested !== null && isLocale(requested) ? requested : defaultLocale;

  return new NextResponse(null, {
    status: 307,
    headers: { Location: `/${locale}` },
  });
}
