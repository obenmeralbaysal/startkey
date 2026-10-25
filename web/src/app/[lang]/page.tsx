import { notFound } from "next/navigation";

import { AboutBrand } from "@/components/home/AboutBrand";
import { AboutOwnOffice, AboutWhyFranchise } from "@/components/home/AboutFranchise";
import { AddListing } from "@/components/home/AddListing";
import { Counters } from "@/components/home/Counters";
import { Faq } from "@/components/home/Faq";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { HeroSearch } from "@/components/home/HeroSearch";
import { OfficeMapSection } from "@/components/home/OfficeMapSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Newsletter } from "@/components/home/Newsletter";
import { PopularCities } from "@/components/home/PopularCities";
import { VideoPromo } from "@/components/home/VideoPromo";
import { getHomepageContent } from "@/content/homepage";
import { fetchHomepageData } from "@/lib/api";
import { isLocale, type Locale } from "@/lib/locales";

/**
 * Rendered per request, like the reference website: the CRM-backed sections come from
 * the API rather than from a build-time snapshot. Repeated requests are served from
 * the fetch cache in `fetchHomepageData`.
 */
export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const locale = lang as Locale;
  const content = getHomepageContent(locale);
  const data = await fetchHomepageData(locale);

  return (
    <>
      <HeroSearch content={content.heroSearch} locale={locale} />
      <Counters stats={data.stats} />
      <OfficeMapSection offices={data.offices} />
      <FeaturedProperties
        titleHtml={content.featured.titleHtml}
        properties={data.featuredProperties}
      />
      <AboutBrand content={content.about1} />
      <AboutOwnOffice content={content.about2} />
      <AboutWhyFranchise content={content.about3} />
      <HowItWorks content={content.howItWorks} />
      <AddListing content={content.addListing} />
      <VideoPromo content={content.videoPromo} />
      <PopularCities content={content.cities} cities={data.popularCities} />
      <Faq content={content.faq} />
      <Newsletter content={content.newsletter} locale={locale} />
    </>
  );
}
