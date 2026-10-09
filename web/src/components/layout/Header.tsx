"use client";

import { useState } from "react";

import { LanguageSelector } from "@/components/layout/LanguageSelector";
import type { HomepageContent, NavItem } from "@/content/types";
import type { Locale } from "@/lib/locales";
import { portalLoginHref } from "@/lib/portal";
import { scaled } from "@/lib/scale";

const LOGO = "12eb7cb9-f028-4e57-9b14-f99fc92c2045";

/**
 * The header carries one more button than the reference, so on desktop it gets a wider
 * row and tighter spacing: in all three languages no menu label, "+" or button may
 * wrap, and the logo must not be squeezed.
 */
const HEADER_FIT_STYLES = `
    @media only screen and (min-width: 992px) {
        .header-wrap .container {
            max-width: calc(1600px * var(--sk-scale, 1));
        }
        .header-wrap .navbar .navbar-brand {
            flex-shrink: 0;
            padding-right: calc(10px * var(--sk-scale, 1));
        }
        .header-wrap .navbar .navbar-nav {
            margin-right: calc(15px * var(--sk-scale, 1));
        }
        .header-wrap .navbar .navbar-nav .nav-item {
            margin: 0 calc(5px * var(--sk-scale, 1));
        }
        .header-wrap .navbar .navbar-nav > .nav-item > a,
        .header-wrap .others-options .btn {
            white-space: nowrap;
        }
        .header-wrap .others-options {
            gap: calc(12px * var(--sk-scale, 1));
        }
        .header-wrap .others-options .btn {
            padding: calc(14px * var(--sk-scale, 1));
        }
    }

    @media only screen and (min-width: 992px) and (max-width: 1199px) {
        .header-wrap .navbar .navbar-nav > .nav-item > a {
            font-size: calc(14px * var(--sk-scale, 1));
        }
        .header-wrap .others-options {
            gap: calc(8px * var(--sk-scale, 1));
        }
        .header-wrap .others-options .btn {
            padding: calc(14px * var(--sk-scale, 1)) calc(10px * var(--sk-scale, 1));
            font-size: calc(14.5px * var(--sk-scale, 1));
        }
    }

    @media only screen and (min-width: 1400px) {
        .header-wrap .navbar .navbar-nav .nav-item {
            margin: 0 calc(10px * var(--sk-scale, 1));
        }
    }
`;

