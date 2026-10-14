export type OfficeRecord = Record<string, unknown>;

export class OfficeError extends Error {
  labels: string[];
  kinds: string[];

  constructor(message: string, labels: string[] = [], kinds: string[] = []) {
    super(message);
    this.labels = labels;
    this.kinds = kinds;
  }
}

export async function officeCall(
  path: string,
  officeId: number | null,
  init?: { method?: string; body?: unknown; form?: FormData },
): Promise<OfficeRecord> {
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
    method: init?.method ?? "GET",
    credentials: "include",
    headers,
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as OfficeRecord;
  if (!response.ok) {
    throw new OfficeError(errorText(payload), missingLabels(payload), missingKinds(payload));
  }
  return payload;
}

export async function publicCall(path: string, init?: { method?: string; body?: unknown }): Promise<OfficeRecord> {
  const response = await fetch(`/api/v1/portal/public/${path.replace(/^\//, "")}`, {
    method: init?.method ?? "GET",
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as OfficeRecord;
  if (!response.ok) {
    throw new OfficeError(errorText(payload));
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
