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

export function canManageOffice(role: OfficeRole, office: OfficeMembership | undefined): boolean {
  return canManageMatchmaking(role, office);
}

export const SETTINGS_DENIED = "Bu ayara erişim yetkiniz yok";

const SETTINGS_PAGES = [
  ["profile", "Profil"],
  ["notifications", "Bildirimler"],
  ["duty", "Nöbet"],
  ["team", "Ekip"],
  ["office", "Ofis"],
  ["subscription", "Abonelik"],
  ["whatsapp", "WhatsApp"],
  ["email", "E-posta"],
  ["billing", "Faturalama"],
  ["sellers", "Sahibinden satıcıları"],
  ["matchmaking", "Eşleşme"],
  ["badges", "Rozetler"],
  ["commission", "Hizmet bedeli"],
  ["rates", "Hakediş oranları"],
] as const;

export function settingsAllowed(page: string, role: OfficeRole, office: OfficeMembership | undefined): boolean {
  switch (page) {
    case "profile":
    case "notifications":
      return true;
    case "duty":
      return canManageDuty(role);
    case "team":
      return canManageTeam(role);
    case "office":
      return canManageOffice(role, office);
    case "subscription":
    case "whatsapp":
    case "email":
    case "billing":
    case "sellers":
      return isManager(role);
    case "matchmaking":
      return canManageMatchmaking(role, office);
    case "badges":
      return canManageBadges(role);
    case "commission":
      return canManageCommission(role);
    case "rates":
      return canManageRates(role);
    default:
      return false;
  }
}

export function settingsPageAccess(page: string | undefined, role: OfficeRole, office: OfficeMembership | undefined): "index" | "allow" | "deny" {
  if (!page) {
    return "index";
  }
  return settingsAllowed(page, role, office) ? "allow" : "deny";
}

export function settingsLinks(role: OfficeRole, office: OfficeMembership | undefined): { slug: string; label: string }[] {
  return SETTINGS_PAGES.filter(([slug]) => settingsAllowed(slug, role, office)).map(([slug, label]) => ({ slug, label }));
}

export function canVerify(office: OfficeMembership | undefined): boolean {
  return Boolean(office?.can_verify_activations || office?.can_verify_closings || roleOf(office) === "owner");
}
