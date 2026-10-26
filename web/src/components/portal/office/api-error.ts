export type FieldErrors = Record<string, string>;

type Payload = Record<string, unknown>;

const GENERIC_VALIDATION = new Set([
  "the given data was invalid.",
  "the given data was invalid",
  "validation failed",
  "validation error",
  "doğrulama hatası",
  "doğrulama hatası.",
  "unprocessable entity",
  "unprocessable content",
  "işlem tamamlanamadı.",
]);

/** First validation string for each field. Keys stay as the API sent them. */
export function fieldErrors(payload: Payload): FieldErrors {
  const out: FieldErrors = {};
  collectErrors("", payload.errors, out);
  return out;
}

export function errorText(payload: Payload, labels: string[] = []): string {
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const texts = validationTexts(payload);
  if (message && !GENERIC_VALIDATION.has(message.toLocaleLowerCase("tr-TR"))) {
    return labels.length > 0 ? `${message} ${labels.join(", ")}` : message;
  }
  if (texts.length > 0) return texts.join(" ");
  if (message) return labels.length > 0 ? `${message} ${labels.join(", ")}` : message;
  const error = typeof payload.error === "string" ? payload.error.trim() : "";
  if (error && error !== "watermarked_media" && error !== "unavailable") return error;
  return "İşlem tamamlanamadı.";
}

function validationTexts(payload: Payload): string[] {
  if (Array.isArray(payload.errors)) {
    return payload.errors.map(firstErrorText).filter((text) => text !== "");
  }
  return Object.values(fieldErrors(payload));
}

function collectErrors(prefix: string, value: unknown, out: FieldErrors): void {
  if (typeof value === "string" || Array.isArray(value)) {
    const text = firstErrorText(value);
    if (prefix && text) out[prefix] = text;
    return;
  }
  if (!isRecord(value)) return;
  const direct = firstErrorText(value.message ?? value.error);
  const nested = Object.entries(value).filter(([key]) => key !== "message" && key !== "error");
  if (direct && nested.length === 0) {
    if (prefix) out[prefix] = direct;
    return;
  }
  for (const [key, child] of nested) {
    collectErrors(prefix ? `${prefix}.${key}` : key, child, out);
  }
}

function firstErrorText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = firstErrorText(item);
      if (text) return text;
    }
    return "";
  }
  if (isRecord(value)) return firstErrorText(value.message ?? value.error);
  return "";
}

function isRecord(value: unknown): value is Payload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
