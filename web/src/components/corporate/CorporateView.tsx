import { ArticleDetail } from "@/components/corporate/ArticleDetail";
import { ArticleList } from "@/components/corporate/ArticleList";
import { PeopleList, PersonDetail } from "@/components/corporate/People";
import { ChampionsPage, CmsPage } from "@/components/corporate/StaticPages";
import type { CorporatePayload } from "@/lib/corporate";

export function CorporateView({
  data,
  shareUrl,
}: {
  data: CorporatePayload;
  shareUrl: string;
}) {
  switch (data.kind) {
    case "cms-page":
      return <CmsPage data={data} />;
    case "article-list":
      return <ArticleList data={data} />;
    case "article-detail":
      return <ArticleDetail data={data} shareUrl={shareUrl} />;
    case "people-list":
      return <PeopleList data={data} />;
    case "people-detail":
      return <PersonDetail data={data} />;
    case "champions":
      return <ChampionsPage data={data} />;
    default:
      return null;
  }
}
