"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { publicFormStatus } from "@/content/public-form-status";
import { config } from "@/lib/config";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

type ConsultantDetailData = Extract<CorporatePayload, { kind: "consultant-detail" }>;

export function ConsultantDetail({ data, locale }: { data: ConsultantDetailData; locale: Locale }) {
  const tabs = data.tabs;
  const portfoliosTab = tabs.find((tab) => tab.id === "tab_2") ?? tabs[1];
  const activeId = portfoliosTab?.id ?? "tab_2";

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container ptb-100">
        <div className="agent-details-wrap">
          <div className="row gx-5 align-items-center">
            <div className="col-lg-6">
              <div className="agent-img">
                <a href={data.urlPath}>
                  <Picture width={574} height={574}>
                    {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                    <img src={data.image} alt="User-photo" width={574} height={574} />
                  </Picture>
                </a>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="agent-info-wrap">
                <div className="agent-name">
                  <h2>{data.name}</h2>
                  {data.role ? <span>{data.role}</span> : null}
                </div>
                <ul className="agent-info list-style">
                  {data.email ? (
                    <li>
                      <b>{data.contactLabels.email}</b> <a href={`mailto:${data.email}`}> {data.email}</a>
                    </li>
                  ) : null}
                  {data.phoneHref ? (
                    <li>
                      <b>{data.contactLabels.phone}</b> <a href={data.phoneHref} target="_blank">{data.phoneLabel}</a>
                    </li>
                  ) : null}
                  {data.officeName ? (
                    <li>
                      <b>{data.contactLabels.office}</b> <a href={data.officeHref}> {data.officeName}</a>
                    </li>
                  ) : null}
                </ul>
                <div className="agent-social">
                  <ul className="social-profile list-style style1" />
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="agent-desc">
                <ul className="nav nav-tabs agent-tablist" role="tablist">
                  {tabs.map((tab) => (
                    <li className="nav-item" key={tab.id}>
                      <button
                        className={tab.id === activeId ? "nav-link active" : "nav-link"}
                        data-bs-toggle="tab"
                        data-bs-target={`#${tab.id}`}
                        type="button"
                        role="tab"
                      >
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="tab-content hw-tab-content">
                  <div className={activeId === "tab_1" ? "tab-pane fade show active" : "tab-pane fade"} id="tab_1" role="tabpanel">
                    <div className="row justify-content-center" dangerouslySetInnerHTML={{ __html: data.bioHtml }} />
                  </div>
                  <div className={activeId === "tab_2" ? "tab-pane fade show active" : "tab-pane fade"} id="tab_2" role="tabpanel">
                    {data.listings.length > 0 ? (
                      <section className="property-slider-wrap td-cod">
                        <div className="container">
                          <div className="property-slider-one homepage-featured-prop owl-carousel" id="propcarousel">
                            {data.listings.map((item) => (
                              <ListingCard item={{ ...item, style: "style6" }} key={`consultant-listing-${item.externalId}`} />
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}
                    {data.allListingsLabel ? (
                      <div className="col-md-12" style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
                        <a className="btn style2" target="_blank" href={data.allListingsHref}>
                          {data.allListingsLabel}
                        </a>
                      </div>
                    ) : null}
                  </div>
                  <div className={activeId === "tab_3" ? "tab-pane fade show active" : "tab-pane fade"} id="tab_3" role="tabpanel">
                    {data.commentHeading ? <h4 style={{ marginTop: 15, marginBottom: 15 }}>{data.commentHeading}</h4> : null}
                    <ConsultantCommentForm data={data} locale={locale} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ConsultantCommentForm({ data, locale }: { data: ConsultantDetailData; locale: Locale }) {
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
