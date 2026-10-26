"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { applicationMenu } from "@/content/application-menu";
import type { HomepageContent, NavItem } from "@/content/types";
import { buildHeaderNav, drawerHeaderNav } from "@/lib/header-nav";
import type { Locale } from "@/lib/locales";
import { portalLoginHref } from "@/lib/portal";

const LOGO_SRC = "/media/brand/startkey-logo.png";

const PORTAL_ENTRY: Record<Locale, string> = {
  tr: "Portal girişi",
  en: "Portal",
  de: "Portal",
};

/**
 * Header from the improvements mockup: 72px white bar, centred nav, one red
 * Başvuru menu. Lengths are the mockup pixels (not --sk-scale). The phone
 * layout starts at the existing 991px menu breakpoint so the six items still
 * fit; the mockup's 600px switch is too narrow for this nav.
 */
const HEADER_STYLES = `
  .sk-header {
    position: sticky;
    top: 0;
    z-index: 999;
    box-sizing: border-box;
    height: 72px;
    background: #fff;
    border-bottom: 1px solid #E3E6EC;
  }
  .sk-header.sticky { box-shadow: 0 2px 8px rgba(0, 33, 114, 0.08); }
  .sk-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  .sk-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .sk-logo { display: flex; flex-shrink: 0; }
  .sk-logo img { display: block; height: 40px; width: auto; max-width: 148px; }
  .sk-burger, .sk-drawer, .sk-overlay { display: none; }
  .sk-nav-desktop {
    display: flex;
    align-items: stretch;
    gap: 22px;
    height: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sk-nav-desktop > li { position: relative; flex-shrink: 0; display: flex; align-items: center; }
  .sk-nav-desktop > li > a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 100%;
    color: #1B2333;
    font-family: "Nunito Sans", sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
  }
  .sk-nav-desktop > li > a:hover,
  .sk-nav-desktop > li > a.is-active { color: #EC3323; }
  .sk-caret { display: inline-block; font-size: 11px; line-height: 1; }
  .sk-nav-desktop .sk-drop {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1002;
    min-width: 220px;
    margin: 0;
    padding: 8px;
    list-style: none;
    background: #fff;
    border: 1px solid #E3E6EC;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 33, 114, 0.08);
  }
  .sk-nav-desktop > li:hover > .sk-drop,
  .sk-nav-desktop > li:focus-within > .sk-drop { display: block; }
  .sk-nav-desktop .sk-drop a {
    display: block;
    padding: 8px 12px;
    border-radius: 8px;
    color: #1B2333;
    font-family: "Nunito Sans", sans-serif;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }
  .sk-nav-desktop .sk-drop a:hover,
  .sk-nav-desktop .sk-drop a.is-active { color: #EC3323; background: #F6F7FA; }
  .sk-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .sk-lang { position: relative; }
  .sk-lang-code {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #5B6475;
    font-family: "Nunito Sans", sans-serif;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }
  .sk-lang-code .sk-caret { font-size: 10px; }
  .sk-lang-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    z-index: 1002;
    min-width: 160px;
    margin: 0;
    padding: 8px;
    list-style: none;
    background: #fff;
    border: 1px solid #E3E6EC;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 33, 114, 0.08);
  }
  .sk-lang-menu[hidden] { display: none !important; }
  .sk-lang-menu a {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    color: #1B2333;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }
  .sk-lang-menu a:hover { background: #F6F7FA; }
  .sk-lang-menu img { display: block; width: 20px; height: 14px; object-fit: cover; }
  .sk-portal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 40px;
    padding: 0 18px;
    border: 1px solid #002172;
    border-radius: 8px;
    background: #fff;
    color: #002172;
    font-family: "Nunito Sans", sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
  }
  .sk-portal:hover { background: #F4F6FB; }
  .sk-apply { position: relative; }
  .sk-apply-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    padding: 0 18px;
    border: 0;
    border-radius: 8px;
    background: #EC3323;
    color: #fff;
    font-family: "Nunito Sans", sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
  }
  .sk-apply-trigger:hover,
  .sk-apply-trigger[aria-expanded="true"] { background: #C9291B; color: #fff; }
  .sk-apply-trigger:focus-visible,
  .sk-burger:focus-visible,
  .sk-drawer-close:focus-visible,
  .sk-portal:focus-visible,
  .sk-lang-code:focus-visible {
    outline: 2px solid #002172;
    outline-offset: 2px;
  }
  .sk-apply-trigger .sk-caret { transition: transform 0.2s; }
  .sk-apply.is-open > .sk-apply-trigger .sk-caret { transform: rotate(180deg); }
  .sk-apply-short { display: none; }
  .sk-apply-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 1002;
    min-width: 260px;
    margin: 0;
    padding: 8px;
    list-style: none;
    background: #fff;
    border: 1px solid #E3E6EC;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 33, 114, 0.08);
  }
  .sk-apply-menu[hidden] { display: none !important; }
  .sk-apply-menu a {
    display: block;
    padding: 10px 12px;
    border-radius: 8px;
    color: #1B2333;
    text-decoration: none;
  }
  .sk-apply-menu a:hover { background: #F6F7FA; }
  .sk-apply-label { display: block; color: #002172; font-weight: 700; font-size: 14px; line-height: 1.3; }
  .sk-apply-desc { display: block; margin-top: 2px; color: #5B6475; font-size: 12px; font-weight: 400; line-height: 1.35; }
  @media (max-width: 600px) {
    .sk-bar { padding: 0 16px; }
  }
  @media (max-width: 991px) {
    .sk-nav-desktop, .sk-lang-desktop, .sk-portal-desktop { display: none; }
    .sk-burger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      background: transparent;
      color: #002172;
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
    }
    .sk-apply-long { display: none; }
    .sk-apply-short { display: inline; }
    .sk-apply-trigger { height: 36px; padding: 0 12px; }
    .sk-apply-trigger .sk-caret { display: none; }
    .sk-overlay {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
      border: 0;
      padding: 0;
      background: rgba(0, 0, 0, 0.4);
    }
    .sk-drawer {
      display: block;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 1001;
      box-sizing: border-box;
      width: 86%;
      max-width: 340px;
      padding: 20px;
      overflow-y: auto;
      overscroll-behavior: contain;
      background: #fff;
      box-shadow: 0 12px 32px rgba(0, 33, 114, 0.16);
      transform: translateX(-105%);
      visibility: hidden;
    }
    .sk-drawer.is-open { transform: none; visibility: visible; }
    .sk-drawer-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .sk-drawer-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      background: transparent;
      color: #1B2333;
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
    }
    .sk-drawer-nav { margin: 8px 0 0; padding: 0; list-style: none; }
    .sk-drawer-nav > li { border-bottom: 1px solid #EEF0F4; }
    .sk-drawer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
      padding: 14px 0;
      border: 0;
      background: transparent;
      color: #002172;
      font-family: Poppins, sans-serif;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.2;
      text-align: left;
      text-decoration: none;
      cursor: pointer;
    }
    .sk-drawer-row.is-active { color: #EC3323; }
    .sk-drawer-row .sk-caret,
    .sk-drawer-row .sk-next { color: #5B6475; font-size: 16px; }
    .sk-drawer-nav > li.is-open > .sk-drawer-row .sk-caret { transform: rotate(180deg); }
    .sk-drawer-sub { margin: 0; padding: 0 0 8px; list-style: none; }
    .sk-drawer-sub[hidden] { display: none !important; }
    .sk-drawer-sub a {
      display: block;
      padding: 8px 0 8px 12px;
      color: #1B2333;
      font-family: "Nunito Sans", sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
    }
    .sk-drawer-sub a.is-active { color: #EC3323; }
    .sk-drawer-actions { display: grid; gap: 8px; margin-top: 20px; }
    .sk-drawer-apply {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      height: 40px;
      padding: 0 18px;
      border: 0;
      border-radius: 8px;
      background: #EC3323;
      color: #fff;
      font-family: "Nunito Sans", sans-serif;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .sk-drawer-apply:hover,
    .sk-drawer-apply[aria-expanded="true"] { background: #C9291B; }
    .sk-drawer-apply-list {
      display: grid;
      gap: 4px;
      padding: 8px;
      background: #fff;
      border: 1px solid #E3E6EC;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 33, 114, 0.08);
    }
    .sk-drawer-apply-list[hidden] { display: none !important; }
    .sk-drawer-apply-list a { display: block; padding: 8px; border-radius: 8px; text-decoration: none; }
    .sk-drawer-actions .sk-portal { width: 100%; }
    .sk-drawer-langs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 16px;
      color: #5B6475;
      font-family: "Nunito Sans", sans-serif;
      font-size: 12px;
      font-weight: 700;
    }
    .sk-drawer-langs a { color: #5B6475; text-decoration: none; }
    .sk-drawer-langs a[aria-current="true"] { color: #1B2333; }
  }
  @media (prefers-reduced-motion: reduce) {
    .sk-apply-trigger .sk-caret,
    .sk-drawer-row .sk-caret { transition: none; }
  }
`;

