import type { Locale } from "@/lib/locales";

/**
 * 404 copy. TR sentences are from startkeyakademi.net/404-hata-2.
 * EN/DE have no reference 404 page (startkey.com.tr redirects unknown URLs home),
 * so those locales only reuse the existing Home / Startseite nav labels.
 */
export const errorPageCopy: Record<
  Locale,
  { heading: string; body: string | null; homeLabel: string; homeHref: string }
> = {
  tr: {
    heading: "Sayfa Bulunamadı",
    body: "Aradığınız sayfayı bulamadık! Sizi güvenli alana alalım.",
    homeLabel: "Anasayfa",
    homeHref: "/tr",
  },
  en: {
    heading: "404",
    body: null,
    homeLabel: "Home",
    homeHref: "/en",
  },
  de: {
    heading: "404",
    body: null,
    homeLabel: "Startseite",
    homeHref: "/de",
  },
};
