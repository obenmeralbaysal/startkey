/**
 * Runtime configuration. Values that differ per environment are never hardcoded.
 */
export const config = {
  /** Server-side base URL of the Laravel API. */
  apiBaseUrl: process.env.API_BASE_URL ?? "http://nginx",

  /** Reonix CRM entry point. Empty until the Reonix integration is defined. */
  reonixUrl: process.env.NEXT_PUBLIC_REONIX_URL ?? "",

  /** Google reCAPTCHA v2 site key for the newsletter form. Empty disables the widget. */
  recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "",
} as const;
