export type SahibindenListing =
  | { ok: true; url: string }
  | { ok: false };

export type SahibindenImportError = "invalid" | "not-found" | "upstream" | "forbidden" | "rate-limit";

export const SAHIBINDEN_IMPORT_ERROR_TEXT: Record<SahibindenImportError, string> = {
  invalid: "Geçerli bir sahibinden.com ilan adresi veya ilan numarası girin.",
  "not-found": "İlan bulunamadı.",
  upstream: "İlan okunamadı. Bağlantı zaman aşımına uğradı veya servis yanıt vermedi.",
  forbidden: "Bu işlem için yetkiniz yok.",
  "rate-limit": "Çok fazla deneme yapıldı. Bir süre sonra yeniden deneyin.",
};

const LISTING_NUMBER = /^\d{6,12}$/;

export function parseSahibindenListing(input: string): SahibindenListing {
  const value = input.trim();
  if (LISTING_NUMBER.test(value)) {
    return { ok: true, url: value };
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false };
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host !== "sahibinden.com" && !host.endsWith(".sahibinden.com")) {
    return { ok: false };
  }
  if (!/\/ilan\//i.test(url.pathname)) {
    return { ok: false };
  }
  return { ok: true, url: url.toString() };
}

export function classifySahibindenImportFailure(status: number, message = ""): SahibindenImportError {
  const text = message.toLocaleLowerCase("tr");
  if (status === 403 || text.includes("yetkiniz") || text.includes("forbidden")) {
    return "forbidden";
  }
  if (status === 429 || text.includes("rate limit") || text.includes("too many") || text.includes("çok fazla")) {
    return "rate-limit";
  }
  if (status === 404 || text.includes("bulunamadı") || text.includes("bulunamadi") || text.includes("not found")) {
    return "not-found";
  }
  return "upstream";
}

export type PortfolioImportDraft = {
  title: string;
  contactId: string;
  categoryId: string;
  type: "sale" | "rent";
  price: string;
  cityId: string;
  districtId: string;
  neighborhoodId: string;
};

export function portfolioDraftFromImport(payload: unknown): PortfolioImportDraft {
  const root = record(payload) ?? {};
  const data = record(root.data) ?? root;
  const source = record(data.portfolio) ?? record(data.listing) ?? record(data.fields) ?? data;
  const typeRaw = String(source.type ?? source.listing_type ?? source.portfolio_type ?? "").toLocaleLowerCase("tr");
  const priceValue = source.price ?? source.amount;
  return {
    title: typeof source.title === "string" ? source.title : typeof source.name === "string" ? source.name : "",
    contactId: pickId(source, ["contact_id", "contact"]),
    categoryId: pickId(source, ["category_id", "category"]),
    type: typeRaw === "rent" || typeRaw === "kiralık" || typeRaw === "kiralik" ? "rent" : "sale",
    price: priceOf(priceValue),
    cityId: pickId(source, ["city_id", "city"]),
    districtId: pickId(source, ["district_id", "district"]),
    neighborhoodId: pickId(source, ["neighborhood_id", "neighborhood"]),
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function pickId(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return String(Math.trunc(value));
    }
    if (typeof value === "string" && /^[1-9]\d*$/.test(value.trim())) {
      return value.trim();
    }
    const nested = record(value);
    if (nested) {
      const id = pickId(nested, ["id"]);
      if (id) return id;
    }
  }
  return "";
}

function priceOf(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return String(value);
  }
  if (typeof value !== "string") {
    return "";
  }
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  return digits;
}
