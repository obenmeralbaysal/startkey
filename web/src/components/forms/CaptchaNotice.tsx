"use client";

import { useEffect } from "react";

import { captchaNoticeHtml } from "@/content/captcha-notice";
import { config } from "@/lib/config";
import type { Locale } from "@/lib/locales";
import { loadRecaptchaV3 } from "@/lib/recaptcha-v3";

export function CaptchaNotice({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (!config.recaptchaV3SiteKey) return;
    void loadRecaptchaV3(config.recaptchaV3SiteKey).catch(() => undefined);
  }, []);

  if (!config.recaptchaV3SiteKey) return null;

  return (
    <p
      className="captcha-row mb-[calc(15px*var(--sk-scale,1))] text-center text-[calc(12px*var(--sk-scale,1))] leading-snug"
      dangerouslySetInnerHTML={{ __html: captchaNoticeHtml[locale] }}
    />
  );
}
