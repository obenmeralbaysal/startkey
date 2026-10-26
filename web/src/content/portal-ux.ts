import type { Locale } from "../lib/locales.ts";

export type PortalUxCopy = {
  summary: string;
  portfolios: string;
  portfolioShort: string;
  contacts: string;
  demands: string;
  matches: string;
  calendar: string;
  reports: string;
  reportsAndEarnings: string;
  performance: string;
  earnings: string;
  collaborations: string;
  lease: string;
  officeSettings: string;
  team: string;
  branches: string;
  notifications: string;
  settings: string;
  manage: string;
  more: string;
  menu: string;
  close: string;
  logout: string;
  office: string;
  searchLabel: string;
  searchPlaceholder: string;
  denied: string;
  greeting: { morning: string; afternoon: string; evening: string };
  officeOf: string;
  roles: { owner: string; manager: string; office_manager: string; agent: string };
  newPortfolio: string;
  newPortfolioHint: string;
  newContact: string;
  newContactHint: string;
  newDemand: string;
  newDemandHint: string;
  appointment: string;
  appointmentHint: string;
  activePortfolios: string;
  pending: string;
  newMatches: string;
  monthEarnings: string;
  review: string;
  last7: string;
  closings: string;
  thisMonth: string;
  pendingTitle: string;
  noPending: string;
  todayTitle: string;
  noAppointments: string;
  notificationsTitle: string;
  noNotifications: string;
  allNotifications: string;
  branchesEmpty: string;
  addBroker: string;
  addAgent: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  add: string;
  saved: string;
  savedError: string;
};

