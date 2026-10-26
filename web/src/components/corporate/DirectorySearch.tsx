"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";

import { directoryHref, sortTurkish, type DirectoryQueryState } from "@/lib/directory-query";
import type { DirectoryPlace, DirectoryUi } from "@/lib/corporate";

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DirectorySearch({
  basePath,
  query,
  places,
  offices,
  ui,
  foundLabel,
  hasResults,
  emptyLabel,
  children,
}: {
  basePath: string;
  query: DirectoryQueryState;
  places: DirectoryPlace[];
  offices?: { id: string; name: string }[];
  ui: DirectoryUi;
  foundLabel: string;
  hasResults: boolean;
  emptyLabel: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(query.q);
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [officeQuery, setOfficeQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const titleId = useId();
  const active = (query.il ? 1 : 0) + (query.ilce ? 1 : 0) + (query.ofis ? 1 : 0);
  const searching = query.q !== "" || query.il !== "" || query.ilce !== "" || query.ofis !== "";
  const officeChoices = [...(offices ?? [])].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const visibleOffices = officeChoices.filter((office) =>
    office.name.toLocaleLowerCase("tr").includes(officeQuery.trim().toLocaleLowerCase("tr")),
  );
  const districts = sortTurkish(
    query.il
      ? (places.find((place) => place.city === query.il)?.districts ?? [])
      : [...new Set(places.flatMap((place) => place.districts))],
  );

  useEffect(() => {
    setText(query.q);
  }, [query.q]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (text.trim() === query.q) {
      return;
    }
    const handle = window.setTimeout(() => {
      const href = directoryHref(basePath, { q: text.trim(), il: query.il, ilce: query.ilce, ofis: query.ofis });
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, 275);
    return () => window.clearTimeout(handle);
  }, [text, query.q, query.il, query.ilce, query.ofis, basePath, router]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    if (!wide) {
      document.body.style.overflow = "hidden";
    }
    dialogRef.current?.querySelector<HTMLElement>("select")?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, wide]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function apply(il: string, ilce: string, ofis = query.ofis) {
    const place = places.find((item) => item.city === il);
    const nextDistrict = il && place && !place.districts.includes(ilce) ? "" : ilce;
    const href = directoryHref(basePath, { q: query.q, il, ilce: nextDistrict, ofis });
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function clearSearch() {
    setText("");
    startTransition(() => {
      router.push(basePath, { scroll: false });
    });
  }

  function trapTab(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }
    const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) {
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <div className="sk-search-shell">
        <form className="sk-dir-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="sk-sr" htmlFor="directory-q">
            {ui.searchLabel}
          </label>
          <input
            id="directory-q"
            type="search"
            value={text}
            placeholder={ui.placeholder}
            autoComplete="off"
            onChange={(event) => setText(event.target.value)}
          />
        </form>
      </div>
      <div className="sk-dir-results" data-pending={pending ? "true" : "false"} aria-busy={pending}>
        <p className="sk-sr" aria-live="polite" aria-atomic="true">
          {pending ? ui.loadingLabel : foundLabel}
        </p>
        {hasResults ? (
          children
        ) : (
          <div className="text-center">
            {foundLabel ? <p>{foundLabel}</p> : null}
            <p>{searching ? ui.emptySearchLabel : emptyLabel}</p>
            {searching ? (
              <button type="button" className="sk-dir-clear-search" onClick={clearSearch}>
                {ui.clearSearchLabel}
              </button>
            ) : null}
          </div>
        )}
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="sk-dir-filter-btn"
        aria-label={ui.filterLabel}
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <i className="ri-filter-line" aria-hidden="true" />
        {active > 0 ? <span className="sk-dir-badge">{active}</span> : null}
      </button>
      {open ? (
        <>
          <button type="button" className="sk-dir-backdrop" aria-label={ui.closeLabel} onClick={close} />
          <div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={wide ? "sk-dir-popover" : "sk-dir-sheet"}
            onKeyDown={trapTab}
          >
            <h2 id={titleId} className="sk-dir-filter-title">
              {ui.filterLabel}
            </h2>
            <label className="sk-dir-field" htmlFor="directory-il">
              {ui.cityLabel}
              <select id="directory-il" value={query.il} onChange={(event) => apply(event.target.value, query.ilce)}>
                <option value="">{ui.cityChoose}</option>
                {places.map((place) => (
                  <option key={place.city} value={place.city}>
                    {place.city}
                  </option>
                ))}
              </select>
            </label>
            <label className="sk-dir-field" htmlFor="directory-ilce">
              {ui.districtLabel}
              <select id="directory-ilce" value={query.ilce} onChange={(event) => apply(query.il, event.target.value)}>
                <option value="">{ui.districtChoose}</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
            {offices ? (
              <label className="sk-dir-field" htmlFor="directory-ofis">
                {ui.officeLabel}
                <input
                  id="directory-ofis-search"
                  type="search"
                  value={officeQuery}
                  placeholder={ui.officeSearch}
                  autoComplete="off"
                  onChange={(event) => setOfficeQuery(event.target.value)}
                />
                <select id="directory-ofis" value={query.ofis} onChange={(event) => apply(query.il, query.ilce, event.target.value)}>
                  <option value="">{ui.officeChoose}</option>
                  {visibleOffices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button type="button" className="sk-dir-clear" onClick={() => apply("", "", "")}>
              {ui.clearLabel}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
