/**
 * Third-party runtimes the reference website loads and this application reproduces.
 * They are attached to `window` by external scripts, not imported.
 */
interface ReCaptcha {
  getResponse(widgetId?: number): string;
  reset(widgetId?: number): void;
}

/** Counter animation library from the theme bundle. */
interface OdometerStatic {
  init(): void;
}

declare global {
  interface Window {
    grecaptcha?: ReCaptcha;
    Odometer?: OdometerStatic;
    scrollToForm?: () => void;
  }
}

export {};
