import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackToTop } from "@/components/layout/BackToTop";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Preloader } from "@/components/layout/Preloader";
import { SeminarBar } from "@/components/layout/SeminarBar";
import { StructuredData } from "@/components/layout/StructuredData";
import { ThemeScripts } from "@/components/layout/ThemeScripts";
import { ThemeStyles } from "@/components/layout/ThemeStyles";
import { getHomepageContent } from "@/content/homepage";
import { isLocale, locales, type Locale } from "@/lib/locales";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * Only the head tags the reference website publishes for the requested language. The
 * German version, for example, has no description or Open Graph title, so none is
 * rendered here either.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return {};
  }
  const { meta } = getHomepageContent(lang);

  return {
    title: meta.title,
    description: meta.description ?? null,
    keywords: meta.keywords ?? null,
    robots: meta.robots ?? null,
    icons: meta.favicon
      ? { shortcut: [{ url: meta.favicon, type: "image/x-icon" }] }
      : null,
    openGraph: {
      title: meta.ogTitle ?? undefined,
      description: meta.ogDescription ?? undefined,
      images: meta.ogImage ? [meta.ogImage] : undefined,
    },
    twitter: {
      title: meta.twitterTitle ?? undefined,
      description: meta.twitterDescription ?? undefined,
      images: meta.twitterImage ? [meta.twitterImage] : undefined,
    },
    alternates: {
      languages: Object.fromEntries(
        meta.alternates.map(({ hreflang, href }) => [hreflang, href]),
      ),
    },
    other: meta.siteTitle ? { title: meta.siteTitle } : {},
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const locale = lang as Locale;
  const content = getHomepageContent(locale);

  return (
    <html lang={content.htmlLang}>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <StructuredData blocks={content.structuredData} />
        <ThemeStyles />
      </head>
      <body>
        <SeminarBar content={content.seminarBar} />
        <div className="page-wrapper">
          <Header content={content} locale={locale} />
          {children}
          <Footer content={content} />
        </div>
        <BackToTop />
        <Preloader />
        <ThemeScripts />
      </body>
    </html>
  );
}
