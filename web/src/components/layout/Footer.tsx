import type { HomepageContent } from "@/content/types";
import { defaultLocale, isLocale } from "@/lib/locales";
import { portalLoginHref } from "@/lib/portal";

const WIDGET_COLUMN_CLASSES = [
  "col-xl-2 col-lg-6 col-md-6 col-sm-6",
  "col-xl-3 col-lg-6 col-md-6 col-sm-6 ps-xl-5",
];

export function Footer({ content }: { content: HomepageContent }) {
  const { footer } = content;
  const locale = isLocale(content.lang) ? content.lang : defaultLocale;

  return (
    <footer className="footer-wrap style2 pt-100">
      <img src="/themes/fela/img/footer-map.png" alt="Image" className="footer-shape-one" />
      <div className="footer-top">
        <div className="container">
          <div className="row pb-75">
            <div className="col-xl-4 col-lg-6 col-md-6 col-sm-6 pe-xl-5">
              <div className="footer-widget">
                <a className="footer-logo" href={`/${content.lang}`}>
                  <img src="/themes/fela/img/startkeylogowhite.png" alt="startkey-footer-logo" />
                </a>
                <p
                  className="comp-desc"
                  dangerouslySetInnerHTML={{ __html: footer.descriptionHtml }}
                />
                <a
                  href={portalLoginHref(locale)}
                  className="btn style2"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "14px 20px 14px", cursor: "pointer" }}
                >
                  {footer.crmButton.label}
                </a>
              </div>
            </div>

            {footer.widgets.map((widget, index) => (
              <div className={WIDGET_COLUMN_CLASSES[index] ?? WIDGET_COLUMN_CLASSES[0]} key={widget.title}>
                <div className="footer-widget">
                  <h3 className="footer-widget-title">{widget.title}</h3>
                  <ul className="footer-menu list-style">
                    {widget.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a href={link.href}>
                          <i className="ri-arrow-right-s-line" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
              <div className="footer-widget">
                <a
                  href={footer.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block" }}
                >
                  <div className="comp-map">
                    <iframe
                      src={footer.mapEmbedUrl}
                      style={{ border: 0, pointerEvents: "none" }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Startkey Konum"
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="footer-bottom">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p
                className="copyright-text"
                dangerouslySetInnerHTML={{ __html: footer.copyrightHtml }}
              />
            </div>
            <div className="col-md-6">
              <ul className="social-profile list-style style1">
                {footer.social.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      <i className={item.icon} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
