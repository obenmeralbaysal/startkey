"use client";

import { createContext, useContext } from "react";

import type { OfficeMembership } from "@/components/portal/office/access";
import { isRecord, text, type OfficeRecord } from "@/components/portal/office/api";

export type OfficeState = {
  officeId: number;
  office: OfficeMembership;
  isAdmin: boolean;
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
  if (Array.isArray(value)) {
    return <RecordTable rows={value.filter(isRecord)} />;
  }
  if (!isRecord(value)) {
    return <p>{value == null ? "" : String(value)}</p>;
  }
  const entries = Object.entries(value).filter(([key, item]) => !SKIP.has(key) && item != null && typeof item !== "function");
  return (
    <dl className="glass-stack">
      {entries.map(([key, item]) => (
        <div key={key}>
          <dt className="glass-label">{key}</dt>
          <dd>{isRecord(item) || Array.isArray(item) ? <RecordView value={item} /> : format(item)}</dd>
        </div>
      ))}
    </dl>
  );
}

function format(value: unknown) {
  if (typeof value === "string" && value.startsWith("/api/v1/portal/media/")) {
    return <img alt="" src={value} style={{ maxWidth: 180, borderRadius: 12 }} />;
  }
  if (typeof value === "boolean") {
    return value ? "Evet" : "Hayır";
  }
  return String(value);
}

export function RecordTable({ rows, href }: { rows: OfficeRecord[]; href?: (row: OfficeRecord) => string }) {
  if (rows.length === 0) {
    return <p className="glass-muted">Kayıt yok.</p>;
  }
  return (
    <table className="glass-table">
      <tbody>
        {rows.map((row) => {
          const id = String(row.id ?? text(row, ["title", "name"]));
          const label = text(row, ["title", "name", "applicant_name", "office_name", "status"]);
          const extra = text(row, ["status", "price", "phone", "email", "type"]);
          return (
            <tr key={id}>
              <td>
                {href ? <a href={href(row)}>{label || id}</a> : label || id}
              </td>
              <td className="glass-muted">{extra === label ? "" : extra}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Notice({ message }: { message: string }) {
  if (!message) {
    return null;
  }
  return <p className={message.startsWith("Hata") ? "glass-error" : "glass-muted"}>{message}</p>;
}
