import type { HomepageContent } from "@/content/types";

const OFFICE_IMAGE = "7d54093e-fefd-40d1-a226-95178007049c";
const HAPPY_OFFICES_IMAGE = "a002ca3e-fe04-46a9-a167-5a1aa7c33f4e";

function ContentImage({ id, alt }: { id: string; alt: string }) {
  return (
    <picture>
      <source srcSet={`/media/content/${id}.webp`} type="image/webp" />
      <img src={`/media/content/${id}.png`} alt={alt} width={500} height={500} loading="lazy" />
    </picture>
  );
}

/** "Open your own office" — text on the left, illustration on the right. */
export function AboutOwnOffice({ content }: { content: HomepageContent["about2"] }) {
  return (
    <section className="relative [padding-top:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] bg-seashell">
      <div className="container">
        <div className="bg-white relative z-[1]">
          <img
            src="/themes/fela/img/about/about-shape-3.png"
            loading="lazy"
            alt="Image"
            className="absolute [bottom:0] [right:0] [z-index:-1] max-lg:[bottom:0] max-lg:[right:0] lg:max-xl:[bottom:0] lg:max-xl:[right:0]"
          />
          <div className="sk-gutter">
            <div className="sk-col-6" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="200">
              <div className="sk-about sk-about-copy" dangerouslySetInnerHTML={{ __html: content.contentHtml }} />
            </div>
            <div className="sk-col-6" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="200">
              <ContentImage id={OFFICE_IMAGE} alt="startkey-ülke-tescil" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Why Startkey Franchise?" — illustration on the left, text on the right. */
export function AboutWhyFranchise({ content }: { content: HomepageContent["about3"] }) {
  return (
    <section className="relative [padding-top:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] bg-seashell">
      <div className="container">
        <div className="bg-white relative z-[1]">
          <img
            src="/themes/fela/img/about/about-shape-3.png"
            loading="lazy"
            alt="Image"
            className="absolute [bottom:0] [right:0] [z-index:-1] max-lg:[bottom:0] max-lg:[right:0] lg:max-xl:[bottom:0] lg:max-xl:[right:0]"
          />
          <div className="sk-gutter">
            <div
              className="sk-col-6 order-2 flex justify-center md:order-1"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-delay="200"
            >
              <ContentImage id={HAPPY_OFFICES_IMAGE} alt="startkey-mutlu-ofisler" />
            </div>
            <div className="sk-col-6 order-1 md:order-2" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="200">
              <div className="sk-about sk-about-copy" dangerouslySetInnerHTML={{ __html: content.contentHtml }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
