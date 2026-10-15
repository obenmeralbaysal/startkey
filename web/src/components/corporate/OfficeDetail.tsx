import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { DirectoryCard } from "@/components/corporate/DirectoryCard";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import type { CorporatePayload } from "@/lib/corporate";
import { scaled } from "@/lib/scale";

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
      <div className="container [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="[box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] [padding:calc(50px_*_var(--sk-scale,_1))_calc(50px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))] max-md:[padding:0] max-md:[box-shadow:none] max-md:[margin-bottom:calc(-25px_*_var(--sk-scale,_1))] md:max-lg:[padding:calc(35px_*_var(--sk-scale,_1))_calc(35px_*_var(--sk-scale,_1))_calc(10px_*_var(--sk-scale,_1))]">
          <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))] items-center">
            <div className="w-full lg:w-1/2">
              <div className="sk-photo-frame sk-photo-frame-detail">
                <Picture width={576} height={269}>
                  {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                  <img className="sk-photo" src={data.image} alt="OfficeLogo-photo" width={576} height={269} style={{ "--sk-photo-w": 576, "--sk-photo-h": 269 }} />
                </Picture>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="block">
                <div className="[width:calc(100%_-_calc(85px_*_var(--sk-scale,_1)))] [margin-left:calc(15px_*_var(--sk-scale,_1))] [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)] max-md:[padding-bottom:calc(20px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                  <h2>{data.name}</h2>
                </div>
                <ul className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))_calc(22px_*_var(--sk-scale,_1))] text-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)] list-none">
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
                  <div className="flex flex-wrap items-center">
                    <ul className="[margin:calc(20px_*_var(--sk-scale,_1))_0_calc(20px_*_var(--sk-scale,_1))] [margin-top:calc(25px_*_var(--sk-scale,_1))] text-right max-md:text-center list-none">
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
                    <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" href={data.portfoliosHref}>
                      {data.portfoliosLabel}
                    </a>
                  ) : null}
                </ul>
              </div>
            </div>
            <div className="w-full">
              <div className="[margin-top:calc(25px_*_var(--sk-scale,_1))]">
                <ul className="flex flex-wrap [padding-left:0] [margin-bottom:0] list-none [border:none] [margin-bottom:calc(30px_*_var(--sk-scale,_1))]" role="tablist">
                  {tabs.map((tab, index) => (
                    <li className="relative list-none" key={tab.id}>
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
                <div className="w-full hw-tab-content">
                  <div className="hidden" id="tab_1" role="tabpanel">
                    <div className="flex flex-wrap justify-center">
                      {data.teamGroups.map((group) => (
                        <div className="contents" key={group.heading}>
                          {group.heading ? <h3 className="highlighted-heading [margin-bottom:calc(30px_*_var(--sk-scale,_1))]">{group.heading}</h3> : null}
                          <div className="flex flex-wrap justify-center">
                            {group.members.map((member) => (
                              <div className="w-full xl:w-1/3 lg:w-1/3 md:w-1/3" key={member.externalId}>
                                <DirectoryCard item={member} compact />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden" id="tab_2" role="tabpanel">
                    {data.listings.length > 0 ? (
                      <section className="property-slider-wrap td-cod">
                        <div className="container">
                          <div className="homepage-featured-prop" data-carousel="cards">
                            {data.listings.map((item) => (
                              <ListingCard item={{ ...item, style: "style6" }} key={`office-listing-${item.externalId}`} />
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </div>
                  <div className="hidden" id="tab_3" role="tabpanel">
                    {data.map.iframeSrc ? (
                      <iframe src={data.map.iframeSrc} title={data.name} width="100%" height="420" style={{ border: 0, height: scaled(420) }} />
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
