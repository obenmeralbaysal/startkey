"use client";

import { useState } from "react";

import { LanguageSelector } from "@/components/layout/LanguageSelector";
import type { HomepageContent, NavItem } from "@/content/types";
import type { Locale } from "@/lib/locales";
import { portalLoginHref } from "@/lib/portal";

const LOGO = "12eb7cb9-f028-4e57-9b14-f99fc92c2045";

/**
 * Header measured on startkey.com.tr at 1440px. Lengths below are those reference
 * pixels. `--sk-scale` (0.8 from 768px) is what makes this the 20% smaller copy.
 */
const HEADER_STYLES = `
  .sk-header {
    position: sticky;
    top: 0;
    z-index: 999;
    background: #fff;
  }
  .sk-header-row {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    min-height: calc(111px * var(--sk-scale, 1));
  }
  .sk-logo {
    flex-shrink: 0;
    padding-right: calc(20px * var(--sk-scale, 1));
  }
  .sk-logo img {
    display: block;
    width: calc(192px * var(--sk-scale, 1));
    height: auto;
    max-width: none;
  }
  .sk-nav {
    display: flex;
    align-items: center;
    margin: 0 0 0 auto;
    padding: 0;
    list-style: none;
  }
  .sk-nav > li {
    flex-shrink: 0;
    margin: 0 calc(10px * var(--sk-scale, 1));
  }
  .sk-nav > li > a {
    display: inline-flex;
    align-items: center;
    position: relative;
    padding: calc(30px * var(--sk-scale, 1)) 0;
    color: #000;
    font-size: calc(17px * var(--sk-scale, 1));
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
  }
  .sk-nav > li > a::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: calc(22px * var(--sk-scale, 1));
    width: 0;
    height: calc(2px * var(--sk-scale, 1));
    background: #ec3323;
    transition: width 0.4s;
  }
  .sk-nav > li > a:hover {
    color: #ec3323;
  }
  .sk-nav > li > a:hover::after {
    width: 100%;
  }
  .sk-nav > li > a .ri-add-line {
    display: inline-block;
    margin-left: calc(2px * var(--sk-scale, 1));
    font-size: calc(16px * var(--sk-scale, 1));
    line-height: 1;
    transition: transform 0.4s;
  }
  .sk-nav > li > a:hover .ri-add-line {
    transform: rotate(180deg);
  }
  .sk-nav .sk-drop {
    display: none;
    position: absolute;
    z-index: 99;
    min-width: calc(265px * var(--sk-scale, 1));
    border-left: calc(2px * var(--sk-scale, 1)) solid #ec3323;
    background: #fff;
    padding: calc(10px * var(--sk-scale, 1)) 0;
    box-shadow: 0 0 calc(15px * var(--sk-scale, 1)) rgba(0, 0, 0, 0.1);
  }
  .sk-nav > li:hover > .sk-drop { display: block; }
  .sk-drop a {
    display: block;
    padding: calc(9px * var(--sk-scale, 1)) calc(20px * var(--sk-scale, 1));
    color: #000;
    font-size: calc(16px * var(--sk-scale, 1));
    font-weight: 500;
  }
  .sk-drop a:hover { color: #ec3323; }
  .sk-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: calc(20px * var(--sk-scale, 1));
  }
  .sk-mobile-tools { display: none; }
  .sk-drawer { display: contents; }
  .sk-drawer > .sk-burger { display: none; }
  @media (max-width: 991px) {
    .sk-header-row { min-height: calc(78px * var(--sk-scale, 1)); }
    .sk-nav, .sk-actions { display: none; }
    .sk-mobile-tools {
      display: flex;
      align-items: center;
      margin-left: auto;
      gap: calc(12px * var(--sk-scale, 1));
    }
    .sk-burger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: calc(42px * var(--sk-scale, 1));
      height: calc(42px * var(--sk-scale, 1));
      border-radius: 50%;
      background: #002172;
      color: #fff;
    }
    .sk-drawer {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000;
      overflow-y: auto;
      background: #fff;
      padding: calc(55px * var(--sk-scale, 1)) calc(20px * var(--sk-scale, 1)) calc(30px * var(--sk-scale, 1));
    }
    .sk-drawer.is-open { display: block; }
    .sk-drawer.is-open > .sk-burger { display: inline-flex; }
    .sk-drawer .sk-nav, .sk-drawer .sk-actions { display: flex; }
    .sk-drawer .sk-nav { flex-direction: column; align-items: flex-start; margin: 0; }
    .sk-drawer .sk-actions { flex-direction: column; align-items: flex-start; margin-top: calc(16px * var(--sk-scale, 1)); }
  }
  @media (min-width: 992px) and (max-width: 1199px) {
    .sk-nav > li { margin: 0 calc(7px * var(--sk-scale, 1)); }
    .sk-nav > li > a { font-size: calc(15px * var(--sk-scale, 1)); }
  }
`;

function HeaderButton({
  href,
  tone,
  children,
  external,
}: {
  href: string;
  tone: "brand" | "navy";
  children: string;
  external?: boolean;
}) {
  return (
    <a
      className={`sk-btn sk-btn-${tone}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function NavEntry({ item }: { item: NavItem }) {
  if (item.children.length === 0) {
    return (
      <li>
        <a href={item.href} {...(item.target ? { target: item.target, rel: "noopener noreferrer" } : {})}>
          {item.label}
        </a>
      </li>
    );
  }

  return (
    <li className="relative">
      <a href="#">
        {item.label}
        <i className="ri-add-line" />
      </a>
      <ul className="sk-drop">
        {item.children.map((child) => (
          <li key={`${child.label}-${child.href}`}>
            <a href={child.href} {...(child.target ? { target: child.target, rel: "noopener noreferrer" } : {})}>
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
    <header className="sk-header">
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      <div className="container">
        <div className="sk-header-row">
          <a className="sk-logo" href={`/${locale}`}>
            <picture>
              <source srcSet={`/media/officelogo/${LOGO}.webp`} type="image/webp" />
              <img src={`/media/officelogo/${LOGO}.png`} alt="OfficeLogo-photo" width={192} height={78} />
            </picture>
          </a>

          <div className="sk-mobile-tools">
            <LanguageSelector content={languageSwitcher} currentCode={locale} id="languageMenuMobile" />
            <a className="sk-burger" role="button" onClick={() => setMenuOpen(true)}>
              <i className="ri-menu-line" />
            </a>
          </div>

          <div className={`sk-drawer${menuOpen ? " is-open" : ""}`}>
            <a
              className="sk-burger"
              role="button"
              onClick={() => setMenuOpen(false)}
              style={{ position: "absolute", top: "calc(13px * var(--sk-scale, 1))", right: "calc(16px * var(--sk-scale, 1))" }}
            >
              <i className="ri-close-line" />
            </a>
            <ul className="sk-nav">
              {nav.map((item) => (
                <NavEntry item={item} key={`${item.label}-${item.href}`} />
              ))}
            </ul>
            <div className="sk-actions">
              <LanguageSelector content={languageSwitcher} currentCode={locale} id="languageMenuDesktop" />
              <HeaderButton href={headerButtons.consultant.href} tone="brand">
                {headerButtons.consultant.label}
              </HeaderButton>
              <HeaderButton href={headerButtons.franchise.href} tone="navy">
                {headerButtons.franchise.label}
              </HeaderButton>
              <HeaderButton href={portalLoginHref(locale)} tone="brand" external>
                {headerButtons.crm.label}
              </HeaderButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
