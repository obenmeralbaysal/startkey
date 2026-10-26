export const TTBS_REQUIRED = "TTBS yetki belge numarası zorunludur.";
export const DUPLICATE_EMAIL = "Bu e-posta ekipte zaten var.";
export const APPROVAL_SENT = "Onaya gönderildi";
export const LOGO_NOTE = "Logo ve marka rengini StartKey yönetimi belirler.";

/** Portal path for GET/PUT /api/v1/office/settings. */
export const OFFICE_SETTINGS_GROUP = "office";
export const OFFICE_SETTINGS_PATH = "office/settings";

/** STUB until MD backlog 6. team POST does not accept these yet. */
export const TEAM_EXTRAS_STUB = "branch-ttbs";

export const BULK_RATE_PATH = "commission-policy/changes";

export type OfficeProfileInput = {
  name: string;
  phone: string;
  address: string;
  sahibinden_store_url: string;
  ttbs_no: string;
};

export type OfficeRules = {
  require_owner_approval: boolean;
  requires_closing_verification: boolean;
  managers_can_view_earnings: boolean;
};

export type OfficeSettingsGroup = OfficeProfileInput & {
  rules: OfficeRules;
};

export type OfficeFieldError = {
  field: "name" | "address" | "ttbs_no";
  message: string;
};

export type OfficeFieldMessages = {
  name: string;
  address: string;
  ttbs: string;
};

export function officeFieldError(input: OfficeProfileInput, messages: OfficeFieldMessages): OfficeFieldError | null {
  if (!input.name.trim()) return { field: "name", message: messages.name };
  if (!input.address.trim()) return { field: "address", message: messages.address };
  if (!input.ttbs_no.trim()) return { field: "ttbs_no", message: messages.ttbs };
  return null;
}

export function officeSettingsBody(input: OfficeProfileInput): {
  name: string;
  address: string;
  sahibinden_store_url: string;
  ttbs_no: string;
} {
  return {
    name: input.name.trim(),
    address: input.address.trim(),
    sahibinden_store_url: input.sahibinden_store_url.trim(),
    ttbs_no: input.ttbs_no.trim(),
  };
}

export function officeSettingsOutcome(status: number): "saved" | "missing" | "error" {
  if (status >= 200 && status < 300) return "saved";
  if (status === 404) return "missing";
  return "error";
}

export type OfficeSettingsView = {
  profile: OfficeProfileInput;
  rules: OfficeRules;
  logoUrl: string;
  brandColor: string;
};

export function readOfficeSettings(payload: unknown): OfficeSettingsView {
  const group = officeGroup(payload);
  return {
    profile: {
      name: stringAt(group, ["name", "office_name"]),
      phone: stringAt(group, ["phone", "telephone"]),
      address: stringAt(group, ["address"]),
      sahibinden_store_url: stringAt(group, ["sahibinden_store_url", "sahibinden_url", "store_url"]),
      ttbs_no: stringAt(group, ["ttbs_no", "ttbs", "authorization_no"]),
    },
    rules: {
      require_owner_approval: boolAt(group, ["require_owner_approval", "rules.require_owner_approval"]),
      requires_closing_verification: boolAt(group, ["requires_closing_verification", "rules.requires_closing_verification"]),
      managers_can_view_earnings: boolAt(group, ["managers_can_view_earnings", "rules.managers_can_view_earnings"]),
    },
    logoUrl: stringAt(group, ["logo_url", "logo", "brand_logo_url"]),
    brandColor: stringAt(group, ["brand_color", "brand_colour", "color"]),
  };
}

export function readMinMatchScore(payload: unknown): string {
  const root = unwrap(payload);
  const value = valueAt(root, ["min_match_score", "data.min_match_score"]);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

export function matchmakingScoreBody(score: number, current: unknown): { min_match_score: number; weights: unknown[] } {
  const root = unwrap(current);
  const weights = valueAt(root, ["weights", "data.weights"]);
  return {
    min_match_score: score,
    weights: Array.isArray(weights) ? weights : [],
  };
}

export function isSafeHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export type TeamMemberInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: string;
  branch_id: string;
  ttbs_no: string;
};

export type TeamField = "first_name" | "last_name" | "email" | "role_id";

export function teamFieldError(input: TeamMemberInput, required: string): { field: TeamField; message: string } | null {
  if (!input.first_name.trim()) return { field: "first_name", message: required };
  if (!input.last_name.trim()) return { field: "last_name", message: required };
  if (!input.email.trim()) return { field: "email", message: required };
  if (!input.role_id.trim()) return { field: "role_id", message: required };
  return null;
}

