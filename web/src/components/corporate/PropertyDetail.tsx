"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { publicFormStatus } from "@/content/public-form-status";
import { config } from "@/lib/config";
import type { CorporatePayload, ListingAgentData } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

type ListingDetailData = Extract<CorporatePayload, { kind: "listing-detail" }>;

const AGENT_CARD_CSS = `
    .agent-card-modern {
        padding: 0 !important;
        overflow: hidden;
        border-radius: 14px;
        background: #fff;
    }
    .agent-card-modern .acm-head {
        position: relative;
        height: 96px;
        background: linear-gradient(135deg, #EC3323 0%, #9e1a10 100%);
    }
    .agent-card-modern .acm-avatar {
        position: absolute;
        left: 50%;
        bottom: -55px;
        transform: translateX(-50%);
        width: 110px;
        height: 110px;
        border-radius: 50%;
        overflow: hidden;
        background: #fff;
        border: 4px solid #fff;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
    }
    .agent-card-modern .acm-avatar a,
    .agent-card-modern .acm-avatar picture,
    .agent-card-modern .acm-avatar img {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
    .agent-card-modern .acm-body {
        padding: 68px 20px 24px;
        text-align: center;
    }
    .agent-card-modern .acm-name {
        margin: 0 0 6px;
        font-size: 19px;
        font-weight: 700;
        line-height: 1.3;
    }
    .agent-card-modern .acm-name a {
        color: inherit;
        transition: color .25s ease;
    }
    .agent-card-modern .acm-name a:hover {
        color: #EC3323;
    }
    .agent-card-modern .acm-contact {
        list-style: none;
        padding: 0;
        margin: 16px 0 0;
    }
    .agent-card-modern .acm-contact li {
        margin: 0 0 8px;
    }
    .agent-card-modern .acm-contact li:last-child {
        margin-bottom: 0;
    }
    .agent-card-modern .acm-contact li a {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: inherit;
    }
    .agent-card-modern .acm-contact li a:hover {
        color: #EC3323;
    }
    .agent-card-modern .acm-contact li a i {
        font-size: 16px;
    }
    .agent-card-modern .acm-contact li a.agent-mail {
        overflow: hidden;
        white-space: nowrap;
    }
    .dw-proprty-info li {
        margin-top: 0.2rem;
        font-size: 0.9em !important;
        border-bottom: 1px dotted #b0b0b0 !important;
    }
    .dw-proprty-info li strong {
        width: 140px !important;
    }
`;

