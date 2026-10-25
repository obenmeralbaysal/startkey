"use client";

import { useEffect, useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { CaptchaNotice } from "@/components/forms/CaptchaNotice";
import { publicFormStatus } from "@/content/public-form-status";
import type { CorporatePayload } from "@/lib/corporate";
import { executeRecaptchaV3Action } from "@/lib/recaptcha-v3";
import type { Locale } from "@/lib/locales";

type ConsultantData = Extract<CorporatePayload, { kind: "consultant-application" }>;

export function ConsultantApplicationPage({ data, locale }: { data: ConsultantData; locale: Locale }) {
  useEffect(() => {
    const widgetItems = document.querySelectorAll(".row .widget-item");
    widgetItems.forEach((item, index) => {
      const itemIndex = index + 1;
      item.classList.remove("order-1", "order-2", "order-md-1", "order-md-2", "order-lg-1", "order-lg-2");
      if (itemIndex % 4 === 1) {
        item.classList.add("order-lg-2", "order-md-2", "order-1");
      } else if (itemIndex % 4 === 2) {
        item.classList.add("order-lg-1", "order-md-1", "order-2");
      } else if (itemIndex % 4 === 3) {
        item.classList.add("order-lg-1", "order-md-1", "order-1");
      } else if (itemIndex % 4 === 0) {
        item.classList.add("order-lg-2", "order-md-2", "order-2");
      }
    });

    // Reference `scrollToForm()`: the form lands 230px below the top of the window.
    const scrollToForm = () => {
      const form = document.getElementById("form");
      if (!form) return;
      window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 230, behavior: "smooth" });
    };
    const triggers = document.querySelectorAll<HTMLElement>("[data-scroll-to-form]");
    triggers.forEach((trigger) => trigger.addEventListener("click", scrollToForm));
    return () => triggers.forEach((trigger) => trigger.removeEventListener("click", scrollToForm));
  }, [data.bodyHtml]);

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container">
        <div className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))] [margin-top:calc(40px_*_var(--sk-scale,_1))]">
          <h2>{data.formHeading}</h2>
        </div>
        <div className="flex flex-wrap">
          <div className="w-full">
            <ConsultantForm data={data} locale={locale} />
          </div>
        </div>
      </div>
      {data.bodyHtml ? <div className="cms" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} /> : null}
    </>
  );
}

function ConsultantForm({ data, locale }: { data: ConsultantData; locale: Locale }) {
  const messages = publicFormStatus[locale].franchise;
  const choose = "Seçiniz";
  const [cities, setCities] = useState<{ id: string; text: string }[]>([]);
  const [counties, setCounties] = useState<{ id: string; text: string }[]>([]);
  const [offices, setOffices] = useState<{ id: number; name: string }[]>([]);
  const [cityId, setCityId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [captchaError, setCaptchaError] = useState("");

  useEffect(() => {
    fetch(`/api/v1/lookups/cities?locale=${locale}`)
      .then((response) => response.json())
      .then((body) => setCities(body.items ?? []))
      .catch(() => setCities([]));
    fetch("/api/v1/consultant-applications/offices")
      .then((response) => response.json())
      .then((body) => setOffices(body.data ?? []))
      .catch(() => setOffices([]));
  }, [locale]);

  useEffect(() => {
    if (!cityId) {
      setCounties([]);
      return;
    }
    fetch(`/api/v1/lookups/counties?locale=${locale}&cityId=${encodeURIComponent(cityId)}`)
      .then((response) => response.json())
      .then((body) => setCounties((body.items ?? []).filter((item: { id: string }) => item.id !== "")))
      .catch(() => setCounties([]));
  }, [cityId, locale]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors: Record<string, string> = {};
    for (const field of ["FirstName", "LastName", "Email", "Phone", "OfficeCityId", "OfficeId", "AppealTypeId"]) {
      if (!String(formData.get(field) ?? "").trim()) {
        nextErrors[field] = data.required[field] ?? "";
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    let captchaToken: string | null = null;
    try {
      captchaToken = await executeRecaptchaV3Action("consultant");
    } catch {
      setCaptchaError(data.captchaError);
      return;
    }
    setCaptchaError("");

    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/v1/consultant-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          first_name: formData.get("FirstName"),
          last_name: formData.get("LastName"),
          email: formData.get("Email"),
          phone: formData.get("Phone"),
          city_id: Number(formData.get("OfficeCityId")),
          county_id: formData.get("OfficeCountyId") ? Number(formData.get("OfficeCountyId")) : null,
          office_id: Number(formData.get("OfficeId")),
          position: Number(formData.get("AppealTypeId")),
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
      const body = await response.json().catch(() => ({}));
      setStatus({
        kind: "error",
        message: response.status === 429 ? messages.throttled : body.message || messages.failed,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="block sk-filter-form" id="form" noValidate onSubmit={handleSubmit}>
      {status ? <p className={status.kind === "success" ? "text-success" : "text-danger"}>{status.message}</p> : null}
      <div className="flex flex-wrap mx-[calc(-12px*var(--sk-scale,1))] [&>div]:box-border [&>div]:px-[calc(12px*var(--sk-scale,1))]">
        <Field id="FirstName" name="FirstName" placeholder={data.placeholders.FirstName} error={fieldErrors.FirstName} required={data.required.FirstName} />
        <Field id="LastName" name="LastName" placeholder={data.placeholders.LastName} error={fieldErrors.LastName} required={data.required.LastName} />
        <Field id="Email" name="Email" type="email" placeholder={data.placeholders.Email} error={fieldErrors.Email} required={data.required.Email} />
        <Field id="Phone" name="Phone" type="tel" error={fieldErrors.Phone} required={data.required.Phone} />
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/3">
          <select
            id="OfficeCityId"
            name="OfficeCityId"
            className=""
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
          >
            <option value="">{choose}</option>
            {cities.filter((city) => city.id !== "").map((city) => (
              <option key={city.id} value={city.id}>{city.text}</option>
            ))}
          </select>
          <span className="text-brand">{fieldErrors.OfficeCityId}</span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/3">
          <select id="OfficeCountyId" name="OfficeCountyId" key={cityId} defaultValue="">
            <option value="">{choose}</option>
            {counties.map((county) => (
              <option key={county.id} value={county.id}>{county.text}</option>
            ))}
          </select>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/3">
          <select id="OfficeId" name="OfficeId" className="" defaultValue="">
            <option value="">{choose}</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>
          <span className="text-brand">{fieldErrors.OfficeId}</span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/3">
          <select id="AppealTypeId" name="AppealTypeId" className="" defaultValue="">
            <option value="">{choose}</option>
            {data.positions.map((position) => (
              <option key={position.value} value={position.value}>{position.label}</option>
            ))}
          </select>
          <span className="text-brand">{fieldErrors.AppealTypeId}</span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full">
          <textarea id="Notes" name="Notes" rows={3} placeholder={data.placeholders.Notes} />
        </div>
      </div>
      {captchaError ? (
        <span id="captchaError" className="text text-brand">
          {captchaError}
        </span>
      ) : null}
      <CaptchaNotice locale={locale} />
      <button className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand uppercase text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" type="submit" disabled={submitting}>{data.submitLabel}</button>
    </form>
  );
}

function Field({
  id,
  name,
  placeholder,
  error,
  required,
  type = "text",
}: {
  id: string;
  name: string;
  placeholder?: string;
  error?: string;
  required: string;
  type?: string;
}) {
  return (
    <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/3">
      <input id={id} name={name} type={type} placeholder={placeholder} data-val-required={required} defaultValue="" />
      <span className="text-brand">{error}</span>
    </div>
  );
}
