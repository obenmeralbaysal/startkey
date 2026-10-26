export type OfficeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is OfficeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Same unwrap as office `one()`: `{ data: { ... } }` or the record itself. */
function one(payload: unknown): OfficeRecord | null {
  if (!isRecord(payload)) return null;
  if (isRecord(payload.data)) return payload.data;
  return payload;
}

export type PortfolioFact = { label: string; value: string };

export type PortfolioSummary = {
  title: string;
  facts: PortfolioFact[];
  description: string;
  media: string[];
};

const STATUS_LABELS: Record<string, string> = {
  prospect: "Potansiyel",
  draft: "Taslak",
  active: "Aktif",
  passive: "Pasif",
  closed: "Kapalı",
  pending_activation_approval: "Aktivasyon onayı bekliyor",
  pending_closing_approval: "Kapanış onayı bekliyor",
  revisions_requested: "Revizyon istendi",
  incomplete_data: "Eksik bilgi",
};

const ROOM_KEYS = ["room_count", "rooms", "oda", "number_of_rooms"];
const AREA_KEYS = ["gross_m2", "net_m2", "m2", "square_meters", "area", "gross_area", "net_area"];
const FLOOR_KEYS = ["floor", "floor_number", "current_floor"];

export function portfolioScreen(id: string | undefined, step: string | undefined): "list" | "new" | "edit" | "detail" {
  if (!id) return "list";
  if (id === "new") return "new";
  if (step === "edit") return "edit";
  return "detail";
}

export function portfolioSummary(payload: unknown): PortfolioSummary {
  const record = one(payload);
  if (!record) {
    return { title: "", facts: [], description: "", media: [] };
  }
  const facts: PortfolioFact[] = [];
  push(facts, "Durum", statusLabel(record));
  push(facts, "Tür", typeLabel(record));
  push(facts, "Fiyat", priceLabel(record));
  push(facts, "İl", place(record, ["province", "city_name", "city"]));
  push(facts, "İlçe", place(record, ["district_name", "district"]));
  push(facts, "Mahalle", place(record, ["neighborhood_name", "neighborhood"]));
  push(facts, "Oda", field(record, ROOM_KEYS) || attributeValue(record, "room"));
  push(facts, "m²", field(record, AREA_KEYS) || attributeValue(record, "area"));
  push(facts, "Kat", field(record, FLOOR_KEYS) || attributeValue(record, "floor"));
  push(facts, "Kişi", contactName(record));
  push(facts, "Kayıt", createdAt(record));
  return {
    title: typeof record.title === "string" ? record.title.trim() : "",
    facts,
    description: record.description == null ? "" : String(record.description).trim(),
    media: mediaUrls(record),
  };
}

export type PortfolioEditDraft = {
  title: string;
  description: string;
  price: string;
  currency: string;
};

/** Fields accepted by Reonix UpdatePortfolioRequest. Room and m² live on attributes and are not sent. */
export function portfolioEditChanges(current: OfficeRecord, draft: PortfolioEditDraft): Record<string, string | number | null> {
  const body: Record<string, string | number | null> = {};
  const title = draft.title.trim();
  if (title !== text(current.title).trim()) {
    body.title = title;
  }
  const description = draft.description;
  if (description !== (current.description == null ? "" : String(current.description))) {
    body.description = description === "" ? null : description;
  }
  const price = Number(draft.price.trim().replace(",", "."));
  if (draft.price.trim() !== "" && Number.isFinite(price) && price !== Number(current.price)) {
    body.price = price;
  }
  const currency = draft.currency.trim();
  if (currency !== text(current.currency).trim()) {
    body.currency = currency === "" ? null : currency;
  }
  return body;
}

