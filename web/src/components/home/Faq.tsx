import type { HomepageContent } from "@/content/types";

/**
 * Bootstrap accordion, with the reference website's own ids, class strings and
 * expanded state so its collapse behaviour is wired up identically.
 */
export function Faq({ content }: { content: HomepageContent["faq"] }) {
  const imageBase = content.image.replace(/\.[^.]+$/, "");

  return (
    <section className="relative [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))] bg-seashell">
      <div className="container">
        <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))] items-center">
          <div
            className="w-full lg:w-1/2"
            data-aos="fade-right"
            data-aos-duration="1200"
            data-aos-delay="400"
          >
            <div className="max-lg:[margin-bottom:calc(30px_*_var(--sk-scale,_1))]">
              <picture>
                <source srcSet={`/media/content/${imageBase}.webp`} type="image/webp" />
                <img
                  src={`/media/content/${content.image}`}
                  alt=""
                  width={530}
                  height={629}
                  loading="lazy"
                />
              </picture>
            </div>
          </div>
          <div
            className="w-full lg:w-1/2"
            data-aos="fade-left"
            data-aos-duration="1200"
            data-aos-delay="400"
          >
            <div className="block">
              <div
                className="relative [margin-bottom:calc(30px_*_var(--sk-scale,_1))] text-center [margin:calc(35px_*_var(--sk-scale,_1))_0_0] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))] [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))]"
                dangerouslySetInnerHTML={{ __html: content.titleHtml }}
              />
              <div id="accordionExample" className="block">
                {content.items.map((item) => (
                  <div className="[background-color:var(--bs-accordion-bg)] [box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.07)] [border:var(--bs-accordion-border-width)_solid_var(--bs-accordion-border-color)] [margin:0_0_calc(15px_*_var(--sk-scale,_1))] [background-color:transparent] last:[margin-bottom:0] [color:var(--bs-accordion-color)] [border-top-left-radius:var(--bs-accordion-border-radius)] [border-top-right-radius:var(--bs-accordion-border-radius)] [border-top:0] [border-bottom-right-radius:var(--bs-accordion-border-radius)] [border-bottom-left-radius:var(--bs-accordion-border-radius)] [border-right:0] [border-left:0] [border-radius:0] first:[border-top:0] last:[border-bottom:0]" key={item.collapseId}>
                    <h2 id={item.headingId} className="[margin-bottom:0]">
                      <button
                        className={item.buttonClass}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#${item.collapseId}`}
                        aria-expanded={item.expanded}
                        aria-controls={item.collapseId}
                      >
                        {item.question}
                        <br />
                      </button>
                    </h2>
                    <div
                      id={item.collapseId}
                      className={item.collapseClass}
                      aria-labelledby={item.headingId}
                      data-bs-parent="#accordionExample"
                    >
                      <div
                        className="[border:1px_solid_rgba(255,_255,_255,_0.8)] [padding:var(--bs-accordion-body-padding-y)_var(--bs-accordion-body-padding-x)] [border-top:none]"
                        dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
