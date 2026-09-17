import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale } from "@/lib/locales";

/**
 * The reference website serves the Turkish homepage at `/` as well as at `/tr`
 * (`hreflang="x-default"` points at `/`). The request is rewritten rather than
 * redirected so that `/` keeps its URL and returns 200, as on the reference.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/",
};
