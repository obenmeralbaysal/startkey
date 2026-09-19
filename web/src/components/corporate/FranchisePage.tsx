"use client";

import { useEffect, useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { publicFormStatus } from "@/content/public-form-status";
import { config } from "@/lib/config";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

type FranchiseData = Extract<CorporatePayload, { kind: "franchise" }>;

export function FranchisePage({ data, locale }: { data: FranchiseData; locale: Locale }) {
  useEffect(() => {
    const widgetItems = document.querySelectorAll(".row .widget-item");
    widgetItems.forEach((item, index) => {
      const itemIndex = index + 1;
      item.classList.remove("order-1", "order-2", "order-md-1", "order-md-2", "order-lg-1", "order-lg-2");
      if (itemIndex % 4 === 1) {
        item.classList.add("order-lg-1", "order-md-1", "order-1");
      } else if (itemIndex % 4 === 2) {
        item.classList.add("order-lg-2", "order-md-2", "order-2");
      } else if (itemIndex % 4 === 3) {
        item.classList.add("order-lg-2", "order-md-2", "order-1");
      } else if (itemIndex % 4 === 0) {
        item.classList.add("order-lg-1", "order-md-1", "order-2");
      }
    });

    window.scrollToForm = () => {
      const form = document.getElementById("form");
      if (!form) {
        return;
      }
      const yOffset = -230;
      const y = form.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    return () => {
      delete window.scrollToForm;
    };
  }, [data.bodyHtml]);

  return (
    <>
      {data.widgetCss ? <style dangerouslySetInnerHTML={{ __html: data.widgetCss }} /> : null}
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container">
        <div className="section-title style2 text-center mb-40 mt-40">
          <h2>{data.formHeading}</h2>
        </div>
        <div className="row">
          <div className="col-lg-12">
            <FranchiseForm data={data} locale={locale} />
          </div>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
    </>
  );
}

function FranchiseForm({ data, locale }: { data: FranchiseData; locale: Locale }) {
  const messages = publicFormStatus[locale].franchise;
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
        setCaptchaError(data.captchaError);
        return;
      }
      setCaptchaError("");
      formData.set("g-recaptcha-response", captchaResponse);
    }

    const nextErrors: Record<string, string> = {};
    for (const [field, message] of Object.entries(data.required)) {
      const value = String(formData.get(field) ?? "").trim();
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
      const response = await fetch("/api/v1/franchise/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          first_name: formData.get("FirstName"),
          last_name: formData.get("LastName"),
          email: formData.get("Email"),
          phone: formData.get("Phone"),
          city_id: Number(formData.get("OpenOfficeCityId")),
          county_id: formData.get("OpenOfficeCountyId") ? Number(formData.get("OpenOfficeCountyId")) : null,
          notes: formData.get("Notes"),
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
    <form method="post" id="form" className="filter-widget" action={data.urlPath} onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-4 form-group">
          <input
            placeholder={data.placeholders.FirstName}
            type="text"
            data-val="true"
            data-val-required={data.required.FirstName}
            id="FirstName"
            name="FirstName"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="FirstName" data-valmsg-replace="true">
            {fieldErrors.FirstName}
          </span>
        </div>
        <div className="form-group col-md-4">
          <input
            className=""
            placeholder={data.placeholders.LastName}
            type="text"
            data-val="true"
            data-val-required={data.required.LastName}
            id="LastName"
            name="LastName"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="LastName" data-valmsg-replace="true">
            {fieldErrors.LastName}
          </span>
        </div>
        <div className="form-group col-md-4">
          <input
            className=""
            placeholder={data.placeholders.Email}
            type="email"
            data-val="true"
            data-val-required={data.required.Email}
            id="Email"
            name="Email"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="Email" data-valmsg-replace="true">
            {fieldErrors.Email}
          </span>
        </div>
        <div className="form-group col-md-4">
          <input
            className=""
            type="tel"
            data-val="true"
            data-val-required={data.required.Phone}
            id="Phone"
            name="Phone"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="Phone" data-valmsg-replace="true">
            {fieldErrors.Phone}
          </span>
        </div>
        <div className="form-group col-md-4">
          <select
            className="select2"
            data-val="true"
            data-val-required={data.required.OpenOfficeCityId}
            id="OpenOfficeCityId"
            name="OpenOfficeCityId"
            defaultValue=""
          >
            {data.cities.map((option) => (
              <option key={`${option.value}-${option.label}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span
            className="text-danger field-validation-valid"
            data-valmsg-for="OpenOfficeCityId"
            data-valmsg-replace="true"
          >
            {fieldErrors.OpenOfficeCityId}
          </span>
        </div>
        <div className="form-group col-md-4">
          <select
            className="bind-select2"
            bind-id="OpenOfficeCityId"
            bind-query="cityId"
            id="OpenOfficeCountyId"
            name="OpenOfficeCountyId"
            bind-url={data.countyBindUrl}
            defaultValue=""
          >
          </select>
          <span
            className="text-danger field-validation-valid"
            data-valmsg-for="OpenOfficeCountyId"
            data-valmsg-replace="true"
          >
            {fieldErrors.OpenOfficeCountyId}
          </span>
        </div>
        <div className="form-group col-md-12">
          <textarea className="" rows={2} placeholder={data.placeholders.Notes} id="Notes" name="Notes" defaultValue="" />
          <span className="text-danger field-validation-valid" data-valmsg-for="Notes" data-valmsg-replace="true">
            {fieldErrors.Notes}
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
        <div className="col-md-12">
          <div className="form-group">
            <div className="send-btn text-center">
              <button type="submit" className="btn style2 text-uppercase" disabled={submitting}>
                {data.submitLabel}
              </button>
            </div>
          </div>
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
