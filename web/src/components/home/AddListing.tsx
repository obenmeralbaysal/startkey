import type { HomepageContent } from "@/content/types";

export function AddListing({ content }: { content: HomepageContent["addListing"] }) {
  return (
    <div className="add-listing-wrap">
      <div className="container-fluid px-0">
        <div className="row gx-0 ">
          <div className="col-md-6">
            <div
              className="add-listing-bg bg-f"
              style={{ backgroundImage: `url(/media/micrositecontent/${content.background})` }}
            />
          </div>
          <div className="col-md-6">
            <div className="listing-content ptb-100">
              <img
                src="/themes/fela/img/add-listing-shape.png"
                alt="Image"
                loading="lazy"
                className="add-listing-shape"
              />
              <div
                className="content-title"
                dangerouslySetInnerHTML={{ __html: content.contentHtml }}
              />
              <a className="btn style1" href={content.button.href}>
                {content.button.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
