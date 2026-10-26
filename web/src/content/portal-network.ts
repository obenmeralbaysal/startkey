import type { Locale } from "@/lib/locales";

export type PortalNetworkCopy = {
  htmlLang: string;
  title: string;
  summary: string;
  offices: string;
  consultants: string;
  officesCount: string;
  consultantsCount: string;
  portfolios: string;
  branches: string;
  updated: string;
  searchOffices: string;
  searchConsultants: string;
  officeFilter: string;
  allOffices: string;
  empty: string;
  error: string;
  retry: string;
  loading: string;
  previous: string;
  next: string;
  pagination: string;
  pageLabel: string;
  logout: string;
  roleAdmin: string;
  roleStaff: string;
  unknown: string;
};

export const PORTAL_NETWORK_COPY: Record<Locale, PortalNetworkCopy> = {
  tr: {
    htmlLang: "tr",
    title: "Ağ - StartKey",
    summary: "Ağ Özeti",
    offices: "Ofisler",
    consultants: "Danışmanlar",
    officesCount: "Ofis",
    consultantsCount: "Danışman",
    portfolios: "Aktif portföy",
    branches: "Şube",
    updated: "Güncelleme",
    searchOffices: "Ofis veya il ara",
    searchConsultants: "Danışman veya ofis ara",
    officeFilter: "Ofis",
    allOffices: "Tüm ofisler",
    empty: "Kayıt yok.",
    error: "Liste alınamadı.",
    retry: "Yeniden dene",
    loading: "Yükleniyor",
    previous: "Önceki",
    next: "Sonraki",
    pagination: "Sayfalama",
    pageLabel: "Sayfa {page} / {pages}",
    logout: "Çıkış",
    roleAdmin: "Franchise yöneticisi",
    roleStaff: "Franchise personeli",
    unknown: "Bu sayfa yok.",
  },
  en: {
    htmlLang: "en",
    title: "Network - StartKey",
    summary: "Network summary",
    offices: "Offices",
    consultants: "Consultants",
    officesCount: "Offices",
    consultantsCount: "Consultants",
    portfolios: "Active portfolios",
    branches: "Branches",
    updated: "Updated",
    searchOffices: "Search office or city",
    searchConsultants: "Search consultant or office",
    officeFilter: "Office",
    allOffices: "All offices",
    empty: "No records.",
    error: "The list could not be loaded.",
    retry: "Try again",
    loading: "Loading",
    previous: "Previous",
    next: "Next",
    pagination: "Pagination",
    pageLabel: "Page {page} / {pages}",
    logout: "Log out",
    roleAdmin: "Franchise admin",
    roleStaff: "Franchise staff",
    unknown: "This page does not exist.",
  },
  de: {
    htmlLang: "de",
    title: "Netzwerk - StartKey",
    summary: "Netzwerkübersicht",
    offices: "Büros",
    consultants: "Berater",
    officesCount: "Büros",
    consultantsCount: "Berater",
    portfolios: "Aktive Portfolios",
    branches: "Filialen",
    updated: "Aktualisiert",
    searchOffices: "Büro oder Stadt suchen",
    searchConsultants: "Berater oder Büro suchen",
    officeFilter: "Büro",
    allOffices: "Alle Büros",
    empty: "Keine Einträge.",
    error: "Die Liste konnte nicht geladen werden.",
    retry: "Erneut versuchen",
    loading: "Wird geladen",
    previous: "Zurück",
    next: "Weiter",
    pagination: "Seiten",
    pageLabel: "Seite {page} / {pages}",
    logout: "Abmelden",
    roleAdmin: "Franchise-Administrator",
    roleStaff: "Franchise-Mitarbeiter",
    unknown: "Diese Seite gibt es nicht.",
  },
};
