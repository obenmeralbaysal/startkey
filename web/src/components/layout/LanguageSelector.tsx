"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import type { HomepageContent } from "@/content/types";
import type { Locale } from "@/lib/locales";
import { scaled } from "@/lib/scale";

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
        height: calc(38px * var(--sk-scale, 1)) !important;
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
        font-size: calc(13px * var(--sk-scale, 1));
        display: flex !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        white-space: nowrap !important;
        width: max-content !important;
        height: calc(38px * var(--sk-scale, 1)) !important;
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
        margin-right: calc(8px * var(--sk-scale, 1));
        width: calc(20px * var(--sk-scale, 1));
        height: auto;
        flex-shrink: 0;
    }

    @media only screen and (max-width: 991px) {
        .header-wrap:has(.language-selector-nav) {
            padding-bottom: calc(4px * var(--sk-scale, 1));
        }
        .header-wrap:has(.language-selector-nav) + .content-wrapper {
            margin-top: calc(89px * var(--sk-scale, 1));
        }
    }
`;

const NAV_STYLE: CSSProperties = {
  width: "max-content",
  height: scaled(38),
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
  height: scaled(38),
  margin: 0,
  padding: 0,
};

const LABEL_STYLE: CSSProperties = {
  fontSize: scaled(14),
  fontWeight: 400,
  margin: 0,
  padding: scaled(5),
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || `/${currentCode}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SELECTOR_STYLES }} />
      <nav
        className="lg:[padding:0] relative flex flex-wrap items-center justify-between [padding:var(--bs-navbar-padding-y)_var(--bs-navbar-padding-x)] bg-neutral-100 language-selector-nav"
        style={NAV_STYLE}
      >
        <div className="w-full px-[calc(12px*var(--sk-scale,1))]" style={NAV_STYLE}>
          <div className="relative language-selector">
            <a
              className="flex flex-wrap items-center [padding:calc(16px_*_var(--sk-scale,_1))_calc(100px_*_var(--sk-scale,_1))_calc(16px_*_var(--sk-scale,_1))_calc(15px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] before:[top:calc(2px_*_var(--sk-scale,_1))] before:[right:0] text-white [background-color:transparent] [border:none] [font-size:calc(14px_*_var(--sk-scale,_1))] [padding-right:calc(16px_*_var(--sk-scale,_1))] [transition:0.3s] after:hidden before:absolute before:content-[''] before:[font-family:remixicon] before:font-normal before:[border:0] before:[margin-left:calc(8px_*_var(--sk-scale,_1))] before:[font-size:calc(16px_*_var(--sk-scale,_1))] whitespace-nowrap after:[margin-left:0] after:[vertical-align:.255em] after:content-[''] after:[border-top:.3em_solid_transparent] after:[border-right:0] after:[border-bottom:.3em_solid_transparent] after:[border-left:.3em_solid] before:inline-block before:[margin-right:.255em] before:[vertical-align:0] before:[border-top:.3em_solid_transparent] before:[border-right:.3em_solid] before:[border-bottom:.3em_solid_transparent]"
              href="#"
              role="button"
              id={id}
              aria-expanded={open}
              style={TOGGLE_STYLE}
              onClick={(event) => {
                event.preventDefault();
                setOpen((value) => !value);
              }}
            >
              <img src={`/img/flags/${currentCode}.svg`} alt="flag" className="flag-icon" />
              <h5 style={LABEL_STYLE}>
                {content.current}
              </h5>
            </a>
            <ul className={`${open ? "block" : "hidden"} absolute z-[99] min-w-[calc(180px*var(--sk-scale,1))] bg-white py-[calc(8px*var(--sk-scale,1))] shadow-lg`} aria-labelledby={id}>
              {content.options.map((option) => (
                <li key={option.code}>
                  <a
                    className="flex items-center gap-[calc(8px*var(--sk-scale,1))] px-[calc(12px*var(--sk-scale,1))] py-[calc(6px*var(--sk-scale,1))] text-black hover:text-brand"
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
