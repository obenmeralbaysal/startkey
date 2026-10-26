import assert from "node:assert/strict";
import test from "node:test";

import type { OfficeMembership } from "../components/portal/office/access.ts";
import { PORTAL_UX_COPY } from "../content/portal-ux.ts";
import { NETWORK_MENU } from "./portal-network.ts";
import {
  PORTAL_SEARCH_READY,
  QUICK_ACTIONS,
  SECTION_DENIED_TEXT,
  appointmentLines,
  greetingTitle,
  networkChrome,
  notificationBadge,
  notificationLines,
  officeBottomNav,
  officeCaption,
  officeMenu,
  personTitle,
  officeRoleBadge,
  officeSectionDenied,
  pendingPortfolios,
  portalLandingHref,
  summaryFigures,
} from "./portal-ux.ts";

const office = (role: string, extra: Partial<OfficeMembership> = {}): OfficeMembership => ({
  id: 7,
  office_name: "Lider · Bayraklı",
  role_slug: role,
  ...extra,
});

test("role badges stay Turkish labels and never raw slugs", () => {
  assert.equal(SECTION_DENIED_TEXT, "Bu sekmeye erişiminiz yok.");
  assert.equal(officeRoleBadge("owner", "tr"), "Ofis Sahibi");
  assert.equal(officeRoleBadge("manager", "tr"), "Yönetici");
  assert.equal(officeRoleBadge("office_manager", "tr"), "Ofis Yöneticisi");
  assert.equal(officeRoleBadge("agent", "tr"), "Danışman");
  assert.equal(officeRoleBadge("owner", "en"), "Office owner");
  assert.equal(officeRoleBadge("office_manager", "de"), "Büroleiter");
  for (const slug of ["owner", "manager", "office_manager", "agent"]) {
    for (const locale of ["tr", "en", "de"] as const) {
      assert.equal(officeRoleBadge(slug, locale) === slug, false);
    }
  }
  assert.equal(officeRoleBadge("franchise_admin", "tr"), "");
});

test("office menu follows role access and the mobile bar is the four work items", () => {
  const owner = officeMenu("owner", office("owner"), "tr");
  assert.deepEqual(owner.filter((entry) => entry.group === "manage").map((entry) => entry.id), ["office", "team", "branches", "notifications", "settings"]);
  assert.equal(owner.find((entry) => entry.id === "reports")?.label, "Raporlar & Hakediş");
  assert.equal(owner.find((entry) => entry.id === "lease")?.label, "Kira takvimi");
  assert.equal(JSON.stringify(PORTAL_UX_COPY).includes("Kira radarı"), false);
  assert.equal(JSON.stringify(PORTAL_UX_COPY).includes("Lease radar"), false);
  assert.deepEqual(officeBottomNav(owner).map((entry) => entry.bottomLabel), ["Özet", "Kişiler", "Portföy", "Talepler"]);

  const agent = officeMenu("agent", office("agent"), "tr").map((entry) => entry.id);
  assert.equal(agent.includes("team"), false);
  assert.equal(agent.includes("office"), false);
  assert.equal(agent.includes("branches"), false);
  assert.equal(agent.includes("notifications"), true);
  assert.equal(agent.includes("earnings"), true);

  const manager = officeMenu("manager", office("manager"), "tr").map((entry) => entry.id);
  assert.equal(manager.includes("earnings"), false);
  assert.equal(officeMenu("manager", office("manager", { managers_can_view_earnings: true }), "tr").some((entry) => entry.id === "reports" && entry.label === "Raporlar & Hakediş"), true);
  const branched = officeMenu("office_manager", office("office_manager", { branch_id: 4 }), "en").map((entry) => entry.id);
  assert.equal(branched.includes("office"), false);
  assert.equal(branched.includes("branches"), false);
  assert.equal(branched.includes("team"), true);

  assert.equal(officeSectionDenied(["earnings"], "manager", office("manager")), true);
  assert.equal(officeSectionDenied(["earnings"], "manager", office("manager", { managers_can_view_earnings: true })), false);
  assert.equal(officeSectionDenied(["earnings"], "agent", office("agent")), false);
  assert.equal(officeSectionDenied(["settings", "team"], "agent", office("agent")), true);
  assert.equal(officeSectionDenied(["settings", "notifications"], "agent", office("agent")), false);
  assert.equal(officeSectionDenied(["branches"], "agent", office("agent")), true);
  assert.equal(officeSectionDenied(["contacts", "new"], "agent", office("agent")), false);
  assert.equal(PORTAL_UX_COPY.tr.denied, SECTION_DENIED_TEXT);
});

test("portal home sends office roles to the summary and network roles to the network", () => {
  assert.equal(portalLandingHref({ offices: [{ id: 3, role: "agent" }], role: "agent" }, "tr"), "/portal/office");
  assert.equal(portalLandingHref({ offices: [{ id: 3 }], role: "owner" }, "de"), "/portal/office?lang=de");
  assert.equal(portalLandingHref({ context: "network", role: "franchise_staff" }, "en"), "/portal/network?lang=en");
  assert.equal(portalLandingHref({ data: { user: { context: "network", role: "franchise_admin" } } }, null), "/portal/network");
  assert.equal(portalLandingHref({ is_admin: true, offices: [{ id: 1 }] }, "tr"), "/portal/office");
  assert.equal(portalLandingHref({ is_admin: true, offices: [{ id: 1 }] }, "tr", "1"), null);
  assert.equal(portalLandingHref({ is_admin: true, offices: [] }, "tr"), null);
});

