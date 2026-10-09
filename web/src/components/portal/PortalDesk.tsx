"use client";

import { useEffect, useState } from "react";

import { scaled } from "@/lib/scale";

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
  const ownerOffices = user.offices.filter((office) => office.role === "owner");
  const isAdmin = user.is_admin;

  return (
    <div className="d-flex flex-column flex-root" id="kt_app_root">
      <div className="d-flex flex-column flex-center p-10">
        <img alt="Logo" src="/portal/img/startkey_logo.png" width={220} />
        <h1 className="mt-6">Startkey Portal</h1>
        <p>
          {user.first_name} {user.last_name}
        </p>
        <button className="btn btn-light" type="button" onClick={() => logout(onLogout)}>
          Çıkış
        </button>
        {isAdmin ? <AdminPanel /> : null}
        {ownerOffices.map((office) => (
          <OwnerPanel key={office.id} office={office} />
        ))}
        {!isAdmin && ownerOffices.length === 0 ? <p>Bu hesap için yönetim ekranı yok.</p> : null}
      </div>
    </div>
  );
}

function AdminPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    portalGet<Application[]>("/api/v1/portal/applications").then(setApplications);
    portalGet<ConsultantRow[]>("/api/v1/portal/consultant-applications").then(setConsultants);
    portalGet<PackageOption[]>("/api/v1/portal/packages").then(setPackages);
  }, []);

  return (
    <section className="w-100 mt-10" style={{ maxWidth: scaled(720) }}>
      <h2>Ofis başvuruları</h2>
      {message ? <p>{message}</p> : null}
      {applications.map((row) => (
        <form
          key={row.id}
          className="mb-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            portalSend(`/api/v1/portal/applications/${row.id}/open-office`, {
              office_name: form.get("office_name"),
              package: form.get("package") || null,
            }).then((body) => setMessage(body.message || "Ofis açıldı."));
          }}
        >
          <p>
            {row.applicant_name} — {row.city} / {row.district} — {row.status}
          </p>
          <input name="office_name" placeholder="Ofis adı" required />
          <select name="package" defaultValue="">
            <option value="">Varsayılan paket</option>
            {packages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Ofis aç
          </button>
        </form>
      ))}
      <h2>Danışman başvuruları</h2>
      {consultants.map((row) => (
        <p key={row.id}>
          {row.first_name} {row.last_name} — {row.office_name} — {positionLabel(row.position)} — {row.status}
          {row.status === "new" ? (
            <button
              className="btn btn-primary ms-3"
              type="button"
              onClick={() =>
                portalSend(`/api/v1/portal/consultant-applications/${row.id}/accept`, {}).then((body) =>
                  setMessage(body.message || "Başvuru kabul edildi."),
                )
              }
            >
              Kabul et
            </button>
          ) : null}
        </p>
      ))}
      <PackageForm packages={packages} onDone={setMessage} />
    </section>
  );
}

function PackageForm({ packages, onDone }: { packages: PackageOption[]; onDone: (message: string) => void }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        portalSend(`/api/v1/portal/offices/${form.get("office_id")}/package`, { package: form.get("package") }, "PUT").then(
          (body) => onDone(body.message || "Paket güncellendi."),
        );
      }}
    >
      <h2>Paket</h2>
      <input name="office_id" placeholder="Ofis no" required />
      <select name="package" required defaultValue="">
        <option value="">Paket</option>
        {packages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      <button className="btn btn-primary" type="submit">
        Paketi yaz
      </button>
    </form>
  );
}

function OwnerPanel({ office }: { office: PortalOffice }) {
  const [message, setMessage] = useState("");

  function add(kind: "brokers" | "agents", event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    portalSend(`/api/v1/portal/offices/${office.id}/${kind}`, {
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      email: form.get("email"),
      phone: form.get("phone"),
    }).then((body) => setMessage(body.message || "Kaydedildi."));
  }

  return (
    <section>
      <h2>{office.name}</h2>
      {message ? <p>{message}</p> : null}
      <MemberForm title="Broker ekle" onSubmit={(event) => add("brokers", event)} />
      <MemberForm title="Agent ekle" onSubmit={(event) => add("agents", event)} />
    </section>
  );
}

function MemberForm({ title, onSubmit }: { title: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit}>
      <h3>{title}</h3>
      <input name="first_name" placeholder="Ad" required />
      <input name="last_name" placeholder="Soyad" required />
      <input name="email" type="email" placeholder="E-posta" required />
      <input name="phone" placeholder="Telefon" />
      <button className="btn btn-primary" type="submit">
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

async function portalSend(url: string, payload: unknown, method = "POST"): Promise<{ message?: string }> {
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
