import type { HomepageContent } from "@/content/types";
import { absoluteMedia } from "@/lib/media-path";

/**
 * Bootstrap accordion, with the reference website's own ids, class strings and
 * expanded state so its collapse behaviour is wired up identically.
 */
export function Faq({ content }: { content: HomepageContent["faq"] }) {
  const src = absoluteMedia(content.image, "content");
  const imageBase = src.replace(/\.[^.]+$/, "");

  return (
    <section className="relative [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))] bg-seashell">
      <div className="container">
        <div className="sk-gutter">
          <div className="sk-col-6" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="400">
            <div className="max-lg:[margin-bottom:calc(30px_*_var(--sk-scale,_1))]">
              <picture>
                <source srcSet={`${imageBase}.webp`} type="image/webp" />
                <img
                  src={src}
                  alt=""
                  width={530}
                  height={629}
                  loading="lazy"
                />
              </picture>
            </div>
          </div>
          <div className="sk-col-6" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="400">
            <div className="block">
              <div
                className="sk-section-title is-left"
                dangerouslySetInnerHTML={{ __html: content.titleHtml }}
              />
              <div id="accordionExample" className="block">
                {content.items.map((item) => (
                  <div className="sk-faq-item" key={item.collapseId}>
                    <h2 id={item.headingId} className="[margin-bottom:0]">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#${item.collapseId}`}
                        aria-expanded="false"
                        aria-controls={item.collapseId}
                      >
                        {item.question}
                        <span className="sk-faq-icon" aria-hidden="true">
                          <i className="ri-add-line plus" />
                          <i className="ri-subtract-line minus" />
                        </span>
                      </button>
                    </h2>
                    <div
                      id={item.collapseId}
                      className="collapse"
                      aria-labelledby={item.headingId}
                      data-bs-parent="#accordionExample"
                    >
                      <div
                        className="sk-faq-body"
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
