import { Picture } from "@/components/corporate/Picture";
import type { BlogSidebarData } from "@/lib/corporate";

export function BlogSidebar({
  sidebar,
  searchValue = "",
}: {
  sidebar: BlogSidebarData;
  searchValue?: string;
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-widget">
        <div className="relative">
          <div className="mb-[calc(15px*var(--sk-scale,1))]">
            <form method="get" className="form-search" action={sidebar.searchAction}>
              <input
                type="search"
                name="searchText"
                placeholder={sidebar.searchPlaceholder}
                defaultValue={searchValue}
              />
              <button type="submit">
                <i className="flaticon-search" />
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="sidebar-widget popular-post">
        <h4>{sidebar.popularHeading}</h4>
        <div className="popular-post-widget">
          {sidebar.popular.map((post) => (
            <div className="pp-item" key={post.urlPath}>
              <a href={post.urlPath}>
                <Picture width={85} height={85}>
                  {post.imageWebp ? <source srcSet={post.imageWebp} type="image/webp" /> : null}
                  <img src={post.image} alt="Blog-photo" width={85} height={85} />
                </Picture>
              </a>
              <div className="pp-copy">
                <span>
                  <i className="flaticon-calendar" />
                  {post.dateLabel}
                </span>
                <h6>
                  <a className="text-inherit" href={post.urlPath}>
                    {post.title}
                  </a>
                </h6>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
