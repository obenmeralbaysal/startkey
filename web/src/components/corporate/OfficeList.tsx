import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { DirectoryCard, DirectoryPagination } from "@/components/corporate/DirectoryCard";
import type { CorporatePayload, DirectoryFilterData } from "@/lib/corporate";

export function OfficeList({ data }: { data: Extract<CorporatePayload, { kind: "office-list" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="agent-wrap ptb-100">
        <div className="container">
          <OfficeFilter filter={data.filter} />
          {data.hasResults ? (
            <>
              <div className="row align-items-center mb-25">
                <div className="col-md-8">
                  <div className="profuct-result">
                    <p>
                      <i className="flaticon-office-building" /> {data.foundLabel}
                    </p>
                  </div>
                </div>
              </div>
              <div className="row justify-content-center">
                {data.items.map((item) => (
                  <div className="col-xl-4 col-lg-6 col-md-6" key={item.externalId}>
                    <DirectoryCard item={item} />
                  </div>
                ))}
              </div>
              <DirectoryPagination
                pageIndex={data.pagination.pageIndex}
                totalPages={data.pagination.totalPages}
                basePath={data.pagination.basePath}
                searchQuery={data.pagination.searchQuery}
              />
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}

function OfficeFilter({ filter }: { filter: DirectoryFilterData }) {
  const values = filter.values;
  const labels = filter.selectedLabels ?? {};
  const bind = filter.bindUrls;

  return (
    <div className="search-property style1" style={{ padding: "25px 35px 25px 30px", top: 10, marginBottom: 40 }}>
      <form className="row gx-3 gy-2 align-items-center search-bar-items" method="get" role="form" id="filterForm" action={filter.action}>
        <div className="col-sm-2">
          <h5 id="search-text-title">
            {" "}
            <span> {filter.searchHeading}</span>{" "}
          </h5>
        </div>
        <div className="col-sm-2">
          <div className="form-group">
            <input
              className=""
              placeholder={filter.searchPlaceholder}
              type="text"
              id="SearchText"
              name="SearchText"
              defaultValue={values.SearchText ?? ""}
            />
            <span className="field-validation-valid" data-valmsg-for="SearchText" data-valmsg-replace="true" />
          </div>
        </div>
        <div className="col-sm-2">
          <select
            className="select2"
            id="officeCountryId"
            name="FilterDTO.CountryId"
            bind-url={bind.countries}
            defaultValue={values["FilterDTO.CountryId"] ?? ""}
          >
            {selectedOption(values["FilterDTO.CountryId"], labels["FilterDTO.CountryId"])}
          </select>
        </div>
        <div className="col-sm-2">
          <select
            className="bind-select2"
            id="officeCityId"
            bind-id="officeCountryId"
            bind-query="countryId"
            name="FilterDTO.CityId"
            bind-url={bind.cities}
            defaultValue={values["FilterDTO.CityId"] ?? ""}
          >
            {selectedOption(values["FilterDTO.CityId"], labels["FilterDTO.CityId"])}
          </select>
        </div>
        <div className="col-sm-2">
          <select
            className="bind-select2"
            id="officeCountyId"
            bind-id="officeCityId"
            bind-query="cityId"
            name="FilterDTO.CountyId"
            bind-url={bind.counties}
            defaultValue={values["FilterDTO.CountyId"] ?? ""}
          >
            {selectedOption(values["FilterDTO.CountyId"], labels["FilterDTO.CountyId"])}
          </select>
        </div>
        <div className="col-sm-2" style={{ textAlign: "center" }}>
          <button type="submit" id="office-submit" className="btn style2" style={{ width: "100%" }}>
            {filter.submitLabel}
            <i className="fas fa-arrow-right ms-2" />
          </button>
        </div>
      </form>
    </div>
  );
}

function selectedOption(value: string | undefined, label?: string) {
  if (!value) {
    return null;
  }
  return (
    <option value={value} selected>
      {label || value}
    </option>
  );
}
