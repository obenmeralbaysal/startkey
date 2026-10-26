import type { Locale } from "@/lib/locales";
import type {
  NetworkConsultant,
  NetworkOffice,
  NetworkOwner,
  NetworkPage,
  NetworkPagination,
  NetworkQuery,
  NetworkRole,
  NetworkSection,
  NetworkSummary,
} from "@/types/portal-network";

const CONTACT_KEYS = new Set([
  "phone",
  "phone_number",
  "mobile",
  "mobile_phone",
  "telephone",
  "tel",
  "gsm",
  "email",
  "e_mail",
  "mail",
  "contact_email",
  "contact_phone",
]);

export const NETWORK_MENU: Array<{ section: NetworkSection; icon: "chart" | "building" | "people" }> = [
  { section: "summary", icon: "chart" },
  { section: "offices", icon: "building" },
  { section: "consultants", icon: "people" },
];

/** Read-only franchise network. No create, edit, or delete controls. */
export function networkWriteControls(): readonly string[] {
  return [];
}

export function networkUsesMock(flag: string | undefined = process.env.NEXT_PUBLIC_PORTAL_NETWORK_MOCK): boolean {
  return flag === "1" || flag === "true";
}

export function networkLang(value: string | null | undefined): Locale {
  if (value === "en" || value === "de" || value === "tr") return value;
  return "tr";
}

export function networkRole(payload: unknown): NetworkRole | null {
  const role = readRole(payload);
  if (role === "franchise_admin" || role === "franchise_staff") return role;
  return null;
}

/** Office selection is skipped only for a network-context franchise reader. */
export function showNetworkPortal(payload: unknown): boolean {
  return readContext(payload) === "network" && networkRole(payload) !== null;
}

/**
 * Franchise readers open the network screens. An explicit office context stays
 * on the office portal. A franchise role without a context still does: the
 * login payload sometimes carries the role before context is copied onto /me.
 */
export function openNetworkHome(payload: unknown): boolean {
  if (readContext(payload) === "office") return false;
  return networkRole(payload) !== null;
}

export function networkHome(lang: string | null | undefined): string {
  return networkHref("summary", { lang: networkLang(lang) });
}

export const NETWORK_OFFICE_MISSING = "Ofis bulunamadı";

/** Consultant filter whose `office_id` is outside the signed-in franchise network. */
export const NETWORK_OFFICE_DENIED = "Ofis bulunamadı / erişim yok";

/** `/portal/network/offices/{id}` — a franchise office detail id, or null. */
export function networkOfficeId(parts: readonly string[]): number | null {
  if (parts.length !== 2 || parts[0] !== "offices") return null;
  if (!/^[1-9]\d*$/.test(parts[1])) return null;
  const id = Number(parts[1]);
  return Number.isSafeInteger(id) ? id : null;
}

export function sectionFromParts(parts: readonly string[]): NetworkSection | null {
  if (parts.length === 0) return "summary";
  if (parts.length !== 1) return null;
  if (parts[0] === "summary") return "summary";
  if (parts[0] === "offices") return "offices";
  if (parts[0] === "consultants") return "consultants";
  return null;
}

export function sectionFromPath(pathname: string): NetworkSection | null {
  const path = pathname.split("?")[0].replace(/\/+$/, "");
  const at = path.indexOf("/portal/network");
  if (at < 0) return null;
  const rest = path.slice(at);
  if (rest === "/portal/network" || rest === "/portal/network/summary") return "summary";
  if (rest === "/portal/network/offices") return "offices";
  if (rest === "/portal/network/consultants") return "consultants";
  return null;
}

/** `/{tr|en|de}/portal/...` is the public catch-all and 404s. Send it to the portal route. */
export function localePortalRedirect(pathname: string): string | null {
  const match = pathname.match(/^\/(?:tr|en|de)(\/portal(?:\/.*)?)$/);
  return match?.[1] ?? null;
}

const PORTAL_LIMIT_REQUESTS = "admin/portal-limit-requests";

export function isPortalLimitRequest(path: string): boolean {
  const clean = path.split("?")[0].replace(/^\/+/, "").replace(/\/+$/, "");
  return clean === PORTAL_LIMIT_REQUESTS || clean.endsWith(`/${PORTAL_LIMIT_REQUESTS}`);
}

/** Franchise readers never load the super-admin limit queue. */
export function skipPortalLimitRequests(viewer: unknown): boolean {
  return openNetworkHome(viewer);
}

/** A 403 from that queue is an empty list, not a broken offices page. */
export function emptyLimitPayload(status: number): { data: [] } | null {
  return status === 403 ? { data: [] } : null;
}

export function networkHref(section: NetworkSection, query: NetworkQuery = {}): string {
  const params = new URLSearchParams();
  const lang = query.lang ? networkLang(query.lang) : null;
  if (lang && lang !== "tr") params.set("lang", lang);
  const q = query.q?.trim();
  if (q) params.set("q", q);
  if (query.office_id && /^[1-9]\d*$/.test(query.office_id)) params.set("office_id", query.office_id);
  if (query.page && query.page !== "1" && /^[1-9]\d*$/.test(query.page)) params.set("page", query.page);
  const qs = params.toString();
  const path = section === "summary"
    ? "/portal/network/summary"
    : section === "offices"
      ? "/portal/network/offices"
      : "/portal/network/consultants";
  return qs ? `${path}?${qs}` : path;
}

