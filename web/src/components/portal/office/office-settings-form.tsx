"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { canEditOfficeSettings, canManageOffice, integrationLinks, roleOf } from "@/components/portal/office/access";
import { OfficeError, officeCall, rows } from "@/components/portal/office/api";
import { EmptyState, PageFrame, useOffice } from "@/components/portal/office/ui";
import { PORTAL_UX_COPY } from "@/content/portal-ux";
import {
  isSafeHex,
  OFFICE_SETTINGS_PATH,
  officeFieldError,
  officeSettingsBody,
  officeSettingsOutcome,
  readOfficeSettings,
  type OfficeProfileInput,
  type OfficeRules,
} from "@/lib/office-settings";
import { withLang } from "@/lib/portal-ux";

const EMPTY_PROFILE: OfficeProfileInput = {
  name: "",
  phone: "",
  address: "",
  sahibinden_store_url: "",
  ttbs_no: "",
};

const EMPTY_RULES: OfficeRules = {
  require_owner_approval: false,
  requires_closing_verification: false,
  managers_can_view_earnings: false,
};

type Tab = "general" | "rules" | "branches" | "integrations";

export function OfficeSettingsForm() {
  const { officeId, office, locale, notice } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const editable = canEditOfficeSettings(roleOf(office), office);
  const showBranches = canManageOffice(roleOf(office), office);
  const integrations = integrationLinks(roleOf(office), office);
  const [tab, setTab] = useState<Tab>("general");
  const [profile, setProfile] = useState<OfficeProfileInput>(EMPTY_PROFILE);
  const [rules, setRules] = useState<OfficeRules>(EMPTY_RULES);
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [banner, setBanner] = useState("");
  const [pending, setPending] = useState(false);
  const [branches, setBranches] = useState<ReturnType<typeof rows> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await officeCall(OFFICE_SETTINGS_PATH, officeId);
        if (cancelled) return;
        const view = readOfficeSettings(payload);
        setProfile(view.profile);
        setRules(view.rules);
        setLogoUrl(view.logoUrl);
        setBrandColor(view.brandColor);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof OfficeError && officeSettingsOutcome(error.status) === "missing") {
          setBanner(copy.officeSettingsMissing);
        } else {
          notice(copy.savedError);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.officeSettingsMissing, copy.savedError, notice, officeId]);

  useEffect(() => {
    if (tab !== "branches") return;
    let cancelled = false;
    officeCall("branches", officeId)
      .then((payload) => {
        if (!cancelled) setBranches(rows(payload));
      })
      .catch((error: Error) => {
        if (cancelled) return;
        if (error instanceof OfficeError && error.status === 404) {
          setBranches([]);
          return;
        }
        setBranches([]);
        notice(copy.savedError);
      });
    return () => {
      cancelled = true;
    };
  }, [copy.savedError, notice, officeId, tab]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!editable || pending) return;
    const messages = { name: copy.officeNameRequired, address: copy.officeAddressRequired, ttbs: copy.ttbsRequired };
    const invalid = officeFieldError(profile, messages);
    if (invalid) {
      setFieldError(invalid.message);
      return;
    }
    setFieldError("");
    setPending(true);
    try {
      const payload = await officeCall(OFFICE_SETTINGS_PATH, officeId, {
        method: "PUT",
        body: officeSettingsBody(profile),
      });
      const view = readOfficeSettings(payload);
      if (view.profile.name) setProfile(view.profile);
      setBanner("");
      notice(copy.saved);
    } catch (error) {
      if (error instanceof OfficeError && officeSettingsOutcome(error.status) === "missing") {
        setBanner(copy.officeSettingsMissing);
      } else {
        notice(copy.savedError);
      }
    } finally {
      setPending(false);
    }
  }

  const color = isSafeHex(brandColor) ? brandColor : "";

  return (
    <PageFrame title={copy.officeSettings} crumb={[copy.office, copy.officeSettings]}>
      <div data-screen="office-settings" data-locked={editable ? undefined : "office"}>
        {!editable ? <p className="ux-banner">{copy.officeSettingsOwnerNote}</p> : null}
        {banner ? <p className="ux-banner">{banner}</p> : null}
        <div className="ux-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "general"} onClick={() => setTab("general")}>{copy.tabGeneral}</button>
          <button type="button" role="tab" aria-selected={tab === "rules"} onClick={() => setTab("rules")}>{copy.tabRules}</button>
          {showBranches ? <button type="button" role="tab" aria-selected={tab === "branches"} onClick={() => setTab("branches")}>{copy.tabBranches}</button> : null}
          {integrations.length > 0 ? <button type="button" role="tab" aria-selected={tab === "integrations"} onClick={() => setTab("integrations")}>{copy.tabIntegrations}</button> : null}
        </div>

        {tab === "general" ? (
          <form className="ux-office-form" onSubmit={saveProfile}>
            <div className="ux-brand">
              {logoUrl ? <img alt="" src={logoUrl} /> : <span className="ux-logo-placeholder">LOGO</span>}
              {color ? (
                <span className="ux-swatch-row">
                  <span className="ux-swatch" style={{ background: color }} aria-hidden="true" />
                  <span className="ux-swatch-text">{brandColor}</span>
                </span>
              ) : brandColor ? <span className="ux-swatch-text">{brandColor}</span> : null}
              <p className="ux-logo-note">{copy.logoNote}</p>
            </div>
            <div className="ux-form-grid">
              <Field label={`${copy.officeName} *`} error={fieldError === copy.officeNameRequired ? fieldError : ""}>
                <input value={profile.name} disabled={!editable} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
              </Field>
              <Field label={copy.officePhone}>
                <input value={copy.comingSoon} disabled readOnly />
              </Field>
              <Field label={`${copy.officeAddress} *`} error={fieldError === copy.officeAddressRequired ? fieldError : ""}>
                <input value={profile.address} disabled={!editable} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
              </Field>
              <Field label={copy.officeStore}>
                <input value={profile.sahibinden_store_url} inputMode="url" disabled={!editable} onChange={(event) => setProfile({ ...profile, sahibinden_store_url: event.target.value })} />
              </Field>
              <Field label={`${copy.officeTtbs} *`} error={fieldError === copy.ttbsRequired ? fieldError : ""}>
                <input value={profile.ttbs_no} disabled={!editable} aria-invalid={fieldError === copy.ttbsRequired} onChange={(event) => setProfile({ ...profile, ttbs_no: event.target.value })} />
              </Field>
            </div>
            {editable ? <button className="ux-create" type="submit" disabled={pending}>{pending ? copy.saved : copy.save}</button> : null}
          </form>
        ) : null}

        {tab === "rules" ? (
          <form className="ux-office-form">
            <p className="ux-muted">{copy.comingSoon}</p>
            <Rule label={copy.ruleOwnerApproval} checked={rules.require_owner_approval} disabled onChange={() => undefined} />
            <Rule label={copy.ruleClosing} checked={rules.requires_closing_verification} disabled onChange={() => undefined} />
            <Rule label={copy.ruleEarnings} checked={rules.managers_can_view_earnings} disabled onChange={() => undefined} />
            <Field label={copy.ruleMinScore}>
              <input value={copy.comingSoon} disabled readOnly />
            </Field>
          </form>
        ) : null}

        {tab === "branches" ? (
          branches === null ? <p className="ux-muted">…</p> : branches.length === 0 ? <EmptyState message={copy.branchesEmpty} /> : (
            <ul className="ux-plain">
              {branches.map((row) => (
                <li key={String(row.id)}>{String(row.name ?? row.title ?? row.id ?? "")}</li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "integrations" ? (
          <ul className="ux-plain">
            {integrations.map((item) => (
              <li key={item.slug}><Link href={withLang(item.href, locale)}>{item.label}</Link></li>
            ))}
          </ul>
        ) : null}
      </div>
    </PageFrame>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="ux-field">
      <span>{label}</span>
      {children}
      {error ? <small className="ux-field-error">{error}</small> : null}
    </label>
  );
}

function Rule({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="ux-switch">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
