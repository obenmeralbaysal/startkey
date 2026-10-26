import { emptyLimitPayload, isPortalLimitRequest, skipPortalLimitRequests } from "@/lib/portal-network";

import { watermarkActivationMessage } from "./watermark";
import { errorText as portalErrorText, fieldErrors, type FieldErrors } from "./api-error";

export type { FieldErrors } from "./api-error";
export { fieldErrors } from "./api-error";

export type OfficeRecord = Record<string, unknown>;

export class OfficeError extends Error {
  labels: string[];
  kinds: string[];
  status: number;
  fields: FieldErrors;

  constructor(message: string, labels: string[] = [], kinds: string[] = [], status = 0, fields: FieldErrors = {}) {
    super(message);
    this.labels = labels;
    this.kinds = kinds;
    this.status = status;
    this.fields = fields;
  }
}

const readCache = new Map<string, { at: number; body: OfficeRecord }>();
const READ_TTL_MS = 20_000;
const CACHED_GET = /^(me$|portfolios$|categories(?:[/?]|$)|locations\/(?:cities$|districts\?|neighborhoods\?)|dashboard\/|duty-roster\/today$)/;
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
  init?: { method?: string; body?: unknown; form?: FormData; viewer?: unknown },
): Promise<OfficeRecord> {
  if (isPortalLimitRequest(path) && skipPortalLimitRequests(init?.viewer)) {
    return { data: [] };
  }
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
    cache: cacheable && Date.now() >= bypassBrowserCacheUntil ? "default" : "reload",
    headers,
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as OfficeRecord;
  if (!response.ok) {
    if (isPortalLimitRequest(path) && emptyLimitPayload(response.status)) {
      return { data: [] };
    }
    const fields = fieldErrors(payload);
    throw new OfficeError(errorText(payload), missingLabels(payload), missingKinds(payload), response.status, fields);
  }
  if (cacheable) {
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
    throw new OfficeError(errorText(payload), [], [], response.status, fieldErrors(payload));
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
  const watermark = watermarkActivationMessage(payload);
  if (watermark) return watermark;
  return portalErrorText(payload, missingLabels(payload));
}

export function isRecord(value: unknown): value is OfficeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function rows(payload: unknown): OfficeRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }
  if (!isRecord(payload)) {
    return [];
  }
  if (Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }
  if (isRecord(payload.data) && Array.isArray(payload.data.data)) {
    return payload.data.data.filter(isRecord);
  }
  return [];
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
