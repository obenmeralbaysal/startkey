import type { Locale } from "@/lib/locales";

export interface ApplicationMenuItem {
  label: string;
  description: string;
}

export interface ApplicationMenuCopy {
  label: string;
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
    consultant: {
      label: "Danışman",
      description: "Danışmanımız Olun",
    },
    franchise: {
      label: "Franchise",
      description: "Franchise Ol",
    },
  },
  en: {
    label: "Application",
    consultant: {
      label: "Consultant",
      description: "Be Our Consultant",
    },
    franchise: {
      label: "Franchise",
      description: "Franchise Application Form",
    },
  },
  de: {
    label: "Bewerbung",
    consultant: {
      label: "Berater",
      description: "Sei unser Berater",
    },
    franchise: {
      label: "Franchise",
      description: "Ein Franchise sein",
    },
  },
};
