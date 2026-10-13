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
  alt = "",
}: {
  id: string;
  className: string;
  width: number;
  height: number;
  alt?: string;
}) {
  return (
    <picture>
      <source srcSet={`/media/content/${id}.webp`} type="image/webp" />
      <img
        className={className}
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
    <section className="relative [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))] bg-seashell">
      <img
        src="/themes/fela/img/about/shape-3.png"
        alt="Image"
        loading="lazy"
        className="absolute bottom-[calc(50px*var(--sk-scale,1))] right-[calc(50px*var(--sk-scale,1))] max-xl:bottom-0 max-xl:right-0"
      />
      <div className="container">
        <div className="sk-gutter">
          <div className="sk-col-5" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="200">
            <div className="sk-about-frame">
              <ContentImage id={SHAPE_ROTATE} className="sk-shape-spin" width={178} height={156} />
              <ContentImage id={SHAPE_BOUNCE} className="sk-shape-float" width={178} height={154} />
              <ContentImage id={IMAGE_ONE} className="sk-photo-main" width={565} height={565} />
              <ContentImage id={IMAGE_TWO} className="sk-photo-overlap" width={400} height={400} />
            </div>
          </div>
          <div className="sk-col-7" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="200">
            <div className="sk-about">
              <div
                className="sk-about-title"
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
