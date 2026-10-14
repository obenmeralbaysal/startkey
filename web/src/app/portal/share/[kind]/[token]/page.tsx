"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { errorText, isRecord, publicCall, type OfficeRecord } from "@/components/portal/office/api";
import { RecordView } from "@/components/portal/office/ui";

export default function SharePage() {
  const params = useParams<{ kind: string; token: string }>();
  const kind = params.kind;
  const token = params.token;
  const path = kind === "showcase" ? `showcase/${token}` : kind === "intake" ? `intake/${token}` : `magic-links/${token}`;
  const [data, setData] = useState<OfficeRecord | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    publicCall(path).then(setData).catch((error: Error) => setMessage(error.message));
  }, [path]);

  async function send(suffix: string, body: unknown) {
    try {
      const payload = await publicCall(`${path}${suffix}`, { method: "POST", body });
      setMessage(typeof payload.message === "string" ? payload.message : "Kaydedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errorText({}));
    }
  }

  const record = isRecord(data?.data) ? data.data : data;
  return (
    <main className="glass-login">
      <section className="glass-panel">
        <img className="glass-logo" alt="Logo" src="/portal/img/startkey_logo.png" />
        <h1>{kind === "intake" ? "İlan bilgisi" : kind === "showcase" ? "Vitrin" : "Sunum"}</h1>
        {message ? <p className="glass-muted">{message}</p> : null}
        <RecordView value={record} />
        {kind === "presentation" ? (
          <button className="glass-btn" type="button" onClick={() => send("/interest", {})}>İlgileniyorum</button>
        ) : null}
        {kind === "showcase" ? (
          <form onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("/appointments", { starts_at: form.get("starts_at"), note: form.get("note") });
          }}>
            <input name="starts_at" type="datetime-local" required />
            <input name="note" placeholder="Not" />
            <button className="glass-btn" type="submit">Randevu iste</button>
          </form>
        ) : null}
        {kind === "intake" ? (
          <form onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("/submit", { category_id: Number(form.get("category_id")), notes: form.get("notes") });
          }}>
            <select name="category_id" required defaultValue="">
              <option value="">Kategori</option>
              {Array.isArray(record?.categories) ? record.categories.filter(isRecord).map((item) => (
                <option key={String(item.id)} value={String(item.id)}>{String(item.name ?? item.id)}</option>
              )) : null}
            </select>
            <textarea name="notes" placeholder="Not" />
            <button className="glass-btn" type="submit">Gönder</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
