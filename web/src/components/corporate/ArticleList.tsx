import { ArticleCard } from "@/components/corporate/ArticleCard";
import { BlogSidebar } from "@/components/corporate/BlogSidebar";
import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { Pagination } from "@/components/corporate/Pagination";
import type { CorporatePayload } from "@/lib/corporate";

export function ArticleList({ data }: { data: Extract<CorporatePayload, { kind: "article-list" }> }) {
  const isBlog = data.layout === "two-col-sidebar";
  const columnClass = isBlog ? "col-xl-6 col-lg-6 col-md-6" : "col-xl-4 col-lg-4 col-md-6";

  const cards = (
    <div className="flex flex-wrap justify-center">
      {data.items.map((item) => (
        <div className={columnClass} key={item.externalId}>
          <ArticleCard item={item} continueLabel={data.continueLabel} />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="blog-wrap [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="container">
          <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))]">
            {isBlog ? (
              <>
                <div className="w-full lg:w-2/3">
                  {cards}
                </div>
                <div className="w-full xl:w-1/3">
                  {data.sidebar ? (
                    <BlogSidebar sidebar={data.sidebar} searchValue={data.search?.value ?? ""} />
                  ) : null}
                </div>
              </>
            ) : (
              <div className="w-full">
                {cards}
              </div>
            )}
          </div>
          <Pagination
            pageIndex={data.pagination.pageIndex}
            totalPages={data.pagination.totalPages}
            basePath={data.pagination.basePath}
            searchQuery={data.pagination.searchQuery}
          />
        </div>
      </div>
    </>
  );
}
