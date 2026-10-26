import type { Locale } from "@/lib/locales";

/** Unit after the live office count on the homepage map. */
export const officeCountUnit: Record<Locale, string> = {
  tr: "ofis",
  en: "offices",
  de: "Büros",
};

/** Subtitle under the office/country heading. TR is the mockup sentence. */
export const officeMapSubtitle: Record<Locale, string> = {
  tr: "Ofise tıklayın, yakınlaşın; numaralı gruplar ofis sayısını gösterir.",
  en: "Click an office, zoom in; numbered groups show the office count.",
  de: "Büro anklicken, heranzoomen; nummerierte Gruppen zeigen die Büroanzahl.",
};

const COUNTRY_LABEL: Record<Locale, Record<string, string>> = {
  tr: { TR: "Türkiye", CY: "KKTC", GR: "Yunanistan", GB: "Birleşik Krallık", OTHER: "Diğer" },
  en: { TR: "Turkey", CY: "TRNC", GR: "Greece", GB: "United Kingdom", OTHER: "Other" },
  de: { TR: "Türkei", CY: "TRNC", GR: "Griechenland", GB: "Vereinigtes Königreich", OTHER: "Andere" },
};

export function officeMapHeading(locale: Locale, offices: number, countries: number): string {
  if (locale === "en") {
    const officeUnit = offices === 1 ? "office" : "offices";
    const countryUnit = countries === 1 ? "country" : "countries";
    return `${offices} ${officeUnit}, ${countries} ${countryUnit}`;
  }
  if (locale === "de") {
    const officeUnit = offices === 1 ? "Büro" : "Büros";
    const countryUnit = countries === 1 ? "Land" : "Länder";
    return `${offices} ${officeUnit}, ${countries} ${countryUnit}`;
  }
  return `${offices} ofis, ${countries} ülke`;
}

export function countryChipLabel(locale: Locale, code: string): string {
  return COUNTRY_LABEL[locale][code] ?? code;
}
