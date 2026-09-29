import { LanguageSelector } from "@/components/layout/LanguageSelector";
import type { HomepageContent, NavItem } from "@/content/types";
import type { Locale } from "@/lib/locales";
import { portalLoginHref } from "@/lib/portal";

const LOGO = "12eb7cb9-f028-4e57-9b14-f99fc92c2045";

function consultantHref(locale: Locale): string {
  if (locale === "en") {
    return "/en/consultant-form";
  }
  if (locale === "de") {
    return "/de/consultant-form";
  }
  return "/tr/danisman-basvuru";
}

function NavEntry({ item }: { item: NavItem }) {
  if (item.children.length === 0) {
    return (
      <li className="nav-item">
        <a
          className="nav-link"
          href={item.href}
          {...(item.target ? { target: item.target, rel: "noopener noreferrer" } : {})}
        >
          {item.label}
        </a>
      </li>
    );
  }

  return (
    <li className="nav-item">
      <a href="#" className="nav-link">
        {/* The space is significant: it is the only place the line can break, which is
            what puts the icon under the label as on the reference website. */}
        {item.label}{" "}
        <i className="ri-add-line" />
      </a>
      <ul className="dropdown-menu">
        {/* The reference opens the list with an empty `li.nav-item` that the browser
            closes immediately; it stays here so the dropdown keeps its exact spacing. */}
        <li className="nav-item" />
        {item.children.map((child) => (
          <li className="nav-item" key={`${child.label}-${child.href}`}>
            <a
              className="nav-link"
              href={child.href}
              {...(child.target ? { target: child.target, rel: "noopener noreferrer" } : {})}
            >
              {child.label}
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function Header({ content, locale }: { content: HomepageContent; locale: Locale }) {
  const { nav, languageSwitcher, headerButtons } = content;

  return (
    <header className="header-wrap">
      <div className="container">
        <nav className="navbar navbar-expand-md navbar-light">
          <a className="navbar-brand" href={`/${locale}`}>
            <picture className="logo-light">
              <source srcSet={`/media/officelogo/${LOGO}.webp`} type="image/webp" />
              <img
                src={`/media/officelogo/${LOGO}.png`}
                alt="OfficeLogo-photo"
                width={192}
                height={78}
              />
            </picture>
          </a>

          <div className="collapse navbar-collapse main-menu-wrap" id="navbarSupportedContent">
            <div className="menu-close d-lg-none">
              {/* `href="javascript:void(0)"` on the reference; React refuses to render
                  `javascript:` URLs, so the anchor is marked as a button instead. */}
              <a role="button" style={{ cursor: "pointer" }}>
                {" "}
                <i className="ri-close-line" />
              </a>
            </div>

            <ul className="navbar-nav ms-auto">
              {nav.map((item) => (
                <NavEntry item={item} key={`${item.label}-${item.href}`} />
              ))}
            </ul>

            <div className="others-options  md-none" style={{ gap: "20px" }}>
              <div className="header-btn">
                <LanguageSelector
                  content={languageSwitcher}
                  currentCode={locale}
                  id="languageMenuDesktop"
                />
              </div>
              <div className="header-btn">
                <a className="btn style2" style={{ padding: "14px 20px 14px" }} href={consultantHref(locale)}>
                  Danışman Başvuru
                </a>
              </div>
              <div className="header-btn">
                <a
                  className="btn style1"
                  style={{ padding: "14px 20px 14px" }}
                  href={headerButtons.franchise.href}
                >
                  {headerButtons.franchise.label}
                </a>
              </div>
              <div className="header-btn">
                <a
                  href={portalLoginHref(locale)}
                  className="btn style2"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "14px 20px 14px", cursor: "pointer" }}
                >
                  {headerButtons.crm.label}
                </a>
              </div>
            </div>
          </div>
        </nav>

        <div className="mobile-cta d-lg-none">
          <a className="btn style2" href={consultantHref(locale)}>
            Danışman Başvuru
          </a>
          <a className="btn style1" href={headerButtons.franchise.href}>
            {headerButtons.franchise.label}
          </a>
        </div>
        <div className="mobile-bar-wrap" style={{ gap: "20px" }}>
          <div className="d-lg-none">
            <LanguageSelector
              content={languageSwitcher}
              currentCode={locale}
              id="languageMenuMobile"
            />
          </div>
          <div className="mobile-menu d-lg-none">
            <a role="button" style={{ cursor: "pointer" }}>
              <i className="ri-menu-line" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
