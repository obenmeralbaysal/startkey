import type { HomepageContent } from "@/content/types";

/**
 * Bootstrap accordion, with the reference website's own ids, class strings and
 * expanded state so its collapse behaviour is wired up identically.
 */
export function Faq({ content }: { content: HomepageContent["faq"] }) {
  const imageBase = content.image.replace(/\.[^.]+$/, "");

  return (
    <section className="faq-wrap style1 ptb-100 bg-seashell">
      <div className="container">
        <div className="row gx-5 align-items-center">
          <div
            className="col-lg-6"
            data-aos="fade-right"
            data-aos-duration="1200"
            data-aos-delay="400"
          >
            <div className="faq-img-wrap">
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
            className="col-lg-6"
            data-aos="fade-left"
            data-aos-duration="1200"
            data-aos-delay="400"
          >
            <div className="faq-content">
              <div
                className="content-title style1"
                dangerouslySetInnerHTML={{ __html: content.titleHtml }}
              />
              <div id="accordionExample" className="accordion">
                {content.items.map((item) => (
                  <div className="accordion-item" key={item.collapseId}>
                    <h2 id={item.headingId} className="accordion-header">
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
                        className="accordion-body"
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
