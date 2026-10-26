"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const PATHS = {
  home: "M3.5 10.5 12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5A1.5 1.5 0 0 1 3.5 19z",
  people: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16.5 11a2.5 2.5 0 1 0 0-5M17 14.5c2.3.3 3.9 1.8 4.5 4.5",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 20.5c1-4 4-6 8-6s7 2 8 6",
  building: "M4.5 20.5V5A1.5 1.5 0 0 1 6 3.5h7A1.5 1.5 0 0 1 14.5 5v15.5M14.5 9H18a1.5 1.5 0 0 1 1.5 1.5v10M3 20.5h18M8 8h3M8 12h3M8 16h3",
  search: "M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M16 16l4.5 4.5",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  calendar: "M6 5h12a2.5 2.5 0 0 1 2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V7.5A2.5 2.5 0 0 1 6 5M3.5 10h17M8 3v4M16 3v4",
  wallet: "M5.5 6h13A2.5 2.5 0 0 1 21 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-8A2.5 2.5 0 0 1 5.5 6M3 10.5h18M16 15h2",
  chart: "M4 20.5h16M7 16.5v-5M12 16.5v-9M17 16.5v-7",
  swap: "M7 7.5h12.5l-3.5-3.5M17 16.5H4.5L8 20",
  key: "M8 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8M10.8 12.2l8.7-8.7M16 7l3 3M13.5 9.5l2 2",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3",
  sliders: "M4 7h9M17 7h3M4 17h4M12 17h8M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M10 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  grid: "M5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3A1.5 1.5 0 0 1 5.5 4M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5v-3A1.5 1.5 0 0 1 15.5 4M5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3A1.5 1.5 0 0 1 5.5 14M15.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5",
  inbox: "M3.5 13.5 6.3 5.6A1.5 1.5 0 0 1 7.7 4.5h8.6a1.5 1.5 0 0 1 1.4 1.1l2.8 7.9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19zM3.5 13.5h5l1.5 2.5h4l1.5-2.5h5",
  tag: "M3.5 12V5A1.5 1.5 0 0 1 5 3.5h7l8.5 8.5-8.5 8.5zM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
  more: "M6 13.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6M12 13.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6M18 13.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6",
  chevronRight: "M9 5.5 15.5 12 9 18.5",
  chevronDown: "M6 9l6 6 6-6",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  eyeOff: "M3.5 3.5l17 17M10 5.7c.6-.1 1.3-.2 2-.2 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.6 4.6-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  check: "M5 12.5l4.5 4.5L19 7.5",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M8 12.3l2.8 2.7L16 9.5",
  alert: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7.5v5.5M12 16.5v.01",
  logout: "M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5M10 8l-4 4 4 4M6 12h10",
  menu: "M4 7h16M4 12h16M4 17h16",
  bell: "M6 16.5V10a6 6 0 1 1 12 0v6.5l1.6 2.2H4.4zM10 19.8a2 2 0 0 0 4 0",
  plus: "M12 5v14M5 12h14",
  tray: "M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V7a1.5 1.5 0 0 1 1.5-1.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="glass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export type ShellLink = { href: string; label: string; icon: IconName; current: boolean; bottomLabel?: string };

export type ShellGroup = { id: string; label?: string; links: ShellLink[] };

