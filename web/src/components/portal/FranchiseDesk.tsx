"use client";

import { FormEvent, useEffect, useState } from "react";

import { EmptyState, PasswordInput, Skeleton } from "@/components/portal/office/ui";
import { OfficePinEditor } from "@/components/portal/OfficePinEditor";
import { useToast } from "@/components/portal/shell";

type LimitCell = { used: number; limit: number };

type DeskPortfolio = { id: number; title: string; held: boolean };

type DeskInvoice = {
  id: number;
  invoice_no: string;
  status: string;
  total: number;
  outstanding: number;
  due_at: string | null;
  description: string | null;
};

type DeskLimit = { id: number; resource: string; quantity: number; note: string; status: string };

type DeskUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string | null;
};

type Presence = "active" | "hidden" | "passive" | "archived";

type DeskOffice = {
  id: number;
  name: string;
  presence: Presence;
  currency: string;
  latitude?: number | null;
  longitude?: number | null;
  consultant_count: number;
  balance: number;
  limits: Record<"portfolios" | "users" | "contacts" | "branches", LimitCell>;
  portfolios: DeskPortfolio[];
  invoices: DeskInvoice[];
  limit_requests: DeskLimit[];
};

const RESOURCES = [
  ["portfolios", "Portföy"],
  ["users", "Danışman"],
  ["contacts", "Kişi"],
  ["branches", "Şube"],
] as const;

const PRESENCES: Array<[Presence, string]> = [
  ["active", "Aktif"],
  ["hidden", "Gizli"],
  ["passive", "Pasif"],
  ["archived", "Arşiv"],
];

const CURRENCIES = ["TRY", "USD", "EUR", "GBP", "AZN"];

export function FranchiseDesk() {
  const [offices, setOffices] = useState<DeskOffice[] | null>(null);
  const toast = useToast();

  function reload() {
    portalGet<DeskOffice[]>("/api/v1/portal/desk/offices").then(setOffices);
  }

  useEffect(() => {
    reload();
  }, []);

  async function send(url: string, payload: unknown, method = "POST") {
    const response = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    toast(body.message || (response.ok ? "Kaydedildi." : "İşlem tamamlanamadı."), response.ok ? "info" : "error");
    if (response.ok) reload();
  }

  const current = (offices ?? []).filter((office) => office.presence !== "archived");
  const archived = (offices ?? []).filter((office) => office.presence === "archived");

  return (
    <section className="glass-card" id="ofisler">
      <h2>Ofisler</h2>
      {offices === null ? <Skeleton /> : current.length === 0 ? <EmptyState message="Kayıtlı ofis yok." /> : null}
      {current.map((office) => (
        <OfficeCard key={office.id} office={office} send={send} />
      ))}
      {archived.length > 0 ? <h2>Arşiv</h2> : null}
      {archived.map((office) => (
        <OfficeCard key={office.id} office={office} send={send} />
      ))}
    </section>
  );
}

