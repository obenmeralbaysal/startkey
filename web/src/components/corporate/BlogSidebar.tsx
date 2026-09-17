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
      <div className="sidebar-widget style4">
        <div className="search-box">
          <div className="form-group">
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
            <div className="pp-post-item" key={post.urlPath}>
              <a className="pp-post-img" href={post.urlPath}>
                <Picture className="img-fluid" width={85} height={85}>
                  {post.imageWebp ? <source srcSet={post.imageWebp} type="image/webp" /> : null}
                  <img src={post.image} alt="Blog-photo" width={85} height={85} />
                </Picture>
              </a>
              <div className="pp-post-info">
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
