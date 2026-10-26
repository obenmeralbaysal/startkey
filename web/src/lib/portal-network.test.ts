import assert from "node:assert/strict";
import test from "node:test";

import { PORTAL_NETWORK_COPY } from "../content/portal-network.ts";
import {
  consultantTitle,
  mockConsultants,
  mockConsultantPage,
  mockOffices,
  mockOfficePage,
  mockSummary,
  NETWORK_MENU,
  emptyLimitPayload,
  isPortalLimitRequest,
  localePortalRedirect,
  NETWORK_OFFICE_DENIED,
  NETWORK_OFFICE_MISSING,
  networkApiUrl,
  networkHref,
  networkOfficeId,
  networkRole,
  networkUsesMock,
  networkWriteControls,
  officeConsultantsHref,
  openNetworkHome,
  sectionFromParts,
  sectionFromPath,
  showNetworkPortal,
  skipPortalLimitRequests,
  toConsultant,
  toOffice,
  toPage,
} from "./portal-network.ts";

test("network menu is only the three read-only franchise items", () => {
  assert.deepEqual(NETWORK_MENU.map((item) => item.section), ["summary", "offices", "consultants"]);
  assert.deepEqual(
    [PORTAL_NETWORK_COPY.tr.summary, PORTAL_NETWORK_COPY.tr.offices, PORTAL_NETWORK_COPY.tr.consultants],
    ["Ağ Özeti", "Ofisler", "Danışmanlar"],
  );
  for (const locale of ["tr", "en", "de"] as const) {
    const copy = PORTAL_NETWORK_COPY[locale];
    assert.equal([copy.summary, copy.offices, copy.consultants].every((label) => label.length > 0), true);
  }
  assert.deepEqual(networkWriteControls(), []);
});

test("franchise network context skips office selection", () => {
  assert.equal(showNetworkPortal({ context: "network", role: "franchise_admin" }), true);
  assert.equal(showNetworkPortal({ data: { user: { context: "network", role_slug: "franchise_staff" } } }), true);
  assert.equal(networkRole({ context: "network", role: "franchise_staff" }), "franchise_staff");
  assert.equal(showNetworkPortal({ context: "network", role: "owner" }), false);
  assert.equal(showNetworkPortal({ context: "office", role: "franchise_admin" }), false);
  assert.equal(showNetworkPortal({ role: "franchise_admin" }), false);
  assert.equal(showNetworkPortal({ user: { is_admin: true, role: "owner" } }), false);
  assert.equal(openNetworkHome({ context: "network", role: "franchise_admin" }), true);
  assert.equal(openNetworkHome({ role: "franchise_staff" }), true);
  assert.equal(openNetworkHome({ context: "office", role: "franchise_admin" }), false);
  assert.equal(openNetworkHome({ role: "owner" }), false);
  assert.equal(openNetworkHome({ data: { role: "owner", user: { role: "franchise_admin", context: "network" } } }), true);
});

test("network pages resolve summary, offices and consultants", () => {
  assert.equal(sectionFromParts([]), "summary");
  assert.equal(sectionFromParts(["summary"]), "summary");
  assert.equal(sectionFromParts(["offices"]), "offices");
  assert.equal(sectionFromParts(["consultants"]), "consultants");
  assert.equal(sectionFromParts(["settings"]), null);
  assert.equal(sectionFromPath("/portal/network"), "summary");
  assert.equal(sectionFromPath("/portal/network/summary"), "summary");
  assert.equal(sectionFromPath("/portal/network/offices"), "offices");
  assert.equal(sectionFromPath("/portal/network/consultants"), "consultants");
  assert.equal(sectionFromPath("/tr/portal/network/consultants"), "consultants");
  assert.equal(sectionFromPath("/portal/network/summary/"), "summary");
  assert.equal(networkHref("summary", { lang: "tr" }), "/portal/network/summary");
  assert.equal(networkHref("offices"), "/portal/network/offices");
  assert.equal(networkHref("consultants"), "/portal/network/consultants");
  assert.equal(localePortalRedirect("/tr/portal/network/summary"), "/portal/network/summary");
  assert.equal(localePortalRedirect("/en/portal/network/consultants"), "/portal/network/consultants");
  assert.equal(localePortalRedirect("/de/portal"), "/portal");
  assert.equal(localePortalRedirect("/tr/franchise-basvuru"), null);
  assert.deepEqual(
    ["franchise_admin", "franchise_staff"].map((role) => ({
      role,
      nav: ["summary", "offices", "consultants"],
      writes: networkWriteControls(),
    })),
    [
      { role: "franchise_admin", nav: ["summary", "offices", "consultants"], writes: [] },
      { role: "franchise_staff", nav: ["summary", "offices", "consultants"], writes: [] },
    ],
  );
});

test("franchise roles do not call the super-admin limit queue", () => {
  const viewer = { context: "network", role: "franchise_admin" };
  assert.equal(skipPortalLimitRequests(viewer), true);
  assert.equal(skipPortalLimitRequests({ context: "network", role: "franchise_staff" }), true);
  assert.equal(skipPortalLimitRequests({ context: "office", role: "owner" }), false);
  assert.equal(isPortalLimitRequest("admin/portal-limit-requests"), true);
  assert.equal(isPortalLimitRequest("/api/v1/portal/office/admin/portal-limit-requests"), true);
  assert.equal(isPortalLimitRequest("admin/network/offices"), false);
  assert.equal(isPortalLimitRequest("admin/portal-limit-requests?page=1"), true);
  assert.equal(networkApiUrl("offices").includes("portal-limit-requests"), false);
  assert.equal(networkApiUrl("summary").includes("portal-limit-requests"), false);
  assert.equal(networkApiUrl("consultants").includes("portal-limit-requests"), false);
  assert.deepEqual(emptyLimitPayload(403), { data: [] });
  assert.equal(emptyLimitPayload(404), null);
  assert.equal(emptyLimitPayload(200), null);
});

