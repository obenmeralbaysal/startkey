import type { HomepageContent } from "@/content/types";
import type { ApiPopularCity } from "@/lib/api";
import { scaled } from "@/lib/scale";

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
        <div className="flex flex-wrap">
          <div className="w-full xl:w-1/2 xl:ml-1/4 lg:w-2/3 lg:ml-1/6">
            <div
              className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>

        <div data-carousel="cards">
          {cities.map((city) => {
            const imageBase = city.image.replace(/\.[^.]+$/, "");
            return (
              <div
                className="after:absolute after:[bottom:0] after:[left:0] after:content-[''] after:w-full after:h-full after:[background:linear-gradient(0deg,_rgba(1,_34,_115,_0.9)_0%,_rgba(1,_34,_115,_0.02)_66%,_rgba(1,_34,_115,_0.04)_67%)]"
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

        <div className="flex flex-wrap justify-center [margin-top:calc(30px_*_var(--sk-scale,_1))]">
          <br />
          <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-navy text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-brand before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-brand after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" style={{ width: scaled(400) }} href={content.button.href}>
            {content.button.label}
          </a>
        </div>
      </div>
    </section>
  );
}
