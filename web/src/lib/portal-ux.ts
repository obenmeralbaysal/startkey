import {
  canManageOffice,
  canViewEarnings,
  canWriteBranches,
  settingsAllowed,
  settingsPageAccess,
  type OfficeMembership,
  type OfficeRole,
} from "../components/portal/office/access.ts";
import { PORTAL_UX_COPY } from "../content/portal-ux.ts";
import type { Locale } from "./locales.ts";
import { NETWORK_MENU, networkHome, networkWriteControls, showNetworkPortal } from "./portal-network.ts";

export const SECTION_DENIED_TEXT = "Bu sekmeye erişiminiz yok.";

/** global-search is wired. The box stays hidden until this flag is turned on. */
export const PORTAL_SEARCH_READY = false;

export const SEARCH_DEBOUNCE_MS = 300;

/** Fields the office profile form shows and writes. There is no unvan control. */
export const PROFILE_SCREEN_FIELDS = ["first_name", "last_name", "phone", "password", "demand_match_network_default"] as const;

/**
 * Names that could be mistaken for an unvan. None of them is a profile-screen field
 * or a typed portal user property. `NetworkConsultant.title` is a network-list role slug.
 */
export const UNVAN_CANDIDATE_FIELDS = ["title", "job_title", "position_name", "unvan"] as const;

export const QUICK_ACTIONS = [
  { id: "portfolio", href: "/portal/office/portfolios/new" },
  { id: "contact", href: "/portal/office/contacts/new" },
  { id: "demand", href: "/portal/office/demands/new" },
  { id: "appointment", href: "/portal/office/calendar" },
] as const;

const ROLE_KEYS = ["owner", "manager", "office_manager", "agent"] as const;
type RoleKey = (typeof ROLE_KEYS)[number];

/** Raw role slugs are not a job title (633 A). Broker is the owner slug some payloads still send. */
const ROLE_NAMES = new Set<string>(["broker", ...ROLE_KEYS]);

const BOTTOM_IDS = ["summary", "contacts", "portfolios", "demands"] as const;

export type OfficeMenuIcon =
  | "home"
  | "building"
  | "people"
  | "search"
  | "link"
  | "calendar"
  | "chart"
  | "wallet"
  | "swap"
  | "key"
  | "sliders"
  | "grid"
  | "bell";

export type OfficeMenuItem = {
  id: string;
  href: string;
  label: string;
  bottomLabel: string;
  group: "work" | "manage";
  icon: OfficeMenuIcon;
};

export function portalLocale(value: string | null | undefined): Locale {
  if (value === "en" || value === "de" || value === "tr") return value;
  return "tr";
}

export function officeRoleBadge(role: string, locale: Locale): string {
  const key = role.trim().toLowerCase();
  if (isRoleKey(key)) return PORTAL_UX_COPY[locale].roles[key];
  return "";
}

export function dayPart(hour: number): "morning" | "afternoon" | "evening" {
  const normalized = Number.isFinite(hour) ? Math.floor(hour) : 0;
  const clock = ((normalized % 24) + 24) % 24;
  if (clock < 12) return "morning";
  if (clock < 18) return "afternoon";
  return "evening";
}

export function greetingTitle(hour: number, name: string, locale: Locale): string {
  const hello = PORTAL_UX_COPY[locale].greeting[dayPart(hour)];
  const who = name.trim();
  return who ? `${hello}, ${who}` : hello;
}

export function officeCaption(officeName: string, title: string, locale: Locale): string {
  const rank = cleanTitle(title);
  const safeRank = rank && !isRoleName(rank) ? rank : "";
  const office = officeName.trim();
  const officeText = office ? PORTAL_UX_COPY[locale].officeOf.replace("{name}", office) : "";
  if (safeRank && officeText) return `${safeRank} · ${officeText}`;
  return safeRank || officeText;
}

/** Greeting rank uses the profile screen. That screen has no unvan field, so this stays empty. */
export function personTitle(source: unknown): string {
  unwrapUser(source);
  return "";
}

