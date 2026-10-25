import { Picture } from "@/components/corporate/Picture";
import type { ArticleCardData } from "@/lib/corporate";

export function ArticleCard({
  item,
  continueLabel,
}: {
  item: ArticleCardData;
  continueLabel: string;
}) {
  const width = item.width ?? 412;
  const height = item.height ?? 274;

  return (
    <div className="blog-card style1">
      <div className="blog-img">
        <a href={item.urlPath}>
          <Picture width={width} height={height}>
            {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
            <img src={item.image} alt={item.imageAlt || "Blog-photo"} width={width} height={height} />
          </Picture>
        </a>
      </div>
      <div className="blog-info">
        <ul className="blog-metainfo">
          {item.dateLabel ? (
            <li>
              <i className="flaticon-calendar" />
              {item.dateLabel}
            </li>
          ) : null}
          {item.category ? (
            <li>
              <i className="flaticon-price-tag" />
              {item.category}
            </li>
          ) : null}
        </ul>
        <h3 className="content-title-responsive">
          <a href={item.urlPath}>{item.title}</a>
        </h3>
        {/* The reference repeats the class attribute; browsers keep only "bl-continue". */}
        <a className="bl-continue" href={item.urlPath}>
          {continueLabel} <i className="flaticon-right-arrow-1" />
        </a>
      </div>
    </div>
  );
}
