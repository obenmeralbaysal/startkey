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
    <div className="max-xl:[margin:calc(50px_*_var(--sk-scale,_1))_0_0] max-xl:[margin-top:calc(25px_*_var(--sk-scale,_1))]">
      <div className="[margin:0_0_calc(30px_*_var(--sk-scale,_1))] relative z-[1] [padding:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] last:[margin:0] max-md:[padding:calc(20px_*_var(--sk-scale,_1))]">
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
      <div className="[margin:0_0_calc(30px_*_var(--sk-scale,_1))] relative z-[1] [padding:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] last:[margin:0] max-md:[padding:calc(20px_*_var(--sk-scale,_1))] popular-post">
        <h4>{sidebar.popularHeading}</h4>
        <div className="popular-post-widget">
          {sidebar.popular.map((post) => (
            <div className="flex flex-wrap [margin:0_0_calc(20px_*_var(--sk-scale,_1))] last:[margin:0]" key={post.urlPath}>
              <a className="[width:calc(85px_*_var(--sk-scale,_1))] [border-radius:calc(4px_*_var(--sk-scale,_1))]" href={post.urlPath}>
                <Picture className="max-w-full h-auto" width={85} height={85}>
                  {post.imageWebp ? <source srcSet={post.imageWebp} type="image/webp" /> : null}
                  <img src={post.image} alt="Blog-photo" width={85} height={85} />
                </Picture>
              </a>
              <div className="[width:calc(100%_-_calc(100px_*_var(--sk-scale,_1)))] [margin-left:calc(15px_*_var(--sk-scale,_1))] [margin-top:calc(2px_*_var(--sk-scale,_1))]">
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
