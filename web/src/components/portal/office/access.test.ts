import assert from "node:assert/strict";
import test from "node:test";

import { canEditPortfolio, integrationLinks, SETTINGS_DENIED, settingsHttpDecision, settingsLinks, settingsPageAccess, type OfficeMembership } from "./access.ts";

const office = (role: string, branchId: number | null = null): OfficeMembership => ({
  id: 7,
  role_slug: role,
  branch_id: branchId,
});

test("portfolio edit is hidden when the role or status cannot update", () => {
  assert.equal(canEditPortfolio("owner", "prospect"), true);
  assert.equal(canEditPortfolio("agent", "active"), true);
  assert.equal(canEditPortfolio("office_manager", "draft"), true);
  assert.equal(canEditPortfolio("agent", "closed"), false);
  assert.equal(canEditPortfolio("owner", "pending_closing_approval"), false);
  assert.equal(canEditPortfolio("viewer", "prospect"), false);
});

test("settings the role cannot open show the denied state", () => {
  assert.equal(SETTINGS_DENIED, "Bu ayara erişim yetkiniz yok");
  assert.equal(settingsPageAccess(undefined, "agent", office("agent")), "index");
  assert.equal(settingsPageAccess("commission", "agent", office("agent")), "deny");
  assert.equal(settingsPageAccess("rates", "office_manager", office("office_manager")), "deny");
  assert.equal(settingsPageAccess("badges", "office_manager", office("office_manager")), "deny");
  assert.equal(settingsPageAccess("matchmaking", "office_manager", office("office_manager", 4)), "deny");
  assert.equal(settingsPageAccess("office", "office_manager", office("office_manager", 4)), "deny");
  assert.equal(settingsPageAccess("team", "agent", office("agent")), "deny");
  assert.equal(settingsPageAccess("missing", "owner", office("owner")), "deny");
});

test("owner, office manager, and agent see different settings tabs", () => {
  assert.equal(settingsPageAccess("commission", "owner", office("owner")), "allow");
  assert.equal(settingsPageAccess("team", "office_manager", office("office_manager")), "allow");
  assert.equal(settingsPageAccess("matchmaking", "office_manager", office("office_manager")), "allow");
  assert.equal(settingsPageAccess("profile", "agent", office("agent")), "allow");

  const agent = settingsLinks("agent", office("agent")).map((link) => link.slug);
  assert.deepEqual(agent, ["profile", "notifications"]);

  const manager = settingsLinks("office_manager", office("office_manager")).map((link) => link.slug);
  assert.equal(manager.includes("commission"), false);
  assert.equal(manager.includes("rates"), false);
  assert.equal(manager.includes("badges"), false);
  assert.equal(manager.includes("team"), true);
  assert.equal(manager.includes("matchmaking"), true);

  const branched = settingsLinks("office_manager", office("office_manager", 4)).map((link) => link.slug);
  assert.equal(branched.includes("matchmaking"), false);
  assert.equal(branched.includes("office"), false);
  assert.equal(branched.includes("team"), true);

  const owner = settingsLinks("owner", office("owner")).map((link) => link.slug);
  assert.equal(owner.includes("commission"), true);
  assert.equal(owner.includes("rates"), true);
  assert.equal(owner.includes("badges"), true);
  assert.equal(owner.includes("integrations"), true);
  assert.equal(owner.includes("sellers"), false);
});

test("sahibinden sellers use the whatsapp and email gate", () => {
  assert.equal(settingsPageAccess("integrations", "agent", office("agent")), "deny");
  assert.equal(settingsPageAccess("integrations", "owner", office("owner")), "allow");
  assert.equal(settingsPageAccess("integrations", "office_manager", office("office_manager")), "allow");
  assert.equal(settingsPageAccess("integrations", "manager", office("manager")), "allow");
  assert.equal(integrationLinks("agent", office("agent")).length, 0);
  assert.deepEqual(integrationLinks("office_manager", office("office_manager")).map((link) => link.slug), ["whatsapp", "email", "sahibinden"]);
  assert.equal(integrationLinks("owner", office("owner")).some((link) => link.href === "/portal/office/settings/integrations/sahibinden"), true);
});

test("a me payload decides the settings HTTP status", () => {
  const me = { user: { office_id: 7 }, offices: [office("agent")] };
  assert.equal(settingsHttpDecision("commission", me), "deny");
  assert.equal(settingsHttpDecision("profile", me), "allow");
  assert.equal(settingsHttpDecision("team", { user: { office_id: 7 }, offices: [office("office_manager")] }), "allow");
  assert.equal(settingsHttpDecision("rates", { offices: [office("office_manager")] }), "deny");
  assert.equal(settingsHttpDecision("matchmaking", { offices: [office("office_manager", 4)] }), "deny");
  assert.equal(settingsHttpDecision("office", { offices: [office("owner")] }), "allow");
  assert.equal(settingsHttpDecision("commission", {}), "unknown");
  assert.equal(settingsHttpDecision("badges", { data: { user: { office_id: 7 }, offices: [office("owner")] } }), "allow");
});