export function officeConsultantsHref(officeId: number, lang: Locale): string {
  return networkHref("consultants", { office_id: String(officeId), lang });
}

export function networkApiUrl(section: NetworkSection, query: NetworkQuery = {}): string {
  const params = new URLSearchParams();
  if (query.page && /^[1-9]\d*$/.test(query.page)) params.set("page", query.page);
  const q = query.q?.trim();
  if (q) params.set("q", q);
  if (section === "consultants" && query.office_id && /^[1-9]\d*$/.test(query.office_id)) {
    params.set("office_id", query.office_id);
  }
  const qs = params.toString();
  const path = `/api/v1/portal/network/${section}`;
  return qs ? `${path}?${qs}` : path;
}

const OFFICE_ROLE_TITLES: Record<"owner" | "manager" | "office_manager" | "agent", Record<Locale, string>> = {
  owner: { tr: "Ofis Sahibi", en: "Owner", de: "Inhaber" },
  manager: { tr: "Müdür", en: "Manager", de: "Leiter" },
  office_manager: { tr: "Ofis Yöneticisi", en: "Office Manager", de: "Büroleiter" },
  agent: { tr: "Gayrimenkul Danışmanı", en: "Real Estate Consultant", de: "Immobilienberater" },
};

/** Office role slug shown as the consultant title. Unknown text is returned without markup. */
export function consultantTitle(value: string | null, locale: Locale): string {
  if (!value) return "";
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "owner" || key === "manager" || key === "office_manager" || key === "agent") {
    return OFFICE_ROLE_TITLES[key][locale];
  }
  return value.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function withoutContacts<T>(value: T): T {
  return strip(value) as T;
}

export function toSummary(value: unknown): NetworkSummary {
  const record = asRecord(value);
  const source = asRecord(record?.data) ?? record;
  return {
    offices: asCount(source?.offices),
    consultants: asCount(source?.consultants),
    active_portfolios: asCount(source?.active_portfolios),
    branches: asCount(source?.branches),
    updated_at: typeof source?.updated_at === "string" ? source.updated_at : null,
  };
}

export function toOffice(value: unknown): NetworkOffice | null {
  const row = asRecord(withoutContacts(value));
  if (!row) return null;
  const id = asId(row.id);
  if (id === null) return null;
  const owners = asOwners(row.owners);
  const owner = owners[0] ?? asOwner(row.owner);
  return {
    id,
    name: asText(row.name),
    city: asOptionalText(row.city),
    logo: asOptionalText(row.logo),
    consultant_count: asCount(row.consultant_count),
    portfolio_count: asCount(row.portfolio_count),
    owners: owners.length > 0 ? owners : owner ? [owner] : [],
    owner,
  };
}

export function toConsultant(value: unknown): NetworkConsultant | null {
  const row = asRecord(withoutContacts(value));
  if (!row) return null;
  const id = asId(row.id);
  if (id === null) return null;
  const office = asRecord(row.office);
  const officeId = office ? asId(office.id) : null;
  return {
    id,
    name: asText(row.name),
    title: asOptionalText(row.title),
    office: office && officeId !== null ? { id: officeId, name: asText(office.name) } : null,
    photo: asOptionalText(row.photo),
    portfolio_count: asCount(row.portfolio_count),
  };
}

export function toPage<T>(value: unknown, mapRow: (row: unknown) => T | null): NetworkPage<T> {
  const record = asRecord(withoutContacts(value));
  const rows = Array.isArray(record?.data) ? record.data : [];
  return {
    data: rows.map(mapRow).filter((row): row is T => row !== null),
    pagination: toPagination(record?.pagination, rows.length),
  };
}

