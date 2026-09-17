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
    <section className="about-wrap style2 pt-100 bg-seashell">
      <div className="container">
        <div className="about-box">
          <img
            src="/themes/fela/img/about/about-shape-3.png"
            loading="lazy"
            alt="Image"
            className="about-shape-three"
          />
          <div className="row gx-5 align-items-center">
            <div
              className="col-lg-6"
              data-aos="fade-left"
              data-aos-duration="1200"
              data-aos-delay="200"
            >
              <div
                className="about-content"
                style={{ padding: "20px" }}
                dangerouslySetInnerHTML={{ __html: content.contentHtml }}
              />
            </div>
            <div
              className="col-lg-6"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-delay="200"
            >
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
    <section className="about-wrap style2 pt-100 bg-seashell">
      <div className="container">
        <div className="about-box">
          <img
            src="/themes/fela/img/about/about-shape-3.png"
            loading="lazy"
            alt="Image"
            className="about-shape-three"
          />
          {/* The reference nests a second identical row here, which narrows the
              columns by the gutter width once they stack below the md breakpoint. */}
          <div className="row gx-5 align-items-center">
            <div className="row gx-5 align-items-center">
              <div
                className="col-lg-6 order-2 order-md-1"
                style={{ justifyContent: "center", display: "flex" }}
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-delay="200"
              >
                <ContentImage id={HAPPY_OFFICES_IMAGE} alt="startkey-mutlu-ofisler" />
              </div>
              <div
                className="col-lg-6 order-1 order-md-2"
                data-aos="fade-left"
                data-aos-duration="1200"
                data-aos-delay="200"
              >
                <div
                  className="about-content"
                  style={{ padding: "20px" }}
                  dangerouslySetInnerHTML={{ __html: content.contentHtml }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
