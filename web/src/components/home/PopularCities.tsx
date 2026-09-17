import type { HomepageContent } from "@/content/types";
import type { ApiPopularCity } from "@/lib/api";

export function PopularCities({
  content,
  cities,
}: {
  content: HomepageContent["cities"];
  cities: ApiPopularCity[];
}) {
  return (
    <section className="city-wrap ptb-100">
      <div className="container">
        <div className="row">
          <div className="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2">
            <div
              className="section-title style1 text-center mb-40"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>

        <div className="city-slider-one owl-carousel">
          {cities.map((city) => {
            const imageBase = city.image.replace(/\.[^.]+$/, "");
            return (
              <div
                className="city-card style2"
                key={city.cityCode}
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-delay="200"
                data-city-id={city.cityCode}
              >
                <picture>
                  <source srcSet={`/media/micrositecontent/${imageBase}.webp`} type="image/webp" />
                  <img
                    src={`/media/micrositecontent/${city.image}`}
                    alt="MicroSiteContent-photo"
                    width={418}
                  />
                </picture>
                <h3>
                  <a href={city.urlPath}>{city.name}</a>
                </h3>
              </div>
            );
          })}
        </div>

        <div className="row justify-content-center mt-30">
          <br />
          <a className="btn style1 text-center" style={{ width: "400px" }} href={content.button.href}>
            {content.button.label}
          </a>
        </div>
      </div>
    </section>
  );
}
