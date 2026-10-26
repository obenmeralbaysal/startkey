"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type InputHTMLAttributes } from "react";

import type { OfficeMembership } from "@/components/portal/office/access";
import { isRecord, text, type OfficeRecord } from "@/components/portal/office/api";
import { hasWatermarkedMedia, WatermarkBadge } from "@/components/portal/office/watermark";
import { Icon, Sheet } from "@/components/portal/shell";

export type OfficeState = {
  officeId: number;
  office: OfficeMembership;
  isAdmin: boolean;
  firstName: string;
  notice: (message: string) => void;
  reload: () => void;
};

const OfficeContext = createContext<OfficeState | null>(null);

export const OfficeProvider = OfficeContext.Provider;

export function useOffice(): OfficeState {
  const value = useContext(OfficeContext);
  if (!value) {
    throw new Error("Ofis seçilmedi.");
  }
  return value;
}

const SKIP = new Set(["password", "token", "access_token", "remember_token", "media"]);

export function RecordView({ value }: { value: unknown }) {
  if (value === undefined) {
    return <Skeleton />;
  }
  if (Array.isArray(value)) {
    return <RecordTable rows={value.filter(isRecord)} />;
  }
  if (!isRecord(value)) {
    return value == null || value === "" ? null : <p className="glass-value">{String(value)}</p>;
  }
  const entries = Object.entries(value).filter(([key, item]) => !SKIP.has(key) && item != null && typeof item !== "function");
  if (entries.length === 0) {
    return null;
  }
  return (
    <dl className="glass-dl">
      {entries.map(([key, item]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{isRecord(item) || Array.isArray(item) ? <RecordView value={item} /> : format(item)}</dd>
        </div>
      ))}
    </dl>
  );
}

function format(value: unknown) {
  if (typeof value === "string" && value.startsWith("/api/v1/portal/media/")) {
    return <img alt="" src={value} />;
  }
  if (typeof value === "boolean") {
    return value ? "Evet" : "Hayır";
  }
  return String(value);
}

export function RecordTable({ rows, href, loading = false }: { rows: OfficeRecord[]; href?: (row: OfficeRecord) => string; loading?: boolean }) {
  if (loading) {
    return <Skeleton />;
  }
  if (rows.length === 0) {
    return <EmptyState />;
  }
  return (
    <ul className="glass-list">
      {rows.map((row) => {
        const id = String(row.id ?? text(row, ["title", "name"]));
        const label = text(row, typeof row.title === "string" && row.title ? ["title"] : ["first_name", "name", "applicant_name", "office_name", "status"]);
        const extra = text(row, ["status", "price", "phone", "email", "type"]);
        const body = (
          <>
            <strong>{label || id}</strong>
            {extra === label ? null : <span>{extra}</span>}
            <WatermarkBadge flagged={hasWatermarkedMedia(row)} compact />
            {href ? <Icon name="chevronRight" /> : null}
          </>
        );
        return (
          <li key={id}>
            {href ? <Link className="glass-list-row" href={href(row)}>{body}</Link> : <div className="glass-list-row">{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export function Notice({ message }: { message: string }) {
  if (!message) {
    return null;
  }
  return <p className="glass-notice" data-tone={message.startsWith("Hata") ? "error" : "info"}>{message}</p>;
}

export function Skeleton({ lines = 4, label = "Yükleniyor" }: { lines?: number; label?: string }) {
  return (
    <div className="glass-skeleton" aria-busy="true" aria-label={label}>
      {Array.from({ length: lines }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function EmptyState({ message = "Kayıt yok." }: { message?: string }) {
  return (
    <div className="glass-empty">
      <Icon name="tray" />
      <p>{message}</p>
    </div>
  );
}

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);

  function toggle() {
    const input = ref.current;
    const focused = input !== null && document.activeElement === input;
    const start = input?.selectionStart ?? null;
    const end = input?.selectionEnd ?? null;
    setVisible((value) => !value);
    if (focused && start !== null && end !== null) {
      requestAnimationFrame(() => input.setSelectionRange(start, end));
    }
  }

  return (
    <span className="glass-password">
      <input {...props} ref={ref} type={visible ? "text" : "password"} />
      <button
        className="glass-eye"
        type="button"
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        aria-pressed={visible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
      >
        <Icon name={visible ? "eyeOff" : "eye"} />
      </button>
    </span>
  );
}

export function ConfirmButton({ label, message, onConfirm }: { label: string; message: string; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="glass-btn-danger" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>{label}</button>
      <Sheet open={open} onClose={() => setOpen(false)} className="glass-confirm">
        <div className="glass-hero-icon"><Icon name="alert" /></div>
        <h2>Emin misiniz?</h2>
        <p>{message}</p>
        <div className="glass-actions">
          <button className="glass-btn-lite" type="button" onClick={() => setOpen(false)}>Vazgeç</button>
          <button className="glass-btn-danger" type="button" onClick={() => { setOpen(false); onConfirm(); }}>{label}</button>
        </div>
      </Sheet>
    </>
  );
}
