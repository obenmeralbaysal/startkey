"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { publicFormStatus } from "@/content/public-form-status";
import { config } from "@/lib/config";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";
import { scaled } from "@/lib/scale";

type ConsultantDetailData = Extract<CorporatePayload, { kind: "consultant-detail" }>;

export function ConsultantDetail({ data, locale }: { data: ConsultantDetailData; locale: Locale }) {
  const tabs = data.tabs;
  const portfoliosTab = tabs.find((tab) => tab.id === "tab_2") ?? tabs[1];
  const activeId = portfoliosTab?.id ?? "tab_2";

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="[box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] [padding:calc(50px_*_var(--sk-scale,_1))_calc(50px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))] max-md:[padding:0] max-md:[box-shadow:none] max-md:[margin-bottom:calc(-25px_*_var(--sk-scale,_1))] md:max-lg:[padding:calc(35px_*_var(--sk-scale,_1))_calc(35px_*_var(--sk-scale,_1))_calc(10px_*_var(--sk-scale,_1))]">
          <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))] items-center">
            <div className="w-full lg:w-1/2">
              <div className="[width:calc(70px_*_var(--sk-scale,_1))] [height:calc(70px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] overflow-hidden relative max-lg:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                <a href={data.urlPath}>
                  <Picture width={574} height={574}>
                    {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                    <img src={data.image} alt="User-photo" width={574} height={574} />
                  </Picture>
                </a>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="block">
                <div className="[width:calc(100%_-_calc(85px_*_var(--sk-scale,_1)))] [margin-left:calc(15px_*_var(--sk-scale,_1))] [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)] max-md:[padding-bottom:calc(20px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                  <h2>{data.name}</h2>
                  {data.role ? <span>{data.role}</span> : null}
                </div>
                <ul className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))_calc(22px_*_var(--sk-scale,_1))] text-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)] list-none">
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
                <div className="flex flex-wrap items-center">
                  <ul className="[margin:calc(20px_*_var(--sk-scale,_1))_0_calc(20px_*_var(--sk-scale,_1))] [margin-top:calc(25px_*_var(--sk-scale,_1))] text-right max-md:text-center list-none" />
                </div>
              </div>
            </div>
            <div className="w-full">
              <div className="[margin-top:calc(25px_*_var(--sk-scale,_1))]">
                <ul className="flex flex-wrap [padding-left:0] [margin-bottom:0] list-none [border:none] [margin-bottom:calc(30px_*_var(--sk-scale,_1))]" role="tablist">
                  {tabs.map((tab) => (
                    <li className="relative list-none" key={tab.id}>
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
                <div className="w-full hw-tab-content">
                  <div className={activeId === "tab_1" ? "tab-pane fade show active" : "tab-pane fade"} id="tab_1" role="tabpanel">
                    <div className="flex flex-wrap justify-center" dangerouslySetInnerHTML={{ __html: data.bioHtml }} />
                  </div>
                  <div className={activeId === "tab_2" ? "tab-pane fade show active" : "tab-pane fade"} id="tab_2" role="tabpanel">
                    {data.listings.length > 0 ? (
                      <section className="property-slider-wrap td-cod">
                        <div className="container">
                          <div className="homepage-featured-prop" data-carousel="cards">
                            {data.listings.map((item) => (
                              <ListingCard item={{ ...item, style: "style6" }} key={`consultant-listing-${item.externalId}`} />
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}
                    {data.allListingsLabel ? (
                      <div className="w-full" style={{ display: "flex", justifyContent: "center", marginTop: scaled(30) }}>
                        <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" target="_blank" href={data.allListingsHref}>
                          {data.allListingsLabel}
                        </a>
                      </div>
                    ) : null}
                  </div>
                  <div className={activeId === "tab_3" ? "tab-pane fade show active" : "tab-pane fade"} id="tab_3" role="tabpanel">
                    {data.commentHeading ? <h4 style={{ marginTop: scaled(15), marginBottom: scaled(15) }}>{data.commentHeading}</h4> : null}
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
