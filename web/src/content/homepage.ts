import { rewriteBrandDeep } from "@/lib/brand";
import type { Locale } from "@/lib/locales";
import type { HomepageContent } from "./types";

import de from "./homepage.de.json";
import en from "./homepage.en.json";
import tr from "./homepage.tr.json";

const SNAPSHOTS: Record<Locale, unknown> = { tr, en, de };

export function getHomepageContent(locale: Locale): HomepageContent {
  return rewriteBrandDeep(SNAPSHOTS[locale]) as HomepageContent;
}
