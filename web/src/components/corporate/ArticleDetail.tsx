import { BlogSidebar } from "@/components/corporate/BlogSidebar";
import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { Picture } from "@/components/corporate/Picture";
import type { CorporatePayload } from "@/lib/corporate";

function ShareLinks({ url, label }: { url: string; label: string }) {
  const encoded = encodeURIComponent(url);

  return (
    <div className="share-row">
      <span>{label}</span>
      <ul>
              <li>
                <a target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/share.php?u=${encoded}`}>
                  <i className="ri-facebook-fill" />
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://twitter.com/share?via=${encoded}&text=${encoded}`}
                >
                  <i className="ri-twitter-fill" />
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&summary=&source=${encoded}`}
                >
                  <i className="ri-linkedin-fill" />
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://web.whatsapp.com/send?text=${encoded}`}
                >
                  <i className="ri-whatsapp-fill" />
                </a>
              </li>
      </ul>
    </div>
  );
}

export function ArticleDetail({
  data,
  shareUrl,
}: {
  data: Extract<CorporatePayload, { kind: "article-detail" }>;
  shareUrl: string;
}) {
  const withSidebar = data.layout === "with-sidebar";

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="blog-details-wrap ptb-100">
        <div className="container">
          <div className="sk-split">
            <div className={withSidebar ? "sk-two-thirds" : "w-full"}>
              <article>
                {data.image ? (
                  <div className="post-img" style={withSidebar ? undefined : { textAlign: "center" }}>
                    <Picture width={800} height={478}>
                      {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                      <img src={data.image} alt={data.imageAlt || "Blog-photo"} width={800} height={478} />
                    </Picture>
                  </div>
                ) : null}
                <ul className="post-metainfo">
                  {data.dateLabel ? (
                    <li>
                      <i className="flaticon-calendar" />
                      {data.dateLabel}
                    </li>
                  ) : null}
                  {data.category ? (
                    <li>
                      <i className="flaticon-price-tag" />
                      {data.category}
                    </li>
                  ) : null}
                </ul>
                <h2>   {data.title}</h2>
                <div className="cms post-para" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
              </article>
              <ShareLinks url={shareUrl} label={data.shareLabel} />
            </div>
            {withSidebar && data.sidebar ? (
              <div className="sk-third">
                <BlogSidebar sidebar={data.sidebar} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
