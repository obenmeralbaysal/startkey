import { headers } from "next/headers";

import { defaultLocale, isLocale, type Locale } from "@/lib/locales";

export async function requestLocale(): Promise<Locale> {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const first = pathname.split("/").filter(Boolean)[0];
  return first && isLocale(first) ? first : defaultLocale;
}
