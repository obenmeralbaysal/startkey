import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { DirectoryCard, DirectoryPagination } from "@/components/corporate/DirectoryCard";
import type { CorporatePayload, DirectoryFilterData } from "@/lib/corporate";

export function ConsultantList({ data }: { data: Extract<CorporatePayload, { kind: "consultant-list" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="agent-wrap [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="container">
          <ConsultantFilter filter={data.filter} />
          {data.hasResults ? (
            <>
              <div className="flex flex-wrap items-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                <div className="w-full md:w-2/3">
                  <div className="max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                    <p>
                      <i className="flaticon-user" /> {data.foundLabel}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center">
                {data.items.map((item) => (
                  <div className="box-border w-full px-[calc(12px*var(--sk-scale,1))] md:w-1/2 xl:w-1/3" key={item.externalId}>
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

function ConsultantFilter({ filter }: { filter: DirectoryFilterData }) {
  const values = filter.values;
  const labels = filter.selectedLabels ?? {};
  const placeholders = filter.placeholders;
  const bind = filter.bindUrls;

  return (
    <div className="sk-search-shell">
      <form className="sk-search-bar" method="get" role="form" id="filterForm" action={filter.action}>
        <div className="w-full sm:w-1/6">
          <h5 id="search-text-title">
            {" "}
            <span> {filter.searchHeading}</span>{" "}
          </h5>
        </div>
        <div className="w-full sm:w-1/6">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input
              className=""
              placeholder={placeholders.firstName}
              type="text"
              id="FilterDTO_Firstname"
              name="FilterDTO.Firstname"
              defaultValue={values["FilterDTO.Firstname"] ?? ""}
            />
            <span className="field-validation-valid" data-valmsg-for="FilterDTO.Firstname" data-valmsg-replace="true" />
          </div>
        </div>
        <div className="w-full sm:w-1/6">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <input
              className=""
              placeholder={placeholders.lastName}
              type="text"
              id="FilterDTO_Lastname"
              name="FilterDTO.Lastname"
              defaultValue={values["FilterDTO.Lastname"] ?? ""}
            />
            <span className="field-validation-valid" data-valmsg-for="FilterDTO.Lastname" data-valmsg-replace="true" />
          </div>
        </div>
        <div className="w-full sm:w-1/6">
          <select
            className="office-select"
            id="FilterDTO_OfficeId"
            name="FilterDTO.OfficeId"
            bind-url={bind.offices}
            defaultValue={values["FilterDTO.OfficeId"] ?? ""}
          >
            {selectedOption(values["FilterDTO.OfficeId"], labels["FilterDTO.OfficeId"])}
          </select>
          <span className="field-validation-valid" data-valmsg-for="FilterDTO.OfficeId" data-valmsg-replace="true" />
        </div>
        <div className="w-full sm:w-1/6">
          <select
            className=""
            bind-id="FilterDTO_CountryId"
            bind-query="countryId"
            id="FilterDTO_CityId"
            name="FilterDTO.CityId"
            bind-url={bind.cities}
            defaultValue={values["FilterDTO.CityId"] ?? ""}
          >
            {selectedOption(values["FilterDTO.CityId"], labels["FilterDTO.CityId"])}
          </select>
          <span className="field-validation-valid" data-valmsg-for="FilterDTO.CityId" data-valmsg-replace="true" />
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
