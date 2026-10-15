import { ArticleCard } from "@/components/corporate/ArticleCard";
import { BlogSidebar } from "@/components/corporate/BlogSidebar";
import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { Pagination } from "@/components/corporate/Pagination";
import type { CorporatePayload } from "@/lib/corporate";

export function ArticleList({ data }: { data: Extract<CorporatePayload, { kind: "article-list" }> }) {
  const isBlog = data.layout === "two-col-sidebar";
  const columnClass = isBlog ? "sk-half" : "sk-third";

  const cards = (
    <div className="sk-split">
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
          <div className="sk-split">
            {isBlog ? (
              <>
                <div className="sk-two-thirds">
                  {cards}
                </div>
                <div className="sk-third">
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
