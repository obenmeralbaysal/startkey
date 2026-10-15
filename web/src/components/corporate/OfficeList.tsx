import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { DirectoryCard, DirectoryPagination } from "@/components/corporate/DirectoryCard";
import type { CorporatePayload, DirectoryFilterData } from "@/lib/corporate";
import { scaled } from "@/lib/scale";

export function OfficeList({ data }: { data: Extract<CorporatePayload, { kind: "office-list" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="agent-wrap [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="container">
          <OfficeFilter filter={data.filter} />
          {data.hasResults ? (
            <>
              <div className="flex flex-wrap items-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                <div className="w-full md:w-2/3">
                  <div className="max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                    <p>
                      <i className="flaticon-office-building" /> {data.foundLabel}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center">
                {data.items.map((item) => (
                  <div className="w-full xl:w-1/3 lg:w-1/2 md:w-1/2 box-border px-[12px]" key={item.externalId}>
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
          ) : (
            <p className="text-center">{data.emptyLabel}</p>
          )}
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
    <div className="bg-white [border-radius:calc(10px_*_var(--sk-scale,_1))] [padding:calc(35px_*_var(--sk-scale,_1))_calc(45px_*_var(--sk-scale,_1))_calc(45px_*_var(--sk-scale,_1))_calc(30px_*_var(--sk-scale,_1))] z-[1] relative [box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] [margin-top:calc(-85px_*_var(--sk-scale,_1))] max-sm:[padding:calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0] max-sm:[margin:calc(50px_*_var(--sk-scale,_1))_0_0] sm:max-md:[padding:calc(35px_*_var(--sk-scale,_1))_calc(35px_*_var(--sk-scale,_1))_calc(15px_*_var(--sk-scale,_1))] sm:max-md:[margin:calc(-65px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0] md:max-lg:[padding:calc(35px_*_var(--sk-scale,_1))_calc(35px_*_var(--sk-scale,_1))_calc(15px_*_var(--sk-scale,_1))] md:max-lg:[margin:calc(-65px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0] lg:max-xl:[padding:calc(40px_*_var(--sk-scale,_1))] lg:max-xl:[margin:calc(-65px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_0]" style={{ padding: scaled("25px 35px 25px 30px"), top: scaled(10), marginBottom: scaled(40) }}>
      <form className="flex flex-wrap items-center search-bar-items mx-[calc(-8px*var(--sk-scale,1))] mt-[calc(-8px*var(--sk-scale,1))] [&>div]:box-border [&>div]:px-[calc(8px*var(--sk-scale,1))] [&>div]:mt-[calc(8px*var(--sk-scale,1))]" method="get" role="form" id="filterForm" action={filter.action}>
        <div className="w-full sm:w-1/6">
          <h5 id="search-text-title" className="[font-size:calc(20px_*_var(--sk-scale,_1))]">
            {" "}
            <span> {filter.searchHeading}</span>{" "}
          </h5>
        </div>
        <div className="w-full sm:w-1/6">
          <div>
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
        <div className="w-full sm:w-1/6">
          <select
            className=""
            id="officeCountryId"
            name="FilterDTO.CountryId"
            bind-url={bind.countries}
            defaultValue={values["FilterDTO.CountryId"] ?? ""}
          >
            {selectedOption(values["FilterDTO.CountryId"], labels["FilterDTO.CountryId"])}
          </select>
        </div>
        <div className="w-full sm:w-1/6">
          <select
            className=""
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
        <div className="w-full sm:w-1/6">
          <select
            className=""
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
        <div className="w-full sm:w-1/6" style={{ textAlign: "center" }}>
          <button type="submit" id="office-submit" className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" style={{ width: "100%" }}>
            {filter.submitLabel}
            <i className="fas fa-arrow-right [margin-left:calc(.5rem_*_var(--sk-scale,_1))]" />
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
