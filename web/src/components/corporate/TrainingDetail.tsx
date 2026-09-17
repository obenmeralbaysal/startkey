"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { publicFormStatus } from "@/content/public-form-status";
import { config } from "@/lib/config";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

type TrainingDetailData = Extract<CorporatePayload, { kind: "training-detail" }>;

export function TrainingDetail({
  data,
  locale,
}: {
  data: TrainingDetailData;
  locale: Locale;
}) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="property-details-wrap pt-100 pb-75">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="property-details">
                <div className="row align-items-start">
                  <div className="col-md-12">
                    <div className="property-title">
                      <h2>{data.title}</h2>
                      <ul className="property-metainfo list-style">
                        {data.dateValue ? (
                          <li>
                            <i className="flaticon-calendar"> {data.datePrefix} </i>
                            {data.dateValue}
                          </li>
                        ) : null}
                        {data.timeValue ? (
                          <li>
                            <i className="flaticon-time"> {data.timePrefix} </i>
                            {data.timeValue}
                          </li>
                        ) : null}
                        {data.priceValue ? (
                          <li>
                            <i className="flaticon-price-tag"> {data.pricePrefix} </i>
                            {data.priceValue}
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  </div>
                </div>
                {data.image ? (
                  <div className="property-img">
                    <img src={data.image} alt="Image" />
                  </div>
                ) : null}
                <div className="property-desc">
                  <h4>{data.locationHeading}</h4>
                  <div className="row">
                    <div className="col-md-12">
                      <ul className="property-features list-style">
                        <li>
                          <i className="flaticon-location" style={{ paddingRight: 7 }} />
                          {data.locationValue}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="property-desc">
                  <h4>{data.descriptionHeading}</h4>
                  <div dangerouslySetInnerHTML={{ __html: data.descriptionHtml }} />
                </div>
              </div>
            </div>
            <div className="col-xl-4">
              <div className="sidebar">
                {data.hasApplicationForm ? (
                  <div className="sidebar-widget">
                    <h4>{data.formHeading}</h4>
                    <TrainingApplicationForm data={data} locale={locale} />
                  </div>
                ) : null}
                {data.related.length > 0 ? (
                  <div className="sidebar-widget">
                    <h4>{data.relatedHeading}</h4>
                    {data.related.map((item) => (
                      <div className="property-thumb-item" key={`${item.externalId}-${item.urlPath}`}>
                        <div className="property-thumb-img">
                          <img src={item.image} alt="image" />
                        </div>
                        <div className="property-thumb-info">
                          <h6>
                            <a className="overlay-link" href={item.urlPath}>
                              {item.title}
                            </a>
                          </h6>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function TrainingApplicationForm({
  data,
  locale,
}: {
  data: TrainingDetailData;
  locale: Locale;
}) {
  const messages = publicFormStatus[locale].training;
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [captchaError, setCaptchaError] = useState("");

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

    const nextErrors: Record<string, string> = {};
    for (const [field, message] of Object.entries(data.form.required)) {
      const value = String(formData.get(field === "PhoneNew" ? "Phone" : field) ?? "").trim();
      if (!value) {
        nextErrors[field] = message;
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const response = await fetch(`/api/v1/trainings/${data.externalId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          first_name: formData.get("FirstName"),
          last_name: formData.get("LastName"),
          email: formData.get("Email"),
          phone: formData.get("Phone"),
          gender_id: Number(formData.get("GenderId")),
          locale,
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
    <form method="post" id="form" className="filter-widget form" action={data.urlPath} onSubmit={handleSubmit}>
      <div className="row">
        <div className="form-group">
          <input
            placeholder={data.form.placeholders.firstName}
            type="text"
            id="FirstName"
            name="FirstName"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="FirstName">
            {fieldErrors.FirstName}
          </span>
        </div>
        <div className="form-group">
          <input
            placeholder={data.form.placeholders.lastName}
            type="text"
            id="LastName"
            name="LastName"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="LastName">
            {fieldErrors.LastName}
          </span>
        </div>
        <div className="form-group">
          <input
            placeholder={data.form.placeholders.email}
            type="email"
            id="Email"
            name="Email"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="Email">
            {fieldErrors.Email}
          </span>
        </div>
        <div className="form-group">
          <input id="PhoneNew" className="intl-phone" type="tel" name="Phone" defaultValue="" />
          <span className="text-danger field-validation-valid" data-valmsg-for="Phone">
            {fieldErrors.PhoneNew}
          </span>
        </div>
        <div className="form-group">
          <select className="select2 search-fields" id="GenderId" name="GenderId" defaultValue={data.form.genders[0]?.value}>
            {data.form.genders.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-danger field-validation-valid" data-valmsg-for="GenderId">
            {fieldErrors.GenderId}
          </span>
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
        <div className="form-group">
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
