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
    <section className="relative z-[1] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
      <img
        src="/themes/fela/img/newsletter-shape-1.png"
        alt="Image"
        className="absolute [top:0] [left:0] [z-index:-1]"
      />
      <div className="container">
        <div className="flex flex-wrap">
          <div className="w-full xl:w-1/2 xl:ml-1/4 lg:w-2/3 lg:ml-1/6">
            <div
              className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>

        <form
          className="flex flex-wrap relative z-[1]"
          method="post"
          role="form"
          id="form"
          style={{ justifyContent: "center", alignItems: "center" }}
          onSubmit={handleSubmit}
        >
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input placeholder={firstNamePlaceholder} type="text" id="FirstName" name="FirstName" />
            <span className="text-brand" data-valmsg-for="FirstName">
              {fieldErrors.FirstName}
            </span>
          </div>
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input placeholder={lastNamePlaceholder} type="text" id="LastName" name="LastName" />
            <span className="text-brand" data-valmsg-for="LastName">
              {fieldErrors.LastName}
            </span>
          </div>
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input placeholder={emailPlaceholder} type="email" id="Email" name="Email" required />
            <span className="text-brand" data-valmsg-for="Email">
              {fieldErrors.Email}
            </span>
          </div>

          {config.recaptchaSiteKey ? (
            <>
              <input type="hidden" id="g-recaptcha-response" name="g-recaptcha-response" />
              <div className="mb-[calc(15px*var(--sk-scale,1))]">
                <div className="md:ml-1/6 w-full md:w-10/12">
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
                  <span id="captchaError" className="text text-brand">
                    {captchaError}
                  </span>
                </div>
              </div>
            </>
          ) : null}

          <div className="mb-[calc(15px*var(--sk-scale,1))] max-[768px]:w-full max-[768px]:[margin-bottom:0] [margin-right:0] [width:20%]">
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