test("network chrome stays the three read-only items", () => {
  const chrome = networkChrome();
  assert.deepEqual(chrome.sections, ["summary", "offices", "consultants"]);
  assert.deepEqual(chrome.sections, NETWORK_MENU.map((entry) => entry.section));
  assert.equal(chrome.sections.length, 3);
  assert.equal(chrome.officeSelector, false);
  assert.deepEqual(chrome.quickActions, []);
  assert.deepEqual(chrome.writes, []);
  assert.deepEqual(QUICK_ACTIONS.map((entry) => entry.href), [
    "/portal/office/portfolios/new",
    "/portal/office/contacts/new",
    "/portal/office/demands/new",
    "/portal/office/calendar",
  ]);
  assert.equal(PORTAL_SEARCH_READY, false);
});

test("greeting and office line drop an empty title instead of leaving a dash", () => {
  assert.equal(greetingTitle(9, "Ayşe", "tr"), "Günaydın, Ayşe");
  assert.equal(greetingTitle(13, "Ayşe", "tr"), "İyi günler, Ayşe");
  assert.equal(greetingTitle(19, "Ayşe", "tr"), "İyi akşamlar, Ayşe");
  assert.equal(greetingTitle(8, "", "tr"), "Günaydın");
  assert.equal(greetingTitle(8, "Ada", "en"), "Good morning, Ada");
  assert.equal(greetingTitle(20, "Ada", "de"), "Guten Abend, Ada");
  assert.equal(officeCaption("Lider · Bayraklı", "Broker", "tr"), "Lider · Bayraklı ofisi");
  assert.equal(officeCaption("Lider · Bayraklı", "Lider", "tr"), "Lider · Lider · Bayraklı ofisi");
  assert.equal(officeCaption("Lider · Bayraklı", "", "tr"), "Lider · Bayraklı ofisi");
  assert.equal(officeCaption("Lider · Bayraklı", " - ", "tr"), "Lider · Bayraklı ofisi");
  assert.equal(officeCaption("", "", "en"), "");
  assert.equal(officeCaption("Kadıköy", "owner", "tr"), "Kadıköy ofisi");
  assert.equal(officeCaption("Kadıköy", "office-manager", "en"), "Kadıköy office");
  assert.equal(officeCaption("Kadıköy", "AGENT", "de"), "Büro Kadıköy");
  assert.equal(personTitle({ title: "Broker" }), "");
  assert.equal(personTitle({ job_title: "manager" }), "");
  assert.equal(personTitle({ unvan: "Lider" }), "Lider");
});

test("summary figures use numbers only and hide manager earnings without the flag", () => {
  const stats = {
    portfolios: { active: 102, added_this_month: 6 },
    matches: { last_7_days: 11 },
    financials: { income: 186400 },
    closings: { this_month: 3 },
  };
  const shown = summaryFigures(stats, { counts: { activations: 4, closings: 0 } }, true);
  assert.equal(shown.active, 102);
  assert.equal(shown.activeDelta, 6);
  assert.equal(shown.pending, 4);
  assert.equal(shown.matches, 11);
  assert.equal(shown.matchesAreWeek, true);
  assert.equal(shown.earnings, 186400);
  assert.equal(shown.closings, 3);
  const hidden = summaryFigures(stats, null, false);
  assert.equal(hidden.earnings, null);
  assert.equal(hidden.closings, null);
  const empty = summaryFigures(null, { unexpected: { raw: true } }, true);
  assert.deepEqual(empty, {
    active: 0,
    activeDelta: null,
    pending: 0,
    matches: 0,
    matchesAreWeek: false,
    earnings: 0,
    closings: 0,
  });
  assert.deepEqual(pendingPortfolios({ pending_activations: [{ id: 9, title: "Bornova 2+1", agent_name: "Mehmet K." }] }), [
    { id: "9", title: "Bornova 2+1", meta: "Mehmet K." },
  ]);
  assert.deepEqual(pendingPortfolios({ status: "pending", data: { raw: true } }), []);
  const day = new Date("2026-10-26T12:00:00");
  assert.deepEqual(appointmentLines({
    appointments: [
      { id: 1, title: "Yer gösterme", starts_at: "2026-10-26T10:30:00", contact_name: "Mehmet K." },
      { id: 2, title: "Yarın", starts_at: "2026-10-27T10:30:00" },
    ],
  }, day, "tr").map((line) => line.title), ["Yer gösterme"]);
  assert.equal(notificationBadge({ unread_count: 3 }), 3);
  assert.deepEqual(notificationLines({ notifications: [{ id: 1, title: "Portföy onay bekliyor" }] }), [
    { id: "1", title: "Portföy onay bekliyor", meta: "" },
  ]);
  assert.equal(JSON.stringify(empty).includes("unexpected"), false);
});
