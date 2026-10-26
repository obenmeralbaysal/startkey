import assert from "node:assert/strict";
import test from "node:test";

import { officeSectionRedirect } from "./portal-office-routes.ts";

test("retired office paths redirect to the new screens", () => {
  assert.equal(officeSectionRedirect(["sahibinden"]), "/portal/office/portfolios/new");
  assert.equal(officeSectionRedirect(["sahibinden", "import"]), "/portal/office/portfolios/new");
  assert.equal(
    officeSectionRedirect(["settings", "sellers"]),
    "/portal/office/settings/integrations/sahibinden",
  );
  assert.equal(
    officeSectionRedirect(["settings", "sellers", "sync"]),
    "/portal/office/settings/integrations/sahibinden",
  );
  assert.equal(officeSectionRedirect(["portfolios", "new"]), null);
  assert.equal(officeSectionRedirect(["settings", "integrations", "sahibinden"]), null);
  assert.equal(officeSectionRedirect(["settings", "whatsapp"]), null);
});
