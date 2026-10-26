import assert from "node:assert/strict";
import test from "node:test";

import {
  MISSING_PORTFOLIO_ENDPOINTS,
  approvePortfolioPath,
  canApprovePortfolios,
  canSeeAllPortfolios,
  filterPortfolios,
  keepOwnPortfolios,
  portfolioListPath,
  portfolioTab,
  revisionNoteMissing,
  revisionPortfolioBody,
  revisionPortfolioPath,
  showApprovalActions,
  tabCounts,
  withPortfolioStatus,
} from "./portfolio-list.ts";

const rows = [
  { id: 1, title: "Bornova 2+1 kiralık", status: "Onay bekliyor", price: 22000, type: "Kiralık", user_id: 4, agent_name: "Mehmet K.", category_name: "Konut", neighborhood_name: "Bornova", listing_no: "3380" },
  { id: 2, title: "Karşıyaka dükkan", status: "pending_approval", price: 6400000, type: "Satılık", user_id: 9, agent_name: "Elif Ş.", category_name: "İşyeri", neighborhood: "Karşıyaka" },
  { id: 3, title: "Mithatpaşa 3+1", status: "active", price: 14750000, user_id: 4, agent_name: "Ayşe Y.", category_name: "Konut", district_name: "Konak" },
  { id: 4, title: "Urla arsa hissesi", status: "Düzeltme istendi", price: 3200000, user_id: 4, agent_name: "Zeynep T." },
  { id: 5, title: "Alsancak dükkan", status: "Kapatıldı", price: 95000, type: "Kiralık", user_id: 9, agent_name: "Can Ö.", neighborhood_name: "Konak" },
];

test("approval actions are limited to owner, manager, and office manager on the pending tab", () => {
  for (const role of ["owner", "manager", "office_manager"]) {
    assert.equal(canApprovePortfolios(role), true);
    assert.equal(showApprovalActions(role, "pending"), true);
    assert.equal(showApprovalActions(role, "active"), false);
    assert.equal(canSeeAllPortfolios(role, undefined), true);
  }
  assert.equal(canApprovePortfolios("agent"), false);
  assert.equal(showApprovalActions("agent", "pending"), false);
  assert.equal(canSeeAllPortfolios("agent", undefined), false);
  assert.equal(canSeeAllPortfolios("agent", { can_view_all_portfolios: false }), false);
  assert.equal(canSeeAllPortfolios("agent", { can_view_all_portfolios: true }), true);
});

test("status labels map onto the four tabs", () => {
  assert.equal(portfolioTab("Aktif"), "active");
  assert.equal(portfolioTab("Onay bekliyor"), "pending");
  assert.equal(portfolioTab("pending_approval"), "pending");
  assert.equal(portfolioTab("Düzeltme İstenen"), "revision");
  assert.equal(portfolioTab("revision_requested"), "revision");
  assert.equal(portfolioTab("Kapatıldı"), "closed");
  assert.equal(portfolioTab("potential"), null);
  assert.deepEqual(tabCounts(rows), { active: 1, pending: 2, revision: 1, closed: 1 });
});

test("a consultant keeps only owned rows when the office withholds Tümü", () => {
  const own = keepOwnPortfolios(rows, 4, true).map((row) => row.id);
  assert.deepEqual(own, [1, 3, 4]);
  assert.equal(keepOwnPortfolios(rows, 4, false).length, 5);
  assert.equal(keepOwnPortfolios([{ id: 8, title: "Adsız", status: "active" }], 4, true).length, 1);
  assert.equal(keepOwnPortfolios(rows, null, true).length, 5);
});

test("filters, price sort, and approval move the row onto Aktif", () => {
  const pending = filterPortfolios(rows, { tab: "pending", q: "bornova", category: "Konut", consultant: "Mehmet K.", sort: "price_asc" });
  assert.deepEqual(pending.map((row) => row.id), [1]);
  const priced = filterPortfolios(rows, { tab: "pending", q: "", category: "", consultant: "", sort: "price_desc" });
  assert.deepEqual(priced.map((row) => row.id), [2, 1]);
  const approved = withPortfolioStatus(rows, "1", "active");
  assert.equal(portfolioTab(approved[0]?.status), "active");
  assert.equal(filterPortfolios(approved, { tab: "pending", q: "", category: "", consultant: "", sort: "" }).some((row) => row.id === 1), false);
  assert.equal(filterPortfolios([], { tab: "closed", q: "", category: "", consultant: "", sort: "" }).length, 0);
});

test("a revision note is required and the missing contracts stay listed", () => {
  assert.equal(revisionNoteMissing("  "), true);
  assert.equal(revisionNoteMissing("Fotoğraf eksik"), false);
  assert.equal(revisionPortfolioBody("  "), null);
  assert.deepEqual(revisionPortfolioBody(" Fotoğraf eksik "), { note: "Fotoğraf eksik" });
  assert.equal(portfolioListPath("mine"), "portfolios?scope=mine");
  assert.equal(approvePortfolioPath("5"), "portfolios/5/approve");
  assert.equal(revisionPortfolioPath("5"), "portfolios/5/revision-request");
  assert.equal(MISSING_PORTFOLIO_ENDPOINTS.length, 2);
  assert.equal(MISSING_PORTFOLIO_ENDPOINTS.some((line) => line.includes("revision-request")), true);
  assert.equal(MISSING_PORTFOLIO_ENDPOINTS.some((line) => line.includes("scope=mine|all")), true);
});
