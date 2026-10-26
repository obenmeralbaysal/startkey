import type { Locale } from "@/lib/locales";

export interface ApplicationMenuItem {
  label: string;
  description: string;
}

export interface ApplicationMenuCopy {
  label: string;
  /** Short label for the phone header button. */
  shortLabel: string;
  consultant: ApplicationMenuItem;
  franchise: ApplicationMenuItem;
}

/**
 * Menu labels from the public application pages.
 * Descriptions are the reference meta descriptions on those pages.
 */
export const applicationMenu: Record<Locale, ApplicationMenuCopy> = {
  tr: {
    label: "Başvuru",
    shortLabel: "Başvur",
    consultant: {
      label: "Danışman Başvurusu",
      description: "Danışmanımız Olun",
    },
    franchise: {
      label: "Franchise Başvurusu",
      description: "Franchise Ol",
    },
  },
  en: {
    label: "Apply",
    shortLabel: "Apply",
    consultant: {
      label: "Consultant Application",
      description: "Be Our Consultant",
    },
    franchise: {
      label: "Franchise Application",
      description: "Franchise Application Form",
    },
  },
  de: {
    label: "Bewerben",
    shortLabel: "Bewerben",
    consultant: {
      label: "Berater-Bewerbung",
      description: "Sei unser Berater",
    },
    franchise: {
      label: "Franchise-Bewerbung",
      description: "Ein Franchise sein",
    },
  },
};