const MENU_LABELS: Record<Locale, { open: string; close: string }> = {
  tr: { open: "Menüyü aç", close: "Menüyü kapat" },
  en: { open: "Open menu", close: "Close menu" },
  de: { open: "Menü öffnen", close: "Menü schließen" },
};

const LANG_ORDER = ["tr", "en", "de"] as const;

function isCurrent(href: string, pathname: string): boolean {
  if (!href || href === "#" || /^https?:/.test(href)) return false;
  const path = href.split("?")[0].replace(/\/$/, "");
  return path === pathname.replace(/\/$/, "");
}

function itemKey(item: NavItem): string {
  return `${item.label}-${item.href}`;
}

function externalProps(target: string | null): { target: string; rel: string } | Record<string, never> {
  return target ? { target, rel: "noopener noreferrer" } : {};
}

function DesktopNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="sk-nav-desktop">
      {items.map((item) => {
        const childActive = item.children.some(
          (child) => isCurrent(child.href, pathname) && !/^\/(tr|en|de)\/?$/.test(child.href.split("?")[0]),
        );
        if (item.children.length === 0) {
          const active = isCurrent(item.href, pathname);
          return (
            <li key={itemKey(item)}>
              <a className={active ? "is-active" : undefined} href={item.href} aria-current={active ? "page" : undefined} {...externalProps(item.target)}>
                {item.label}
              </a>
            </li>
          );
        }
        return (
          <li key={itemKey(item)}>
            <a
              href={item.href}
              className={childActive ? "is-active" : undefined}
              onClick={(event) => event.preventDefault()}
            >
              {item.label}
              <span className="sk-caret" aria-hidden="true">▾</span>
            </a>
            <ul className="sk-drop">
              {item.children.map((child) => {
                const active = isCurrent(child.href, pathname);
                return (
                  <li key={itemKey(child)}>
                    <a className={active ? "is-active" : undefined} href={child.href} aria-current={active ? "page" : undefined} {...externalProps(child.target)}>
                      {child.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function DrawerNav({
  items,
  pathname,
  openKey,
  onToggle,
}: {
  items: NavItem[];
  pathname: string;
  openKey: string | null;
  onToggle: (key: string) => void;
}) {
  return (
    <ul className="sk-drawer-nav">
      {items.map((item) => {
        if (item.children.length === 0) {
          const active = isCurrent(item.href, pathname);
          return (
            <li key={itemKey(item)}>
              <a className={`sk-drawer-row${active ? " is-active" : ""}`} href={item.href} aria-current={active ? "page" : undefined} {...externalProps(item.target)}>
                <span>{item.label}</span>
                <span className="sk-next" aria-hidden="true">›</span>
              </a>
            </li>
          );
        }
        const key = itemKey(item);
        const open = openKey === key;
        return (
          <li key={key} className={open ? "is-open" : undefined}>
            <button type="button" className="sk-drawer-row" aria-expanded={open} onClick={() => onToggle(key)}>
              <span>{item.label}</span>
              <span className="sk-caret" aria-hidden="true">▾</span>
            </button>
            <ul className="sk-drawer-sub" hidden={!open}>
              {item.children.map((child) => {
                const active = isCurrent(child.href, pathname);
                return (
                  <li key={itemKey(child)}>
                    <a className={active ? "is-active" : undefined} href={child.href} aria-current={active ? "page" : undefined} {...externalProps(child.target)}>
                      {child.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
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
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = [
    { ...menu.franchise, href: franchiseHref },
    { ...menu.consultant, href: consultantHref },
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
    <div ref={rootRef} className={`sk-apply${open ? " is-open" : ""}`}>
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
        <span className="sk-apply-long">{menu.label}</span>
        <span className="sk-apply-short">{menu.shortLabel}</span>
        <span className="sk-caret" aria-hidden="true">▾</span>
      </button>
      <ul id="sk-apply-menu" className="sk-apply-menu" role="menu" hidden={!open}>
        {items.map((item) => (
          <li key={item.href} role="none">
            <a href={item.href} role="menuitem">
              <span className="sk-apply-label">{item.label}</span>
              <span className="sk-apply-desc">{item.description}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Header({ content, locale }: { content: HomepageContent; locale: Locale }) {
  const { nav, languageSwitcher, headerButtons } = content;
  const pathname = usePathname() || `/${locale}`;
  const labels = MENU_LABELS[locale];
  const desktopNav = buildHeaderNav(locale, nav, content.heroSearch.tabs);
  const drawerNav = drawerHeaderNav(desktopNav);
  const menu = applicationMenu[locale];
  const applyItems = [
    { ...menu.franchise, href: headerButtons.franchise.href },
    { ...menu.consultant, href: headerButtons.consultant.href },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerApplyOpen, setDrawerApplyOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const languages = LANG_ORDER.flatMap((code) => {
    const option = languageSwitcher.options.find((item) => item.code === code);
    return option ? [option] : [];
  });

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setDrawerApplyOpen(false);
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
      <div className="sk-bar">
        <div className="sk-brand">
          <button
            ref={burgerRef}
            type="button"
            className="sk-burger"
            aria-label={labels.open}
            aria-expanded={menuOpen}
            aria-controls="sk-main-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <a className="sk-logo" href={`/${locale}`}>
            <img src={LOGO_SRC} alt="OfficeLogo-photo" width={192} height={77} />
          </a>
        </div>
        <DesktopNav items={desktopNav} pathname={pathname} />
        <div className="sk-actions">
          <div className="sk-lang-desktop">
            <LanguageSelector content={languageSwitcher} currentCode={locale} id="languageMenuDesktop" />
          </div>
          <a className="sk-portal sk-portal-desktop" href={portalLoginHref(locale)}>
            {headerButtons.crm.label}
          </a>
          <ApplicationMenu
            locale={locale}
            consultantHref={headerButtons.consultant.href}
            franchiseHref={headerButtons.franchise.href}
          />
        </div>
      </div>
      {menuOpen ? <div className="sk-overlay" onClick={closeMenu} /> : null}
      <div
        ref={drawerRef}
        id="sk-main-menu"
        className={`sk-drawer${menuOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal={menuOpen}
        aria-hidden={!menuOpen}
        aria-label={labels.open}
        {...(!menuOpen ? { inert: true } : {})}
        onClick={(event) => {
          const link = (event.target as HTMLElement).closest("a");
          if (link && link.getAttribute("href") !== "#") setMenuOpen(false);
        }}
      >
        <div className="sk-drawer-top">
          <a className="sk-logo" href={`/${locale}`}>
            <img src={LOGO_SRC} alt="OfficeLogo-photo" width={150} height={60} />
          </a>
          <button ref={closeRef} type="button" className="sk-drawer-close" aria-label={labels.close} onClick={closeMenu}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        {/* No single search route for portfolio, office and consultant together, so the mockup field is omitted. */}
        <DrawerNav
          items={drawerNav}
          pathname={pathname}
          openKey={openKey}
          onToggle={(key) => setOpenKey((current) => (current === key ? null : key))}
        />
        <div className="sk-drawer-actions">
          <button
            type="button"
            className="sk-drawer-apply"
            aria-expanded={drawerApplyOpen}
            aria-controls="sk-drawer-apply-menu"
            onClick={() => setDrawerApplyOpen((current) => !current)}
          >
            <span>{menu.label}</span>
            <span className="sk-caret" aria-hidden="true">▾</span>
          </button>
          <div id="sk-drawer-apply-menu" className="sk-drawer-apply-list" hidden={!drawerApplyOpen}>
            {applyItems.map((item) => (
              <a key={item.href} href={item.href}>
                <span className="sk-apply-label">{item.label}</span>
                <span className="sk-apply-desc">{item.description}</span>
              </a>
            ))}
          </div>
          <a className="sk-portal" href={portalLoginHref(locale)}>
            {PORTAL_ENTRY[locale]}
          </a>
        </div>
        <div className="sk-drawer-langs">
          {languages.map((option, index) => (
            <span key={option.code}>
              {index > 0 ? <span aria-hidden="true"> · </span> : null}
              <a
                href={`/${locale}/Settings/ChangeCulture?langCode=${option.code}&returnPath=${encodeURIComponent(pathname)}`}
                aria-current={option.code === locale ? "true" : undefined}
              >
                {option.code.toUpperCase()}
              </a>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
