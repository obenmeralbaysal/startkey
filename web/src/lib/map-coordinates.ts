export interface OfficePinSource {
  latitude: unknown;
  longitude: unknown;
}

/**
 * Count of offices that become map markers, with the locale unit already chosen.
 * Missing, empty, or unplottable data returns null so the count can be omitted.
 */
export function officeMapCountText(
  unit: string,
  offices: readonly OfficePinSource[] | null | undefined,
): string | null {
  if (!offices || offices.length === 0) return null;
  let count = 0;
  for (const office of offices) {
    if (mapPinPosition(office.latitude, office.longitude)) count += 1;
  }
  if (count < 1) return null;
  return `${count} ${unit}`;
}

/** Accepts numeric strings and Turkish comma decimals. A latitude outside ±90 is not a pin. */
export function mapPinPosition(
  latitude: unknown,
  longitude: unknown,
): { latitude: number; longitude: number } | null {
  const lat = finiteCoordinate(latitude);
  const lng = finiteCoordinate(longitude);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }
  return { latitude: lat, longitude: lng };
}

function finiteCoordinate(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  const normalized = /^-?\d+,\d+$/.test(trimmed) ? trimmed.replace(",", ".") : trimmed;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}
