"use client";

import { OfficeApp } from "@/components/portal/office/OfficeApp";
import type { Locale } from "@/lib/locales";

export function OfficePageClient({ parts, lang, tab = "" }: { parts: string[]; lang: Locale; tab?: string }) {
  return <OfficeApp parts={parts} lang={lang} tab={tab} />;
}