function push(facts: PortfolioFact[], label: string, value: string) {
  if (value !== "") facts.push({ label, value });
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function statusLabel(record: OfficeRecord): string {
  const status = text(record.status).trim();
  if (record.is_draft === true && (status === "" || status === "draft")) return "Taslak";
  if (status === "") return "";
  return STATUS_LABELS[status] ?? status;
}

function typeLabel(record: OfficeRecord): string {
  const type = text(record.type).trim() || text(record.portfolio_type).trim();
  if (type === "sale") return "Satılık";
  if (type === "rent") return "Kiralık";
  return type;
}

function priceLabel(record: OfficeRecord): string {
  const raw = record.price;
  const amount = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
  if (!Number.isFinite(amount)) return "";
  const [whole, fraction] = amount.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const shown = fraction === "00" ? grouped : `${grouped},${fraction}`;
  const currency = text(record.currency).trim();
  return currency ? `${shown} ${currency}` : shown;
}

function place(record: OfficeRecord, keys: string[]): string {
  for (const key of keys) {
    const value = named(record[key]);
    if (value !== "" && !/^\d+$/.test(value)) return value;
  }
  return "";
}

function named(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (isRecord(value)) {
    if (typeof value.name === "string" && value.name.trim()) return value.name.trim();
    if (typeof value.title === "string" && value.title.trim()) return value.title.trim();
  }
  return "";
}

function field(record: OfficeRecord, keys: string[]): string {
  for (const key of keys) {
    const value = scalar(record[key]);
    if (value !== "") return value;
  }
  return "";
}

function attributeValue(record: OfficeRecord, kind: "room" | "area" | "floor"): string {
  if (!Array.isArray(record.attributes)) return "";
  const found: string[] = [];
  for (const row of record.attributes) {
    if (!isRecord(row)) continue;
    const definition = isRecord(row.definition) ? row.definition : {};
    const label = `${text(definition.label)} ${text(definition.key)} ${text(definition.slug)} ${text(definition.name)}`.toLocaleLowerCase("tr");
    const match = kind === "room"
      ? definition.is_room_count === true || /oda|room/.test(label)
      : kind === "area"
        ? /m²|m2|metrekare|brüt|brut|net alan|gross|square/.test(label)
        : /bulunduğu kat|bulundugu kat|floor/.test(label) || label.trim() === "kat";
    if (!match) continue;
    const value = scalar(row.value ?? row.display_value);
    if (value !== "") found.push(value);
  }
  return kind === "area" ? found.slice(0, 2).join(" · ") : (found[0] ?? "");
}

function scalar(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map((item) => text(item).trim()).filter(Boolean).join(", ");
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function contactName(record: OfficeRecord): string {
  for (const key of ["contact", "owner", "customer"]) {
    const name = person(record[key]);
    if (name !== "") return name;
  }
  for (const key of ["owner_name", "contact_name"]) {
    const name = text(record[key]).trim();
    if (name !== "") return name;
  }
  return "";
}

function person(value: unknown): string {
  if (!isRecord(value)) return "";
  const full = `${text(value.first_name)} ${text(value.last_name)}`.trim();
  if (full !== "") return full;
  return text(value.name).trim();
}

function createdAt(record: OfficeRecord): string {
  const raw = text(record.created_at).trim() || text(record.createdAt).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : raw;
}

function mediaUrls(record: OfficeRecord): string[] {
  const rows = Array.isArray(record.media) ? record.media.filter(isRecord) : [];
  const images = rows.filter((row) => {
    const type = text(row.type).toLowerCase();
    return type !== "video" && type !== "document" && type !== "pdf";
  });
  const cover = images.filter((row) => row.is_showcase === true || row.is_cover === true || row.is_primary === true);
  const ordered = [...cover, ...images.filter((row) => !cover.includes(row))];
  const urls: string[] = [];
  for (const row of ordered) {
    const url = mediaUrl(row);
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

function mediaUrl(row: OfficeRecord): string | null {
  for (const key of ["thumbnail_url", "thumb_url", "thumbnail", "url", "src", "path"]) {
    const value = text(row[key]).trim();
    if (value === "") continue;
    const rewritten = rewriteMedia(value);
    if (rewritten) return rewritten;
  }
  return null;
}

function rewriteMedia(value: string): string | null {
  if (value.startsWith("/api/")) return value;
  const storage = value.indexOf("/storage/");
  if (storage >= 0 && (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/storage/"))) {
    return `/api/v1/portal/media${value.slice(storage)}`;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) return null;
  const path = value.replace(/^\/+/, "");
  if (path.startsWith("storage/")) return `/api/v1/portal/media/${path}`;
  return `/api/v1/portal/media/storage/${path}`;
}
