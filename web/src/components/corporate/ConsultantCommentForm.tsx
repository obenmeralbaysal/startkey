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
    <form method="post" role="form" className="bg-neutral-50 [padding:calc(30px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] max-md:[padding:calc(20px_*_var(--sk-scale,_1))] [margin-bottom:calc(25px_*_var(--sk-scale,_1))]" id="form" action={data.urlPath} onSubmit={handleSubmit}>
      <input type="hidden" id="Id" name="Id" value={data.externalId} readOnly />
      <input type="hidden" id="SeoUrl" name="SeoUrl" value={data.urlPath.split("/").pop() ?? ""} readOnly />
      <div className="flex flex-wrap">
        <div className="w-full md:w-1/2">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input className="" placeholder={placeholders.FirstName} type="text" id="FirstName" name="FirstName" defaultValue="" />
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input className="" placeholder={placeholders.LastName} type="text" id="LastName" name="LastName" defaultValue="" />
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input className="" placeholder={placeholders.Email} type="email" id="Email" name="Email" defaultValue="" />
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input className="" type="tel" id="Phone" name="Phone" defaultValue="" />
          </div>
        </div>
        <div className="mb-[calc(15px*var(--sk-scale,1))] [margin-bottom:calc(1rem_*_var(--sk-scale,_1))]">
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
        <div className="w-full">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <textarea className="" placeholder={placeholders.Comment} rows={3} id="Comment" name="Comment" defaultValue="" />
          </div>
        </div>
        {config.recaptchaSiteKey ? (
          <>
            <input type="hidden" id="g-recaptcha-response" name="g-recaptcha-response" />
            <div className="mb-[calc(15px*var(--sk-scale,1))]">
              <div className="md:ml-1/6 w-full md:w-10/12">
                <script src="https://www.google.com/recaptcha/api.js" async defer />
                <div className="g-recaptcha" data-sitekey={config.recaptchaSiteKey} suppressHydrationWarning />
                <span id="captchaError" className="text text-brand">
                  {captchaError}
                </span>
              </div>
            </div>
          </>
        ) : null}
        <div className="w-full" style={{ textAlign: "center" }}>
          <button type="submit" className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" disabled={submitting}>
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
