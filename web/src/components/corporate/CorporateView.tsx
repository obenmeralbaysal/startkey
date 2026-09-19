import { ArticleDetail } from "@/components/corporate/ArticleDetail";
import { ArticleList } from "@/components/corporate/ArticleList";
import { ConsultantDetail } from "@/components/corporate/ConsultantDetail";
import { ConsultantList } from "@/components/corporate/ConsultantList";
import { ContactPage } from "@/components/corporate/ContactPage";
import { FranchisePage } from "@/components/corporate/FranchisePage";
import { OfficeDetail } from "@/components/corporate/OfficeDetail";
import { OfficeList } from "@/components/corporate/OfficeList";
import { PeopleList, PersonDetail } from "@/components/corporate/People";
import { PropertyDetail } from "@/components/corporate/PropertyDetail";
import { PropertyList } from "@/components/corporate/PropertyList";
import { ChampionsPage, CmsPage } from "@/components/corporate/StaticPages";
import { TrainingDetail } from "@/components/corporate/TrainingDetail";
import { TrainingList } from "@/components/corporate/TrainingList";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

export function CorporateView({
  data,
  shareUrl,
  locale,
}: {
  data: CorporatePayload;
  shareUrl: string;
  locale: Locale;
}) {
  if (data.kind === "contact") {
    return <ContactPage data={data} locale={locale} />;
  }

  let inner = null;
  switch (data.kind) {
    case "cms-page":
      inner = <CmsPage data={data} />;
      break;
    case "franchise":
      inner = <FranchisePage data={data} locale={locale} />;
      break;
    case "article-list":
      inner = <ArticleList data={data} />;
      break;
    case "article-detail":
      inner = <ArticleDetail data={data} shareUrl={shareUrl} />;
      break;
    case "people-list":
      inner = <PeopleList data={data} />;
      break;
    case "people-detail":
      inner = <PersonDetail data={data} />;
      break;
    case "champions":
      inner = <ChampionsPage data={data} />;
      break;
    case "training-list":
      inner = <TrainingList data={data} />;
      break;
    case "training-detail":
      inner = <TrainingDetail data={data} locale={locale} />;
      break;
    case "listing-list":
      inner = <PropertyList data={data} />;
      break;
    case "listing-detail":
      inner = <PropertyDetail data={data} locale={locale} />;
      break;
    case "office-list":
      inner = <OfficeList data={data} />;
      break;
    case "office-detail":
      inner = <OfficeDetail data={data} />;
      break;
    case "consultant-list":
      inner = <ConsultantList data={data} />;
      break;
    case "consultant-detail":
      inner = <ConsultantDetail data={data} locale={locale} />;
      break;
    default:
      inner = null;
  }

  // Inner pages sit in `.content-wrapper` (margin-top: 85px) so the fixed header
  // rests on the white body background at scroll 0 — the same stack as the reference.
  return <div className="content-wrapper">{inner}</div>;
}
