export type OfficeRecord = Record<string, unknown>;

export class OfficeError extends Error {
  labels: string[];
  kinds: string[];
  status: number;

  constructor(message: string, labels: string[] = [], kinds: string[] = [], status = 0) {
    super(message);
    this.labels = labels;
    this.kinds = kinds;
    this.status = status;
  }
}

const readCache = new Map<string, { at: number; body: OfficeRecord }>();
const READ_TTL_MS = 20_000;
const CACHED_GET = /^(me$|portfolios$|categories(?:[/?]|$)|locations\/(?:cities$|districts\?|neighborhoods\?)|dashboard\/|duty-roster\/today$)/;

/** Category and location reads depend on the office header or the query string. The browser must not reuse them. */
export function officeHttpCache(path: string, method = "GET"): RequestCache {
  const verb = method.toUpperCase();
  if (verb !== "GET") return "reload";
  if (path === "categories" || path.startsWith("categories/") || path.startsWith("categories?") || path.startsWith("locations/")) {
    return "no-store";
  }
  return CACHED_GET.test(path) ? "default" : "reload";
}
const STORAGE_PREFIX = "sk-office-read:";
let bypassBrowserCacheUntil = 0;

export function clearOfficeReads(): void {
  readCache.clear();
  bypassBrowserCacheUntil = 0;
  clearStoredReads();
}

export async function officeCall(
  path: string,
  officeId: number | null,
  init?: { method?: string; body?: unknown; form?: FormData },
): Promise<OfficeRecord> {
  const method = (init?.method ?? "GET").toUpperCase();
  const cacheKey = `${officeId ?? 0}:${path}`;
  const cacheable = method === "GET" && CACHED_GET.test(path);
  if (cacheable) {
    const hit = readCache.get(cacheKey) ?? readStored(cacheKey);
    if (hit && Date.now() - hit.at < READ_TTL_MS) {
      readCache.set(cacheKey, hit);
      return hit.body;
    }
  } else if (method !== "GET") {
    readCache.clear();
    bypassBrowserCacheUntil = Date.now() + READ_TTL_MS;
    clearStoredReads();
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (officeId) {
    headers["X-Portal-Office"] = String(officeId);
  }
  let body: BodyInit | undefined;
  if (init?.form) {
    body = init.form;
  } else if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  const response = await fetch(`/api/v1/portal/office/${path.replace(/^\//, "")}`, {
    method,
    credentials: "include",
    cache: bypassBrowserCacheUntil > Date.now() ? "reload" : officeHttpCache(path, method),
    headers,
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as OfficeRecord;
  if (!response.ok) {
    throw new OfficeError(errorText(payload), missingLabels(payload), missingKinds(payload), response.status);
  }
  if (cacheable && !isEmptyList(payload)) {
    const entry = { at: Date.now(), body: payload };
    readCache.set(cacheKey, entry);
    writeStored(cacheKey, entry);
  }
  return payload;
}

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function readStored(key: string): { at: number; body: OfficeRecord } | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(STORAGE_PREFIX + key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { at?: unknown; body?: unknown };
    if (typeof parsed.at !== "number" || !isRecord(parsed.body)) return null;
    return { at: parsed.at, body: parsed.body };
  } catch {
    return null;
  }
}

function writeStored(key: string, entry: { at: number; body: OfficeRecord }): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // A full tab store must not fail the read itself.
  }
}

function clearStoredReads(): void {
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => store.removeItem(key));
}

export async function publicCall(path: string, init?: { method?: string; body?: unknown }): Promise<OfficeRecord> {
  const response = await fetch(`/api/v1/portal/public/${path.replace(/^\//, "")}`, {
    method: init?.method ?? "GET",
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as OfficeRecord;
  if (!response.ok) {
    throw new OfficeError(errorText(payload), [], [], response.status);
  }
  return payload;
}

function missingItems(payload: OfficeRecord): OfficeRecord[] {
  return Array.isArray(payload.missing) ? payload.missing.filter(isRecord) : [];
}

function missingLabels(payload: OfficeRecord): string[] {
  return missingItems(payload).flatMap((item) => (typeof item.label === "string" ? [item.label] : []));
}

function missingKinds(payload: OfficeRecord): string[] {
  return missingItems(payload).flatMap((item) => (typeof item.kind === "string" ? [item.kind] : []));
}

export function errorText(payload: OfficeRecord): string {
  const labels = missingLabels(payload);
  if (typeof payload.message === "string" && payload.message) {
    return labels.length > 0 ? `${payload.message} ${labels.join(", ")}` : payload.message;
  }
  const errors = payload.errors;
  if (errors && typeof errors === "object") {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
  }
  return "İşlem tamamlanamadı.";
}

export function isRecord(value: unknown): value is OfficeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function rows(payload: unknown): OfficeRecord[] {
  const direct = asRows(payload);
  if (direct) return direct;
  if (!isRecord(payload)) return [];
  for (const key of ["data", "categories", "items"]) {
    const nested = payload[key];
    const found = asRows(nested);
    if (found) return found;
    if (isRecord(nested) && Array.isArray(nested.data)) return nested.data.filter(isRecord);
  }
  return [];
}

function asRows(value: unknown): OfficeRecord[] | null {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.length === 0 || keys.some((key) => !/^\d+$/.test(key))) return null;
  return Object.values(value).filter(isRecord);
}

function isEmptyList(payload: unknown): boolean {
  if (Array.isArray(payload)) return payload.length === 0;
  return isRecord(payload) && Array.isArray(payload.data) && payload.data.length === 0;
}

export function one(payload: unknown): OfficeRecord | null {
  if (!isRecord(payload)) {
    return null;
  }
  if (isRecord(payload.data)) {
    return payload.data;
  }
  return payload;
}

export function text(row: OfficeRecord, keys: string[]): string {
  const person = `${typeof row.first_name === "string" ? row.first_name : ""} ${typeof row.last_name === "string" ? row.last_name : ""}`.trim();
  if (person && keys.includes("first_name")) {
    return person;
  }
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return String(row.id ?? "");
}
