import { Picture } from "@/components/corporate/Picture";
import type { ListingCardData } from "@/lib/corporate";

export function ListingCard({ item }: { item: ListingCardData }) {
  const style = item.style === "style6" ? "property-card style6" : "property-card style3";
  const pictureStyle = item.style === "style6" ? { maxHeight: 419 } : undefined;

  return (
    <div className={style}>
      <div className="property-img">
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
        {item.processType ? <span className="property-estatestatus">{item.processType}</span> : null}
        {item.adSubType ? <span className="property-status">{item.adSubType}</span> : null}
      </div>
      <div className="property-info">
        <div className="property-status-wrap">
          <span className={item.style === "style6" ? "property-state" : "property-status"}>
            {item.adTypeIcon ? <i className={item.adTypeIcon} /> : null} {item.adType}
          </span>
          {item.style !== "style6" && item.badgeImage ? (
            <img src={item.badgeImage} title="EIDS" alt="EIDS_Logo" style={{ width: 60, height: 60 }} />
          ) : null}
          <p className="property-price"> {item.price}</p>
        </div>
        <h3 className="prop-title">
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
        <ul className="property-metainfo list-style" style={{ justifyContent: "center", alignItems: "center" }}>
          {item.features.map((feature) => (
            <li className="feature-li" key={`${item.externalId}-${feature.text}`}>
              <i className={feature.icon} />
              {feature.text}
            </li>
          ))}
          <li className="feature-li">
            <a className="btn style2" style={{ padding: "8px 25px 8px 25px" }} href={item.urlPath}>
              {item.detailLabel} <i className="ri-arrow-right-s-line prop-right-icon" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
