import { BlogSidebar } from "@/components/corporate/BlogSidebar";
import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { Picture } from "@/components/corporate/Picture";
import type { CorporatePayload } from "@/lib/corporate";

function ShareLinks({ url, label }: { url: string; label: string }) {
  const encoded = encodeURIComponent(url);

  return (
    <div className="[border:1px_solid_rgba(0,_0,_0,_0.09)] [padding:calc(20px_*_var(--sk-scale,_1))] [margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
      <div className="flex flex-wrap gap-x-0 items-center">
        <div className="w-full md:w-7/12" />
        <div className="w-full md:w-5/12 md:text-right text-left">
          <div className="inline-block w-full">
            <span>{label}</span>
            <ul className="[margin:calc(20px_*_var(--sk-scale,_1))_0_calc(20px_*_var(--sk-scale,_1))] [margin-top:calc(25px_*_var(--sk-scale,_1))] text-right max-md:text-center list-none">
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
        </div>
      </div>
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
  const articleColumn = withSidebar ? "col-xl-8 col-lg-12" : "col-xl-12 col-lg-12";

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="blog-details-wrap [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="container">
          <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))]">
            <div className={articleColumn}>
              <article>
                {data.image ? (
                  withSidebar ? (
                    <div className="relative [margin:0_0_calc(25px_*_var(--sk-scale,_1))] block max-md:[margin:0_0_calc(25px_*_var(--sk-scale,_1))]">
                      <Picture className="max-w-full h-auto" width={800} height={478}>
                        {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                        <img src={data.image} alt={data.imageAlt || "Blog-photo"} width={800} height={478} />
                      </Picture>
                    </div>
                  ) : (
                    <div className="relative [margin:0_0_calc(25px_*_var(--sk-scale,_1))] block max-md:[margin:0_0_calc(25px_*_var(--sk-scale,_1))]" style={{ textAlign: "center" }}>
                      <img src={data.image} alt={data.imageAlt || "startkey-news"} />
                    </div>
                  )
                ) : null}
                <ul className="[margin-bottom:calc(18px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(15px_*_var(--sk-scale,_1))] list-none">
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
              <div className="w-full xl:w-1/3">
                <BlogSidebar sidebar={data.sidebar} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
