import type { ApiProperty } from "@/lib/api";

export function FeaturedProperties({
  titleHtml,
  properties,
}: {
  titleHtml: string;
  properties: ApiProperty[];
}) {
  return (
    <section className="property-slider-wrap bg-seashell td-cod ptb-100">
      <div className="container">
        <div
          className="section-title style2 text-center mb-40"
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />

        <div className="property-slider-one homepage-featured-prop owl-carousel" id="propcarousel">
          {properties.map((property) => {
            const imageBase = property.image.replace(/\.[^.]+$/, "");
            return (
              <div className="property-card style6" key={property.externalId}>
                <div className="property-img">
                  <a href={property.urlPath}>
                    <picture style={{ maxHeight: "419px" }}>
                      <source srcSet={`/media/property/${imageBase}.webp`} type="image/webp" />
                      <img
                        src={`/media/property/${property.image}`}
                        alt="Property-photo"
                        width={420}
                        height={300}
                        loading="lazy"
                      />
                    </picture>
                  </a>
                  <span className="property-estatestatus">{property.processType}</span>
                  <span className="property-status">{property.adSubType}</span>
                </div>
                <div className="property-info">
                  <div className="property-status-wrap">
                    <span className="property-state">
                      <i className="flaticon-home" />
                      {property.adType}
                    </span>
                    <p className="property-price"> {property.price}</p>
                  </div>
                  <h3 className="prop-title">
                    <a href={property.urlPath}>{property.title}</a>
                  </h3>
                  <p>
                    <i className="flaticon-location" />
                    {property.location}
                  </p>
                  <ul
                    className="property-metainfo list-style"
                    style={{ justifyContent: "center", alignItems: "center" }}
                  >
                    <li className="feature-li">
                      <i className="flaticon-double-bed" />
                      {`    ${property.rooms}`}
                    </li>
                    <li className="feature-li">
                      <i className="flaticon-square" />
                      {` ${property.area}`}
                    </li>
                    <li className="feature-li">
                      <a
                        className="btn style2"
                        style={{ padding: "8px 25px 8px 25px" }}
                        href={property.urlPath}
                      >
                        {property.detailLabel} <i className="ri-arrow-right-s-line prop-right-icon" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