function NavEntry({ item }: { item: NavItem }) {
  if (item.children.length === 0) {
    return (
      <li className="relative list-none">
        <a
          className="relative block font-medium text-black"
          href={item.href}
          {...(item.target ? { target: item.target, rel: "noopener noreferrer" } : {})}
        >
          {item.label}
        </a>
      </li>
    );
  }

  return (
    <li className="group relative list-none">
      <a href="#" className="relative block font-medium text-black">
        {/* The space is the gap before the icon; HEADER_FIT_STYLES keeps both on one line. */}
        {item.label}{" "}
        <i className="ri-add-line" />
      </a>
      <ul className="absolute z-[99] hidden min-w-[calc(265px*var(--sk-scale,1))] border-l-2 border-brand bg-white py-[calc(10px*var(--sk-scale,1))] shadow-lg group-hover:block">
        {/* The reference opens the list with an empty `li.nav-item` that the browser
            closes immediately; it stays here so the dropdown keeps its exact spacing. */}
        <li className="relative list-none" />
        {item.children.map((child) => (
          <li className="relative list-none" key={`${child.label}-${child.href}`}>
            <a
              className="relative block font-medium text-black"
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_FIT_STYLES }} />
      <header className="fixed top-0 left-0 z-[999] w-full bg-white">
        <div className="container lg:max-w-[calc(1600px*var(--sk-scale,1))]">
          <nav className="lg:[padding:0] relative flex flex-wrap items-center justify-between [padding:var(--bs-navbar-padding-y)_var(--bs-navbar-padding-x)]">
            <a className="lg:[padding:0_calc(20px_*_var(--sk-scale,_1))_0_0] [padding-top:var(--bs-navbar-brand-padding-y)] [padding-bottom:var(--bs-navbar-brand-padding-y)] [margin-right:var(--bs-navbar-brand-margin-end)] [font-size:var(--bs-navbar-brand-font-size)] [color:var(--bs-navbar-brand-color)] no-underline whitespace-nowrap focus:[color:var(--bs-navbar-brand-hover-color)] hover:[color:var(--bs-navbar-brand-hover-color)]" href={`/${locale}`}>
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

            <div className={`max-lg:items-start [flex-basis:auto] grow items-center sm:flex sm:[flex-basis:auto] md:flex md:[flex-basis:auto] lg:flex lg:[flex-basis:auto] xl:flex xl:[flex-basis:auto] 2xl:flex 2xl:[flex-basis:auto] flex max-lg:w-full max-lg:fixed max-lg:bg-white max-lg:z-[999] max-lg:[top:0] max-lg:[height:100vh] max-lg:[transition:0.4s] max-lg:[padding:calc(55px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(30px_*_var(--sk-scale,_1))] max-lg:[overflow-y:auto] ${menuOpen ? "max-lg:left-0" : "max-lg:left-[-100%]"}`} id="navbarSupportedContent">
              <div className="max-lg:absolute max-lg:[top:calc(13px_*_var(--sk-scale,_1))] max-lg:[right:calc(16px_*_var(--sk-scale,_1))] lg:hidden">
                <a role="button" style={{ cursor: "pointer" }} onClick={() => setMenuOpen(false)}>
                  {" "}
                  <i className="ri-close-line" />
                </a>
              </div>

              <ul className="max-lg:w-full max-lg:flex-col lg:[margin-right:calc(30px_*_var(--sk-scale,_1))] flex flex-row [padding-left:0] [margin-bottom:0] list-none sm:flex-row md:flex-row lg:flex-row xl:flex-row 2xl:flex-row ml-auto">
                {nav.map((item) => (
                  <NavEntry item={item} key={`${item.label}-${item.href}`} />
                ))}
              </ul>

              <div className="lg:flex lg:items-center max-lg:hidden">
                <div className="shrink-0">
                  <LanguageSelector
                    content={languageSwitcher}
                    currentCode={locale}
                    id="languageMenuDesktop"
                  />
                </div>
                <div className="shrink-0">
                  <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" href={headerButtons.consultant.href}>
                    {headerButtons.consultant.label}
                  </a>
                </div>
                <div className="shrink-0">
                  <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-navy text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-brand before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-brand after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" href={headerButtons.franchise.href}>
                    {headerButtons.franchise.label}
                  </a>
                </div>
                <div className="shrink-0">
                  <a
                    href={portalLoginHref(locale)}
                    className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ cursor: "pointer" }}
                  >
                    {headerButtons.crm.label}
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <div className="mobile-cta lg:hidden">
            <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" href={headerButtons.consultant.href}>
              {headerButtons.consultant.label}
            </a>
            <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-navy text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-brand before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-brand after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" href={headerButtons.franchise.href}>
              {headerButtons.franchise.label}
            </a>
          </div>
          <div className="max-lg:flex max-lg:flex-wrap max-lg:justify-end max-lg:items-center max-lg:text-right max-lg:relative max-lg:[top:calc(4px_*_var(--sk-scale,_1))]" style={{ gap: scaled(20) }}>
            <div className="lg:hidden">
              <LanguageSelector
                content={languageSwitcher}
                currentCode={locale}
                id="languageMenuMobile"
              />
            </div>
            <div className="max-lg:text-right max-lg:inline-block max-lg:relative max-lg:[top:-1px] lg:hidden">
              <a role="button" style={{ cursor: "pointer" }} onClick={() => setMenuOpen(true)}>
                <i className="ri-menu-line" />
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