export function officeMenu(role: OfficeRole, office: OfficeMembership | undefined, locale: Locale): OfficeMenuItem[] {
  const copy = PORTAL_UX_COPY[locale];
  const work: OfficeMenuItem[] = [
    item("summary", "/portal/office", copy.summary, "work", "home", copy.summary),
    item("portfolios", "/portal/office/portfolios", copy.portfolios, "work", "building"),
    item("contacts", "/portal/office/contacts", copy.contacts, "work", "people", copy.contacts),
    item("demands", "/portal/office/demands", copy.demands, "work", "search", copy.demands),
    item("matches", "/portal/office/matches", copy.matches, "work", "link"),
    item("calendar", "/portal/office/calendar", copy.calendar, "work", "calendar"),
  ];
  if (role === "agent") {
    work.push(item("reports", "/portal/office/reports", copy.performance, "work", "chart"));
    work.push(item("earnings", "/portal/office/earnings", copy.myEarnings, "work", "wallet"));
  } else {
    work.push(item("reports", "/portal/office/reports", copy.reportsAndEarnings, "work", "chart"));
  }
  work.push(item("collaborations", "/portal/office/collaborations", copy.collaborations, "work", "swap"));
  work.push(item("lease", "/portal/office/lease", copy.lease, "work", "key"));

  const manage: OfficeMenuItem[] = [];
  if (settingsAllowed("office", role, office)) {
    manage.push(item("office", "/portal/office/settings/office", copy.officeSettings, "manage", "sliders"));
  }
  if (settingsAllowed("team", role, office)) {
    manage.push(item("team", "/portal/office/settings/team", copy.team, "manage", "people"));
  }
  if (canManageOffice(role, office) || canWriteBranches(role)) {
    manage.push(item("branches", "/portal/office/branches", copy.branches, "manage", "grid"));
  }
  if (settingsAllowed("notifications", role, office)) {
    manage.push(item("notifications", "/portal/office/settings/notifications", copy.notifications, "manage", "bell"));
  }
  manage.push(item("settings", "/portal/office/settings", copy.settings, "manage", "sliders"));
  return [...work, ...manage];
}

export function officeBottomNav(items: readonly OfficeMenuItem[]): OfficeMenuItem[] {
  return BOTTOM_IDS.flatMap((id) => {
    const found = items.find((entry) => entry.id === id);
    return found ? [found] : [];
  });
}

export function officeSectionDenied(parts: readonly string[], role: OfficeRole, office: OfficeMembership | undefined): boolean {
  const head = parts[0] ?? "";
  if (!head) return false;
  if (head === "earnings" || (head === "reports" && parts[1] === "earnings")) return !canViewEarnings(role, office);
  if (head === "branches") return !(canManageOffice(role, office) || canWriteBranches(role));
  if (head === "settings") {
    const page = parts[1];
    if (!page) return false;
    return settingsPageAccess(page, role, office) !== "allow";
  }
  return false;
}

export function menuCurrent(id: string, parts: readonly string[], separateEarnings = true): boolean {
  if (id === "summary") return parts.length === 0 || parts[0] === "";
  if (id === "settings") return parts[0] === "settings" && parts.length === 1;
  if (id === "office") return parts[0] === "settings" && parts[1] === "office";
  if (id === "team") return parts[0] === "settings" && parts[1] === "team";
  if (id === "notifications") return parts[0] === "settings" && parts[1] === "notifications";
  if (id === "reports" && !separateEarnings) return parts[0] === "reports" || parts[0] === "earnings";
  return parts[0] === id;
}

export type ReportsTab = "reports" | "earnings";

/** Owner, manager, and office manager share one screen. The earnings tab needs the office flag. */
export function reportsHubTab(parts: readonly string[], tab: string | null | undefined, canSeeEarnings: boolean): ReportsTab {
  const asked = parts[1] === "earnings" || tab === "earnings";
  return asked && canSeeEarnings ? "earnings" : "reports";
}

