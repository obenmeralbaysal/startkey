"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { isRecord, officeCall, type OfficeRecord } from "@/components/portal/office/api";
import {
  officeLabel,
  officeNumber,
  roleOf,
  type OfficeMembership,
} from "@/components/portal/office/access";
import { OfficeProvider } from "@/components/portal/office/ui";
import { OfficeWork } from "@/components/portal/office/work";

export function OfficeApp({ parts }: { parts: string[] }) {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [offices, setOffices] = useState<OfficeMembership[]>([]);
  const [officeId, setOfficeId] = useState(0);
  const [message, setMessage] = useState("");
  const notice = useCallback((value: string) => setMessage(value), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await fetch("/api/v1/portal/session", { credentials: "include", headers: { Accept: "application/json" } });
      if (!session.ok) {
        window.location.href = "/portal";
        return;
      }
      const sessionBody = (await session.json()) as OfficeRecord;
      const loginUser = isRecord(sessionBody.data) && isRecord(sessionBody.data.user) ? sessionBody.data.user : {};
      if (!cancelled) setIsAdmin(Boolean(loginUser.is_admin));
      try {
        const me = await officeCall("me", null);
        const list = memberships(me.offices ?? loginUser.offices);
        if (cancelled) return;
        setOffices(list);
        const current = Number(isRecord(me.user) ? me.user.office_id ?? 0 : 0);
        setOfficeId(current || (list[0] ? officeNumber(list[0]) : 0));
      } catch (error) {
        if (!cancelled) notice(`Hata: ${error instanceof Error ? error.message : "Oturum açılmadı."}`);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notice]);

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
    try {
      await officeCall("auth/switch-office", null, { method: "POST", body: { office_id: next } });
      setOfficeId(next);
      notice("");
    } catch (error) {
      notice(`Hata: ${error instanceof Error ? error.message : "Ofis değişmedi."}`);
    }
  }

  async function logout() {
    await fetch("/api/v1/portal/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/portal";
  }

  if (!ready) {
    return <main className="glass-shell"><p className="glass-muted">Açılıyor</p></main>;
  }
  if (!office || officeId === 0) {
    return (
      <main className="glass-shell">
        <p>Bu hesap bir ofise bağlı değil.</p>
        {isAdmin ? <Link href="/portal">Franchise masası</Link> : null}
      </main>
    );
  }

  return (
    <OfficeProvider value={{ officeId, office, isAdmin, notice, reload: () => undefined }}>
      <main className="glass-shell">
        <div className="glass-top">
          <img className="glass-logo" alt="Logo" src="/portal/img/startkey_logo.png" />
          <div className="glass-actions">
            {offices.length > 1 ? (
              <select value={officeId} onChange={(event) => choose(Number(event.target.value))}>
                {offices.map((item) => (
                  <option key={officeNumber(item)} value={officeNumber(item)}>{officeLabel(item)}</option>
                ))}
              </select>
            ) : <span>{officeLabel(office)}</span>}
            {isAdmin ? <Link className="glass-btn-lite" href="/portal">Franchise</Link> : null}
            <button className="glass-btn-lite" type="button" onClick={logout}>Çıkış</button>
          </div>
        </div>
        <nav className="glass-nav">
          {links.map(([slug, label]) => {
            const href = slug ? `/portal/office/${slug}` : "/portal/office";
            const current = (parts[0] ?? "") === slug;
            return <Link key={slug || "home"} href={href} aria-current={current ? "page" : undefined}>{label}</Link>;
          })}
        </nav>
        {message ? <p className={message.startsWith("Hata") ? "glass-error" : "glass-muted"}>{message}</p> : null}
        <OfficeWork parts={parts} />
        <p className="glass-muted">{roleLabel(role)}</p>
      </main>
    </OfficeProvider>
  );
}

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
