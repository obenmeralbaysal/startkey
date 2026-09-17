import type { HomepageContent } from "@/content/types";

const SHAPE_ROTATE = "1439f8f3-dfd4-486f-abc6-dc43ee9c6400";
const SHAPE_BOUNCE = "07ae198d-4995-4630-963e-d4c7c0999966";
const IMAGE_ONE = "2a30f2a1-8d47-4632-a946-399c1bc6b0db";
const IMAGE_TWO = "6321d077-34b6-4886-b686-fce32bf714c4";

function ContentImage({
  id,
  className,
  width,
  height,
  style,
  alt = "",
}: {
  id: string;
  className: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  alt?: string;
}) {
  return (
    <picture>
      <source srcSet={`/media/content/${id}.webp`} type="image/webp" />
      <img
        className={className}
        style={style}
        src={`/media/content/${id}.png`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
      />
    </picture>
  );
}

export function AboutBrand({ content }: { content: HomepageContent["about1"] }) {
  return (
    <section className="about-wrap style1 ptb-100 bg-seashell">
      <img
        src="/themes/fela/img/about/shape-3.png"
        alt="Image"
        loading="lazy"
        className="about-shape-three"
      />
      <div className="container">
        <div className="row gx-5 align-items-center">
          <div
            className="col-lg-5"
            data-aos="fade-right"
            data-aos-duration="1200"
            data-aos-delay="200"
          >
            <div className="about-img-wrap">
              <ContentImage
                id={SHAPE_ROTATE}
                className="about-shape-one rotate"
                style={{ marginLeft: "-30px" }}
                width={178}
                height={156}
              />
              <ContentImage
                id={SHAPE_BOUNCE}
                className="about-shape-two bounce"
                width={178}
                height={154}
              />
              <ContentImage id={IMAGE_ONE} className="about-img-one" width={565} height={565} />
              <ContentImage id={IMAGE_TWO} className="about-img-two" width={400} height={400} />
            </div>
          </div>
          <div
            className="col-lg-7"
            data-aos="fade-left"
            data-aos-duration="1200"
            data-aos-delay="200"
          >
            <div className="about-content">
              <div
                className="content-title style1"
                dangerouslySetInnerHTML={{ __html: content.titleHtml }}
              />
              <div dangerouslySetInnerHTML={{ __html: content.bodyHtml }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