export function earningsDeepLink(role: OfficeRole): string {
  if (role === "agent") return "/portal/office/earnings";
  return "/portal/office/reports?tab=earnings";
}

export function pendingWorkLabel(count: string, locale: Locale): string {
  return PORTAL_UX_COPY[locale].pendingWork.replace("{count}", count);
}

export function collaborationPath(direction: "in" | "out"): string {
  return `collaboration-requests?direction=${direction}`;
}

export type DashboardMeta = { scope: string; role: string };

export function dashboardMeta(payload: unknown): DashboardMeta {
  const body = payloadBody(payload);
  return {
    scope: textAt(body ?? {}, ["scope"]),
    role: textAt(body ?? {}, ["role"]),
  };
}

/** Office pending card follows the stats payload. A consultant 403 hides it. */
export function showPendingCard(meta: DashboardMeta, localRole: string, denied: boolean): boolean {
  if (denied) return false;
  const role = (meta.role || localRole).trim().toLowerCase();
  const scope = meta.scope.trim().toLowerCase();
  if (role === "agent") return false;
  if (scope === "mine" || scope === "own") return false;
  return true;
}

/** Logged-in office roles leave /portal. Franchise desk stays only for an admin without an office, or an admin who asked for it. */
export function portalLandingHref(user: unknown, lang?: string | null, desk?: string | null): string | null {
  if (showNetworkPortal(user)) return networkHome(lang);
  if (desk === "1" && isAdminUser(user)) return null;
  if (officesOf(user).length > 0 || !isAdminUser(user)) return officeHome(lang);
  return null;
}

export function officeHome(lang?: string | null): string {
  return withLang("/portal/office", lang);
}

export function withLang(path: string, lang?: string | null): string {
  const locale = portalLocale(lang);
  if (locale === "tr") return path;
  const hashAt = path.indexOf("#");
  const bare = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const hash = hashAt >= 0 ? path.slice(hashAt) : "";
  const [base, query] = bare.split("?");
  const params = new URLSearchParams(query ?? "");
  params.set("lang", locale);
  return `${base}?${params.toString()}${hash}`;
}

export function networkChrome(): {
  sections: string[];
  officeSelector: false;
  quickActions: readonly [];
  writes: readonly string[];
} {
  return {
    sections: NETWORK_MENU.map((entry) => entry.section),
    officeSelector: false,
    quickActions: [],
    writes: networkWriteControls(),
  };
}

export type SummaryFigures = {
  active: number;
  activeDelta: number | null;
  pending: number;
  matches: number | null;
  matchesAreWeek: boolean;
  earnings: number | null;
  closings: number | null;
};

export function summaryFigures(stats: unknown, pending: unknown, showEarnings: boolean): SummaryFigures {
  const body = payloadBody(stats);
  const added = explicitStat(body, "portfolios_added_this_month");
  const week = explicitStat(body, "new_matches_last_7_days");
  const monthClosings = explicitStat(body, "closings_this_month");
  const monthEarnings = explicitStat(body, "earnings_this_month");
  return {
    active: numberAt(body, ["portfolios.active", "active_portfolios"]) ?? 0,
    activeDelta: added.present ? added.value : numberAt(body, ["portfolios.added_this_month", "portfolios.new_this_month", "portfolios.this_month"]),
    pending: (pending == null ? null : pendingCount(pending)) ?? numberAt(body, ["portfolios.pending", "portfolios.pending_approval", "pending_approvals"]) ?? 0,
    matches: week.present ? week.value : numberAt(body, ["matches.new", "matches.recent", "matches.last_7_days", "new_matches"]) ?? 0,
    matchesAreWeek: week.present ? week.value != null : numberAt(body, ["matches.last_7_days"]) !== null,
    earnings: !showEarnings ? null : monthEarnings.present ? monthEarnings.value : numberAt(body, ["financials.earnings", "financials.this_month", "earnings.this_month", "financials.income"]) ?? 0,
    closings: !showEarnings ? null : monthClosings.present ? monthClosings.value : numberAt(body, ["closings.this_month", "this_month_closings"]) ?? 0,
  };
}

