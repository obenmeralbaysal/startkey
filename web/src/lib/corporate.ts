import { rewriteBrandDeep } from "@/lib/brand";
import { config } from "@/lib/config";
import type { Locale } from "@/lib/locales";
import type { MapOffice } from "@/lib/api";

export interface CorporateBreadcrumb {
  heading: string;
  trail: { href: string | null; label: string }[];
}

export interface CorporateMeta {
  title?: string | null;
  description?: string | null;
  ogTitle?: string | null;
  ogImage?: string | null;
}

export interface ArticleCardData {
  externalId: number;
  urlPath: string;
  title: string;
  dateLabel: string;
  category: string;
  image: string;
  imageWebp: string;
  width: number | null;
  height: number | null;
  imageAlt: string;
}

export interface BlogSidebarData {
  searchPlaceholder: string;
  searchAction: string;
  popularHeading: string;
  popular: {
    urlPath: string;
    title: string;
    dateLabel: string;
    image: string;
    imageWebp: string;
  }[];
}

export type CorporatePayload =
  | {
      kind: "cms-page";
      key: string;
      heading: string;
      bodyHtml: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    }
  | {
      kind: "article-list";
      type: "news" | "announcement" | "blog";
      layout: "three-col" | "two-col-sidebar";
      heading: string;
      continueLabel: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      items: ArticleCardData[];
      pagination: {
        pageIndex: number;
        perPage: number;
        total: number;
        totalPages: number;
        basePath: string;
        searchText: string;
        searchQuery: string;
      };
      sidebar: BlogSidebarData | null;
      search: { action: string; placeholder: string; value: string } | null;
      alternates: Record<string, string>;
    }
  | {
      kind: "article-detail";
      type: "news" | "announcement" | "blog";
      layout: "wide" | "with-sidebar";
      imageAlt: string;
      externalId: number;
      urlPath: string;
      title: string;
      dateLabel: string;
      category: string;
      bodyHtml: string;
      image: string;
      imageWebp: string;
      shareLabel: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      sidebar: BlogSidebarData | null;
      continueLabel: string;
      alternates: Record<string, string>;
    }
  | {
      kind: "people-list";
      heading: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      people: {
        externalId: number;
        urlPath: string;
        name: string;
        role: string;
        email: string;
        phoneHref: string;
        phoneLabel: string;
        image: string;
        imageWebp: string;
      }[];
      alternates: Record<string, string>;
    }
  | {
      kind: "people-detail";
      externalId: number;
      urlPath: string;
      name: string;
      role: string;
      email: string;
      emailLabel: string;
      phoneHref: string;
      phoneLabel: string;
      phoneFieldLabel: string;
      bioHeading: string;
      bioHtml: string;
      image: string;
      imageWebp: string;
      social: { href: string; network: string }[];
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    }
  | {
      kind: "champions";
      heading: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      groups: { kicker: string; title: string; photos: string[] }[];
      alternates: Record<string, string>;
    }
  | {
      kind: "training-list";
      heading: string;
      detailLabel: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      sections: {
        group: string;
        heading: string;
        headingStyle: string;
        sectionStyle: string;
        items: {
          externalId: number;
          urlPath: string;
          detailUrlPath?: string;
          title: string;
          image: string;
          infoLines: { icon: string; text: string }[];
          detailLabel: string;
        }[];
      }[];
      alternates: Record<string, string>;
    }
  | {
      kind: "training-detail";
      externalId: number;
      group: string;
      urlPath: string;
      title: string;
      image: string;
      datePrefix: string;
      dateValue: string;
      timePrefix: string;
      timeValue: string;
      pricePrefix: string;
      priceValue: string;
      locationHeading: string;
      locationValue: string;
      descriptionHeading: string;
      descriptionHtml: string;
      formHeading: string;
      hasApplicationForm: boolean;
      form: {
        placeholders: { firstName?: string; lastName?: string; email?: string };
        required: Record<string, string>;
        genders: { value: number; label: string }[];
        submitLabel: string;
        captchaError: string;
        paymentHtml?: string;
      };
      relatedHeading: string;
      related: { externalId: number | null; urlPath: string; title: string; image: string }[];
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    }
  | {
      kind: "contact";
      key: string;
      heading: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      items: {
        icon: string;
        heading: string;
        html: string;
        itemStyle: string;
        infoStyle: string;
      }[];
      kicker: string;
      pageHeading: string;
      intro: string;
      hoursHeading: string;
      hours: { labelHtml: string; value: string }[];
      social: { href: string; icon: string }[];
      formTitle: string;
      placeholders: Record<string, string>;
      required: Record<string, string>;
      submitLabel: string;
      captchaError: string;
      mapHref: string;
      mapSrc: string;
      mapTitle: string;
      alternates: Record<string, string>;
    }
  | {
      kind: "consultant-application";
      key: string;
      heading: string;
      urlPath: string;
      formHeading: string;
      placeholders: Record<string, string>;
      required: Record<string, string>;
      positions: { value: string; label: string }[];
      submitLabel: string;
      captchaError: string;
      bodyHtml: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    }
  | {
      kind: "franchise";
      key: string;
      heading: string;
      urlPath: string;
      formHeading: string;
      placeholders: Record<string, string>;
      required: Record<string, string>;
      cities: { value: string; label: string }[];
      countyBindUrl: string;
      submitLabel: string;
      captchaError: string;
      widgetCss: string;
      bodyHtml: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    }
  | {
      kind: "listing-list";
      heading: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      filter: ListingFilterData;
      foundLabel: string;
      emptyLabel?: string;
      items: ListingCardData[];
      hasResults: boolean;
      pagination: {
        pageIndex: number;
        perPage: number;
        total: number;
        totalPages: number;
        basePath: string;
        searchQuery: string;
      };
      alternates: Record<string, string>;
    }
  | {
      kind: "listing-detail";
      externalId: number;
      urlPath: string;
      title: string;
      price: string;
      processType?: string;
      badges?: string[];
      gallery: ListingGallerySlide[];
      locationLinks: { href: string | null; label: string }[];
      specs: { label: string; value: string }[];
      descriptionHeading: string;
      descriptionHtml: string;
      eids: { heading: string; image: string; text: string } | null;
      featureGroups: { heading: string; items: string[] }[];
      map: {
        heading: string;
        latitude: string;
        longitude: string;
        iframeSrc: string;
        directionsLabel: string;
        streetViewLabel: string;
      };
      agent: ListingAgentData;
      form: {
        heading: string;
        placeholders: Record<string, string>;
        submitLabel: string;
        captchaError: string;
      };
      relatedHeading: string;
      related: ListingCardData[];
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    }
  | {
      kind: "office-list";
      heading: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      filter: DirectoryFilterData;
      foundLabel: string;
      emptyLabel?: string;
      emptySearchLabel?: string;
      items: DirectoryCardData[];
      hasResults: boolean;
      pagination: DirectoryPagination;
      alternates: Record<string, string>;
    }
  | {
      kind: "office-detail";
      externalId: number;
      urlPath: string;
      shortPath: string;
      name: string;
      image: string;
      imageWebp: string;
      phoneHref: string;
      phoneLabel: string;
      email: string;
      address: string;
      instagram: string;
      social?: { network: string; href: string }[];
      portfoliosHref: string;
      portfoliosLabel: string;
      tabs: { id: string; label: string }[];
      teamGroups: { heading: string; members: DirectoryCardData[] }[];
      listings: ListingCardData[];
      emptyListingsLabel?: string;
      seeAllHref?: string;
      seeAllLabel?: string;
      pin?: MapOffice | null;
      map: { query?: string; iframeSrc?: string; directionsLabel?: string; streetViewLabel?: string };
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    }
  | {
      kind: "consultant-list";
      heading: string;
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      filter: DirectoryFilterData;
      foundLabel: string;
      emptyLabel?: string;
      emptySearchLabel?: string;
      items: DirectoryCardData[];
      hasResults: boolean;
      pagination: DirectoryPagination;
      alternates: Record<string, string>;
    }
  | {
      kind: "consultant-detail";
      externalId: number;
      urlPath: string;
      name: string;
      role: string;
      image: string;
      imageWebp: string;
      email: string;
      phoneHref: string;
      phoneLabel: string;
      officeHref: string;
      officeName: string;
      contactLabels: { email: string; phone: string; office: string };
      tabs: { id: string; label: string }[];
      bioHtml: string;
      listings: ListingCardData[];
      allListingsHref: string;
      allListingsLabel: string;
      mineListingsHref?: string;
      mineListingsLabel?: string;
      emptyListingsLabel?: string;
      commentHeading: string;
      comments?: { firstName: string; lastName: string; date: string; text: string; rating: number | null }[];
      form: {
        placeholders: Record<string, string>;
        submitLabel: string;
        captchaError: string;
      };
      ratingLabel: string;
      rankBadges?: RankBadge[];
      breadcrumb: CorporateBreadcrumb;
      meta: CorporateMeta;
      alternates: Record<string, string>;
    };

