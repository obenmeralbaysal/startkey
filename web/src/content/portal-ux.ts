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
  myEarnings: string;
  collaborations: string;
  collaborationIn: string;
  collaborationOut: string;
  summaryClosed: string;
  lease: string;
  leaseDescription: string;
  leaseEmpty: string;
  officeSettings: string;
  officeSettingsOwnerNote: string;
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
  pendingWork: string;
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
  save: string;
  tabGeneral: string;
  tabRules: string;
  tabBranches: string;
  tabIntegrations: string;
  officeName: string;
  officePhone: string;
  officeAddress: string;
  officeStore: string;
  officeTtbs: string;
  logoNote: string;
  ttbsRequired: string;
  officeNameRequired: string;
  officeAddressRequired: string;
  ruleOwnerApproval: string;
  ruleClosing: string;
  ruleEarnings: string;
  teamRole: string;
  teamBranch: string;
  branchName: string;
  teamLicence: string;
  teamMyk: string;
  duplicateEmail: string;
  removeMember: string;
  bulkRate: string;
  bulkRateLabel: string;
  approvalSent: string;
  fieldRequired: string;
  record: string;
  summaryColumn: string;
  listings: {
    mine: string;
    all: string;
    tabs: { active: string; pending: string; revision: string; closed: string };
    empty: string;
    approve: string;
    requestRevision: string;
    search: string;
    category: string;
    consultant: string;
    price: string;
    priceHigh: string;
    priceLow: string;
    allCategories: string;
    allConsultants: string;
    note: string;
    noteRequired: string;
    revisionTitle: string;
    send: string;
    cancel: string;
    approved: string;
    revisionSent: string;
    create: string;
    priceMonth: string;
    portfolioColumn: string;
    priceColumn: string;
    consultantColumn: string;
    statusColumn: string;
  };
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
    myEarnings: "Hakedişim",
    collaborations: "İşbirlikleri",
    collaborationIn: "Gelen",
    collaborationOut: "Giden",
    summaryClosed: "Bu kart rolünüz için kapalı.",
    lease: "Kira takvimi",
    leaseDescription: "Kiralanan portföyün kira yıldönümünden 90, 60 ve 30 gün önce bildirim gönderilir.",
    leaseEmpty: "Kiralanan portföyünüz olduğunda kayıtlar burada görünür.",
    officeSettings: "Ofis ayarları",
    officeSettingsOwnerNote: "Bu ayarları Ofis Sahibi düzenleyebilir",
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
    pendingWork: "Bekleyen işler: {count}",
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
    save: "Kaydet",
    tabGeneral: "Genel",
    tabRules: "Kurallar",
    tabBranches: "Şubeler",
    tabIntegrations: "Entegrasyonlar",
    officeName: "Ofis adı",
    officePhone: "Telefon",
    officeAddress: "Adres",
    officeStore: "Sahibinden mağaza bağlantısı",
    officeTtbs: "TTBS yetki belge no",
    logoNote: "Logo ve marka rengini StartKey yönetimi belirler.",
    ttbsRequired: "TTBS yetki belge numarası zorunludur.",
    officeNameRequired: "Ofis adı zorunludur.",
    officeAddressRequired: "Adres zorunludur.",
    ruleOwnerApproval: "Portföy yayını için sahip onayı gerekir",
    ruleClosing: "Kapanış doğrulaması gerekir",
    ruleEarnings: "Yöneticiler hakedişi görebilir",
    teamRole: "Rol",
    teamBranch: "Şube",
    branchName: "Şube adı",
    teamLicence: "TTBS no",
    teamMyk: "MYK no",
    duplicateEmail: "Bu e-posta ekipte zaten var.",
    removeMember: "Çıkar",
    bulkRate: "Toplu oran",
    bulkRateLabel: "Oran",
    approvalSent: "Onaya gönderildi",
    fieldRequired: "Bu alan zorunludur.",
    record: "Kayıt",
    summaryColumn: "Özet",
    listings: {
      mine: "Portföylerim",
      all: "Tümü",
      tabs: { active: "Aktif", pending: "Onay Bekleyen", revision: "Düzeltme İstenen", closed: "Kapatıldı" },
      empty: "Bu durumda portföy yok.",
      approve: "Onayla",
      requestRevision: "Düzeltme iste",
      search: "Başlık, no, mahalle",
      category: "Kategori",
      consultant: "Danışman",
      price: "Fiyat",
      priceHigh: "Fiyat (yüksek)",
      priceLow: "Fiyat (düşük)",
      allCategories: "Kategori",
      allConsultants: "Danışman",
      note: "Not",
      noteRequired: "Not zorunludur.",
      revisionTitle: "Düzeltme iste",
      send: "Gönder",
      cancel: "Vazgeç",
      approved: "Portföy aktif sekmesine alındı.",
      revisionSent: "Düzeltme istendi.",
      create: "Yeni",
      priceMonth: "/ay",
      portfolioColumn: "Portföy",
      priceColumn: "Fiyat",
      consultantColumn: "Danışman",
      statusColumn: "Durum",
    },
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
    myEarnings: "My earnings",
    collaborations: "Collaborations",
    collaborationIn: "Incoming",
    collaborationOut: "Outgoing",
    summaryClosed: "This card is closed for your role.",
    lease: "Lease calendar",
    leaseDescription: "A notification is sent 90, 60 and 30 days before the rent anniversary of a leased portfolio.",
    leaseEmpty: "Records appear here when you have a leased portfolio.",
    officeSettings: "Office settings",
    officeSettingsOwnerNote: "The office owner can edit these settings",
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
    pendingWork: "Pending work: {count}",
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
    save: "Save",
    tabGeneral: "General",
    tabRules: "Rules",
    tabBranches: "Branches",
    tabIntegrations: "Integrations",
    officeName: "Office name",
    officePhone: "Phone",
    officeAddress: "Address",
    officeStore: "Sahibinden store link",
    officeTtbs: "TTBS licence no",
    logoNote: "StartKey management sets the logo and brand colour.",
    ttbsRequired: "The TTBS licence number is required.",
    officeNameRequired: "Office name is required.",
    officeAddressRequired: "Address is required.",
    ruleOwnerApproval: "Owner approval is required before a portfolio is published",
    ruleClosing: "Closing verification is required",
    ruleEarnings: "Managers can view earnings",
    teamRole: "Role",
    teamBranch: "Branch",
    branchName: "Branch name",
    teamLicence: "TTBS no",
    teamMyk: "MYK no",
    duplicateEmail: "This email is already on the team.",
    removeMember: "Remove",
    bulkRate: "Bulk rate",
    bulkRateLabel: "Rate",
    approvalSent: "Sent for approval",
    fieldRequired: "This field is required.",
    record: "Record",
    summaryColumn: "Summary",
    listings: {
      mine: "My portfolios",
      all: "All",
      tabs: { active: "Active", pending: "Pending approval", revision: "Revision requested", closed: "Closed" },
      empty: "No portfolios in this status.",
      approve: "Approve",
      requestRevision: "Request revision",
      search: "Title, no, neighbourhood",
      category: "Category",
      consultant: "Consultant",
      price: "Price",
      priceHigh: "Price (high)",
      priceLow: "Price (low)",
      allCategories: "Category",
      allConsultants: "Consultant",
      note: "Note",
      noteRequired: "A note is required.",
      revisionTitle: "Request revision",
      send: "Send",
      cancel: "Cancel",
      approved: "The portfolio moved to Active.",
      revisionSent: "Revision requested.",
      create: "New",
      priceMonth: "/mo",
      portfolioColumn: "Portfolio",
      priceColumn: "Price",
      consultantColumn: "Consultant",
      statusColumn: "Status",
    },
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
    myEarnings: "Meine Provision",
    collaborations: "Zusammenarbeit",
    collaborationIn: "Eingehend",
    collaborationOut: "Ausgehend",
    summaryClosed: "Diese Karte ist für Ihre Rolle geschlossen.",
    lease: "Mietkalender",
    leaseDescription: "90, 60 und 30 Tage vor dem Mietjubiläum eines vermieteten Portfolios wird eine Benachrichtigung gesendet.",
    leaseEmpty: "Einträge erscheinen hier, sobald ein vermietetes Portfolio vorliegt.",
    officeSettings: "Büroeinstellungen",
    officeSettingsOwnerNote: "Diese Einstellungen kann der Büroinhaber bearbeiten",
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
    pendingWork: "Offene Aufgaben: {count}",
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
    save: "Speichern",
    tabGeneral: "Allgemein",
    tabRules: "Regeln",
    tabBranches: "Filialen",
    tabIntegrations: "Integrationen",
    officeName: "Büroname",
    officePhone: "Telefon",
    officeAddress: "Adresse",
    officeStore: "Sahibinden-Shop-Link",
    officeTtbs: "TTBS-Berechtigungsnr.",
    logoNote: "Logo und Markenfarbe legt die StartKey-Verwaltung fest.",
    ttbsRequired: "Die TTBS-Berechtigungsnummer ist erforderlich.",
    officeNameRequired: "Der Büroname ist erforderlich.",
    officeAddressRequired: "Die Adresse ist erforderlich.",
    ruleOwnerApproval: "Vor der Veröffentlichung ist die Freigabe des Inhabers nötig",
    ruleClosing: "Abschlussprüfung ist nötig",
    ruleEarnings: "Verwalter können die Provision sehen",
    teamRole: "Rolle",
    teamBranch: "Filiale",
    branchName: "Filialname",
    teamLicence: "TTBS-Nr.",
    teamMyk: "MYK-Nr.",
    duplicateEmail: "Diese E-Mail ist im Team bereits vorhanden.",
    removeMember: "Entfernen",
    bulkRate: "Sammelsatz",
    bulkRateLabel: "Satz",
    approvalSent: "Zur Freigabe gesendet",
    fieldRequired: "Dieses Feld ist erforderlich.",
    record: "Eintrag",
    summaryColumn: "Überblick",
    listings: {
      mine: "Meine Portfolios",
      all: "Alle",
      tabs: { active: "Aktiv", pending: "Freigabe offen", revision: "Korrektur angefordert", closed: "Geschlossen" },
      empty: "In diesem Status gibt es kein Portfolio.",
      approve: "Freigeben",
      requestRevision: "Korrektur anfordern",
      search: "Titel, Nr., Viertel",
      category: "Kategorie",
      consultant: "Berater",
      price: "Preis",
      priceHigh: "Preis (hoch)",
      priceLow: "Preis (niedrig)",
      allCategories: "Kategorie",
      allConsultants: "Berater",
      note: "Notiz",
      noteRequired: "Eine Notiz ist erforderlich.",
      revisionTitle: "Korrektur anfordern",
      send: "Senden",
      cancel: "Abbrechen",
      approved: "Das Portfolio liegt jetzt unter Aktiv.",
      revisionSent: "Korrektur wurde angefordert.",
      create: "Neu",
      priceMonth: "/Mon.",
      portfolioColumn: "Portfolio",
      priceColumn: "Preis",
      consultantColumn: "Berater",
      statusColumn: "Status",
    },
  },
};