export const PORTAL_UX_COPY: Record<Locale, PortalUxCopy> = {
  tr: {
    summary: "Özet",
    portfolios: "Portföyler",
    portfolioShort: "Portföy",
    contacts: "Kişiler",
    demands: "Talepler",
    matches: "Eşleşmeler",
    calendar: "Takvim",
    reports: "Raporlar",
    reportsAndEarnings: "Raporlar & Hakediş",
    performance: "Performansım",
    earnings: "Hakediş",
    collaborations: "İşbirlikleri",
    lease: "Kira radarı",
    officeSettings: "Ofis ayarları",
    team: "Ekip",
    branches: "Şubeler",
    notifications: "Bildirim tercihleri",
    settings: "Ayarlar",
    manage: "YÖNETİM",
    more: "Diğer",
    menu: "Menüyü aç",
    close: "Kapat",
    logout: "Çıkış",
    office: "Ofis",
    searchLabel: "Ara",
    searchPlaceholder: "Portföy, kişi, talep ara (en az 3 karakter)",
    denied: "Bu sekmeye erişiminiz yok.",
    greeting: { morning: "Günaydın", afternoon: "İyi günler", evening: "İyi akşamlar" },
    officeOf: "{name} ofisi",
    roles: {
      owner: "Ofis Sahibi",
      manager: "Yönetici",
      office_manager: "Ofis Yöneticisi",
      agent: "Danışman",
    },
    newPortfolio: "Yeni portföy",
    newPortfolioHint: "Hızlı / Manuel / Sesli",
    newContact: "Yeni kişi",
    newContactHint: "1 adım",
    newDemand: "Yeni talep",
    newDemandHint: "1 adım",
    appointment: "Randevu",
    appointmentHint: "Takvime ekle",
    activePortfolios: "Aktif portföy",
    pending: "Onay bekleyen",
    newMatches: "Yeni eşleşme",
    monthEarnings: "Bu ay hakediş",
    review: "İncele",
    last7: "son 7 gün",
    closings: "kapanış",
    thisMonth: "bu ay",
    pendingTitle: "Onay bekleyen portföyler",
    noPending: "Onay bekleyen portföy yok.",
    todayTitle: "Bugünkü randevular",
    noAppointments: "Bugünkü randevu yok.",
    notificationsTitle: "Bildirimler",
    noNotifications: "Bildirim yok.",
    allNotifications: "Tüm bildirimler",
    branchesEmpty: "Şube yok.",
    addBroker: "Broker ekle",
    addAgent: "Agent ekle",
    firstName: "Ad",
    lastName: "Soyad",
    email: "E-posta",
    phone: "Telefon",
    add: "Ekle",
    saved: "Kaydedildi.",
    savedError: "Kayıt tamamlanamadı.",
  },
  en: {
    summary: "Summary",
    portfolios: "Portfolios",
    portfolioShort: "Portfolio",
    contacts: "Contacts",
    demands: "Demands",
    matches: "Matches",
    calendar: "Calendar",
    reports: "Reports",
    reportsAndEarnings: "Reports & earnings",
    performance: "My performance",
    earnings: "Earnings",
    collaborations: "Collaborations",
    lease: "Lease radar",
    officeSettings: "Office settings",
    team: "Team",
    branches: "Branches",
    notifications: "Notification preferences",
    settings: "Settings",
    manage: "MANAGEMENT",
    more: "More",
    menu: "Open menu",
    close: "Close",
    logout: "Log out",
    office: "Office",
    searchLabel: "Search",
    searchPlaceholder: "Search portfolio, contact or demand (at least 3 characters)",
    denied: "You do not have access to this section.",
    greeting: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
    officeOf: "{name} office",
    roles: {
      owner: "Office owner",
      manager: "Manager",
      office_manager: "Office manager",
      agent: "Consultant",
    },
    newPortfolio: "New portfolio",
    newPortfolioHint: "Quick / Manual / Voice",
    newContact: "New contact",
    newContactHint: "1 step",
    newDemand: "New demand",
    newDemandHint: "1 step",
    appointment: "Appointment",
    appointmentHint: "Add to calendar",
    activePortfolios: "Active portfolios",
    pending: "Pending approval",
    newMatches: "New matches",
    monthEarnings: "Earnings this month",
    review: "Review",
    last7: "last 7 days",
    closings: "closings",
    thisMonth: "this month",
    pendingTitle: "Portfolios pending approval",
    noPending: "No portfolio is waiting for approval.",
    todayTitle: "Today's appointments",
    noAppointments: "No appointments today.",
    notificationsTitle: "Notifications",
    noNotifications: "No notifications.",
    allNotifications: "All notifications",
    branchesEmpty: "No branches.",
    addBroker: "Add broker",
    addAgent: "Add agent",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    add: "Add",
    saved: "Saved.",
    savedError: "The record could not be saved.",
  },
  de: {
    summary: "Übersicht",
    portfolios: "Portfolios",
    portfolioShort: "Portfolio",
    contacts: "Kontakte",
    demands: "Anfragen",
    matches: "Treffer",
    calendar: "Kalender",
    reports: "Berichte",
    reportsAndEarnings: "Berichte & Provision",
    performance: "Meine Leistung",
    earnings: "Provision",
    collaborations: "Zusammenarbeit",
    lease: "Mietradar",
    officeSettings: "Büroeinstellungen",
    team: "Team",
    branches: "Filialen",
    notifications: "Benachrichtigungen",
    settings: "Einstellungen",
    manage: "VERWALTUNG",
    more: "Mehr",
    menu: "Menü öffnen",
    close: "Schließen",
    logout: "Abmelden",
    office: "Büro",
    searchLabel: "Suche",
    searchPlaceholder: "Portfolio, Kontakt oder Anfrage suchen (mindestens 3 Zeichen)",
    denied: "Sie haben keinen Zugriff auf diesen Bereich.",
    greeting: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend" },
    officeOf: "Büro {name}",
    roles: {
      owner: "Büroinhaber",
      manager: "Verwalter",
      office_manager: "Büroleiter",
      agent: "Berater",
    },
    newPortfolio: "Neues Portfolio",
    newPortfolioHint: "Schnell / Manuell / Sprache",
    newContact: "Neuer Kontakt",
    newContactHint: "1 Schritt",
    newDemand: "Neue Anfrage",
    newDemandHint: "1 Schritt",
    appointment: "Termin",
    appointmentHint: "Zum Kalender",
    activePortfolios: "Aktive Portfolios",
    pending: "Freigabe offen",
    newMatches: "Neue Treffer",
    monthEarnings: "Provision diesen Monat",
    review: "Prüfen",
    last7: "letzte 7 Tage",
    closings: "Abschlüsse",
    thisMonth: "diesen Monat",
    pendingTitle: "Portfolios mit offener Freigabe",
    noPending: "Kein Portfolio wartet auf Freigabe.",
    todayTitle: "Heutige Termine",
    noAppointments: "Heute keine Termine.",
    notificationsTitle: "Benachrichtigungen",
    noNotifications: "Keine Benachrichtigungen.",
    allNotifications: "Alle Benachrichtigungen",
    branchesEmpty: "Keine Filialen.",
    addBroker: "Broker hinzufügen",
    addAgent: "Berater hinzufügen",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    phone: "Telefon",
    add: "Hinzufügen",
    saved: "Gespeichert.",
    savedError: "Der Eintrag konnte nicht gespeichert werden.",
  },
};
