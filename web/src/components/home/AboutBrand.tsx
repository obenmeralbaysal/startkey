import type { HomepageContent } from "@/content/types";
import { scaled } from "@/lib/scale";

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
    <section className="relative [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))] bg-seashell">
      <img
        src="/themes/fela/img/about/shape-3.png"
        alt="Image"
        loading="lazy"
        className="absolute [bottom:0] [right:0] [z-index:-1] max-lg:[bottom:0] max-lg:[right:0] lg:max-xl:[bottom:0] lg:max-xl:[right:0]"
      />
      <div className="container">
        <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))] items-center">
          <div
            className="w-full lg:w-5/12"
            data-aos="fade-right"
            data-aos-duration="1200"
            data-aos-delay="200"
          >
            <div className="relative z-[1] [padding-bottom:calc(150px_*_var(--sk-scale,_1))] [height:calc(640px_*_var(--sk-scale,_1))] before:absolute before:[top:0] before:[left:calc(50%_-_calc(10px_*_var(--sk-scale,_1)))] before:[transform:trasnlateX(-50%)] before:content-[''] before:[width:calc(20px_*_var(--sk-scale,_1))] before:h-full before:bg-white [margin:0] max-sm:[padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[height:calc(340px_*_var(--sk-scale,_1))] md:max-lg:[margin-bottom:calc(30px_*_var(--sk-scale,_1))] md:max-lg:[height:calc(550px_*_var(--sk-scale,_1))] max-lg:[margin-bottom:calc(30px_*_var(--sk-scale,_1))]">
              <ContentImage
                id={SHAPE_ROTATE}
                className="absolute [bottom:0] [left:calc(50px_*_var(--sk-scale,_1))] z-[1] max-sm:[left:calc(10px_*_var(--sk-scale,_1))] max-sm:[max-width:calc(95px_*_var(--sk-scale,_1))] sm:max-md:[left:calc(50px_*_var(--sk-scale,_1))] sm:max-md:[max-width:calc(145px_*_var(--sk-scale,_1))] md:max-lg:[left:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[max-width:calc(145px_*_var(--sk-scale,_1))] lg:max-xl:[left:calc(20px_*_var(--sk-scale,_1))] lg:max-xl:[max-width:calc(145px_*_var(--sk-scale,_1))] xl:max-2xl:[left:calc(20px_*_var(--sk-scale,_1))] xl:max-2xl:[max-width:calc(145px_*_var(--sk-scale,_1))] [animation:rotation_20s_infinite_linear]"
                style={{ marginLeft: scaled(-30) }}
                width={178}
                height={156}
              />
              <ContentImage
                id={SHAPE_BOUNCE}
                className="absolute [top:calc(60px_*_var(--sk-scale,_1))] [right:calc(50px_*_var(--sk-scale,_1))] [z-index:-1] max-sm:[max-width:calc(80px_*_var(--sk-scale,_1))] max-sm:[right:0px] sm:max-md:[max-width:calc(140px_*_var(--sk-scale,_1))] md:max-lg:[max-width:calc(140px_*_var(--sk-scale,_1))] lg:max-xl:[max-width:calc(140px_*_var(--sk-scale,_1))] [animation:float_1500ms_infinite_ease-in-out]"
                width={178}
                height={154}
              />
              <ContentImage id={IMAGE_ONE} className="[margin-right:auto] [width:calc(100%_-_calc(120px_*_var(--sk-scale,_1)))] [border-radius:calc(5px_*_var(--sk-scale,_1))] max-sm:[width:calc(100%_-_calc(50px_*_var(--sk-scale,_1)))] sm:max-md:[width:calc(100%_-_calc(150px_*_var(--sk-scale,_1)))] md:max-lg:[width:calc(100%_-_calc(200px_*_var(--sk-scale,_1)))]" width={565} height={565} />
              <ContentImage id={IMAGE_TWO} className="absolute [bottom:0] [right:0] [border-radius:calc(5px_*_var(--sk-scale,_1))] max-sm:[max-width:calc(220px_*_var(--sk-scale,_1))] sm:max-md:[max-width:calc(320px_*_var(--sk-scale,_1))] md:max-lg:[max-width:calc(400px_*_var(--sk-scale,_1))] lg:max-xl:[max-width:calc(315px_*_var(--sk-scale,_1))]" width={400} height={400} />
            </div>
          </div>
          <div
            className="w-full lg:w-7/12"
            data-aos="fade-left"
            data-aos-duration="1200"
            data-aos-delay="200"
          >
            <div className="[padding-right:calc(40px_*_var(--sk-scale,_1))] max-md:[padding:0_calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))] md:max-lg:[padding:0_calc(40px_*_var(--sk-scale,_1))_calc(40px_*_var(--sk-scale,_1))]">
              <div
                className="relative [margin-bottom:calc(30px_*_var(--sk-scale,_1))] text-center [margin:calc(35px_*_var(--sk-scale,_1))_0_0] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))] [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))]"
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
