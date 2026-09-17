import type { HomepageContent } from "@/content/types";

export function HowItWorks({ content }: { content: HomepageContent["howItWorks"] }) {
  return (
    <section className="hw-wrap bg-seashell pt-100 pb-75">
      <div className="container">
        <div className="row">
          <div className="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2">
            <div
              className="section-title style2 text-center mb-40"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>
        <div className="row justify-content-center">
          {content.cards.map((card) => {
            const imageBase = card.image.replace(/\.[^.]+$/, "");
            return (
              <div
                className="col-xl-4 col-lg-4 col-md-6 col-sm-6"
                key={card.image}
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-delay="200"
              >
                <div className="hw-card">
                  <div className="hw-img">
                    <img
                      src="/themes/fela/img/how-it-works/hw-shape-1.png"
                      alt="Image"
                      loading="lazy"
                      className="hw-shape-one"
                    />
                    <picture>
                      <source
                        srcSet={`/media/micrositecontent/${imageBase}.webp`}
                        type="image/webp"
                      />
                      <img
                        src={`/media/micrositecontent/${card.image}`}
                        alt="MicroSiteContent-photo"
                        width={260}
                        loading="lazy"
                      />
                    </picture>
                    <span>{card.step}</span>
                  </div>
                  <div className="hw-info" dangerouslySetInnerHTML={{ __html: card.infoHtml }} />
                </div>
              </div>
            );
          })}
          <a className="btn style2 homepage-expended-btn" href={content.button.href}>
            {content.button.label}
          </a>
        </div>
      </div>
    </section>
  );
}
