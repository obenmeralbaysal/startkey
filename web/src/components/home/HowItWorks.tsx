import type { HomepageContent } from "@/content/types";
import { absoluteMedia } from "@/lib/media-path";

export function HowItWorks({ content }: { content: HomepageContent["howItWorks"] }) {
  return (
    <section className="hw-wrap bg-seashell [padding-top:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] [padding-bottom:calc(75px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(25px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(45px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="sk-title-row">
          <div className="sk-title-col">
            <div
              className="sk-section-title is-center"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          {content.cards.map((card) => {
            const src = absoluteMedia(card.image, "micrositecontent");
            const imageBase = src.replace(/\.[^.]+$/, "");
            return (
              <div
                className="w-full xl:w-1/3 lg:w-1/3 md:w-1/2 sm:w-1/2"
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
                        srcSet={`${imageBase}.webp`}
                        type="image/webp"
                      />
                      <img
                        src={src}
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
          <a className="sk-btn sk-btn-brand" href={content.button.href}>
            {content.button.label}
          </a>
        </div>
      </div>
    </section>
  );
}
