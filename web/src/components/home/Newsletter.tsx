"use client";

import { useState } from "react";

import { newsletterStatus } from "@/content/newsletter-status";
import type { HomepageContent } from "@/content/types";
import { config } from "@/lib/config";
import type { Locale } from "@/lib/locales";

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    // The reference website blocks the submit and shows this message next to the
    // widget when the captcha has not been solved.
    if (config.recaptchaSiteKey) {
      const captchaResponse = window.grecaptcha?.getResponse() ?? "";
      if (!captchaResponse) {
        setCaptchaError(content.captchaError);
        return;
      }
      setCaptchaError("");
      formData.set("g-recaptcha-response", captchaResponse);
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
          captcha_token: formData.get("g-recaptcha-response") || null,
        }),
      });

      if (response.status === 201) {
        setStatus({ kind: "success", message: messages.success });
        form.reset();
        window.grecaptcha?.reset();
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
    <section className="newsletter-wrap ptb-100">
      <img
        src="/themes/fela/img/newsletter-shape-1.png"
        alt="Image"
        className="newsletter-shape-one"
      />
      <div className="container">
        <div className="row">
          <div className="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2">
            <div
              className="section-title style2 text-center mb-40"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>

        <form
          className="newsletter-form"
          method="post"
          role="form"
          id="form"
          style={{ justifyContent: "center", alignItems: "center" }}
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <input placeholder={firstNamePlaceholder} type="text" id="FirstName" name="FirstName" />
            <span className="text-danger" data-valmsg-for="FirstName">
              {fieldErrors.FirstName}
            </span>
          </div>
          <div className="form-group">
            <input placeholder={lastNamePlaceholder} type="text" id="LastName" name="LastName" />
            <span className="text-danger" data-valmsg-for="LastName">
              {fieldErrors.LastName}
            </span>
          </div>
          <div className="form-group">
            <input placeholder={emailPlaceholder} type="email" id="Email" name="Email" required />
            <span className="text-danger" data-valmsg-for="Email">
              {fieldErrors.Email}
            </span>
          </div>

          {config.recaptchaSiteKey ? (
            <>
              <input type="hidden" id="g-recaptcha-response" name="g-recaptcha-response" />
              <div className="form-group">
                <div className="col-md-offset-2 col-md-10">
                  {/* Loaded from Google, as on the reference website: the widget cannot
                      be served locally. */}
                  <script src="https://www.google.com/recaptcha/api.js" async defer />
                  {/* Google fills this container in before hydration, so React must
                      not diff its contents. */}
                  <div
                    className="g-recaptcha"
                    data-sitekey={config.recaptchaSiteKey}
                    suppressHydrationWarning
                  />
                  <span id="captchaError" className="text text-danger">
                    {captchaError}
                  </span>
                </div>
              </div>
            </>
          ) : null}

          <div className="form-group last-newsletter">
            <button className={content.submitClass} type="submit" disabled={submitting}>
              {content.submitLabel}
            </button>
          </div>

          {/* The theme sizes `.form-group:last-child` down to 20%; on the reference
              website a trailing hidden input keeps that rule off the submit button, and
              this field, which the request needs anyway, does the same here. */}
          <input type="hidden" name="locale" value={locale} />
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
