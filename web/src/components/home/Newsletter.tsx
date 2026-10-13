"use client";

import { useEffect, useState } from "react";

import { newsletterStatus } from "@/content/newsletter-status";
import type { HomepageContent } from "@/content/types";
import { config } from "@/lib/config";
import type { Locale } from "@/lib/locales";
import { executeRecaptchaV3, loadRecaptchaV3 } from "@/lib/recaptcha-v3";

type FieldErrors = Partial<Record<"FirstName" | "LastName" | "Email", string>>;

export function Newsletter({
  content,
  locale,
}: {
  content: HomepageContent["newsletter"];
  locale: Locale;
}) {
  const messages = newsletterStatus[locale];
  const [firstNamePlaceholder, lastNamePlaceholder, emailPlaceholder] = content.placeholders;
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [captchaError, setCaptchaError] = useState("");

  useEffect(() => {
    if (!config.recaptchaV3SiteKey) return;
    void loadRecaptchaV3(config.recaptchaV3SiteKey).catch(() => undefined);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    let captchaToken: string | null = null;
    if (config.recaptchaV3SiteKey) {
      try {
        captchaToken = await executeRecaptchaV3(config.recaptchaV3SiteKey, "newsletter");
      } catch {
        setCaptchaError(content.captchaError);
        return;
      }
      if (!captchaToken) {
        setCaptchaError(content.captchaError);
        return;
      }
      setCaptchaError("");
    }

    setSubmitting(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/v1/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          first_name: formData.get("FirstName"),
          last_name: formData.get("LastName"),
          email: formData.get("Email"),
          locale: formData.get("locale"),
          captcha_token: captchaToken,
        }),
      });

      if (response.status === 201) {
        setStatus({ kind: "success", message: messages.success });
        form.reset();
        return;
      }

      if (response.status === 422) {
        const payload = (await response.json()) as { errors?: Record<string, string[]> };
        const errors: FieldErrors = {};
        const fieldMap = { first_name: "FirstName", last_name: "LastName", email: "Email" } as const;
        for (const [field, list] of Object.entries(payload.errors ?? {})) {
          if (field === "captcha_token") {
            setCaptchaError(list[0] ?? content.captchaError);
            continue;
          }
          const key = fieldMap[field as keyof typeof fieldMap];
          if (key) {
            errors[key] = list[0];
          }
        }
        setFieldErrors(errors);
        setStatus({ kind: "error", message: messages.invalid });
        return;
      }

      if (response.status === 429) {
        setStatus({ kind: "error", message: messages.throttled });
        return;
      }

      setStatus({ kind: "error", message: messages.failed });
    } catch {
      setStatus({ kind: "error", message: messages.failed });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative z-[1] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
      <img
        src="/themes/fela/img/newsletter-shape-1.png"
        alt="Image"
        className="absolute [top:0] [left:0] [z-index:-1]"
      />
      <div className="container">
        <div className="sk-title-row">
          <div className="sk-title-col">
            <div
              className="sk-section-title is-center"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>

        <form
          className="newsletter-form"
          method="post"
          role="form"
          id="form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <input placeholder={firstNamePlaceholder} type="text" id="FirstName" name="FirstName" />
            <span className="text-brand" data-valmsg-for="FirstName">
              {fieldErrors.FirstName}
            </span>
          </div>
          <div className="form-group">
            <input placeholder={lastNamePlaceholder} type="text" id="LastName" name="LastName" />
            <span className="text-brand" data-valmsg-for="LastName">
              {fieldErrors.LastName}
            </span>
          </div>
          <div className="form-group">
            <input placeholder={emailPlaceholder} type="email" id="Email" name="Email" required />
            <span className="text-brand" data-valmsg-for="Email">
              {fieldErrors.Email}
            </span>
          </div>

          {captchaError ? (
            <span id="captchaError" className="captcha-row text-brand">
              {captchaError}
            </span>
          ) : null}

          <div className="form-group">
            <button className="sk-btn sk-btn-brand w-full" type="submit" disabled={submitting}>
              {content.submitLabel}
            </button>
          </div>

          {/* The theme sizes `.form-group:last-child` down to 20%; on the reference
              website a trailing hidden input keeps that rule off the submit button, and
              this field, which the request needs anyway, does the same here. */}
          <input type="hidden" name="locale" value={locale} />

          {config.recaptchaV3SiteKey ? (
            <p className="captcha-row" dangerouslySetInnerHTML={{ __html: content.captchaNoticeHtml }} />
          ) : null}
        </form>

        {status ? (
          <div
            className={`text-center mt-30 ${status.kind === "success" ? "text-success" : "text-danger"}`}
            role="status"
          >
            {status.message}
          </div>
        ) : null}
      </div>
    </section>
  );
}
