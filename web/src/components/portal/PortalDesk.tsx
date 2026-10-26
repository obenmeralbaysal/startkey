"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeskStats } from "@/components/portal/DeskStats";
import { FranchiseDesk } from "@/components/portal/FranchiseDesk";
import { officeCall } from "@/components/portal/office/api";
import { EmptyState, Skeleton } from "@/components/portal/office/ui";
import { AppShell, Icon, initials, ToastProvider, useToast, type IconName, type ShellLink } from "@/components/portal/shell";
import { networkHome, showNetworkPortal } from "@/lib/portal-network";
import { portalLandingHref } from "@/lib/portal-ux";

export type PortalOffice = { id: number; name: string; role: string | null };

export type PortalUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_admin: boolean;
  offices: PortalOffice[];
};

type Application = {
  id: number;
  applicant_name: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  status: string;
};

type ConsultantRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  office_name: string | null;
  position: number;
  status: string;
};

type PackageOption = { code: string; name: string };

export function PortalDesk({ user, lang = "tr", onLogout }: { user: PortalUser; lang?: string; onLogout: () => void }) {
  return (
    <ToastProvider>
      <DeskScreen user={user} lang={lang} onLogout={onLogout} />
    </ToastProvider>
  );
}

function DeskScreen({ user, lang, onLogout }: { user: PortalUser; lang: string; onLogout: () => void }) {
  const [gate, setGate] = useState<"check" | "desk">("check");
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const desk = new URLSearchParams(window.location.search).get("desk");
    const go = (href: string | null) => {
      if (cancelled) return;
      if (href) {
        window.location.replace(href);
        return;
      }
      setGate("desk");
    };
    if (showNetworkPortal(user)) {
      go(networkHome(lang));
      return;
    }
    officeCall("me", null)
      .then((me) => {
        go(portalLandingHref(showNetworkPortal(me) ? me : user, lang, desk));
      })
      .catch(() => {
        go(portalLandingHref(user, lang, desk));
      });
    return () => {
      cancelled = true;
    };
  }, [lang, user]);

  if (gate === "check") {
    return (
      <main className="glass-loading" aria-busy="true">
        <img className="glass-logo" alt="StartKey" src="/portal/img/startkey_logo.png" />
        <span className="glass-spinner" />
      </main>
    );
  }

  const isAdmin = user.is_admin;

  const anchors: Array<[string, string, IconName]> = isAdmin
    ? [
        ["#panel", "Panel", "chart"],
        ["#ofisler", "Ofisler", "grid"],
        ["#basvurular", "Başvurular", "inbox"],
        ["#danisman", "Danışmanlar", "people"],
        ["#paket", "Paket", "tag"],
      ]
    : [];
  const active = anchors.some(([href]) => href === hash) ? hash : anchors[0]?.[0] ?? "";
  const links: ShellLink[] = [
    ...anchors.map(([href, label, icon]) => ({ href, label, icon, current: href === active })),
    ...(user.offices.length > 0 ? [{ href: "/portal/office", label: "Ofis", icon: "home" as IconName, current: false }] : []),
  ];

  return (
    <AppShell
      links={links}
      homeHref="/portal"
      footer={
        <div className="glass-side-group">
          <div className="glass-who">
            <span className="glass-avatar">{initials(user.first_name, user.last_name)}</span>
            <span>
              <strong>{user.first_name} {user.last_name}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <button className="glass-nav-item" type="button" onClick={() => logout(onLogout)}>
            <Icon name="logout" />
            <span>Çıkış</span>
          </button>
        </div>
      }
    >
      <div className="glass-view">
        {isAdmin ? <AdminPanel /> : null}
        {!isAdmin && user.offices.length === 0 ? (
          <section className="glass-card">
            <EmptyState message="Bu hesap için ofis kaydı yok." />
          </section>
        ) : null}
        {!isAdmin && user.offices.length > 0 ? (
          <section className="glass-card">
            <EmptyState message="StartKey Portal" />
            <Link className="glass-btn" href="/portal/office">Ofis</Link>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function AdminPanel() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [consultants, setConsultants] = useState<ConsultantRow[] | null>(null);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const toast = useToast();

  useEffect(() => {
    portalGet<Application[]>("/api/v1/portal/applications").then(setApplications);
    portalGet<ConsultantRow[]>("/api/v1/portal/consultant-applications").then(setConsultants);
    portalGet<PackageOption[]>("/api/v1/portal/packages").then(setPackages);
  }, []);

  return (
    <>
    <DeskStats />
    <FranchiseDesk />
    <section className="glass-card" id="basvurular">
      <h2>Ofis başvuruları</h2>
      {applications === null ? <Skeleton /> : applications.length === 0 ? <EmptyState /> : null}
      {(applications ?? []).map((row) => (
        <form
          key={row.id}
          className="glass-item"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            portalSend(`/api/v1/portal/applications/${row.id}/open-office`, {
              office_name: form.get("office_name"),
              package: form.get("package") || null,
            }).then((body) => toast(body.message || "Ofis açıldı."));
          }}
        >
          <p>
            <strong>{row.applicant_name}</strong>
            <span className="glass-muted"> · {row.city} / {row.district}</span>
          </p>
          <span className="glass-pill">{row.status}</span>
          <div className="glass-fields">
            <input name="office_name" placeholder="Ofis adı" required />
            <select name="package" defaultValue="">
              <option value="">Varsayılan paket</option>
              {packages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            <button className="glass-btn-lite" type="submit">
              Ofis aç
            </button>
          </div>
        </form>
      ))}
    </section>
    <section className="glass-card" id="danisman">
      <h2>Danışman başvuruları</h2>
      {consultants === null ? <Skeleton /> : consultants.length === 0 ? <EmptyState /> : null}
      {(consultants ?? []).map((row) => (
        <div key={row.id} className="glass-item">
          <p>
            <strong>{row.first_name} {row.last_name}</strong>
            <span className="glass-muted"> · {row.office_name} · {positionLabel(row.position)}</span>
          </p>
          <span className="glass-pill">{row.status}</span>
          {row.status === "new" ? (
            <button
              className="glass-btn-lite"
              type="button"
              onClick={() =>
                portalSend(`/api/v1/portal/consultant-applications/${row.id}/accept`, {}).then((body) =>
                  toast(body.message || "Başvuru kabul edildi."),
                )
              }
            >
              Kabul et
            </button>
          ) : null}
        </div>
      ))}
    </section>
    <PackageForm packages={packages} onDone={toast} />
    </>
  );
}

function PackageForm({ packages, onDone }: { packages: PackageOption[]; onDone: (message: string) => void }) {
  return (
    <form
      id="paket"
      className="glass-card glass-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        portalSend(`/api/v1/portal/offices/${form.get("office_id")}/package`, { package: form.get("package") }, "PUT").then(
          (body) => onDone(body.message || "Paket güncellendi."),
        );
      }}
    >
      <h3>Paket</h3>
      <input name="office_id" placeholder="Ofis no" inputMode="numeric" required />
      <select name="package" required defaultValue="">
        <option value="">Paket</option>
        {packages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      <button className="glass-btn" type="submit">
        Paketi yaz
      </button>
    </form>
  );
}

function positionLabel(position: number): string {
  if (position === 2) return "Gayrimenkul Danışmanı";
  if (position === 4) return "Ofis Yöneticisi";
  if (position === 5) return "Ofis Asistanı";
  return String(position);
}

async function portalGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  return (body.data ?? []) as T;
}

async function portalSend(url: string, payload: unknown, method = "POST"): Promise<{ message?: string; data?: { attached?: boolean } }> {
  const response = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json().catch(() => ({}));
}

async function logout(onLogout: () => void) {
  await fetch("/api/v1/portal/session", { method: "DELETE", credentials: "include" });
  onLogout();
}
