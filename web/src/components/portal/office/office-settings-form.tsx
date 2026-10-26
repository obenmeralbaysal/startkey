"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { canEditOfficeSettings, canWriteBranches, integrationLinks, isManager, roleOf } from "@/components/portal/office/access";
import { OfficeError, officeCall, rows, type FieldErrors } from "@/components/portal/office/api";
import { matchedFieldErrors } from "@/components/portal/office/field-errors";
import { EmptyState, PageFrame, useOffice } from "@/components/portal/office/ui";
import { PORTAL_UX_COPY } from "@/content/portal-ux";
import {
  branchBody,
  isSafeHex,
  OFFICE_SETTINGS_PATH,
  officeFieldError,
  officeSettingsBody,
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
  const role = roleOf(office);
  const editable = canEditOfficeSettings(role, office);
  const showBranches = isManager(role);
  const writeBranches = canWriteBranches(role);
  const integrations = integrationLinks(roleOf(office), office);
  const [tab, setTab] = useState<Tab>("general");
  const [profile, setProfile] = useState<OfficeProfileInput>(EMPTY_PROFILE);
  const [rules, setRules] = useState<OfficeRules>(EMPTY_RULES);
  const [brandColor, setBrandColor] = useState("");
  const [fieldError, setFieldError] = useState<FieldErrors>({});
  const [branchName, setBranchName] = useState("");
  const [branchError, setBranchError] = useState("");
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
        setBrandColor(view.brandColor);
      } catch (error) {
        if (cancelled) return;
        notice(error instanceof Error ? error.message : copy.savedError);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.savedError, notice, officeId]);

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
      setFieldError({ [invalid.field]: invalid.message });
      return;
    }
    setFieldError({});
    setPending(true);
    try {
      const payload = await officeCall(OFFICE_SETTINGS_PATH, officeId, {
        method: "PUT",
        body: officeSettingsBody(profile, rules),
      });
      const view = readOfficeSettings(payload);
      if (view.profile.name) setProfile(view.profile);
      setRules(view.rules);
      notice(copy.saved);
    } catch (error) {
      if (error instanceof OfficeError && error.status === 422) {
        const fields = matchedFieldErrors(["name", "phone", "address", "sahibinden_store_url", "ttbs_no"], error.fields);
        if (Object.keys(fields).length > 0) setFieldError(fields);
        else notice(error.message);
      } else {
        notice(error instanceof Error ? error.message : copy.savedError);
      }
    } finally {
      setPending(false);
    }
  }

  async function addBranch(event: FormEvent) {
    event.preventDefault();
    if (!writeBranches || pending) return;
    if (!branchName.trim()) {
      setBranchError(copy.fieldRequired);
      return;
    }
    setBranchError("");
    setPending(true);
    try {
      await officeCall("branches", officeId, { method: "POST", body: branchBody(branchName) });
      setBranchName("");
      const payload = await officeCall("branches", officeId);
      setBranches(rows(payload));
      notice(copy.saved);
    } catch (error) {
      if (error instanceof OfficeError && error.fields.name) setBranchError(error.fields.name);
      else notice(error instanceof Error ? error.message : copy.savedError);
    } finally {
      setPending(false);
    }
  }

  async function renameBranch(id: string, name: string) {
    if (!writeBranches || !name.trim()) return;
    try {
      await officeCall(`branches/${id}`, officeId, { method: "PUT", body: branchBody(name) });
      notice(copy.saved);
    } catch (error) {
      notice(error instanceof Error ? error.message : copy.savedError);
    }
  }

  const color = isSafeHex(brandColor) ? brandColor : "";

  return (
    <PageFrame title={copy.officeSettings} crumb={[copy.office, copy.officeSettings]}>
      <div data-screen="office-settings" data-locked={editable ? undefined : "office"}>
        {!editable ? <p className="ux-banner">{copy.officeSettingsOwnerNote}</p> : null}
        <div className="ux-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "general"} onClick={() => setTab("general")}>{copy.tabGeneral}</button>
          <button type="button" role="tab" aria-selected={tab === "rules"} onClick={() => setTab("rules")}>{copy.tabRules}</button>
          {showBranches ? <button type="button" role="tab" aria-selected={tab === "branches"} onClick={() => setTab("branches")}>{copy.tabBranches}</button> : null}
          {integrations.length > 0 ? <button type="button" role="tab" aria-selected={tab === "integrations"} onClick={() => setTab("integrations")}>{copy.tabIntegrations}</button> : null}
        </div>

        {tab === "general" ? (
          <form className="ux-office-form" onSubmit={saveProfile}>
            <div className="ux-brand">
              {color ? (
                <span className="ux-swatch-row">
                  <span className="ux-swatch" style={{ background: color }} aria-hidden="true" />
                  <span className="ux-swatch-text">{brandColor}</span>
                </span>
              ) : brandColor ? <span className="ux-swatch-text">{brandColor}</span> : null}
              <p className="ux-logo-note">{copy.logoNote}</p>
            </div>
            <div className="ux-form-grid">
              <Field label={`${copy.officeName} *`} error={fieldError.name ?? ""}>
                <input name="name" value={profile.name} disabled={!editable} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
              </Field>
              <Field label={copy.officePhone} error={fieldError.phone ?? ""}>
                <input name="phone" type="tel" inputMode="tel" value={profile.phone} disabled={!editable} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
              </Field>
              <Field label={`${copy.officeAddress} *`} error={fieldError.address ?? ""}>
                <input name="address" value={profile.address} disabled={!editable} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
              </Field>
              <Field label={copy.officeStore} error={fieldError.sahibinden_store_url ?? ""}>
                <input name="sahibinden_store_url" value={profile.sahibinden_store_url} inputMode="url" disabled={!editable} onChange={(event) => setProfile({ ...profile, sahibinden_store_url: event.target.value })} />
              </Field>
              <Field label={`${copy.officeTtbs} *`} error={fieldError.ttbs_no ?? ""}>
                <input name="ttbs_no" value={profile.ttbs_no} disabled={!editable} aria-invalid={Boolean(fieldError.ttbs_no)} onChange={(event) => setProfile({ ...profile, ttbs_no: event.target.value })} />
              </Field>
            </div>
            {editable ? <button className="ux-create" type="submit" disabled={pending}>{pending ? copy.saved : copy.save}</button> : null}
          </form>
        ) : null}

        {tab === "rules" ? (
          <form className="ux-office-form" onSubmit={saveProfile}>
            <Rule label={copy.ruleOwnerApproval} checked={rules.require_owner_approval} disabled={!editable} onChange={(checked) => setRules({ ...rules, require_owner_approval: checked })} />
            <Rule label={copy.ruleClosing} checked={rules.requires_closing_verification} disabled={!editable} onChange={(checked) => setRules({ ...rules, requires_closing_verification: checked })} />
            <Rule label={copy.ruleEarnings} checked={rules.managers_can_view_earnings} disabled={!editable} onChange={(checked) => setRules({ ...rules, managers_can_view_earnings: checked })} />
            {editable ? <button className="ux-create" type="submit" disabled={pending}>{pending ? copy.saved : copy.save}</button> : null}
          </form>
        ) : null}

        {tab === "branches" ? (
          branches === null ? <p className="ux-muted">…</p> : (
            <>
              {writeBranches ? (
                <form className="ux-inline" onSubmit={addBranch}>
                  <Field label={copy.branchName} error={branchError}>
                    <input name="name" value={branchName} onChange={(event) => setBranchName(event.target.value)} />
                  </Field>
                  <button className="ux-create" type="submit" disabled={pending}>{copy.add}</button>
                </form>
              ) : null}
              {branches.length === 0 ? <EmptyState message={copy.branchesEmpty} /> : (
                <ul className="ux-plain">
                  {branches.map((row) => {
                    const id = String(row.id ?? "");
                    const label = String(row.name ?? row.title ?? "");
                    return (
                      <li key={id || label}>
                        {writeBranches && id ? (
                          <input aria-label={copy.branchName} defaultValue={label} onBlur={(event) => { if (event.target.value.trim() !== label) void renameBranch(id, event.target.value); }} />
                        ) : label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
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
