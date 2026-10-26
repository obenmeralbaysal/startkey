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
    <section className="relative z-[1] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="sk-title-row">
          <div className="sk-title-col">
            <div
              className="sk-section-title is-center"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>

        <div className="sk-city-row" data-carousel="cards">
          {cities.map((city) => {
            const remote = city.image.startsWith("/") || city.image.startsWith("http");
            const imageBase = city.image.replace(/\.[^.]+$/, "");
            return (
              <div className="city-card style2" key={city.cityCode} data-city-id={city.cityCode} data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                {remote ? (
                  <img src={city.image} alt="MicroSiteContent-photo" width={418} height={280} loading="lazy" />
                ) : (
                  <picture>
                    <source srcSet={`/media/micrositecontent/${imageBase}.webp`} type="image/webp" />
                    <img
                      src={`/media/micrositecontent/${city.image}`}
                      alt="MicroSiteContent-photo"
                      width={418}
                    />
                  </picture>
                )}
                <h3>
                  <a href={city.urlPath}>{city.name}</a>
                </h3>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center [margin-top:calc(30px_*_var(--sk-scale,_1))]">
          <br />
          <a className="sk-btn sk-btn-navy" href={content.button.href}>
            {content.button.label}
          </a>
        </div>
      </div>
    </section>
  );
}