export type PendingPortfolio = { id: string; title: string; meta: string };

export function pendingPortfolios(payload: unknown): PendingPortfolio[] {
  const body = payloadBody(payload);
  if (!body) return [];
  const rows = [...rowsAt(body, "pending_activations"), ...rowsAt(body, "pending_closings")];
  return rows.flatMap((row, index) => {
    const title = textAt(row, ["title", "name"]);
    if (!title) return [];
    const id = textAt(row, ["id"]) || String(index);
    const meta = [textAt(row, ["agent_name", "owner_name", "contact_name"]), textAt(row, ["type", "stage"])].filter(Boolean).join(" · ");
    return [{ id, title, meta }];
  });
}

export type AppointmentLine = { id: string; time: string; title: string; meta: string };

export function appointmentLines(payload: unknown, now: Date, locale: Locale): AppointmentLine[] {
  const body = payloadBody(payload);
  const rows = Array.isArray(payload)
    ? payload.filter(isRecord)
    : [...rowsAt(body, "appointments"), ...rowsAt(body, "upcoming_appointments"), ...rowsAt(body, "data"), ...rowsAt(body, "items")];
  const seen = new Set<string>();
  const lines: AppointmentLine[] = [];
  rows.forEach((row, index) => {
    const raw = row.starts_at ?? row.start_at ?? row.startsAt ?? row.scheduled_at ?? row.date;
    const date = new Date(typeof raw === "string" || typeof raw === "number" ? raw : "");
    if (Number.isNaN(date.getTime()) || !sameDay(date, now)) return;
    const title = textAt(row, ["title", "subject", "name"]);
    if (!title) return;
    const id = textAt(row, ["id"]) || `${index}`;
    if (seen.has(id)) return;
    seen.add(id);
    lines.push({
      id,
      time: new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { hour: "2-digit", minute: "2-digit" }).format(date),
      title,
      meta: textAt(row, ["contact_name", "agent_name", "person", "location"]),
    });
  });
  return lines;
}

export function notificationBadge(payload: unknown): number | null {
  if (isRecord(payload) && typeof payload.unread_count === "number" && Number.isFinite(payload.unread_count)) {
    return Math.max(0, payload.unread_count);
  }
  const body = payloadBody(payload);
  if (!body) return null;
  if (typeof body.unread_count === "number" && Number.isFinite(body.unread_count)) return Math.max(0, body.unread_count);
  if (typeof body.unread === "number" && Number.isFinite(body.unread)) return Math.max(0, body.unread);
  const rows = notificationRows(body);
  if (rows.some((row) => "read" in row || "is_read" in row)) {
    return rows.filter((row) => row.read === false || row.is_read === false).length;
  }
  return null;
}

export type NotificationLine = { id: string; title: string; meta: string; href: string };

export function notificationLines(payload: unknown): NotificationLine[] {
  const rows = notificationRows(payloadBody(payload));
  return rows.flatMap((row, index) => {
    const title = textAt(row, ["title", "subject", "message", "name"]);
    if (!title) return [];
    return [{
      id: textAt(row, ["id"]) || String(index),
      title,
      meta: textAt(row, ["body", "meta", "subtitle", "created_at"]),
      href: safeLink(textAt(row, ["link"])),
    }];
  });
}

export type SearchHit = { id: string; title: string };

export type SearchGroups = { portfolios: SearchHit[]; demands: SearchHit[]; contacts: SearchHit[] };

/** `q` is 2–120 characters. Shorter or longer queries are not sent. */
export function searchPath(query: string, limit = 8): string | null {
  const text = query.trim();
  if (text.length < 2 || text.length > 120) return null;
  const size = Number.isFinite(limit) ? Math.min(20, Math.max(1, Math.floor(limit))) : 8;
  return `global-search?q=${encodeURIComponent(text)}&limit=${size}`;
}

