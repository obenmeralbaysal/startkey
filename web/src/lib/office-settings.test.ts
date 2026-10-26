import assert from "node:assert/strict";
import test from "node:test";

import { PORTAL_UX_COPY } from "../content/portal-ux.ts";
import {
  APPROVAL_SENT,
  BULK_RATE_PATH,
  DUPLICATE_EMAIL,
  LOGO_NOTE,
  OFFICE_SETTINGS_GROUP,
  OFFICE_SETTINGS_PATH,
  TTBS_REQUIRED,
  assignableRoles,
  bulkRateBody,
  bulkRateVisible,
  teamWriteVisible,
  displayCell,
  duplicateTeamEmail,
  isSafeHex,
  matchmakingScoreBody,
  memberRoleLabel,
  officeFieldError,
  bulkRateSent,
  officeSettingsBody,
  officeSettingsOutcome,
  readMinMatchScore,
  readOfficeSettings,
  roleOptions,
  branchBody,
  teamFieldError,
  teamLicenceBody,
  teamMemberBody,
} from "./office-settings.ts";

const messages = {
  name: PORTAL_UX_COPY.tr.officeNameRequired,
  address: PORTAL_UX_COPY.tr.officeAddressRequired,
  ttbs: PORTAL_UX_COPY.tr.ttbsRequired,
};

const profile = {
  name: "Lider",
  phone: "0232",
  address: "Bayraklı",
  sahibinden_store_url: "https://www.sahibinden.com/magaza",
  ttbs_no: "3500000",
};

test("office profile blocks an empty TTBS number and hides raw keys", () => {
  assert.equal(PORTAL_UX_COPY.tr.ttbsRequired, TTBS_REQUIRED);
  assert.equal(PORTAL_UX_COPY.tr.logoNote, LOGO_NOTE);
  assert.equal(officeFieldError({ ...profile, ttbs_no: "  " }, messages)?.message, TTBS_REQUIRED);
  assert.equal(officeFieldError({ ...profile, name: "" }, messages)?.field, "name");
  assert.equal(officeFieldError({ ...profile, address: "" }, messages)?.field, "address");
  assert.equal(officeFieldError(profile, messages), null);
  const rules = {
    require_owner_approval: true,
    requires_closing_verification: false,
    managers_can_view_earnings: true,
  };
  const body = officeSettingsBody(profile, rules);
  assert.equal(OFFICE_SETTINGS_GROUP, "office");
  assert.equal(OFFICE_SETTINGS_PATH, "settings/office");
  assert.deepEqual(body, {
    name: "Lider",
    phone: "0232",
    address: "Bayraklı",
    sahibinden_store_url: "https://www.sahibinden.com/magaza",
    ttbs_no: "3500000",
    rules,
  });
  assert.equal("logo_url" in body, false);
  assert.equal("brand_color" in body, false);
  assert.equal(officeSettingsOutcome(404), "error");
  assert.equal(officeSettingsOutcome(200), "saved");
  assert.equal(officeSettingsOutcome(422), "error");
});

test("office settings read logo and colour without treating them as inputs", () => {
  const view = readOfficeSettings({
    data: {
      groups: {
        office: {
          name: "Lider",
          phone: "0232",
          address: "Bayraklı",
          sahibinden_store_url: "https://www.sahibinden.com/magaza",
          ttbs_no: "3500000",
          logo_url: "/portal/img/logo.png",
          brand_color: "#002172",
          rules: {
            require_owner_approval: 1,
            requires_closing_verification: false,
            managers_can_view_earnings: true,
          },
        },
      },
    },
  });
  assert.equal(view.profile.name, "Lider");
  assert.equal(view.profile.ttbs_no, "3500000");
  assert.equal(view.rules.require_owner_approval, true);
  assert.equal(view.rules.managers_can_view_earnings, true);
  assert.equal(readOfficeSettings({
    data: { name: "Lider", address: "Bayraklı", sahibinden_store_url: "https://www.sahibinden.com/magaza", ttbs_no: "3500000" },
  }).profile.sahibinden_store_url, "https://www.sahibinden.com/magaza");
  assert.equal(view.profile.phone, "0232");
  assert.equal(readOfficeSettings({
    data: {
      name: "Lider",
      phone: "0232",
      address: "Bayraklı",
      sahibinden_store_url: "https://www.sahibinden.com/magaza",
      ttbs_no: "3500000",
      logo_url: "/portal/img/logo.png",
      brand_color: "#002172",
      rules: { require_owner_approval: true, requires_closing_verification: true, managers_can_view_earnings: false },
    },
  }).rules.requires_closing_verification, true);
  assert.equal(view.logoUrl, "/portal/img/logo.png");
  assert.equal(isSafeHex(view.brandColor), true);
  assert.equal(isSafeHex("red"), false);
  assert.equal(readMinMatchScore({ data: { min_match_score: 70, weights: [{ id: 1 }] } }), "70");
  assert.deepEqual(matchmakingScoreBody(70, { weights: [{ id: 1 }] }), {
    min_match_score: 70,
    weights: [{ id: 1 }],
  });
});

