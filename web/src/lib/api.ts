import { config } from "@/lib/config";
import type { Locale } from "@/lib/locales";

export interface ApiStat {
  icon: string;
  value: number;
  suffix: string;
  label: string;
}

export interface ApiProperty {
  externalId: number;
  urlPath: string;
  image: string;
  processType: string;
  adSubType: string;
  adType: string;
  price: string;
  title: string;
  location: string;
  rooms: string;
  area: string;
  detailLabel: string;
  has_watermarked_media?: boolean;
}

export interface ApiPopularCity {
  cityCode: string;
  image: string;
  name: string;
  urlPath: string;
}

export interface MapOffice {
  id: number;
  name: string;
  urlPath: string;
  latitude: number;
  longitude: number;
  locationNeedsReview?: boolean;
  /** Office card line; empty or missing when Reonix has no value. */
  city?: string;
  district?: string;
  /** People only; null when the consultant list could not be read. */
  consultantCount?: number | null;
}

export interface HomepageData {
  stats: ApiStat[];
  featuredProperties: ApiProperty[];
  popularCities: ApiPopularCity[];
  offices: MapOffice[];
}

/**
 * Homepage data served by the Laravel API. The CRM-sourced sections (statistics,
 * featured portfolio, popular cities) come from the backend; the page copy comes
 * from the localised content files.
 */
export async function fetchHomepageData(locale: Locale): Promise<HomepageData> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/homepage?locale=${locale}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Homepage API responded with ${response.status}`);
  }

  const payload = (await response.json()) as { data: HomepageData };
  return { ...payload.data, offices: payload.data.offices ?? [] };
}

/** Upcoming seminars, the first section of the public training list. */
export async function fetchUpcomingSeminarCount(locale: Locale): Promise<number> {
  const response = await fetch(`${config.apiBaseUrl}/api/v1/seminars/upcoming-count?locale=${locale}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Seminar count API responded with ${response.status}`);
  }

  const payload = (await response.json()) as { data: { count: number } };
  return payload.data.count;
}
