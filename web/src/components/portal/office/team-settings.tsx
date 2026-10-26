"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { canDeleteTeam, canManageRates, roleOf } from "@/components/portal/office/access";
import { OfficeError, officeCall, rows, text, type OfficeRecord } from "@/components/portal/office/api";
import { PageFrame, useOffice } from "@/components/portal/office/ui";
import { PORTAL_UX_COPY } from "@/content/portal-ux";
import {
  APPROVAL_SENT,
  assignableRoles,
  BULK_RATE_PATH,
  bulkRateBody,
  duplicateTeamEmail,
  memberRoleLabel,
  officeSettingsOutcome,
  roleOptions,
  teamFieldError,
  teamMemberBody,
  teamMemberExtras,
  type TeamMemberInput,
} from "@/lib/office-settings";

const EMPTY: TeamMemberInput = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role_id: "",
  branch_id: "",
  ttbs_no: "",
};

export function TeamSettings() {
  const { officeId, office, locale, notice } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const labels = copy.roles;
  const [members, setMembers] = useState<OfficeRecord[] | null>(null);
  const [roles, setRoles] = useState<ReturnType<typeof roleOptions>>([]);
  const [branches, setBranches] = useState<OfficeRecord[]>([]);
  const [form, setForm] = useState<TeamMemberInput>(EMPTY);
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [banner, setBanner] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [rate, setRate] = useState("");
  const [pending, setPending] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [teamPayload, rolePayload, branchPayload] = await Promise.all([
          officeCall("team", officeId),
          officeCall("roles", officeId).catch(() => ({ data: [] })),
          officeCall("branches", officeId).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setMembers(rows(teamPayload));
        setRoles(assignableRoles(roleOptions(rolePayload, labels)));
        setBranches(rows(branchPayload));
      } catch {
        if (!cancelled) notice(copy.savedError);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.savedError, labels, notice, officeId, version]);

  function reload() {
    setVersion((value) => value + 1);
  }

  function memberId(row: OfficeRecord): number {
    const value = Number(row.user_id ?? row.id);
    return Number.isFinite(value) ? value : 0;
  }

  async function addMember(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const invalid = teamFieldError(form, copy.fieldRequired);
    if (invalid) {
      setFieldError(invalid);
      return;
    }
    if (duplicateTeamEmail(members ?? [], form.email)) {
      setFieldError({ field: "email", message: copy.duplicateEmail });
      return;
    }
    setFieldError(null);
    setPending(true);
    try {
      await officeCall("team", officeId, { method: "POST", body: teamMemberBody(form) });
      const extras = teamMemberExtras(form);
      setBanner(extras ? copy.branchStub : "");
      setForm(EMPTY);
      notice(copy.saved);
      reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/email/i.test(message) || message === copy.duplicateEmail) {
        setFieldError({ field: "email", message: copy.duplicateEmail });
      } else {
        notice(copy.savedError);
      }
    } finally {
      setPending(false);
    }
  }

  async function changeRole(row: OfficeRecord, roleId: string) {
    const id = row.id ?? row.user_id;
    try {
      await officeCall(`team/${id}`, officeId, { method: "PUT", body: { role_id: Number(roleId) } });
      notice(copy.saved);
      reload();
    } catch {
      notice(copy.savedError);
    }
  }

  async function remove(row: OfficeRecord) {
    const id = row.id ?? row.user_id;
    try {
      await officeCall(`team/${id}`, officeId, { method: "DELETE" });
      notice(copy.saved);
      reload();
    } catch {
      notice(copy.savedError);
    }
  }

  async function submitRate(event: FormEvent) {
    event.preventDefault();
    if (!canManageRates(roleOf(office)) || pending) return;
    const ids = picked.filter((id) => id > 0);
    const value = Number(rate);
    if (ids.length === 0 || !Number.isFinite(value)) {
      setFieldError({ field: "rate", message: copy.fieldRequired });
      return;
    }
    setPending(true);
    try {
      await officeCall(BULK_RATE_PATH, officeId, { method: "POST", body: bulkRateBody(ids, value) });
      setBanner(APPROVAL_SENT);
      notice(copy.approvalSent);
    } catch (error) {
      if (error instanceof OfficeError && officeSettingsOutcome(error.status) === "missing") {
        setBanner(copy.rateStub);
      } else {
        notice(copy.savedError);
      }
    } finally {
      setPending(false);
    }
  }

  const canRemove = canDeleteTeam(roleOf(office), office);
  const canRate = canManageRates(roleOf(office));

  return (
    <PageFrame title={copy.team} crumb={[copy.settings, copy.team]}>
      <div data-screen="office-team">
        {banner ? <p className="ux-banner" data-status={banner === APPROVAL_SENT ? "sent" : "stub"}>{banner === APPROVAL_SENT ? copy.approvalSent : banner}</p> : null}
        <form className="ux-form-grid" onSubmit={addMember}>
          <Field label={copy.firstName} error={fieldError?.field === "first_name" ? fieldError.message : ""}>
            <input name="first_name" value={form.first_name} autoComplete="given-name" onChange={(event) => setForm({ ...form, first_name: event.target.value })} />
          </Field>
          <Field label={copy.lastName} error={fieldError?.field === "last_name" ? fieldError.message : ""}>
            <input name="last_name" value={form.last_name} autoComplete="family-name" onChange={(event) => setForm({ ...form, last_name: event.target.value })} />
          </Field>
          <Field label={copy.email} error={fieldError?.field === "email" ? fieldError.message : ""}>
            <input name="email" type="email" inputMode="email" value={form.email} autoComplete="email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label={copy.phone}>
            <input name="phone" type="tel" inputMode="tel" value={form.phone} autoComplete="tel" onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label={copy.teamRole} error={fieldError?.field === "role_id" ? fieldError.message : ""}>
            <select name="role_id" value={form.role_id} onChange={(event) => setForm({ ...form, role_id: event.target.value })}>
              <option value="">{copy.teamRole}</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
            </select>
          </Field>
          <Field label={copy.teamBranch}>
            <select name="branch_id" value={form.branch_id} onChange={(event) => setForm({ ...form, branch_id: event.target.value })}>
              <option value="">{copy.teamBranch}</option>
              {branches.map((branch) => <option key={String(branch.id)} value={String(branch.id)}>{text(branch, ["name", "title"])}</option>)}
            </select>
          </Field>
          <Field label={copy.teamLicence}>
            <input name="ttbs_no" value={form.ttbs_no} onChange={(event) => setForm({ ...form, ttbs_no: event.target.value })} />
          </Field>
          <button className="ux-create" type="submit" disabled={pending}>{copy.add}</button>
        </form>

        <div className="ux-table-wrap">
          <table className="ux-table">
            <thead>
              <tr>
                {canRate ? <th /> : null}
                <th>{copy.firstName}</th>
                <th>{copy.teamRole}</th>
                <th>{copy.teamBranch}</th>
                <th>{copy.email}</th>
                {canRemove ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((row) => {
                const id = memberId(row);
                return (
                  <tr key={String(row.id ?? row.email)}>
                    {canRate ? (
                      <td data-label={copy.bulkRate}>
                        <input
                          type="checkbox"
                          checked={picked.includes(id)}
                          onChange={(event) => setPicked((current) => event.target.checked ? [...current, id] : current.filter((item) => item !== id))}
                        />
                      </td>
                    ) : null}
                    <td data-label={copy.firstName}>{text(row, ["first_name", "name"])}</td>
                    <td data-label={copy.teamRole}>
                      <select defaultValue="" aria-label={copy.teamRole} onChange={(event) => { if (event.target.value) changeRole(row, event.target.value); }}>
                        <option value="">{memberRoleLabel(row, labels)}</option>
                        {roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                      </select>
                    </td>
                    <td data-label={copy.teamBranch}>
                      <select
                        aria-label={copy.teamBranch}
                        defaultValue={String(row.branch_id ?? "")}
                        onChange={() => setBanner(copy.branchStub)}
                      >
                        <option value="">{copy.teamBranch}</option>
                        {branches.map((branch) => <option key={String(branch.id)} value={String(branch.id)}>{text(branch, ["name", "title"])}</option>)}
                      </select>
                    </td>
                    <td data-label={copy.email}>{text(row, ["email"])}</td>
                    {canRemove ? (
                      <td data-label={copy.removeMember}>
                        <button className="glass-btn-lite" type="button" onClick={() => remove(row)}>{copy.removeMember}</button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {canRate ? (
          <form className="ux-inline" onSubmit={submitRate}>
            <label className="ux-field">
              <span>{copy.bulkRateLabel}</span>
              <input type="number" min={0} max={100} step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} />
            </label>
            <button className="ux-create" type="submit" disabled={pending}>{copy.bulkRate}</button>
          </form>
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
