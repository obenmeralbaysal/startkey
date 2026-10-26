/**
 * Runtime configuration. Values that differ per environment are never hardcoded.
 */
export const config = {
  /** Server-side base URL of the Laravel API. */
  apiBaseUrl: process.env.API_BASE_URL ?? "http://nginx",

  /** Reonix CRM entry point. Empty until the Reonix integration is defined. */
  reonixUrl: process.env.NEXT_PUBLIC_REONIX_URL ?? "",

  /** Invisible reCAPTCHA v3 site key for public forms. Empty skips the check. */
  recaptchaV3SiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY ?? "",

  /**
   * Office-map base. `satellite` with a non-empty URL uses that endpoint.
   * Anything else, including an empty style, keeps OpenStreetMap.
   * These NEXT_PUBLIC values are inlined when the web image is built.
   */
  mapStyle: process.env.NEXT_PUBLIC_MAP_STYLE ?? "",
  mapSatelliteUrl: process.env.NEXT_PUBLIC_MAP_SATELLITE_URL ?? "",
  mapSatelliteAttribution: process.env.NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION ?? "",
} as const;

const OSM_TILES = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap",
} as const;

/** Base tiles for the office map. Satellite applies only when its URL is set. */
export function officeMapTiles(): { url: string; attribution: string } {
  const style = config.mapStyle.trim().toLowerCase();
  const url = config.mapSatelliteUrl.trim();
  if (style === "satellite" && url !== "") {
    return { url, attribution: config.mapSatelliteAttribution.trim() };
  }
  return OSM_TILES;
}
