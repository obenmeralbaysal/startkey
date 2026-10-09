import type { ApiProperty } from "@/lib/api";
import { scaled } from "@/lib/scale";

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
        <div
          className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]"
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />

        <div className="" data-carousel="cards">
          {properties.map((property) => {
            const imageBase = property.image.replace(/\.[^.]+$/, "");
            return (
              <div className="[box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)] overflow-hidden [border-radius:calc(5px_*_var(--sk-scale,_1))_calc(5px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))]" key={property.externalId}>
                <div className="overflow-hidden relative [border-radius:calc(5px_*_var(--sk-scale,_1))] [margin-bottom:calc(30px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                  <a href={property.urlPath}>
                    <picture style={{ maxHeight: scaled(419) }}>
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
                  <span className="absolute [top:calc(25px_*_var(--sk-scale,_1))] [left:calc(25px_*_var(--sk-scale,_1))] inline-block bg-brand [font-size:calc(14px_*_var(--sk-scale,_1))] [padding:calc(4px_*_var(--sk-scale,_1))_calc(15px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] text-white">{property.processType}</span>
                  <span className="inline-block [padding:calc(3px_*_var(--sk-scale,_1))_calc(12px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] bg-brand text-white absolute [top:calc(25px_*_var(--sk-scale,_1))] [right:calc(25px_*_var(--sk-scale,_1))] [font-size:calc(14px_*_var(--sk-scale,_1))] [left:calc(25px_*_var(--sk-scale,_1))] max-md:[top:calc(20px_*_var(--sk-scale,_1))] max-md:[left:calc(20px_*_var(--sk-scale,_1))]">{property.adSubType}</span>
                </div>
                <div className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))] [border-radius:calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(8px_*_var(--sk-scale,_1))_calc(8px_*_var(--sk-scale,_1))] [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.06)] bg-white [margin-top:calc(-30px_*_var(--sk-scale,_1))] relative z-[1] max-md:[padding:calc(20px_*_var(--sk-scale,_1))] md:max-lg:[padding:calc(20px_*_var(--sk-scale,_1))] lg:max-xl:[padding:calc(20px_*_var(--sk-scale,_1))] xl:max-2xl:[padding:calc(20px_*_var(--sk-scale,_1))]">
                  <div className="flex flex-wrap items-center justify-between [margin-bottom:calc(20px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.1)] [padding-bottom:calc(15px_*_var(--sk-scale,_1))]">
                    <span className="inline-flex items-center gap-[calc(6px*var(--sk-scale,1))] font-medium text-navy">
                      <i className="flaticon-home" />
                      {property.adType}
                    </span>
                    <p className="font-semibold [margin:0] text-brand [font-size:calc(18px_*_var(--sk-scale,_1))] font-heading text-right relative [top:calc(7px_*_var(--sk-scale,_1))] max-md:text-left max-md:[margin:0_0_calc(20px_*_var(--sk-scale,_1))] max-md:[top:0]"> {property.price}</p>
                  </div>
                  <h3 className="[display:-webkit-box] overflow-hidden [text-overflow:ellipsis] [height:2.5em]">
                    <a href={property.urlPath}>{property.title}</a>
                  </h3>
                  <p>
                    <i className="flaticon-location" />
                    {property.location}
                  </p>
                  <ul
                    className="flex flex-wrap justify-between [border:none] bg-neutral-50 [box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.06)] list-none"
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
                        className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100"
                        style={{ padding: scaled("8px 25px 8px 25px") }}
                        href={property.urlPath}
                      >
                        {property.detailLabel} <i className="ri-arrow-right-s-line [color:white] [font-size:x-large] [margin:0] [top:calc(3px_*_var(--sk-scale,_1))]" />
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