export interface DirectoryPagination {
  pageIndex: number;
  perPage: number;
  total: number;
  totalPages: number;
  basePath: string;
  searchQuery: string;
}

export interface DirectoryPlace {
  city: string;
  districts: string[];
}

export interface DirectoryUi {
  searchLabel: string;
  placeholder: string;
  filterLabel: string;
  cityLabel: string;
  districtLabel: string;
  officeLabel: string;
  cityChoose: string;
  districtChoose: string;
  officeChoose: string;
  officeSearch: string;
  pageStatus: string;
  clearLabel: string;
  clearSearchLabel: string;
  emptySearchLabel: string;
  loadingLabel: string;
  closeLabel: string;
  chooseLabel: string;
}

export interface DirectoryFilterData {
  action: string;
  searchHeading: string;
  searchPlaceholder: string;
  submitLabel: string;
  placeholders: Record<string, string>;
  bindUrls: Record<string, string>;
  values: Record<string, string>;
  selectedLabels: Record<string, string>;
  places?: DirectoryPlace[];
  offices?: { id: string; name: string }[];
  ui?: DirectoryUi;
}

export interface RankBadge {
  year: number | null;
  category: "ciro" | "islem" | "club";
  label: string;
  rank: number | null;
  imageUrl: string;
}

export interface DirectoryCardData {
  externalId: number;
  urlPath: string;
  name: string;
  role?: string;
  image: string;
  imageWebp: string;
  phoneHref: string;
  phoneLabel: string;
  email: string;
  location?: string;
  instagram?: string;
  variant: "office" | "consultant";
  badges?: { title: string; period: string }[];
  rankBadges?: RankBadge[];
}

