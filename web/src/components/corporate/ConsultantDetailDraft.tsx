"use client";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ConsultantCommentForm } from "@/components/corporate/ConsultantCommentForm";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { consultantDraftClubLogo, consultantDraftCopy, consultantDraftSocials } from "@/content/consultant-draft";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

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
        <div className="row gx-5 align-items-start">
          <div className="col-lg-6">
            <div className="consultant-draft-photo">
              <a href={data.urlPath}>
                <Picture width={574} height={574}>
                  {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                  <img src={data.image} alt="User-photo" width={574} height={574} />
                </Picture>
              </a>
            </div>
          </div>
          <div className="col-lg-6">
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
              <ul className="consultant-draft-contact list-style">
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
              <ul className="social-profile list-style style1 consultant-draft-social">
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
    </>
  );
}
