import type { Locale } from "@/lib/locales";

/**
 * Status messages for the newsletter form.
 *
 * Unlike every other string on the page these are NOT taken from the reference
 * website: its post-submit messages are only observable by submitting data to the
 * live system. They are tracked in docs/TECHNICAL_DEBT.md and must be replaced with
 * the reference wording once it can be observed.
 */
export interface NewsletterStatusMessages {
  success: string;
  invalid: string;
  throttled: string;
  failed: string;
}

export const newsletterStatus: Record<Locale, NewsletterStatusMessages> = {
  tr: {
    success: "Bülten kaydınız alındı.",
    invalid: "Lütfen form alanlarını kontrol edin.",
    throttled: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
    failed: "Kayıt tamamlanamadı. Lütfen daha sonra tekrar deneyin.",
  },
  en: {
    success: "Your newsletter subscription has been received.",
    invalid: "Please check the form fields.",
    throttled: "Too many attempts. Please try again later.",
    failed: "The subscription could not be completed. Please try again later.",
  },
  de: {
    success: "Ihre Newsletter-Anmeldung ist eingegangen.",
    invalid: "Bitte überprüfen Sie die Formularfelder.",
    throttled: "Zu viele Versuche. Bitte versuchen Sie es später erneut.",
    failed: "Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuchen Sie es später erneut.",
  },
};
