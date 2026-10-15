"use client";

import { useEffect, useState } from "react";

import { ChartCard, ComboChart, Donut, formatCompact, formatMoney, formatNumber, monthLabel } from "@/components/portal/charts";
import { Skeleton } from "@/components/portal/office/ui";
import { Icon, type IconName } from "@/components/portal/shell";

type Month = {
  month: string;
  sale_new: number;
  rent_new: number;
  sale_closings: number;
  rent_closings: number;
  sale_avg_price: number;
  rent_avg_price: number;
  volume: number;
  commission: number;
};

type Ranking = { id: number; name: string; closings: number; commission: number; active_portfolios: number };

type DeskStatsData = {
  offices: { total: number; presence: Record<string, number>; consultants: number };
  portfolios: { total: number; active: number; sale: number; rent: number; by_status: Record<string, number>; by_category: Record<string, number> };
  contacts: { total: number; by_type: Record<string, number> };
  closings: { year_count: number; year_volume: number; year_commission: number };
  months: Month[];
  ranking: Ranking[];
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  prospect: "Potansiyel",
  draft: "Taslak",
  pending_activation_approval: "Aktivasyon onayında",
  revisions_requested: "Düzeltme istendi",
  incomplete_data: "Eksik veri",
  pending_closing_approval: "Kapanış onayında",
  closed: "Kapandı",
};

const CONTACT_LABELS: Record<string, string> = {
  buyer: "Alıcı",
  seller: "Satıcı",
  contractor: "Müteahhit",
  tenant: "Kiracı",
  landlord: "Ev Sahibi",
  portfolio_seeker: "Portföy Arayanı",
  other: "Diğer",
};

const PRESENCE_LABELS: Record<string, string> = { active: "Aktif", hidden: "Gizli", passive: "Pasif", archived: "Arşiv" };

const BLUE = "#0a84ff";
const ORANGE = "#ff9f0a";
const GREEN = "#30d158";
const RED = "#ff375f";
const PURPLE = "#bf5af2";

