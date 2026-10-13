import type { Locale } from "@/lib/locales";

/** Same Google notice the homepage newsletter shows when the v3 badge is hidden. */
export const captchaNoticeHtml: Record<Locale, string> = {
  tr: 'Bu site reCAPTCHA ile korunmaktadır ve Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Gizlilik Politikası</a> ile <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Hizmet Şartları</a> geçerlidir.',
  en: 'This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.',
  de: 'Diese Website ist durch reCAPTCHA geschützt und es gelten die <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a> und die <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Nutzungsbedingungen</a> von Google.',
};
