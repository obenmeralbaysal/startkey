export const PORTFOLIO_TABS = ["active", "pending", "revision", "closed"] as const;

export type PortfolioTab = (typeof PORTFOLIO_TABS)[number];

export type PortfolioScope = "mine" | "all";

export type PortfolioSort = "" | "price_asc" | "price_desc";

export type PortfolioRow = Record<string, unknown>;

/** Proxy paths. Approve is on the office proxy today. The other two are not a confirmed Reonix contract. */
export const PORTFOLIO_LIST_API = {
  list: "GET portfolios",
  approve: "POST portfolios/{id}/approve",
  revision: "POST portfolios/{id}/revision-request",
} as const;

/**
 * Reonix contracts the portal does not treat as available.
 * Scope is still sent. Status is filtered here. Revision is posted to the stub path.
 */
export const MISSING_PORTFOLIO_ENDPOINTS = [
  "GET portfolios?status=&scope=mine|all — status filter and scope=mine|all are not confirmed. The screen filters status locally and still sends scope.",
  "POST portfolios/{id}/revision-request — mandatory note, status revision_requested, in-app notification to the consultant. portfolios/{id}/reject exists and does not carry that contract.",
] as const;

const APPROVE_ROLES = new Set(["owner", "manager", "office_manager"]);

const ACTIVE = new Set(["active", "aktif", "published", "live", "yayinda", "yayında"]);
const PENDING = new Set(["pending", "pending_approval", "awaiting_approval", "onay_bekliyor", "onay_bekleyen"]);
const REVISION = new Set(["revision", "revision_requested", "changes_requested", "duzeltme_istenen", "düzeltme_istenen", "duzeltme_istendi", "düzeltme_istendi"]);
const CLOSED = new Set(["closed", "kapatildi", "kapatıldı", "inactive", "kapali", "kapalı"]);

export function canApprovePortfolios(role: string): boolean {
  return APPROVE_ROLES.has(role);
}

/** Consultants see Tümü only when the office membership flag is on. */
export function canSeeAllPortfolios(role: string, office: { can_view_all_portfolios?: boolean } | undefined): boolean {
  if (canApprovePortfolios(role)) return true;
  return role === "agent" && office?.can_view_all_portfolios === true;
}

export function showApprovalActions(role: string, tab: PortfolioTab): boolean {
  return canApprovePortfolios(role) && tab === "pending";
}

export function portfolioListPath(scope: PortfolioScope): string {
  return `portfolios?scope=${scope}`;
}

export function approvePortfolioPath(id: string): string {
  return `portfolios/${encodeURIComponent(id)}/approve`;
}

export function revisionPortfolioPath(id: string): string {
  return `portfolios/${encodeURIComponent(id)}/revision-request`;
}

export function revisionNoteMissing(note: string): boolean {
  return note.trim() === "";
}

export function revisionPortfolioBody(note: string): { note: string } | null {
  const trimmed = note.trim();
  if (!trimmed) return null;
  return { note: trimmed };
}

export function portfolioTab(status: unknown): PortfolioTab | null {
  const value = String(status ?? "").trim().toLocaleLowerCase("tr-TR").replace(/[\s-]+/g, "_");
  if (ACTIVE.has(value)) return "active";
  if (PENDING.has(value)) return "pending";
  if (REVISION.has(value)) return "revision";
  if (CLOSED.has(value)) return "closed";
  return null;
}

export function portfolioOwnerId(row: PortfolioRow): string | null {
  for (const key of ["user_id", "agent_id", "consultant_id", "owner_id", "created_by"]) {
    const id = numericId(row[key]);
    if (id) return id;
  }
  for (const key of ["agent", "consultant", "user"]) {
    const nested = row[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const id = numericId((nested as PortfolioRow).id);
      if (id) return id;
    }
  }
  return null;
}

export function keepOwnPortfolios(rows: readonly PortfolioRow[], userId: number | null, onlyOwn: boolean): PortfolioRow[] {
  if (!onlyOwn || userId == null || userId <= 0) return [...rows];
  const mine = String(userId);
  return rows.filter((row) => {
    const owner = portfolioOwnerId(row);
    return owner == null || owner === mine;
  });
}

