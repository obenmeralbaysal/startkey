"use client";

import { usePathname } from "next/navigation";

import type { HomepageContent } from "@/content/types";
import type { Locale } from "@/lib/locales";

/** Inline stylesheet the reference website ships with the selector, copied verbatim. */
const SELECTOR_STYLES = `
    .language-selector a {
        color: #535353;
        transition: color 0.3s ease-in-out;
        text-transform: none;
        font-weight: 500;
        font-size: 13px;
        display: flex;
        align-items: center;
    }

        .language-selector a:hover {
            color: #000000; 
        }

    .language-selector img.flag-icon {
        margin-right: 8px;
        width: 20px;
        height: auto;
    }
`;

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
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <div className="dropdown language-selector">
            <a
              className="dropdown-toggle d-flex align-items-center"
              href="#"
              role="button"
              id={id}
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img src={`/img/flags/${currentCode}.svg`} alt="flag" className="flag-icon" />
              <h5
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  marginBottom: 0,
                  padding: "5px",
                }}
              >
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
