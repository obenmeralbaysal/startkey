import type { NavItem } from "@/content/types";
import type { Locale } from "@/lib/locales";

/**
 * Desktop order from the header mockup. Items that are not in that list
 * (home, contact, and the rest of the corporate menu) stay under Kurumsal.
 * News, announcements and blog move under Medya. Office and consultant
 * links leave the old Startkey dropdown and become their own items.
 */
const MEDIA = /\/(haberler|news|nachricht|duyurular|announcements|ankundigungen|bloglar|blogs)(\/|$)/i;
const OFFICE = /\/(ofisler|offices|anbieteren)(\/|$)/i;
const AGENT = /\/(danismanlar|agents|immobilienmakleren)(\/|$)/i;
const PORTFOLIO = /\/(portfoy|property|immobilien)(\/|$)/i;
const CONTACT = /\/(iletisim|contact|kontakt)(\/|$)/i;
const HOME = /^\/(tr|en|de)\/?$/i;
const ACADEMY = /startkeyakademi|\/egitimlerimiz|\/our-educations/i;

const MEDIA_LABEL: Record<Locale, string> = {
  tr: "Medya",
  en: "Media",
  de: "Medien",
};

const GROUP_FALLBACK: Record<Locale, [string, string, string, string]> = {
  tr: ["Kurumsal", "Portföyler", "Ofisler", "Danışmanlar"],
  en: ["Corporate", "Portfolios", "Offices", "Consultants"],
  de: ["Unternehmen", "Portfolios", "Büros", "Berater"],
};

function copyItem(item: NavItem, label = item.label, children: NavItem[] | undefined = item.children): NavItem {
  return {
    label,
    href: item.href,
    target: item.target ?? null,
    children: (children ?? []).map((child) => copyItem(child)),
  };
}

function kids(item: NavItem): NavItem[] {
  return item.children ?? [];
}

function isAcademy(item: NavItem): boolean {
  return kids(item).some((child) => ACADEMY.test(child.href));
}

/** Direct links first, then the accordions. Matches the mobile-menu mockup. */
export function drawerHeaderNav(desktop: readonly NavItem[]): NavItem[] {
  return [...desktop.filter((item) => kids(item).length === 0), ...desktop.filter((item) => kids(item).length > 0)];
}

export function buildHeaderNav(locale: Locale, nav: readonly NavItem[], tabs: readonly string[] = []): NavItem[] {
  const fallback = GROUP_FALLBACK[locale];
  const labels = {
    corporate: fallback[0],
    portfolios: tabs[0] || fallback[1],
    offices: tabs[1] || fallback[2],
    consultants: tabs[2] || fallback[3],
    media: MEDIA_LABEL[locale],
  };
  const corporateChildren: NavItem[] = [];
  const mediaChildren: NavItem[] = [];
  let corporateLabel = labels.corporate;
  let portfolios: NavItem | null = null;
  let consultants: NavItem | null = null;
  let offices: NavItem | null = null;
  let academy: NavItem | null = null;

  const place = (item: NavItem): boolean => {
    if (MEDIA.test(item.href)) {
      mediaChildren.push(copyItem(item));
      return true;
    }
    if (AGENT.test(item.href)) {
      consultants = copyItem(item, labels.consultants, []);
      return true;
    }
    if (OFFICE.test(item.href)) {
      offices = copyItem(item, labels.offices, []);
      return true;
    }
    if (PORTFOLIO.test(item.href) && !AGENT.test(item.href)) {
      portfolios = copyItem(item, labels.portfolios, []);
      return true;
    }
    return false;
  };

  for (const item of nav) {
    if (kids(item).length > 0) {
      if (isAcademy(item)) {
        academy = copyItem(item);
        continue;
      }
      const rest: NavItem[] = [];
      for (const child of kids(item)) {
        if (!place(child)) rest.push(copyItem(child));
      }
      if (rest.length > 0) {
        corporateLabel = item.label;
        corporateChildren.push(...rest);
      }
      continue;
    }
    if (HOME.test(item.href) || CONTACT.test(item.href)) {
      corporateChildren.push(copyItem(item));
      continue;
    }
    if (!place(item)) corporateChildren.push(copyItem(item));
  }

  const desktop: NavItem[] = [];
  if (corporateChildren.length > 0) {
    desktop.push({ label: corporateLabel, href: "#", target: null, children: corporateChildren });
  }
  if (portfolios) desktop.push(portfolios);
  if (consultants) desktop.push(consultants);
  if (offices) desktop.push(offices);
  if (academy) desktop.push(academy);
  if (mediaChildren.length > 0) {
    desktop.push({ label: labels.media, href: "#", target: null, children: mediaChildren });
  }
  return desktop;
}
