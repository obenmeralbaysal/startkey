/**
 * Brand rewrites required by the project definition: the reference website's CRM
 * and MLS provider references become the project's own brands.
 */
const REFERENCE_ORIGIN = /https?:\/\/(?:www\.)?startkey\.com\.tr/g;

const BRAND_REWRITES: [RegExp, string][] = [
  [/REOS CRM/g, "Reonix"],
  [/ReOS CRM/g, "Reonix"],
  [/ReOS/g, "Reonix"],
];

/** The reference marks its provider with a remote logo image; the project shows the provider name. */
const PROVIDER_CREDIT = /<a href="https:\/\/re-os\.com"[^>]*>\s*<img[^>]*>\s*<\/a>/g;

export function rewriteBrand(value: string): string {
  let out = value.replace(REFERENCE_ORIGIN, "");
  out = out.replace(PROVIDER_CREDIT, '<span class="service-provider">Sinap</span>');
  for (const [pattern, replacement] of BRAND_REWRITES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function rewriteBrandDeep<T>(value: T): T {
  if (typeof value === "string") {
    return rewriteBrand(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(rewriteBrandDeep) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, rewriteBrandDeep(item)]),
    ) as T;
  }
  return value;
}
