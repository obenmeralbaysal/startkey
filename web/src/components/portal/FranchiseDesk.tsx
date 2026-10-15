"use client";

import { FormEvent, useEffect, useState } from "react";

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

type Presence = "active" | "hidden" | "passive" | "archived";

type DeskOffice = {
  id: number;
  name: string;
  presence: Presence;
  currency: string;
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
  const [offices, setOffices] = useState<DeskOffice[]>([]);
  const [message, setMessage] = useState("");

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
    setMessage(body.message || (response.ok ? "Kaydedildi." : "İşlem tamamlanamadı."));
    if (response.ok) reload();
  }

  const current = offices.filter((office) => office.presence !== "archived");
  const archived = offices.filter((office) => office.presence === "archived");

  return (
    <section className="glass-card">
      <h2>Ofisler</h2>
      {message ? <p>{message}</p> : null}
      {current.length === 0 ? <p>Kayıtlı ofis yok.</p> : null}
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
    <article>
      <h3>
        {office.name} — {presenceLabel(office.presence)}
      </h3>
      <p>{presenceText(office.presence)}</p>
      <p>
        Danışman {office.consultant_count} · Bakiye {money(office.balance)} · Portföy {limitText(office.limits.portfolios)} ·
        Danışman limiti {limitText(office.limits.users)}
      </p>
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
      <p>Yeni portföyler bu para birimiyle açılır. Mevcut portföyler ve StartKey faturaları aynı kalır.</p>
      <h4>StartKey sitesindeki portföyler</h4>
      {office.portfolios.length === 0 ? <p>Sitede portföy yok.</p> : null}
      {office.portfolios.map((portfolio) => (
        <p key={portfolio.id}>
          {portfolio.title}
          {portfolio.held ? " — siteden kaldırıldı" : ""}
          <button
            className="glass-btn-lite"
            type="button"
            onClick={() => send(`/api/v1/portal/portfolios/${portfolio.id}/catalogue`, { held: !portfolio.held })}
          >
            {portfolio.held ? "Kaldırmayı geri al" : "Siteden kaldır"}
          </button>
        </p>
      ))}
      <h4>StartKey ödemeleri</h4>
      {office.invoices.map((invoice) => (
        <form
          key={invoice.id}
          onSubmit={(event) => {
            event.preventDefault();
            const amount = new FormData(event.currentTarget).get("amount");
            send(`/api/v1/portal/invoices/${invoice.id}/payments`, { amount });
          }}
        >
          <p>
            {invoice.invoice_no} — {invoice.description} — {statusLabel(invoice.status)} — {money(invoice.outstanding)} / {money(invoice.total)}
            {invoice.due_at ? ` — vade ${invoice.due_at}` : ""}
          </p>
          {invoice.outstanding > 0 ? (
            <>
              <input name="amount" type="number" min="0.01" step="0.01" placeholder="Tahsil edilen" required />
              <button className="glass-btn-lite" type="submit">
                Ödemeyi kaydet
              </button>
            </>
          ) : null}
        </form>
      ))}
      <form onSubmit={(event) => submitInvoice(event, office.id, send)}>
        <input name="description" placeholder="Fatura açıklaması" required />
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="Tutar, KDV hariç" required />
        <button className="glass-btn-lite" type="submit">
          Fatura kes
        </button>
      </form>
      <h4>Limit artışı</h4>
      {office.limit_requests.map((row) => (
        <p key={row.id}>
          {resourceLabel(row.resource)} +{row.quantity} — {row.note} — {requestLabel(row.status)}
        </p>
      ))}
      <form onSubmit={(event) => submitLimit(event, office.id, send)}>
        <select name="resource" defaultValue="portfolios">
          {RESOURCES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input name="quantity" type="number" min="1" step="1" placeholder="Ek adet" required />
        <input name="note" placeholder="Gerekçe" required />
        <button className="glass-btn-lite" type="submit">
          Limit artışı talep et
        </button>
      </form>
    </article>
  );
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
