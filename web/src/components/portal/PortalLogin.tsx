"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import {
  PORTAL_EMAIL_PATTERN,
  PORTAL_LOGIN_COPY,
  PORTAL_LOGIN_LANGUAGES,
  type PortalLoginLang,
} from "@/content/portal-login";
import { PortalDesk, type PortalUser } from "@/components/portal/PortalDesk";

export function PortalLogin({ lang }: { lang: PortalLoginLang }) {
  const copy = PORTAL_LOGIN_COPY[lang];
  const current = PORTAL_LOGIN_LANGUAGES.find((item) => item.code === lang) ?? PORTAL_LOGIN_LANGUAGES[0];
  const [langOpen, setLangOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<PortalUser | null>(null);
  const langWrapRef = useRef<HTMLDivElement>(null);
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    document.title = copy.title;
    document.documentElement.lang = copy.htmlLang;
  }, [copy.htmlLang, copy.title]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/portal/session", { credentials: "include", headers: { Accept: "application/json" } })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && body?.data?.user) {
          setUser(body.data.user);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!langWrapRef.current?.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function validate(): boolean {
    let ok = true;
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(copy.emailRequired);
      ok = false;
    } else if (!PORTAL_EMAIL_PATTERN.test(trimmed)) {
      setEmailError(copy.emailInvalid);
      ok = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError(copy.passwordRequired);
      ok = false;
    } else {
      setPasswordError("");
    }

    return ok;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !validate()) {
      return;
    }
    setSubmitting(true);
    setPasswordError("");
    try {
      const response = await fetch("/api/v1/portal/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.data?.user) {
        setPasswordError(body.message || copy.passwordRequired);
        return;
      }
      setUser(body.data.user);
    } finally {
      setSubmitting(false);
    }
  }

  if (user) {
    return <PortalDesk user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <main className="glass-login">
      <section className="glass-panel">
        <div className="glass-lang" ref={langWrapRef}>
          <button type="button" onClick={() => setLangOpen((open) => !open)} aria-expanded={langOpen}>
            <img src={current.flag} alt="" width={20} height={14} /> {copy.currentLangName}
          </button>
          {langOpen ? (
            <div className="glass-menu">
              {PORTAL_LOGIN_LANGUAGES.map((item) => (
                <a key={item.code} href={`/portal?lang=${item.code}`} {...(item.code === lang ? { "aria-current": "true" as const } : {})}>
                  <img src={item.flag} alt="" width={20} height={14} />
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <img className="glass-logo" alt="Logo" src="/portal/img/startkey_logo.png" />
        <h1>{copy.heading}</h1>
        <p className="glass-muted">{copy.subtitle}</p>
        <form noValidate onSubmit={onSubmit}>
          <label className="glass-field" htmlFor={emailId}>
            <span>{copy.emailPlaceholder}</span>
            <input
              id={emailId}
              name="Email"
              className="glass-input"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError("");
              }}
            />
          </label>
          {emailError ? <p className="glass-error">{emailError}</p> : null}
          <label className="glass-field" htmlFor={passwordId}>
            <span>{copy.passwordPlaceholder}</span>
            <input
              id={passwordId}
              name="Password"
              className="glass-input"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) setPasswordError("");
              }}
            />
          </label>
          <button className="glass-link" type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? "Gizle" : "Göster"}
          </button>
          {passwordError ? <p className="glass-error">{passwordError}</p> : null}
          <div className="glass-row">
            <label>
              <input
                id="RememberMe"
                name="RememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />{" "}
              {copy.rememberMe}
            </label>
            <a className="glass-link" href="#sifremi-unuttum">
              {copy.forgotPassword}
            </a>
          </div>
          <button className="glass-btn" type="submit" disabled={submitting}>
            {submitting ? copy.submitProgress : copy.submitLabel}
          </button>
        </form>
        <p className="glass-muted">
          <Link className="glass-link" href="/tr">
            StartKey
          </Link>
        </p>
      </section>
    </main>
  );
}
