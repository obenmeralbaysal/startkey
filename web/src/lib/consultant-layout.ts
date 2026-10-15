/**
 * The public consultant page uses the reference-site template.
 * The Figma draft stays available at the same URL with ?layout=draft.
 */
export function isClassicConsultantLayout(
  layout: string | string[] | undefined,
): boolean {
  const value = Array.isArray(layout) ? layout[0] : layout;
  return value !== "draft";
}
