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

/**
 * Country chips for the homepage map.
 *
 * An office contributes only when it has a plottable pin (same rule as the
 * marker count). The country is taken from `countryCode`, `country`,
 * `countryName` or `il` when that text is a known country name. Province
 * names such as İzmir are not countries, so they fall through. Otherwise the
 * pin is classified with bounding boxes, checked in this order: United
 * Kingdom, Cyprus (labelled KKTC — the network's Cyprus offices are in the
 * north), Greece, then Turkey. A pin outside those boxes is "OTHER".
 */
const COUNTRY_ALIAS: Record<string, string> = {
  tr: "TR",
  tur: "TR",
  turkey: "TR",
  türkiye: "TR",
  turkiye: "TR",
  cy: "CY",
  kktc: "CY",
  trnc: "CY",
  cyprus: "CY",
  kıbrıs: "CY",
  kibris: "CY",
  "northern cyprus": "CY",
  "girne (k.k.t.c.)": "CY",
  gr: "GR",
  greece: "GR",
  yunanistan: "GR",
  ellada: "GR",
  gb: "GB",
  uk: "GB",
  "united kingdom": "GB",
  england: "GB",
  "birleşik krallık": "GB",
  "birlesik krallik": "GB",
  "büyük britanya": "GB",
};

const CHIP_ORDER = ["TR", "CY", "GR", "GB", "OTHER"];

export interface OfficeCountryChip {
  code: string;
  count: number;
}

export interface OfficeCountrySummary {
  officeCount: number;
  countries: OfficeCountryChip[];
}

function knownCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLocaleLowerCase("tr");
  return key ? (COUNTRY_ALIAS[key] ?? null) : null;
}

function countryFromFields(office: OfficePinSource): string | null {
  const record = office as OfficePinSource & Record<string, unknown>;
  for (const key of ["countryCode", "country", "countryName", "il"]) {
    const code = knownCountry(record[key]);
    if (code) return code;
  }
  return null;
}

/** Bounding-box country. See the comment above for the order and the Cyprus label. */
export function countryFromCoordinates(latitude: number, longitude: number): string {
  if (latitude >= 49.9 && latitude <= 60.9 && longitude >= -8.2 && longitude <= 1.8) return "GB";
  if (latitude >= 34.55 && latitude <= 35.72 && longitude >= 32.2 && longitude <= 34.65) return "CY";
  if (latitude >= 34.8 && latitude <= 41.8 && longitude >= 19.3 && longitude <= 26.2) return "GR";
  if (latitude >= 35.8 && latitude <= 42.15 && longitude >= 25.6 && longitude <= 44.85) return "TR";
  return "OTHER";
}

export function officeCountryCode(office: OfficePinSource): string | null {
  const position = mapPinPosition(office.latitude, office.longitude);
  if (!position) return null;
  return countryFromFields(office) ?? countryFromCoordinates(position.latitude, position.longitude);
}

export function officeCountrySummary(
  offices: readonly OfficePinSource[] | null | undefined,
): OfficeCountrySummary | null {
  if (!offices || offices.length === 0) return null;
  const counts = new Map<string, number>();
  for (const office of offices) {
    const code = officeCountryCode(office);
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const countries = [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const rank = (code: string) => {
        const index = CHIP_ORDER.indexOf(code);
        return index === -1 ? CHIP_ORDER.length : index;
      };
      return rank(a.code) - rank(b.code) || a.code.localeCompare(b.code);
    });
  const officeCount = countries.reduce((sum, chip) => sum + chip.count, 0);
  return { officeCount, countries };
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
