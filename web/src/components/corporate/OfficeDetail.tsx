import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { DirectoryCard } from "@/components/corporate/DirectoryCard";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import type { CorporatePayload } from "@/lib/corporate";

const HEADING_CSS = `
    .highlighted-heading {
        text-align: center;
        width: 100%;
    }
`;

export function OfficeDetail({ data }: { data: Extract<CorporatePayload, { kind: "office-detail" }> }) {
  const tabs = data.tabs.length > 0 ? data.tabs : [
    { id: "tab_1", label: "" },
    { id: "tab_2", label: "" },
    { id: "tab_3", label: "" },
  ];

  return (
    <>
      <style>{HEADING_CSS}</style>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container ptb-100">
        <div className="agent-details-wrap">
          <div className="row gx-5 align-items-center">
            <div className="col-lg-6">
              <div className="agent-img">
                <Picture className="img-fluid" width={576} height={269}>
                  {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                  <img src={data.image} alt="OfficeLogo-photo" width={576} height={269} />
                </Picture>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="agent-info-wrap">
                <div className="agent-name">
                  <h2>{data.name}</h2>
                </div>
                <ul className="agent-info list-style">
                  {data.phoneHref ? (
                    <li>
                      <i className="ri-phone-line" /> <a href={data.phoneHref} target="_blank">{data.phoneLabel}</a>
                    </li>
                  ) : null}
                  {data.email ? (
                    <li>
                      <i className="flaticon-envelope" /> <a href={`mailto:${data.email}`}> {data.email}</a>
                    </li>
                  ) : null}
                  {data.address ? (
                    <li>
                      <i className="flaticon-pin" /> {data.address}
                    </li>
                  ) : null}
                  <div className="agent-social">
                    <ul className="social-profile list-style style1">
                      {data.instagram ? (
                        <li>
                          <a href={data.instagram} target="_blank">
                            <i className="ri-instagram-line" />
                          </a>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                  {data.portfoliosLabel ? (
                    <a className="btn style2" href={data.portfoliosHref}>
                      {data.portfoliosLabel}
                    </a>
                  ) : null}
                </ul>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="agent-desc">
                <ul className="nav nav-tabs agent-tablist" role="tablist">
                  {tabs.map((tab, index) => (
                    <li className="nav-item" key={tab.id}>
                      <button
                        className={index === 0 ? "nav-link active" : "nav-link"}
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
                  <div className="tab-pane fade show active" id="tab_1" role="tabpanel">
                    <div className="row justify-content-center">
                      {data.teamGroups.map((group) => (
                        <div className="contents" key={group.heading}>
                          {group.heading ? <h3 className="highlighted-heading mb-30">{group.heading}</h3> : null}
                          <div className="row justify-content-center">
                            {group.members.map((member) => (
                              <div className="col-xl-4 col-lg-4 col-md-4" key={member.externalId}>
                                <DirectoryCard item={member} compact />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="tab-pane fade" id="tab_2" role="tabpanel">
                    {data.listings.length > 0 ? (
                      <section className="property-slider-wrap td-cod">
                        <div className="container">
                          <div className="property-slider-one homepage-featured-prop owl-carousel" id="propcarousel">
                            {data.listings.map((item) => (
                              <ListingCard item={{ ...item, style: "style6" }} key={`office-listing-${item.externalId}`} />
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </div>
                  <div className="tab-pane fade" id="tab_3" role="tabpanel">
                    {data.map.iframeSrc ? (
                      <iframe src={data.map.iframeSrc} title={data.name} width="100%" height="420" style={{ border: 0 }} />
                    ) : null}
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
