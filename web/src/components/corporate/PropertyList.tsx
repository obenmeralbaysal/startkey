import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { ListingCard } from "@/components/corporate/ListingCard";
import type { CorporatePayload, ListingFilterData } from "@/lib/corporate";

export function PropertyList({ data }: { data: Extract<CorporatePayload, { kind: "listing-list" }> }) {
  const values = data.filter.values;
  const sorting = scalar(values["SortingType"]);

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="listing-wrap ptb-100">
        <div className="container">
          <div className="row gx-5">
            <div className="col-xl-4" style={{ display: "flex", justifyContent: "center" }}>
              <div className="sidebar" style={{ margin: 0 }}>
                <button className="mobile-filter-btn btn style1 text-center" id="mobile-filter-btn">
                  {data.filter.mobileOpenLabel}
                </button>
                <div className="sidebar-widget sidebar-filter" id="filter-widget">
                  <h4>{data.filter.heading}</h4>
                  <FilterForm filter={data.filter} />
                </div>
              </div>
            </div>

            {data.hasResults ? (
              <div className="col-xl-8">
                <div className="row align-items-center mb-25">
                  <div className="col-md-8">
                    <div className="profuct-result">
                      <p>
                        <i className="ri-building-2-fill" /> {data.foundLabel}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="filter-item-cat">
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
                <div className="row">
                  {data.items.map((item) => (
                    <div className="col-lg-6 col-md-6" key={item.externalId}>
                      <ListingCard item={item} />
                    </div>
                  ))}
                </div>
                <ListingPagination
                  pageIndex={data.pagination.pageIndex}
                  totalPages={data.pagination.totalPages}
                  basePath={data.pagination.basePath}
                  searchQuery={data.pagination.searchQuery}
                />
              </div>
            ) : null}
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
    <form method="get" role="form" id="prop-filter" className="filter-widget" action={filter.action}>
      <input type="hidden" id="SortingType" name="SortingType" defaultValue={scalar(values["SortingType"])} />

      <div className="form-group">
        <input
          placeholder={filter.placeholders.keyword}
          type="text"
          id="FilterDTO_Keyword"
          name="FilterDTO.Keyword"
          defaultValue={scalar(values["FilterDTO.Keyword"])}
        />
        <span className="text-danger field-validation-valid" data-valmsg-for="FilterDTO.Keyword" />
      </div>

      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_AdTypeId}</label>
        <select
          className=" select2"
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
        <span className="text-danger field-validation-valid" data-valmsg-for="FilterDTO.AdTypeId" />
      </div>

      <div className="form-group">
        <label id="search-text-1">{labels.FilterDTO_ProcessTypeId}</label>
        <select
          className=" bind-select2"
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
        <span className="text-danger field-validation-valid" data-valmsg-for="FilterDTO.ProcessTypeId" />
      </div>

      <div className="form-group">
        <div className="row">
          <div className="col-md-6 col-sm-12">
            <label id="search-text-1">{labels.FilterDTO_MinPrice}</label>
            <input
              placeholder={filter.placeholders.minPrice}
              type="text"
              id="FilterDTO_MinPrice"
              name="FilterDTO.MinPrice"
              defaultValue={scalar(values["FilterDTO.MinPrice"])}
            />
          </div>
          <div className="col-md-6 col-sm-12">
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
          className="bind-select2"
          data-placeholder="Para Birimi"
          id="FilterDTO_CurrencyId"
          name="FilterDTO.CurrencyId"
          bind-url={bind.currencies}
          defaultValue={scalar(values["FilterDTO.CurrencyId"])}
        >
          {selectedOption(values["FilterDTO.CurrencyId"])}
        </select>
        <span className="text-danger field-validation-valid" data-valmsg-for="FilterDTO.CurrencyId" />
      </div>

      <div className="form-group row">
        <div className="col-md-6 col-sm-12">
          <label id="search-text-1">{labels.FilterDTO_MinCleanArea}</label>
          <input
            placeholder={filter.placeholders.minArea}
            type="text"
            id="FilterDTO_MinCleanArea"
            name="FilterDTO.MinCleanArea"
            defaultValue={scalar(values["FilterDTO.MinCleanArea"])}
          />
        </div>
        <div className="col-md-6 col-sm-12">
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
          className="bind-select2"
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
          className="bind-select2"
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
          className=" bind-select2"
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
          className=" bind-select2"
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
          className="bind-select2"
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
          className=" bind-select2"
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
      <div className="form-group" style={{ display: "none" }}>
        <label id="search-text-1">{labels.FilterDTO_HousePropertyTypeId}</label>
        <select className=" select2" id="FilterDTO_HousePropertyTypeId" name="FilterDTO.HousePropertyTypeId" />
      </div>
      <div className="form-group " style={{ display: "none" }}>
        <label id="search-text-1-1">{labels.FilterDTO_CommercialPropertyTypeId}</label>
        <select className=" select2" id="FilterDTO_CommercialPropertyTypeId" name="FilterDTO.CommercialPropertyTypeId" />
      </div>
      <div className="form-group" style={{ display: "none" }}>
        <label id="search-text-1-1">{labels.FilterDTO_LandPropertyTypeId}</label>
        <select className=" select2" id="FilterDTO_LandPropertyTypeId" name="FilterDTO.LandPropertyTypeId" />
      </div>
      <div className="form-group">
        <button className="btn style2 d-block w-100">{filter.submitLabel}</button>
      </div>
    </form>
  );
}

function ListingPagination({
  pageIndex,
  totalPages,
  basePath,
  searchQuery,
}: {
  pageIndex: number;
  totalPages: number;
  basePath: string;
  searchQuery: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (page: number) => `${basePath}?pageIndex=${page}${searchQuery}`;
  const start = Math.max(1, pageIndex - 5);
  const end = Math.min(totalPages, pageIndex + 5);
  const numbered = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <ul className="page-nav list-style mt-10">
      <li className="page-item">
        <a className="" href={hrefFor(1)}>
          &laquo;
        </a>
      </li>
      {numbered.map((page) =>
        page === pageIndex ? (
          <li className="page-item" key={page}>
            <a className=" active">
              <span>{page}</span>
            </a>
          </li>
        ) : (
          <li className="page-item" key={page}>
            <a className="" href={hrefFor(page)}>
              {page}
            </a>
          </li>
        ),
      )}
      <li className="page-item">
        <a className="" href={hrefFor(totalPages)}>
          &raquo;
        </a>
      </li>
    </ul>
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