function OfficeCard({
  office,
  send,
}: {
  office: DeskOffice;
  send: (url: string, payload: unknown, method?: string) => void;
}) {
  return (
    <article className="glass-card">
      <div className="glass-card-head">
        <h3>{office.name}</h3>
        <span className="glass-pill" data-tone={office.presence}>{presenceLabel(office.presence)}</span>
      </div>
      <p className="glass-muted">{presenceText(office.presence)}</p>
      <div className="glass-stats">
        <div className="glass-stat">
          <small>Danışman</small>
          <strong>{office.consultant_count}</strong>
        </div>
        <div className="glass-stat">
          <small>Bakiye</small>
          <strong>{money(office.balance)}</strong>
        </div>
        <div className="glass-stat">
          <small>Portföy</small>
          <strong>{limitText(office.limits.portfolios)}</strong>
          <Meter cell={office.limits.portfolios} />
        </div>
        <div className="glass-stat">
          <small>Danışman limiti</small>
          <strong>{limitText(office.limits.users)}</strong>
          <Meter cell={office.limits.users} />
        </div>
      </div>
      <div className="glass-fields">
        <label>
          Durum
          <select
            value={office.presence}
            onChange={(event) =>
              send(`/api/v1/portal/offices/${office.id}/presence`, { presence: event.target.value }, "PUT")
            }
          >
            {PRESENCES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Portföy para birimi
          <select
            value={office.currency || "TRY"}
            onChange={(event) =>
              send(`/api/v1/portal/offices/${office.id}/currency`, { currency: event.target.value }, "PUT")
            }
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="glass-muted">Yeni portföyler bu para birimiyle açılır. Mevcut portföyler ve StartKey faturaları aynı kalır.</p>
      <OfficePinEditor
        officeId={office.id}
        latitude={office.latitude ?? null}
        longitude={office.longitude ?? null}
        send={send}
      />
      <OfficeUsers officeId={office.id} />
      <div className="glass-section">
        <h4>StartKey sitesindeki portföyler</h4>
        {office.portfolios.length === 0 ? <p className="glass-muted">Sitede portföy yok.</p> : null}
        {office.portfolios.map((portfolio) => (
          <div key={portfolio.id} className="glass-item">
            <p>
              {portfolio.title}
              {portfolio.held ? <span className="glass-muted"> — siteden kaldırıldı</span> : null}
            </p>
            <button
              className="glass-btn-lite"
              type="button"
              onClick={() => send(`/api/v1/portal/portfolios/${portfolio.id}/catalogue`, { held: !portfolio.held })}
            >
              {portfolio.held ? "Kaldırmayı geri al" : "Siteden kaldır"}
            </button>
          </div>
        ))}
      </div>
      <div className="glass-section">
        <h4>StartKey ödemeleri</h4>
        {office.invoices.map((invoice) => (
          <form
            key={invoice.id}
            className="glass-item"
            onSubmit={(event) => {
              event.preventDefault();
              const amount = new FormData(event.currentTarget).get("amount");
              send(`/api/v1/portal/invoices/${invoice.id}/payments`, { amount });
            }}
          >
            <p>
              <strong>{invoice.invoice_no}</strong> — {invoice.description}
              <br />
              <span className="glass-muted">
                {money(invoice.outstanding)} / {money(invoice.total)}
                {invoice.due_at ? ` — vade ${invoice.due_at}` : ""}
              </span>
            </p>
            <span className="glass-pill" data-tone={invoiceTone(invoice.status)}>{statusLabel(invoice.status)}</span>
            {invoice.outstanding > 0 ? (
              <div className="glass-fields">
                <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="Tahsil edilen" required />
                <button className="glass-btn-lite" type="submit">
                  Ödemeyi kaydet
                </button>
              </div>
            ) : null}
          </form>
        ))}
        <form className="glass-fields" onSubmit={(event) => submitInvoice(event, office.id, send)}>
          <input name="description" placeholder="Fatura açıklaması" required />
          <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="Tutar, KDV hariç" required />
          <button className="glass-btn-lite" type="submit">
            Fatura kes
          </button>
        </form>
      </div>
      <div className="glass-section">
        <h4>Limit artışı</h4>
        {office.limit_requests.map((row) => (
          <div key={row.id} className="glass-item">
            <p>
              {resourceLabel(row.resource)} +{row.quantity} — {row.note}
            </p>
            <span className="glass-pill" data-tone={row.status === "done" ? "active" : row.status === "rejected" ? "passive" : "hidden"}>{requestLabel(row.status)}</span>
          </div>
        ))}
        <form className="glass-fields" onSubmit={(event) => submitLimit(event, office.id, send)}>
          <select name="resource" defaultValue="portfolios">
            {RESOURCES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input name="quantity" type="number" inputMode="numeric" min="1" step="1" placeholder="Ek adet" required />
          <input name="note" placeholder="Gerekçe" required />
          <button className="glass-btn-lite" type="submit">
            Limit artışı talep et
          </button>
        </form>
      </div>
    </article>
  );
}

function OfficeUsers({ officeId }: { officeId: number }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<DeskUser[] | null>(null);
  const toast = useToast();

  async function load() {
    const response = await fetch(`/api/v1/portal/offices/${officeId}/users`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast(body.message || "Kullanıcılar yüklenemedi.", "error");
      setUsers([]);
      return;
    }
    setUsers(Array.isArray(body.data) ? body.data : []);
  }

  async function save(url: string, payload: unknown, form: HTMLFormElement, clear: boolean) {
    const response = await fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    toast(body.message || (response.ok ? "Kaydedildi." : "İşlem tamamlanamadı."), response.ok ? "info" : "error");
    if (response.ok) {
      if (clear) form.reset();
      await load();
    }
  }

  return (
    <div className="glass-section">
      <h4>Kullanıcılar</h4>
      <button
        className="glass-btn-lite"
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open && users === null) void load();
        }}
      >
        {open ? "Listeyi gizle" : "Kullanıcıları göster"}
      </button>
      {open && users === null ? <Skeleton /> : null}
      {open && users !== null && users.length === 0 ? <p className="glass-muted">Bu ofiste kullanıcı yok.</p> : null}
      {open
        ? users?.map((user) => (
            <div key={`${user.id}-${user.email}-${user.first_name}-${user.phone ?? ""}`} className="glass-item">
              <p>
                <strong>
                  {user.first_name} {user.last_name}
                </strong>
                <span className="glass-muted"> — {roleLabel(user.role)}</span>
                <br />
                <span className="glass-muted">{user.email}</span>
              </p>
              <form
                className="glass-fields"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  void save(
                    `/api/v1/portal/offices/${officeId}/users/${user.id}`,
                    {
                      first_name: data.get("first_name"),
                      last_name: data.get("last_name"),
                      email: data.get("email"),
                      phone: data.get("phone") || null,
                    },
                    form,
                    false,
                  );
                }}
              >
                <input name="first_name" defaultValue={user.first_name} placeholder="Ad" required />
                <input name="last_name" defaultValue={user.last_name} placeholder="Soyad" required />
                <input name="email" type="email" defaultValue={user.email} placeholder="E-posta" required />
                <input name="phone" defaultValue={user.phone ?? ""} placeholder="Telefon" />
                <button className="glass-btn-lite" type="submit">
                  Bilgileri kaydet
                </button>
              </form>
              <form
                className="glass-fields"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const password = String(new FormData(form).get("password") || "");
                  void save(`/api/v1/portal/offices/${officeId}/users/${user.id}/password`, { password }, form, true);
                }}
              >
                <PasswordInput name="password" placeholder="Yeni şifre" autoComplete="new-password" minLength={8} required />
                <button className="glass-btn-lite" type="submit">
                  Şifreyi kaydet
                </button>
              </form>
            </div>
          ))
        : null}
    </div>
  );
}

