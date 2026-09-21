import type { Locale } from "@/lib/locales";

/**
 * Shared dummy year stats and Startkey social links for the Figma-inspired
 * consultant template. Every consultant sees the same values. Tracked in
 * docs/TECHNICAL_DEBT.md. EN/DE labels are straightforward equivalents; they
 * are not taken from the reference website.
 *
 * Club shows the Startkey mark as a placeholder until the real club field
 * is defined. "Seviye" is not a known Startkey field and is not shown.
 */
export const consultantDraftSocials = [
  {
    icon: "ri-facebook-fill",
    href: "https://www.facebook.com/StartkeyEmlak/",
    label: "Facebook",
  },
  {
    icon: "ri-twitter-x-fill",
    href: "https://twitter.com/startkeyemlak",
    label: "X",
  },
  {
    icon: "ri-instagram-line",
    href: "https://www.instagram.com/startkeyturkiye/",
    label: "Instagram",
  },
] as const;

export const consultantDraftClubLogo = {
  src: "/media/officelogo/12eb7cb9-f028-4e57-9b14-f99fc92c2045.png",
  alt: "Startkey",
};

export const consultantDraftCopy: Record<
  Locale,
  {
    yearHeading: string;
    ciro: { label: string; value: string; compactValue: string };
    islem: { label: string; value: string };
    kulup: { label: string };
  }
> = {
  tr: {
    yearHeading: "2025 Yılı:",
    ciro: { label: "Ciro (TL)", value: "186.400.000", compactValue: "186,4 Mn" },
    islem: { label: "İşlem", value: "64" },
    kulup: { label: "Kulüp" },
  },
  en: {
    yearHeading: "2025:",
    ciro: { label: "Turnover (TL)", value: "186.400.000", compactValue: "186.4 Mn" },
    islem: { label: "Transactions", value: "64" },
    kulup: { label: "Club" },
  },
  de: {
    yearHeading: "2025:",
    ciro: { label: "Umsatz (TL)", value: "186.400.000", compactValue: "186,4 Mio." },
    islem: { label: "Vorgänge", value: "64" },
    kulup: { label: "Club" },
  },
};
