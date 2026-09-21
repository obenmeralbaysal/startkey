import type { Metadata } from "next";

import { CorporateHttpErrorView } from "@/components/corporate/CorporateHttpError";
import { requestLocale } from "@/lib/request-locale";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
  robots: { index: false, follow: true },
};

export default async function LocaleNotFound() {
  const locale = await requestLocale();
  return <CorporateHttpErrorView locale={locale} code={404} />;
}
