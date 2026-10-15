import { Picture } from "@/components/corporate/Picture";
import type { ListingCardData } from "@/lib/corporate";

export function ListingCard({ item }: { item: ListingCardData }) {
  const style = item.style === "style6" ? "property-card style6" : "property-card style3";
  const width = item.style === "style6" ? 420 : 412;
  const height = item.style === "style6" ? 300 : 292;

  return (
    <div className={style}>
      <div className="property-img">
        <a href={item.urlPath}>
          <Picture width={width} height={height}>
            {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
            <img src={item.image} alt="Property-photo" width={width} height={height} />
          </Picture>
        </a>
        {item.processType ? <span className="property-estatestatus">{item.processType}</span> : null}
        {item.adSubType ? <span className="property-status">{item.adSubType}</span> : null}
      </div>
      <div className="property-info">
        <div className="property-status-wrap">
          <span className={item.style === "style6" ? "property-state" : "property-status"}>
            {item.adTypeIcon ? <i className={item.adTypeIcon} /> : null} {item.adType}
          </span>
          {item.style !== "style6" && item.badgeImage ? (
            <img src={item.badgeImage} title="EIDS" alt="EIDS_Logo" width={60} height={60} />
          ) : null}
          <p className="property-price">{item.price}</p>
        </div>
        <h3 className="prop-title">
          <a href={item.urlPath}>{item.title}</a>
        </h3>
        <p>
          <i className="flaticon-location" />
          {item.location}
        </p>
        {item.style !== "style6" && item.updatedLabel ? <p>{item.updatedLabel}</p> : null}
        <ul className="property-metainfo">
          {item.features.map((feature) => (
            <li key={`${item.externalId}-${feature.text}`}>
              <i className={feature.icon} />
              {feature.text}
            </li>
          ))}
          <li>
            <a className="btn style2" href={item.urlPath}>
              {item.detailLabel} <i className="ri-arrow-right-s-line" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