export function AppShell({
  links,
  groups,
  primary = 4,
  bottom,
  variant = "glass",
  moreLabel = "Diğer",
  menuLabel = "Menüyü aç",
  closeLabel = "Kapat",
  homeHref,
  header,
  toolbar,
  footer,
  children,
}: {
  links: ShellLink[];
  groups?: ShellGroup[];
  primary?: number;
  bottom?: ShellLink[];
  variant?: "glass" | "ux";
  moreLabel?: string;
  menuLabel?: string;
  closeLabel?: string;
  homeHref: string;
  header?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ux = variant === "ux";
  const current = links.find((item) => item.current);
  const tabs = bottom ?? links.slice(0, primary);
  const rest = bottom ? links.filter((item) => !bottom.some((tab) => tab.href === item.href)) : links.slice(primary);
  const moreCurrent = rest.some((item) => item.current);
  const nav = groups ?? [{ id: "all", links }];
  const tabCount = tabs.length + (rest.length > 0 ? 1 : 0);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawer(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={ux ? "glass-app glass-app-ux" : "glass-app"} data-drawer={drawer ? "open" : "closed"}>
      {ux ? <button className="ux-backdrop" type="button" aria-label={closeLabel} onClick={() => setDrawer(false)} /> : null}
      <aside className="glass-sidebar" id="portal-sidebar">
        <Link className="glass-brand" href={homeHref} onClick={() => setDrawer(false)}>
          <img alt="StartKey" src="/portal/img/startkey_logo.png" />
        </Link>
        {header ? <div className="glass-side-head">{header}</div> : null}
        {nav.map((group) => (
          <div className="ux-group" key={group.id}>
            {group.label ? <p className="ux-group-label">{group.label}</p> : null}
            <nav className="glass-side-nav" aria-label={group.label || "Menü"}>
              {group.links.map((item) => (
                <NavItem key={`${group.id}-${item.href}`} item={item} onNavigate={() => setDrawer(false)} />
              ))}
            </nav>
          </div>
        ))}
        {footer ? <div className="glass-side-foot">{footer}</div> : null}
      </aside>
      <header className="glass-topbar" data-scrolled={scrolled}>
        {ux ? (
          <button className="ux-burger" type="button" aria-label={menuLabel} aria-controls="portal-sidebar" aria-expanded={drawer} onClick={() => setDrawer(true)}>
            <Icon name="menu" />
          </button>
        ) : (
          <Link href={homeHref} aria-label="StartKey">
            <img alt="" src="/portal/img/startkey_logo.png" />
          </Link>
        )}
        {ux ? null : <span className="glass-topbar-title">{current?.label ?? ""}</span>}
        {toolbar ? <div className="ux-toolbar">{toolbar}</div> : null}
        <div className="glass-topbar-tools">
          {ux ? null : header}
          {ux ? null : footer}
        </div>
      </header>
      <main className="glass-main">{children}</main>
      <nav className="glass-tabbar" aria-label="Menü" data-count={tabCount} style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
        {tabs.map((item) => (
          <Link key={item.href} className="glass-tab" href={item.href} aria-current={item.current ? "page" : undefined}>
            <Icon name={item.icon} />
            <span>{item.bottomLabel ?? item.label}</span>
          </Link>
        ))}
        {rest.length > 0 ? (
          <button
            className="glass-tab"
            type="button"
            aria-current={moreCurrent ? "page" : undefined}
            aria-expanded={ux ? drawer : undefined}
            aria-controls={ux ? "portal-sidebar" : undefined}
            aria-haspopup={ux ? undefined : "dialog"}
            onClick={() => (ux ? setDrawer(true) : setMoreOpen(true))}
          >
            <Icon name="more" />
            <span>{moreLabel}</span>
          </button>
        ) : null}
      </nav>
      {ux ? null : (
        <Sheet open={moreOpen} title={moreLabel} onClose={() => setMoreOpen(false)}>
          {header}
          <nav className="glass-side-nav" aria-label={moreLabel}>
            {rest.map((item) => (
              <NavItem key={item.href} item={item} onNavigate={() => setMoreOpen(false)} />
            ))}
          </nav>
          {footer}
        </Sheet>
      )}
    </div>
  );
}

function NavItem({ item, onNavigate }: { item: ShellLink; onNavigate?: () => void }) {
  return (
    <Link className="glass-nav-item" href={item.href} aria-current={item.current ? "page" : undefined} onClick={onNavigate}>
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

const FOCUSABLE = ':is(a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]):not([tabindex="-1"])';

export function Sheet({
  open,
  title,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ start: number; offset: number } | null>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((node) => node.offsetParent !== null);
      if (items.length === 0) return;
      const head = items[0];
      const tail = items[items.length - 1];
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault();
        head.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  function onGrabDown(event: ReactPointerEvent<HTMLButtonElement>) {
    dragRef.current = { start: event.clientY, offset: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onGrabMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel) return;
    drag.offset = Math.max(0, event.clientY - drag.start);
    panel.style.transition = "none";
    panel.style.transform = `translateY(${drag.offset}px)`;
  }

  function onGrabUp() {
    const drag = dragRef.current;
    const panel = panelRef.current;
    dragRef.current = null;
    if (!drag || !panel) return;
    panel.style.transition = "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)";
    if (drag.offset > 90) {
      panel.style.transform = "translateY(100%)";
      window.setTimeout(() => closeRef.current(), 200);
      return;
    }
    panel.style.transform = "";
  }

  return (
    <div className="glass-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} className={`glass-sheet ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} tabIndex={-1}>
        <button className="glass-sheet-grab" type="button" aria-label="Kapat" tabIndex={-1} onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp} />
        {title ? (
          <div className="glass-sheet-head">
            <h2 id={titleId}>{title}</h2>
            <button className="glass-close" type="button" aria-label="Kapat" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type Toast = { id: number; message: string; tone: "info" | "error" };
type ToastFn = (message: string, tone?: "info" | "error") => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("Bildirim alanı yok.");
  }
  return value;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback<ToastFn>((message, tone) => {
    if (!message) return;
    const resolved = tone ?? (message.startsWith("Hata") ? "error" : "info");
    seq.current += 1;
    const id = seq.current;
    setItems((current) => [...current.filter((item) => item.message !== message), { id, message, tone: resolved }].slice(-3));
    if (resolved === "info") {
      timers.current.set(id, window.setTimeout(() => dismiss(id), 3200));
    }
  }, [dismiss]);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="glass-toasts" aria-live="polite" role="status">
        {items.map((item) => (
          <div key={item.id} className="glass-toast" data-tone={item.tone} role={item.tone === "error" ? "alert" : undefined}>
            <Icon name={item.tone === "error" ? "alert" : "checkCircle"} />
            <p>{item.message}</p>
            <button className="glass-close" type="button" aria-label="Kapat" onClick={() => dismiss(item.id)}>
              <Icon name="close" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function initials(first: string, last: string): string {
  return `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toLocaleUpperCase("tr-TR") || "?";
}
