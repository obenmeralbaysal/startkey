import type { HomepageContent } from "@/content/types";
import { defaultLocale, isLocale } from "@/lib/locales";
import { portalLoginHref } from "@/lib/portal";

const WIDGET_COLUMN_CLASSES = [
  "w-full sm:w-1/2 lg:w-1/2 xl:w-1/6",
  "w-full sm:w-1/2 lg:w-1/2 xl:w-1/4 xl:pl-[calc(3rem*var(--sk-scale,1))]",
];

export function Footer({ content }: { content: HomepageContent }) {
  const { footer } = content;
  const locale = isLocale(content.lang) ? content.lang : defaultLocale;

  return (
    <footer className="sk-footer bg-navy relative z-[1] [padding-top:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))]">
      <img
        src="/themes/fela/img/footer-map.png"
        alt="Image"
        className="absolute [top:50%] [left:50%] [transform:translate(-50%,_-50%)] [z-index:-1]"
        width={1920}
        height={630}
      />
      <div className="relative">
        <div className="container">
          <div className="flex flex-wrap [padding-bottom:calc(75px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(25px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(45px_*_var(--sk-scale,_1))]">
            <div className="w-full xl:w-1/3 lg:w-1/2 md:w-1/2 sm:w-1/2 xl:[padding-right:calc(3rem_*_var(--sk-scale,_1))]">
              <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                <a className="block" href={`/${content.lang}`}>
                  <img
                    src="/themes/fela/img/startkeylogowhite.png"
                    alt="startkey-footer-logo"
                    width={192}
                    height={70}
                  />
                </a>
                <p
                  className="[margin:calc(25px_*_var(--sk-scale,_1))_0_calc(16px_*_var(--sk-scale,_1))] [padding-right:calc(10px_*_var(--sk-scale,_1))] [color:rgba(255,_255,_255,_0.8)] max-md:[font-size:calc(14px_*_var(--sk-scale,_1))] max-md:[padding-right:calc(10px_*_var(--sk-scale,_1))] max-md:[margin:calc(12px_*_var(--sk-scale,_1))_0_calc(12px_*_var(--sk-scale,_1))] md:max-lg:[padding-right:calc(40px_*_var(--sk-scale,_1))] md:max-lg:[margin:calc(15px_*_var(--sk-scale,_1))_0_calc(15px_*_var(--sk-scale,_1))] lg:max-xl:[padding-right:calc(25px_*_var(--sk-scale,_1))] xl:[padding-right:calc(30px_*_var(--sk-scale,_1))]"
                  dangerouslySetInnerHTML={{ __html: footer.descriptionHtml }}
                />
                <a
                  href={portalLoginHref(locale)}
                  className="sk-btn sk-btn-brand"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {footer.crmButton.label}
                </a>
              </div>
            </div>

            {footer.widgets.map((widget, index) => (
              <div className={WIDGET_COLUMN_CLASSES[index] ?? WIDGET_COLUMN_CLASSES[0]} key={widget.title}>
                <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                  <h3 className="[font-size:calc(22px_*_var(--sk-scale,_1))] font-semibold [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(15px_*_var(--sk-scale,_1))] relative after:absolute after:[bottom:0] after:[left:0] after:content-[''] after:[width:calc(55px_*_var(--sk-scale,_1))] after:[height:calc(2px_*_var(--sk-scale,_1))] after:bg-white text-white max-md:[font-size:calc(18px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(10px_*_var(--sk-scale,_1))] md:max-lg:[font-size:calc(20px_*_var(--sk-scale,_1))] md:max-lg:[margin-bottom:calc(25px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(12px_*_var(--sk-scale,_1))] lg:max-xl:[font-size:calc(22px_*_var(--sk-scale,_1))] max-xl:[margin-bottom:calc(18px_*_var(--sk-scale,_1))] xl:[margin-top:calc(15px_*_var(--sk-scale,_1))]">{widget.title}</h3>
                  <ul className="sk-footer-menu list-none">
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

            <div className="w-full xl:w-1/4 lg:w-1/2 md:w-1/2 sm:w-1/2">
              <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                <a
                  href={footer.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block" }}
                >
                  <div className="[height:calc(285px_*_var(--sk-scale,_1))] xl:[margin-top:calc(15px_*_var(--sk-scale,_1))]">
                    <iframe
                      src={footer.mapEmbedUrl}
                      style={{ border: 0, pointerEvents: "none", width: "100%", height: "100%" }}
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
        <div className="[border-top:1px_solid_rgba(255,_255,_255,_0.2)] [padding:calc(15px_*_var(--sk-scale,_1))_0]">
          <div className="flex flex-wrap items-center">
            <div className="w-full md:w-1/2">
              <p
                className="copyright text-left [margin:0] max-md:text-center max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))]"
                dangerouslySetInnerHTML={{ __html: footer.copyrightHtml }}
              />
            </div>
            <div className="w-full md:w-1/2">
              <ul className="sk-footer-social max-md:justify-center list-none">
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
