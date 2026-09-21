import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CorporateView } from "@/components/corporate/CorporateView";
import { fetchCorporatePage } from "@/lib/corporate";
import { isLocale, type Locale } from "@/lib/locales";

export const dynamic = "force-dynamic";

function publicPath(lang: string, segments: string[]): string {
  if (segments.length === 0) {
    return `/${lang}`;
  }
  return `/${lang}/${segments.join("/")}`;
}

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; path: string[] }>;
  searchParams: Promise<{ pageIndex?: string; searchText?: string } & Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { lang, path } = await params;
  const query = await searchParams;
  if (!isLocale(lang)) {
    return {};
  }

  const data = await fetchCorporatePage(
    lang,
    publicPath(lang, path),
    Number(query.pageIndex ?? 1) || 1,
    typeof query.searchText === "string" ? query.searchText : "",
    query,
  );
  if (!data) {
    return {};
  }

  const meta = data.meta ?? {};
  return {
    title: meta.title ?? data.breadcrumb.heading,
    description: meta.description ?? null,
    openGraph: {
      title: meta.ogTitle ?? meta.title ?? undefined,
      images: meta.ogImage ? [meta.ogImage] : undefined,
    },
    alternates: {
      languages: data.alternates,
    },
  };
}

export default async function CorporateCatchAll({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; path: string[] }>;
  searchParams: Promise<{ pageIndex?: string; searchText?: string } & Record<string, string | string[] | undefined>>;
}) {
  const { lang, path } = await params;
  const query = await searchParams;
  if (!isLocale(lang)) {
    notFound();
  }

  const locale = lang as Locale;
  const pathname = publicPath(locale, path);
  const data = await fetchCorporatePage(
    locale,
    pathname,
    Number(query.pageIndex ?? 1) || 1,
    typeof query.searchText === "string" ? query.searchText : "",
    query,
  );

  if (!data) {
    notFound();
  }

  const origin = await requestOrigin();
  const sharePath = "urlPath" in data && typeof data.urlPath === "string" ? data.urlPath : pathname;

  return <CorporateView data={data} shareUrl={`${origin}${sharePath}`} locale={locale} layout={query.layout} />;
}