export function tabCounts(rows: readonly PortfolioRow[]): Record<PortfolioTab, number> {
  const counts: Record<PortfolioTab, number> = { active: 0, pending: 0, revision: 0, closed: 0 };
  for (const row of rows) {
    const tab = portfolioTab(row.status ?? row.state);
    if (tab) counts[tab] += 1;
  }
  return counts;
}

export function portfolioTitle(row: PortfolioRow): string {
  const title = text(row.title) || text(row.name);
  return title || (row.id == null ? "" : String(row.id));
}

export function portfolioCode(row: PortfolioRow): string {
  const code = text(row.listing_no) || text(row.code) || text(row.no) || text(row.portfolio_no);
  if (code) return code.startsWith("#") ? code : `#${code}`;
  return row.id == null ? "" : `#${row.id}`;
}

export function portfolioPlace(row: PortfolioRow): string {
  return text(row.neighborhood_name) || text(row.neighborhood) || text(row.district_name) || text(row.district) || text(row.location) || "";
}

export function portfolioCategory(row: PortfolioRow): string {
  return text(row.category_name) || text(row.category) || text(row.type_name) || "";
}

export function portfolioConsultant(row: PortfolioRow): string {
  const named = text(row.agent_name) || text(row.consultant_name) || text(row.user_name);
  if (named) return named;
  for (const key of ["agent", "consultant", "user"]) {
    const nested = row[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const person = nested as PortfolioRow;
      const joined = `${text(person.first_name)} ${text(person.last_name)}`.trim();
      if (joined) return joined;
      if (text(person.name)) return text(person.name);
    }
  }
  return "";
}

export function portfolioRent(row: PortfolioRow): boolean {
  const kind = `${text(row.listing_type)} ${text(row.deal_type)} ${text(row.type)}`.toLocaleLowerCase("tr-TR");
  return kind.includes("rent") || kind.includes("kira");
}

export function portfolioPrice(row: PortfolioRow): number | null {
  const value = row.price ?? row.amount;
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value.replace(/[^\d.-]/g, "")) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

export function filterPortfolios(
  rows: readonly PortfolioRow[],
  input: { tab: PortfolioTab; q: string; category: string; consultant: string; sort: PortfolioSort },
): PortfolioRow[] {
  const q = input.q.trim().toLocaleLowerCase("tr-TR");
  const matched = rows.filter((row) => {
    if (portfolioTab(row.status ?? row.state) !== input.tab) return false;
    if (input.category && portfolioCategory(row) !== input.category) return false;
    if (input.consultant && portfolioConsultant(row) !== input.consultant) return false;
    if (!q) return true;
    const haystack = `${portfolioTitle(row)} ${portfolioCode(row)} ${portfolioPlace(row)}`.toLocaleLowerCase("tr-TR");
    return haystack.includes(q);
  });
  if (!input.sort) return matched;
  return matched
    .map((row, index) => ({ row, index }))
    .sort((left, right) => comparePrice(left.row, right.row, input.sort) || left.index - right.index)
    .map((entry) => entry.row);
}

export function optionValues(rows: readonly PortfolioRow[], pick: (row: PortfolioRow) => string): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const value = pick(row).trim();
    if (value) values.add(value);
  }
  return [...values].sort((left, right) => left.localeCompare(right, "tr"));
}

export function withPortfolioStatus(rows: readonly PortfolioRow[], id: string, status: string): PortfolioRow[] {
  return rows.map((row) => (String(row.id) === id ? { ...row, status } : row));
}

export function portfolioSwatch(id: string): string {
  const palette = ["#8ea0c8", "#c4b39a", "#9bb89a", "#a9b0c4", "#c4a98a"];
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % palette.length;
  return palette[hash] ?? palette[0];
}

function comparePrice(left: PortfolioRow, right: PortfolioRow, sort: PortfolioSort): number {
  const a = portfolioPrice(left);
  const b = portfolioPrice(right);
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return sort === "price_asc" ? a - b : b - a;
}

function numericId(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return String(value);
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return String(Number(value));
  return null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
