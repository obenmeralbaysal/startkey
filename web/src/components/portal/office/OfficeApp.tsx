"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { clearOfficeReads, isRecord, officeCall, type OfficeRecord } from "@/components/portal/office/api";
import {
  officeLabel,
  officeNumber,
  roleOf,
  type OfficeMembership,
} from "@/components/portal/office/access";
import { EmptyState, OfficeProvider } from "@/components/portal/office/ui";
import { OfficeWork } from "@/components/portal/office/work";
import { AppShell, Icon, initials, ToastProvider, useToast, type IconName, type ShellLink } from "@/components/portal/shell";

type OfficeBoot = {
  at: number;
  isAdmin: boolean;
  first: string;
  last: string;
  offices: OfficeMembership[];
  officeId: number;
};

let officeBoot: OfficeBoot | null = null;
const OFFICE_BOOT_MS = 20_000;

export function OfficeApp({ parts }: { parts: string[] }) {
  return (
    <ToastProvider>
      <OfficeScreen parts={parts} />
    </ToastProvider>
  );
}

function OfficeScreen({ parts }: { parts: string[] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [offices, setOffices] = useState<OfficeMembership[]>([]);
  const [officeId, setOfficeId] = useState(0);
  const route = parts.join("/");
  const [section, setSection] = useState(parts);
  const [switching, setSwitching] = useState(false);
  const [userName, setUserName] = useState({ first: "", last: "" });
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
      setUserName({ first: boot.first, last: boot.last });
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
        window.location.href = "/portal";
        return;
      }
      const sessionBody = (await session.json()) as OfficeRecord;
      const loginUser = isRecord(sessionBody.data) && isRecord(sessionBody.data.user) ? sessionBody.data.user : {};
      const first = typeof loginUser.first_name === "string" ? loginUser.first_name : "";
      const last = typeof loginUser.last_name === "string" ? loginUser.last_name : "";
      if (!cancelled) {
        setIsAdmin(Boolean(loginUser.is_admin));
        setUserName({ first, last });
      }
      try {
        const me = await officeCall("me", null);
        const list = memberships(me.offices ?? loginUser.offices);
        const current = Number(isRecord(me.user) ? me.user.office_id ?? 0 : 0);
        officeBoot = {
          at: Date.now(),
          isAdmin: Boolean(loginUser.is_admin),
          first,
          last,
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
  }, []);

  const office = offices.find((item) => officeNumber(item) === officeId) ?? offices[0];
  const role = roleOf(office);
  const links = useMemo(() => {
    const items = [
      ["", "Özet"],
      ["contacts", "Kişiler"],
      ["portfolios", "Portföy"],
      ["demands", "Talepler"],
      ["matches", "Eşleşmeler"],
      ["calendar", "Takvim"],
      ["earnings", "Hakediş"],
      ["reports", role === "agent" ? "Performansım" : "Raporlar"],
      ["collaborations", "İşbirlikleri"],
      ["lease", "Kira radarı"],
      ["sahibinden", "Sahibinden"],
      ["settings", "Ayarlar"],
    ];
    return items.filter(([slug]) => {
      if (slug === "sahibinden") return role !== "";
      return true;
    });
  }, [role]);

  async function choose(next: number) {
    if (next === officeId || switching) return;
    setSwitching(true);
    try {
      await officeCall("auth/switch-office", null, { method: "POST", body: { office_id: next } });
      officeBoot = null;
      setOfficeId(next);
      setSection([]);
      notice("");
      if ((parts[0] ?? "") !== "") router.push("/portal/office");
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
    window.location.href = "/portal";
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
          {isAdmin ? <Link className="glass-btn" href="/portal">Franchise masası</Link> : null}
          <button className="glass-btn-lite" type="button" onClick={logout}>Çıkış</button>
        </section>
      </main>
    );
  }

  const shellLinks: ShellLink[] = links.map(([slug, label]) => ({
    href: slug ? `/portal/office/${slug}` : "/portal/office",
    label,
    icon: ICONS[slug] ?? "grid",
    current: (parts[0] ?? "") === slug,
  }));

  return (
    <OfficeProvider value={{ officeId, office, isAdmin, firstName: userName.first, notice, reload: () => undefined }}>
      <AppShell
        links={shellLinks}
        homeHref="/portal/office"
        header={
          offices.length > 1 ? (
            <label className="glass-office">
              <span>Ofis</span>
              <select value={officeId} disabled={switching} aria-busy={switching} onChange={(event) => choose(Number(event.target.value))}>
                {offices.map((item) => (
                  <option key={officeNumber(item)} value={officeNumber(item)}>{officeLabel(item)}</option>
                ))}
              </select>
            </label>
          ) : <div className="glass-office-name">{officeLabel(office)}</div>
        }
        footer={
          <div className="glass-side-group">
            <div className="glass-who">
              <span className="glass-avatar">{initials(userName.first, userName.last)}</span>
              <span>
                <strong>{`${userName.first} ${userName.last}`.trim() || officeLabel(office)}</strong>
                <small>{roleLabel(role)}</small>
              </span>
            </div>
            {isAdmin ? <Link className="glass-nav-item" href="/portal"><Icon name="grid" /><span>Franchise</span></Link> : null}
            <button className="glass-nav-item" type="button" onClick={logout}><Icon name="logout" /><span>Çıkış</span></button>
          </div>
        }
      >
        <div key={`${officeId}:${section.join("/")}`} className="glass-view">
          <OfficeWork key={officeId} parts={section} />
        </div>
      </AppShell>
    </OfficeProvider>
  );
}

const ICONS: Record<string, IconName> = {
  "": "home",
  contacts: "people",
  portfolios: "building",
  demands: "search",
  matches: "link",
  calendar: "calendar",
  earnings: "wallet",
  reports: "chart",
  collaborations: "swap",
  lease: "key",
  sahibinden: "globe",
  settings: "sliders",
};

function memberships(value: unknown): OfficeMembership[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((row) => row as OfficeMembership);
}

function roleLabel(role: string): string {
  if (role === "owner") return "Broker";
  if (role === "agent") return "Agent";
  if (role === "office_manager" || role === "manager") return "Ofis yöneticisi";
  return role;
}
