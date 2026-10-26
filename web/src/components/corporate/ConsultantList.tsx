import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { DirectoryCard, DirectoryPagination } from "@/components/corporate/DirectoryCard";
import { DirectorySearch } from "@/components/corporate/DirectorySearch";
import type { CorporatePayload } from "@/lib/corporate";

export function ConsultantList({ data }: { data: Extract<CorporatePayload, { kind: "consultant-list" }> }) {
  const ui = data.filter.ui;
  if (!ui) {
    return null;
  }
  const query = {
    q: data.filter.values.q ?? "",
    il: data.filter.values.il ?? "",
    ilce: data.filter.values.ilce ?? "",
  };

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="agent-wrap [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="container">
          <DirectorySearch
            basePath={data.pagination.basePath}
            query={query}
            places={data.filter.places ?? []}
            ui={ui}
            foundLabel={data.foundLabel}
            hasResults={data.hasResults}
            emptyLabel={data.emptyLabel ?? ""}
          >
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
              pageParam="page"
            />
          </DirectorySearch>
        </div>
      </section>
    </>
  );
}
