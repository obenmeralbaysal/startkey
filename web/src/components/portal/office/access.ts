export type OfficeRole = "owner" | "manager" | "office_manager" | "agent" | string;

export type OfficeMembership = {
  id?: number;
  office_id?: number;
  name?: string;
  office_name?: string;
  role?: string | null;
  title?: string | null;
  role_slug?: string | null;
  role_name?: string | null;
  branch_id?: number | null;
  can_verify_activations?: boolean;
  can_verify_closings?: boolean;
  can_remove_team_members?: boolean;
  can_delete_portfolios?: boolean;
  managers_can_view_financial_reports?: boolean;
  managers_can_view_earnings?: boolean;
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

/** Owner and consultant see earnings. Manager roles need the office flag. */
export function canViewEarnings(role: OfficeRole, office: OfficeMembership | undefined): boolean {
  if (role === "owner" || role === "agent") return true;
  if (role === "manager" || role === "office_manager") return office?.managers_can_view_earnings === true;
  return false;
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

/** Office profile writes follow the same matrix as office settings. Everyone else stays read-only. */
export function canEditOfficeSettings(role: OfficeRole, office: OfficeMembership | undefined): boolean {
  return canManageOffice(role, office);
}

export const SETTINGS_DENIED = "Bu ayara erişim yetkiniz yok";

const SETTINGS_PAGES = [
  ["profile", "Profil"],
  ["notifications", "Bildirimler"],
  ["duty", "Nöbet"],
  ["team", "Ekip"],
  ["office", "Ofis"],
  ["subscription", "Abonelik"],
  ["billing", "Faturalama"],
  ["integrations", "Entegrasyonlar"],
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
      return isManager(role);
    case "subscription":
    case "whatsapp":
    case "email":
    case "billing":
    case "sellers":
    case "integrations":
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Role check for the server-rendered settings tab. Unknown payloads stay on the client. */
export function settingsHttpDecision(page: string, body: unknown): "allow" | "deny" | "unknown" {
  const root = asRecord(body);
  if (!root) return "unknown";
  const payload = asRecord(root.data) ?? root;
  const user = asRecord(payload.user) ?? {};
  const listed = Array.isArray(payload.offices) ? payload.offices : Array.isArray(user.offices) ? user.offices : [];
  const offices = listed.filter((item): item is OfficeMembership => asRecord(item) !== null);
  if (offices.length === 0) return "unknown";
  const current = Number(user.office_id ?? 0);
  const office = (current ? offices.find((item) => officeNumber(item) === current) : undefined) ?? offices[0];
  return settingsPageAccess(page, roleOf(office), office) === "allow" ? "allow" : "deny";
}

export function settingsLinks(role: OfficeRole, office: OfficeMembership | undefined): { slug: string; label: string }[] {
  return SETTINGS_PAGES.filter(([slug]) => settingsAllowed(slug, role, office)).map(([slug, label]) => ({ slug, label }));
}

const INTEGRATION_LINKS = [
  ["whatsapp", "/portal/office/settings/whatsapp", "WhatsApp"],
  ["email", "/portal/office/settings/email", "E-posta"],
  ["sahibinden", "/portal/office/settings/integrations/sahibinden", "Sahibinden"],
] as const;

/** Same gate as WhatsApp and E-posta (`isManager`: owner, manager, office_manager). */
export function integrationLinks(role: OfficeRole, office: OfficeMembership | undefined): { slug: string; href: string; label: string }[] {
  if (!settingsAllowed("whatsapp", role, office) || !settingsAllowed("email", role, office)) {
    return [];
  }
  return INTEGRATION_LINKS.map(([slug, href, label]) => ({ slug, href, label }));
}

export function canVerify(office: OfficeMembership | undefined): boolean {
  return Boolean(office?.can_verify_activations || office?.can_verify_closings || roleOf(office) === "owner");
}