function roleLabel(role: string | null): string {
  if (role === "owner") return "Broker";
  if (role === "agent") return "Danışman";
  if (role === "office_manager" || role === "manager") return "Ofis yöneticisi";
  return role || "Üye";
}

function Meter({ cell }: { cell: LimitCell }) {
  if (cell.limit < 0) {
    return null;
  }
  const ratio = cell.limit === 0 ? 1 : Math.min(1, cell.used / cell.limit);
  return (
    <span className="glass-meter" data-full={ratio >= 1} role="meter" aria-valuemin={0} aria-valuemax={cell.limit} aria-valuenow={cell.used}>
      <span style={{ width: `${Math.round(ratio * 100)}%` }} />
    </span>
  );
}

function invoiceTone(status: string): string {
  if (status === "paid") return "active";
  if (status === "overdue") return "passive";
  if (status === "cancelled") return "";
  return "hidden";
}

function submitInvoice(event: FormEvent<HTMLFormElement>, officeId: number, send: (url: string, payload: unknown) => void) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  send(`/api/v1/portal/offices/${officeId}/invoices`, {
    description: form.get("description"),
    amount: form.get("amount"),
  });
  event.currentTarget.reset();
}

function submitLimit(event: FormEvent<HTMLFormElement>, officeId: number, send: (url: string, payload: unknown) => void) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  send(`/api/v1/portal/offices/${officeId}/limit-requests`, {
    resource: form.get("resource"),
    quantity: form.get("quantity"),
    note: form.get("note"),
  });
  event.currentTarget.reset();
}

function money(value: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

function limitText(cell: LimitCell): string {
  return cell.limit < 0 ? `${cell.used} / sınırsız` : `${cell.used} / ${cell.limit}`;
}

function resourceLabel(resource: string): string {
  return RESOURCES.find(([value]) => value === resource)?.[1] ?? resource;
}

function presenceLabel(presence: Presence): string {
  return PRESENCES.find(([value]) => value === presence)?.[1] ?? presence;
}

function presenceText(presence: Presence): string {
  if (presence === "hidden") return "Portal açık. StartKey sitesinde görünmez.";
  if (presence === "passive") return "Portal kapalı. StartKey sitesinde görünmez. Askı kalkınca geri döner.";
  if (presence === "archived") return "Ofis kapanmıştır. Geçmiş ve borç durur. Yeniden açmak aktife alır.";
  return "Portal açık. StartKey sitesinde görünür.";
}

function statusLabel(status: string): string {
  if (status === "paid") return "Ödendi";
  if (status === "partially_paid") return "Kısmi ödeme";
  if (status === "overdue") return "Gecikti";
  if (status === "cancelled") return "İptal";
  return "Ödenmedi";
}

function requestLabel(status: string): string {
  if (status === "done") return "Karşılandı";
  if (status === "rejected") return "Reddedildi";
  return "Bekliyor";
}

async function portalGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  return (body.data ?? []) as T;
}
