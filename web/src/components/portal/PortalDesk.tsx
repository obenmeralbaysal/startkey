"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FranchiseDesk } from "@/components/portal/FranchiseDesk";
import { EmptyState, Skeleton } from "@/components/portal/office/ui";
import { AppShell, Icon, initials, ToastProvider, useToast, type IconName, type ShellLink } from "@/components/portal/shell";

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

export function PortalDesk({ user, onLogout }: { user: PortalUser; onLogout: () => void }) {
  return (
    <ToastProvider>
      <DeskScreen user={user} onLogout={onLogout} />
    </ToastProvider>
  );
}

function DeskScreen({ user, onLogout }: { user: PortalUser; onLogout: () => void }) {
  const ownerOffices = user.offices.filter((office) => office.role === "owner");
  const isAdmin = user.is_admin;
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const anchors: Array<[string, string, IconName]> = [
    ...(isAdmin
      ? ([
          ["#ofisler", "Ofisler", "grid"],
          ["#basvurular", "Başvurular", "inbox"],
          ["#danisman", "Danışmanlar", "people"],
          ["#paket", "Paket", "tag"],
        ] as Array<[string, string, IconName]>)
      : []),
    ...ownerOffices.map((office): [string, string, IconName] => [`#ofis-${office.id}`, office.name, "building"]),
  ];
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
        {ownerOffices.map((office) => (
          <OwnerPanel key={office.id} office={office} />
        ))}
        {!isAdmin && user.offices.length === 0 ? (
          <section className="glass-card">
            <EmptyState message="Bu hesap için ofis kaydı yok." />
          </section>
        ) : null}
        {!isAdmin && ownerOffices.length === 0 && user.offices.length > 0 ? (
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

function OwnerPanel({ office }: { office: PortalOffice }) {
  const toast = useToast();

  function add(kind: "brokers" | "agents", event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    portalSend(`/api/v1/portal/offices/${office.id}/${kind}`, {
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      email: form.get("email"),
      phone: form.get("phone"),
    }).then((body) => {
      if (body.data?.attached) {
        toast("Mevcut kişi bu ofise bağlandı. Portala aynı hesapla girip ofis değiştirebilir.");
        return;
      }
      toast(body.message || "Kaydedildi.");
    });
  }

  return (
    <section className="glass-card" id={`ofis-${office.id}`}>
      <h2>{office.name}</h2>
      <MemberForm title="Broker ekle" onSubmit={(event) => add("brokers", event)} />
      <MemberForm title="Agent ekle" onSubmit={(event) => add("agents", event)} />
    </section>
  );
}

function MemberForm({ title, onSubmit }: { title: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="glass-form" onSubmit={onSubmit}>
      <h3>{title}</h3>
      <input name="first_name" placeholder="Ad" autoComplete="given-name" required />
      <input name="last_name" placeholder="Soyad" autoComplete="family-name" required />
      <input name="email" type="email" inputMode="email" placeholder="E-posta" autoComplete="email" required />
      <input name="phone" type="tel" inputMode="tel" placeholder="Telefon" autoComplete="tel" />
      <button className="glass-btn" type="submit">
        Ekle
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
