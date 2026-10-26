"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { applicationMenu } from "@/content/application-menu";
import type { HomepageContent, NavItem } from "@/content/types";
import type { Locale } from "@/lib/locales";
import { portalLoginHref } from "@/lib/portal";

const LOGO_SRC = "/media/brand/startkey-logo.png";

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
    transition: 0.4s;
  }
  .sk-header.sticky {
    box-shadow: 0 calc(5px * var(--sk-scale, 1)) calc(15px * var(--sk-scale, 1)) rgba(0, 0, 0, 0.1);
    animation: sk-header-slide 1s ease;
  }
  @keyframes sk-header-slide {
    from { transform: translateY(-100%); }
    to { transform: none; }
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
  @media (max-width: 767px) {
    .sk-logo img {
      width: 130px;
      height: 53px;
    }
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
    transition: color 0.3s ease;
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
  .sk-nav > li:hover > .sk-drop,
  .sk-nav > li:focus-within > .sk-drop { display: block; }
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
  .sk-drawer-close, .sk-drawer-logo, .sk-expand { display: none; }
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
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: #002172;
      color: #fff;
      font-size: calc(20px * var(--sk-scale, 1));
      cursor: pointer;
    }
    /* Reference .main-menu-wrap: full-height panel sliding in from the left. */
    .sk-drawer {
      display: block;
      position: fixed;
      top: 0;
      left: -100%;
      z-index: 1000;
      width: 100%;
      height: 100vh;
      height: 100dvh;
      box-sizing: border-box;
      overflow-y: auto;
      overscroll-behavior: contain;
      background: #fff;
      padding: calc(55px * var(--sk-scale, 1)) calc(20px * var(--sk-scale, 1)) calc(30px * var(--sk-scale, 1));
      visibility: hidden;
      transition: left 0.4s, visibility 0s 0.4s;
    }
    .sk-drawer.is-open {
      left: 0;
      visibility: visible;
      transition: left 0.4s;
    }
    .sk-drawer-close {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: calc(8px * var(--sk-scale, 1));
      right: calc(8px * var(--sk-scale, 1));
      width: calc(44px * var(--sk-scale, 1));
      height: calc(44px * var(--sk-scale, 1));
      padding: 0;
      border: 0;
      background: transparent;
      color: #000;
      font-size: calc(26px * var(--sk-scale, 1));
      cursor: pointer;
    }
    .sk-drawer-logo {
      display: block;
      margin: 0 0 calc(20px * var(--sk-scale, 1));
      text-align: center;
    }
    .sk-drawer-logo img {
      display: inline-block;
      width: calc(150px * var(--sk-scale, 1));
      height: auto;
    }
    .sk-drawer .sk-nav {
      display: block;
      margin: 0;
    }
    .sk-drawer .sk-nav > li {
      position: relative;
      margin: 0;
    }
    .sk-drawer .sk-nav a {
      display: block;
      padding: calc(15px * var(--sk-scale, 1)) 0;
      border-bottom: 1px solid #f3f4f6;
      color: rgba(0, 0, 0, 0.65);
      font-size: calc(16px * var(--sk-scale, 1));
      font-weight: 400;
      line-height: 1.5;
      white-space: normal;
    }
    .sk-drawer .sk-nav > li > a::after { display: none; }
    .sk-drawer .sk-nav a.is-active { color: #ec3323; font-weight: 500; }
    .sk-drawer .sk-nav > li > a .ri-add-line { transform: none; }
    .sk-expand {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      position: absolute;
      top: 0;
      right: 0;
      width: calc(56px * var(--sk-scale, 1));
      height: calc(55px * var(--sk-scale, 1));
      padding: 0;
      border: 0;
      background: transparent;
      color: #000;
      font-size: calc(18px * var(--sk-scale, 1));
      cursor: pointer;
    }
    .sk-expand i { transition: transform 0.4s; }
    .sk-nav > li.menu-open > .sk-expand i { transform: rotate(180deg); }
    /* Reference accordion: slideUp/slideDown("slow"), one submenu open at a time. */
    .sk-drawer .sk-drop {
      display: block;
      position: static;
      min-width: 0;
      max-height: 0;
      overflow: hidden;
      margin: 0;
      padding: 0;
      border: 0;
      box-shadow: none;
      visibility: hidden;
      transition: max-height 0.6s ease, visibility 0s 0.6s;
    }
    .sk-drawer .sk-nav > li.menu-open > .sk-drop {
      max-height: calc(800px * var(--sk-scale, 1));
      transition: max-height 0.6s ease;
    }
    .sk-drawer.is-open .sk-nav > li.menu-open > .sk-drop { visibility: visible; }
    .sk-drawer .sk-drop a {
      margin-left: calc(10px * var(--sk-scale, 1));
      padding: calc(15px * var(--sk-scale, 1)) 0 calc(15px * var(--sk-scale, 1)) calc(10px * var(--sk-scale, 1));
      font-size: calc(14px * var(--sk-scale, 1));
    }
    .sk-drawer .sk-actions {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: calc(12px * var(--sk-scale, 1));
      margin-top: calc(24px * var(--sk-scale, 1));
    }
    .sk-drawer .sk-actions .sk-lang-desktop { display: none; }
    .sk-drawer .sk-actions .sk-btn { justify-content: center; width: 100%; box-sizing: border-box; text-align: center; }
  }
  @media (prefers-reduced-motion: reduce) {
    .sk-drawer, .sk-drawer.is-open, .sk-drawer .sk-drop, .sk-expand i, .sk-apply-trigger .ri-arrow-down-s-line, .sk-header, .sk-header.sticky, .sk-nav > li > a { transition: none; animation: none; }
  }
  @media (min-width: 992px) and (max-width: 1199px) {
    .sk-nav > li { margin: 0 calc(7px * var(--sk-scale, 1)); }
    .sk-nav > li > a { font-size: calc(15px * var(--sk-scale, 1)); }
  }
  .sk-apply-trigger {
    display: inline-flex;
    align-items: center;
    gap: calc(6px * var(--sk-scale, 1));
    padding: calc(8px * var(--sk-scale, 1)) calc(16px * var(--sk-scale, 1));
    border: 0;
    border-radius: calc(5px * var(--sk-scale, 1));
    background: #EC3323;
    color: #fff;
    font-size: calc(17px * var(--sk-scale, 1));
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
    cursor: pointer;
  }
  .sk-apply-trigger:hover,
  .sk-apply-trigger[aria-expanded="true"] {
    background: #C9291B;
    color: #fff;
  }
  .sk-apply-trigger:focus-visible {
    outline: calc(2px * var(--sk-scale, 1)) solid #002172;
    outline-offset: calc(2px * var(--sk-scale, 1));
  }
  .sk-apply-trigger .ri-arrow-down-s-line {
    font-size: calc(18px * var(--sk-scale, 1));
    line-height: 1;
    transition: transform 0.4s;
  }
  .sk-apply.is-open > .sk-apply-trigger .ri-arrow-down-s-line { transform: rotate(180deg); }
  .sk-apply .sk-apply-label,
  .sk-apply .sk-apply-desc { display: block; }
  .sk-apply .sk-apply-label {
    color: inherit;
    font-weight: 600;
    line-height: 1.3;
  }
  .sk-apply .sk-apply-desc {
    margin-top: calc(2px * var(--sk-scale, 1));
    color: #4b5563;
    font-size: calc(13px * var(--sk-scale, 1));
    font-weight: 400;
    line-height: 1.35;
    white-space: normal;
  }
  .sk-apply .sk-drop a:hover .sk-apply-desc { color: #C9291B; }
  @media (min-width: 992px) and (max-width: 1199px) {
    .sk-apply-trigger { font-size: calc(15px * var(--sk-scale, 1)); }
  }
  @media (min-width: 992px) {
    .sk-apply { position: relative; }
    .sk-apply > .sk-drop {
      top: 100%;
      left: 0;
      min-width: calc(240px * var(--sk-scale, 1));
    }
    .sk-nav > li.sk-apply.is-open > .sk-drop { display: block; }
  }
  @media (max-width: 991px) {
    .sk-drawer .sk-apply-trigger {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin: calc(8px * var(--sk-scale, 1)) 0;
      box-sizing: border-box;
      font-size: calc(16px * var(--sk-scale, 1));
      text-align: left;
    }
    .sk-drawer .sk-apply .sk-drop a { white-space: normal; }
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

const MENU_LABELS: Record<Locale, { open: string; close: string }> = {
  tr: { open: "Menüyü aç", close: "Menüyü kapat" },
  en: { open: "Open menu", close: "Close menu" },
  de: { open: "Menü öffnen", close: "Menü schließen" },
};

function isCurrent(href: string, pathname: string): boolean {
  if (!href || href === "#" || /^https?:/.test(href)) return false;
  const path = href.split("?")[0].replace(/\/$/, "");
  return path === pathname.replace(/\/$/, "");
}

function NavEntry({
  item,
  pathname,
  open,
  onToggle,
}: {
  item: NavItem;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  if (item.children.length === 0) {
    return (
      <li>
        <a
          href={item.href}
          className={isCurrent(item.href, pathname) ? "is-active" : undefined}
          aria-current={isCurrent(item.href, pathname) ? "page" : undefined}
          {...(item.target ? { target: item.target, rel: "noopener noreferrer" } : {})}
        >
          {item.label}
        </a>
      </li>
    );
  }

  return (
    <li className={`relative${open ? " menu-open" : ""}`}>
      <button type="button" className="sk-expand" aria-expanded={open} aria-label={item.label} onClick={onToggle}>
        <i className="ri-arrow-down-s-line" />
      </button>
      <a
        href="#"
        className={item.children.some((child) => isCurrent(child.href, pathname)) ? "is-active" : undefined}
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        {item.label}
        <i className="ri-add-line" />
      </a>
      <ul className="sk-drop">
        {item.children.map((child) => (
          <li key={`${child.label}-${child.href}`}>
            <a
              href={child.href}
              className={isCurrent(child.href, pathname) ? "is-active" : undefined}
              aria-current={isCurrent(child.href, pathname) ? "page" : undefined}
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

function ApplicationMenu({
  locale,
  consultantHref,
  franchiseHref,
}: {
  locale: Locale;
  consultantHref: string;
  franchiseHref: string;
}) {
  const menu = applicationMenu[locale];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = [
    { ...menu.consultant, href: consultantHref },
    { ...menu.franchise, href: franchiseHref },
  ];

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, close]);

  return (
    <li ref={rootRef} className={`sk-apply${open ? " is-open menu-open" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        id="sk-apply-trigger"
        className="sk-apply-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="sk-apply-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{menu.label}</span>
        <i className="ri-arrow-down-s-line" aria-hidden="true" />
      </button>
      <ul id="sk-apply-menu" className="sk-drop" role="menu" hidden={!open}>
        {items.map((item) => (
          <li key={item.href} role="none">
            <a href={item.href} role="menuitem">
              <span className="sk-apply-label">{item.label}</span>
              <span className="sk-apply-desc">{item.description}</span>
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Header({ content, locale }: { content: HomepageContent; locale: Locale }) {
  const { nav, languageSwitcher, headerButtons } = content;
  const pathname = usePathname() || `/${locale}`;
  const labels = MENU_LABELS[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(() => {
    const index = nav.findIndex((item) => item.children.some((child) => isCurrent(child.href, pathname)));
    return index >= 0 ? index : null;
  });
  const drawerRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    burgerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY >= 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const items = [...drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 992px)");
    const onDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen, closeMenu]);

  return (
    <header className={stuck ? "sk-header sticky" : "sk-header"}>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      <div className="container">
        <div className="sk-header-row">
          <a className="sk-logo" href={`/${locale}`}>
            <img src={LOGO_SRC} alt="OfficeLogo-photo" width={192} height={77} />
          </a>

          <div className="sk-mobile-tools">
            <LanguageSelector content={languageSwitcher} currentCode={locale} id="languageMenuMobile" />
            <button
              ref={burgerRef}
              type="button"
              className="sk-burger"
              aria-label={labels.open}
              aria-expanded={menuOpen}
              aria-controls="sk-main-menu"
              onClick={() => setMenuOpen(true)}
            >
              <i className="ri-menu-line" />
            </button>
          </div>

          <div
            ref={drawerRef}
            id="sk-main-menu"
            className={`sk-drawer${menuOpen ? " is-open" : ""}`}
            onClick={(event) => {
              const link = (event.target as HTMLElement).closest("a");
              if (link && link.getAttribute("href") !== "#") setMenuOpen(false);
            }}
          >
            <button ref={closeRef} type="button" className="sk-drawer-close" aria-label={labels.close} onClick={closeMenu}>
              <i className="ri-close-line" />
            </button>
            <a className="sk-drawer-logo" href={`/${locale}`}>
              <img src={LOGO_SRC} alt="OfficeLogo-photo" width={150} height={60} />
            </a>
            <ul className="sk-nav">
              {nav.map((item, index) => (
                <NavEntry
                  item={item}
                  pathname={pathname}
                  key={`${item.label}-${item.href}`}
                  open={openIndex === index}
                  onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
                />
              ))}
              <ApplicationMenu
                locale={locale}
                consultantHref={headerButtons.consultant.href}
                franchiseHref={headerButtons.franchise.href}
              />
            </ul>
            <div className="sk-actions">
              <div className="sk-lang-desktop">
                <LanguageSelector content={languageSwitcher} currentCode={locale} id="languageMenuDesktop" />
              </div>
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
