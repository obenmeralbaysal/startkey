import { ArticleCard } from "@/components/corporate/ArticleCard";
import { BlogSidebar } from "@/components/corporate/BlogSidebar";
import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { Pagination } from "@/components/corporate/Pagination";
import type { CorporatePayload } from "@/lib/corporate";

export function ArticleList({ data }: { data: Extract<CorporatePayload, { kind: "article-list" }> }) {
  const isBlog = data.layout === "two-col-sidebar";
  const columnClass = isBlog ? "col-xl-6 col-lg-6 col-md-6" : "col-xl-4 col-lg-4 col-md-6";

  const cards = (
    <div className="row justify-content-center">
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
      <div className="blog-wrap ptb-100">
        <div className="container">
          <div className="row gx-5">
            {isBlog ? (
              <>
                <div className="col-lg-8">
                  {cards}
                </div>
                <div className="col-xl-4 col-lg-12">
                  {data.sidebar ? (
                    <BlogSidebar sidebar={data.sidebar} searchValue={data.search?.value ?? ""} />
                  ) : null}
                </div>
              </>
            ) : (
              <div className="col-lg-12">
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
