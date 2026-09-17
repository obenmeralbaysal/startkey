import type { HomepageContent } from "@/content/types";

/**
 * Promo band with a Fancybox-opened YouTube video. The background image comes from
 * the theme's `.video-bg-1` rule.
 */
export function VideoPromo({ content }: { content: HomepageContent["videoPromo"] }) {
  return (
    <div className="video-wrap video-bg-1 style2 bg-f ptb-100">
      <div className="container">
        <div className="row">
          <div className="col-xl-6 offset-xl-3 col-lg-8 offset-lg-2">
            <div className="video-content">
              <a className="play-video" data-fancybox="" href={content.videoUrl}>
                <span className="play-now icon">
                  <i className="flaticon-play-1" />
                  <span className="ripple" />
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
