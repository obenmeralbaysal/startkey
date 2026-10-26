"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PORTAL_NETWORK_COPY } from "@/content/portal-network";
import { officeCall } from "@/components/portal/office/api";
import { ApiLoadError, loadFailure, networkFailureView } from "@/components/portal/office/api-error";
import { EmptyState, Skeleton } from "@/components/portal/office/ui";
import { AppShell, Icon, initials, type ShellLink } from "@/components/portal/shell";
import {
  consultantTitle,
  formatUpdatedAt,
  mockConsultantPage,
  mockOfficePage,
  mockSummary,
  networkApiUrl,
  networkHref,
  networkHome,
  NETWORK_MENU,
  networkRole,
  networkUsesMock,
  networkWriteControls,
  officeConsultantsHref,
  openNetworkHome,
  pageStatus,
  sectionFromParts,
  sectionFromPath,
  showNetworkPortal,
  toConsultant,
  toOffice,
  toPage,
  toSummary,
  networkLang,
  NETWORK_OFFICE_DENIED,
} from "@/lib/portal-network";
import type { Locale } from "@/lib/locales";
import type { NetworkConsultant, NetworkOffice, NetworkPage, NetworkPagination, NetworkQuery, NetworkRole, NetworkSection, NetworkSummary } from "@/types/portal-network";

type Gate = {
  status: "loading" | "ready";
  first: string;
  last: string;
  role: NetworkRole;
};

