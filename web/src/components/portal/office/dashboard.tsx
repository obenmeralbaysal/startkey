"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { canViewEarnings, officeLabel, roleOf } from "@/components/portal/office/access";
import { isRecord, OfficeError, officeCall } from "@/components/portal/office/api";
import { useOffice } from "@/components/portal/office/ui";
import { Icon } from "@/components/portal/shell";
import { formatMoney, formatNumber } from "@/components/portal/charts";
import { PORTAL_UX_COPY } from "@/content/portal-ux";
import {
  QUICK_ACTIONS,
  appointmentLines,
  earningsDeepLink,
  dashboardMeta,
  greetingTitle,
  officeCaption,
  pendingWorkLabel,
  showPendingCard,
  summaryFigures,
  withLang,
} from "@/lib/portal-ux";

type Row = Record<string, unknown>;

function useOfficeData(path: string | null) {
  const { officeId } = useOffice();
  const [data, setData] = useState<Row | null | undefined>(undefined);
  const [denied, setDenied] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (path === null) {
      setData(null);
      setDenied(false);
      return;
    }
    let cancelled = false;
    setData(undefined);
    setDenied(false);
    officeCall(path, officeId)
      .then((payload) => {
        if (!cancelled) setData(isRecord(payload.data) ? payload.data : payload);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDenied(error instanceof OfficeError && error.status === 403);
        setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path, officeId, version]);
  return { data, denied, reload: () => setVersion((value) => value + 1) };
}

export function OfficeDashboard() {
  const { office, firstName, jobTitle, locale } = useOffice();
  const role = roleOf(office);
  const showEarnings = canViewEarnings(role, office);
  const copy = PORTAL_UX_COPY[locale];
  const officeStats = useOfficeData("dashboard/stats");
  const personalStats = useOfficeData(officeStats.denied ? "dashboard/agent-stats" : null);
  const stats = officeStats.denied ? personalStats : officeStats;
  const meta = dashboardMeta(officeStats.data);
  const pendingAllowed = showPendingCard(meta, role, officeStats.denied);
  const pending = useOfficeData(pendingAllowed ? "dashboard/pending-approvals" : null);
  const pendingClosed = officeStats.denied || pending.denied;
  const showPending = pendingAllowed && !pending.denied;
  const appointments = useOfficeData("appointments");
  const figures = summaryFigures(stats.data === undefined ? null : stats.data, showPending && pending.data !== undefined ? pending.data : null, showEarnings);
  const loading = stats.data === undefined;
  const showMatches = figures.matches != null;
  const showEarningsCard = showEarnings && figures.earnings != null;
  const today = appointmentLines(appointments.data, new Date(), locale);
  const pendingText = pendingWorkLabel(loading ? "—" : formatNumber(figures.pending), locale);
  const actions = [
    { id: "portfolio", title: copy.newPortfolio, hint: copy.newPortfolioHint, icon: "plus" as const, tone: "red" },
    { id: "contact", title: copy.newContact, hint: copy.newContactHint, icon: "person" as const, tone: "navy" },
    { id: "demand", title: copy.newDemand, hint: copy.newDemandHint, icon: "search" as const, tone: "navy" },
    { id: "appointment", title: copy.appointment, hint: copy.appointmentHint, icon: "calendar" as const, tone: "navy" },
  ];

  return (
    <div className="ux-summary" data-role={role}>
      <header className="ux-hello">
        <div>
          <h1>{greetingTitle(new Date().getHours(), firstName, locale)}</h1>
          <p>{officeCaption(officeLabel(office), jobTitle, locale)}</p>
        </div>
        <Link className="ux-create" href={withLang("/portal/office/portfolios/new", locale)}>+ {copy.newPortfolio}</Link>
      </header>

      <div className="ux-actions">
        {actions.map((action) => {
          const target = QUICK_ACTIONS.find((entry) => entry.id === action.id);
          return (
            <Link key={action.id} className="ux-action" href={withLang(target?.href ?? "/portal/office", locale)}>
              <span className="ux-action-icon" data-tone={action.tone}><Icon name={action.icon} /></span>
              <span><strong>{action.title}</strong><small>{action.hint}</small></span>
            </Link>
          );
        })}
      </div>

      <div className="ux-kpis" data-count={(showPending ? 1 : 0) + (showEarningsCard ? 1 : 0) + (showMatches ? 1 : 0) + 1}>
        <Kpi label={copy.activePortfolios} value={loading ? "—" : formatNumber(figures.active)} hint={figures.activeDelta == null ? "" : `+${formatNumber(figures.activeDelta)} ${copy.thisMonth}`} tone={figures.activeDelta == null ? undefined : "up"} href={withLang("/portal/office/portfolios", locale)} />
        {showPending ? <Kpi label={copy.pending} value={loading ? "—" : formatNumber(figures.pending)} hint={copy.review} href={withLang("/portal/office/portfolios", locale)} /> : null}
        {showMatches ? <Kpi label={copy.newMatches} value={loading ? "—" : formatNumber(figures.matches ?? 0)} hint={figures.matchesAreWeek ? copy.last7 : ""} href={withLang("/portal/office/matches", locale)} /> : null}
        {showEarningsCard ? (
          <Kpi label={copy.monthEarnings} value={loading ? "—" : formatMoney(figures.earnings ?? 0)} hint={figures.closings == null ? "" : `${formatNumber(figures.closings)} ${copy.closings}`} href={withLang(earningsDeepLink(role), locale)} />
        ) : null}
      </div>

      {showPending || pendingClosed ? (
        <p className="ux-pending-line">
          <Link className="ux-pending" href={withLang("/portal/office/portfolios", locale)}>{pendingText}</Link>
        </p>
      ) : null}

      <div className="ux-split">
        <section className="ux-panel">
          <div className="ux-split-head"><h2>{copy.todayTitle}</h2></div>
          {appointments.data === undefined ? <p className="ux-muted">…</p> : today.length === 0 ? <p className="ux-muted">{copy.noAppointments}</p> : (
            <ul>
              {today.map((line) => (
                <li key={line.id}>
                  <div className="ux-row">
                    <time>{line.time}</time>
                    <span><strong>{line.title}</strong>{line.meta ? <small>{line.meta}</small> : null}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, href, tone }: { label: string; value: string; hint: string; href: string; tone?: "up" }) {
  return (
    <Link className="ux-kpi" href={href}>
      <small>{label}</small>
      <strong>{value}</strong>
      {hint ? <em data-tone={tone}>{hint}</em> : null}
    </Link>
  );
}
