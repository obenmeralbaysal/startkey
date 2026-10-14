export type OfficeRole = "owner" | "manager" | "office_manager" | "agent" | string;

export type OfficeMembership = {
  id?: number;
  office_id?: number;
  name?: string;
  office_name?: string;
  role?: string | null;
  role_slug?: string | null;
  role_name?: string | null;
  branch_id?: number | null;
  can_verify_activations?: boolean;
  can_verify_closings?: boolean;
  can_remove_team_members?: boolean;
  can_delete_portfolios?: boolean;
  managers_can_view_financial_reports?: boolean;
};

export function officeNumber(office: OfficeMembership): number {
  return Number(office.office_id ?? office.id ?? 0);
}

export function officeLabel(office: OfficeMembership): string {
  return office.office_name || office.name || `Ofis ${officeNumber(office)}`;
}

export function roleOf(office: OfficeMembership | undefined): OfficeRole {
  return office?.role_slug || office?.role || office?.role_name || "agent";
}

export function isManager(role: OfficeRole): boolean {
  return role === "owner" || role === "manager" || role === "office_manager";
}

export function canDeleteRecords(role: OfficeRole): boolean {
  return role === "owner" || role === "manager" || role === "office_manager";
}

export function canManageTeam(role: OfficeRole): boolean {
  return isManager(role);
}

export function canDeleteTeam(role: OfficeRole, office: OfficeMembership | undefined): boolean {
  return role === "owner" || Boolean(office?.can_remove_team_members);
}

export function canManageBadges(role: OfficeRole): boolean {
  return role === "owner";
}

export function canManageCommission(role: OfficeRole): boolean {
  return role === "owner";
}

export function canManageRates(role: OfficeRole): boolean {
  return role === "owner";
}

export function canApproveEarnings(role: OfficeRole): boolean {
  return isManager(role);
}

export function canManageDuty(role: OfficeRole): boolean {
  return isManager(role);
}

export function canManageMatchmaking(role: OfficeRole, office: OfficeMembership | undefined): boolean {
  if (role === "owner" || role === "manager") {
    return true;
  }
  return role === "office_manager" && !office?.branch_id;
}

export function canVerify(office: OfficeMembership | undefined): boolean {
  return Boolean(office?.can_verify_activations || office?.can_verify_closings || roleOf(office) === "owner");
}
