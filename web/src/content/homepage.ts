import { rewriteBrandDeep } from "@/lib/brand";
import { absoluteMedia } from "@/lib/media-path";
import type { Locale } from "@/lib/locales";
import type { HomepageContent } from "./types";

import de from "./homepage.de.json";
import en from "./homepage.en.json";
import tr from "./homepage.tr.json";

const SNAPSHOTS: Record<Locale, unknown> = { tr, en, de };

export function getHomepageContent(locale: Locale): HomepageContent {
  const content = rewriteBrandDeep(SNAPSHOTS[locale]) as HomepageContent;
  content.featured.properties = content.featured.properties.map((property) => ({
    ...property,
    image: absoluteMedia(property.image, "property"),
  }));
  content.howItWorks = {
    ...content.howItWorks,
    cards: content.howItWorks.cards.map((card) => ({
      ...card,
      image: absoluteMedia(card.image, "micrositecontent"),
    })),
  };
  content.cities = {
    ...content.cities,
    cards: content.cities.cards.map((card) => ({
      ...card,
      image: absoluteMedia(card.image, "micrositecontent"),
    })),
  };
  content.faq = { ...content.faq, image: absoluteMedia(content.faq.image, "content") };
  content.addListing = {
    ...content.addListing,
    background: absoluteMedia(content.addListing.background, "micrositecontent"),
  };

  return content;
}