export function teamMemberBody(input: TeamMemberInput): {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role_id: number;
} {
  return {
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    role_id: Number(input.role_id),
  };
}

// STUB until MD backlog 6 — branch and TTBS/MYK are collected, not sent.
export function teamMemberExtras(input: TeamMemberInput): { branch_id: number | null; ttbs_no: string } | null {
  const branch = input.branch_id.trim();
  const ttbs = input.ttbs_no.trim();
  if (!branch && !ttbs) return null;
  const branchId = Number(branch);
  return {
    branch_id: branch && Number.isFinite(branchId) ? branchId : null,
    ttbs_no: ttbs,
  };
}

export function duplicateTeamEmail(members: readonly { email?: unknown }[], email: string): boolean {
  const needle = email.trim().toLowerCase();
  if (!needle) return false;
  return members.some((row) => String(row.email ?? "").trim().toLowerCase() === needle);
}

export type RoleOption = { id: string; slug: string; label: string };

export function roleOptions(payload: unknown, labels: Record<string, string>): RoleOption[] {
  return rows(payload).flatMap((row) => {
    const id = stringAt(row, ["id"]);
    if (!id) return [];
    const slug = stringAt(row, ["slug", "role_slug", "name"]).toLowerCase();
    return [{ id, slug, label: roleLabel(slug || stringAt(row, ["name", "title"]), labels) }];
  });
}

export function assignableRoles(options: readonly RoleOption[]): RoleOption[] {
  return options.filter((option) => option.slug !== "owner" && option.slug !== "broker");
}

export function roleLabel(value: string, labels: Record<string, string>): string {
  const key = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (key === "broker") return labels.owner || value;
  if (labels[key]) return labels[key];
  return value.trim();
}

export function memberRoleLabel(row: OfficeRecord, labels: Record<string, string>): string {
  const slug = stringAt(row, ["role_slug", "role", "slug"]);
  if (slug && labels[slug.toLowerCase()]) return roleLabel(slug, labels);
  const name = stringAt(row, ["role_name", "role_title"]);
  if (name) return roleLabel(name, labels);
  return roleLabel(slug, labels);
}

export function bulkRateBody(userIds: readonly number[], rate: number): { user_ids: number[]; rate_percentage: number } {
  return {
    user_ids: [...userIds],
    rate_percentage: rate,
  };
}

export function bulkRateSent(payload: unknown): boolean {
  return bulkRateStatus(payload) === "pending_approval";
}

function bulkRateStatus(payload: unknown): string {
  const root = unwrap(payload);
  if (typeof root.status === "string") return root.status;
  const nested = isRecord(root.data) ? root.data.status : undefined;
  return typeof nested === "string" ? nested : "";
}

export function displayCell(value: unknown): string {
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  const mapped: Record<string, string> = {
    active: "Aktif",
    pending: "Onay bekliyor",
    pending_approval: "Onay bekliyor",
    closed: "Kapatıldı",
    revision_requested: "Düzeltme istendi",
    draft: "Taslak",
    sale: "Satılık",
    rent: "Kiralık",
  };
  const key = text.toLowerCase();
  if (mapped[key]) return mapped[key];
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(key)) return "";
  return text;
}

type OfficeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is OfficeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rows(payload: unknown): OfficeRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.data)) return payload.data.filter(isRecord);
  if (isRecord(payload.data) && Array.isArray(payload.data.data)) return payload.data.data.filter(isRecord);
  return [];
}

function officeGroup(payload: unknown): OfficeRecord {
  const root = unwrap(payload);
  const grouped = record(valueAt(root, ["groups.office", "data.groups.office", "office", "data.office"]));
  if (grouped) return grouped;
  const list = rows(root.data ?? root);
  const found = list.find((row) => stringAt(row, ["group", "key", "name"]) === OFFICE_SETTINGS_GROUP);
  return found ?? root;
}

function unwrap(payload: unknown): OfficeRecord {
  if (!isRecord(payload)) return {};
  return isRecord(payload.data) ? payload.data : payload;
}

function record(value: unknown): OfficeRecord | null {
  return isRecord(value) ? value : null;
}

function stringAt(source: OfficeRecord, paths: string[]): string {
  const value = valueAt(source, paths);
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function boolAt(source: OfficeRecord, paths: string[]): boolean {
  const value = valueAt(source, paths);
  return value === true || value === 1 || value === "1" || value === "true";
}

function valueAt(source: OfficeRecord, paths: string[]): unknown {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!isRecord(current)) return undefined;
      return current[key];
    }, source);
    if (value != null && value !== "") return value;
  }
  return undefined;
}
