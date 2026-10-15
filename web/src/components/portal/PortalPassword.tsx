"use client";

import Link from "next/link";
import { useState } from "react";

import {
  PORTAL_EMAIL_PATTERN,
  PORTAL_LOGIN_COPY,
  type PortalLoginLang,
} from "@/content/portal-login";

export function PortalPassword({
  lang,
  mode,
  token = "",
}: {
  lang: PortalLoginLang;
  mode: "forgot" | "reset";
  token?: string;
}) {
  const copy = PORTAL_LOGIN_COPY[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (mode === "forgot" && !PORTAL_EMAIL_PATTERN.test(email)) {
      setError(copy.emailInvalid);
      return;
    }
    if (mode === "reset" && password.length < 8) {
      setError(copy.passwordRequired);
      return;
    }
    if (mode === "reset" && password !== confirmation) {
      setError(copy.passwordRequired);
      return;
    }
    setPending(true);
    const response = await fetch(mode === "forgot" ? "/api/v1/portal/password/forgot" : "/api/v1/portal/password/reset", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(mode === "forgot"
        ? { email }
        : { token, password, password_confirmation: confirmation }),
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message || copy.passwordRequired);
      return;
    }
    setMessage(body.message || "");
  }

  return (
    <main className="glass-shell">
      <section className="glass-card glass-login">
        <img className="glass-logo" alt="Logo" src="/portal/img/startkey_logo.png" />
        <h1>{copy.forgotPassword}</h1>
        <form noValidate onSubmit={onSubmit}>
          {mode === "forgot" ? (
            <label className="glass-field">
              <span>{copy.emailPlaceholder}</span>
              <input className="glass-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
          ) : (
            <>
              <label className="glass-field">
                <span>{copy.passwordPlaceholder}</span>
                <input className="glass-input" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <label className="glass-field">
                <span>{copy.passwordPlaceholder}</span>
                <input className="glass-input" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              </label>
            </>
          )}
          {error ? <p className="glass-error">{error}</p> : null}
          {message ? <p className="glass-muted">{message}</p> : null}
          <button className="glass-btn" type="submit" disabled={pending || (mode === "reset" && token === "")}>
            {pending ? copy.submitProgress : copy.forgotPassword}
          </button>
        </form>
        <p className="glass-muted">
          <Link className="glass-link" href={`/portal?lang=${lang}`}>{copy.heading}</Link>
        </p>
      </section>
    </main>
  );
}
