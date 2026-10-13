import { config } from "@/lib/config";

const SCRIPT_ID = "sk-recaptcha-v3";

function whenReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const api = window.grecaptcha;
    if (!api?.ready) {
      reject(new Error("recaptcha-unavailable"));
      return;
    }
    api.ready(() => resolve());
  });
}

/** Loads the invisible reCAPTCHA v3 script once. */
export function loadRecaptchaV3(siteKey: string): Promise<void> {
  if (window.grecaptcha?.execute) {
    return whenReady();
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "1") {
      return whenReady();
    }
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("recaptcha-load")), { once: true });
    }).then(whenReady);
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error("recaptcha-load"));
    document.head.appendChild(script);
  }).then(whenReady);
}

/** Returns a single-use v3 token for the given action. */
export async function executeRecaptchaV3(siteKey: string, action: string): Promise<string> {
  await loadRecaptchaV3(siteKey);
  const api = window.grecaptcha;
  if (!api?.execute) {
    throw new Error("recaptcha-unavailable");
  }
  return api.execute(siteKey, { action });
}

/** Token for one form action. Null when the v3 site key is empty. */
export async function executeRecaptchaV3Action(action: string): Promise<string | null> {
  if (!config.recaptchaV3SiteKey) {
    return null;
  }
  const token = await executeRecaptchaV3(config.recaptchaV3SiteKey, action);
  if (!token) {
    throw new Error("recaptcha-unavailable");
  }
  return token;
}
