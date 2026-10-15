"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { CaptchaNotice } from "@/components/forms/CaptchaNotice";
import { publicFormStatus } from "@/content/public-form-status";
import type { CorporatePayload, ListingAgentData } from "@/lib/corporate";
import { executeRecaptchaV3Action } from "@/lib/recaptcha-v3";
import type { Locale } from "@/lib/locales";
import { scaled } from "@/lib/scale";

type ListingDetailData = Extract<CorporatePayload, { kind: "listing-detail" }>;

const AGENT_CARD_CSS = `
    .agent-card-modern {
        padding: 0 !important;
        overflow: hidden;
        border-radius: calc(14px * var(--sk-scale, 1));
        background: #fff;
    }
    .agent-card-modern .acm-head {
        position: relative;
        height: calc(96px * var(--sk-scale, 1));
        background: linear-gradient(135deg, #EC3323 0%, #9e1a10 100%);
    }
    .agent-card-modern .acm-avatar {
        position: absolute;
        left: 50%;
        bottom: calc(-55px * var(--sk-scale, 1));
        transform: translateX(-50%);
        width: calc(110px * var(--sk-scale, 1));
        height: calc(110px * var(--sk-scale, 1));
        border-radius: 50%;
        overflow: hidden;
        background: #fff;
        border: calc(4px * var(--sk-scale, 1)) solid #fff;
        box-shadow: 0 calc(6px * var(--sk-scale, 1)) calc(18px * var(--sk-scale, 1)) rgba(0, 0, 0, 0.18);
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
        padding: calc(68px * var(--sk-scale, 1)) calc(20px * var(--sk-scale, 1)) calc(24px * var(--sk-scale, 1));
        text-align: center;
    }
    .agent-card-modern .acm-name {
        margin: 0 0 calc(6px * var(--sk-scale, 1));
        font-size: calc(19px * var(--sk-scale, 1));
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
        margin: calc(16px * var(--sk-scale, 1)) 0 0;
    }
    .agent-card-modern .acm-contact li {
        margin: 0 0 calc(8px * var(--sk-scale, 1));
    }
    .agent-card-modern .acm-contact li:last-child {
        margin-bottom: 0;
    }
    .agent-card-modern .acm-contact li a {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: calc(6px * var(--sk-scale, 1));
        color: inherit;
    }
    .agent-card-modern .acm-contact li a:hover {
        color: #EC3323;
    }
    .agent-card-modern .acm-contact li a i {
        font-size: calc(16px * var(--sk-scale, 1));
    }
    .agent-card-modern .acm-contact li a.agent-mail {
        overflow: hidden;
        white-space: nowrap;
    }
    .dw-proprty-info li {
        margin-top: calc(0.2rem * var(--sk-scale, 1));
        font-size: 0.9em !important;
        border-bottom: 1px dotted #b0b0b0 !important;
    }
    .dw-proprty-info li strong {
        width: calc(140px * var(--sk-scale, 1)) !important;
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
          <div className="sk-split">
            <div className="sk-two-thirds">
              <div className="[margin:0_0_calc(30px_*_var(--sk-scale,_1))] max-md:[margin:0_0_calc(10px_*_var(--sk-scale,_1))]">
                <h2>{data.title}</h2>
              </div>
            </div>
          </div>
          <div className="sk-split">
            <div className="sk-half">
              <div id="mainCarousel" className="sk-gallery" data-carousel="single">
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
              <div id="thumbCarousel" className="sk-thumbs">
                {data.gallery.map((slide, index) => (
                  <div className="carousel__slide" key={`thumb-${slide.thumb}-${index}`}>
                    <Picture className="panzoom__content" width={100} height={100}>
                      <img src={slide.thumb || slide.image} alt="Property-photo" width={100} height={100} />
                    </Picture>
                  </div>
                ))}
              </div>
            </div>
            <div className="sk-quarter">
              <div className="[margin-bottom:calc(.5rem_*_var(--sk-scale,_1))]">
                <div className="pr-price-into">
                  <h6>
                    <p className="text-brand [font-size:calc(18px_*_var(--sk-scale,_1))] font-bold [font-family:poppins,_sans-serif] [margin:0] relative [top:calc(7px_*_var(--sk-scale,_1))]">{data.price}</p>
                  </h6>
                </div>
                <i className="flaticon-location" style={{ fontSize: scaled(18) }} />
                {data.locationLinks.map((link, index) => (
                  <a className="[color:#039] font-bold [transition:color_0.3s] hover:text-brand" href={link.href ?? undefined} key={`${link.label}-${index}`}>
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
            <div className="sk-quarter">
              <div className="max-xl:[margin:calc(50px_*_var(--sk-scale,_1))_0_0] max-xl:[margin-top:calc(25px_*_var(--sk-scale,_1))]">
                <AgentCard agent={data.agent} />
              </div>
            </div>
            <div className="block">
              {data.descriptionHtml ? (
                <div className="w-full [margin-top:calc(1.5rem_*_var(--sk-scale,_1))]">
                  <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] last:[margin-bottom:0] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))]" style={{ marginBottom: scaled(30) }}>
                    <h2 className="blog-title">{data.descriptionHeading}</h2>
                    <hr />
                    <div className="cms" dangerouslySetInnerHTML={{ __html: data.descriptionHtml }} />
                  </div>
                </div>
              ) : null}
              {data.eids ? (
                <div className="w-full">
                  <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] last:[margin-bottom:0] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))]" style={{ marginBottom: scaled(30) }}>
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
                <div className="w-full">
                  <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] last:[margin-bottom:0] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))]" style={{ marginBottom: scaled(30) }}>
                    <h2 className="blog-title">
                      {locale === "en" ? "Features" : locale === "de" ? "Merkmale" : "Özellikler"}
                    </h2>
                    <hr />
                    {data.featureGroups.map((group) => (
                      <div key={group.heading}>
                        <h6>{group.heading}</h6>
                        <ul className="[margin:0] [padding:0] flex flex-wrap third">
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
                <div className="w-full">
                  <div className="ltn__blog-details-wrap" style={{ marginBottom: scaled(30) }}>
                    <div className="blog-content">
                      <h2 className="blog-title">{data.map.heading}</h2>
                      <hr />
                      <div className="[margin-bottom:calc(20px_*_var(--sk-scale,_1))] [gap:calc(10px_*_var(--sk-scale,_1))] flex">
                        <button className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-navy text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-brand before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-brand after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" type="button" onClick={() => showDirections(data.map.latitude, data.map.longitude)}>
                          <i className="ri-direction-fill" />
                          {data.map.directionsLabel}
                        </button>
                        <button className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" type="button" onClick={() => showStreetView(data.map.latitude, data.map.longitude)}>
                          <i className="ri-user-location-fill" /> {data.map.streetViewLabel}
                        </button>
                      </div>
                      <iframe
                        src={data.map.iframeSrc}
                        allowFullScreen
                        style={{ border: 0, width: "100%", height: scaled(450) }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="w-full">
              <div className="contact-form-wrap contact-form-bg">
                <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] last:[margin-bottom:0] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <ListingInquiryForm data={data} locale={locale} />
                </div>
              </div>
            </div>
            {data.related.length > 0 ? (
              <div className="w-full">
                <div className="property-top-content [margin-top:calc(30px_*_var(--sk-scale,_1))]" style={{ padding: scaled(10) }}>
                  <div className="blog-content">
                    <h2 className="blog-title" style={{ textAlign: "center" }}>
                      {data.relatedHeading}
                    </h2>
                    <hr />
                    <section className="property-slider-wrap td-cod">
                      <div className="container">
                        <div className="related-grid">
                          {data.related.map((item) => (
                            <ListingCard item={{ ...item, style: "style3" }} key={`related-${item.externalId}`} />
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
    <div className="[margin:0_0_calc(30px_*_var(--sk-scale,_1))] relative z-[1] [padding:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] last:[margin:0] max-md:[padding:calc(20px_*_var(--sk-scale,_1))] agent-card-modern">
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
        <ul className="acm-contact list-none">
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

    let captchaToken: string | null = null;
    try {
      captchaToken = await executeRecaptchaV3Action("listing");
    } catch {
      setCaptchaError(data.form.captchaError);
      return;
    }
    setCaptchaError("");

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
    <form method="post" id="form" className="bg-neutral-50 [padding:calc(30px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] max-md:[padding:calc(20px_*_var(--sk-scale,_1))]" action={data.urlPath} onSubmit={handleSubmit}>
      <div className="flex flex-wrap">
        <h4>{data.form.heading}</h4>
        <input type="hidden" id="Id" name="Id" value={data.externalId} readOnly />
        <input type="hidden" id="Title" name="Title" value={data.title} readOnly />
        <div className="w-full">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input placeholder={data.form.placeholders.Subject} type="text" id="Subject" name="Subject" defaultValue="" />
          </div>
        </div>
        <div className="w-full lg:w-1/2 md:w-1/2">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input placeholder={data.form.placeholders.FullName} type="text" id="FullName" name="FullName" defaultValue="" />
          </div>
        </div>
        <div className="w-full lg:w-1/2 md:w-1/2">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input placeholder={data.form.placeholders.Email} type="email" id="Email" name="Email" defaultValue="" />
          </div>
        </div>
        <div className="w-full">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input className="" type="tel" id="Phone" name="Phone" defaultValue="" />
          </div>
        </div>
        <div className="w-full">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <textarea
              cols={30}
              rows={6}
              placeholder={data.form.placeholders.Message}
              style={{ height: scaled(120) }}
              id="Message"
              name="Message"
              defaultValue=""
            />
          </div>
        </div>
        {captchaError ? (
          <span id="captchaError" className="text text-brand">
            {captchaError}
          </span>
        ) : null}
        <CaptchaNotice locale={locale} />
        <div className="w-full" style={{ textAlign: "center" }}>
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <button type="submit" className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" disabled={submitting}>
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
