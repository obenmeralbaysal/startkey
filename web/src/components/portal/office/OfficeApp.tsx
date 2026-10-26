"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { clearOfficeReads, isRecord, officeCall, type OfficeRecord } from "@/components/portal/office/api";
import { NotificationBell, PortalSearch, UserChip } from "@/components/portal/office/chrome";
import { networkHome, showNetworkPortal } from "@/lib/portal-network";
import {
  officeLabel,
  officeNumber,
  roleOf,
  type OfficeMembership,
} from "@/components/portal/office/access";
import { EmptyState, OfficeProvider } from "@/components/portal/office/ui";
import { OfficeWork } from "@/components/portal/office/work";
import { AppShell, Icon, initials, ToastProvider, useToast, type IconName, type ShellLink } from "@/components/portal/shell";
import { PORTAL_UX_COPY } from "@/content/portal-ux";
import type { Locale } from "@/lib/locales";
import {
  PORTAL_SEARCH_READY,
  menuCurrent,
  officeBottomNav,
  officeHome,
  officeMenu,
  officeRoleBadge,
  personTitle,
  withLang,
  type OfficeMenuItem,
} from "@/lib/portal-ux";

type OfficeBoot = {
  at: number;
  isAdmin: boolean;
  first: string;
  last: string;
  title: string;
  offices: OfficeMembership[];
  officeId: number;
};

let officeBoot: OfficeBoot | null = null;
const OFFICE_BOOT_MS = 20_000;

export function OfficeApp({ parts, lang, tab = "" }: { parts: string[]; lang: Locale; tab?: string }) {
  return (
    <ToastProvider>
      <OfficeScreen parts={parts} lang={lang} tab={tab} />
    </ToastProvider>
  );
}

