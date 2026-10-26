"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { officeCall, rows } from "@/components/portal/office/api";
import { roleOf } from "@/components/portal/office/access";
import { EmptyState, Skeleton, useOffice } from "@/components/portal/office/ui";
import { initials, Sheet } from "@/components/portal/shell";
import { PORTAL_UX_COPY } from "@/content/portal-ux";
import type { Locale } from "@/lib/locales";
import {
  approvePortfolioPath,
  canSeeAllPortfolios,
  filterPortfolios,
  keepOwnPortfolios,
  optionValues,
  portfolioCategory,
  portfolioCode,
  portfolioConsultant,
  portfolioListPath,
  portfolioPlace,
  portfolioPrice,
  portfolioRent,
  portfolioSwatch,
  portfolioTab,
  portfolioTitle,
  PORTFOLIO_TABS,
  revisionNoteMissing,
  revisionPortfolioBody,
  revisionPortfolioPath,
  showApprovalActions,
  tabCounts,
  withPortfolioStatus,
  type PortfolioRow,
  type PortfolioScope,
  type PortfolioSort,
  type PortfolioTab,
} from "@/lib/portfolio-list";
import { withLang } from "@/lib/portal-ux";

export function PortfolioList() {
  const { officeId, office, locale, notice, userId } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = copy.listings;
  const role = roleOf(office);
  const seeAll = canSeeAllPortfolios(role, office);
  const [scope, setScope] = useState<PortfolioScope>("mine");
  const [tab, setTab] = useState<PortfolioTab>("active");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [consultant, setConsultant] = useState("");
  const [sort, setSort] = useState<PortfolioSort>("");
  const [loaded, setLoaded] = useState<PortfolioRow[] | null>(null);
  const [revisionFor, setRevisionFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const payload = await officeCall(portfolioListPath(scope), officeId);
      setLoaded(rows(payload));
    } catch (error) {
      setLoaded([]);
      notice(`Hata: ${error instanceof Error ? error.message : ""}`);
    }
  }, [scope, officeId, notice]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    officeCall(portfolioListPath(scope), officeId)
      .then((payload) => {
        if (!cancelled) setLoaded(rows(payload));
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setLoaded([]);
          notice(`Hata: ${error.message}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scope, officeId, notice]);

  const scoped = useMemo(
    () => keepOwnPortfolios(loaded ?? [], userId, role === "agent" && !(seeAll && scope === "all")),
    [loaded, userId, role, seeAll, scope],
  );
  const counts = tabCounts(scoped);
  const visible = filterPortfolios(scoped, { tab, q, category, consultant, sort });
  const categories = optionValues(scoped, portfolioCategory);
  const consultants = optionValues(scoped, portfolioConsultant);
  const approve = showApprovalActions(role, tab);

  async function approveRow(id: string) {
    setLoaded((current) => (current ? withPortfolioStatus(current, id, "active") : current));
    setBusy(true);
    try {
      await officeCall(approvePortfolioPath(id), officeId, { method: "POST", body: {} });
      notice(list.approved);
      await load();
    } catch (error) {
      notice(`Hata: ${error instanceof Error ? error.message : ""}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openRevision(id: string) {
    setRevisionFor(id);
    setNote("");
    setNoteError(false);
  }

  async function sendRevision(event: FormEvent) {
    event.preventDefault();
    if (!revisionFor || revisionNoteMissing(note)) {
      setNoteError(true);
      return;
    }
    const body = revisionPortfolioBody(note);
    if (!body) {
      setNoteError(true);
      return;
    }
    setBusy(true);
    try {
      await officeCall(revisionPortfolioPath(revisionFor), officeId, { method: "POST", body });
      setLoaded((current) => (current ? withPortfolioStatus(current, revisionFor, "revision_requested") : current));
      setRevisionFor(null);
      notice(list.revisionSent);
      await load();
    } catch (error) {
      notice(`Hata: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ux-screen ux-listings" data-ready={loaded ? "listings" : undefined}>
      <header className="ux-page-head">
        <h1>{copy.portfolios}</h1>
        <div className="ux-listing-tools">
          <div className="ux-scope" role="group" aria-label={copy.portfolios}>
            <button type="button" aria-pressed={scope === "mine"} onClick={() => setScope("mine")}>{list.mine}</button>
            {seeAll ? <button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")}>{list.all}</button> : null}
          </div>
          <Link className="ux-create" href={withLang("/portal/office/portfolios/new", locale)}>+ {list.create}</Link>
        </div>
      </header>
      <div className="ux-port-tabs" role="tablist">
        {PORTFOLIO_TABS.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>
            {list.tabs[item]} ({counts[item]})
          </button>
        ))}
      </div>
      <div className="ux-port-filters">
        <label className="ux-field">
          <span className="ux-sr">{list.search}</span>
          <input value={q} placeholder={list.search} onChange={(event) => setQ(event.target.value)} />
        </label>
        <label className="ux-field">
          <span className="ux-sr">{list.category}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{list.allCategories}</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="ux-field">
          <span className="ux-sr">{list.consultant}</span>
          <select value={consultant} onChange={(event) => setConsultant(event.target.value)}>
            <option value="">{list.allConsultants}</option>
            {consultants.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="ux-field">
          <span className="ux-sr">{list.price}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as PortfolioSort)}>
            <option value="">{list.price}</option>
            <option value="price_desc">{list.priceHigh}</option>
            <option value="price_asc">{list.priceLow}</option>
          </select>
        </label>
      </div>
      <div className="ux-card">
        {loaded === null ? <Skeleton /> : visible.length === 0 ? <EmptyState message={list.empty} /> : (
          <>
            <div className="ux-port-head">
              <span>{list.portfolioColumn}</span>
              <span>{list.priceColumn}</span>
              <span>{list.consultantColumn}</span>
              <span>{list.statusColumn}</span>
            </div>
            <ul className="ux-port-list">
              {visible.map((row) => {
                const id = String(row.id ?? portfolioTitle(row));
                const name = portfolioConsultant(row);
                const parts = name.split(/\s+/).filter(Boolean);
                const photo = localPhoto(row);
                const state = portfolioTab(row.status ?? row.state) ?? tab;
                return (
                  <li key={id}>
                    <div className="ux-port-main">
                      {photo ? <img alt="" src={photo} /> : <span className="ux-port-swatch" style={{ background: portfolioSwatch(id) }} />}
                      <div>
                        <Link href={withLang(`/portal/office/portfolios/${id}`, locale)}>{portfolioTitle(row)}</Link>
                        <small className="ux-port-meta">{[portfolioCode(row), portfolioPlace(row)].filter(Boolean).join(" · ")}</small>
                      </div>
                    </div>
                    <div className="ux-port-price">{money(row, locale, list.priceMonth)}</div>
                    <div className="ux-port-person">
                      {name ? <span className="ux-port-avatar">{initials(parts[0] ?? "", parts[1] ?? "")}</span> : null}
                      <span>{name}</span>
                    </div>
                    <div className="ux-port-status">
                      <span className="ux-port-pill" data-tab={state}>{list.tabs[state]}</span>
                      {approve ? (
                        <div className="ux-port-actions">
                          <button className="ux-port-approve" type="button" disabled={busy} onClick={() => approveRow(id)}>{list.approve}</button>
                          <button className="ux-port-revise" type="button" disabled={busy} onClick={() => openRevision(id)}>{list.requestRevision}</button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      <Sheet open={revisionFor !== null} title={list.revisionTitle} onClose={() => setRevisionFor(null)}>
        <form onSubmit={sendRevision}>
          <label className="ux-field">
            <span>{list.note}</span>
            <textarea value={note} rows={4} aria-invalid={noteError} onChange={(event) => { setNote(event.target.value); setNoteError(false); }} />
            {noteError ? <small className="ux-field-error">{list.noteRequired}</small> : null}
          </label>
          <div className="glass-actions">
            <button className="glass-btn-lite" type="button" onClick={() => setRevisionFor(null)}>{list.cancel}</button>
            <button className="ux-port-approve" type="submit" disabled={busy}>{list.send}</button>
          </div>
        </form>
      </Sheet>
    </section>
  );
}

function money(row: PortfolioRow, locale: Locale, suffix: string): string {
  const amount = portfolioPrice(row);
  if (amount == null) return "";
  const formatted = new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : "tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
  return portfolioRent(row) ? `${formatted}${suffix}` : formatted;
}

function localPhoto(row: PortfolioRow): string {
  const photo = row.photo ?? row.thumbnail ?? row.image;
  return typeof photo === "string" && photo.startsWith("/") ? photo : "";
}
