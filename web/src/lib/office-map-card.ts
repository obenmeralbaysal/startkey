import type { MapOffice } from "./api.ts";
type PinPosition = (latitude: unknown, longitude: unknown) => { latitude: number; longitude: number } | null;

/** The office the desktop card shows: the selected one, otherwise the one nearest the map centre. */
export function officeForCard(
  offices: readonly MapOffice[],
  selectedId: number | null,
  center: { latitude: number; longitude: number } | null,
  /** mapPinPosition from map-coordinates; passed in so node --test needs no path alias. */
  mapPinPosition: PinPosition,
): MapOffice | null {
  if (selectedId !== null) {
    const picked = offices.find((office) => office.id === selectedId);
    if (picked) return picked;
  }
  let best: MapOffice | null = null;
  let bestDistance = Infinity;
  for (const office of offices) {
    const position = mapPinPosition(office.latitude, office.longitude);
    if (!position) continue;
    if (!center) return office;
    const dLat = position.latitude - center.latitude;
    const dLng = (position.longitude - center.longitude) * Math.cos((center.latitude * Math.PI) / 180);
    const distance = dLat * dLat + dLng * dLng;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = office;
    }
  }
  return best;
}

/** Same rule as the pin popup link: only site-relative paths. */
export function officeCardHref(office: MapOffice): string {
  return office.urlPath.startsWith("/") ? office.urlPath : "/";
}
