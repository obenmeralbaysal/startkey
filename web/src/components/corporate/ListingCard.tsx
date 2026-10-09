import { Picture } from "@/components/corporate/Picture";
import type { ListingCardData } from "@/lib/corporate";
import { scaled } from "@/lib/scale";

export function ListingCard({ item }: { item: ListingCardData }) {
  const style = item.style === "style6" ? "property-card style6" : "property-card style3";
  const pictureStyle = item.style === "style6" ? { maxHeight: scaled(419) } : undefined;

  return (
    <div className={style}>
      <div className="overflow-hidden relative [border-radius:calc(5px_*_var(--sk-scale,_1))] [margin-bottom:calc(30px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
        <a href={item.urlPath}>
          <Picture style={pictureStyle} width={item.style === "style6" ? 420 : 412} height={item.style === "style6" ? 300 : 292}>
            {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
            <img
              src={item.image}
              alt="Property-photo"
              width={item.style === "style6" ? 420 : 412}
              height={item.style === "style6" ? 300 : 292}
            />
          </Picture>
        </a>
        {item.processType ? <span className="absolute [top:calc(25px_*_var(--sk-scale,_1))] [left:calc(25px_*_var(--sk-scale,_1))] inline-block bg-brand [font-size:calc(14px_*_var(--sk-scale,_1))] [padding:calc(4px_*_var(--sk-scale,_1))_calc(15px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] text-white">{item.processType}</span> : null}
        {item.adSubType ? <span className="inline-block [padding:calc(3px_*_var(--sk-scale,_1))_calc(12px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] bg-brand text-white absolute [top:calc(25px_*_var(--sk-scale,_1))] [right:calc(25px_*_var(--sk-scale,_1))] [font-size:calc(14px_*_var(--sk-scale,_1))] [left:calc(25px_*_var(--sk-scale,_1))] max-md:[top:calc(20px_*_var(--sk-scale,_1))] max-md:[left:calc(20px_*_var(--sk-scale,_1))]">{item.adSubType}</span> : null}
      </div>
      <div className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))] [border-radius:calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(8px_*_var(--sk-scale,_1))_calc(8px_*_var(--sk-scale,_1))] [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.06)] bg-white [margin-top:calc(-30px_*_var(--sk-scale,_1))] relative z-[1] max-md:[padding:calc(20px_*_var(--sk-scale,_1))] md:max-lg:[padding:calc(20px_*_var(--sk-scale,_1))] lg:max-xl:[padding:calc(20px_*_var(--sk-scale,_1))] xl:max-2xl:[padding:calc(20px_*_var(--sk-scale,_1))]">
        <div className="flex flex-wrap items-center justify-between [margin-bottom:calc(20px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.1)] [padding-bottom:calc(15px_*_var(--sk-scale,_1))]">
          <span className={item.style === "style6" ? "property-state" : "property-status"}>
            {item.adTypeIcon ? <i className={item.adTypeIcon} /> : null} {item.adType}
          </span>
          {item.style !== "style6" && item.badgeImage ? (
            <img src={item.badgeImage} title="EIDS" alt="EIDS_Logo" style={{ width: scaled(60), height: scaled(60) }} />
          ) : null}
          <p className="font-semibold [margin:0] text-brand [font-size:calc(18px_*_var(--sk-scale,_1))] font-heading text-right relative [top:calc(7px_*_var(--sk-scale,_1))] max-md:text-left max-md:[margin:0_0_calc(20px_*_var(--sk-scale,_1))] max-md:[top:0]"> {item.price}</p>
        </div>
        <h3 className="[display:-webkit-box] overflow-hidden [text-overflow:ellipsis] [height:2.5em]">
          <a href={item.urlPath}>{item.title}</a>
        </h3>
        {item.style === "style6" ? (
          <p>
            <i className="flaticon-location" />
            {item.location}
          </p>
        ) : (
          <p style={{ marginBottom: 0 }}>
            <i className="flaticon-location" />
            {item.location}
          </p>
        )}
        {item.style !== "style6" && item.updatedLabel ? <p> {item.updatedLabel}</p> : null}
        <ul className="flex flex-wrap justify-between [border:none] bg-neutral-50 [box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.06)] list-none" style={{ justifyContent: "center", alignItems: "center" }}>
          {item.features.map((feature) => (
            <li className="feature-li" key={`${item.externalId}-${feature.text}`}>
              <i className={feature.icon} />
              {feature.text}
            </li>
          ))}
          <li className="feature-li">
            <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" style={{ padding: scaled("8px 25px 8px 25px") }} href={item.urlPath}>
              {item.detailLabel} <i className="ri-arrow-right-s-line [color:white] [font-size:x-large] [margin:0] [top:calc(3px_*_var(--sk-scale,_1))]" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