function slices(map: Record<string, number> | unknown[] | undefined, labels?: Record<string, string>) {
  if (!map || Array.isArray(map)) return [];
  return Object.entries(map)
    .map(([key, value]) => ({ label: labels?.[key] ?? (key || "Kategorisiz"), value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value);
}

export function DeskStats() {
  const [data, setData] = useState<DeskStatsData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/portal/desk/stats", { credentials: "include", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.data) throw new Error("stats");
        if (!cancelled) setData(body.data as DeskStatsData);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <section className="glass-card" id="panel">
        <h2>Panel</h2>
        <p className="glass-notice" data-tone="error">İstatistikler şu an alınamadı.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="glass-dashboard" id="panel">
        <div className="glass-kpis">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="glass-kpi"><Skeleton lines={2} /></div>)}
        </div>
      </section>
    );
  }

  const labels = data.months.map((row) => monthLabel(row.month));
  const pick = (key: keyof Month) => data.months.map((row) => Number(row[key]) || 0);
  const kpis: Array<{ label: string; value: string; icon: IconName; hint?: string }> = [
    { label: "Ofis", value: formatNumber(data.offices.total), icon: "grid", hint: `${formatNumber(data.offices.presence.active ?? 0)} aktif` },
    { label: "Danışman", value: formatNumber(data.offices.consultants), icon: "people" },
    { label: "Portföy", value: formatNumber(data.portfolios.total), icon: "building", hint: `${formatNumber(data.portfolios.active)} aktif` },
    { label: "Kişi", value: formatNumber(data.contacts.total), icon: "person" },
    { label: "Bu yıl kapanış", value: formatNumber(data.closings.year_count), icon: "check" },
    { label: "Bu yıl hizmet bedeli", value: `₺${formatCompact(data.closings.year_commission)}`, icon: "wallet", hint: `Hacim ₺${formatCompact(data.closings.year_volume)}` },
  ];

  return (
    <div className="glass-dashboard" id="panel">
      <header className="glass-page-head">
        <h1>Panel</h1>
        <p className="glass-muted">StartKey ağının portföy, kişi ve kapanış görünümü. Son 12 ay.</p>
      </header>

      <div className="glass-kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-kpi">
            <span className="glass-kpi-icon"><Icon name={kpi.icon} /></span>
            <small>{kpi.label}</small>
            <strong>{kpi.value}</strong>
            {kpi.hint ? <em>{kpi.hint}</em> : null}
          </div>
        ))}
      </div>

      <div className="glass-chart-grid">
        <ChartCard title="Tüm portföyler" subtitle="Ana kategoriye göre">
          <Donut data={slices(data.portfolios.by_category)} />
        </ChartCard>
        <ChartCard title="Portföy durumları">
          <Donut data={slices(data.portfolios.by_status, STATUS_LABELS)} />
        </ChartCard>
        <ChartCard title="Satılık ve kiralık">
          <Donut data={[{ label: "Satılık", value: data.portfolios.sale }, { label: "Kiralık", value: data.portfolios.rent }]} />
        </ChartCard>
        <ChartCard title="Kişiler" subtitle="Kişi tipine göre. Bir kişi birden fazla tipte olabilir.">
          <Donut data={slices(data.contacts.by_type, CONTACT_LABELS)} total={formatNumber(data.contacts.total)} />
        </ChartCard>
      </div>

      <h2 className="glass-section-title">Satılık portföyler</h2>
      <div className="glass-chart-grid glass-chart-grid-wide">
        <ChartCard title="Satılık portföyler" subtitle="Ay içinde eklenen portföy ve satış kapanışı">
          <ComboChart
            labels={labels}
            bars={[{ name: "Yeni portföy", color: BLUE, values: pick("sale_new") }]}
            lines={[{ name: "Satış kapanışı", color: RED, values: pick("sale_closings") }]}
          />
        </ChartCard>
        <ChartCard title="Satılık ortalama fiyat" subtitle="Ay içinde eklenen TL portföyler">
          <ComboChart labels={labels} lines={[{ name: "Ortalama fiyat", color: GREEN, values: pick("sale_avg_price") }]} area lineTooltipFormat={formatMoney} />
        </ChartCard>
      </div>

      <h2 className="glass-section-title">Kiralık portföyler</h2>
      <div className="glass-chart-grid glass-chart-grid-wide">
        <ChartCard title="Kiralık portföyler" subtitle="Ay içinde eklenen portföy ve kiralama kapanışı">
          <ComboChart
            labels={labels}
            bars={[{ name: "Yeni portföy", color: ORANGE, values: pick("rent_new") }]}
            lines={[{ name: "Kiralama kapanışı", color: RED, values: pick("rent_closings") }]}
          />
        </ChartCard>
        <ChartCard title="Kiralık ortalama fiyat" subtitle="Ay içinde eklenen TL portföyler">
          <ComboChart labels={labels} lines={[{ name: "Ortalama kira", color: ORANGE, values: pick("rent_avg_price") }]} area lineTooltipFormat={formatMoney} />
        </ChartCard>
      </div>

      <h2 className="glass-section-title">Kapanış ve hizmet bedeli</h2>
      <div className="glass-chart-grid glass-chart-grid-wide">
        <ChartCard title="Kapanış hacmi ve hizmet bedeli" subtitle="Başarılı kapanışlar">
          <ComboChart
            labels={labels}
            bars={[{ name: "Kapanış hacmi", color: BLUE, values: pick("volume") }]}
            lines={[{ name: "Hizmet bedeli", color: PURPLE, values: pick("commission") }]}
            tooltipFormat={formatMoney}
            lineTooltipFormat={formatMoney}
          />
        </ChartCard>
        <ChartCard title="Ofis sıralaması" subtitle="Bu yıl hizmet bedeline göre">
          {data.ranking.length === 0 ? (
            <div className="glass-chart-empty">Henüz veri yok.</div>
          ) : (
            <ol className="glass-rank">
              {data.ranking.map((row, index) => (
                <li key={row.id}>
                  <span className="glass-rank-no" data-top={index < 3}>{index + 1}</span>
                  <span className="glass-rank-name">
                    <strong>{row.name}</strong>
                    <small>{formatNumber(row.closings)} kapanış · {formatNumber(row.active_portfolios)} aktif portföy</small>
                  </span>
                  <b>₺{formatCompact(row.commission)}</b>
                </li>
              ))}
            </ol>
          )}
        </ChartCard>
      </div>

      <div className="glass-chips">
        {Object.entries(data.offices.presence).map(([key, value]) => (
          <span key={key} className="glass-pill" data-tone={key}>{PRESENCE_LABELS[key] ?? key} {formatNumber(value)}</span>
        ))}
      </div>
    </div>
  );
}
