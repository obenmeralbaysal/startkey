import type { Locale } from "@/lib/locales";

/**
 * Local Portal login (the former ReOS / Reonix header-footer button).
 * The login screen itself speaks tr/en/az/ru; the public site has no German
 * edition of that screen, so `de` opens the Turkish login like the reference.
 */
export function portalLoginHref(locale: Locale): string {
  return locale === "en" ? "/portal?lang=en" : "/portal";
}
