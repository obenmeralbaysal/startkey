/** Old office paths that must land on the new screen before the page renders. */
export function officeSectionRedirect(parts: readonly string[]): string | null {
  if (parts[0] === "sahibinden") {
    return "/portal/office/portfolios/new";
  }
  if (parts[0] === "settings" && parts[1] === "sellers") {
    return "/portal/office/settings/integrations/sahibinden";
  }
  return null;
}
