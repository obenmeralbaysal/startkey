"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { CaptchaNotice } from "@/components/forms/CaptchaNotice";
import { publicFormStatus } from "@/content/public-form-status";
import type { CorporatePayload } from "@/lib/corporate";
import { executeRecaptchaV3Action } from "@/lib/recaptcha-v3";
import type { Locale } from "@/lib/locales";
import { scaled } from "@/lib/scale";

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
      <section className="pt-100 pb-75">
        <div className="container">
          <div className="sk-split">
            <div className="sk-two-thirds">
              <div className="block">
                <div className="flex flex-wrap items-start">
                  <div className="w-full">
                    <div className="[margin:0_0_calc(30px_*_var(--sk-scale,_1))] max-md:[margin:0_0_calc(10px_*_var(--sk-scale,_1))]">
                      <h2 className="text-[calc(32px*var(--sk-scale,1))] leading-[1.3]">{data.title}</h2>
                      <ul className="flex flex-wrap justify-between [border:none] bg-neutral-50 [box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.06)] list-none">
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
                  <div className="overflow-hidden relative [border-radius:calc(5px_*_var(--sk-scale,_1))] [margin-bottom:calc(30px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                    <img src={data.image} alt="Image" />
                  </div>
                ) : null}
                <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] last:[margin-bottom:0] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <h4>{data.locationHeading}</h4>
                  <div className="flex flex-wrap">
                    <div className="w-full">
                      <ul className="list-none">
                        <li>
                          <i className="flaticon-location" style={{ paddingRight: scaled(7) }} />
                          {data.locationValue}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] last:[margin-bottom:0] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <h4>{data.descriptionHeading}</h4>
                  <div className="cms" dangerouslySetInnerHTML={{ __html: data.descriptionHtml }} />
                </div>
              </div>
            </div>
            <div className="sk-third">
              <div className="sidebar">
                {data.hasApplicationForm ? (
                  <div className="sidebar-widget">
                    {data.form.paymentHtml ? (
                      <div className="sk-training-payment" dangerouslySetInnerHTML={{ __html: data.form.paymentHtml }} />
                    ) : null}
                    <h4>{data.formHeading}</h4>
                    <TrainingApplicationForm data={data} locale={locale} />
                  </div>
                ) : null}
                {data.related.length > 0 ? (
                  <div className="[margin:0_0_calc(30px_*_var(--sk-scale,_1))] relative z-[1] [padding:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] last:[margin:0] max-md:[padding:calc(20px_*_var(--sk-scale,_1))]">
                    <h4 className="mb-[calc(25px*var(--sk-scale,1))] text-[calc(24px*var(--sk-scale,1))] leading-[calc(24px*var(--sk-scale,1))]">{data.relatedHeading}</h4>
                    {data.related.map((item) => (
                      <div className="flex flex-wrap items-center [margin:0_0_calc(15px_*_var(--sk-scale,_1))] last:[margin-bottom:0]" key={`${item.externalId}-${item.urlPath}`}>
                        <div className="[width:calc(80px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))]">
                          <img className="block" src={item.image} alt="image" />
                        </div>
                        <div className="[width:calc(100%_-_calc(95px_*_var(--sk-scale,_1)))] [margin-left:calc(15px_*_var(--sk-scale,_1))]">
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

    let captchaToken: string | null = null;
    try {
      captchaToken = await executeRecaptchaV3Action("training");
    } catch {
      setCaptchaError(data.form.captchaError);
      return;
    }
    setCaptchaError("");

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
    <form method="post" id="form" className="block form sk-filter-form" action={data.urlPath} onSubmit={handleSubmit}>
      <div className="flex flex-wrap mx-[calc(-12px*var(--sk-scale,1))] [&>div]:box-border [&>div]:w-full [&>div]:px-[calc(12px*var(--sk-scale,1))]">
        <div className="mb-[calc(20px*var(--sk-scale,1))]">
          <input
            placeholder={data.form.placeholders.firstName}
            type="text"
            id="FirstName"
            name="FirstName"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="FirstName">
            {fieldErrors.FirstName}
          </span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))]">
          <input
            placeholder={data.form.placeholders.lastName}
            type="text"
            id="LastName"
            name="LastName"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="LastName">
            {fieldErrors.LastName}
          </span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))]">
          <input
            placeholder={data.form.placeholders.email}
            type="email"
            id="Email"
            name="Email"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="Email">
            {fieldErrors.Email}
          </span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))]">
          <input id="PhoneNew" className="intl-phone" type="tel" name="Phone" defaultValue="" />
          <span className="text-brand field-validation-valid" data-valmsg-for="Phone">
            {fieldErrors.PhoneNew}
          </span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))]">
          <select className="search-fields" id="GenderId" name="GenderId" defaultValue={data.form.genders[0]?.value}>
            {data.form.genders.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-brand field-validation-valid" data-valmsg-for="GenderId">
            {fieldErrors.GenderId}
          </span>
        </div>
        {captchaError ? (
          <span id="captchaError" className="text text-brand">
            {captchaError}
          </span>
        ) : null}
        <CaptchaNotice locale={locale} />
        <div className="mb-[calc(20px*var(--sk-scale,1))]">
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
