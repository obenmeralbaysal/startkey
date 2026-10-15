import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Pagination } from "@/components/corporate/Pagination";
import type { CorporatePayload, ListingFilterData } from "@/lib/corporate";

export function PropertyList({ data }: { data: Extract<CorporatePayload, { kind: "listing-list" }> }) {
  const values = data.filter.values;
  const sorting = scalar(values["SortingType"]);

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="listing-wrap ptb-100">
        <div className="container">
          <div className="sk-split">
            <div className="sk-third">
              <div className="sidebar">
                <button className="btn sk-filter-toggle" id="mobile-filter-btn" type="button">
                  {data.filter.mobileOpenLabel}
                </button>
                <div className="sidebar-widget" id="filter-widget">
                  <h4>{data.filter.heading}</h4>
                  <FilterForm filter={data.filter} />
                </div>
              </div>
            </div>

            {data.hasResults ? (
              <div className="sk-two-thirds">
                <div className="flex flex-wrap items-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                  <div className="w-full md:w-2/3">
                    <div className="max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                      <p>
                        <i className="ri-building-2-fill" /> {data.foundLabel}
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3">
                    <div className="block">
                      <select className="select single-select" id="sorting-type-select" name="SortingType" defaultValue={sorting}>
                        {data.filter.sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="sk-split">
                  {data.items.map((item) => (
                    <div className="sk-half" key={item.externalId}>
                      <ListingCard item={item} />
                    </div>
                  ))}
                </div>
                <Pagination
                  pageIndex={data.pagination.pageIndex}
                  totalPages={data.pagination.totalPages}
                  basePath={data.pagination.basePath}
                  searchQuery={data.pagination.searchQuery}
                />
              </div>
            ) : (
              <div className="sk-two-thirds">
                <p className="text-center">{data.emptyLabel}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function FilterForm({ filter }: { filter: ListingFilterData }) {
  const values = filter.values;
  const labels = filter.labels;
  const bind = filter.bindUrls;

  return (
    <form method="get" role="form" id="prop-filter" className="block" action={filter.action}>
      <input type="hidden" id="SortingType" name="SortingType" defaultValue={scalar(values["SortingType"])} />

      <div className="form-group">
        <input
          placeholder={filter.placeholders.keyword}
          type="text"
          id="FilterDTO_Keyword"
          name="FilterDTO.Keyword"
          defaultValue={scalar(values["FilterDTO.Keyword"])}
        />
        <span className="text-brand field-validation-valid" data-valmsg-for="FilterDTO.Keyword" />
      </div>

      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_AdTypeId}</label>
        <select
          className=""
          data-placeholder="Portföy Tipi"
          id="FilterDTO_AdTypeId"
          name="FilterDTO.AdTypeId"
          defaultValue={scalar(values["FilterDTO.AdTypeId"])}
        >
          {filter.adTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-brand field-validation-valid" data-valmsg-for="FilterDTO.AdTypeId" />
      </div>

      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_ProcessTypeId}</label>
        <select
          className=""
          data-placeholder="Portföy Durumu"
          bind-id="FilterDTO_AdTypeId"
          bind-query="adType"
          id="FilterDTO_ProcessTypeId"
          name="FilterDTO.ProcessTypeId"
          bind-url={bind.processTypes}
          defaultValue={scalar(values["FilterDTO.ProcessTypeId"])}
        >
          {selectedOption(values["FilterDTO.ProcessTypeId"])}
        </select>
        <span className="text-brand field-validation-valid" data-valmsg-for="FilterDTO.ProcessTypeId" />
      </div>

      <div className="form-group">
        <div className="sk-pair">
          <div>
            <label id="search-text-1">{labels.FilterDTO_MinPrice}</label>
            <input
              placeholder={filter.placeholders.minPrice}
              type="text"
              id="FilterDTO_MinPrice"
              name="FilterDTO.MinPrice"
              defaultValue={scalar(values["FilterDTO.MinPrice"])}
            />
          </div>
          <div>
            <label id="search-text-1">{labels.FilterDTO_MaxPrice}</label>
            <input
              placeholder={filter.placeholders.maxPrice}
              type="text"
              id="FilterDTO_MaxPrice"
              name="FilterDTO.MaxPrice"
              defaultValue={scalar(values["FilterDTO.MaxPrice"])}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_CurrencyId}</label>
        <select
          className=""
          data-placeholder="Para Birimi"
          id="FilterDTO_CurrencyId"
          name="FilterDTO.CurrencyId"
          bind-url={bind.currencies}
          defaultValue={scalar(values["FilterDTO.CurrencyId"])}
        >
          {selectedOption(values["FilterDTO.CurrencyId"])}
        </select>
        <span className="text-brand field-validation-valid" data-valmsg-for="FilterDTO.CurrencyId" />
      </div>

      <div className="form-group sk-pair">
        <div className="w-full md:w-1/2">
          <label id="search-text-1">{labels.FilterDTO_MinCleanArea}</label>
          <input
            placeholder={filter.placeholders.minArea}
            type="text"
            id="FilterDTO_MinCleanArea"
            name="FilterDTO.MinCleanArea"
            defaultValue={scalar(values["FilterDTO.MinCleanArea"])}
          />
        </div>
        <div className="w-full md:w-1/2">
          <label id="search-text-1">{labels.FilterDTO_MaxCleanArea}</label>
          <input
            placeholder={filter.placeholders.maxArea}
            type="text"
            id="FilterDTO_MaxCleanArea"
            name="FilterDTO.MaxCleanArea"
            defaultValue={scalar(values["FilterDTO.MaxCleanArea"])}
          />
        </div>
      </div>

      <div className="form-group">
        <label id="search-text-1" style={{ marginTop: "6%" }}>
          {labels.FilterDTO_CountryId}
        </label>
        <select
          className=""
          id="FilterDTO_CountryId"
          name="FilterDTO.CountryId"
          bind-url={bind.countries}
          defaultValue={scalar(values["FilterDTO.CountryId"])}
        >
          {selectedOption(values["FilterDTO.CountryId"])}
        </select>
      </div>
      <div className="form-group">
        <label id="search-text-1" style={{ marginTop: "6%" }}>
          {labels.FilterDTO_CityId}
        </label>
        <select
          className=""
          bind-id="FilterDTO_CountryId"
          bind-query="countryId"
          id="FilterDTO_CityId"
          name="FilterDTO.CityId"
          bind-url={bind.cities}
          defaultValue={scalar(values["FilterDTO.CityId"])}
        >
          {selectedOption(values["FilterDTO.CityId"])}
        </select>
      </div>
      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_CountyIds}</label>
        <select
          className=""
          multiple
          bind-id="FilterDTO_CityId"
          bind-query="cityId"
          id="FilterDTO_CountyIds"
          name="FilterDTO.CountyIds"
          bind-url={bind.counties}
          defaultValue={list(values["FilterDTO.CountyIds"])}
        >
          {list(values["FilterDTO.CountyIds"]).map((id) => (
            <option key={id} value={id} selected>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_DistrictIds}</label>
        <select
          className=""
          multiple
          bind-id="FilterDTO_CountyIds"
          bind-query="countyIds"
          id="FilterDTO_DistrictIds"
          name="FilterDTO.DistrictIds"
          bind-url={bind.districts}
          defaultValue={list(values["FilterDTO.DistrictIds"])}
        >
          {list(values["FilterDTO.DistrictIds"]).map((id) => (
            <option key={id} value={id} selected>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_OfficeId}</label>
        <select
          className=""
          id="FilterDTO_OfficeId"
          name="FilterDTO.OfficeId"
          bind-url={bind.offices}
          defaultValue={scalar(values["FilterDTO.OfficeId"])}
        >
          {selectedOption(values["FilterDTO.OfficeId"])}
        </select>
      </div>
      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_UserId}</label>
        <select
          className=""
          bind-id="FilterDTO_OfficeId"
          bind-query="officeId"
          id="FilterDTO_UserId"
          name="FilterDTO.UserId"
          bind-url={bind.users}
          defaultValue={scalar(values["FilterDTO.UserId"])}
        >
          {selectedOption(values["FilterDTO.UserId"])}
        </select>
      </div>
      <div className="mb-[calc(15px*var(--sk-scale,1))]" style={{ display: "none" }}>
        <label id="search-text-1">{labels.FilterDTO_HousePropertyTypeId}</label>
        <select className="" id="FilterDTO_HousePropertyTypeId" name="FilterDTO.HousePropertyTypeId" />
      </div>
      <div className="mb-[calc(15px*var(--sk-scale,1))]" style={{ display: "none" }}>
        <label id="search-text-1-1">{labels.FilterDTO_CommercialPropertyTypeId}</label>
        <select className="" id="FilterDTO_CommercialPropertyTypeId" name="FilterDTO.CommercialPropertyTypeId" />
      </div>
      <div className="mb-[calc(15px*var(--sk-scale,1))]" style={{ display: "none" }}>
        <label id="search-text-1-1">{labels.FilterDTO_LandPropertyTypeId}</label>
        <select className="" id="FilterDTO_LandPropertyTypeId" name="FilterDTO.LandPropertyTypeId" />
      </div>
      <div className="form-group">
        <button className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100 block w-full">{filter.submitLabel}</button>
      </div>
    </form>
  );
}

function scalar(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function list(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== "");
  }
  return value ? [value] : [];
}

function selectedOption(value: string | string[] | undefined) {
  const id = scalar(value);
  if (!id) {
    return null;
  }
  return (
    <option value={id} selected>
      {id}
    </option>
  );
}