export function PropertyDetail({
  data,
  locale,
}: {
  data: ListingDetailData;
  locale: Locale;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AGENT_CARD_CSS }} />
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="property-details-wrap pt-100 pb-75">
        <div className="container">
          <div className="row align-items-start mb-2">
            <div className="col-md-8">
              <div className="property-title">
                <h2>{data.title}</h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div id="mainCarousel" className="carousel">
                {data.gallery.map((slide, index) => (
                  <div
                    className="carousel__slide"
                    key={`${slide.original}-${index}`}
                    data-src={slide.original}
                    data-fancybox="gallery"
                    data-caption={slide.caption}
                  >
                    <Picture width={600} height={400}>
                      {slide.imageWebp ? <source srcSet={slide.imageWebp} type="image/webp" /> : null}
                      <img src={slide.image} alt="Property-photo" width={600} height={400} loading="lazy" />
                    </Picture>
                  </div>
                ))}
              </div>
              <div id="thumbCarousel" className="carousel mx-auto">
                {data.gallery.map((slide, index) => (
                  <div className="carousel__slide" key={`thumb-${slide.thumb}-${index}`}>
                    <Picture className="panzoom__content" width={100} height={100}>
                      <img src={slide.thumb || slide.image} alt="Property-photo" width={100} height={100} />
                    </Picture>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-3 col-md-8 col-sm-12">
              <div className="mb-2">
                <div className="pr-price-into">
                  <h6>
                    <p className="prop-price">{data.price}</p>
                  </h6>
                </div>
                <i className="flaticon-location" style={{ fontSize: 18 }} />
                {data.locationLinks.map((link, index) => (
                  <a className="prop-location" href={link.href ?? undefined} key={`${link.label}-${index}`}>
                    {link.label}
                    {index < data.locationLinks.length - 1 ? " /" : ""}
                  </a>
                ))}
              </div>
              <div className="block-body">
                <ul className="dw-proprty-info" style={{ borderTop: "1px solid #dcdcdc" }}>
                  {data.specs.map((spec) => (
                    <li key={spec.label}>
                      <strong>{spec.label}:</strong> {spec.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-3 col-md-4 col-sm-12 d-none d-lg-block">
              <div className="sidebar">
                <AgentCard agent={data.agent} />
              </div>
            </div>
            <div className="property-details">
              {data.descriptionHtml ? (
                <div className="col-lg-12 col-md-12 col-sm-12 mt-4">
                  <div className="property-desc" style={{ marginBottom: 30 }}>
                    <h2 className="blog-title">{data.descriptionHeading}</h2>
                    <hr />
                    <div dangerouslySetInnerHTML={{ __html: data.descriptionHtml }} />
                  </div>
                </div>
              ) : null}
              {data.eids ? (
                <div className="col-lg-12 col-md-12 col-sm-12">
                  <div className="property-desc" style={{ marginBottom: 30 }}>
                    <h2 className="blog-title">{data.eids.heading}</h2>
                    <hr />
                    <div className="eids-card">
                      {data.eids.image ? (
                        <img src={data.eids.image} title="EIDS" alt="EIDS_Logo" className="eids-logo" />
                      ) : null}
                      <p className="eids-text">{data.eids.text}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              {data.featureGroups.length > 0 ? (
                <div className="col-lg-12 col-md-12 col-sm-12">
                  <div className="property-desc" style={{ marginBottom: 30 }}>
                    <h2 className="blog-title">
                      {locale === "en" ? "Features" : locale === "de" ? "Merkmale" : "Özellikler"}
                    </h2>
                    <hr />
                    {data.featureGroups.map((group) => (
                      <div key={group.heading}>
                        <h6>{group.heading}</h6>
                        <ul className="avl-features third">
                          {group.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <hr />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {data.map.iframeSrc ? (
                <div className="col-lg-12 col-md-12 col-sm-12">
                  <div className="ltn__blog-details-wrap" style={{ marginBottom: 30 }}>
                    <div className="blog-content">
                      <h2 className="blog-title">{data.map.heading}</h2>
                      <hr />
                      <div className="location-buttons">
                        <button className="btn style1" type="button" onClick={() => showDirections(data.map.latitude, data.map.longitude)}>
                          <i className="ri-direction-fill" />
                          {data.map.directionsLabel}
                        </button>
                        <button className="btn style2" type="button" onClick={() => showStreetView(data.map.latitude, data.map.longitude)}>
                          <i className="ri-user-location-fill" /> {data.map.streetViewLabel}
                        </button>
                      </div>
                      <iframe
                        src={data.map.iframeSrc}
                        allowFullScreen
                        style={{ border: 0, width: "100%", height: 450 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="col-lg-3 col-md-4 col-sm-12 d-block d-md-none">
              <div className="sidebar">
                <AgentCard agent={data.agent} />
              </div>
            </div>
            <div className="col-lg-12 col-md-12 col-sm-12">
              <div className="contact-form-wrap contact-form-bg">
                <div className="property-desc">
                  <ListingInquiryForm data={data} locale={locale} />
                </div>
              </div>
            </div>
            {data.related.length > 0 ? (
              <div className="col-lg-12 col-md-12 col-sm-12">
                <div className="property-top-content mt-30" style={{ padding: 10 }}>
                  <div className="blog-content">
                    <h2 className="blog-title" style={{ textAlign: "center" }}>
                      {data.relatedHeading}
                    </h2>
                    <hr />
                    <section className="property-slider-wrap td-cod">
                      <div className="container">
                        <div className="property-slider-one homepage-featured-prop owl-carousel" id="propcarousel">
                          {data.related.map((item) => (
                            <ListingCard item={{ ...item, style: "style6" }} key={`related-${item.externalId}`} />
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

function AgentCard({ agent }: { agent: ListingAgentData }) {
  if (!agent.name) {
    return null;
  }

  return (
    <div className="sidebar-widget agent-card-modern">
      <div className="acm-head">
        <div className="acm-avatar">
          <a href={agent.href}>
            <Picture width={220} height={220}>
              {agent.imageWebp ? <source srcSet={agent.imageWebp} type="image/webp" /> : null}
              <img src={agent.image} alt="User-photo" width={220} height={220} />
            </Picture>
          </a>
        </div>
      </div>
      <div className="acm-body">
        <h6 className="acm-name">
          <a className="text-inherit" href={agent.href}>
            {agent.name}
          </a>
        </h6>
        <ul className="acm-contact list-style">
          {agent.officeName ? (
            <li>
              <a className="text-inherit" href={agent.officeHref}>
                <i className="ri-building-4-line" /> {agent.officeName}
              </a>
            </li>
          ) : null}
          {(agent.phones ?? []).map((phone) => (
            <li key={phone.href + phone.label}>
              <a href={phone.href} target="_blank" rel="noreferrer">
                <i className={phone.icon || "ri-phone-line"} />
                {phone.label}
              </a>
            </li>
          ))}
          {agent.emailHref ? (
            <li>
              <a className="agent-mail" href={agent.emailHref}>
                <i className="ri-mail-send-line" />
                {agent.emailLabel}
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function ListingInquiryForm({ data, locale }: { data: ListingDetailData; locale: Locale }) {
  const messages = publicFormStatus[locale].listing;
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
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

    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/v1/listings/${data.externalId}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          subject: formData.get("Subject"),
          full_name: formData.get("FullName"),
          email: formData.get("Email"),
          phone: formData.get("Phone"),
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
    <form method="post" id="form" className="review-form" action={data.urlPath} onSubmit={handleSubmit}>
      <div className="row">
        <h4>{data.form.heading}</h4>
        <input type="hidden" id="Id" name="Id" value={data.externalId} readOnly />
        <input type="hidden" id="Title" name="Title" value={data.title} readOnly />
        <div className="col-lg-12 col-md-12 col-sm-12">
          <div className="form-group">
            <input placeholder={data.form.placeholders.Subject} type="text" id="Subject" name="Subject" defaultValue="" />
          </div>
        </div>
        <div className="col-lg-6 col-md-6 col-sm-12">
          <div className="form-group">
            <input placeholder={data.form.placeholders.FullName} type="text" id="FullName" name="FullName" defaultValue="" />
          </div>
        </div>
        <div className="col-lg-6 col-md-6 col-sm-12">
          <div className="form-group">
            <input placeholder={data.form.placeholders.Email} type="email" id="Email" name="Email" defaultValue="" />
          </div>
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12">
          <div className="form-group">
            <input className="" type="tel" id="Phone" name="Phone" defaultValue="" />
          </div>
        </div>
        <div className="col-lg-12 col-md-12 col-sm-12">
          <div className="form-group">
            <textarea
              cols={30}
              rows={6}
              placeholder={data.form.placeholders.Message}
              style={{ height: "120px" }}
              id="Message"
              name="Message"
              defaultValue=""
            />
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
        <div className="col-lg-12 col-md-12 col-sm-12" style={{ textAlign: "center" }}>
          <div className="form-group">
            <button type="submit" className="btn style2" disabled={submitting}>
              {data.form.submitLabel}
            </button>
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

function showDirections(latitude: string, longitude: string) {
  window.open(`https://www.google.com/maps/dir//${latitude},${longitude}/`, "_blank");
}

function showStreetView(latitude: string, longitude: string) {
  window.open(
    `https://www.google.com/maps?q=${latitude},${longitude}&layer=c&cbll=${latitude},${longitude}&cbp=12,0,0,0,0`,
    "_blank",
  );
}