export interface ListingCardData {
  externalId: number;
  urlPath: string;
  image: string;
  imageWebp: string;
  processType: string;
  adSubType: string;
  adTypeIcon: string;
  adType: string;
  badgeImage: string;
  price: string;
  title: string;
  location: string;
  updatedLabel: string;
  features: { icon: string; text: string }[];
  detailLabel: string;
  style?: string;
  images?: string[];
}

export interface ListingGallerySlide {
  original: string;
  image: string;
  imageWebp: string;
  thumb: string;
  caption: string;
}

export interface ListingAgentData {
  name: string;
  href: string;
  consultantId?: string;
  consultantSlug?: string;
  image: string;
  imageWebp: string;
  officeName: string;
  officeHref: string;
  officeId?: string;
  officeSlug?: string;
  phones: { href: string; label: string; icon: string }[];
  emailHref: string;
  emailLabel: string;
  /** Omitted means the named consultant is shown. `false` keeps the office block. */
  approved?: boolean;
}

export interface ListingFilterData {
  action: string;
  heading: string;
  mobileOpenLabel: string;
  submitLabel: string;
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  adTypes: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
  bindUrls: Record<string, string>;
  values: Record<string, string | string[]>;
}

export async function fetchCorporatePage(
  locale: Locale,
  path: string,
  pageIndex = 1,
  searchText = "",
  extraQuery: Record<string, string | string[] | undefined> = {},
): Promise<CorporatePayload | null> {
  const params = new URLSearchParams({ locale, path });
  if (pageIndex > 1) {
    params.set("page", String(pageIndex));
    params.set("pageIndex", String(pageIndex));
  }
  if (searchText !== "") {
    params.set("searchText", searchText);
  }
  for (const [key, value] of Object.entries(extraQuery)) {
    if (key === "page" || key === "pageIndex" || key === "searchText" || key === "locale" || key === "path" || value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== "") {
          params.append(key, item);
        }
      }
    } else if (value !== "") {
      params.set(key, value);
    }
  }

  const response = await fetch(`${config.apiBaseUrl}/api/v1/corporate?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Corporate API responded with ${response.status}`);
  }

  const payload = (await response.json()) as { data: CorporatePayload };
  return rewriteBrandDeep(payload.data);
}

export async function fetchCorporateAlternate(path: string, locale: Locale): Promise<string> {
  const params = new URLSearchParams({ locale, path });
  const response = await fetch(`${config.apiBaseUrl}/api/v1/corporate/alternate?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    return `/${locale}`;
  }

  const payload = (await response.json()) as { data: { urlPath: string } };
  return payload.data.urlPath || `/${locale}`;
}
