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
