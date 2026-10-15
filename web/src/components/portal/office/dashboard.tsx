"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { canVerify, roleOf } from "@/components/portal/office/access";
import { isRecord, officeCall, type OfficeRecord } from "@/components/portal/office/api";
import { EmptyState, Skeleton, useOffice } from "@/components/portal/office/ui";
import { ChartCard, ComboChart, formatMoney, formatNumber } from "@/components/portal/charts";
import { Icon, Sheet, type IconName } from "@/components/portal/shell";

type Row = Record<string, unknown>;

function useOfficeData(path: string | null) {
  const { officeId } = useOffice();
  const [data, setData] = useState<Row | null | undefined>(undefined);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (path === null) {
      setData(null);
      return;
    }
    let cancelled = false;
    setData((current) => (current === null ? undefined : current));
    officeCall(path, officeId)
      .then((payload) => {
        if (!cancelled) setData(isRecord(payload.data) ? payload.data : payload);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path, officeId, version]);
  return { data, reload: () => setVersion((value) => value + 1) };
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function group(data: Row | null | undefined, key: string): Row {
  const value = data?.[key];
  return isRecord(value) ? value : {};
}

function list(data: Row | null | undefined, key: string): Row[] {
  const value = data?.[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export function OfficeDashboard() {
  const { office, firstName } = useOffice();
  const role = roleOf(office);
  if (role === "agent") return <AgentDashboard firstName={firstName} />;
  return <ManagerDashboard />;
}

function ManagerDashboard() {
  const stats = useOfficeData("dashboard/stats");
  const [seekersOpen, setSeekersOpen] = useState(false);
  const data = stats.data;
  const portfolios = group(data, "portfolios");
  const closings = group(data, "closings");
  const demands = group(data, "demands");
  const seekers = group(data, "seekers");
  const appointments = group(data, "appointments");
  const financials = isRecord(data?.financials) ? data.financials : null;

  return (
    <div className="glass-dashboard">
      <header className="glass-page-head">
        <h1>Genel Bakış</h1>
        <p className="glass-muted">İşletmenizin performansını ve güncel durumunu takip edin.</p>
      </header>

      <PendingApprovals />
      <RequestedRevisions />
      <DutyToday />

      {data === undefined ? <KpiSkeleton /> : (
        <div className="glass-kpis glass-kpis-5">
          <Kpi label="Toplam Portföy" value={num(portfolios.total)} icon="building" />
          <Kpi label="Aktif Portföy" value={num(portfolios.active)} icon="home" href="/portal/office/portfolios" />
          <Kpi label="Portföy Arayanı" value={num(seekers.total)} icon="people" onClick={() => setSeekersOpen(true)} />
          <Kpi label="Aktif Talepler" value={num(demands.total)} icon="search" href="/portal/office/demands" />
          <Kpi label="Bu Ay Kapanış" value={num(closings.this_month)} icon="check" href="/portal/office/reports" />
        </div>
      )}

      <QuickActions upcoming={num(appointments.upcoming)} demands={num(demands.total)} />

      {financials ? (
        <section className="glass-dark">
          <div className="glass-dark-head">
            <span><Icon name="chart" /> Finansal Özet <em>BU AY</em></span>
            <Link href="/portal/office/earnings">Detaylı Rapor</Link>
          </div>
          <div className="glass-dark-grid">
            <div><small>Hizmet Bedeli</small><strong>{formatMoney(num(financials.income))}</strong></div>
            <div><small>Satılık Ciro</small><strong>{formatMoney(num(financials.sale_volume))}</strong></div>
            <div><small>Kiralık Ciro</small><strong>{formatMoney(num(financials.rent_volume))}</strong></div>
            <div className="glass-dark-accent">
              <small>Kapanışlar</small>
              <strong>{formatNumber(num(closings.this_month))} <span>bu ay</span></strong>
              <p>Toplam başarılı: <b>{formatNumber(num(closings.total_success))}</b></p>
            </div>
          </div>
        </section>
      ) : null}

      <VisualsPanel />

      <Sheet open={seekersOpen} title="Portföy Aramaları" onClose={() => setSeekersOpen(false)}>
        <ul className="glass-list">
          {[
            ["total", "Toplam arama"],
            ["contacted", "Dönüş yapılan"],
            ["pending_contact", "Dönüş bekleyen"],
            ["with_demand", "Talep oluşturulan"],
            ["without_demand", "Talep oluşturulmayan"],
            ["contacted_without_demand", "Dönüş yapıldı, talep yok"],
          ].map(([key, label]) => (
            <li key={key}><div className="glass-list-row"><strong>{label}</strong><span className="glass-list-num">{formatNumber(num(seekers[key]))}</span></div></li>
          ))}
        </ul>
        <Link className="glass-btn-lite glass-block" href="/portal/office/portfolios" onClick={() => setSeekersOpen(false)}>Portföylere git</Link>
      </Sheet>
    </div>
  );
}

function AgentDashboard({ firstName }: { firstName: string }) {
  const stats = useOfficeData("dashboard/agent-stats");
  const data = stats.data;
  const portfolios = group(data, "portfolios");
  const closings = group(data, "closings");
  const financials = group(data, "financials");
  const demands = group(data, "demands");
  const seekers = group(data, "seekers");
  const appointments = group(data, "appointments");
  const recent = list(data, "recent_portfolios");
  const upcoming = list(data, "upcoming_appointments");

  return (
    <div className="glass-dashboard">
      <header className="glass-page-head">
        <h1>{`Merhaba, ${firstName}`.trim()}</h1>
        <p className="glass-muted">Günlük özetiniz ve portföy durumunuz aşağıda.</p>
      </header>

      <PendingApprovals />
      <RequestedRevisions />
      <DutyToday />

      {data === undefined ? <KpiSkeleton /> : (
        <div className="glass-kpis glass-kpis-5">
          <Kpi label="Portföylerim" value={num(portfolios.total)} icon="building" href="/portal/office/portfolios" />
          <Kpi label="Aktif İlanlar" value={num(portfolios.active)} icon="home" href="/portal/office/portfolios" />
          <Kpi label="Portföy Arayanı" value={num(seekers.total)} icon="people" href="/portal/office/portfolios" />
          <Kpi label="Aktif Talepler" value={num(demands.total)} icon="search" href="/portal/office/demands" />
          <Kpi label="Yaklaşan Randevular" value={num(appointments.upcoming)} icon="calendar" href="/portal/office/calendar" />
        </div>
      )}

      <QuickActions upcoming={num(appointments.upcoming)} demands={num(demands.total)} />

      <div className="glass-chart-grid glass-chart-grid-wide">
        <section className="glass-card">
          <div className="glass-head">
            <h3>Son Portföylerim</h3>
            <Link className="glass-link" href="/portal/office/portfolios">Tümü</Link>
          </div>
          {data === undefined ? <Skeleton /> : recent.length === 0 ? <EmptyState message="Henüz portföy eklemediniz." /> : (
            <ul className="glass-list">
              {recent.map((row) => (
                <li key={str(row.id)}>
                  <Link className="glass-list-row" href={`/portal/office/portfolios/${str(row.id)}`}>
                    <strong>{str(row.title)}<small className="glass-row-sub">{row.type === "sale" ? "Satılık" : "Kiralık"}</small></strong>
                    <span className="glass-list-num">{formatMoney(num(row.price))}<StatusBadge status={str(row.status)} /></span>
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="glass-card">
          <div className="glass-head">
            <h3>Yaklaşan Randevular</h3>
            <Link className="glass-link" href="/portal/office/calendar">Tümü</Link>
          </div>
          {data === undefined ? <Skeleton /> : upcoming.length === 0 ? <EmptyState message="Yaklaşan randevunuz bulunmuyor." /> : (
            <ul className="glass-list">
              {upcoming.map((row) => {
                const date = new Date(str(row.starts_at).replace(" ", "T"));
                return (
                  <li key={str(row.id)}>
                    <div className="glass-list-row">
                      <span className="glass-date">
                        <small>{date.toLocaleDateString("tr-TR", { month: "short" })}</small>
                        <b>{date.getDate()}</b>
                      </span>
                      <strong>
                        {str(row.title)}
                        <small className="glass-row-sub">
                          {[str(row.contact_name), date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })].filter(Boolean).join(" · ")}
                        </small>
                      </strong>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="glass-dark">
        <div className="glass-dark-head"><span><Icon name="check" /> Portföy Durumu</span></div>
        <div className="glass-dark-grid">
          <div><small>Toplam</small><strong>{formatNumber(num(portfolios.total))}</strong></div>
          <div><small>Aktif</small><strong className="glass-green">{formatNumber(num(portfolios.active))}</strong></div>
          <div><small>Kapanış</small><strong className="glass-red">{formatNumber(num(closings.total_success))}</strong></div>
          <div><small>Hizmet Bedeli</small><strong className="glass-purple">{formatMoney(num(financials.income))}</strong></div>
        </div>
      </section>

      <VisualsPanel />
    </div>
  );
}

function Kpi({ label, value, icon, href, onClick }: { label: string; value: number; icon: IconName; href?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="glass-kpi-icon"><Icon name={icon} /></span>
      <small>{label}</small>
      <strong>{formatNumber(value)}</strong>
    </>
  );
  if (onClick) return <button type="button" className="glass-kpi" onClick={onClick}>{body}</button>;
  if (href) return <Link className="glass-kpi" href={href}>{body}</Link>;
  return <div className="glass-kpi">{body}</div>;
}

function KpiSkeleton() {
  return (
    <div className="glass-kpis glass-kpis-5">
      {Array.from({ length: 5 }, (_, index) => <div key={index} className="glass-kpi"><Skeleton lines={2} /></div>)}
    </div>
  );
}

function QuickActions({ upcoming, demands }: { upcoming: number; demands: number }) {
  return (
    <div className="glass-actions-grid">
      <Link className="glass-action" data-tone="red" href="/portal/office/portfolios/new">
        <span className="glass-action-icon"><Icon name="plus" /></span>
        <span><strong>Yeni Portföy Ekle</strong><small>Yeni bir ilan girişi yapın</small></span>
        <Icon name="chevronRight" />
      </Link>
      <Link className="glass-action" data-tone="purple" href="/portal/office/demands">
        <span className="glass-action-icon"><Icon name="search" /></span>
        <span><strong>Müşteri Talepleri</strong><small>{`Aktif talepler: ${formatNumber(demands)}`}</small></span>
        <Icon name="chevronRight" />
      </Link>
      <Link className="glass-action" data-tone="orange" href="/portal/office/calendar">
        <span className="glass-action-icon"><Icon name="calendar" /></span>
        <span><strong>Takvim</strong><small>{`${formatNumber(upcoming)} yaklaşan etkinlik`}</small></span>
        <Icon name="chevronRight" />
      </Link>
    </div>
  );
}

function waitingLabel(seconds: number): string {
  if (seconds < 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)}g ${hours % 24}s`;
  if (hours > 0) return `${hours}s ${minutes}dk`;
  return `${Math.max(1, minutes)}dk`;
}

function PendingApprovals() {
  const { office } = useOffice();
  const allowed = canVerify(office);
  const pending = useOfficeData(allowed ? "dashboard/pending-approvals" : null);
  const [tab, setTab] = useState<"activate" | "close">("activate");
  const data = pending.data;
  const counts = group(data, "counts");
  const activations = list(data, "pending_activations");
  const closings = list(data, "pending_closings");
  const commission = num(counts.commission_rates ?? list(data, "commission_rate_changes").length);
  const portfolioTotal = num(counts.activations) + num(counts.closings);

  useEffect(() => {
    if (activations.length === 0 && closings.length > 0) setTab("close");
  }, [activations.length, closings.length]);

  if (!allowed || !data || portfolioTotal + commission === 0) return null;
  const items = tab === "activate" ? activations : closings;

  return (
    <section className="glass-card glass-widget">
      <div className="glass-head">
        <div>
          <h3>Onay Bekleyenler</h3>
          <p className="glass-muted glass-chart-sub">Aktife alma ve kapama işlemlerini buradan inceleyin.</p>
        </div>
      </div>
      {commission > 0 ? (
        <Link className="glass-inline-link" href="/portal/office/settings/commission">Hizmet bedeli oranı onayı ({formatNumber(commission)})</Link>
      ) : null}
      {portfolioTotal > 0 ? (
        <>
          <Segmented
            value={tab}
            onChange={(value) => setTab(value as "activate" | "close")}
            options={[["activate", `Aktife Alma (${formatNumber(num(counts.activations))})`], ["close", `Kapanışlar (${formatNumber(num(counts.closings))})`]]}
          />
          {items.length === 0 ? <EmptyState message="Bu sekmede bekleyen kayıt yok." /> : (
            <ul className="glass-list">
              {items.map((item) => (
                <li key={`${str(item.stage)}-${str(item.id)}`}>
                  <Link className="glass-list-row" href={`/portal/office/portfolios/${str(item.id)}`}>
                    <strong>
                      {str(item.title)}
                      {item.self_approval_blocked ? <em className="glass-tag">Kendi İlanınız</em> : null}
                      <small className="glass-row-sub">
                        {[
                          str(item.agent_name),
                          item.price != null ? formatMoney(num(item.price)) : "—",
                          item.commission != null ? `Kom. ${formatMoney(num(item.commission))}` : "",
                          waitingLabel(num(item.waiting_seconds)),
                        ].filter(Boolean).join(" · ")}
                      </small>
                    </strong>
                    <span className="glass-btn-lite glass-btn-sm">İncele</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}

function RequestedRevisions() {
  const revisions = useOfficeData("dashboard/my-revisions");
  const [tab, setTab] = useState<"activate" | "close">("activate");
  const data = revisions.data;
  const counts = group(data, "counts");
  const activations = list(data, "activation_revisions");
  const closings = list(data, "closing_revisions");
  const total = num(counts.total ?? num(counts.activations) + num(counts.closings));

  useEffect(() => {
    if (activations.length === 0 && closings.length > 0) setTab("close");
  }, [activations.length, closings.length]);

  if (!data || total === 0) return null;
  const items = tab === "activate" ? activations : closings;

  return (
    <section className="glass-card glass-widget" data-tone="red">
      <div className="glass-head">
        <div>
          <h3>Düzeltme Bekleyen İşlemlerim</h3>
          <p className="glass-muted glass-chart-sub">Onaycı geri bildirimlerini buradan düzeltip tekrar gönderin.</p>
        </div>
      </div>
      <Segmented
        value={tab}
        onChange={(value) => setTab(value as "activate" | "close")}
        options={[["activate", `Aktife Alma Revizyonları (${formatNumber(num(counts.activations))})`], ["close", `Kapanış Revizyonları (${formatNumber(num(counts.closings))})`]]}
      />
      {items.length === 0 ? <EmptyState message="Bu sekmede düzeltme bekleyen kayıt yok." /> : (
        <ul className="glass-stack">
          {items.map((item) => {
            const rejected = list(item, "rejected_items");
            return (
              <li key={`${str(item.stage)}-${str(item.id)}`} className="glass-item glass-revision">
                <p>
                  <strong>{str(item.title)}</strong>
                  {item.verifier_name ? <small className="glass-row-sub">Onaycı: {str(item.verifier_name)}</small> : null}
                </p>
                {rejected.length > 0 ? (
                  <div className="glass-feedback">
                    <small>Onaycı Geri Bildirimi</small>
                    <ul>
                      {rejected.map((row, index) => (
                        <li key={index}><b>{str(row.requirement_title)}:</b> {str(row.rejection_reason)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Link className="glass-btn-danger glass-btn-sm" href={`/portal/office/portfolios/${str(item.id)}`}>Düzelt ve Tekrar Gönder</Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function DutyToday() {
  const duty = useOfficeData("duty-roster/today");
  const data = duty.data;
  if (!data) return null;
  const groups = list(data, "groups");
  const filled = groups.filter((row) => list(row, "users").length > 0);
  const [, month, day] = str(data.date).split("-");
  const dateLabel = `${Number(day) || ""} ${MONTHS[Number(month) - 1] ?? ""}`.trim();

  return (
    <section className="glass-card glass-widget">
      <div className="glass-head">
        <div className="glass-head-icon">
          <span className="glass-kpi-icon"><Icon name="calendar" /></span>
          <div>
            <h3>Bugünün nöbetçileri</h3>
            <p className="glass-muted glass-chart-sub">{dateLabel}</p>
          </div>
        </div>
        <Link className="glass-link" href="/portal/office/settings/duty">Nöbet listesi</Link>
      </div>
      {filled.length === 0 ? <p className="glass-muted">Bugün nöbetçi yok.</p> : filled.map((row) => (
        <div key={str(row.branch_id) || "pool"} className="glass-duty">
          {groups.length > 1 ? <h4>{str(row.branch_name)}</h4> : null}
          <div className="glass-chips">
            {list(row, "users").map((person) => (
              <span key={str(person.id)} className="glass-chip">{`${str(person.first_name)} ${str(person.last_name)}`.trim()}</span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

const SORTS: Array<[string, string]> = [
  ["ciro", "Ciro"],
  ["satilik_kapama", "Satılık Kapama"],
  ["kiralik_kapama", "Kiralık Kapama"],
  ["aktif_portfoy", "Aktif Portföy"],
];

const PERIODS: Array<[string, string]> = [
  ["month", "Bu Ay"],
  ["quarter", "Bu Çeyrek"],
  ["year", "Bu Yıl"],
  ["all_time", "Tümü"],
];

function metricLabel(row: OfficeRecord, sortBy: string): string | null {
  if (sortBy === "ciro" && (row.is_masked || row.metric_value == null)) return null;
  const value = row.metric_value;
  if (sortBy === "satilik_kapama") return `${formatNumber(num(value ?? row.sale_closings_count))} Satış`;
  if (sortBy === "kiralik_kapama") return `${formatNumber(num(value ?? row.rent_closings_count))} Kiralama`;
  if (sortBy === "aktif_portfoy") return `${formatNumber(num(value ?? row.active_portfolios_count))} Aktif`;
  return formatMoney(num(value ?? row.total_commission));
}

function VisualsPanel() {
  const [period, setPeriod] = useState("month");
  const [sortBy, setSortBy] = useState("ciro");
  const [all, setAll] = useState(false);
  const visuals = useOfficeData(`dashboard/visuals?period=${period}&sort_by=${sortBy}&limit=${all ? "all" : 10}`);
  const data = visuals.data;
  const charts = group(data, "charts");
  const months = list(charts, "months");
  const rows = list(data, "leaderboard");
  const total = num(data?.leaderboard_total ?? rows.length);
  const showFinancials = Boolean(data?.show_financials);
  const labels = months.map((row) => str(row.label));
  const loading = data === undefined;

  return (
    <div className="glass-visuals">
      <div className="glass-visuals-charts">
        <ChartCard title="Aylık Kapanış & İşlem Trendi" subtitle="Son 6 ay başarılı kapanış adedi">
          {loading && months.length === 0 ? <Skeleton /> : (
            <ComboChart labels={labels} bars={[{ name: "İşlem Adedi", color: "#ec3323", values: months.map((row) => num(row.closings_count)) }]} />
          )}
        </ChartCard>
        <ChartCard title="Portföy Büyüme Hızı" subtitle="Aylık yeni aktif portföy artışı">
          {loading && months.length === 0 ? <Skeleton /> : (
            <ComboChart labels={labels} lines={[{ name: "Yeni Aktif Portföy", color: "#0a84ff", values: months.map((row) => num(row.new_active_portfolios)) }]} area />
          )}
          <p className="glass-muted glass-chart-sub">Her ay eklenen ve hâlâ aktif olan portföy adedi</p>
        </ChartCard>
      </div>
      <section className="glass-card glass-leaderboard">
        <div className="glass-head-icon">
          <span className="glass-kpi-icon" data-tone="amber"><Icon name="chart" /></span>
          <div>
            <h3>{all ? "Performans Sıralaması" : "İlk 10 Performans"}</h3>
            <p className="glass-muted glass-chart-sub">{SORTS.find(([key]) => key === sortBy)?.[1] ?? "Performans"}</p>
          </div>
        </div>
        <div className="glass-chips">
          {SORTS.map(([key, label]) => (
            <button key={key} type="button" className="glass-chip" aria-pressed={sortBy === key} onClick={() => setSortBy(key)}>{label}</button>
          ))}
        </div>
        <Segmented value={period} onChange={setPeriod} options={PERIODS} />
        {loading && rows.length === 0 ? <Skeleton /> : rows.length === 0 ? <EmptyState message="Henüz sıralama verisi yok." /> : (
          <ol className="glass-rank">
            {rows.map((row) => {
              const metric = metricLabel(row, sortBy);
              const name = str(row.name) || `Kullanıcı #${str(row.user_id)}`;
              return (
                <li key={str(row.user_id)}>
                  <span className="glass-rank-no" data-top={num(row.rank) <= 3}>{formatNumber(num(row.rank))}</span>
                  <span className="glass-rank-name">
                    <strong>{name}</strong>
                    <small>
                      {[
                        metric ?? "Gizli",
                        sortBy !== "aktif_portfoy" ? `${formatNumber(num(row.active_portfolios_count))} Aktif` : "",
                        showFinancials && metric && sortBy !== "ciro" && row.total_commission != null ? formatMoney(num(row.total_commission)) : "",
                      ].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {total > rows.length || all ? (
          <button type="button" className="glass-btn-lite glass-block" onClick={() => setAll((value) => !value)}>
            {all ? "İlk 10" : `Tümünü Göster (${formatNumber(total)})`}
          </button>
        ) : null}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { active: "Aktif", sold: "Satıldı", rented: "Kiralandı", passive: "Pasif" };
  const tone = status === "active" ? "active" : status === "passive" ? "" : "hidden";
  return <em className="glass-pill" data-tone={tone}>{labels[status] ?? status}</em>;
}

function Segmented({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <div className="glass-segment" role="tablist">
      {options.map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}>{label}</button>
      ))}
    </div>
  );
}
