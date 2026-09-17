import type { HomepageContent } from "@/content/types";
import type { Locale } from "@/lib/locales";

const HERO_IMAGE = "77078032-3159-4ef7-bb2a-0c88617c2eb0";

/**
 * Hero image plus the three-tab search bar. The `select2`/`bind-select2` classes and
 * the `bind-*` attributes are read by the theme runtime, which populates the
 * dropdowns from the lookup endpoints exactly as the reference website does.
 *
 * The reference markup gives each select two `class` attributes; browsers apply the
 * first one only, so the selects carry no `form-control` class and the classes below
 * are the ones that actually take effect there.
 */
export function HeroSearch({
  content,
  locale,
}: {
  content: HomepageContent["heroSearch"];
  locale: Locale;
}) {
  const [propertyAction, officeAction, consultantAction] = content.formActions;
  const [propertyButton, officeButton, consultantButton] = content.buttons;
  const [officeNamePlaceholder, firstNamePlaceholder, lastNamePlaceholder] = content.placeholders;
  const lookup = (path: string) => `/${locale}/${path}`;

  return (
    <section className="hero-wrap">
      <picture>
        <source
          type="image/webp"
          media="(max-width:576px)"
          srcSet={`/media/micrositecontent/${HERO_IMAGE}-768x320.webp 640w`}
        />
        <source
          type="image/webp"
          media="(min-width:577px)"
          srcSet={`/media/micrositecontent/${HERO_IMAGE}-1920x800.webp 1920w`}
        />
        <img
          src={`/media/micrositecontent/${HERO_IMAGE}-1920x800.jpg`}
          srcSet={`/media/micrositecontent/${HERO_IMAGE}-768x320.jpg 640w, /media/micrositecontent/${HERO_IMAGE}-1920x800.jpg 1920w`}
          width={1920}
          height={800}
          alt="Slider Image"
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="hero-bg-image"
        />
      </picture>

      <div className="container">
        <div className="search-property style1">
          <ul className="nav nav-tabs agent-tablist homepage-bar-1" role="tablist">
            {content.tabs.map((tab, index) => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link${index === 0 ? " active" : ""}`}
                  data-bs-toggle="tab"
                  data-bs-target={`#tab_${index + 1}`}
                  type="button"
                  role="tab"
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>

          <div className="tab-content hw-tab-content">
            <div className="tab-pane fade show active" id="tab_1" role="tabpanel">
              <form method="get" className="property-search-form row" action={propertyAction}>
                <div className="col-xl-3 col-md-6 mb-15">
                  <select
                    className="select2"
                    id="propertyType"
                    name="FilterDTO.AdTypeId"
                    bind-url={lookup("lookup/Adtypes")}
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-15">
                  <select
                    className="bind-select2"
                    id="ProcessTypeId"
                    name="FilterDTO.ProcessTypeId"
                    bind-id="propertyType"
                    bind-query="adType"
                    bind-url={lookup("lookup/ProcessTypes")}
                  />
                </div>
                <div className="col-xl-2 col-md-6 mb-15">
                  <select
                    className="select2"
                    id="propertyCountryId"
                    name="FilterDTO.CountryId"
                    bind-url={lookup("Lookup/EnteredCountries")}
                  />
                </div>
                <div className="col-xl-2 col-md-6 mb-15">
                  <select
                    className="select2"
                    id="propertyCityId"
                    name="FilterDTO.CityId"
                    bind-query="countryId"
                    bind-id="propertyCountryId"
                    bind-url={lookup("Lookup/EnteredCitiesByCountryId")}
                  />
                </div>
                <div className="col-lg-2 col-md-3 col-sm-12 mb-15" style={{ textAlign: "center" }}>
                  <button
                    type="submit"
                    className="btn style2 homepage-bar-btn"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    {propertyButton}
                    <i className="fa fa-search" />
                  </button>
                </div>
              </form>
            </div>

            <div className="tab-pane fade" id="tab_2" role="tabpanel">
              <form method="get" className="property-search-form row" action={officeAction}>
                <div className="col-lg-2 col-md-6 mb-15">
                  <input type="text" className="" name="SearchText" placeholder={officeNamePlaceholder} />
                </div>
                <div className=" col-lg-2 col-md-6 mb-15">
                  <select
                    className="select2 slider-selection-height-"
                    id="officeCountryId"
                    name="FilterDTO.CountryId"
                    bind-url={lookup("Lookup/EnteredOfficeCountries")}
                  />
                </div>
                <div className="col-lg-3 col-md-6 mb-15">
                  <select
                    className="bind-select2 slider-selection-height-"
                    id="officeCityId"
                    name="FilterDTO.CityId"
                    bind-id="officeCountryId"
                    bind-query="countryId"
                    bind-url={lookup("Lookup/EnteredOfficeCitiesByCountryId")}
                  />
                </div>
                <div className="col-lg-3 col-md-6 mb-15">
                  <select
                    className="bind-select2 slider-selection-height-"
                    id="officeCountyId"
                    name="FilterDTO.CountyId"
                    bind-id="officeCityId"
                    bind-query="cityId"
                    bind-url={lookup("lookup/Counties")}
                  />
                </div>
                <div className="col-lg-2 col-md-6 mb-15" style={{ textAlign: "center" }}>
                  <button
                    type="submit"
                    className="btn style2 homepage-bar-btn"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    {officeButton} <i className="fa fa-search" />
                  </button>
                </div>
              </form>
            </div>

            <div className="tab-pane fade" id="tab_3" role="tabpanel">
              <form method="get" className="property-search-form row" action={consultantAction}>
                <div className="col-xl-2 col-md-6 mb-15">
                  <input type="text" className="" name="FilterDTO.Firstname" placeholder={firstNamePlaceholder} />
                </div>
                <div className="col-xl-2 col-md-6 mb-15">
                  <input type="text" className="" name="FilterDTO.Lastname" placeholder={lastNamePlaceholder} />
                </div>
                <div className="col-xl-3 col-md-6 mb-15">
                  <select
                    className="select2"
                    id="userCountryId"
                    name="FilterDTO.CountryId"
                    bind-url={lookup("Lookup/EnteredConsultantCountries")}
                  />
                </div>
                <div className="col-xl-3 col-md-6 mb-15">
                  <select
                    className="bind-select2"
                    id="userCityId"
                    name="FilterDTO.CityId"
                    bind-id="userCountryId"
                    bind-query="countryId"
                    bind-url={lookup("Lookup/EnteredConsultantCitiesByCountryId")}
                  />
                </div>
                <div className="col-lg-2 col-md-2 col-sm-12 mb-15" style={{ textAlign: "center" }}>
                  <button
                    type="submit"
                    className="btn style2 homepage-bar-btn"
                    style={{ justifyContent: "center", display: "flex" }}
                  >
                    {consultantButton} <i className="fa fa-search" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
