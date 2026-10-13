import type { ApiProperty } from "@/lib/api";

export function FeaturedProperties({
  titleHtml,
  properties,
}: {
  titleHtml: string;
  properties: ApiProperty[];
}) {
  return (
    <section className="property-slider-wrap bg-seashell td-cod [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="sk-section-title is-center" dangerouslySetInnerHTML={{ __html: titleHtml }} />

        <div data-carousel="cards">
          {properties.map((property) => {
            const imageBase = property.image.replace(/\.[^.]+$/, "");
            return (
              <div className="sk-property" key={property.externalId}>
                <div className="sk-property-img">
                  <a href={property.urlPath}>
                    <picture>
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
                  <span className="sk-property-sale">{property.processType}</span>
                  <span className="sk-property-kind">{property.adSubType}</span>
                </div>
                <div className="sk-property-info">
                  <div className="sk-property-status">
                    <span>
                      <i className="flaticon-home" />
                      {property.adType}
                    </span>
                    <p className="sk-property-price">{property.price}</p>
                  </div>
                  <h3>
                    <a href={property.urlPath}>{property.title}</a>
                  </h3>
                  <p>
                    <i className="flaticon-location" />
                    {property.location}
                  </p>
                  <ul className="sk-property-meta">
                    <li>
                      <i className="flaticon-double-bed" />
                      {property.rooms}
                    </li>
                    <li>
                      <i className="flaticon-square" />
                      {property.area}
                    </li>
                    <li>
                      <a className="sk-btn sk-btn-brand" href={property.urlPath}>
                        {property.detailLabel} <i className="ri-arrow-right-s-line" />
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
