"use client";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ConsultantCommentForm } from "@/components/corporate/ConsultantCommentForm";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { consultantDraftClubLogo, consultantDraftCopy, consultantDraftSocials } from "@/content/consultant-draft";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";
import { scaled } from "@/lib/scale";

type ConsultantDetailData = Extract<CorporatePayload, { kind: "consultant-detail" }>;

export function ConsultantDetailDraft({ data, locale }: { data: ConsultantDetailData; locale: Locale }) {
  const tabs = data.tabs;
  const portfoliosTab = tabs.find((tab) => tab.id === "tab_2") ?? tabs[1];
  const activeId = portfoliosTab?.id ?? "tab_2";
  const copy = consultantDraftCopy[locale];

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container consultant-draft">
        <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))] items-start">
          <div className="w-full lg:w-1/2">
            <div className="consultant-draft-photo sk-photo-frame sk-photo-frame-detail">
              <a href={data.urlPath}>
                <Picture width={574} height={574}>
                  {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                  <img className="sk-photo" src={data.image} alt="User-photo" width={574} height={574} style={{ "--sk-photo-w": 574, "--sk-photo-h": 574 }} />
                </Picture>
              </a>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="consultant-draft-info">
              <h3 className="consultant-draft-year">{copy.yearHeading}</h3>
              <div className="consultant-draft-stats">
                <div className="consultant-draft-stat">
                  <span className="consultant-draft-stat-label">{copy.ciro.label}</span>
                  <span className="consultant-draft-stat-number consultant-draft-stat-number-full">{copy.ciro.value}</span>
                  <span className="consultant-draft-stat-number consultant-draft-stat-number-compact">{copy.ciro.compactValue}</span>
                </div>
                <div className="consultant-draft-stat">
                  <span className="consultant-draft-stat-label">{copy.islem.label}</span>
                  <span className="consultant-draft-stat-number">{copy.islem.value}</span>
                </div>
                <div className="consultant-draft-stat">
                  <span className="consultant-draft-stat-label">{copy.kulup.label}</span>
                  <img className="consultant-draft-club-logo" src={consultantDraftClubLogo.src} alt={consultantDraftClubLogo.alt} />
                </div>
              </div>
              <div className="consultant-draft-identity">
                <h2 className="consultant-draft-name">{data.name}</h2>
                {data.role ? <span className="consultant-draft-role">{data.role}</span> : null}
              </div>
              <ul className="consultant-draft-contact list-none">
                {data.email ? (
                  <li>
                    <b>{data.contactLabels.email}</b>
                    <a href={`mailto:${data.email}`}>{data.email}</a>
                  </li>
                ) : null}
                {data.phoneHref ? (
                  <li>
                    <b>{data.contactLabels.phone}</b>
                    <a href={data.phoneHref} target="_blank">
                      {data.phoneLabel}
                    </a>
                  </li>
                ) : null}
                {data.officeName ? (
                  <li>
                    <b>{data.contactLabels.office}</b>
                    <a href={data.officeHref}>{data.officeName}</a>
                  </li>
                ) : null}
              </ul>
              <ul className="[margin:calc(20px_*_var(--sk-scale,_1))_0_calc(20px_*_var(--sk-scale,_1))] [margin-top:calc(25px_*_var(--sk-scale,_1))] text-right max-md:text-center list-none consultant-draft-social">
                {consultantDraftSocials.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                      <i className={item.icon} />
                    </a>
                  </li>
                ))}
              </ul>
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
                  {(data.comments ?? []).map((comment) => (
                    <article className="comment-item" key={`${comment.date}-${comment.firstName}-${comment.text.slice(0, 24)}`}>
                      <h5>{[comment.firstName, comment.lastName].filter(Boolean).join(" ")}</h5>
                      {comment.date ? <span className="comment-date">{comment.date}</span> : null}
                      <p>{comment.text}</p>
                    </article>
                  ))}
                  {data.commentHeading ? <h4 style={{ marginTop: scaled(15), marginBottom: scaled(15) }}>{data.commentHeading}</h4> : null}
                  <ConsultantCommentForm data={data} locale={locale} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
