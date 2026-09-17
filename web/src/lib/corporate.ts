import { rewriteBrandDeep } from "@/lib/brand";
import { config } from "@/lib/config";
import type { Locale } from "@/lib/locales";

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
    };

export async function fetchCorporatePage(
  locale: Locale,
  path: string,
  pageIndex = 1,
  searchText = "",
): Promise<CorporatePayload | null> {
  const params = new URLSearchParams({ locale, path });
  if (pageIndex > 1) {
    params.set("pageIndex", String(pageIndex));
  }
  if (searchText !== "") {
    params.set("searchText", searchText);
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