export function readSearchGroups(payload: unknown): SearchGroups {
  const root = isRecord(payload) ? payload : {};
  const data = isRecord(root.data) ? root.data : root;
  return {
    portfolios: searchHits(data.portfolios),
    demands: searchHits(data.demands),
    contacts: searchHits(data.contacts),
  };
}

function item(
  id: string,
  href: string,
  label: string,
  group: OfficeMenuItem["group"],
  icon: OfficeMenuIcon,
  bottomLabel = label,
): OfficeMenuItem {
  return { id, href, label, bottomLabel, group, icon };
}

function isRoleKey(value: string): value is RoleKey {
  return (ROLE_KEYS as readonly string[]).includes(value);
}

function isRoleName(value: string): boolean {
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ROLE_NAMES.has(key);
}

function cleanTitle(value: string): string {
  return value.trim().replace(/^[-–—\s]+|[-–—\s]+$/g, "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapUser(source: unknown): Record<string, unknown> {
  const root = isRecord(source) ? source : null;
  if (!root) return {};
  const data = isRecord(root.data) ? root.data : null;
  if (data && isRecord(data.user)) return data.user;
  if (isRecord(root.user)) return root.user;
  return root;
}

function isAdminUser(user: unknown): boolean {
  return unwrapUser(user).is_admin === true;
}

function officesOf(user: unknown): unknown[] {
  const offices = unwrapUser(user).offices;
  return Array.isArray(offices) ? offices : [];
}

function payloadBody(source: unknown): Record<string, unknown> | null {
  if (Array.isArray(source)) return { data: source };
  if (!isRecord(source)) return null;
  if (isRecord(source.data)) return source.data;
  return source;
}

function rowsAt(body: Record<string, unknown> | null, key: string): Record<string, unknown>[] {
  const value = body?.[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function textAt(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function numberAt(body: Record<string, unknown> | null, paths: string[]): number | null {
  if (!body) return null;
  for (const path of paths) {
    let current: unknown = body;
    let found = true;
    for (const key of path.split(".")) {
      if (!isRecord(current) || !(key in current)) {
        found = false;
        break;
      }
      current = current[key];
    }
    if (!found || current == null || current === "") continue;
    const parsed = Number(current);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pendingCount(pending: unknown): number {
  const body = payloadBody(pending);
  if (!body) return 0;
  const counts = isRecord(body.counts) ? body.counts : null;
  if (counts && ("activations" in counts || "closings" in counts)) {
    return (finite(counts.activations) ?? 0) + (finite(counts.closings) ?? 0);
  }
  if (counts && "portfolios" in counts) return finite(counts.portfolios) ?? 0;
  const listed = rowsAt(body, "pending_activations").length + rowsAt(body, "pending_closings").length;
  if (listed > 0) return listed;
  return numberAt(body, ["pending", "portfolios.pending", "portfolios.pending_approval"]) ?? 0;
}

function explicitStat(body: Record<string, unknown> | null, key: string): { present: boolean; value: number | null } {
  if (!body || !Object.prototype.hasOwnProperty.call(body, key)) return { present: false, value: null };
  const current = body[key];
  if (current == null || current === "") return { present: true, value: null };
  const parsed = Number(current);
  return { present: true, value: Number.isFinite(parsed) ? parsed : null };
}

function searchHits(value: unknown): SearchHit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row, index) => {
    if (!isRecord(row)) return [];
    const title = textAt(row, ["title", "name", "full_name"]);
    if (!title) return [];
    return [{ id: textAt(row, ["id"]) || String(index), title }];
  });
}

function safeLink(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "";
  return value;
}

function finite(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameDay(date: Date, now: Date): boolean {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function notificationRows(body: Record<string, unknown> | null): Record<string, unknown>[] {
  const notes = rowsAt(body, "notifications");
  if (notes.length > 0) return notes;
  const items = rowsAt(body, "items");
  if (items.length > 0) return items;
  return rowsAt(body, "data");
}
