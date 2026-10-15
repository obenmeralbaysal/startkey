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
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    publicCall(path).then(setData).catch((error: Error) => { setFailed(true); setMessage(error.message); });
  }, [path]);

  async function send(suffix: string, body: unknown) {
    setPending(true);
    try {
      const payload = await publicCall(`${path}${suffix}`, { method: "POST", body });
      setFailed(false);
      setMessage(typeof payload.message === "string" ? payload.message : "Kaydedildi.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : errorText({}));
    } finally {
      setPending(false);
    }
  }

  const record = isRecord(data?.data) ? data.data : data;
  return (
    <main className="glass-login">
      <section className="glass-panel glass-share">
        <img className="glass-logo" alt="Logo" src="/portal/img/startkey_logo.png" />
        <h1>{kind === "intake" ? "İlan bilgisi" : kind === "showcase" ? "Vitrin" : "Sunum"}</h1>
        {message ? <p className="glass-notice" data-tone={failed ? "error" : "info"} role="status">{message}</p> : null}
        <RecordView value={data === null && !failed ? undefined : record} />
        {kind === "presentation" ? (
          <button className="glass-btn" type="button" disabled={pending} aria-busy={pending} onClick={() => send("/interest", {})}>İlgileniyorum</button>
        ) : null}
        {kind === "showcase" ? (
          <form className="glass-stack" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("/appointments", { starts_at: form.get("starts_at"), note: form.get("note") });
          }}>
            <input name="starts_at" type="datetime-local" required />
            <input name="note" placeholder="Not" />
            <button className="glass-btn" type="submit" disabled={pending} aria-busy={pending}>Randevu iste</button>
          </form>
        ) : null}
        {kind === "intake" ? (
          <form className="glass-stack" onSubmit={(event) => {
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
            <button className="glass-btn" type="submit" disabled={pending} aria-busy={pending}>Gönder</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
