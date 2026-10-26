"use client";

import { useState } from "react";

import type { HomepageContent } from "@/content/types";
import type { Locale } from "@/lib/locales";

const HERO_IMAGE = "77078032-3159-4ef7-bb2a-0c88617c2eb0";

const SEARCH_LABELS: Record<
  Locale,
  {
    propertyType: string;
    propertyTypeChoose: string;
    process: string;
    processChoose: string;
    country: string;
    countryChoose: string;
    city: string;
    cityChoose: string;
    district: string;
    districtChoose: string;
  }
> = {
  tr: {
    propertyType: "Portföy tipi",
    propertyTypeChoose: "Portföy tipi seçiniz",
    process: "Portföy durumu",
    processChoose: "Portföy durumu seçiniz",
    country: "Ülke",
    countryChoose: "Ülke seçiniz",
    city: "İl",
    cityChoose: "İl seçiniz",
    district: "İlçe",
    districtChoose: "İlçe seçiniz",
  },
  en: {
    propertyType: "Property type",
    propertyTypeChoose: "Select property type",
    process: "Property status",
    processChoose: "Select property status",
    country: "Country",
    countryChoose: "Select a country",
    city: "City",
    cityChoose: "Select a city",
    district: "District",
    districtChoose: "Select a district",
  },
  de: {
    propertyType: "Portfoliotyp",
    propertyTypeChoose: "Portfoliotyp wählen",
    process: "Portfoliostatus",
    processChoose: "Portfoliostatus wählen",
    country: "Land",
    countryChoose: "Land wählen",
    city: "Stadt",
    cityChoose: "Stadt wählen",
    district: "Bezirk",
    districtChoose: "Bezirk wählen",
  },
};

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
  const [activeTab, setActiveTab] = useState(0);
  const labels = SEARCH_LABELS[locale];

  return (
    <section className="hero-bg">
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
        <div className="bg-white [border-radius:calc(10px_*_var(--sk-scale,_1))] [padding:calc(35px_*_var(--sk-scale,_1))_calc(45px_*_var(--sk-scale,_1))_calc(45px_*_var(--sk-scale,_1))_calc(30px_*_var(--sk-scale,_1))] z-[1] relative [box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] [margin-top:calc(-85px_*_var(--sk-scale,_1))] max-sm:[padding:calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0] max-sm:[margin:calc(50px_*_var(--sk-scale,_1))_0_0] sm:max-md:[padding:calc(35px_*_var(--sk-scale,_1))_calc(35px_*_var(--sk-scale,_1))_calc(15px_*_var(--sk-scale,_1))] sm:max-md:[margin:calc(-65px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0] md:max-lg:[padding:calc(35px_*_var(--sk-scale,_1))_calc(35px_*_var(--sk-scale,_1))_calc(15px_*_var(--sk-scale,_1))] md:max-lg:[margin:calc(-65px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0] lg:max-xl:[padding:calc(40px_*_var(--sk-scale,_1))] lg:max-xl:[margin:calc(-65px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0]">
          <ul className="sk-search-tabs max-[768px]:justify-center" role="tablist">
            {content.tabs.map((tab, index) => (
              <li key={tab}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === index}
                  onClick={() => setActiveTab(index)}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>

          <div className="w-full hw-tab-content">
            <div className={activeTab === 0 ? "block" : "hidden"} id="tab_1" role="tabpanel">
              <form method="get" className="flex flex-wrap max-md:bg-white max-md:[border-radius:calc(5px_*_var(--sk-scale,_1))]" action={propertyAction}>
                <div className="w-full xl:w-1/4 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="propertyType">
                    {labels.propertyType}
                    <select
                      className=""
                      id="propertyType"
                      name="FilterDTO.AdTypeId"
                      data-placeholder={labels.propertyTypeChoose}
                      bind-url={lookup("lookup/Adtypes")}
                    />
                  </label>
                </div>
                <div className="w-full xl:w-1/4 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="ProcessTypeId">
                    {labels.process}
                    <select
                      className=""
                      id="ProcessTypeId"
                      name="FilterDTO.ProcessTypeId"
                      data-placeholder={labels.processChoose}
                      bind-id="propertyType"
                      bind-query="adType"
                      bind-url={lookup("lookup/ProcessTypes")}
                    />
                  </label>
                </div>
                <div className="w-full xl:w-1/6 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="propertyCountryId">
                    {labels.country}
                    <select
                      className=""
                      id="propertyCountryId"
                      name="FilterDTO.CountryId"
                      data-placeholder={labels.countryChoose}
                      bind-url={lookup("Lookup/EnteredCountries")}
                    />
                  </label>
                </div>
                <div className="w-full xl:w-1/6 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="propertyCityId">
                    {labels.city}
                    <select
                      className=""
                      id="propertyCityId"
                      name="FilterDTO.CityId"
                      data-placeholder={labels.cityChoose}
                      bind-query="countryId"
                      bind-id="propertyCountryId"
                      bind-url={lookup("Lookup/EnteredCitiesByCountryId")}
                    />
                  </label>
                </div>
                <div className="w-full lg:w-1/6 md:w-1/4 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]" style={{ textAlign: "center" }}>
                  <button
                    type="submit"
                    className="sk-btn sk-btn-brand w-full"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    {propertyButton}
                    <i className="ri-search-line" />
                  </button>
                </div>
              </form>
            </div>

            <div className={activeTab === 1 ? "block" : "hidden"} id="tab_2" role="tabpanel">
              <form method="get" className="flex flex-wrap max-md:bg-white max-md:[border-radius:calc(5px_*_var(--sk-scale,_1))]" action={officeAction}>
                <div className="w-full lg:w-1/6 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <input type="text" className="" name="SearchText" placeholder={officeNamePlaceholder} />
                </div>
                <div className="w-full lg:w-1/6 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="officeCountryId">
                    {labels.country}
                    <select
                      className="slider-selection-height-"
                      id="officeCountryId"
                      name="FilterDTO.CountryId"
                      data-placeholder={labels.countryChoose}
                      bind-url={lookup("Lookup/EnteredOfficeCountries")}
                    />
                  </label>
                </div>
                <div className="w-full lg:w-1/4 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="officeCityId">
                    {labels.city}
                    <select
                      className="slider-selection-height-"
                      id="officeCityId"
                      name="FilterDTO.CityId"
                      data-placeholder={labels.cityChoose}
                      bind-id="officeCountryId"
                      bind-query="countryId"
                      bind-url={lookup("Lookup/EnteredOfficeCitiesByCountryId")}
                    />
                  </label>
                </div>
                <div className="w-full lg:w-1/4 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="officeCountyId">
                    {labels.district}
                    <select
                      className="slider-selection-height-"
                      id="officeCountyId"
                      name="FilterDTO.CountyId"
                      data-placeholder={labels.districtChoose}
                      bind-id="officeCityId"
                      bind-query="cityId"
                      bind-url={lookup("lookup/Counties")}
                    />
                  </label>
                </div>
                <div className="w-full lg:w-1/6 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]" style={{ textAlign: "center" }}>
                  <button
                    type="submit"
                    className="sk-btn sk-btn-brand w-full"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    {officeButton} <i className="ri-search-line" />
                  </button>
                </div>
              </form>
            </div>

            <div className={activeTab === 2 ? "block" : "hidden"} id="tab_3" role="tabpanel">
              <form method="get" className="flex flex-wrap max-md:bg-white max-md:[border-radius:calc(5px_*_var(--sk-scale,_1))]" action={consultantAction}>
                <div className="w-full xl:w-1/6 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <input type="text" className="" name="FilterDTO.Firstname" placeholder={firstNamePlaceholder} />
                </div>
                <div className="w-full xl:w-1/6 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <input type="text" className="" name="FilterDTO.Lastname" placeholder={lastNamePlaceholder} />
                </div>
                <div className="w-full xl:w-1/4 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="userCountryId">
                    {labels.country}
                    <select
                      className=""
                      id="userCountryId"
                      name="FilterDTO.CountryId"
                      data-placeholder={labels.countryChoose}
                      bind-url={lookup("Lookup/EnteredConsultantCountries")}
                    />
                  </label>
                </div>
                <div className="w-full xl:w-1/4 md:w-1/2 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]">
                  <label className="sk-search-label" htmlFor="userCityId">
                    {labels.city}
                    <select
                      className=""
                      id="userCityId"
                      name="FilterDTO.CityId"
                      data-placeholder={labels.cityChoose}
                      bind-id="userCountryId"
                      bind-query="countryId"
                      bind-url={lookup("Lookup/EnteredConsultantCitiesByCountryId")}
                    />
                  </label>
                </div>
                <div className="w-full lg:w-1/6 md:w-1/6 [margin-bottom:calc(15px_*_var(--sk-scale,_1))]" style={{ textAlign: "center" }}>
                  <button
                    type="submit"
                    className="sk-btn sk-btn-brand w-full"
                    style={{ justifyContent: "center", display: "flex" }}
                  >
                    {consultantButton} <i className="ri-search-line" />
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
