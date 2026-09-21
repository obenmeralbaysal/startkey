"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import {
  PORTAL_EMAIL_PATTERN,
  PORTAL_LOGIN_COPY,
  PORTAL_LOGIN_LANGUAGES,
  type PortalLoginLang,
} from "@/content/portal-login";

function EnvelopeIcon() {
  return (
    <svg className="portal-icon" viewBox="0 0 512 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M64 112c-8.8 0-16 7.2-16 16v22.1l183.4 137.6c16.5 12.4 38.8 12.4 55.3 0L464 150.1V128c0-8.8-7.2-16-16-16H64zm400 86.8L317.6 325.1c-28.2 21.2-66.9 21.2-95.1 0L48 198.8V384c0 8.8 7.2 16 16 16h384c8.8 0 16-7.2 16-16V198.8zM64 32C28.7 32 0 60.7 0 96v320c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="portal-icon" viewBox="0 0 448 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M144 144v48h160v-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zm-64 48v-48C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64v192c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64h16z"
      />
    </svg>
  );
}

function EyeIcon({ slashed }: { slashed: boolean }) {
  if (slashed) {
    return (
      <svg className="portal-icon" viewBox="0 0 640 512" aria-hidden="true">
        <path
          fill="currentColor"
          d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2s-6.3 25.5 4.1 33.7l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.5 128.2 282.2 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.6-19.3 10.4-41.4 4.8-62.8c-13.7-52.3-66.1-83.6-118.4-69.9c-13.1 3.4-24.8 9.6-34.6 17.7l-36.7-28.9zM394.9 394.9L324.6 339.6c-17 15.5-40.1 24.4-64.6 24.4c-53 0-96-43-96-96c0-14.3 3.1-27.9 8.7-40.2L82.4 216.4C55.8 247.3 37.6 280.6 27.5 304.3c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c51.2 0 97.1-15.4 136.5-40.1l-61.6-45z"
        />
      </svg>
    );
  }

  return (
    <svg className="portal-icon" viewBox="0 0 576 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0 24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288 480s-145.5-36.8-192.6-80.6C48.6 356 17.3 304 2.4 268.3c-3.3-7.9-3.3-16.7 0-24.6C17.3 208 48.6 156 95.4 112.6zM288 336c44.2 0 80-35.8 80-80s-35.8-80-80-80c-.7 0-1.3 0-2 0c1.3 5.1 2 10.5 2 16c0 35.3-28.7 64-64 64c-5.5 0-10.9-.7-16-2c0 .7 0 1.3 0 2c0 44.2 35.8 80 80 80z"
      />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg className="portal-icon" viewBox="0 0 512 512" aria-hidden="true" style={{ display: "inline-block", marginRight: 8, verticalAlign: "-0.15em" }}>
      <path
        fill="currentColor"
        d="M352 96l64 0c17.7 0 32 14.3 32 32l0 256c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0c53 0 96-43 96-96l0-256c0-53-43-96-96-96l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32zm-9.4 182.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L242.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"
      />
    </svg>
  );
}

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
  const langWrapRef = useRef<HTMLDivElement>(null);
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    document.title = copy.title;
    document.documentElement.lang = copy.htmlLang;
  }, [copy.htmlLang, copy.title]);

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

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !validate()) {
      return;
    }
    setSubmitting(true);
  }

  return (
    <div className="d-flex flex-column flex-root" id="kt_app_root">
      <div className="d-flex flex-column flex-lg-row flex-column-fluid">
        <div className="d-flex flex-column-fluid flex-lg-row-auto justify-content-center justify-content-lg-end p-8">
          <div className="bg-body d-flex flex-column flex-center rounded-4 w-md-600px p-3">
            <div className="d-flex flex-center flex-column align-items-stretch h-lg-100 w-md-400px">
              <div className="d-flex flex-center flex-column portal-form-shell flex-column-fluid pb-15 pb-lg-20">
                <form className="form w-100" id="loginForm" method="post" noValidate onSubmit={onSubmit}>
                  <div className="text-center mb-11">
                    <img alt="Logo" src="/portal/img/startkey_logo.png" width={250} />
                  </div>
                  <div className="portal-lang-row">
                    <div ref={langWrapRef} style={{ position: "relative" }}>
                      <button
                        type="button"
                        className={`btn btn-flex btn-link btn-color-gray-700 btn-active-color-primary portal-lang-btn rotate fs-base${langOpen ? " lang-open" : ""}`}
                        onClick={() => setLangOpen((open) => !open)}
                        aria-expanded={langOpen}
                        aria-haspopup="true"
                      >
                        <span className="symbol symbol-20px">
                          <img className="rounded-1" src={current.flag} alt="" />
                        </span>
                        <span>{copy.currentLangName}</span>
                        <span className="svg-icon svg-icon-5 svg-icon-muted rotate-180 m-0">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M11.4343 12.7344L7.25 8.55005C6.83579 8.13583 6.16421 8.13584 5.75 8.55005C5.33579 8.96426 5.33579 9.63583 5.75 10.05L11.2929 15.5929C11.6834 15.9835 12.3166 15.9835 12.7071 15.5929L18.25 10.05C18.6642 9.63584 18.6642 8.96426 18.25 8.55005C17.8358 8.13584 17.1642 8.13584 16.75 8.55005L12.5657 12.7344C12.2533 13.0468 11.7467 13.0468 11.4343 12.7344Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                      </button>
                      <div
                        className={`menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold w-200px py-4 fs-7${langOpen ? " show" : ""}`}
                        id="kt_auth_lang_menu"
                      >
                        <div className="menu-item px-3">
                          {PORTAL_LOGIN_LANGUAGES.map((item) => (
                            <a
                              key={item.code}
                              href={`/portal?lang=${item.code}`}
                              className={`menu-link d-flex${item.code === lang ? " active" : ""}`}
                            >
                              <span className="symbol symbol-20px">
                                <img className="rounded-1" src={item.flag} alt="" />
                              </span>
                              <span>{item.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mb-11">
                    <h1 className="text-dark fw-bolder mb-3">{copy.heading}</h1>
                    <div className="text-gray-500 fw-semibold fs-6">{copy.subtitle}</div>
                  </div>
                  <div className="fv-row mb-8">
                    <div className="input-group">
                      <span className="input-group-text" id={`${emailId}-addon`}>
                        <EnvelopeIcon />
                      </span>
                      <input
                        id="Email"
                        name="Email"
                        type="text"
                        className="form-control"
                        placeholder={copy.emailPlaceholder}
                        aria-label="Email"
                        aria-describedby={`${emailId}-addon`}
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (emailError) {
                            setEmailError("");
                          }
                        }}
                      />
                    </div>
                    {emailError ? <span className="field-validation-error text-danger">{emailError}</span> : null}
                  </div>
                  <div className="fv-row mb-5">
                    <div className="input-group">
                      <span className="input-group-text" id={`${passwordId}-addon`}>
                        <LockIcon />
                      </span>
                      <input
                        id="passwordInput"
                        name="Password"
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder={copy.passwordPlaceholder}
                        aria-label="Password"
                        aria-describedby={`${passwordId}-addon`}
                        autoComplete="off"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (passwordError) {
                            setPasswordError("");
                          }
                        }}
                      />
                      <span
                        className="input-group-text password-toggle"
                        id="togglePassword"
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowPassword((value) => !value)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setShowPassword((value) => !value);
                          }
                        }}
                      >
                        <EyeIcon slashed={showPassword} />
                      </span>
                    </div>
                    {passwordError ? <span className="field-validation-error text-danger">{passwordError}</span> : null}
                  </div>
                  <div className="d-flex flex-stack flex-wrap gap-3 fs-base fw-semibold mb-8">
                    <div className="form-check form-check-custom form-check-solid">
                      <input
                        className="form-check-input"
                        id="RememberMe"
                        name="RememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="RememberMe">
                        {copy.rememberMe}
                      </label>
                    </div>
                    <a href="#sifremi-unuttum" className="link-primary">
                      {copy.forgotPassword}
                    </a>
                  </div>
                  <div className="d-grid mb-10">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      id="loginSubmitButton"
                      disabled={submitting}
                      {...(submitting ? { "data-kt-indicator": "on" } : {})}
                    >
                      <span className="indicator-label">
                        <SignInIcon />
                        {copy.submitLabel}
                      </span>
                      <span className="indicator-progress">
                        {copy.submitProgress}
                        <span className="spinner-border spinner-border-sm align-middle ms-2" />
                      </span>
                    </button>
                  </div>
                  <div className="separator separator-content my-9">
                    <span className="w-125px text-gray-500 fw-semibold fs-7">{copy.or}</span>
                  </div>
                  <div className="row g-3 mb-9">
                    <div className="col-md-6" style={{ margin: 0 }}>
                      <button type="button" className="btn btn-md">
                        <img src="/portal/img/google_full.png" alt="Google Login" style={{ maxWidth: "10rem", height: "auto" }} />
                      </button>
                    </div>
                    <div className="col-md-6" style={{ margin: 0 }}>
                      <button type="button" className="btn btn-md" data-info="Office365 Login">
                        <img src="/portal/img/office-365.png" alt="Office365 Login" style={{ maxWidth: "10rem", height: "auto" }} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex flex-lg-row-fluid">
          <div className="d-flex flex-column flex-center pb-0 pb-lg-10 p-10 w-100">
            <Link href="/tr" className="mb-7">
              <img alt="Logo" src="/portal/img/startkey_logo.png" width={175} />
            </Link>
            <h2 className="text-white fw-normal m-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
