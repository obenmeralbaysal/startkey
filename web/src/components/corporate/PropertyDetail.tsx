"use client";

import { useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ListingCard } from "@/components/corporate/ListingCard";
import { ListingGallery } from "@/components/corporate/ListingGallery";
import { Picture } from "@/components/corporate/Picture";
import { CaptchaNotice } from "@/components/forms/CaptchaNotice";
import { publicFormStatus } from "@/content/public-form-status";
import type { CorporatePayload, ListingAgentData } from "@/lib/corporate";
import { isPlaceholderPhoto, listingContactCopy, showListingConsultant } from "@/lib/listing-gallery";
import { executeRecaptchaV3Action } from "@/lib/recaptcha-v3";
import type { Locale } from "@/lib/locales";
import { scaled } from "@/lib/scale";

type ListingDetailData = Extract<CorporatePayload, { kind: "listing-detail" }>;

export function PropertyDetail({
  data,
  locale,
}: {
  data: ListingDetailData;
  locale: Locale;
}) {
  const copy = listingContactCopy(locale);
  const consultant = showListingConsultant(data.agent);
  const phones = consultant ? data.agent.phones ?? [] : [];
  const callHref = callLink(phones);
  const whatsappHref = whatsappLink(phones);
  const badges = [...(data.badges ?? []), data.processType ?? ""].map((badge) => badge.trim()).filter((badge, index, all) => badge !== "" && all.indexOf(badge) === index);

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="property-details-wrap listing-detail-page pt-100 pb-75" data-screen="listing-detail">
        <div className="container">
          <div className="listing-detail-layout">
            <div className="listing-detail-main">
              <ListingGallery slides={data.gallery} locale={locale} title={data.title} />
              {badges.length > 0 ? (
                <ul className="listing-badges">
                  {badges.map((badge) => (
                    <li key={badge}>{badge}</li>
                  ))}
                </ul>
              ) : null}
              <h2 className="listing-detail-title">{data.title}</h2>
              {data.locationLinks.length > 0 ? (
                <p className="listing-location">
                  <i className="flaticon-location" style={{ fontSize: scaled(18) }} />
                  {data.locationLinks.map((link, index) => (
                    <a href={link.href ?? undefined} key={`${link.label}-${index}`}>
                      {link.label}
                      {index < data.locationLinks.length - 1 ? " / " : ""}
                    </a>
                  ))}
                </p>
              ) : null}
              {data.specs.length > 0 ? (
                <ul className="listing-feature-strip" data-feature-strip>
                  {data.specs.map((spec) => (
                    <li key={spec.label}>
                      <span>{spec.label}</span>
                      <strong>{spec.value}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}
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
            </div>
            <aside className="listing-contact-sticky" data-contact-card>
              <p className="listing-price">{data.price}</p>
              <ContactCard
                agent={data.agent}
                consultant={consultant}
                callLabel={copy.call}
                officeLabel={copy.office}
                callHref={callHref}
                whatsappHref={whatsappHref}
              />
            </aside>
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
      </section>
      <div className="sk-mobile-contact" data-mobile-bar>
        <p className="sk-mobile-price">{data.price}</p>
        <ContactActions callHref={callHref} whatsappHref={whatsappHref} callLabel={copy.call} />
      </div>
    </>
  );
}

function ContactCard({
  agent,
  consultant,
  callLabel,
  officeLabel,
  callHref,
  whatsappHref,
}: {
  agent: ListingAgentData;
  consultant: boolean;
  callLabel: string;
  officeLabel: string;
  callHref: string;
  whatsappHref: string;
}) {
  if (!consultant && !agent.officeName) {
    return <ContactActions callHref={callHref} whatsappHref={whatsappHref} callLabel={callLabel} />;
  }

  return (
    <div className="listing-contact-card" data-contact={consultant ? "consultant" : "office"}>
      {consultant && !isPlaceholderPhoto(agent.image) ? (
        <a className="listing-contact-avatar" href={agent.href || undefined}>
          <Picture width={72} height={72}>
            {agent.imageWebp ? <source srcSet={agent.imageWebp} type="image/webp" /> : null}
            <img src={agent.image} alt="" width={72} height={72} />
          </Picture>
        </a>
      ) : null}
      {consultant ? (
        <h3>
          {agent.href ? <a href={agent.href}>{agent.name}</a> : agent.name}
        </h3>
      ) : (
        <p className="listing-contact-kicker">{officeLabel}</p>
      )}
      {agent.officeName ? (
        <p>
          {agent.officeHref ? <a href={agent.officeHref}>{agent.officeName}</a> : agent.officeName}
        </p>
      ) : null}
      <ContactActions callHref={callHref} whatsappHref={whatsappHref} callLabel={callLabel} />
      {consultant && agent.emailHref ? (
        <a className="listing-contact-mail" href={agent.emailHref}>
          {agent.emailLabel}
        </a>
      ) : null}
    </div>
  );
}

function ContactActions({ callHref, whatsappHref, callLabel }: { callHref: string; whatsappHref: string; callLabel: string }) {
  if (!callHref && !whatsappHref) {
    return null;
  }
  return (
    <div className="sk-contact-actions">
      {callHref ? (
        <a className="sk-call-btn" href={callHref} data-contact-action="call">
          {callLabel}
        </a>
      ) : null}
      {whatsappHref ? (
        <a className="sk-wa-btn" href={whatsappHref} target="_blank" rel="noreferrer" data-contact-action="whatsapp">
          WhatsApp
        </a>
      ) : null}
    </div>
  );
}

function callLink(phones: ListingAgentData["phones"]): string {
  return phones.find((phone) => phone.href.startsWith("tel:"))?.href ?? "";
}

function whatsappLink(phones: ListingAgentData["phones"]): string {
  const marked = phones.find((phone) => /whatsapp|wa\.me/i.test(`${phone.icon} ${phone.href}`));
  if (marked && /^https?:/i.test(marked.href)) {
    return marked.href;
  }
  const tel = marked?.href.startsWith("tel:") ? marked.href : callLink(phones);
  const digits = tel.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
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
