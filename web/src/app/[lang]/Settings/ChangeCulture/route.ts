import { NextResponse, type NextRequest } from "next/server";

import { fetchCorporateAlternate } from "@/lib/corporate";
import { defaultLocale, isLocale } from "@/lib/locales";

/**
 * Culture switch used by the header's language dropdown, at the same path as on the
 * reference website. Inner pages pass `returnPath` so the visitor lands on the
 * equivalent Kurumsal URL; otherwise they go to that language's homepage.
 *
 * The Location is a relative path on purpose. Next listens on 0.0.0.0 inside Docker,
 * so an absolute redirect built from `request.url` would leak that host.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("langCode");
  const locale = requested !== null && isLocale(requested) ? requested : defaultLocale;
  const returnPath = request.nextUrl.searchParams.get("returnPath") ?? `/${locale}`;

  let location = `/${locale}`;
  try {
    location = await fetchCorporateAlternate(returnPath, locale);
  } catch {
    location = `/${locale}`;
  }

  return new NextResponse(null, {
    status: 307,
    headers: { Location: location },
  });
}
