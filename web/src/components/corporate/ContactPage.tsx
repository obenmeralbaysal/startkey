"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { CaptchaNotice } from "@/components/forms/CaptchaNotice";
import { publicFormStatus } from "@/content/public-form-status";
import { CONTENT_OFFSET } from "@/lib/content-offset";
import type { CorporatePayload } from "@/lib/corporate";
import { executeRecaptchaV3Action } from "@/lib/recaptcha-v3";
import type { Locale } from "@/lib/locales";
import { scaled } from "@/lib/scale";

type ContactData = Extract<CorporatePayload, { kind: "contact" }>;

const CONTACT_FORM_CSS = `
    .contact-forms input {
        width: 100%;
        background: #f9f9f9;
        border: none;
        padding: calc(10px * var(--sk-scale, 1)) calc(15px * var(--sk-scale, 1));
        border-radius: calc(5px * var(--sk-scale, 1));
            height: calc(60px * var(--sk-scale, 1));
    }

    .contact-forms textarea {
    height: calc(163px * var(--sk-scale, 1));
    resize: none;
    padding-top: calc(18px * var(--sk-scale, 1));
        width: 100%;
        background: #f9f9f9;
        border: none;
        padding: calc(10px * var(--sk-scale, 1)) calc(15px * var(--sk-scale, 1));
        border-radius: calc(5px * var(--sk-scale, 1));
}

    .contact-forms .form-group {
        margin: 0 0 calc(20px * var(--sk-scale, 1));
    }
`;

