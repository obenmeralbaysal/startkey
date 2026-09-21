"use client";

import { usePathname } from "next/navigation";

import { CorporateHttpErrorView } from "@/components/corporate/CorporateHttpError";
import { defaultLocale, isLocale, type Locale } from "@/lib/locales";

function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && isLocale(first) ? first : defaultLocale;
}

export function CorporateHttpErrorClient({ code }: { code: 404 | 500 }) {
  const pathname = usePathname();
  return <CorporateHttpErrorView locale={localeFromPath(pathname)} code={code} />;
}