test("team create and edit send the branch and licence fields", () => {
  const input = {
    first_name: "Ada",
    last_name: "Yılmaz",
    email: "ada@example.com",
    phone: "",
    role_id: "3",
    branch_id: "9",
    ttbs_no: "3500000",
    myk_no: "MYK-1",
  };
  assert.equal(teamFieldError({ ...input, email: "" }, PORTAL_UX_COPY.tr.fieldRequired)?.field, "email");
  assert.deepEqual(teamMemberBody(input), {
    first_name: "Ada",
    last_name: "Yılmaz",
    email: "ada@example.com",
    phone: null,
    role_id: 3,
    branch_id: 9,
    ttbs_no: "3500000",
    myk_no: "MYK-1",
  });
  assert.deepEqual(teamLicenceBody({ branch_id: "", ttbs_no: "3500000", myk_no: "" }), {
    branch_id: null,
    ttbs_no: "3500000",
    myk_no: "",
  });
  assert.deepEqual(branchBody(" Bayraklı "), { name: "Bayraklı" });
  assert.equal(duplicateTeamEmail([{ email: "Ada@Example.com" }], "ada@example.com"), true);
  assert.equal(PORTAL_UX_COPY.tr.duplicateEmail, DUPLICATE_EMAIL);
  const roles = roleOptions({
    data: [
      { id: 1, slug: "owner", name: "owner" },
      { id: 2, slug: "agent", name: "agent" },
    ],
  }, PORTAL_UX_COPY.tr.roles);
  assert.deepEqual(assignableRoles(roles).map((role) => role.label), ["Danışman"]);
  assert.equal(memberRoleLabel({ role_slug: "office_manager" }, PORTAL_UX_COPY.tr.roles), "Ofis Yöneticisi");
  assert.equal(memberRoleLabel({ role_slug: "agent" }, PORTAL_UX_COPY.en.roles), "Consultant");
});

test("bulk rate is visible only for the owner", () => {
  for (const role of ["owner", "manager", "office_manager", "agent", "franchise_admin", "franchise_staff", "broker"]) {
    assert.equal(bulkRateVisible(role), role === "owner");
  }
});

test("team writes are visible only for owner and office manager", () => {
  for (const role of ["owner", "manager", "office_manager", "agent", "franchise_admin", "franchise_staff", "broker"]) {
    assert.equal(teamWriteVisible(role), role === "owner" || role === "office_manager");
  }
});

test("bulk rate is an approval request and table cells hide raw keys", () => {
  assert.equal(BULK_RATE_PATH, "commission-policy/changes");
  assert.equal(PORTAL_UX_COPY.tr.approvalSent, APPROVAL_SENT);
  assert.equal(PORTAL_UX_COPY.en.approvalSent, "Sent for approval");
  assert.equal(PORTAL_UX_COPY.de.approvalSent, "Zur Freigabe gesendet");
  assert.equal(bulkRateSent({ status: "pending_approval", data: { changes: [] } }), true);
  assert.equal(bulkRateSent({ data: { status: "pending_approval" } }), true);
  assert.equal(bulkRateSent({ status: "applied" }), false);
  const body = bulkRateBody([4, 5], 12.5);
  assert.deepEqual(body, { user_ids: [4, 5], rate_percentage: 12.5 });
  assert.equal(JSON.stringify(body).includes("earning-rates"), false);
  assert.equal(displayCell("pending_approval"), "Onay bekliyor");
  assert.equal(displayCell("require_owner_approval"), "");
  assert.equal(displayCell("0232 000 00 00"), "0232 000 00 00");
  for (const locale of ["tr", "en", "de"] as const) {
    assert.equal(PORTAL_UX_COPY[locale].lease.toLowerCase().includes("radar"), false);
  }
  assert.equal(PORTAL_UX_COPY.tr.lease, "Kira takvimi");
  assert.equal(PORTAL_UX_COPY.tr.leaseDescription, "Kiralanan portföyün kira yıldönümünden 90, 60 ve 30 gün önce bildirim gönderilir.");
  assert.equal(PORTAL_UX_COPY.tr.leaseEmpty, "Kiralanan portföyünüz olduğunda kayıtlar burada görünür.");
});
