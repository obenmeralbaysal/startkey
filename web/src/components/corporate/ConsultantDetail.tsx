"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { memberLine } from "@/components/corporate/DirectoryCard";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { RankBadges } from "@/components/corporate/RankBadges";
import { CaptchaNotice } from "@/components/forms/CaptchaNotice";
import { publicFormStatus } from "@/content/public-form-status";
import type { CorporatePayload } from "@/lib/corporate";
import { executeRecaptchaV3Action } from "@/lib/recaptcha-v3";
import type { Locale } from "@/lib/locales";
type ConsultantDetailData = Extract<CorporatePayload, { kind: "consultant-detail" }>;

export function ConsultantDetail({ data, locale }: { data: ConsultantDetailData; locale: Locale }) {
  const tabs = data.tabs;
  const [activeId, setActiveId] = useState(tabs.find((tab) => tab.id === "tab_2")?.id ?? "tab_2");

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container sk-agent-page">
        <div className="sk-agent">
          <div className="sk-agent-row">
            <div className="sk-agent-half sk-agent-photo">
              <div className="sk-photo-frame sk-photo-frame-detail sk-photo-frame-fill">
                <Picture width={574} height={574}>
                  {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                  <img className="sk-photo" src={data.image} alt="User-photo" width={574} height={574} style={{ "--sk-photo-w": 574, "--sk-photo-h": 574 }} />
                </Picture>
              </div>
            </div>
            <div className="sk-agent-half">
              <div className="sk-agent-name">
                <h2>{data.name}</h2>
                {memberLine(data) ? <span>{memberLine(data)}</span> : null}
                <RankBadges badges={data.rankBadges} locale={locale} variant="detail" />
              </div>
              <ul className="sk-agent-info">
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
            </div>
            <div>
              <ul className="sk-agent-tabs" role="tablist">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button className={tab.id === activeId ? "active" : ""} type="button" role="tab" aria-selected={tab.id === activeId} onClick={() => setActiveId(tab.id)}>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
              {activeId === "tab_1" ? <div dangerouslySetInnerHTML={{ __html: data.bioHtml }} /> : null}
              {activeId === "tab_2" ? (
                <div>
                  {data.listings.length > 0 ? (
                    <div className="homepage-featured-prop" data-carousel="cards">
                      {data.listings.map((item) => (
                        <ListingCard item={{ ...item, style: "style6" }} key={`consultant-listing-${item.externalId}`} />
                      ))}
                    </div>
                  ) : data.emptyListingsLabel ? (
                    <p className="sk-empty-listings">{data.emptyListingsLabel}</p>
                  ) : null}
                  {data.allListingsLabel ? (
                    <a className="sk-btn" href={data.allListingsHref}>{data.allListingsLabel}</a>
                  ) : null}
                  {data.mineListingsLabel ? (
                    <a className="sk-btn sk-btn-navy" href={data.mineListingsHref} style={{ marginLeft: "calc(10px * var(--sk-scale, 1))" }}>{data.mineListingsLabel}</a>
                  ) : null}
                </div>
              ) : null}
              {activeId === "tab_3" ? (
                <div>
                  {(data.comments ?? []).map((comment) => (
                    <article className="comment-item" key={`${comment.date}-${comment.firstName}-${comment.text.slice(0, 24)}`}>
                      <h5>{[comment.firstName, comment.lastName].filter(Boolean).join(" ")}</h5>
                      {comment.date ? <span className="comment-date">{comment.date}</span> : null}
                      <p>{comment.text}</p>
                    </article>
                  ))}
                  {data.commentHeading ? <h4 className="sk-comment-heading">{data.commentHeading}</h4> : null}
                  <ConsultantCommentForm data={data} locale={locale} />
                </div>
              ) : null}
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

    let captchaToken: string | null = null;
    try {
      captchaToken = await executeRecaptchaV3Action("comment");
    } catch {
      setCaptchaError(data.form.captchaError);
      return;
    }
    setCaptchaError("");

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
          captcha_token: captchaToken,
        }),
      });

      if (response.status === 201) {
        setStatus({ kind: "success", message: messages.success });
        form.reset();
        setRating(0);
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
      <div className="sk-form-row flex flex-wrap">
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
        {captchaError ? (
          <span id="captchaError" className="text text-brand">
            {captchaError}
          </span>
        ) : null}
        <CaptchaNotice locale={locale} />
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
