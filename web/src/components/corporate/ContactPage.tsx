"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { publicFormStatus } from "@/content/public-form-status";
import { config } from "@/lib/config";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

type ContactData = Extract<CorporatePayload, { kind: "contact" }>;

const CONTACT_FORM_CSS = `
    .contact-forms input {
        width: 100%;
        background: #f9f9f9;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
            height: 60px;
    }

    .contact-forms textarea {
    height: 163px;
    resize: none;
    padding-top: 18px;
        width: 100%;
        background: #f9f9f9;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
}

    .contact-forms .form-group {
        margin: 0 0 20px;
    }
`;

export function ContactPage({ data, locale }: { data: ContactData; locale: Locale }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_FORM_CSS }} />
      <div className="content-wrapper">
        <Breadcrumb breadcrumb={data.breadcrumb} />
        <section className="contact-us-wrap ptb-100">
          <div className="container">
            <div className="row justify-content-center pb-75">
              {data.items.map((item) => (
                <div className="col-xl-4 col-lg-4 col-md-6" key={item.heading}>
                  <div className="contact-item" style={styleFrom(item.itemStyle)}>
                    <span className="contact-icon">
                      <i className={item.icon} />
                    </span>
                    <div className="contact-info" style={styleFrom(item.infoStyle)}>
                      <h3>{item.heading}</h3>
                      <div dangerouslySetInnerHTML={{ __html: item.html }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row">
              <div className="col-lg-6 col-12" style={{ alignContent: "center" }}>
                <div className="contact-content">
                  <div className="content-title style1">
                    <span>{data.kicker}</span>
                    <h2>{data.pageHeading}</h2>
                    <p>{data.intro}</p>
                  </div>
                  <div className="container work-time mt-30 mb-30">
                    <br />
                    <h4 className="work-time-text">{data.hoursHeading}</h4>
                    {data.hours.map((row) => (
                      <div className="row" key={row.value + row.labelHtml}>
                        <div className="col-md-8">
                          <p
                            className="work-time-text"
                            dangerouslySetInnerHTML={{ __html: row.labelHtml }}
                          />
                        </div>
                        <div className="col-md-4">
                          <p className="work-time-text">{row.value}</p>
                        </div>
                      </div>
                    ))}
                    <br />
                  </div>
                  <ul className="social-profile list-style style1">
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
              <div className="col-lg-6 col-12">
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
              style={{ border: 0, pointerEvents: "none" }}
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
    <form
      method="post"
      id="form"
      className="contact-form contact-forms"
      action={data.alternates[locale] ?? ""}
      onSubmit={handleSubmit}
    >
      <h3 className="form-title">{data.formTitle}</h3>
      <div className="row">
        <div className="form-group col-md-6">
          <input className="" placeholder={data.placeholders.Name} type="text" id="Name" name="Name" defaultValue="" />
          <span className="text-danger field-validation-valid" data-valmsg-for="Name">
            {fieldErrors.Name}
          </span>
        </div>
        <div className="form-group col-md-6">
          <input
            className=""
            placeholder={data.placeholders.Surname}
            type="text"
            id="Surname"
            name="Surname"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="Surname">
            {fieldErrors.Surname}
          </span>
          <i className="fal fa-user" />
        </div>
        <div className="form-group col-md-6">
          <input
            className=""
            placeholder={data.placeholders.Email}
            type="email"
            id="Email"
            name="Email"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="Email">
            {fieldErrors.Email}
          </span>
          <i className="fal fa-envelope" />
        </div>
        <div className="form-group col-md-6">
          <input className="" type="tel" id="Phone" name="Phone" defaultValue="" />
          <span className="text-danger field-validation-valid" data-valmsg-for="Phone">
            {fieldErrors.Phone}
          </span>
          <i className="fal fa-phone" />
        </div>
        <div className="form-group col-md-12">
          <input
            className=""
            placeholder={data.placeholders.Subject}
            type="text"
            id="Subject"
            name="Subject"
            defaultValue=""
          />
          <span className="text-danger field-validation-valid" data-valmsg-for="Subject">
            {fieldErrors.Subject}
          </span>
          <i className="fal fa-line" />
        </div>
        <div className="form-group col-12">
          <textarea className="" placeholder={data.placeholders.Message} id="Message" name="Message" defaultValue="" />
          <span className="text-danger field-validation-valid" data-valmsg-for="Message">
            {fieldErrors.Message}
          </span>
          <i className="fal fa-comment" />
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
        <div className="form-btn col-12">
          <button className="btn style2" type="submit" disabled={submitting}>
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
      style.minHeight = val;
    } else if (key === "align-content") {
      style.alignContent = val as CSSProperties["alignContent"];
    }
  }
  return Object.keys(style).length > 0 ? style : undefined;
}