export function ContactPage({ data, locale }: { data: ContactData; locale: Locale }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_FORM_CSS }} />
      <div className={CONTENT_OFFSET}>
        <Breadcrumb breadcrumb={data.breadcrumb} />
        <section className="contact-us-wrap [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
          <div className="container">
            <div className="sk-split pb-[calc(75px*var(--sk-scale,1))]">
              {data.items.map((item) => (
                <div className="sk-third" key={item.heading}>
                  <div className="contact-item" style={styleFrom(item.itemStyle)}>
                    <span className="contact-icon">
                      <i className={item.icon} />
                    </span>
                    <div className="[transition:0.3s]" style={styleFrom(item.infoStyle)}>
                      <h3 className="mb-[calc(10px*var(--sk-scale,1))] text-[calc(24px*var(--sk-scale,1))] leading-[1.3]">{item.heading}</h3>
                      <div className="[&_a]:block" dangerouslySetInnerHTML={{ __html: item.html }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sk-split">
              <div className="sk-half">
                <div className="max-lg:[margin-bottom:calc(30px_*_var(--sk-scale,_1))]">
                  <div className="relative [margin:0_0_calc(30px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))] [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_p]:pr-[calc(25px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:leading-none [&_span]:text-brand">
                    <span>{data.kicker}</span>
                    <h2>{data.pageHeading}</h2>
                    <p>{data.intro}</p>
                  </div>
                  <div className="work-time [background-color:#2f2f7e] [border-radius:calc(10px_*_var(--sk-scale,_1))] [padding-left:calc(30px_*_var(--sk-scale,_1))] [margin-top:calc(30px_*_var(--sk-scale,_1))] [margin-bottom:calc(30px_*_var(--sk-scale,_1))]">
                    <br />
                    <h4 className="mb-[calc(8px*var(--sk-scale,1))] text-[calc(24px*var(--sk-scale,1))] leading-[1.3] text-white">{data.hoursHeading}</h4>
                    {data.hours.map((row) => (
                      <div className="flex flex-wrap" key={row.value + row.labelHtml}>
                        <div className="w-full md:w-2/3">
                          <p
                            className="text-white"
                            dangerouslySetInnerHTML={{ __html: row.labelHtml }}
                          />
                        </div>
                        <div className="w-full md:w-1/3">
                          <p className="text-white">{row.value}</p>
                        </div>
                      </div>
                    ))}
                    <br />
                  </div>
                  <ul className="m-0 list-none p-0 [&_li]:mr-[calc(4px*var(--sk-scale,1))] [&_li]:inline-block [&_li:last-child]:mr-0 [&_a]:flex [&_a]:flex-col [&_a]:justify-center [&_a]:h-[calc(50px*var(--sk-scale,1))] [&_a]:w-[calc(50px*var(--sk-scale,1))] [&_a]:rounded-full [&_a]:border [&_a]:border-solid [&_a]:border-transparent [&_a]:bg-neutral-50 [&_a]:text-center [&_a]:transition-all [&_a]:duration-300 [&_a:hover]:bg-brand [&_i]:block [&_i]:text-[calc(20px*var(--sk-scale,1))] [&_i]:leading-[0.8] [&_i]:text-navy [&_a:hover_i]:text-white">
                    {data.social.map((item) => (
                      <li key={item.href}>
                        <a href={item.href} target="_blank" rel="noreferrer">
                          <i className={item.icon} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="sk-half">
                <ContactForm data={data} locale={locale} />
              </div>
            </div>
          </div>
        </section>
      </div>
      {data.mapSrc ? (
        <div className="contact-map">
          <a href={data.mapHref || undefined} target="_blank" rel="noreferrer" style={{ display: "block" }}>
            <iframe
              src={data.mapSrc}
              title={data.mapTitle || undefined}
              width="100%"
              height="500"
              style={{ border: 0, pointerEvents: "none", height: "500px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </a>
        </div>
      ) : null}
    </>
  );
}

function ContactForm({ data, locale }: { data: ContactData; locale: Locale }) {
  const messages = publicFormStatus[locale].contact;
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
      captchaToken = await executeRecaptchaV3Action("contact");
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
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: formData.get("Name"),
          surname: formData.get("Surname"),
          email: formData.get("Email"),
          phone: formData.get("Phone"),
          subject: formData.get("Subject"),
          message: formData.get("Message"),
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
    <form
      method="post"
      id="form"
      className="contact-form contact-forms"
      action={data.alternates[locale] ?? ""}
      onSubmit={handleSubmit}
    >
      <h3 className="form-title mb-[calc(8px*var(--sk-scale,1))] text-[calc(28px*var(--sk-scale,1))] leading-[1.3]">{data.formTitle}</h3>
      <div className="flex flex-wrap mx-[calc(-12px*var(--sk-scale,1))] [&>div]:box-border [&>div]:px-[calc(12px*var(--sk-scale,1))]">
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/2">
          <input className="" placeholder={data.placeholders.Name} type="text" id="Name" name="Name" defaultValue="" />
          <span className="text-brand field-validation-valid" data-valmsg-for="Name">
            {fieldErrors.Name}
          </span>
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/2">
          <input
            className=""
            placeholder={data.placeholders.Surname}
            type="text"
            id="Surname"
            name="Surname"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="Surname">
            {fieldErrors.Surname}
          </span>
          <i className="fal fa-user" />
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/2">
          <input
            className=""
            placeholder={data.placeholders.Email}
            type="email"
            id="Email"
            name="Email"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="Email">
            {fieldErrors.Email}
          </span>
          <i className="fal fa-envelope" />
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full md:w-1/2">
          <input className="" type="tel" id="Phone" name="Phone" defaultValue="" />
          <span className="text-brand field-validation-valid" data-valmsg-for="Phone">
            {fieldErrors.Phone}
          </span>
          <i className="fal fa-phone" />
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full">
          <input
            className=""
            placeholder={data.placeholders.Subject}
            type="text"
            id="Subject"
            name="Subject"
            defaultValue=""
          />
          <span className="text-brand field-validation-valid" data-valmsg-for="Subject">
            {fieldErrors.Subject}
          </span>
          <i className="fal fa-line" />
        </div>
        <div className="mb-[calc(20px*var(--sk-scale,1))] w-full">
          <textarea className="" placeholder={data.placeholders.Message} id="Message" name="Message" defaultValue="" />
          <span className="text-brand field-validation-valid" data-valmsg-for="Message">
            {fieldErrors.Message}
          </span>
          <i className="fal fa-comment" />
        </div>
        {captchaError ? (
          <span id="captchaError" className="text text-brand">
            {captchaError}
          </span>
        ) : null}
        <CaptchaNotice locale={locale} />
        <div className="form-btn w-full">
          <button className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" type="submit" disabled={submitting}>
            {data.submitLabel}
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

function styleFrom(value: string): CSSProperties | undefined {
  if (!value) {
    return undefined;
  }
  const style: CSSProperties = {};
  for (const part of value.split(";")) {
    const [rawKey, rawVal] = part.split(":");
    if (!rawKey || !rawVal) {
      continue;
    }
    const key = rawKey.trim();
    const val = rawVal.trim();
    if (key === "min-height") {
      style.minHeight = scaled(val);
    } else if (key === "align-content") {
      style.alignContent = val as CSSProperties["alignContent"];
    }
  }
  return Object.keys(style).length > 0 ? style : undefined;
}