export function NetworkApp({ parts }: { parts: string[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const lang = networkLang(params.get("lang"));
  const copy = PORTAL_NETWORK_COPY[lang];
  const active = sectionFromParts(parts) ?? sectionFromPath(pathname);
  const [gate, setGate] = useState<Gate>(() => networkUsesMock()
    ? { status: "ready", first: "Ada", last: "Yılmaz", role: "franchise_admin" }
    : { status: "loading", first: "", last: "", role: "franchise_staff" });

  useEffect(() => {
    document.title = copy.title;
    document.documentElement.lang = copy.htmlLang;
  }, [copy.htmlLang, copy.title]);

  useEffect(() => {
    if (networkUsesMock()) {
      setGate({ status: "ready", first: "Ada", last: "Yılmaz", role: "franchise_admin" });
      return;
    }
    let cancelled = false;
    (async () => {
      const session = await fetch("/api/v1/portal/session", { credentials: "include", headers: { Accept: "application/json" } });
      if (!session.ok) {
        window.location.href = "/portal";
        return;
      }
      const body = (await session.json()) as { data?: { user?: unknown } };
      const user = body.data?.user ?? {};
      let payload: unknown = user;
      if (!openNetworkHome(user)) {
        try {
          payload = await officeCall("me", null);
        } catch {
          payload = user;
        }
      }
      if (cancelled) return;
      if (!openNetworkHome(payload) && !openNetworkHome(user)) {
        window.location.href = "/portal";
        return;
      }
      const record = user && typeof user === "object" ? user as Record<string, unknown> : {};
      const source = showNetworkPortal(payload) ? payload : user;
      setGate({
        status: "ready",
        first: typeof record.first_name === "string" ? record.first_name : "",
        last: typeof record.last_name === "string" ? record.last_name : "",
        role: networkRole(source) ?? "franchise_staff",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (gate.status === "loading") {
    return <Loading label={copy.loading} />;
  }

  const links: ShellLink[] = NETWORK_MENU.map((item) => ({
    href: networkHref(item.section, { lang }),
    label: copy[item.section],
    icon: item.icon,
    current: item.section === active,
  }));

  async function logout() {
    await fetch("/api/v1/portal/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/portal";
  }

  return (
    <AppShell
      links={links}
      primary={3}
      homeHref={networkHome(lang)}
      footer={
        <div className="glass-side-group">
          <div className="glass-who">
            <span className="glass-avatar">{initials(gate.first, gate.last)}</span>
            <span>
              <strong>{`${gate.first} ${gate.last}`.trim() || copy.summary}</strong>
              <small>{gate.role === "franchise_admin" ? copy.roleAdmin : copy.roleStaff}</small>
            </span>
          </div>
          <button className="glass-nav-item" type="button" onClick={logout}>
            <Icon name="logout" />
            <span>{copy.logout}</span>
          </button>
        </div>
      }
    >
      <div className="glass-view" data-writes={networkWriteControls().length} data-network={active ?? "missing"}>
        <div className="glass-network-head">
          <LanguageRow section={active} lang={lang} />
          <button className="glass-network-logout" type="button" onClick={logout}>{copy.logout}</button>
        </div>
        {active === null ? (
          <section className="glass-card">
            <EmptyState message={copy.unknown} />
          </section>
        ) : active === "summary" ? (
          <SummaryScreen lang={lang} />
        ) : active === "offices" ? (
          <OfficeScreen lang={lang} />
        ) : (
          <ConsultantScreen lang={lang} />
        )}
      </div>
    </AppShell>
  );
}

function LanguageRow({ section, lang }: { section: NetworkSection | null; lang: Locale }) {
  const params = useSearchParams();
  const current = section ?? "summary";
  return (
    <nav className="glass-lang-row" aria-label="Language">
      {(["tr", "en", "de"] as const).map((code) => (
        <Link
          key={code}
          href={networkHref(current, {
            lang: code,
            q: params.get("q") ?? undefined,
            office_id: params.get("office_id") ?? undefined,
            page: params.get("page") ?? undefined,
          })}
          aria-current={code === lang ? "true" : undefined}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

function SummaryScreen({ lang }: { lang: Locale }) {
  const copy = PORTAL_NETWORK_COPY[lang];
  const state = useNetwork("summary", {}, lang);
  if (state.kind === "loading") return <Skeleton label={copy.loading} />;
  if (state.kind === "denied") return <OfficeDenied lang={lang} offices={copy.offices} />;
  if (state.kind === "error") return <ErrorState message={state.message || copy.error} retry={copy.retry} onRetry={state.retry} />;
  const summary = state.data as NetworkSummary;
  const cards = [
    [copy.officesCount, summary.offices],
    [copy.consultantsCount, summary.consultants],
    [copy.portfolios, summary.active_portfolios],
    [copy.branches, summary.branches],
  ] as const;
  return (
    <section>
      <h1>{copy.summary}</h1>
      <div className="glass-kpis glass-kpis-5">
        {cards.map(([label, value]) => (
          <article key={label} className="glass-kpi">
            <small>{label}</small>
            <strong>{new Intl.NumberFormat(lang === "en" ? "en-GB" : lang).format(value)}</strong>
          </article>
        ))}
        <article className="glass-kpi glass-kpi-text">
          <small>{copy.updated}</small>
          <strong>{formatUpdatedAt(summary.updated_at, lang)}</strong>
        </article>
      </div>
    </section>
  );
}

function OfficeScreen({ lang }: { lang: Locale }) {
  const copy = PORTAL_NETWORK_COPY[lang];
  const params = useSearchParams();
  const query = useMemo(() => ({
    q: params.get("q") ?? undefined,
    page: params.get("page") ?? undefined,
    lang,
  }), [lang, params]);
  const state = useNetwork("offices", query, lang);
  return (
    <section>
      <h1>{copy.offices}</h1>
      <SearchBox lang={lang} section="offices" placeholder={copy.searchOffices} />
      <NetworkFailure lang={lang} copy={copy} state={state} />
      {state.kind === "ready" ? <OfficeList lang={lang} page={state.data as NetworkPage<NetworkOffice>} empty={copy.empty} /> : null}
    </section>
  );
}

function ConsultantScreen({ lang }: { lang: Locale }) {
  const copy = PORTAL_NETWORK_COPY[lang];
  const params = useSearchParams();
  const query = useMemo(() => ({
    q: params.get("q") ?? undefined,
    page: params.get("page") ?? undefined,
    office_id: params.get("office_id") ?? undefined,
    lang,
  }), [lang, params]);
  const state = useNetwork("consultants", query, lang);
  const options = useOfficeOptions();
  return (
    <section>
      <h1>{copy.consultants}</h1>
      <div className="glass-network-tools">
        <SearchBox lang={lang} section="consultants" placeholder={copy.searchConsultants} />
        <OfficeFilter lang={lang} options={options} />
      </div>
      <NetworkFailure lang={lang} copy={copy} state={state} />
      {state.kind === "ready" ? <ConsultantList lang={lang} page={state.data as NetworkPage<NetworkConsultant>} empty={copy.empty} /> : null}
    </section>
  );
}

function OfficeList({ lang, page, empty }: { lang: Locale; page: NetworkPage<NetworkOffice>; empty: string }) {
  const copy = PORTAL_NETWORK_COPY[lang];
  if (page.data.length === 0) return <EmptyState message={empty} />;
  return (
    <>
      <ul className="glass-list">
        {page.data.map((office) => (
          <li key={office.id}>
            <Link className="glass-list-row glass-network-row" href={officeConsultantsHref(office.id, lang)}>
              <Mark label={office.name} src={office.logo} />
              <span>
                <strong>{office.name}</strong>
                <span>{[office.city, ownerLine(office), `${office.consultant_count} ${copy.consultantsCount}`, `${office.portfolio_count} ${copy.portfolios}`].filter(Boolean).join(" · ")}</span>
              </span>
              <Icon name="chevronRight" />
            </Link>
          </li>
        ))}
      </ul>
      <Pager lang={lang} section="offices" pagination={page.pagination} />
    </>
  );
}

function ownerLine(office: NetworkOffice): string {
  const owners = office.owners && office.owners.length > 0 ? office.owners : office.owner ? [office.owner] : [];
  return owners
    .map((owner) => (owner.title ? `${owner.name} (${owner.title})` : owner.name))
    .filter(Boolean)
    .join(", ");
}

function ConsultantList({ lang, page, empty }: { lang: Locale; page: NetworkPage<NetworkConsultant>; empty: string }) {
  const copy = PORTAL_NETWORK_COPY[lang];
  if (page.data.length === 0) return <EmptyState message={empty} />;
  return (
    <>
      <ul className="glass-list">
        {page.data.map((row) => (
          <li key={row.id}>
            <div className="glass-list-row glass-network-row">
              <Mark label={row.name} src={row.photo} />
              <span>
                <strong>{row.name}</strong>
                <span>{[consultantTitle(row.title, lang), row.office?.name, `${row.portfolio_count} ${copy.portfolios}`].filter(Boolean).join(" · ")}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <Pager lang={lang} section="consultants" pagination={page.pagination} />
    </>
  );
}

function SearchBox({ lang, section, placeholder }: { lang: Locale; section: "offices" | "consultants"; placeholder: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const officeId = params.get("office_id") ?? "";
  const [draft, setDraft] = useState(q);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  useEffect(() => {
    if (draft === q) return;
    const timer = window.setTimeout(() => {
      router.replace(networkHref(section, {
        lang,
        q: draft,
        office_id: officeId || undefined,
      }));
    }, 275);
    return () => window.clearTimeout(timer);
  }, [draft, lang, officeId, q, router, section]);

  return (
    <label className="glass-field">
      <span>{placeholder}</span>
      <input
        className="glass-input"
        type="search"
        value={draft}
        enterKeyHint="search"
        onChange={(event) => setDraft(event.target.value)}
      />
    </label>
  );
}

function OfficeFilter({ lang, options }: { lang: Locale; options: NetworkOffice[] }) {
  const copy = PORTAL_NETWORK_COPY[lang];
  const params = useSearchParams();
  const router = useRouter();
  const selected = params.get("office_id") ?? "";
  const known = options.some((office) => String(office.id) === selected);
  return (
    <label className="glass-field">
      <span>{copy.officeFilter}</span>
      <select
        value={selected}
        onChange={(event) => {
          const officeId = event.target.value;
          router.push(networkHref("consultants", {
            lang,
            q: params.get("q") ?? undefined,
            office_id: officeId || undefined,
          }));
        }}
      >
        <option value="">{copy.allOffices}</option>
        {!known && selected ? <option value={selected}>{selected}</option> : null}
        {options.map((office) => (
          <option key={office.id} value={office.id}>{office.name}</option>
        ))}
      </select>
    </label>
  );
}

function Pager({ lang, section, pagination }: { lang: Locale; section: "offices" | "consultants"; pagination: NetworkPagination }) {
  const copy = PORTAL_NETWORK_COPY[lang];
  const params = useSearchParams();
  const pages = Math.max(pagination.total_pages, 1);
  const query = {
    lang,
    q: params.get("q") ?? undefined,
    office_id: params.get("office_id") ?? undefined,
  };
  return (
    <nav className="glass-pager" aria-label={copy.pagination}>
      {pagination.current_page > 1 ? (
        <Link className="glass-btn-lite" href={networkHref(section, { ...query, page: String(pagination.current_page - 1) })}>{copy.previous}</Link>
      ) : (
        <span className="glass-btn-lite" aria-disabled="true">{copy.previous}</span>
      )}
      <span>{pageStatus(copy.pageLabel, pagination.current_page, pages)}</span>
      {pagination.current_page < pagination.total_pages ? (
        <Link className="glass-btn-lite" href={networkHref(section, { ...query, page: String(pagination.current_page + 1) })}>{copy.next}</Link>
      ) : (
        <span className="glass-btn-lite" aria-disabled="true">{copy.next}</span>
      )}
    </nav>
  );
}

function NetworkFailure({ lang, copy, state }: { lang: Locale; copy: (typeof PORTAL_NETWORK_COPY)["tr"]; state: LoadState }) {
  if (state.kind === "loading") return <Skeleton label={copy.loading} />;
  if (state.kind === "denied") return <OfficeDenied lang={lang} offices={copy.offices} />;
  if (state.kind === "error") return <ErrorState message={state.message || copy.error} retry={copy.retry} onRetry={state.retry} />;
  return null;
}

function OfficeDenied({ lang, offices }: { lang: Locale; offices: string }) {
  return (
    <div className="glass-card" role="status">
      <h2>{NETWORK_OFFICE_DENIED}</h2>
      <Link className="glass-btn" href={networkHref("offices", { lang })}>{offices}</Link>
    </div>
  );
}

function ErrorState({ message, retry, onRetry }: { message: string; retry: string; onRetry: () => void }) {
  return (
    <div className="glass-card" role="alert">
      <p className="glass-error">{message}</p>
      <button className="glass-btn-lite" type="button" onClick={onRetry}>{retry}</button>
    </div>
  );
}

function Mark({ label, src }: { label: string; src: string | null }) {
  if (src) return <img className="glass-network-mark" alt="" src={src} />;
  const letters = label.trim().slice(0, 2).toLocaleUpperCase("tr-TR");
  return <span className="glass-network-mark">{letters || "?"}</span>;
}

function Loading({ label }: { label: string }) {
  return (
    <main className="glass-loading" aria-busy="true" aria-label={label}>
      <img className="glass-logo" alt="StartKey" src="/portal/img/startkey_logo.png" />
      <span className="glass-spinner" />
    </main>
  );
}

type LoadState =
  | { kind: "loading"; retry: () => void }
  | { kind: "denied"; retry: () => void }
  | { kind: "error"; message: string; retry: () => void }
  | { kind: "ready"; data: NetworkSummary | NetworkPage<NetworkOffice> | NetworkPage<NetworkConsultant>; retry: () => void };

function useNetwork(section: NetworkSection, query: NetworkQuery, lang: Locale): LoadState {
  const [attempt, setAttempt] = useState(0);
  const retry = useMemo(() => () => setAttempt((value) => value + 1), []);
  const page = query.page ?? "";
  const q = query.q ?? "";
  const officeId = query.office_id ?? "";
  const request = { lang, page: page || undefined, q: q || undefined, office_id: officeId || undefined };
  const [state, setState] = useState<LoadState>(() => networkUsesMock()
    ? { kind: "ready", data: mockSection(section, request), retry }
    : { kind: "loading", retry });

  useEffect(() => {
    let cancelled = false;
    const next = { lang, page: page || undefined, q: q || undefined, office_id: officeId || undefined };
    if (networkUsesMock()) {
      setState({ kind: "ready", data: mockSection(section, next), retry });
      return;
    }
    setState({ kind: "loading", retry });
    loadSection(section, next)
      .then((data) => {
        if (!cancelled) setState({ kind: "ready", data, retry });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const view = networkFailureView(error, "", NETWORK_OFFICE_DENIED);
        if (view.view === "denied") {
          setState({ kind: "denied", retry });
          return;
        }
        setState({ kind: "error", message: view.message, retry });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, lang, officeId, page, q, retry, section]);

  return state;
}

function useOfficeOptions(): NetworkOffice[] {
  const [rows, setRows] = useState<NetworkOffice[]>(() => networkUsesMock() ? mockOfficePage({}).data : []);
  useEffect(() => {
    if (networkUsesMock()) return;
    let cancelled = false;
    loadSection("offices", {})
      .then((page) => {
        if (!cancelled) setRows((page as NetworkPage<NetworkOffice>).data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return rows;
}

function mockSection(section: NetworkSection, query: NetworkQuery): NetworkSummary | NetworkPage<NetworkOffice> | NetworkPage<NetworkConsultant> {
  if (section === "summary") return mockSummary();
  if (section === "offices") return mockOfficePage(query);
  return mockConsultantPage(query);
}

async function loadSection(section: NetworkSection, query: NetworkQuery): Promise<NetworkSummary | NetworkPage<NetworkOffice> | NetworkPage<NetworkConsultant>> {
  if (networkUsesMock()) return mockSection(section, query);
  const body = await readJson(networkApiUrl(section, query));
  if (section === "summary") return toSummary(body);
  if (section === "offices") return toPage(body, toOffice);
  return toPage(body, toConsultant);
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiLoadError(loadFailure(response.status, body, ""));
  }
  return body;
}
