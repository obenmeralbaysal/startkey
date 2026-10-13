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
} as const;
