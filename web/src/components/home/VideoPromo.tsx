import type { HomepageContent } from "@/content/types";

/**
 * Promo band with a Fancybox-opened YouTube video. The background image comes from
 * the theme's `.video-bg-1` rule.
 */
export function VideoPromo({ content }: { content: HomepageContent["videoPromo"] }) {
  return (
    <div className="relative [background-image:url(/themes/fela/img/startkey-bg-min.webp)] [background-position:center_center] [background-size:cover] [background-repeat:no-repeat] [background-color:#ddd] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="flex flex-wrap">
          <div className="w-full xl:w-1/2 xl:ml-1/4 lg:w-2/3 lg:ml-1/6">
            <div className="[padding:0_0_calc(100px_*_var(--sk-scale,_1))] relative z-[1] after:absolute after:[top:50%] after:[left:50%] after:[transform:translate(-50%,_-50%)] after:content-[''] after:w-full after:h-full after:[background-color:rgba(255,_255,_255,_0.86)] after:[z-index:-1] after:hidden max-md:[padding:0_0_calc(50px_*_var(--sk-scale,_1))] max-md:[margin-top:calc(30px_*_var(--sk-scale,_1))] md:max-lg:[padding:0_0_calc(70px_*_var(--sk-scale,_1))]">
              <a className="absolute [top:50%] [left:50%] [transform:translate(-50%,_-50%)]" data-fancybox="" href={content.videoUrl}>
                <span className="absolute [height:calc(85px_*_var(--sk-scale,_1))] [width:calc(85px_*_var(--sk-scale,_1))] text-center [line-height:calc(92px_*_var(--sk-scale,_1))] bg-white text-white z-[1] [font-size:calc(28px_*_var(--sk-scale,_1))] [padding-left:calc(5px_*_var(--sk-scale,_1))] block [transform-origin:center_center] rounded-full [margin:0_auto] [top:50%] [left:50%] [transform:translate(-50%,_-50%)] icon">
                  <i className="flaticon-play-1" />
                  <span className="absolute [top:50%] [left:50%] [height:calc(85px_*_var(--sk-scale,_1))] [width:calc(85px_*_var(--sk-scale,_1))] [transform:translateX(-50%)_translateY(-50%)] [transform-origin:center_center] rounded-full [box-shadow:0_0_0_0_#fff] [animation:ripple_3s_infinite] before:absolute before:[top:50%] before:[left:50%] before:[height:calc(85px_*_var(--sk-scale,_1))] before:[width:calc(85px_*_var(--sk-scale,_1))] before:[transform:translateX(-50%)_translateY(-50%)] before:[transform-origin:center_center] before:rounded-full before:[box-shadow:0_0_0_0_#fff] before:[animation:ripple_3s_infinite] after:absolute after:[top:50%] after:[left:50%] after:[height:calc(85px_*_var(--sk-scale,_1))] after:[width:calc(85px_*_var(--sk-scale,_1))] after:[transform:translateX(-50%)_translateY(-50%)] after:[transform-origin:center_center] after:rounded-full after:[box-shadow:0_0_0_0_#fff] after:[animation:ripple_3s_infinite] before:[animation-delay:0.9s] before:content-[''] after:[animation-delay:0.6s] after:content-['']" />
                </span>
              </a>
              <div style={{ textAlign: "center", color: "white" }}>
                <br />
                <span>{content.span}</span>
                <h2 style={{ color: "white" }}>{content.heading}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
