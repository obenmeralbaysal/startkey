"use client";

import { useState } from "react";

import { publicFormStatus } from "@/content/public-form-status";
import { config } from "@/lib/config";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

type ConsultantDetailData = Extract<CorporatePayload, { kind: "consultant-detail" }>;

export function ConsultantCommentForm({ data, locale }: { data: ConsultantDetailData; locale: Locale }) {
  const messages = publicFormStatus[locale].consultant;
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [captchaError, setCaptchaError] = useState("");
  const [rating, setRating] = useState(0);
  const placeholders = data.form.placeholders;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (config.recaptchaSiteKey) {
      const captchaResponse = window.grecaptcha?.getResponse() ?? "";
      if (!captchaResponse) {
        setCaptchaError(data.form.captchaError);
        return;
      }
      setCaptchaError("");
      formData.set("g-recaptcha-response", captchaResponse);
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/v1/consultants/${data.externalId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          first_name: formData.get("FirstName"),
          last_name: formData.get("LastName"),
          email: formData.get("Email"),
          phone: formData.get("Phone"),
          rating: rating > 0 ? rating : null,
          comment: formData.get("Comment"),
          locale,
          captcha_token: formData.get("g-recaptcha-response") || null,
        }),
      });

      if (response.status === 201) {
        setStatus({ kind: "success", message: messages.success });
        form.reset();
        setRating(0);
        window.grecaptcha?.reset();
        return;
      }
      if (response.status === 422) {
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
    <form method="post" role="form" className="review-form mb-25" id="form" action={data.urlPath} onSubmit={handleSubmit}>
      <input type="hidden" id="Id" name="Id" value={data.externalId} readOnly />
      <input type="hidden" id="SeoUrl" name="SeoUrl" value={data.urlPath.split("/").pop() ?? ""} readOnly />
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <input className="" placeholder={placeholders.FirstName} type="text" id="FirstName" name="FirstName" defaultValue="" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <input className="" placeholder={placeholders.LastName} type="text" id="LastName" name="LastName" defaultValue="" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <input className="" placeholder={placeholders.Email} type="email" id="Email" name="Email" defaultValue="" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <input className="" type="tel" id="Phone" name="Phone" defaultValue="" />
          </div>
        </div>
        <div className="form-group mb-3">
          <label className="control-label">{data.ratingLabel}</label>
          <div className="rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <span className="star" data-value={value} key={value} onClick={() => setRating(value)}>
                {" "}
                <i className={`${value <= rating ? "active " : ""}ri-star-fill`} aria-hidden="true" />
              </span>
            ))}
          </div>
          <input type="hidden" id="star-rating" name="Star" value={rating} readOnly />
        </div>
        <div className="col-lg-12">
          <div className="form-group">
            <textarea className="" placeholder={placeholders.Comment} rows={3} id="Comment" name="Comment" defaultValue="" />
          </div>
        </div>
        {config.recaptchaSiteKey ? (
          <>
            <input type="hidden" id="g-recaptcha-response" name="g-recaptcha-response" />
            <div className="form-group">
              <div className="col-md-offset-2 col-md-10">
                <script src="https://www.google.com/recaptcha/api.js" async defer />
                <div className="g-recaptcha" data-sitekey={config.recaptchaSiteKey} suppressHydrationWarning />
                <span id="captchaError" className="text text-danger">
                  {captchaError}
                </span>
              </div>
            </div>
          </>
        ) : null}
        <div className="col-lg-12" style={{ textAlign: "center" }}>
          <button type="submit" className="btn style2" disabled={submitting}>
            {data.form.submitLabel}
          </button>
        </div>
      </div>
      {status ? (
        <div className={`mt-20 ${status.kind === "success" ? "text-success" : "text-danger"}`} role="status">
          {status.message}
        </div>
      ) : null}
    </form>
  );
}
