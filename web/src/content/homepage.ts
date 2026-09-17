import type { Locale } from "@/lib/locales";
import type { HomepageContent } from "./types";

import de from "./homepage.de.json";
import en from "./homepage.en.json";
import tr from "./homepage.tr.json";

const SNAPSHOTS: Record<Locale, unknown> = { tr, en, de };

const REFERENCE_ORIGIN = /https?:\/\/(?:www\.)?startkey\.com\.tr/g;

/**
 * Brand rewrites required by the project definition: the reference website's CRM
 * and MLS provider references become the project's own brands.
 */
const BRAND_REWRITES: [RegExp, string][] = [
  [/REOS CRM/g, "Reonix"],
  [/ReOS CRM/g, "Reonix"],
  [/ReOS/g, "Reonix"],
];

/** The reference marks its provider with a remote logo image; the project shows the provider name. */
const PROVIDER_CREDIT = /<a href="https:\/\/re-os\.com"[^>]*>\s*<img[^>]*>\s*<\/a>/g;

function rewrite(value: string): string {
  let out = value.replace(REFERENCE_ORIGIN, "");
  out = out.replace(PROVIDER_CREDIT, '<span class="service-provider">Sinap</span>');
  for (const [pattern, replacement] of BRAND_REWRITES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function rewriteDeep<T>(value: T): T {
  if (typeof value === "string") {
    return rewrite(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(rewriteDeep) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, rewriteDeep(item)]),
    ) as T;
  }
  return value;
}

export function getHomepageContent(locale: Locale): HomepageContent {
  return rewriteDeep(SNAPSHOTS[locale]) as HomepageContent;
}
