"use client";

import { useEffect, useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { CaptchaNotice } from "@/components/forms/CaptchaNotice";
import { publicFormStatus } from "@/content/public-form-status";
import type { CorporatePayload } from "@/lib/corporate";
import { executeRecaptchaV3Action } from "@/lib/recaptcha-v3";
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
        <div className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))] [margin-top:calc(40px_*_var(--sk-scale,_1))]">
          <h2>{data.formHeading}</h2>
        </div>
        <div className="flex flex-wrap">
          <div className="w-full">
            <FranchiseForm data={data} locale={locale} />
          </div>
        </div>
      </div>
      <div className="cms" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
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

    let captchaToken: string | null = null;
    try {
      captchaToken = await executeRecaptchaV3Action("franchise");
    } catch {
      setCaptchaError(data.captchaError);
      return;
    }
    setCaptchaError("");

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
          captcha_token: captchaToken,
        }),
      });

      if (response.status === 201) {
        setStatus({ kind: "success", message: messages.success });
        form.reset();
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
    <form method="post" id="form" className="block" action={data.urlPath} onSubmit={handleSubmit}>
      <div className="sk-form-row flex flex-wrap">
        <div className="w-full md:w-1/3 mb-[calc(15px*var(--sk-scale,1))]">
          <input
            placeholder={data.placeholders.FirstName}
            type="text"
            data-val="true"
            data-val-required={data.required.FirstName}
            id="FirstName"
            name="FirstName"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="FirstName" data-valmsg-replace="true">
            {fieldErrors.FirstName}
          </span>
        </div>
        <div className="mb-[calc(15px*var(--sk-scale,1))] w-full md:w-1/3">
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
          <span className="text-brand field-validation-valid" data-valmsg-for="LastName" data-valmsg-replace="true">
            {fieldErrors.LastName}
          </span>
        </div>
        <div className="mb-[calc(15px*var(--sk-scale,1))] w-full md:w-1/3">
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
          <span className="text-brand field-validation-valid" data-valmsg-for="Email" data-valmsg-replace="true">
            {fieldErrors.Email}
          </span>
        </div>
        <div className="mb-[calc(15px*var(--sk-scale,1))] w-full md:w-1/3">
          <input
            className=""
            type="tel"
            data-val="true"
            data-val-required={data.required.Phone}
            id="Phone"
            name="Phone"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="Phone" data-valmsg-replace="true">
            {fieldErrors.Phone}
          </span>
        </div>
        <div className="mb-[calc(15px*var(--sk-scale,1))] w-full md:w-1/3">
          <select
            className=""
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
            className="text-brand field-validation-valid"
            data-valmsg-for="OpenOfficeCityId"
            data-valmsg-replace="true"
          >
            {fieldErrors.OpenOfficeCityId}
          </span>
        </div>
        <div className="mb-[calc(15px*var(--sk-scale,1))] w-full md:w-1/3">
          <select
            className=""
            bind-id="OpenOfficeCityId"
            bind-query="cityId"
            id="OpenOfficeCountyId"
            name="OpenOfficeCountyId"
            bind-url={data.countyBindUrl}
            defaultValue=""
          >
          </select>
          <span
            className="text-brand field-validation-valid"
            data-valmsg-for="OpenOfficeCountyId"
            data-valmsg-replace="true"
          >
            {fieldErrors.OpenOfficeCountyId}
          </span>
        </div>
        <div className="mb-[calc(15px*var(--sk-scale,1))] w-full">
          <textarea className="" rows={2} placeholder={data.placeholders.Notes} id="Notes" name="Notes" defaultValue="" />
          <span className="text-brand field-validation-valid" data-valmsg-for="Notes" data-valmsg-replace="true">
            {fieldErrors.Notes}
          </span>
        </div>
        {captchaError ? (
          <span id="captchaError" className="text text-brand">
            {captchaError}
          </span>
        ) : null}
        <CaptchaNotice locale={locale} />
        <div className="w-full">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <div className="send-btn text-center">
              <button type="submit" className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100 uppercase" disabled={submitting}>
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
