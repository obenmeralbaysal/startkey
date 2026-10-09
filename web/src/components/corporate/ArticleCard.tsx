import { Picture } from "@/components/corporate/Picture";
import type { ArticleCardData } from "@/lib/corporate";

export function ArticleCard({
  item,
  continueLabel,
}: {
  item: ArticleCardData;
  continueLabel: string;
}) {
  const width = item.width ?? 416;
  const height = item.height ?? 500;

  return (
    <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] bg-white [box-shadow:0px_calc(6px_*_var(--sk-scale,_1))_calc(50px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.07)] [transition:0.4s] hover:[box-shadow:0px_calc(40px_*_var(--sk-scale,_1))_calc(51px_*_var(--sk-scale,_1))_calc(-16px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.1)] hover:[border-color:transparent]">
      <div className="overflow-hidden relative">
        <a href={item.urlPath}>
          <Picture className="max-w-full h-auto" width={width} height={height}>
            {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
            <img src={item.image} alt={item.imageAlt || "Blog-photo"} width={width} height={height} />
          </Picture>
        </a>
      </div>
      <div className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))_calc(22px_*_var(--sk-scale,_1))]">
        <ul className="[margin-bottom:calc(12px_*_var(--sk-scale,_1))] list-none">
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
        <h3 className="[display:-webkit-box] overflow-hidden [text-overflow:ellipsis] [height:3.2em]">
          <a href={item.urlPath}>{item.title}</a>
        </h3>
        <a className="bl-continue font-semibold [line-height:calc(26px_*_var(--sk-scale,_1))] inline-block relative text-brand [transition:all_0.4s_ease-in-out] after:absolute after:[bottom:0] after:[left:0] after:content-[''] after:[width:0] after:[height:1px] after:bg-brand after:invisible after:opacity-0 after:[transition:all_0.4s_ease-in-out] hover:text-navy hover:after:visible hover:after:opacity-100 hover:after:w-full font-heading max-md:[font-size:calc(14px_*_var(--sk-scale,_1))]" href={item.urlPath}>
          {continueLabel} <i className="flaticon-right-arrow-1" />
        </a>
      </div>
    </div>
  );
}
