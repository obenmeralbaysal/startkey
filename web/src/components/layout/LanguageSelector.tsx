"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";

import type { HomepageContent } from "@/content/types";
import type { Locale } from "@/lib/locales";

/**
 * Layout rules that must win on first paint. The theme header is a nested flex
 * row; Bootstrap's `.navbar { width:100%; flex-wrap:wrap }` and the caret
 * `::after` arrive late (deferred CSS). Until then — and until the sticky
 * class triggers a reflow on scroll — "Türkçe" is squeezed onto two lines.
 * Inline styles on the nodes below cover the first HTML paint; these rules
 * keep winning after Bootstrap is promoted.
 */
const SELECTOR_STYLES = `
    .mobile-bar-wrap:has(.language-selector-nav),
    .mobile-bar-wrap:has(.language-selector-nav) > div:has(.language-selector-nav) {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        flex-wrap: nowrap;
        width: auto;
        /* Same offset as .mobile-menu so the label sits on the hamburger's midline. */
        position: relative;
        top: -1px;
    }

    .language-selector-nav,
    .language-selector-nav .container-fluid,
    .language-selector-nav .language-selector {
        width: max-content !important;
        max-width: none !important;
        height: 38px !important;
        min-height: 0 !important;
        flex: 0 0 auto !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
    }

    .language-selector a {
        color: #535353;
        transition: color 0.3s ease-in-out;
        text-transform: none;
        font-weight: 500;
        font-size: 13px;
        display: flex !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        white-space: nowrap !important;
        width: max-content !important;
        height: 38px !important;
        flex-shrink: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }

        .language-selector a:hover {
            color: #000000;
        }

    .language-selector a.dropdown-toggle::after {
        flex-shrink: 0;
        margin-left: 0.255em;
    }

    .language-selector h5 {
        white-space: nowrap !important;
        display: inline-block !important;
        flex: 0 0 auto !important;
        line-height: 1 !important;
        width: max-content !important;
        max-width: none !important;
        margin: 0 !important;
    }

    .language-selector img.flag-icon {
        margin-right: 8px;
        width: 20px;
        height: auto;
        flex-shrink: 0;
    }

    @media only screen and (max-width: 991px) {
        .header-wrap:has(.language-selector-nav) {
            padding-bottom: 4px;
        }
        .header-wrap:has(.language-selector-nav) + .content-wrapper {
            margin-top: 89px;
        }
    }
`;

const NAV_STYLE: CSSProperties = {
  width: "max-content",
  height: 38,
  flexWrap: "nowrap",
  flexShrink: 0,
  alignItems: "center",
  padding: 0,
  margin: 0,
  background: "transparent",
};

const TOGGLE_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  whiteSpace: "nowrap",
  width: "max-content",
  height: 38,
  margin: 0,
  padding: 0,
};

const LABEL_STYLE: CSSProperties = {
  fontSize: "14px",
  fontWeight: 400,
  margin: 0,
  padding: "5px",
  whiteSpace: "nowrap",
  display: "inline-block",
  flexShrink: 0,
  width: "max-content",
  lineHeight: 1,
};

/**
 * Language dropdown of the header. Options keep the reference culture-switch path
 * and pass the current public path so inner Kurumsal pages land on their equivalent
 * URL in the chosen language.
 */
export function LanguageSelector({
  content,
  currentCode,
  id,
}: {
  content: HomepageContent["languageSwitcher"];
  currentCode: Locale;
  id: string;
}) {
  const pathname = usePathname() || `/${currentCode}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SELECTOR_STYLES }} />
      <nav
        className="navbar navbar-expand-lg navbar-light bg-light language-selector-nav"
        style={NAV_STYLE}
      >
        <div className="container-fluid" style={NAV_STYLE}>
          <div className="dropdown language-selector">
            <a
              className="dropdown-toggle d-flex align-items-center"
              href="#"
              role="button"
              id={id}
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={TOGGLE_STYLE}
            >
              <img src={`/img/flags/${currentCode}.svg`} alt="flag" className="flag-icon" />
              <h5 style={LABEL_STYLE}>
                {content.current}
              </h5>
            </a>
            <ul className="dropdown-menu" aria-labelledby={id}>
              {content.options.map((option) => (
                <li key={option.code}>
                  <a
                    className="dropdown-item d-flex align-items-center"
                    style={{ justifyContent: "space-evenly" }}
                    href={`/${currentCode}/Settings/ChangeCulture?langCode=${option.code}&returnPath=${encodeURIComponent(pathname)}`}
                  >
                    <img src={`/img/flags/${option.code}.svg`} alt="flag" width={25} />
                    {option.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
