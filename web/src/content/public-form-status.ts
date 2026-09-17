import type { Locale } from "@/lib/locales";

/**
 * Status messages for the İletişim and seminar application forms.
 *
 * Unlike the labels on those pages these are NOT taken from the reference
 * website: its post-submit messages are only observable by submitting data to the
 * live system. They are tracked in docs/TECHNICAL_DEBT.md.
 */
export interface PublicFormStatusMessages {
  success: string;
  invalid: string;
  throttled: string;
  failed: string;
}

export const publicFormStatus: Record<
  Locale,
  { contact: PublicFormStatusMessages; training: PublicFormStatusMessages }
> = {
  tr: {
    contact: {
      success: "Mesajınız alındı.",
      invalid: "Lütfen form alanlarını kontrol edin.",
      throttled: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
      failed: "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
    },
    training: {
      success: "Başvurunuz alındı.",
      invalid: "Lütfen form alanlarını kontrol edin.",
      throttled: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
      failed: "Başvuru tamamlanamadı. Lütfen daha sonra tekrar deneyin.",
    },
  },
  en: {
    contact: {
      success: "Your message has been received.",
      invalid: "Please check the form fields.",
      throttled: "Too many attempts. Please try again later.",
      failed: "The message could not be sent. Please try again later.",
    },
    training: {
      success: "Your application has been received.",
      invalid: "Please check the form fields.",
      throttled: "Too many attempts. Please try again later.",
      failed: "The application could not be completed. Please try again later.",
    },
  },
  de: {
    contact: {
      success: "Ihre Nachricht ist eingegangen.",
      invalid: "Bitte überprüfen Sie die Formularfelder.",
      throttled: "Zu viele Versuche. Bitte versuchen Sie es später erneut.",
      failed: "Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
    },
    training: {
      success: "Ihre Anmeldung ist eingegangen.",
      invalid: "Bitte überprüfen Sie die Formularfelder.",
      throttled: "Zu viele Versuche. Bitte versuchen Sie es später erneut.",
      failed: "Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuchen Sie es später erneut.",
    },
  },
};
