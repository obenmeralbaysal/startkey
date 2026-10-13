import type { HomepageContent } from "@/content/types";

/**
 * Promo band with a Fancybox-opened YouTube video. The background image comes from
 * the theme's `.video-bg-1` rule.
 */
export function VideoPromo({ content }: { content: HomepageContent["videoPromo"] }) {
  return (
    <div className="sk-video-wrap relative [background-image:url(/themes/fela/img/startkey-bg-min.webp)] [background-position:center_center] [background-size:cover] [background-repeat:no-repeat] [background-color:#ddd] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="sk-title-row">
          <div className="sk-title-col">
            <div className="sk-video-content">
              <a className="play-now" data-fancybox="" href={content.videoUrl}>
                <i className="flaticon-play-1" />
                <span className="ripple" />
              </a>
              <div className="sk-video-copy">
                <br />
                <span>{content.span}</span>
                <h2>{content.heading}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