test("a missing franchise office id is the office-not-found route", () => {
  assert.equal(NETWORK_OFFICE_MISSING, "Ofis bulunamadı");
  assert.equal(NETWORK_OFFICE_DENIED, "Ofis bulunamadı / erişim yok");
  assert.equal(networkOfficeId(["offices", "999999"]), 999999);
  assert.equal(networkOfficeId(["offices"]), null);
  assert.equal(networkOfficeId(["offices", "0"]), null);
  assert.equal(networkOfficeId(["offices", "nope"]), null);
  assert.equal(networkOfficeId(["consultants", "4"]), null);
  assert.equal(sectionFromPath("/portal/network/offices/999999"), null);
  assert.equal(sectionFromParts(["offices", "999999"]), null);
});

test("opening an office filters consultants by office_id", () => {
  assert.equal(officeConsultantsHref(4, "tr"), "/portal/network/consultants?office_id=4");
  assert.equal(
    networkHref("consultants", { office_id: "4", q: "ada", page: "2", lang: "en" }),
    "/portal/network/consultants?lang=en&q=ada&office_id=4&page=2",
  );
  assert.equal(sectionFromPath("/portal/network/offices"), "offices");
  assert.equal(sectionFromPath("/portal/network/summary"), "summary");
  assert.equal(sectionFromPath("/portal/network/settings"), null);
  assert.equal(networkApiUrl("consultants", { page: "2", q: "ada", office_id: "4" }), "/api/v1/portal/network/consultants?page=2&q=ada&office_id=4");
  assert.equal(networkApiUrl("summary"), "/api/v1/portal/network/summary");
});

test("consultant title is the office role in tr, en and de", () => {
  assert.equal(consultantTitle("owner", "tr"), "Ofis Sahibi");
  assert.equal(consultantTitle("manager", "en"), "Manager");
  assert.equal(consultantTitle("office_manager", "de"), "Büroleiter");
  assert.equal(consultantTitle("agent", "tr"), "Gayrimenkul Danışmanı");
  assert.equal(consultantTitle("agent", "en"), "Real Estate Consultant");
  assert.equal(consultantTitle("AGENT", "de"), "Immobilienberater");
  assert.equal(consultantTitle("office-manager", "tr"), "Ofis Yöneticisi");
  assert.equal(consultantTitle("<b>Stajyer</b>", "en"), "Stajyer");
  assert.equal(consultantTitle("Stajyer", "tr"), "Stajyer");
});

test("network rows never keep phone or email", () => {
  const office = toOffice({
    id: 3,
    name: "Kadıköy",
    city: "İstanbul",
    logo: "/portal/img/startkey_logo.png",
    consultant_count: 2,
    portfolio_count: 5,
    phone: "5550001",
    email: "hidden@example.com",
  });
  const consultant = toConsultant({
    id: 9,
    name: "Ada",
    title: "Broker",
    phone: "5550002",
    email: "ada@example.com",
    office: { id: 3, name: "Kadıköy", email: "office@example.com", phone: "5550003" },
    photo: null,
    portfolio_count: 1,
  });
  const page = toPage({
    data: [{
      id: 9,
      name: "Ada",
      title: "agent",
      phone: "5550002",
      email: "ada@example.com",
      office: { id: 3, name: "Kadıköy", email: "office@example.com", phone: "5550003" },
      photo: null,
      portfolio_count: 1,
    }],
    pagination: { current_page: 2, per_page: 20, total_items: 21, total_pages: 2 },
  }, toConsultant);
  const blob = JSON.stringify({ office, consultant, page, mock: { mockOffices: mockOffices(), mockConsultants: mockConsultants(), mockSummary: mockSummary() } });
  assert.equal(blob.includes("555000"), false);
  assert.equal(blob.includes("@"), false);
  assert.equal(office?.name, "Kadıköy");
  const owned = toOffice({
    id: 4,
    name: "Çift",
    owners: [
      { id: 8, first_name: "Ada", last_name: "Bir", email: "ada@example.com", title: "Broker/Owner" },
      { id: 9, first_name: "Efe", last_name: "İki", email: "efe@example.com" },
    ],
  });
  assert.deepEqual(owned?.owners?.map((row) => row.name), ["Ada Bir", "Efe İki"]);
  assert.equal(owned?.owner?.name, "Ada Bir");
  assert.equal(owned?.owner?.title, "Broker/Owner");
  assert.equal(JSON.stringify(owned).includes("@"), false);
  assert.equal(consultant?.office?.name, "Kadıköy");
  assert.equal(page.data[0]?.title, "agent");
  assert.equal(page.pagination.per_page, 20);
  assert.equal(page.pagination.total_items, 21);
  assert.equal(page.pagination.total_pages, 2);
  assert.equal(page.pagination.current_page, 2);
});

test("mock consultant list honours office_id and stays read-only", () => {
  const filtered = mockConsultantPage({ office_id: "1" });
  assert.deepEqual(filtered.data.map((row) => row.id), [11, 12]);
  assert.equal(mockOfficePage({ q: "izmir" }).data[0]?.id, 3);
  assert.equal(mockOfficePage({}).pagination.per_page, 20);
  assert.equal(consultantTitle(mockConsultants()[0]?.title ?? null, "tr"), "Gayrimenkul Danışmanı");
  assert.equal(networkUsesMock("1"), true);
  assert.equal(networkUsesMock(""), false);
});