function OfficeScreen({ parts, lang, tab }: { parts: string[]; lang: Locale; tab: string }) {
  const router = useRouter();
  const copy = PORTAL_UX_COPY[lang];
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [offices, setOffices] = useState<OfficeMembership[]>([]);
  const [officeId, setOfficeId] = useState(0);
  const route = parts.join("/");
  const [section, setSection] = useState(parts);
  const [switching, setSwitching] = useState(false);
  const [userName, setUserName] = useState({ first: "", last: "", title: "" });
  const toast = useToast();
  const notice = useCallback((value: string) => toast(value), [toast]);
  const noticeRef = useRef(notice);
  noticeRef.current = notice;

  useEffect(() => {
    setSection(route === "" ? [] : route.split("/"));
  }, [route]);

  useEffect(() => {
    let cancelled = false;
    const apply = (boot: OfficeBoot) => {
      if (cancelled) return;
      setIsAdmin(boot.isAdmin);
      setUserName({ first: boot.first, last: boot.last, title: boot.title });
      setOffices(boot.offices);
      setOfficeId(boot.officeId);
      setReady(true);
    };
    if (officeBoot && Date.now() - officeBoot.at < OFFICE_BOOT_MS) {
      apply(officeBoot);
      return;
    }
    (async () => {
      const session = await fetch("/api/v1/portal/session", { credentials: "include", headers: { Accept: "application/json" } });
      if (!session.ok) {
        window.location.href = withLang("/portal", lang);
        return;
      }
      const sessionBody = (await session.json()) as OfficeRecord;
      const loginUser = isRecord(sessionBody.data) && isRecord(sessionBody.data.user) ? sessionBody.data.user : {};
      const first = typeof loginUser.first_name === "string" ? loginUser.first_name : "";
      const last = typeof loginUser.last_name === "string" ? loginUser.last_name : "";
      if (!cancelled) {
        setIsAdmin(Boolean(loginUser.is_admin));
        setUserName({ first, last, title: personTitle(loginUser) });
      }
      if (showNetworkPortal(loginUser)) {
        officeBoot = null;
        if (!cancelled) window.location.replace(networkHome(lang));
        return;
      }
      try {
        const me = await officeCall("me", null);
        if (showNetworkPortal(me)) {
          officeBoot = null;
          if (!cancelled) window.location.replace(networkHome(lang));
          return;
        }
        const list = memberships(me.offices ?? loginUser.offices);
        const current = Number(isRecord(me.user) ? me.user.office_id ?? 0 : 0);
        officeBoot = {
          at: Date.now(),
          isAdmin: Boolean(loginUser.is_admin),
          first,
          last,
          title: personTitle(me) || personTitle(loginUser),
          offices: list,
          officeId: current || (list[0] ? officeNumber(list[0]) : 0),
        };
        apply(officeBoot);
      } catch (error) {
        if (!cancelled) noticeRef.current(`Hata: ${error instanceof Error ? error.message : "Oturum açılmadı."}`);
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const office = offices.find((item) => officeNumber(item) === officeId) ?? offices[0];
  const role = roleOf(office);
  const menu = useMemo(() => officeMenu(role, office, lang), [role, office, lang]);

  async function choose(next: number) {
    if (next === officeId || switching) return;
    setSwitching(true);
    try {
      await officeCall("auth/switch-office", null, { method: "POST", body: { office_id: next } });
      officeBoot = null;
      setOfficeId(next);
      setSection([]);
      notice("");
      if ((parts[0] ?? "") !== "") router.push(officeHome(lang));
    } catch (error) {
      notice(`Hata: ${error instanceof Error ? error.message : "Ofis değişmedi."}`);
    } finally {
      setSwitching(false);
    }
  }

  async function logout() {
    officeBoot = null;
    clearOfficeReads();
    await fetch("/api/v1/portal/session", { method: "DELETE", credentials: "include" });
    window.location.href = withLang("/portal", lang);
  }

  if (!ready) {
    return (
      <main className="glass-loading" aria-busy="true">
        <img className="glass-logo" alt="StartKey" src="/portal/img/startkey_logo.png" />
        <span className="glass-spinner" />
      </main>
    );
  }
  if (!office || officeId === 0) {
    return (
      <main className="glass-login">
        <section className="glass-panel">
          <img className="glass-logo" alt="StartKey" src="/portal/img/startkey_logo.png" />
          <EmptyState message="Bu hesap bir ofise bağlı değil." />
          {isAdmin ? <Link className="glass-btn" href={withLang("/portal?desk=1", lang)}>Franchise masası</Link> : null}
          <button className="glass-btn-lite" type="button" onClick={logout}>Çıkış</button>
        </section>
      </main>
    );
  }

  const toLink = (item: OfficeMenuItem): ShellLink => ({
    href: withLang(item.href, lang),
    label: item.label,
    bottomLabel: item.bottomLabel,
    icon: item.icon as IconName,
    current: menuCurrent(item.id, parts, role === "agent"),
  });
  const shellLinks = menu.map(toLink);
  const workLinks = menu.filter((item) => item.group === "work").map(toLink);
  const manageLinks = menu.filter((item) => item.group === "manage").map(toLink);
  const bottom = officeBottomNav(menu).map(toLink);
  const badge = officeRoleBadge(role, lang);

  return (
    <OfficeProvider value={{ officeId, office, isAdmin, firstName: userName.first, jobTitle: userName.title, locale: lang, notice, reload: () => undefined }}>
      <AppShell
        variant="ux"
        links={shellLinks}
        bottom={bottom}
        moreLabel={copy.more}
        menuLabel={copy.menu}
        closeLabel={copy.close}
        groups={[
          { id: "work", links: workLinks },
          { id: "manage", label: copy.manage, links: manageLinks },
        ]}
        homeHref={officeHome(lang)}
        header={
          offices.length > 1 ? (
            <label className="glass-office">
              <span>{copy.office}</span>
              <select value={officeId} disabled={switching} aria-busy={switching} onChange={(event) => choose(Number(event.target.value))}>
                {offices.map((item) => (
                  <option key={officeNumber(item)} value={officeNumber(item)}>{officeLabel(item)}</option>
                ))}
              </select>
            </label>
          ) : <div className="glass-office-name">{officeLabel(office)}</div>
        }
        toolbar={
          <>
            {PORTAL_SEARCH_READY ? <PortalSearch label={copy.searchLabel} placeholder={copy.searchPlaceholder} /> : null}
            <NotificationBell />
            <UserChip first={userName.first} last={userName.last} role={role} locale={lang} />
          </>
        }
        footer={
          <div className="glass-side-group">
            <div className="glass-who">
              <span className="glass-avatar">{initials(userName.first, userName.last)}</span>
              <span>
                <strong>{`${userName.first} ${userName.last}`.trim() || officeLabel(office)}</strong>
                {badge ? <small>{badge}</small> : null}
              </span>
            </div>
            <nav className="ux-lang" aria-label="Language">
              {(["tr", "en", "de"] as const).map((code) => (
                <Link key={code} href={sectionHref(section, code)} aria-current={code === lang ? "true" : undefined}>{code.toUpperCase()}</Link>
              ))}
            </nav>
            {isAdmin ? <Link className="glass-nav-item" href={withLang("/portal?desk=1", lang)}><Icon name="grid" /><span>Franchise</span></Link> : null}
            <button className="glass-nav-item" type="button" onClick={logout}><Icon name="logout" /><span>{copy.logout}</span></button>
          </div>
        }
      >
        <div key={`${officeId}:${section.join("/")}`} className="glass-view">
          <OfficeWork key={officeId} parts={section} tab={tab} />
        </div>
      </AppShell>
    </OfficeProvider>
  );
}

function sectionHref(parts: string[], locale: Locale): string {
  const path = parts.length === 0 ? "/portal/office" : `/portal/office/${parts.join("/")}`;
  return withLang(path, locale);
}

function memberships(value: unknown): OfficeMembership[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((row) => row as OfficeMembership);
}