export function formatUpdatedAt(value: string | null, locale: Locale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const tag = locale === "en" ? "en-GB" : locale;
  return new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function pageStatus(template: string, page: number, pages: number): string {
  return template.replace("{page}", String(page)).replace("{pages}", String(pages));
}

const MOCK_OFFICES: NetworkOffice[] = [
  { id: 1, name: "StartKey Kadıköy", city: "İstanbul", logo: "/portal/img/startkey_logo.png", consultant_count: 6, portfolio_count: 40 },
  { id: 2, name: "StartKey Çankaya", city: "Ankara", logo: null, consultant_count: 4, portfolio_count: 18 },
  { id: 3, name: "StartKey Konak", city: "İzmir", logo: null, consultant_count: 3, portfolio_count: 11 },
];

const MOCK_CONSULTANTS: NetworkConsultant[] = [
  { id: 11, name: "Ayşe Demir", title: "agent", office: { id: 1, name: "StartKey Kadıköy" }, photo: null, portfolio_count: 8 },
  { id: 12, name: "Kerem Aydın", title: "owner", office: { id: 1, name: "StartKey Kadıköy" }, photo: null, portfolio_count: 5 },
  { id: 13, name: "Elif Kaya", title: "manager", office: { id: 2, name: "StartKey Çankaya" }, photo: null, portfolio_count: 3 },
  { id: 14, name: "Mert Soylu", title: "office_manager", office: { id: 3, name: "StartKey Konak" }, photo: null, portfolio_count: 2 },
];

const MOCK_SUMMARY: NetworkSummary = {
  offices: 12,
  consultants: 48,
  active_portfolios: 320,
  branches: 7,
  updated_at: "2026-10-26T07:30:00Z",
};

export function mockSummary(): NetworkSummary {
  return MOCK_SUMMARY;
}

export function mockOffices(): NetworkOffice[] {
  return MOCK_OFFICES;
}

export function mockConsultants(): NetworkConsultant[] {
  return MOCK_CONSULTANTS;
}

export function mockOfficePage(query: NetworkQuery): NetworkPage<NetworkOffice> {
  const filtered = MOCK_OFFICES.filter((office) => matches(`${office.name} ${office.city ?? ""}`, query.q));
  return paginate(filtered, query.page);
}

export function mockConsultantPage(query: NetworkQuery): NetworkPage<NetworkConsultant> {
  const officeId = query.office_id && /^[1-9]\d*$/.test(query.office_id) ? Number(query.office_id) : null;
  const filtered = MOCK_CONSULTANTS.filter((row) => {
    if (officeId !== null && row.office?.id !== officeId) return false;
    const titles = (["tr", "en", "de"] as const).map((locale) => consultantTitle(row.title, locale)).join(" ");
    return matches(`${row.name} ${row.title ?? ""} ${titles} ${row.office?.name ?? ""}`, query.q);
  });
  return paginate(filtered, query.page);
}

function paginate<T>(rows: T[], pageRaw: string | undefined): NetworkPage<T> {
  const perPage = 20;
  const totalPages = rows.length === 0 ? 0 : Math.ceil(rows.length / perPage);
  const current = pageRaw && /^[1-9]\d*$/.test(pageRaw)
    ? Math.min(Math.max(totalPages, 1), Number(pageRaw))
    : 1;
  const start = (current - 1) * perPage;
  const data = rows.slice(start, start + perPage);
  const pagination: NetworkPagination = {
    current_page: current,
    per_page: perPage,
    total_items: rows.length,
    total_pages: totalPages,
  };
  return { data, pagination };
}

function matches(haystack: string, q: string | undefined): boolean {
  const needle = q?.trim().toLocaleLowerCase("tr-TR");
  if (!needle) return true;
  return haystack.toLocaleLowerCase("tr-TR").includes(needle);
}

function readContext(payload: unknown): string | null {
  for (const record of records(payload)) {
    if (typeof record.context === "string") return record.context;
  }
  return null;
}

function readRole(payload: unknown): string | null {
  let fallback: string | null = null;
  for (const record of records(payload)) {
    for (const key of ["role", "role_slug"] as const) {
      const value = record[key];
      if (typeof value !== "string" || value === "") continue;
      if (value === "franchise_admin" || value === "franchise_staff") return value;
      if (fallback === null) fallback = value;
    }
  }
  return fallback;
}

function records(payload: unknown): Array<Record<string, unknown>> {
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const user = asRecord(nested?.user) ?? asRecord(record.user);
  return [nested, user, record].filter((item): item is Record<string, unknown> => item !== null);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asId(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" && /^[1-9]\d*$/.test(value) ? Number(value) : 0;
  return Number.isInteger(number) && number > 0 ? number : null;
}

function asCount(value: unknown): number {
  const number = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : 0;
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asOwners(value: unknown): NetworkOwner[] {
  if (!Array.isArray(value)) return [];
  return value.map(asOwner).filter((row): row is NetworkOwner => row !== null);
}

function asOwner(value: unknown): NetworkOwner | null {
  const row = asRecord(value);
  if (!row) return null;
  const id = asId(row.id);
  if (id === null) return null;
  const name = asText(row.name).trim() || `${asText(row.first_name)} ${asText(row.last_name)}`.trim();
  if (name === "") return null;
  return { id, name, title: asOptionalText(row.title) };
}

function asOptionalText(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function toPagination(value: unknown, count: number): NetworkPagination {
  const page = asRecord(value);
  const perPage = Math.max(1, asCount(page?.per_page) || 20);
  const totalItems = page && "total_items" in page ? asCount(page.total_items) : count;
  const totalPages = page && "total_pages" in page
    ? asCount(page.total_pages)
    : (totalItems === 0 ? 0 : Math.ceil(totalItems / perPage));
  return {
    current_page: Math.max(1, asCount(page?.current_page) || 1),
    per_page: perPage,
    total_items: totalItems,
    total_pages: totalPages,
  };
}

function strip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strip);
  const record = asRecord(value);
  if (!record) return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(record)) {
    if (CONTACT_KEYS.has(key.toLowerCase())) continue;
    out[key] = strip(child);
  }
  return out;
}
