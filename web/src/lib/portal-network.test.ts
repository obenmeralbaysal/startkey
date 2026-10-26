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
  networkApiUrl,
  networkHref,
  networkRole,
  networkUsesMock,
  networkWriteControls,
  officeConsultantsHref,
  sectionFromPath,
  showNetworkPortal,
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
});

test("opening an office filters consultants by office_id", () => {
  assert.equal(officeConsultantsHref(4, "tr"), "/portal/network/consultants?office_id=4");
  assert.equal(
    networkHref("consultants", { office_id: "4", q: "ada", page: "2", lang: "en" }),
    "/portal/network/consultants?lang=en&q=ada&office_id=4&page=2",
  );
  assert.equal(sectionFromPath("/portal/network/offices"), "offices");
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
