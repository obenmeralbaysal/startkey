/**
 * Classic consultant detail is the original reference-site template.
 * It stays reachable at the same consultant URL with ?layout=classic.
 * Any other value (or no param) uses the Figma-inspired draft template.
 */
export function isClassicConsultantLayout(
  layout: string | string[] | undefined,
): boolean {
  const value = Array.isArray(layout) ? layout[0] : layout;
  return value === "classic";
}
