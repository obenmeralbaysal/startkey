"use client";

import { OfficeApp } from "@/components/portal/office/OfficeApp";
import type { Locale } from "@/lib/locales";

export function OfficePageClient({ parts, lang }: { parts: string[]; lang: Locale }) {
  return <OfficeApp parts={parts} lang={lang} />;
}
